const express = require('express');
const router = express.Router();
const { updateSection, deleteSection } = require('../controllers/sectionController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

module.exports = router;
