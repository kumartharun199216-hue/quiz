const mongoose = require('mongoose');

const SingleAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['NOT_VISITED', 'ANSWERED', 'REVIEW_LATER', 'SKIPPED'],
      default: 'NOT_VISITED',
    },
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizAssignment',
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'],
      default: 'NOT_STARTED',
    },
    currentQuestion: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [SingleAnswerSchema],
      default: [],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      default: 0,
    },
    skippedQuestions: {
      type: Number,
      default: 0,
    },
    reviewLaterQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
