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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
