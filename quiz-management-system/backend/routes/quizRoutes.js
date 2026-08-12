const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  previewQuiz,
} = require('../controllers/quizController');
const { addSection } = require('../controllers/sectionController');
const { addQuestion } = require('../controllers/questionController');
const { assignQuiz, getQuizAssignments } = require('../controllers/assignmentController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.post('/', createQuiz);
router.get('/', getAllQuizzes);
router.get('/:id', getQuizById);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);
router.post('/:id/duplicate', duplicateQuiz);
router.get('/:id/preview', previewQuiz);

// Nested Section, Question, Assignment creation
router.post('/:quizId/sections', addSection);
router.post('/:quizId/questions', addQuestion);
router.post('/:quizId/assign', assignQuiz);
router.get('/:quizId/assignments', getQuizAssignments);

module.exports = router;
