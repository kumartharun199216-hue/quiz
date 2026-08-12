const express = require('express');
const router = express.Router();
const { startAttempt, getAttempt, saveAnswer, submitAttempt } = require('../controllers/attemptController');
const { authenticateStudent } = require('../middleware/auth');

router.use(authenticateStudent);

router.post('/start', startAttempt);
router.get('/:id', getAttempt);
router.put('/:id/answer', saveAnswer);
router.post('/:id/submit', submitAttempt);

module.exports = router;
