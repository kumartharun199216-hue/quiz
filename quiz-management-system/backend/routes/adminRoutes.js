const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  deleteAdmin,
} = require('../controllers/adminController');
const { authenticateAdmin, requireRole } = require('../middleware/auth');

// All endpoints in this router are restricted to SUPER_ADMIN
router.use(authenticateAdmin, requireRole('SUPER_ADMIN'));

router.get('/', getAllAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.patch('/:id/status', toggleAdminStatus);
router.patch('/:id/reset-password', resetAdminPassword);
router.delete('/:id', deleteAdmin);

module.exports = router;
