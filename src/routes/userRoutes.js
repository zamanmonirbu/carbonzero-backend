const { Router } = require("express");
const {
  getAllUsers,
  getSingleUser,
  updateUserInfo,
  deleteUser,
  updateUserProfilePicture,
  searchUser,
  getAdminAndSuperAdmin,
} = require("../controllers/userController");
const { multerUpload } = require("../middlewares/multer");
const { userAuthMiddleware, publicPrivateMiddleware, adminAndSuperAdmin, superAdminAuthMiddleware } = require("../middlewares/authMiddleware");

const router = Router();
router.get("/profiles",adminAndSuperAdmin, getAllUsers);
router.get("/admin-superAdmin",superAdminAuthMiddleware, getAdminAndSuperAdmin);
router.get("/profile/search",publicPrivateMiddleware, searchUser);
router.get("/profile/:id",publicPrivateMiddleware, getSingleUser);
router.put("/profile",publicPrivateMiddleware, updateUserInfo);
router.put("/profile/image",publicPrivateMiddleware, multerUpload([
  { name: "profileImage", maxCount: 1 },
]), updateUserProfilePicture);

router.delete("/profile",userAuthMiddleware, deleteUser);

module.exports = router;

