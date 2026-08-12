const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Student = require('../models/Student');
const { formatIndianDateTime } = require('../utils/dateFormatter');

const generateCorporateResultEmail = ({
  studentName,
  studentEmail,
  quizTitle,
  obtainedMarks,
  totalMarks,
  percentage,
  passingPercentage,
  isPassed,
  submittedAt,
}) => {
  const submittedStr = formatIndianDateTime(submittedAt);

  if (isPassed) {
    return `Subject: Congratulations! Result for ${quizTitle} Assessment\n\nDear ${studentName},\n\nThank you for taking the ${quizTitle} assessment.\n\nWe are pleased to inform you that you have successfully PASSED the online technical evaluation.\n\nAssessment Details:\n- Candidate Name: ${studentName}\n- Candidate Email: ${studentEmail}\n- Assessment: ${quizTitle}\n- Completion Date & Time: ${submittedStr}\n- Score Obtained: ${obtainedMarks} / ${totalMarks}\n- Overall Percentage: ${percentage}%\n- Status: PASSED (Passing Criteria: ${passingPercentage}%)\n\nOur talent acquisition team will review your assessment performance and reach out to you shortly regarding the next interview round.\n\nBest Regards,\nAssessment & Recruitment Team`;
  } else {
    return `Subject: Update on your ${quizTitle} Assessment Result\n\nDear ${studentName},\n\nThank you for participating in the ${quizTitle} assessment.\n\nWe appreciate the effort and time you invested in taking this evaluation. After carefully evaluating your attempt, we regret to inform you that your score did not meet the passing criteria for this specific assessment.\n\nAssessment Details:\n- Candidate Name: ${studentName}\n- Candidate Email: ${studentEmail}\n- Assessment: ${quizTitle}\n- Completion Date & Time: ${submittedStr}\n- Status: FAILED (Passing Criteria: ${passingPercentage}%)\n\nWhile you were not selected for this position at this time, we encourage you to keep developing your skills and apply for future technical opportunities with us.\n\nWe wish you all the best in your career endeavors.\n\nBest Regards,\nAssessment & Recruitment Team`;
  }
};

// Get Paginated & Filtered Quiz Results for Admin
const getResults = async (req, res) => {
  try {
    const {
      search,
      quizId,
      quizType,
      status, // PASSED, FAILED, COMPLETED, EXPIRED
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (quizId) {
      query.quizId = quizId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const attempts = await QuizAttempt.find(query)
      .populate('studentId', 'name email')
      .populate('quizId', 'title quizType passingPercentage totalMarks')
      .sort({ createdAt: -1 });

    // Filter in-memory for populated fields and custom status filter
    let filtered = attempts.filter((att) => att.studentId && att.quizId);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (att) =>
          att.studentId.name.toLowerCase().includes(q) ||
          att.studentId.email.toLowerCase().includes(q) ||
          att.quizId.title.toLowerCase().includes(q)
      );
    }

    if (quizType) {
      filtered = filtered.filter((att) => att.quizId.quizType.toLowerCase() === quizType.toLowerCase());
    }

    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'PASSED') {
        filtered = filtered.filter(
          (att) => att.status === 'COMPLETED' && att.percentage >= (att.quizId.passingPercentage || 50)
        );
      } else if (upperStatus === 'FAILED') {
        filtered = filtered.filter(
          (att) => att.status === 'COMPLETED' && att.percentage < (att.quizId.passingPercentage || 50)
        );
      } else {
        filtered = filtered.filter((att) => att.status === upperStatus);
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const formattedData = paginated.map((att) => {
      const passingPercentage = att.quizId.passingPercentage || 50;
      const isPassed = att.percentage >= passingPercentage;
      const resultStatus = att.status === 'COMPLETED' ? (isPassed ? 'Passed' : 'Failed') : att.status;

      const resultEmailStatement = generateCorporateResultEmail({
        studentName: att.studentId.name,
        studentEmail: att.studentId.email,
        quizTitle: att.quizId.title,
        obtainedMarks: att.obtainedMarks,
        totalMarks: att.totalMarks || att.quizId.totalMarks,
        percentage: att.percentage,
        passingPercentage,
        isPassed,
        submittedAt: att.submittedAt || att.updatedAt,
      });

      return {
        attemptId: att._id,
        studentName: att.studentId.name,
        studentEmail: att.studentId.email,
        quizTitle: att.quizId.title,
        quizType: att.quizId.quizType,
        obtainedMarks: att.obtainedMarks,
        totalMarks: att.totalMarks || att.quizId.totalMarks,
        scoreText: `${att.obtainedMarks}/${att.totalMarks || att.quizId.totalMarks}`,
        percentage: `${att.percentage}%`,
        percentageNum: att.percentage,
        passingPercentage,
        resultStatus,
        attemptStatus: att.status,
        submittedAt: att.submittedAt || att.updatedAt,
        resultEmailStatement,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('[Get Results Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Detailed Single Attempt Analysis for Admin
const getAttemptAnalysis = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('studentId', 'name email')
      .populate('quizId', 'title description quizType duration passingPercentage totalMarks enableNegativeMarking');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const questions = await Question.find({ quizId: attempt.quizId._id }).sort({ order: 1 });

    const questionAnalysis = questions.map((q, index) => {
      const userAns = attempt.answers.find((a) => a.questionId.toString() === q._id.toString());
      const selectedOption = userAns ? userAns.selectedOption : '';
      const isAttempted = !!selectedOption;
      const isCorrect = isAttempted && selectedOption === q.correctAnswer;
      const isWrong = isAttempted && selectedOption !== q.correctAnswer;

      let marksEarned = 0;
      if (isCorrect) {
        marksEarned = q.marks || 1;
      } else if (isWrong && attempt.quizId.enableNegativeMarking) {
        marksEarned = -(q.negativeMarks || 0);
      }

      return {
        questionNumber: index + 1,
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: selectedOption || 'Skipped / Unanswered',
        result: isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Skipped',
        questionMarks: q.marks || 1,
        marksEarned,
        userStatus: userAns ? userAns.status : 'NOT_VISITED',
      };
    });

    const passingPercentage = attempt.quizId.passingPercentage || 50;
    const isPassed = attempt.percentage >= passingPercentage;

    const resultEmailStatement = generateCorporateResultEmail({
      studentName: attempt.studentId ? attempt.studentId.name : 'N/A',
      studentEmail: attempt.studentId ? attempt.studentId.email : 'N/A',
      quizTitle: attempt.quizId.title,
      obtainedMarks: attempt.obtainedMarks,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passingPercentage,
      isPassed,
      submittedAt: attempt.submittedAt || attempt.updatedAt,
    });

    return res.status(200).json({
      success: true,
      data: {
        attemptId: attempt._id,
        student: {
          name: attempt.studentId ? attempt.studentId.name : 'N/A',
          email: attempt.studentId ? attempt.studentId.email : 'N/A',
        },
        quiz: attempt.quizId,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        totalQuestions: attempt.totalQuestions,
        answeredQuestions: attempt.answeredQuestions,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.wrongAnswers,
        skippedQuestions: attempt.skippedQuestions,
        totalMarks: attempt.totalMarks,
        obtainedMarks: attempt.obtainedMarks,
        percentage: attempt.percentage,
        passingPercentage,
        resultStatus: isPassed ? 'PASSED' : 'FAILED',
        resultEmailStatement,
        questionAnalysis,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, getAttemptAnalysis };
