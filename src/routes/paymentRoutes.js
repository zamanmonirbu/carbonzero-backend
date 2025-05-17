const express = require("express");
const {processPayment,webhookPayment} = require("../controllers/PaymentController");

const router = express.Router();
router.post("/checkout", processPayment);
router.post("/webhook", express.raw({ type: "application/json" }), webhookPayment);


module.exports = router;
