const express = require('express');
const router = express.Router();
const { updateQuestion, deleteQuestion } = require('../controllers/questionController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
