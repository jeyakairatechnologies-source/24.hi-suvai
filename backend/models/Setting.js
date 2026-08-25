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
  },
  proprietorName: {
    type: String,
    default: 'M.RajaselviMahalingam. M.Sc., B.Ed.'
  },
  googleMapUrl: {
    type: String,
    default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3941.234!2d77.71234!3d8.71390!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0412f6ef00c3c1%3A0x0!2sPettai%2C+Tirunelveli%2C+Tamil+Nadu+627004!5e0!3m2!1sen!2sin!4v1692500000000!5m2!1sen!2sin'
  },
  specialOffers: {
    type: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      price: { type: Number, required: true },
      originalPrice: { type: Number, default: 0 },
      image: { type: String, default: 'offer_1.jpg' },
      buttonText: { type: String, default: 'BUY OFFER' }
    }],
    default: [
      {
        title: 'ஹெல்த் மிக்ஸ் + கஞ்சி மிக்ஸ் காம்போ',
        description: '1KG ஹெல்த் மிக்ஸ் (₹700) + 1KG கஞ்சி மிக்ஸ் (₹400) | மொத்த விலை ₹1100 ➔ சிறப்பு சலுகை விலை ₹1000',
        price: 1000,
        originalPrice: 1100,
        image: 'offer_1.jpg',
        buttonText: 'BUY OFFER - ₹1000'
      },
      {
        title: 'இன்றைய சிறப்பு சலுகை Combo',
        description: '24 வகை ஹெல்த் மிக்ஸ் + 16 வகை பாரம்பரிய அரிசி கஞ்சி மிக்ஸ் 1KG Combo Pack',
        price: 1000,
        originalPrice: 1100,
        image: 'offer_2.jpg',
        buttonText: 'BUY OFFER - ₹1000'
      },
      {
        title: 'Weekend Offer - Free Gift!',
        description: '1KG ஹெல்த் மிக்ஸ் (Rs. 700) வாங்கினால் 250g கருப்பு கோதுமை மாவு இலவசம்!',
        price: 700,
        originalPrice: 0,
        image: 'offer_3.jpg',
        buttonText: 'CLAIM OFFER - ₹700'
      }
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
