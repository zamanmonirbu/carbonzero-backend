const express = require("express");
const router = express.Router();
const { blogStats, getBlogsCountByMonth, } = require("../controllers/statController.js");


router.route("/stats").get(blogStats);
router.route("/stats/blogs-by-month").get(getBlogsCountByMonth);

module.exports = router;
