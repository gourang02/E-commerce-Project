const express = require("express");
const router = express.Router();

const {
  getDashboard, getAllOrders, updateOrderStatus,
  getUsers, toggleUserBlock,
  getPendingReviews, approveReview, deleteReview,
  createCoupon, getCoupons, deleteCoupon,
} = require("../controllers/admin.controller");
const {
  createProduct, updateProduct, deleteProduct,
  createCategory,
} = require("../controllers/product.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/admin.middleware");
const { uploadProductImages, uploadAvatar } = require("../middlewares/upload.middleware");

// All routes under /api/admin are protected
router.use(authenticate, requireRole("admin"));

// Dashboard
router.get("/dashboard", getDashboard);

// Orders
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Products
router.post("/products", uploadProductImages, createProduct);
router.put("/products/:id", uploadProductImages, updateProduct);
router.delete("/products/:id", deleteProduct);

// Categories
router.post("/categories", uploadAvatar, createCategory);

// Users
router.get("/users", getUsers);
router.put("/users/:id/toggle-block", toggleUserBlock);

// Reviews
router.get("/reviews/pending", getPendingReviews);
router.put("/reviews/:id/approve", approveReview);
router.delete("/reviews/:id", deleteReview);

// Coupons
router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.delete("/coupons/:id", deleteCoupon);

module.exports = router;
