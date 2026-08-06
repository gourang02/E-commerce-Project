const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorCode: { type: String, default: "#000000" }, // hex for color swatch UI
  images: [
    {
      url: { type: String, required: true },
      publicId: String,
      alt: String,
    },
  ],
  stock: { type: Number, required: true, default: 0, min: 0 },
  sku: { type: String, unique: true, sparse: true },
});

const frameDetailsSchema = new mongoose.Schema({
  shape: {
    type: String,
    enum: ["round", "square", "rectangle", "aviator", "cat-eye", "wayfarer", "oval", "geometric", "sport", "other"],
  },
  material: {
    type: String,
    enum: ["metal", "acetate", "tr90", "titanium", "stainless-steel", "wood", "other"],
  },
  size: { type: String, enum: ["xs", "s", "m", "l", "xl"] },
  lensWidth: Number, // mm
  bridgeWidth: Number, // mm
  templeLength: Number, // mm
  weight: Number, // grams
  gender: { type: String, enum: ["men", "women", "kids", "unisex"], default: "unisex" },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: String },
    brand: { type: String, required: true, trim: true },

    variants: [variantSchema],
    frameDetails: frameDetailsSchema,

    lensOptions: [
      {
        type: String,
        enum: ["single-vision", "bifocal", "progressive", "blue-cut", "photochromic", "polarized", "clear"],
      },
    ],

    price: { type: Number, required: true, min: 0 }, // selling price
    mrp: { type: Number, required: true, min: 0 }, // original price (crossed out)
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage

    tags: [String], // "new-arrival", "bestseller", "deal-of-day", "featured"
    isActive: { type: Boolean, default: true },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // Populated virtually from Review collection
    soldCount: { type: Number, default: 0 }, // for popularity sort
  },
  { timestamps: true }
);

// Auto-calculate discount if not provided
productSchema.pre("save", function (next) {
  if (this.mrp > 0 && this.price >= 0) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

// Index for search and filtering
productSchema.index({ name: "text", brand: "text", description: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratingAvg: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
