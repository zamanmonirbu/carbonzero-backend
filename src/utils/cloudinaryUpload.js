const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { cloudinaryApiKey, cloudinaryCloudName, cloudinarySecret } = require("../config/index.js");

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinarySecret,
});

const cloudinaryUpload = async (filePath, public_id, folder) => {
  let uploadImage;

  try {
    uploadImage = await cloudinary.uploader.upload(filePath, {
      public_id,
      folder,
    });

    fs.unlinkSync(filePath);
  } catch (error) {
    fs.unlinkSync(filePath);
    return "file upload failed";
  }
  return uploadImage;
};

module.exports = { cloudinaryUpload };
