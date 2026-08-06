const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out-for-delivery",
  "delivered",
  "cancelled",
  "return-requested",
  "returned",
  "refunded",
];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: mongoose.Schema.Types.ObjectId,
  name: String, // snapshot
  image: String, // snapshot
  color: String,
  lensOption: String,
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // price at time of order
  mrp: Number,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // e.g. RO-20240801-0001
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },

    paymentInfo: {
      method: { type: String, enum: ["cod", "online"], required: true },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
    },

    pricing: {
      subtotal: Number,
      discount: Number,
      couponDiscount: Number,
      deliveryCharge: Number,
      tax: Number,
      total: Number,
    },

    couponCode: String,
    deliveryOption: { type: String, enum: ["standard", "express"], default: "standard" },
    expectedDelivery: Date,

    orderStatus: { type: String, enum: ORDER_STATUSES, default: "placed" },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],

    trackingNumber: String,
    trackingUrl: String,

    invoiceUrl: String, // Cloudinary PDF URL
    prescriptionUrls: [String],

    cancelReason: String,
    returnReason: String,
    returnPickupDate: Date,
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre("save", async function () {
  if (this.isNew) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `RO-${today}-${String(count + 1).padStart(4, "0")}`;
    this.statusHistory.push({ status: "placed" });
  }
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
