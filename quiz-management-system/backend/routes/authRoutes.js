const express = require('express');
const router = express.Router();
const { adminLogin, studentLogin, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/admin/login', authLimiter, adminLogin);
router.post('/student/login', authLimiter, studentLogin);
router.post('/logout', logout);

module.exports = router;
