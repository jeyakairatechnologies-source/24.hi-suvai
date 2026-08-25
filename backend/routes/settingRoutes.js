const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Setting = require('../models/Setting');
const { protectAdmin } = require('../middleware/authMiddleware');

// Storage for store logo and settings uploads
const settingsUploadDir = path.join(__dirname, '..', 'uploads', 'settings');
if (!fs.existsSync(settingsUploadDir)) {
  fs.mkdirSync(settingsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, settingsUploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   GET /api/settings
// @desc    Get public store settings (Social links, contact info, logo)
// @access  Public
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'store_config' });
    if (!settings) {
      settings = await Setting.create({
        key: 'store_config',
        storeName: 'Hi Suvai',
        storeLogo: 'assets/logo.png',
        supportPhone: '6381926567',
        contactEmail: 'contact@hisuvai.com',
        storeAddress: '15A, Madasamy Kovil Street, Pettai, Tirunelveli - 627004. Tamil Nadu, India.',
        aboutText: 'Pure Traditional Taste & Ancient Roots — Handcrafted Foods from Tamil Nadu.',
        facebookUrl: 'https://facebook.com/hisuvai',
        instagramUrl: 'https://instagram.com/hisuvai',
        youtubeUrl: 'https://youtube.com/@hisuvai',
        whatsappNumber: '916381926567'
      });
    }

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// @route   PUT /api/settings
// @desc    Update store settings (Admin only)
// @access  Private (Admin)
router.put('/', protectAdmin, upload.single('storeLogo'), async (req, res) => {
  try {
    let settings = await Setting.findOne({ key: 'store_config' });
    if (!settings) {
      settings = new Setting({ key: 'store_config' });
    }

    const {
      storeName,
      supportPhone,
      contactEmail,
      storeAddress,
      aboutText,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      whatsappNumber,
      customCategories,
      priceRanges
    } = req.body;

    if (storeName) settings.storeName = storeName;
    if (supportPhone) settings.supportPhone = supportPhone;
    if (contactEmail) settings.contactEmail = contactEmail;
    if (storeAddress) settings.storeAddress = storeAddress;
    if (aboutText) settings.aboutText = aboutText;
    if (facebookUrl !== undefined) settings.facebookUrl = facebookUrl;
    if (instagramUrl !== undefined) settings.instagramUrl = instagramUrl;
    if (youtubeUrl !== undefined) settings.youtubeUrl = youtubeUrl;
    if (whatsappNumber !== undefined) settings.whatsappNumber = whatsappNumber;

    if (customCategories) {
      try {
        settings.customCategories = typeof customCategories === 'string' ? JSON.parse(customCategories) : customCategories;
      } catch (err) {
        console.warn('Error parsing customCategories:', err);
      }
    }

    if (priceRanges) {
      try {
        settings.priceRanges = typeof priceRanges === 'string' ? JSON.parse(priceRanges) : priceRanges;
      } catch (err) {
        console.warn('Error parsing priceRanges:', err);
      }
    }

    if (req.file) {
      settings.storeLogo = `/uploads/settings/${req.file.filename}`;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Store settings updated successfully!',
      settings
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update settings' });
  }
});

module.exports = router;
