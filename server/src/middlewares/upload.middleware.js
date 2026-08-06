const multer = require("multer");
const { productStorage, avatarStorage, prescriptionStorage } = require("../config/cloudinary");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP images and PDF files are allowed."), false);
  }
};

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).array("images", 10); // max 10 product images

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB for avatars
  fileFilter,
}).single("avatar");

const uploadPrescription = multer({
  storage: prescriptionStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("prescription");

module.exports = { uploadProductImages, uploadAvatar, uploadPrescription };
