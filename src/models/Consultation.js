const mongoose = require("mongoose");

const ConsultationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone_number: { type: String, required: true },
  business_nature: { type: String, required: true },
  biggest_challenge: { type: String, required: true },
  best_time_to_call: { type: String, required: true },
  bookingType: { type: String, enum: ["free", "paid"], default: "free" },
}, { timestamps: true });

module.exports = mongoose.model("Consultation", ConsultationSchema);

