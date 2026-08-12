const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true, // e.g. 'A', 'B', 'C', 'D'
    },
    text: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [OptionSchema],
      validate: [
        function (val) {
          return val && val.length >= 2;
        },
        'At least two options are required',
      ],
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer key is required'],
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', QuestionSchema);
