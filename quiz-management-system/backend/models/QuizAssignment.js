const mongoose = require('mongoose');

const QuizAssignmentSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    assignmentToken: {
      type: String,
      required: true,
      unique: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QuizAssignment', QuizAssignmentSchema);
