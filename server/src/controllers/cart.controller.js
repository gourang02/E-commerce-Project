const Cart = require("../models/Cart.model");
const Product = require("../models/Product.model");
const Coupon = require("../models/Coupon.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// Helper: get cart by user or sessionId
const findCart = async (userId, sessionId) => {
  if (userId) return Cart.findOne({ user: userId });
  if (sessionId) return Cart.findOne({ sessionId });
  return null;
};

// Helper: populate and return cart with totals
const buildCartResponse = async (cart) => {
  await cart.populate({
    path: "items.product",
    select: "name slug price mrp discount variants isActive",
  });

  let subtotal = 0;
  let mrpTotal = 0;
  const validItems = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) continue;

    const variant = product.variants.id
      ? product.variants.id(item.variantId)
      : product.variants.find((v) => v._id.toString() === item.variantId.toString());

    if (!variant || variant.stock < 1) continue;

    subtotal += product.price * item.qty;
    mrpTotal += product.mrp * item.qty;
    validItems.push({
      ...item.toObject(),
      currentPrice: product.price,
      inStock: variant ? variant.stock : 0,
    });
  }

  const productDiscount = mrpTotal - subtotal;
  const deliveryCharge = subtotal > 500 ? 0 : 49;
  const tax = Math.round(subtotal * 0.05); // 5% GST placeholder
  const total = subtotal + deliveryCharge + tax - (cart.couponDiscount || 0);

  return {
    _id: cart._id,
    items: validItems,
    couponCode: cart.couponCode,
    pricing: {
      subtotal: Math.round(subtotal),
      mrpTotal: Math.round(mrpTotal),
      productDiscount: Math.round(productDiscount),
      couponDiscount: cart.couponDiscount || 0,
      deliveryCharge,
      tax,
      total: Math.max(0, Math.round(total)),
    },
  };
};

// ────────────────────────────────────────────────────────────────
// GET /api/cart
// ────────────────────────────────────────────────────────────────
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  let cart = await findCart(userId, sessionId);
  if (!cart) {
    return res.status(200).json(new ApiResponse(200, { cart: null, items: [], pricing: {} }, "Cart is empty."));
  }

  const cartData = await buildCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: cartData }, "Cart fetched."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/cart/add
// ────────────────────────────────────────────────────────────────
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, qty = 1, lensOption } = req.body;
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found.");

  const variant = product.variants.find((v) => v._id.toString() === variantId);
  if (!variant) throw new ApiError(404, "Product variant not found.");
  if (variant.stock < qty) throw new ApiError(400, `Only ${variant.stock} item(s) left in stock.`);

  let cart = await findCart(userId, sessionId);
  if (!cart) {
    cart = new Cart({ user: userId || null, sessionId: userId ? null : sessionId });
  }

  const existingItem = cart.items.find(
    (i) => i.product.toString() === productId && i.variantId.toString() === variantId
  );

  if (existingItem) {
    const newQty = existingItem.qty + qty;
    if (newQty > variant.stock) throw new ApiError(400, `Only ${variant.stock} available.`);
    existingItem.qty = newQty;
  } else {
    cart.items.push({ product: productId, variantId, qty, lensOption, priceAtAdd: product.price });
  }

  await cart.save();
  const cartData = await buildCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: cartData }, "Item added to cart."));
});

// ────────────────────────────────────────────────────────────────
// PUT /api/cart/update/:itemId
// ────────────────────────────────────────────────────────────────
const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  const cart = await findCart(userId, sessionId);
  if (!cart) throw new ApiError(404, "Cart not found.");

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, "Item not found in cart.");

  if (qty <= 0) {
    cart.items.pull(req.params.itemId);
  } else {
    item.qty = qty;
  }

  await cart.save();
  const cartData = await buildCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: cartData }, "Cart updated."));
});

// ────────────────────────────────────────────────────────────────
// DELETE /api/cart/remove/:itemId
// ────────────────────────────────────────────────────────────────
const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  const cart = await findCart(userId, sessionId);
  if (!cart) throw new ApiError(404, "Cart not found.");

  cart.items.pull(req.params.itemId);
  await cart.save();

  const cartData = await buildCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: cartData }, "Item removed from cart."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/cart/coupon  — apply coupon
// ────────────────────────────────────────────────────────────────
const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  const cart = await findCart(userId, sessionId);
  if (!cart) throw new ApiError(404, "Cart not found.");

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(404, "Invalid coupon code.");
  if (new Date() > coupon.expiryDate) throw new ApiError(400, "This coupon has expired.");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "This coupon has reached its usage limit.");
  }

  // Check per-user limit
  if (userId && coupon.usedBy.includes(userId.toString())) {
    throw new ApiError(400, "You have already used this coupon.");
  }

  // Calculate subtotal to check min order value
  const subtotal = cart.items.reduce((sum, item) => sum + (item.priceAtAdd || 0) * item.qty, 0);
  if (subtotal < coupon.minOrderValue) {
    throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`);
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }

  cart.couponCode = coupon.code;
  cart.couponDiscount = Math.round(discount);
  await cart.save();

  const cartData = await buildCartResponse(cart);
  return res.status(200).json(
    new ApiResponse(200, { cart: cartData }, `Coupon applied! You save ₹${Math.round(discount)}.`)
  );
});

// ────────────────────────────────────────────────────────────────
// DELETE /api/cart/coupon  — remove coupon
// ────────────────────────────────────────────────────────────────
const removeCoupon = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const sessionId = req.headers["x-session-id"];

  const cart = await findCart(userId, sessionId);
  if (!cart) throw new ApiError(404, "Cart not found.");

  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  const cartData = await buildCartResponse(cart);
  return res.status(200).json(new ApiResponse(200, { cart: cartData }, "Coupon removed."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/cart/merge  — merge guest cart into user cart on login
// ────────────────────────────────────────────────────────────────
const mergeCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user._id;

  const guestCart = await Cart.findOne({ sessionId });
  if (!guestCart || guestCart.items.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, "No guest cart to merge."));
  }

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    guestCart.user = userId;
    guestCart.sessionId = null;
    await guestCart.save();
    return res.status(200).json(new ApiResponse(200, {}, "Cart merged."));
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (i) =>
        i.product.toString() === guestItem.product.toString() &&
        i.variantId.toString() === guestItem.variantId.toString()
    );
    if (existing) {
      existing.qty += guestItem.qty;
    } else {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save();
  await guestCart.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, "Cart merged successfully."));
});

// ────────────────────────────────────────────────────────────────
// Wishlist
// ────────────────────────────────────────────────────────────────
const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const user = req.user;

  const idx = user.wishlist.findIndex((id) => id.toString() === productId);
  let action;

  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    action = "removed";
  } else {
    user.wishlist.push(productId);
    action = "added";
  }

  await user.save({ validateBeforeSave: false });
  return res.status(200).json(
    new ApiResponse(200, { wishlist: user.wishlist }, `Product ${action} to wishlist.`)
  );
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, applyCoupon, removeCoupon, mergeCart, toggleWishlist };
