const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    user: { type: String, require: true },
    subscriptionType: {
      type: String,
      enum: ["Entry_fee", "Subscription_fee", "Consultation","Free"],
    },
    amount: { type: Number, enum: [799, 1841, 110, 1152, 350,0] },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PaymentSchema.index({ paymentDate: 1 });

module.exports = mongoose.model("Payment", PaymentSchema);
