const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
const imageDir = path.join(uploadDir, "images");
const fileDir = path.join(uploadDir, "files");



if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, imageDir);
    } else {
      cb(null, fileDir);
    }
  },
  filename: function (req, file, cb) {
    const randomName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + randomName + "-" + file.originalname);
  },
});

// Create the base multer instance
const upload = multer({ storage });

// Custom fields upload function
const multerUpload = (fields) => upload.fields(fields);

// Export both options
module.exports = {
  upload,       // Standard multer instance (for .single(), .array(), etc.) 
  multerUpload  // Custom fields upload function
};