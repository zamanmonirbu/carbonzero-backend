const express = require("express");
const {
    getTotalCustomers,
    getTotalRevenue,
    getTotalSubscriptions,
    getDashboardStats, 
    getUserGrowth, 
    getCarbonFootprint,
    getSubscriptions,
    updateSubscription,
    deleteSubscription,
    getPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment,
    checkSubscription,
    getPaymentsTwelveMonth,
    getRevenueGrowth,
    getSubscriptionById
} = require("../controllers/dashboardController.js");
const { adminAndSuperAdmin, userAuthMiddleware } = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Admin Dashboard Endpoints
router.get("/revenue-growth",adminAndSuperAdmin, getRevenueGrowth); // Revenue Growth Statistics Route
router.get("/payment-by-month", getPaymentsTwelveMonth);
router.get("/user-growth",adminAndSuperAdmin, getUserGrowth); // User Growth Statistics Route

router.get("/total-customers",adminAndSuperAdmin, getTotalCustomers); // Total Customers Statistics Route
router.get("/total-revenue",adminAndSuperAdmin, getTotalRevenue); // Total Revenue Statistics Route
router.get("/total-subscriptions",adminAndSuperAdmin, getTotalSubscriptions); // Total Subscriptions Statistics Route

// Route to get dashboard statistics
router.get("/stats", getDashboardStats);
// Route to get user growth data

// Carbon Footprint Route
router.get("/carbon-footprint", getCarbonFootprint);

router.get("/get-subscriptions", getSubscriptions); // Get All Subscriptions
router.get("/check-subscription/:id", checkSubscription); // Check Subscription if expired or not
router.get("/:id",userAuthMiddleware, getSubscriptionById); // Get Subscription by ID
router.put("/update/:id", updateSubscription); // Update Subscription
router.delete("/delete/:id", deleteSubscription); // Delete Subscription

router.get("/payments", getPayments); // Get filtered payments
router.get("/payments/:id", getPaymentById); // Get payment by ID
router.put("/payments/:id/status", updatePaymentStatus); // Update payment status
router.delete("/payments/:id", deletePayment); // Delete payment


module.exports = router;

