const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true }, // which color/variant
  qty: { type: Number, required: true, min: 1, default: 1 },
  lensOption: {
    type: String,
    enum: ["single-vision", "bifocal", "progressive", "blue-cut", "photochromic", "polarized", "clear", null],
    default: null,
  },
  prescriptionUrl: String, // Cloudinary URL if user uploads prescription
  priceAtAdd: Number, // snapshot price when added (avoid price change surprises)
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = guest
    sessionId: { type: String, default: null }, // guest cart identifier
    items: [cartItemSchema],
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index to quickly find user's cart or guest cart
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Cart", cartSchema);
