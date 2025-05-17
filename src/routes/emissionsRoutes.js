const express = require("express");
const router = express.Router();
const emissionsController = require("../controllers/emissionsController");

const {
  adminAuthMiddleware,
  publicPrivateMiddleware,
  userAuthMiddleware,
  getLatestCarbonEmissionsPerYear,
} = require("../middlewares/authMiddleware");

const { multerUpload } = require("../middlewares/multer");

router.get("/", adminAuthMiddleware, emissionsController.getAllEmissions);
router.get("/by-user/:id",publicPrivateMiddleware,emissionsController.getEmissionsByUserId);
router.get("/by-month/:id",publicPrivateMiddleware,emissionsController.getMonthlyEmissionsByUserId);
router.get("/per-year/:userId",emissionsController.getLatestCarbonEmissionsPerYear);
router.get("/:id",publicPrivateMiddleware,emissionsController.getEmissionsById);
router.post("/:user_id",publicPrivateMiddleware,multerUpload([{ name: "financial_statements", maxCount: 5 }]),emissionsController.createEmissions);
router.delete("/:id", userAuthMiddleware, emissionsController.deleteEmissions);



module.exports = router;
