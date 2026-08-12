const Quiz = require('../models/Quiz');
const Section = require('../models/Section');
const Question = require('../models/Question');
const QuizAssignment = require('../models/QuizAssignment');
const QuizAttempt = require('../models/QuizAttempt');

// Create Quiz
const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      quizType,
      duration,
      passingPercentage,
      hasSections,
      randomizeQuestions,
      randomizeOptions,
      allowBackNavigation,
      enableNegativeMarking,
    } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ success: false, message: 'Title and duration are required.' });
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      description: description || '',
      quizType: quizType || 'Technical',
      duration: parseInt(duration, 10),
      passingPercentage: passingPercentage !== undefined ? parseInt(passingPercentage, 10) : 50,
      hasSections: !!hasSections,
      randomizeQuestions: !!randomizeQuestions,
      randomizeOptions: !!randomizeOptions,
      allowBackNavigation: allowBackNavigation !== undefined ? !!allowBackNavigation : true,
      enableNegativeMarking: !!enableNegativeMarking,
      createdBy: req.admin._id,
    });

    return res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Quizzes (with statistics)
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });

    const enriched = await Promise.all(
      quizzes.map(async (q) => {
        const questionCount = await Question.countDocuments({ quizId: q._id });
        const assignmentCount = await QuizAssignment.countDocuments({ quizId: q._id });
        const attemptCount = await QuizAttempt.countDocuments({ quizId: q._id });
        return {
          ...q.toObject(),
          questionCount,
          assignmentCount,
          attemptCount,
        };
      })
    );

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Quiz with sections & questions
const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const sections = await Section.find({ quizId: id }).sort({ order: 1 });
    const questions = await Question.find({ quizId: id }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...quiz.toObject(),
        sections,
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Quiz
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    Object.assign(quiz, updateData);
    await quiz.save();

    return res.status(200).json({ success: true, message: 'Quiz updated successfully', data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    await Quiz.findByIdAndDelete(id);
    await Section.deleteMany({ quizId: id });
    await Question.deleteMany({ quizId: id });
    await QuizAssignment.deleteMany({ quizId: id });
    await QuizAttempt.deleteMany({ quizId: id });

    return res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Duplicate Quiz
const duplicateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const originalQuiz = await Quiz.findById(id);

    if (!originalQuiz) {
      return res.status(404).json({ success: false, message: 'Original quiz not found.' });
    }

    const newQuiz = await Quiz.create({
      ...originalQuiz.toObject(),
      _id: undefined,
      title: `${originalQuiz.title} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
      createdBy: req.admin._id,
    });

    // Copy sections
    const originalSections = await Section.find({ quizId: id });
    const sectionMap = {};

    for (const sec of originalSections) {
      const newSec = await Section.create({
        ...sec.toObject(),
        _id: undefined,
        quizId: newQuiz._id,
      });
      sectionMap[sec._id.toString()] = newSec._id;
    }

    // Copy questions
    const originalQuestions = await Question.find({ quizId: id });
    for (const q of originalQuestions) {
      await Question.create({
        ...q.toObject(),
        _id: undefined,
        quizId: newQuiz._id,
        sectionId: q.sectionId ? sectionMap[q.sectionId.toString()] || null : null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Quiz duplicated successfully.',
      data: newQuiz,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Preview Quiz (exposes correct answer for preview)
const previewQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const sections = await Section.find({ quizId: id }).sort({ order: 1 });
    const questions = await Question.find({ quizId: id }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      data: {
        quiz,
        sections,
        questions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  duplicateQuiz,
  previewQuiz,
};
