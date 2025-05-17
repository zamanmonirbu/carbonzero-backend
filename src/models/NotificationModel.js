const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);