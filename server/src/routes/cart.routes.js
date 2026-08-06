const express = require("express");
const router = express.Router();

const {
  getCart, addToCart, updateCartItem, removeFromCart,
  applyCoupon, removeCoupon, mergeCart, toggleWishlist,
} = require("../controllers/cart.controller");

const { authenticate, optionalAuth } = require("../middlewares/auth.middleware");

// Cart — works for guests (optionalAuth) and logged-in users
router.get("/", optionalAuth, getCart);
router.post("/add", optionalAuth, addToCart);
router.put("/update/:itemId", optionalAuth, updateCartItem);
router.delete("/remove/:itemId", optionalAuth, removeFromCart);

// Coupons
router.post("/coupon", optionalAuth, applyCoupon);
router.delete("/coupon", optionalAuth, removeCoupon);

// Merge guest cart on login
router.post("/merge", authenticate, mergeCart);

// Wishlist
router.post("/wishlist/toggle", authenticate, toggleWishlist);

module.exports = router;
