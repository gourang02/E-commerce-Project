const User = require("../models/User.model");
const Product = require("../models/Product.model");
const Order = require("../models/Order.model");
const Review = require("../models/Review.model");
const Coupon = require("../models/Coupon.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
// ────────────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    totalRevenue,
    todayRevenue,
    totalUsers,
    lowStockProducts,
    recentOrders,
  ] = await Promise.all([
    Order.countDocuments({ orderStatus: { $nin: ["cancelled"] } }),
    Order.countDocuments({ createdAt: { $gte: today }, orderStatus: { $nin: ["cancelled"] } }),
    Order.aggregate([
      { $match: { orderStatus: { $nin: ["cancelled"] } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, orderStatus: { $nin: ["cancelled"] } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    User.countDocuments({ role: "customer" }),
    Product.find({ "variants.stock": { $lte: 5 } })
      .select("name variants brand")
      .limit(10)
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .lean(),
  ]);

  // Revenue by day (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const revenueChart = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, orderStatus: { $nin: ["cancelled"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalUsers,
      },
      lowStockProducts,
      recentOrders,
      revenueChart,
    }, "Dashboard data fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// GET /api/admin/orders  — all orders with filters
// ────────────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) filter.orderNumber = { $regex: search, $options: "i" };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("user", "name email phone")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Orders fetched.")
  );
});

// ────────────────────────────────────────────────────────────────
// PUT /api/admin/orders/:id/status
// ────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");

  const validStatuses = ["confirmed", "packed", "shipped", "out-for-delivery", "delivered", "cancelled", "returned", "refunded"];
  if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status.");

  order.orderStatus = status;
  order.statusHistory.push({ status, timestamp: new Date(), note: note || "" });
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;

  await order.save();
  return res.status(200).json(new ApiResponse(200, { order }, "Order status updated."));
});

// ────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ────────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = { role: "customer" };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, { users, total }, "Users fetched."));
});

// ────────────────────────────────────────────────────────────────
// PUT /api/admin/users/:id/toggle-block
// ────────────────────────────────────────────────────────────────
const toggleUserBlock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  user.isActive = !user.isActive;
  await user.save();
  return res.status(200).json(
    new ApiResponse(200, { isActive: user.isActive }, `User ${user.isActive ? "unblocked" : "blocked"}.`)
  );
});

// ────────────────────────────────────────────────────────────────
// Reviews moderation
// ────────────────────────────────────────────────────────────────
const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isApproved: false })
    .populate("user", "name")
    .populate("product", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { reviews }, "Pending reviews fetched."));
});

const approveReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!review) throw new ApiError(404, "Review not found.");
  return res.status(200).json(new ApiResponse(200, { review }, "Review approved."));
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new ApiError(404, "Review not found.");
  return res.status(200).json(new ApiResponse(200, {}, "Review deleted."));
});

// ────────────────────────────────────────────────────────────────
// Coupon management
// ────────────────────────────────────────────────────────────────
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse(201, { coupon }, "Coupon created."));
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { coupons }, "Coupons fetched."));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Coupon deleted."));
});

module.exports = {
  getDashboard,
  getAllOrders,
  updateOrderStatus,
  getUsers,
  toggleUserBlock,
  getPendingReviews,
  approveReview,
  deleteReview,
  createCoupon,
  getCoupons,
  deleteCoupon,
};
