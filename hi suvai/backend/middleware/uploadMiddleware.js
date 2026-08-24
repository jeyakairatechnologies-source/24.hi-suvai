const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure destination directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `product-${cleanBaseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are supported.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB per file
  },
  fileFilter: fileFilter
});

// Middleware for product images (main image + additional images)
const uploadProductMedia = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 6 }
]);

module.exports = { uploadProductMedia, uploadDir };
