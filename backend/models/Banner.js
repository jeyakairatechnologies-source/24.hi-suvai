const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  slot: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  title: {
    type: String,
    default: 'Traditional Flavours'
  },
  subtitle: {
    type: String,
    default: 'Handcrafted ancient Tamil recipes delivered fresh to your doorstep'
  },
  image: {
    type: String,
    required: true,
    default: 'assets/hero-9yocouzg.png'
  },
  link: {
    type: String,
    default: '#products'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile'],
    default: 'desktop'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
