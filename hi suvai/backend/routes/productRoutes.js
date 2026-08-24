const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getFeaturedProducts,
  getProductsByCategory
} = require('../controllers/productController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadProductMedia } = require('../middleware/uploadMiddleware');

// Public Product Routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/stats', protectAdmin, getProductStats); // Placed before /:id to prevent slug conflict
router.get('/:id', getProductById);

// Protected Admin Product Routes
router.post('/', protectAdmin, uploadProductMedia, createProduct);
router.put('/:id', protectAdmin, uploadProductMedia, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

module.exports = router;
