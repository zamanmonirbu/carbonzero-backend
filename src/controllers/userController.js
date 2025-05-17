const bcryptjs = require("bcryptjs");
const User = require("../models/User");
const fs = require("fs");
const { cloudinaryUpload } = require("../utils/cloudinaryUpload");

const getAllUsers = async (req, res) => {
  const { page } = req.query;
  const currentPage = parseInt(page) || 1;
  const perPage = 8;
  const skip = (currentPage - 1) * perPage;

  try {
    const users = await User.find({ role: "User" })
      .select("-password -verificationCode -verificationCodeExpires -createdAt -__v")
      .sort({ createdAt: -1 }) // Sort by latest users
      .skip(skip)
      .limit(perPage);

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / perPage);

    return res.status(200).json({
      status: true,
      message: "All users fetched successfully",
      data: users,
      pagination: {
        currentPage,
        totalPages,
        totalUsers,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "internal server error",
      data: error.message,
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userFound = await User.findById(id).select("-password -verificationCode -verificationCodeExpires -createdAt -updatedAt -__v");
    if (!userFound) {
      return res.status(404).json({ status: false, message: "user not found" });
    }

    

    return res.status(200).json({
      status: true,
      message: "Single user fetched successfully",
      data: userFound,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};
const 
searchUser = async (req, res) => {
  try {
    const { uniqueCode, companyLegalName } = req.query;
    const searchRegex = new RegExp(uniqueCode || companyLegalName, "i");
    let users;

    if (uniqueCode) {
      users = await User.findOne({ uniqueCode: searchRegex }).select("-password -verificationCode -verificationCodeExpires -createdAt -__v");
      if (!users) {
        return res.status(404).json({
          status: false,
          message: "No user found with that unique code",
        });
      }
    } else if (companyLegalName) {
      users = await User.find({ companyLegalName: searchRegex }).select("-password -verificationCode -verificationCodeExpires -createdAt -__v");
      if (users.length === 0) {
        return res.status(404).json({
          status: false,
          message: "No users found with that company name",
        });
      }
    }

    return res.status(200).json({
      status: true,
      message: "Users found successfully",
      data: users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};


const updateUserProfilePicture = async (req, res) => {
  try {
    const { id } = req.user;
    const userFound = await User.findById(id);
    if (!userFound) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
console.log(userFound)
    if (!req.files || !req.files.profileImage || req.files.profileImage.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Profile image is required",
        data: null,
      });
    }

    const profileImage = req.files.profileImage[0];
    const sanitizedTitle = userFound.fullName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[?&=]/g, "");

    const imgUrl = await cloudinaryUpload(profileImage.path, sanitizedTitle, "user-profile");
    if (imgUrl === "file upload failed") {
      return res.status(400).json({
        statusCode: 400,
        message: "File upload failed",
        data: null,
      });
    }

    const user = await User.findByIdAndUpdate(id, { profileImage: imgUrl.url }, { new: true });

    user.password = undefined;

    return res.status(200).json({
      status: true,
      message: "User profile image updated successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};


const updateUserInfo = async (req, res) => {
  try {
    const { id } = req.user; 
    
    const { fullName, phoneNumber, email, address, about,role,companyLegalName } = req.body;

    const userFound = await User.findById(id);
    if (!userFound) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const updatedInfo = {
      fullName: fullName || userFound.fullName,
      email: email || userFound.email,
      phoneNumber: phoneNumber || userFound.phoneNumber,
      address: address || userFound.address,
      about: about || userFound.about,
      role:role|| userFound.role,
      companyLegalName:companyLegalName|| userFound.companyLegalName,
      profileImage: userFound.profileImage,
      uniqueCode: userFound.uniqueCode,
      password: userFound.password  
    };

    const user = await User.findByIdAndUpdate(id, updatedInfo, { new: true });
    user.password = undefined;

    
    return res.status(200).json({
      status: true,
      message: "User information updated successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      data: error.message,
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    await User.findByIdAndDelete(id);
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

const getAdminAndSuperAdmin = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] } }).select("-password -verificationCode -verificationCodeExpires -createdAt -updatedAt -__v");
    if (admins.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No admins found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admins found successfully",
      data: admins,
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
  searchUser,
  updateUserInfo,
  updateUserProfilePicture,
  getAllUsers,
  getSingleUser,
  deleteUser,
  getAdminAndSuperAdmin,
};

