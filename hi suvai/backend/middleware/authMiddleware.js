const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in as Admin.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hi_suvai_secret');
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found or token has expired.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('JWT Authentication Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.'
    });
  }
};

module.exports = { protectAdmin };
