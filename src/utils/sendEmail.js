const nodemailer = require("nodemailer");
const {
  emailHost,
  emailPort,
  emailAddress,
  emailPass,
  emailFrom,
} = require("../config");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: false,
      auth: {
        user: emailAddress,
        pass: emailPass,
      },
    });

    console.log(to,
      subject,
      html,
      emailFrom);

    const mailOptions = {
      from: emailFrom,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
