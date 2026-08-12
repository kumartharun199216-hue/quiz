const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');

const getDashboardStats = async (req, res) => {
  try {
    const totalAttempts = await QuizAttempt.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalStudents = await Student.countDocuments();

    const completedAttempts = await QuizAttempt.find({ status: 'COMPLETED' }).populate('quizId', 'passingPercentage');
    const inProgressCount = await QuizAttempt.countDocuments({ status: 'IN_PROGRESS' });
    const expiredCount = await QuizAttempt.countDocuments({ status: 'EXPIRED' });

    let sumScorePercent = 0;
    let passedCount = 0;

    completedAttempts.forEach((att) => {
      sumScorePercent += att.percentage || 0;
      const passing = att.quizId ? att.quizId.passingPercentage || 50 : 50;
      if ((att.percentage || 0) >= passing) {
        passedCount++;
      }
    });

    const completedCount = completedAttempts.length;
    const averageScore = completedCount > 0 ? parseFloat((sumScorePercent / completedCount).toFixed(2)) : 0;
    const passPercentage = completedCount > 0 ? parseFloat(((passedCount / completedCount) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        totalQuizzes,
        totalStudents,
        averageScore,
        completedAttempts: completedCount,
        inProgressAttempts: inProgressCount,
        expiredAttempts: expiredCount,
        passPercentage,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
