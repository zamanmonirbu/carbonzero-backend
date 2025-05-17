const nodemailer = require("nodemailer");
// const validator = require("validator");
const {
  emailHost,
  emailPort,
  emailAddress,
  emailPass,
  emailFrom,
} = require("../config/index.js");
const NewsLetter = require("../models/NewsLetter.js");

// @desc: Join newsletter
// @route: POST /api/v1/newsletters
const joinNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await NewsLetter.findOne({ email });
    if (existing) {
      return res.status(400).json({
        statusCode: 400,
        message: "Already subscribed",
        data: null,
      });
    }

    const newSubscriber = await NewsLetter.create({ email });

    return res.status(200).json({
      statusCode: 200,
      message: "Subscribed to the newsletter successfully",
      data: newSubscriber,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: error.message,
    });
  }
};

// @desc: Get all subscribed email addresses
// @route: GET /api/v1/newsletters
const getAllSubscribedUsers = async (req, res) => {
  try {
    const subscribers = await NewsLetter.find({});
    return res.status(200).json({
      statusCode: 200,
      message: "Fetched all subscribers successfully",
      data: subscribers,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: error.message,
    });
  }
};

// @desc: Send newsletter to all subscribers
// @route: POST /api/v1/newsletters/send
const sendNewsLetter = async (req, res) => {
  try {
    const { sub, body } = req.body;

    console.log( sub, body);

    if (!sub || !body) {
      return res.status(400).json({
        statusCode: 400,
        message: "Subject and body are required",
        data: null,
      });
    }

    const subscribedUsers = await NewsLetter.find({});
    const emails = subscribedUsers.map((user) => user.email);

    if (emails.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "No subscribers to send email to",
        data: null,
      });
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: false,
      auth: {
        user: emailAddress,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: emailFrom,
      to: emailFrom,     // Use sender email in 'to'
      bcc: emails,       // Send to all subscribers without exposing their addresses
      subject: sub,
      html: body,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Newsletter sent successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: error.message,
    });
  }
};

module.exports = {
  joinNewsletter,
  getAllSubscribedUsers,
  sendNewsLetter,
};
