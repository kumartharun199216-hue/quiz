const express = require('express');
const router = express.Router();
const { getResults, getAttemptAnalysis } = require('../controllers/resultController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.get('/', getResults);
router.get('/:attemptId', getAttemptAnalysis);

module.exports = router;
