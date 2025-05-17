const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const { refreshTokenSecrete, salt, emailExpires } = require("../config");
const { verificationCodeTemplate } = require("../utils/emailTemplates");



const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");


let passwordResettable=false;

exports.registerUser = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password, companyLegalName,role } = req.body;

    const existingUser = await User.findOne({ email });

   
    let userRole = role || "User";

    if(role==="AddedBySuperAdmin"){
      userRole="User";
    }



    if (existingUser) {
      return res.json({
        status: false,
        message: "User already registered. Please login.",
        data: null,
      });
    }

    const saltGenerated = await bcrypt.genSalt(parseInt(salt));
    const hashedPassword = await bcrypt.hash(password, saltGenerated);

    const uniqueCode = Array.from({ length: 6 }, () => {
      const isLetter = Math.random() < 0.5;
      return isLetter
        ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
        : Math.floor(Math.random() * 10);
    }).join('');


    
    const newUser = new User({
      fullName,
      phoneNumber,
      email,
      companyLegalName,
      password: hashedPassword,
      uniqueCode,
      role: userRole,
    });

    const user = await newUser.save();


    if (!user) {
      return res.json({
        status: false,
        message: "Registration failed",
        data: null,
      });
    }

    if (role === "AddedBySuperAdmin") {      
            // const payment = new Payment({
            //   user: user._id,
            //   subscriptionType:"Free",
            //   amount: 0,
            //   paymentDate: new Date(),  
            // });
      
            // await payment.save();

            const date = new Date();
            
              date.setMonth(date.getMonth() + 999);
           
    
            await User.findByIdAndUpdate(user._id, {
              isEntryComplete: true,
              subscriptionExpireDate: date,
              hasActiveSubscription: true,
            });

    }
    
    const notification = new Notification({
      message: `Welcome to our platform, ${user.fullName}. We are glad you are here.`,
      user: user._id,
    });

    await notification.save();



    res.json({
      status: true,
      message: "Registered user!",
      data: null,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.json({
      status: false,
      message: "Registration failed",
      data: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.json({ status: false, message: "User not found", data: null });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({
        status: false,
        message: "Invalid credentials",
        data: null,
      });

    if (user.role === "User" && !user.isEntryComplete) {
      return res.json({
        status: false,
        message: "Please complete your entry payment before logging in.",
        data: null,
      });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.email, user.role);

    const userRole=user.role;

            const userData = { ...user.toObject(), password: undefined,__v:undefined, updatedAt:undefined,createdAt:undefined,role:undefined};

    res.json({
      status: true,
      message: "Login successful",
      data: { accessToken, refreshToken, user: userData, role:userRole },
    });
  } catch (error) {
    res.json({ status: false, message: "Login failed", data: error.message });
  }
};

exports.logoutUser = (req, res) => {
  res.json({
    status: true,
    message: "Logged out successfully",
    data: null,
  });
};


exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ status: false, message: "User not found", data: null });
    await User.findByIdAndDelete(user._id);
    return res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};


exports.refreshToken = (req, res) => {
  const { refreshTokenBody } = req.body;
  if (!refreshTokenBody)
    return res.json({ status: false, message: "No refresh token", data: null });

  try {
    const decoded = jwt.verify(refreshTokenBody, refreshTokenSecrete);
    const accessToken = generateAccessToken(decoded.id, decoded.email);
    const refreshToken = generateRefreshToken(decoded.id, decoded.email);

    res.json({
      status: true,
      message: "Refresh token is valid",
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, message: "Invalid refresh token", data: null });
  }
};



exports.updatePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ status: false, message: "Invalid email", data: null });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.json({
        status: false,
        message: "Old password not match",
        data: null,
      });


    const saltGenerated = await bcrypt.genSalt(parseInt(salt));
    const hashedPassword = await bcrypt.hash(newPassword, saltGenerated);

    user.password = hashedPassword;
    await user.save();

    res.json({
      status: true,
      message: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, message: "Update password failed", data: null });
  }
};


exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ status: false, message: "Invalid email", data: null });

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expiresIn = new Date();
    expiresIn.setMinutes(expiresIn.getMinutes() + emailExpires / 60000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expiresIn;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Verification Code",
      html: verificationCodeTemplate(user.verificationCode),
    });
    res.json({
      status: true,
      message: "Verification code sent to your email",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, message: "Forget password failed", data: null });
  }
};


exports.verifyCode = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ status: false, message: "Invalid email", data: null });

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.json({
        status: false,
        message: "No verification code found",
        data: null,
      });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.json({
        status: false,
        message: "Verification code expired",
        data: null,
      });
    }

    if (user.verificationCode !== verificationCode) {
      return res.json({
        status: false,
        message: "Invalid verification code",
        data: null,
      });
    }

    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    passwordResettable = true;

    res.json({
      status: true,
      message: "Verification code verified successfully",
      data: null,
    });
  } catch (error) {
    res.json({ status: false, message: "Verification failed", data: null });
  }
};

exports.resetPassword = async (req, res) => {
  try {

    if (!passwordResettable) {
      return res.json({
        status: false,
        message: "Verification code not verified",
        data: null,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ status: false, message: "Invalid email", data: null });



    if (user.verificationCode || user.verificationCodeExpires) {
      return res.json({
        status: false,
        message: "Verification code not verified",
        data: null,
      });
    }

    const saltGenerated = await bcrypt.genSalt(parseInt(salt));
    const hashedPassword = await bcrypt.hash(password, saltGenerated);

    user.password = hashedPassword;
    await user.save();

    passwordResettable = false;

    res.json({
      status: true,
      message: "Password reset successfully",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.json({ status: false, message: "Password reset failed", data: null });
  }
};


