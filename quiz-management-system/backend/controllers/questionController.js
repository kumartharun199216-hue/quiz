const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

const addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sectionId, questionText, options, correctAnswer, marks, negativeMarks, order } = req.body;

    if (!questionText || !options || !correctAnswer) {
      return res.status(400).json({ success: false, message: 'Question text, options, and correct answer are required.' });
    }

    const question = await Question.create({
      quizId,
      sectionId: sectionId || null,
      questionText: questionText.trim(),
      options,
      correctAnswer: correctAnswer.toUpperCase(),
      marks: marks !== undefined ? parseFloat(marks) : 1,
      negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : 0,
      order: order !== undefined ? parseInt(order, 10) : 0,
    });

    // Update Quiz totalMarks
    const allQuestions = await Question.find({ quizId });
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    await Quiz.findByIdAndUpdate(quizId, { totalMarks });

    return res.status(201).json({ success: true, message: 'Question added successfully', data: question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionId, questionText, options, correctAnswer, marks, negativeMarks, order } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (sectionId !== undefined) question.sectionId = sectionId || null;
    if (questionText) question.questionText = questionText.trim();
    if (options) question.options = options;
    if (correctAnswer) question.correctAnswer = correctAnswer.toUpperCase();
    if (marks !== undefined) question.marks = parseFloat(marks);
    if (negativeMarks !== undefined) question.negativeMarks = parseFloat(negativeMarks);
    if (order !== undefined) question.order = parseInt(order, 10);

    await question.save();

    // Recalculate quiz total marks
    const allQuestions = await Question.find({ quizId: question.quizId });
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    await Quiz.findByIdAndUpdate(question.quizId, { totalMarks });

    return res.status(200).json({ success: true, message: 'Question updated', data: question });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const quizId = question.quizId;
    await Question.findByIdAndDelete(id);

    // Recalculate quiz total marks
    const allQuestions = await Question.find({ quizId });
    const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    await Quiz.findByIdAndUpdate(quizId, { totalMarks });

    return res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addQuestion, updateQuestion, deleteQuestion };
