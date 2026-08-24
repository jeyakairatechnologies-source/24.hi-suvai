const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  tag: {
    type: String,
    trim: true,
    default: 'Traditional Choice'
  },
  shortDescription: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    default: function() {
      return this.price ? Math.round(this.price * 1.25) : 0;
    },
    min: [0, 'Original price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['health', 'porridge', 'flour', 'combo', 'spices', 'snacks', 'other'],
      message: '{VALUE} is not a supported category'
    },
    default: 'health'
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 50
  },
  unit: {
    type: String,
    default: '250g',
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Main product image is required'],
    default: 'suvai1.png'
  },
  images: {
    type: [String],
    default: []
  },
  isFeatured: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 4.9,
    min: 1,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 120
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name if not provided
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = baseSlug || `product-${Date.now()}`;
  }
  next();
});

// Virtual for formatted discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
