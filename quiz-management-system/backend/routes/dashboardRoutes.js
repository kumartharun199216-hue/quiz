const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.get('/', getDashboardStats);

module.exports = router;
