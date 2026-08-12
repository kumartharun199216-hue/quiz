const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    quizType: {
      type: String,
      default: 'Technical',
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    passingPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    hasSections: {
      type: Boolean,
      default: false,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    randomizeOptions: {
      type: Boolean,
      default: false,
    },
    allowBackNavigation: {
      type: Boolean,
      default: true,
    },
    enableNegativeMarking: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', QuizSchema);
