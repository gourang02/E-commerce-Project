const express = require("express");
const router = express.Router();

const {
  createOrder, verifyPayment, getMyOrders, getOrderById, cancelOrder,
} = require("../controllers/order.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate); // All order routes require authentication

router.post("/create", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelOrder);

module.exports = router;
