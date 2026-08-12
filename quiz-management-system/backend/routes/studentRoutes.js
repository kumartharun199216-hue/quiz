const express = require('express');
const router = express.Router();
const { getStudentsList, toggleStudentStatus } = require('../controllers/assignmentController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.get('/', getStudentsList);
router.patch('/:id/status', toggleStudentStatus);

module.exports = router;
