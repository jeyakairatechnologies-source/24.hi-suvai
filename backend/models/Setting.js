const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'store_config'
  },
  storeName: {
    type: String,
    default: 'Hi Suvai'
  },
  storeLogo: {
    type: String,
    default: 'assets/logo.png'
  },
  supportPhone: {
    type: String,
    default: '6381926567'
  },
  contactEmail: {
    type: String,
    default: 'contact@hisuvai.com'
  },
  storeAddress: {
    type: String,
    default: '15A, Madasamy Kovil Street, Pettai, Tirunelveli - 627004. Tamil Nadu, India.'
  },
  aboutText: {
    type: String,
    default: 'Pure Traditional Taste & Ancient Roots — Handcrafted Foods from Tamil Nadu.'
  },
  facebookUrl: {
    type: String,
    default: 'https://facebook.com/hisuvai'
  },
  instagramUrl: {
    type: String,
    default: 'https://instagram.com/hisuvai'
  },
  youtubeUrl: {
    type: String,
    default: 'https://youtube.com/@hisuvai'
  },
  whatsappNumber: {
    type: String,
    default: '916381926567'
  },
  customCategories: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true }
    }],
    default: [
      { key: 'health', label: 'Health Mix' },
      { key: 'porridge', label: 'Porridge & Rice Mix' },
      { key: 'flour', label: 'Special Flour' },
      { key: 'combo', label: 'Combo Packs' }
    ]
  },
  priceRanges: {
    type: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 999999 }
    }],
    default: [
      { key: 'under150', label: 'Under ₹150', min: 0, max: 149 },
      { key: '150-200', label: '₹150 – ₹200', min: 150, max: 200 },
      { key: 'above200', label: 'Above ₹200', min: 201, max: 999999 }
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
