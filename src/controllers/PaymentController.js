const {
  stripeSecretKey,
  frontendUrl,
  stripeWebhookSecret,
  adminMail,
} = require("../config");

const Consultation = require("../models/Consultation");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const User = require("../models/User");
const consultationMessageTemplate = require("../utils/ConsultationMessage");
const sendEmail = require("../utils/sendEmail");

const stripe = require("stripe")(stripeSecretKey);

// Create Checkout Session
exports.processPayment = async (req, res) => {
  const { subscriptionType, email, amount } = req.body;

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const parsedAmount = Math.round(Number(amount || 0));
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid payment amount.",
        data: null,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: subscriptionType || "Subscription",
              description: `Payment for ${subscriptionType || "a subscription plan"}`,
            },
            unit_amount: parsedAmount * 100,
          },
          quantity: 1,
        },
      ],
      
      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancel`,
      metadata: {
        userId: checkUser._id.toString(),
        subscriptionType,
        email,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Payment initiated successfully",
      data: { url: session.url },
    });
  } catch (error) {
    console.error("Stripe Checkout error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Stripe Webhook Handler
exports.webhookPayment = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  console.log(sig);

  if (!sig) {
    return res.status(400).json({
      status: false,
      message: "Missing stripe-signature header.",
      data: null,
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeWebhookSecret
    );


    // console.log("asdkufhasdkjlfsadlfsahl",req.body,
    //   sig,
    //   stripeWebhookSecret)


    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { subscriptionType, userId, email } = session.metadata;

      console.log("session", session.metadata);

      const payment = new Payment({
        user: userId,
        subscriptionType,
        amount: session.amount_total / 100,
        paymentDate: session.created * 1000,
      });


      // console.log(subscriptionType, userId, email,"payment",payment,session.amount_total)

      await payment.save();

      const userUpdate = User.findById(userId);

      if (subscriptionType === "Entry_fee") {
        const date = new Date();
        date.setMonth(
          date.getMonth() + (session.amount_total === 79900 ? 1 : 12)
        );

        await User.updateOne(
          { _id: userId },
          {
            $set: {
              isEntryComplete: true,
              hasActiveSubscription: true,
              subscriptionExpireDate: date,
            },
          }
        );

        // userUpdate.isEntryComplete = true;
        // userUpdate.hasActiveSubscription = true;
        // userUpdate.subscriptionExpireDate = date;

      } else if (subscriptionType === "Subscription_fee") {
        const lastPayment = await Payment.findOne({ user: userId }).sort({
          paymentDate: -1,
        });
        if (lastPayment) {
          const date = new Date(lastPayment.paymentDate);
          date.setMonth(
            date.getMonth() + (session.amount_total === 79900 ? 1 : 12)
          );

          await User.updateOne(
            { _id: userId },
            {
              $set: {
                hasActiveSubscription: true,
                subscriptionExpireDate: date,
              },
            }
          );

          // userUpdate.subscriptionExpireDate = date;
        }

      } else if (subscriptionType === "Consultation") {
        const succesUser=await User.findByIdAndUpdate(userId, {
           videoConsultation: false 
        });
        
        console.log(succesUser)

        const findConsultation = await Consultation.findOne({ email }).sort({
          createdAt: -1,
        });

        if (findConsultation) {
          const htmlMessage = consultationMessageTemplate(findConsultation);
          await sendEmail({
            to: adminMail,
            subject: `Consultation Booking from ${findConsultation.name}`,
            html: htmlMessage,
          });

        }
      }

      const userFound = await User.findById(userId);
      if (userFound) {
        const notification = new Notification({
          message: `Payment has been made by ${userFound.fullName}`,
          user: userId,
        });
        await notification.save();
      }
    }

    return res.status(200).json({
      status: true,
      message: "Payment received successfully",
      data: null,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).json({
      status: false,
      message: "Webhook verification failed.",
      data: err.message,
    });
  }
};
