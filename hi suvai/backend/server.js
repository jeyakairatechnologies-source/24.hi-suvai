require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingRoutes = require('./routes/settingRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const Banner = require('./models/Banner');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
['products', 'settings', 'banners'].forEach(folder => {
  const dir = path.join(__dirname, 'uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Auto-seed helper on bootstrap
const autoSeedInitialData = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'Rajaselvi@gmail.com').toLowerCase();
    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      admin = new Admin({
        name: process.env.ADMIN_NAME || 'Rajaselvi',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Rajaselvi29',
        role: 'superadmin'
      });
      await admin.save();
      console.log(`[Auto-Seed] Admin account initialized: ${adminEmail}`);
    } else {
      admin.name = process.env.ADMIN_NAME || 'Rajaselvi';
      admin.password = process.env.ADMIN_PASSWORD || 'Rajaselvi29';
      await admin.save();
      console.log(`[Auto-Seed] Admin account updated: ${adminEmail}`);
    }

    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      const initialProducts = [
        {
          name: '24 Ingredient Health Mix',
          slug: '24-ingredient-health-mix',
          tag: 'Daily Nutrition',
          shortDescription: '24 பாரம்பரிய தானியங்கள், பருப்புகள் & நட்ஸ் கலவை — 250g',
          description: 'A powerhouse blend of 24 traditional grains, millets, nuts, and pulses ground together using cold-process stone grinding. Perfect daily breakfast porridge suitable for growing kids, adults, and seniors seeking wholesome energy.',
          price: 175,
          originalPrice: 220,
          category: 'health',
          stock: 75,
          unit: '250g',
          image: 'suvai1.png',
          images: ['suvai1.png', 'suvai4.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 148
        },
        {
          name: 'Traditional Double Combo',
          slug: 'traditional-double-combo',
          tag: 'Combo Deal',
          shortDescription: 'ஆரோக்கிய மிக்ஸ் + பாரம்பரிய கஞ்சி மிக்ஸ் சிறப்பு காம்போ',
          description: 'Value pack combining our best-selling 24 Ingredient Health Mix and 16 Variety Heritage Porridge Mix. Crafted for complete family wellness with 100% natural, preservative-free South Indian ingredients.',
          price: 275,
          originalPrice: 350,
          category: 'combo',
          stock: 40,
          unit: '500g (2 Packs)',
          image: 'suvai2.png',
          images: ['suvai2.png', 'suvai1.png', 'suvai3.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 5.0,
          reviewsCount: 210
        },
        {
          name: '16 Variety Porridge Mix',
          slug: '16-variety-porridge-mix',
          tag: 'Heritage Rice',
          shortDescription: '16 பாரம்பரிய அரிசி மற்றும் தானியங்கள் கலந்த சத்துணவு கஞ்சி',
          description: 'A comforting blend of 16 ancient Tamil rice varieties including Karuppu Kavuni, Mappillai Samba, and Kattu Yanam. High in dietary fibre and rich in antioxidants to keep digestion calm and active throughout the day.',
          price: 100,
          originalPrice: 130,
          category: 'porridge',
          stock: 90,
          unit: '250g',
          image: 'suvai3.png',
          images: ['suvai3.png', 'suvai5.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 96
        },
        {
          name: 'Hi Suvai Health Mix',
          slug: 'hi-suvai-health-mix',
          tag: 'Daily Health',
          shortDescription: 'முழுமையான இயற்கை சத்து மாவு — நாள் முழுவதும் புத்துணர்ச்சி',
          description: 'Traditional multi-grain health malt enriched with sprouted ragi, green gram, almonds, and cardamom. Easily digestible and naturally sweetened with no added artificial flavours or white sugar.',
          price: 175,
          originalPrice: 220,
          category: 'health',
          stock: 65,
          unit: '250g',
          image: 'suvai4.png',
          images: ['suvai4.png', 'suvai1.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 112
        },
        {
          name: 'Heritage Rice Porridge',
          slug: 'heritage-rice-porridge',
          tag: 'Power Grains',
          shortDescription: 'பாரம்பரிய கறுப்பு கவுனி & காட்டுயானம் அரிசி கஞ்சி கலவை',
          description: 'Specially milled ancient Tamil heritage rice recipe crafted for sustained stamina and immunity. Delicious with fresh buttermilk, a pinch of sea salt, and shallots.',
          price: 100,
          originalPrice: 130,
          category: 'porridge',
          stock: 80,
          unit: '250g',
          image: 'suvai5.png',
          images: ['suvai5.png', 'suvai3.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 4.8,
          reviewsCount: 84
        },
        {
          name: 'Karuppu Gothumai Flour',
          slug: 'karuppu-gothumai-flour',
          tag: 'Special Flour',
          shortDescription: 'இயற்கை கருப்பு கோதுமை மாவு — சத்துக்கள் நிறைந்த சுவை',
          description: '100% stone-milled Black Wheat (Karuppu Gothumai) Flour with natural anthocyanins and rich fibre. Ideal for nutritious chapatis, rotis, and traditional South Indian tiffin items.',
          price: 150,
          originalPrice: 190,
          category: 'flour',
          stock: 50,
          unit: '500g',
          image: 'suvai6.png',
          images: ['suvai6.png'],
          isFeatured: true,
          isAvailable: true,
          rating: 4.9,
          reviewsCount: 68
        }
      ];
      await Product.insertMany(initialProducts);
      console.log('[Auto-Seed] Initial 6 Hi Suvai products loaded into database.');
    }
  } catch (err) {
    console.warn('[Auto-Seed Warning]:', err.message);
  }
};

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static Files: Uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static Files: Frontend & Root files (images, assets)
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));
app.use('/admin', express.static(path.join(rootDir, 'admin')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/banners', bannerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Hi Suvai Backend API'
  });
});

// Admin Route redirect
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rootDir, 'admin', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum allowed size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await autoSeedInitialData();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Customer Website: http://localhost:${PORT}/`);
      console.log(`Admin Portal    : http://localhost:${PORT}/admin`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
