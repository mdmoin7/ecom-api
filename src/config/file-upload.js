import multer from "multer";
import path from "path";

// Get the current directory path in ES modules
const currentDir = import.meta.dirname;

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Resolve absolute path to the uploads directory
    cb(null, path.join(currentDir, "..", "..", "uploads"));
  },
  filename: function (req, file, cb) {
    // Generate a unique suffix using date timestamp and random number
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure file filter to only allow specific image types
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname));
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    return cb(null, false);
  }
};

// Set file upload limits (e.g. max file size 5MB)
const limits = {
  fileSize: 5 * 1024 * 1024,
};

// Initialize multer middleware with all configurations
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

export default upload;

