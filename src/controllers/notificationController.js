const Notification = require("../models/Notification");

// Controller to create a new notification
const createNotification = async (req, res) => {
  try {
    const { message, userId } = req.body;
    const notification = new Notification({
      message,
      user: userId,
    });

    const savedNotification = await notification.save();
    return res.status(201).json({
      status: true,
      message: "Notification created successfully",
      data: savedNotification,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};

// Controller to get all notifications for a user
const getNotificationsForUser = async (req, res) => {
  try {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);


    const totalNotifications = await Notification.countDocuments({ user: id });
    const totalPages = Math.ceil(totalNotifications / limit);

    return res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};

// Controller to get all notifications for admin
const getAllNotificationsByAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments();
    const totalPages = Math.ceil(totalNotifications / limit);

    return res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};


const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.user;
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ status: false, message: "Notification not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getAllNotificationsByAdmins,
  getNotificationsForUser,
  markNotificationAsRead,
};

