const mongoose = require("mongoose");
const Product = require("../models/Product.model");
const Category = require("../models/Category.model");
const Review = require("../models/Review.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { cloudinary } = require("../config/cloudinary");

// ────────────────────────────────────────────────────────────────
// GET /api/products  — list with filters, sort, pagination, search
// ────────────────────────────────────────────────────────────────
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    brand,
    shape,
    color,
    gender,
    minPrice,
    maxPrice,
    sort = "createdAt",
    order = "desc",
    tag,
  } = req.query;

  const filter = { isActive: true };

  if (search) {
    filter.$text = { $search: search };
  }
  
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        // category slug doesn't exist, return empty results
        filter.category = new mongoose.Types.ObjectId();
      }
    }
  }
  if (brand) filter.brand = { $regex: brand, $options: "i" };
  if (shape) filter["frameDetails.shape"] = shape;
  if (gender) filter["frameDetails.gender"] = gender;
  if (color) filter["variants.color"] = { $regex: color, $options: "i" };
  if (tag) filter.tags = tag;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortOptions = { [sort]: order === "asc" ? 1 : -1 };
  const limitNum = Number(limit);
  let pageNum = Number(page);

  const total = await Product.countDocuments(filter);
  const pages = Math.ceil(total / limitNum) || 1;

  if (pageNum > pages && total > 0) {
    pageNum = 1;
  }

  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .populate("category", "name slug")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages,
      },
    }, "Products fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// GET /api/products/:slug  — product detail
// ────────────────────────────────────────────────────────────────
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate("category", "name slug")
    .lean();

  if (!product) throw new ApiError(404, "Product not found.");

  // Fetch approved reviews (paginated)
  const reviews = await Review.find({ product: product._id, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name avatar")
    .lean();

  // Related products (same category, different product)
  const related = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(6)
    .select("name slug price mrp discount ratingAvg variants")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { product, reviews, related }, "Product fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// GET /api/products/featured  — homepage featured sections
// ────────────────────────────────────────────────────────────────
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const [bestSellers, newArrivals, deals] = await Promise.all([
    Product.find({ isActive: true, tags: "bestseller" })
      .limit(8)
      .select("name slug price mrp discount ratingAvg variants brand")
      .lean(),
    Product.find({ isActive: true, tags: "new-arrival" })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("name slug price mrp discount ratingAvg variants brand")
      .lean(),
    Product.find({ isActive: true, tags: "deal-of-day" })
      .limit(4)
      .select("name slug price mrp discount ratingAvg variants brand")
      .lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { bestSellers, newArrivals, deals }, "Featured products fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// ADMIN: POST /api/admin/products
// ────────────────────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const images = (req.files || []).map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  const productData = { ...req.body };

  // Parse JSON strings sent via multipart/form-data
  if (typeof productData.variants === "string") productData.variants = JSON.parse(productData.variants);
  if (typeof productData.frameDetails === "string") productData.frameDetails = JSON.parse(productData.frameDetails);
  if (typeof productData.lensOptions === "string") productData.lensOptions = JSON.parse(productData.lensOptions);
  if (typeof productData.tags === "string") productData.tags = JSON.parse(productData.tags);

  // Assign images to first variant or as main images
  if (productData.variants && productData.variants.length > 0) {
    productData.variants[0].images = images;
  }

  const product = await Product.create(productData);
  return res.status(201).json(new ApiResponse(201, { product }, "Product created."));
});

// ────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/admin/products/:id
// ────────────────────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  const updates = { ...req.body };
  if (typeof updates.variants === "string") updates.variants = JSON.parse(updates.variants);
  if (typeof updates.frameDetails === "string") updates.frameDetails = JSON.parse(updates.frameDetails);
  if (typeof updates.lensOptions === "string") updates.lensOptions = JSON.parse(updates.lensOptions);
  if (typeof updates.tags === "string") updates.tags = JSON.parse(updates.tags);

  Object.assign(product, updates);
  await product.save();

  return res.status(200).json(new ApiResponse(200, { product }, "Product updated."));
});

// ────────────────────────────────────────────────────────────────
// ADMIN: DELETE /api/admin/products/:id
// ────────────────────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  // Delete all Cloudinary images
  for (const variant of product.variants) {
    for (const img of variant.images) {
      if (img.publicId) {
        await cloudinary.uploader.destroy(img.publicId).catch(console.error);
      }
    }
  }

  await product.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Product deleted."));
});

// ────────────────────────────────────────────────────────────────
// GET /api/categories
// ────────────────────────────────────────────────────────────────
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1 })
    .populate("parentCategory", "name slug")
    .lean();
  return res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched."));
});

// ────────────────────────────────────────────────────────────────
// ADMIN: POST /api/admin/categories
// ────────────────────────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const image = req.file ? { url: req.file.path, publicId: req.file.filename } : undefined;
  const category = await Category.create({ ...req.body, ...(image && { image }) });
  return res.status(201).json(new ApiResponse(201, { category }, "Category created."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/products/:id/reviews
// ────────────────────────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found.");

  const existing = await Review.findOne({ product: product._id, user: req.user._id });
  if (existing) throw new ApiError(409, "You have already reviewed this product.");

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    rating: Number(rating),
    title,
    comment,
    images,
  });

  return res.status(201).json(new ApiResponse(201, { review }, "Review submitted. Pending approval."));
});

module.exports = {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  addReview,
};
