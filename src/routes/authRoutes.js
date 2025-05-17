const express = require("express");
const { loginUser ,registerUser,forgetPassword,verifyCode,resetPassword,refreshToken, updatePassword, logoutUser,deleteUser} = require("../controllers/authController");
const resetPasswordLimiter = require("../utils/rate-limit");
const { adminAndSuperAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/user/register", registerUser);
router.post("/user/login", loginUser);
router.post("/user/logout", logoutUser);
router.delete("/user/delete",adminAndSuperAdmin, deleteUser);
router.post("/user/update-password", updatePassword);
router.post("/user/refresh",refreshToken);
router.post("/user/forget-password",resetPasswordLimiter, forgetPassword);
router.post("/user/verify-code",resetPasswordLimiter, verifyCode);
router.post("/user/reset-password",resetPasswordLimiter, resetPassword);

module.exports = router;


