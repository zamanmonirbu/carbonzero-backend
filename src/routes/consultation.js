const express = require("express");
const router = express.Router();
const { bookConsultation } = require("../controllers/consultationController");
const { userAuthMiddleware } = require("../middlewares/authMiddleware");

router.post("/booking",userAuthMiddleware, bookConsultation);

module.exports = router;
