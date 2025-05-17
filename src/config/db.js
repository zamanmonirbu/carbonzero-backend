const mongoose = require("mongoose");
const { dbUrl } = require(".");

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
