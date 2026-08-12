const QuizAttempt = require('../models/QuizAttempt');
const QuizAssignment = require('../models/QuizAssignment');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Section = require('../models/Section');

// Start or Resume Attempt
const startAttempt = async (req, res) => {
  try {
    const studentId = req.student._id;
    const assignmentToken = req.assignmentToken || req.body.assignmentToken;

    if (!assignmentToken) {
      return res.status(400).json({ success: false, message: 'Assignment token is required.' });
    }

    const assignment = await QuizAssignment.findOne({ assignmentToken });
    if (!assignment || assignment.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Quiz assignment not found or inactive.' });
    }

    if (assignment.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to attempt this quiz assignment.' });
    }

    const quiz = await Quiz.findById(assignment.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // Check for existing attempt
    let attempt = await QuizAttempt.findOne({ assignmentId: assignment._id });

    if (attempt) {
      if (attempt.status === 'COMPLETED') {
        return res.status(403).json({
          success: false,
          code: 'QUIZ_COMPLETED',
          message: 'Quiz Already Completed. You have already completed this quiz. Multiple attempts are not allowed.',
        });
      }

      if (attempt.status === 'EXPIRED') {
        return res.status(403).json({
          success: false,
          code: 'QUIZ_EXPIRED',
          message: 'Quiz Expired. The allowed time for this quiz has expired.',
        });
      }

      // Check if active attempt has expired on the server
      if (attempt.status === 'IN_PROGRESS') {
        if (new Date() > new Date(attempt.expiresAt)) {
          attempt.status = 'EXPIRED';
          await attempt.save();
          return res.status(403).json({
            success: false,
            code: 'QUIZ_EXPIRED',
            message: 'Quiz Expired. The allowed time for this quiz has expired.',
          });
        }
        // RESUME EXISTING ATTEMPT
        return res.status(200).json({
          success: true,
          message: 'Resuming existing attempt.',
          attemptId: attempt._id,
          status: attempt.status,
        });
      }
    }

    // Start New Attempt
    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 });
    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'This quiz has no questions configured yet.' });
    }

    const now = new Date();
    const durationMs = quiz.duration * 60 * 1000;
    const expiresAt = new Date(now.getTime() + durationMs);

    const initialAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedOption: '',
      status: 'NOT_VISITED',
    }));

    attempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId,
      assignmentId: assignment._id,
      startedAt: now,
      expiresAt,
      status: 'IN_PROGRESS',
      currentQuestion: 0,
      answers: initialAnswers,
      totalQuestions: questions.length,
      answeredQuestions: 0,
      skippedQuestions: 0,
      reviewLaterQuestions: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Quiz started successfully.',
      attemptId: attempt._id,
      status: attempt.status,
    });
  } catch (error) {
    console.error('[Start Attempt Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Attempt State and Safe Questions (NO CORRECT ANSWERS!)
const getAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student._id;

    const attempt = await QuizAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found.' });
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this attempt.' });
    }

    // Server-side Timer Check
    if (attempt.status === 'IN_PROGRESS' && new Date() > new Date(attempt.expiresAt)) {
      attempt.status = 'EXPIRED';
      await attempt.save();
      return res.status(403).json({
        success: false,
        code: 'QUIZ_EXPIRED',
        message: 'Quiz Expired. The allowed time for this quiz has expired.',
      });
    }

    if (attempt.status === 'COMPLETED') {
      return res.status(403).json({
        success: false,
        code: 'QUIZ_COMPLETED',
        message: 'Quiz Already Completed.',
      });
    }

    const quiz = await Quiz.findById(attempt.quizId).select('title description duration allowBackNavigation hasSections');
    const sections = await Section.find({ quizId: attempt.quizId }).sort({ order: 1 });
    const rawQuestions = await Question.find({ quizId: attempt.quizId }).sort({ order: 1 });

    // STRIP CORRECT ANSWERS & MARKS FROM STUDENT PAYLOAD FOR SECURITY!
    const safeQuestions = rawQuestions.map((q) => ({
      _id: q._id,
      sectionId: q.sectionId,
      questionText: q.questionText,
      options: q.options,
      order: q.order,
    }));

    const remainingSeconds = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - new Date().getTime()) / 1000));

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        remainingSeconds,
        currentQuestion: attempt.currentQuestion,
        answers: attempt.answers,
        quiz,
        sections,
        questions: safeQuestions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save Answer (Auto-save)
const saveAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOption, status, currentQuestion } = req.body;
    const studentId = req.student._id;

    const attempt = await QuizAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized attempt update.' });
    }

    if (attempt.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Quiz already completed.' });
    }

    // Check timer expiration
    if (new Date() > new Date(attempt.expiresAt)) {
      attempt.status = 'EXPIRED';
      await attempt.save();
      return res.status(403).json({
        success: false,
        code: 'QUIZ_EXPIRED',
        message: 'Quiz Expired. The allowed time for this quiz has expired.',
      });
    }

    if (currentQuestion !== undefined) {
      attempt.currentQuestion = currentQuestion;
    }

    if (questionId) {
      const idx = attempt.answers.findIndex((a) => a.questionId.toString() === questionId.toString());
      if (idx !== -1) {
        if (selectedOption !== undefined) attempt.answers[idx].selectedOption = selectedOption;
        if (status) attempt.answers[idx].status = status;
      } else {
        attempt.answers.push({
          questionId,
          selectedOption: selectedOption || '',
          status: status || 'ANSWERED',
        });
      }
    }

    // Re-calculate answer status summary stats
    let answered = 0;
    let skipped = 0;
    let review = 0;

    attempt.answers.forEach((ans) => {
      if (ans.status === 'ANSWERED') answered++;
      else if (ans.status === 'SKIPPED') skipped++;
      else if (ans.status === 'REVIEW_LATER') review++;
    });

    attempt.answeredQuestions = answered;
    attempt.skippedQuestions = skipped;
    attempt.reviewLaterQuestions = review;

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: 'Answer saved successfully.',
      attemptId: attempt._id,
      answeredQuestions: attempt.answeredQuestions,
      skippedQuestions: attempt.skippedQuestions,
      reviewLaterQuestions: attempt.reviewLaterQuestions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Final Submit Quiz
const submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student._id;

    const attempt = await QuizAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    if (attempt.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized attempt submission.' });
    }

    if (attempt.status === 'COMPLETED') {
      return res.status(200).json({
        success: true,
        message: 'Quiz Submitted Successfully',
        status: 'COMPLETED',
      });
    }

    const quiz = await Quiz.findById(attempt.quizId);
    const questions = await Question.find({ quizId: attempt.quizId });

    // AUTHORITATIVE BACKEND SCORING CALCULATION
    let correctCount = 0;
    let wrongCount = 0;
    let answeredCount = 0;
    let skippedCount = 0;
    let reviewCount = 0;
    let totalMarksCalculated = 0;
    let obtainedMarksCalculated = 0;

    questions.forEach((q) => {
      const qMarks = q.marks || 1;
      const qNegativeMarks = quiz.enableNegativeMarking ? (q.negativeMarks || 0) : 0;
      totalMarksCalculated += qMarks;

      const userAns = attempt.answers.find((a) => a.questionId.toString() === q._id.toString());

      if (userAns && userAns.selectedOption && userAns.selectedOption !== '') {
        if (userAns.status === 'REVIEW_LATER') reviewCount++;
        else answeredCount++;

        if (userAns.selectedOption === q.correctAnswer) {
          correctCount++;
          obtainedMarksCalculated += qMarks;
        } else {
          wrongCount++;
          obtainedMarksCalculated -= qNegativeMarks;
        }
      } else {
        skippedCount++;
      }
    });

    obtainedMarksCalculated = Math.max(0, parseFloat(obtainedMarksCalculated.toFixed(2)));
    totalMarksCalculated = Math.max(1, parseFloat(totalMarksCalculated.toFixed(2)));
    const percentage = parseFloat(((obtainedMarksCalculated / totalMarksCalculated) * 100).toFixed(2));

    attempt.status = 'COMPLETED';
    attempt.submittedAt = new Date();
    attempt.answeredQuestions = answeredCount;
    attempt.skippedQuestions = skippedCount;
    attempt.reviewLaterQuestions = reviewCount;
    attempt.correctAnswers = correctCount;
    attempt.wrongAnswers = wrongCount;
    attempt.totalMarks = totalMarksCalculated;
    attempt.obtainedMarks = obtainedMarksCalculated;
    attempt.percentage = percentage;

    await attempt.save();

    // STRICT SECURITY RULE: DO NOT RETURN SCORE OR CORRECTNESS TO STUDENT!
    return res.status(200).json({
      success: true,
      message: 'Quiz Submitted Successfully',
      status: 'COMPLETED',
    });
  } catch (error) {
    console.error('[Submit Attempt Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startAttempt, getAttempt, saveAnswer, submitAttempt };
