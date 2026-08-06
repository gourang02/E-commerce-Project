const express = require("express");
const router = express.Router();

const {
  getProducts, getProductBySlug, getFeaturedProducts,
  createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, addReview,
} = require("../controllers/product.controller");

const { authenticate, optionalAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/admin.middleware");
const { uploadProductImages, uploadAvatar } = require("../middlewares/upload.middleware");

// ── Public routes ────────────────────────────────────────────────
router.get("/products", getProducts);
router.get("/products/featured", getFeaturedProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/categories", getCategories);

// ── Review (auth required) ───────────────────────────────────────
router.post("/products/:id/reviews", authenticate, uploadProductImages, addReview);

// ── Admin routes ─────────────────────────────────────────────────
router.post("/admin/products", authenticate, requireRole("admin"), uploadProductImages, createProduct);
router.put("/admin/products/:id", authenticate, requireRole("admin"), uploadProductImages, updateProduct);
router.delete("/admin/products/:id", authenticate, requireRole("admin"), deleteProduct);

router.post("/admin/categories", authenticate, requireRole("admin"), uploadAvatar, createCategory);

module.exports = router;
