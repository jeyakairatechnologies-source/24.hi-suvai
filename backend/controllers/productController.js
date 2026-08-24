const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../middleware/uploadMiddleware');

// Helper to remove uploaded file from disk
const removeUploadedFile = (filePath) => {
  if (!filePath) return;
  // If it's an uploaded file stored in /uploads/products/
  if (filePath.includes('/uploads/products/')) {
    const filename = path.basename(filePath);
    const diskPath = path.join(uploadDir, filename);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (err) {
        console.warn(`Could not remove file ${diskPath}:`, err.message);
      }
    }
  }
};

// @desc    Get all products with filtering, search & sorting
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort,
      minPrice,
      maxPrice,
      isFeatured,
      isAvailable,
      limit,
      page
    } = req.query;

    const query = {};

    // Filter by Category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by Name, Tag, Description
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { tag: regex },
        { shortDescription: regex },
        { description: regex }
      ];
    }

    // Filter by Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by Featured / Available status
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'low-high') {
      sortOption = { price: 1 };
    } else if (sort === 'high-low') {
      sortOption = { price: -1 };
    } else if (sort === 'name-asc') {
      sortOption = { name: 1 };
    } else if (sort === 'featured') {
      sortOption = { isFeatured: -1, createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query)
    ]);

    // Aggregate category counts for client side filter badges
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countsMap = { all: await Product.countDocuments({}) };
    categoryCounts.forEach(c => {
      countsMap[c._id] = c.count;
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      categoryCounts: countsMap,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving products.'
    });
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    // Check if valid MongoDB ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ slug: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error getting single product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving product details.'
    });
  }
};

// @desc    Create a new product with image uploads
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      tag,
      shortDescription,
      description,
      price,
      originalPrice,
      category,
      stock,
      unit,
      isFeatured,
      isAvailable,
      rating,
      imageUrl
    } = req.body;

    if (!name || !price || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, price, description, category.'
      });
    }

    // Determine Main Image
    let mainImage = imageUrl || 'suvai1.png';
    if (req.files && req.files.image && req.files.image.length > 0) {
      mainImage = `/uploads/products/${req.files.image[0].filename}`;
    }

    // Determine Additional Images
    let additionalImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      additionalImages = req.files.images.map(
        file => `/uploads/products/${file.filename}`
      );
    }

    const product = new Product({
      name: name.trim(),
      tag: tag ? tag.trim() : 'Traditional Choice',
      shortDescription: shortDescription ? shortDescription.trim() : '',
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Math.round(Number(price) * 1.25),
      category,
      stock: stock !== undefined ? Number(stock) : 50,
      unit: unit ? unit.trim() : '250g',
      image: mainImage,
      images: additionalImages,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
      rating: rating ? Number(rating) : 4.9
    });

    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product.'
    });
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const {
      name,
      tag,
      shortDescription,
      description,
      price,
      originalPrice,
      category,
      stock,
      unit,
      isFeatured,
      isAvailable,
      rating,
      imageUrl,
      existingImages
    } = req.body;

    // Update text fields
    if (name) product.name = name.trim();
    if (tag !== undefined) product.tag = tag.trim();
    if (shortDescription !== undefined) product.shortDescription = shortDescription.trim();
    if (description) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (category) product.category = category;
    if (stock !== undefined) product.stock = Number(stock);
    if (unit) product.unit = unit.trim();
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (rating !== undefined) product.rating = Number(rating);

    // Handle Main Image replacement
    if (req.files && req.files.image && req.files.image.length > 0) {
      const oldImage = product.image;
      product.image = `/uploads/products/${req.files.image[0].filename}`;
      // Clean up old uploaded image file if replacing
      removeUploadedFile(oldImage);
    } else if (imageUrl) {
      product.image = imageUrl;
    }

    // Handle Additional Images
    let updatedImages = [];
    if (existingImages) {
      try {
        updatedImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        updatedImages = [existingImages];
      }
    } else {
      updatedImages = product.images || [];
    }

    if (req.files && req.files.images && req.files.images.length > 0) {
      const newImages = req.files.images.map(file => `/uploads/products/${file.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }
    product.images = updatedImages;

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update product.'
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Clean up uploaded image files
    removeUploadedFile(product.image);
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => removeUploadedFile(img));
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting product.'
    });
  }
};

// @desc    Get dashboard statistics for Admin overview
// @route   GET /api/products/stats
// @access  Private (Admin)
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ isAvailable: true, stock: { $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ $or: [{ stock: 0 }, { isAvailable: false }] });
    const featuredProducts = await Product.countDocuments({ isFeatured: true });

    // Aggregate category distribution
    const categoryBreakdown = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' } } }
    ]);

    // Recent 5 products
    const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(5);

    // Total inventory value
    const inventoryValAgg = await Product.aggregate([
      { $group: { _id: null, totalVal: { $sum: { $multiply: ['$price', '$stock'] } } } }
    ]);
    const totalInventoryValue = inventoryValAgg[0] ? inventoryValAgg[0].totalVal : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        availableProducts,
        outOfStockProducts,
        featuredProducts,
        totalInventoryValue,
        categoryBreakdown,
        recentProducts
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating dashboard statistics.'
    });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isAvailable: true }).limit(10);
    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching featured products.' });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category, isAvailable: true });
    return res.status(200).json({
      success: true,
      count: products.length,
      category,
      products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching products by category.' });
  }
};

// @desc    Quick adjust stock level for a product
// @route   PATCH /api/products/:id/stock
// @access  Private (Admin)
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, delta } = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    let newStock = product.stock !== undefined ? product.stock : 0;
    if (stock !== undefined && stock !== null) {
      newStock = Math.max(0, Number(stock));
    } else if (delta !== undefined && delta !== null) {
      newStock = Math.max(0, newStock + Number(delta));
    }

    product.stock = newStock;
    product.isAvailable = newStock > 0;
    const updated = await product.save();

    return res.status(200).json({
      success: true,
      message: `Stock updated successfully for ${updated.name}`,
      product: updated
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update stock.'
    });
  }
};

