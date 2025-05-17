const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    companyLegalName: { type: String, required: true },
    role: { type: String, default: "User", enum: ["User", "Admin", "SuperAdmin","AddedBySuperAdmin"] },
    verificationCode: String,
    verificationCodeExpires: Date,
    isEntryComplete: { type: Boolean, default: false }, 
    hasActiveSubscription: { type: Boolean, default: false },
    subscriptionExpireDate: { type: Date, default: null }, 
    videoConsultation: { type: Boolean, default: false },
    profileImage: { type: String, default: "" },
    address: { type: String, default: "" },
    about: { type: String, default: "" },
    uniqueCode: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    isEmissionSubmitted: { type: Boolean, default: false },
    
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
