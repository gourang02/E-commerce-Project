const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");
const Coupon = require("../models/Coupon.model");
const { sendEmail, orderConfirmationEmail } = require("../utils/sendEmail");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const crypto = require("crypto");

// Razorpay instance (lazy init when keys available)
let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    const Razorpay = require("razorpay");
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// ────────────────────────────────────────────────────────────────
// POST /api/orders/create  — create Razorpay order or COD order
// ────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddressId, paymentMethod, deliveryOption = "standard", couponCode } = req.body;
  const userId = req.user._id;

  // 1. Get cart
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price mrp variants isActive",
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty.");
  }

  // 2. Validate stock and build order items
  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product?.isActive) throw new ApiError(400, `Product "${product?.name}" is no longer available.`);

    const variant = product.variants.find((v) => v._id.toString() === item.variantId.toString());
    if (!variant || variant.stock < item.qty) {
      throw new ApiError(400, `Insufficient stock for "${product.name}".`);
    }

    orderItems.push({
      product: product._id,
      variantId: item.variantId,
      name: product.name,
      image: variant.images?.[0]?.url || "",
      color: variant.color,
      lensOption: item.lensOption,
      qty: item.qty,
      price: product.price,
      mrp: product.mrp,
    });

    subtotal += product.price * item.qty;
  }

  // 3. Pricing
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
    if (coupon && new Date() < coupon.expiryDate) {
      couponDiscount = coupon.type === "percentage"
        ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : coupon.value;
    }
  }

  const deliveryCharge = subtotal > 500 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05);
  const total = Math.max(0, Math.round(subtotal + deliveryCharge + tax - couponDiscount));

  // 4. COD limit check
  if (paymentMethod === "cod" && total > 5000) {
    throw new ApiError(400, "Cash on Delivery is not available for orders above ₹5,000.");
  }

  // 5. Get shipping address
  const user = await require("../models/User.model").findById(userId);
  const address = user.addresses.id(shippingAddressId) || user.addresses.find((a) => a.isDefault);
  if (!address) throw new ApiError(400, "Please add a delivery address.");

  const expectedDelivery = new Date();
  expectedDelivery.setDate(expectedDelivery.getDate() + (deliveryOption === "express" ? 2 : 5));

  // 6. For online payment: create Razorpay order first
  if (paymentMethod === "online") {
    if (!process.env.RAZORPAY_KEY_ID) {
      throw new ApiError(503, "Payment gateway not configured. Please use COD.");
    }

    const rzpOrder = await getRazorpay().orders.create({
      amount: total * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Save order with "pending" payment status
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress: address.toObject(),
      paymentInfo: { method: "online", status: "pending", razorpayOrderId: rzpOrder.id },
      pricing: {
        subtotal: Math.round(subtotal),
        discount: Math.round(subtotal - subtotal), // product-level not used here
        couponDiscount: Math.round(couponDiscount),
        deliveryCharge,
        tax,
        total,
      },
      couponCode,
      deliveryOption,
      expectedDelivery,
      orderStatus: "placed",
    });

    return res.status(201).json(
      new ApiResponse(201, {
        order,
        razorpayOrderId: rzpOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
      }, "Razorpay order created. Proceed to payment.")
    );
  }

  // 7. COD order
  const order = await Order.create({
    user: userId,
    items: orderItems,
    shippingAddress: address.toObject(),
    paymentInfo: { method: "cod", status: "pending" },
    pricing: { subtotal: Math.round(subtotal), couponDiscount: Math.round(couponDiscount), deliveryCharge, tax, total },
    couponCode,
    deliveryOption,
    expectedDelivery,
    orderStatus: "placed",
  });

  // Deduct stock
  await deductStock(orderItems);

  // Clear cart
  await Cart.findOneAndDelete({ user: userId });

  // Increment coupon usage
  if (couponCode) {
    await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 }, $push: { usedBy: userId } });
  }

  // Send confirmation email
  sendEmail(orderConfirmationEmail(order, req.user)).catch(console.error);

  return res.status(201).json(new ApiResponse(201, { order }, "Order placed successfully!"));
});

// ────────────────────────────────────────────────────────────────
// POST /api/orders/verify-payment  — verify Razorpay signature
// ────────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Security: verify signature on backend (NEVER trust frontend)
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    throw new ApiError(400, "Payment verification failed. Invalid signature.");
  }

  // Update order
  const order = await Order.findOneAndUpdate(
    { "paymentInfo.razorpayOrderId": razorpayOrderId },
    {
      "paymentInfo.status": "paid",
      "paymentInfo.razorpayPaymentId": razorpayPaymentId,
      "paymentInfo.razorpaySignature": razorpaySignature,
      "paymentInfo.paidAt": new Date(),
      orderStatus: "confirmed",
      $push: { statusHistory: { status: "confirmed", timestamp: new Date(), note: "Payment received." } },
    },
    { new: true }
  );

  if (!order) throw new ApiError(404, "Order not found.");

  // Deduct stock & clear cart
  await deductStock(order.items);
  await Cart.findOneAndDelete({ user: order.user });

  // Increment coupon usage
  if (order.couponCode) {
    await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usedCount: 1 }, $push: { usedBy: order.user } });
  }

  sendEmail(orderConfirmationEmail(order, req.user)).catch(console.error);

  return res.status(200).json(new ApiResponse(200, { order }, "Payment verified. Order confirmed!"));
});

// ────────────────────────────────────────────────────────────────
// GET /api/orders  — my orders
// ────────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("orderNumber orderStatus pricing.total paymentInfo createdAt expectedDelivery items")
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Orders fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// ────────────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) throw new ApiError(404, "Order not found.");
  return res.status(200).json(new ApiResponse(200, { order }, "Order fetched."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/orders/:id/cancel
// ────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found.");

  const cancellable = ["placed", "confirmed", "packed"];
  if (!cancellable.includes(order.orderStatus)) {
    throw new ApiError(400, "Order cannot be cancelled at this stage.");
  }

  order.orderStatus = "cancelled";
  order.cancelReason = reason;
  order.statusHistory.push({ status: "cancelled", timestamp: new Date(), note: reason });

  // Restore stock
  await restoreStock(order.items);
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order }, "Order cancelled successfully."));
});

// ────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────
const deductStock = async (items) => {
  for (const item of items) {
    await Product.findOneAndUpdate(
      { _id: item.product, "variants._id": item.variantId },
      {
        $inc: { "variants.$.stock": -item.qty, soldCount: item.qty },
      }
    );
  }
};

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findOneAndUpdate(
      { _id: item.product, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": item.qty, soldCount: -item.qty } }
    );
  }
};

module.exports = { createOrder, verifyPayment, getMyOrders, getOrderById, cancelOrder };
