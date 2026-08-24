const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminProfile, logoutAdmin } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/me', protectAdmin, getAdminProfile);

module.exports = router;
