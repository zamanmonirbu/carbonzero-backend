const express = require("express");
const { getNotificationsForUser, markNotificationAsRead, createNotification, getAllNotificationsByAdmins } = require("../controllers/notificationController");
const { userAuthMiddleware, adminAuthMiddleware, publicPrivateMiddleware, adminAndSuperAdmin } = require("../middlewares/authMiddleware");



const router = express.Router();

router.get("/", userAuthMiddleware, getNotificationsForUser);
router.get("/admin", adminAndSuperAdmin,getAllNotificationsByAdmins, );
router.put("/:notificationId", publicPrivateMiddleware, markNotificationAsRead);
router.post("/", adminAuthMiddleware, createNotification);

module.exports = router;
