const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Banner = require('../models/Banner');
const { protectAdmin } = require('../middleware/authMiddleware');

// Storage for hero banners
const bannerUploadDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(bannerUploadDir)) {
  fs.mkdirSync(bannerUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, bannerUploadDir);
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `banner-slot-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// @route   GET /api/banners
// @desc    Get all hero banners
// @access  Public
router.get('/', async (req, res) => {
  try {
    let banners = await Banner.find({ isActive: true }).sort({ slot: 1 });
    
    // If no banners seeded, seed default 3 slots
    if (banners.length === 0) {
      const defaultBanners = [
        {
          slot: 1,
          title: 'Traditional Flavours',
          subtitle: 'From handpounded rice to sun-dried jaggery — pure ancient nourishment.',
          image: 'assets/hero-9yocouzg.png',
          link: '#products',
          isActive: true,
          deviceType: 'desktop'
        },
        {
          slot: 2,
          title: 'Daily Health Mixes',
          subtitle: '24 ancient grains and sprouted pulses for sustained stamina.',
          image: 'assets/hero-9yocouzg.png',
          link: '#products',
          isActive: true,
          deviceType: 'desktop'
        },
        {
          slot: 3,
          title: 'Heritage Rice Porridge',
          subtitle: 'Traditional recipes crafted for complete family wellness.',
          image: 'assets/hero-9yocouzg.png',
          link: '#products',
          isActive: true,
          deviceType: 'desktop'
        }
      ];
      banners = await Banner.insertMany(defaultBanners);
    }

    return res.status(200).json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Fetch Banners Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
});

// @route   POST /api/banners/upload
// @desc    Upload or update slot banner (Admin only)
// @access  Private (Admin)
router.post('/slot/:slotNumber', protectAdmin, upload.single('bannerImage'), async (req, res) => {
  try {
    const slotNumber = parseInt(req.params.slotNumber, 10);
    if (![1, 2, 3].includes(slotNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid slot number (1, 2, 3 only)' });
    }

    let banner = await Banner.findOne({ slot: slotNumber });
    if (!banner) {
      banner = new Banner({ slot: slotNumber });
    }

    const { title, subtitle, link, isActive } = req.body;
    if (title) banner.title = title;
    if (subtitle) banner.subtitle = subtitle;
    if (link) banner.link = link;
    if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      banner.image = `/uploads/banners/${req.file.filename}`;
    }

    await banner.save();

    return res.status(200).json({
      success: true,
      message: `Banner Slot ${slotNumber} updated successfully!`,
      banner
    });
  } catch (error) {
    console.error('Update Banner Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update banner' });
  }
});

module.exports = router;
