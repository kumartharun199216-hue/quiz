const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const QuizAssignment = require('../models/QuizAssignment');
const { generateAssignmentToken, generateRandomPassword } = require('../utils/tokenGenerator');
const { sendQuizAssignmentEmail } = require('../services/emailService');

const { formatIndianDateTime } = require('../utils/dateFormatter');

const assignQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one student email address.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const results = [];

    for (const rawEmail of emails) {
      const email = rawEmail.trim().toLowerCase();
      if (!email || !email.includes('@')) continue;

      // 1. ALWAYS generate a fresh auto password for this assignment
      const generatedPassword = generateRandomPassword(10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(generatedPassword, salt);

      let student = await Student.findOne({ email });

      if (!student) {
        const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
        const studentName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

        student = await Student.create({
          name: studentName,
          email,
          passwordHash,
          status: 'ACTIVE',
        });
      } else {
        // Update student password with newly generated assignment password
        student.passwordHash = passwordHash;
        student.status = 'ACTIVE';
        await student.save();
      }

      // 2. Calculate 24-hour expiration
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 3. Create or update assignment
      let assignment = await QuizAssignment.findOne({ quizId, studentId: student._id });

      if (!assignment) {
        const assignmentToken = generateAssignmentToken();
        assignment = await QuizAssignment.create({
          quizId,
          studentId: student._id,
          email,
          assignmentToken,
          assignedAt: now,
          expiresAt,
          status: 'ACTIVE',
        });
      } else {
        assignment.assignedAt = now;
        assignment.expiresAt = expiresAt;
        assignment.status = 'ACTIVE';
        await assignment.save();
      }

      const quizLink = `${clientUrl}/quiz/${assignment.assignmentToken}`;

      // 4. Send email (if SMTP enabled)
      await sendQuizAssignmentEmail({
        studentEmail: email,
        studentPassword: generatedPassword,
        quizTitle: quiz.title,
        quizLink,
      });

      const assignedAtFormatted = formatIndianDateTime(now);
      const expiresAtFormatted = formatIndianDateTime(expiresAt);

      const emailStatement = `You have been invited to take a quiz.\n\nQuiz:\n${quiz.title}\n\nLogin Email:\n${email}\n\nPassword:\n${generatedPassword}\n\nQuiz Link:\n${quizLink}\n\nAssigned Date & Time:\n${assignedAtFormatted}\n\nAssignment Expiry Date & Time:\n${expiresAtFormatted} (Valid for 24 hours)`;

      results.push({
        email,
        studentId: student._id,
        assignmentId: assignment._id,
        token: assignment.assignmentToken,
        quizTitle: quiz.title,
        studentPassword: generatedPassword,
        assignedAt: now,
        expiresAt,
        quizLink,
        emailStatement,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Quiz assigned successfully to ${results.length} student(s).`,
      data: results,
    });
  } catch (error) {
    console.error('[Assign Quiz Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getQuizAssignments = async (req, res) => {
  try {
    const { quizId } = req.params;
    const assignments = await QuizAssignment.find({ quizId }).populate('studentId', 'name email status').sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentsList = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    const enriched = await Promise.all(
      students.map(async (s) => {
        const assignedCount = await QuizAssignment.countDocuments({ studentId: s._id });
        const completedCount = await QuizAssignment.aggregate([
          { $match: { studentId: s._id } },
          {
            $lookup: {
              from: 'quizattempts',
              localField: '_id',
              foreignField: 'assignmentId',
              as: 'attempts',
            },
          },
          { $match: { 'attempts.status': 'COMPLETED' } },
        ]);

        return {
          ...s.toObject(),
          assignedQuizzes: assignedCount,
          completedQuizzes: completedCount.length,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    student.status = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await student.save();

    return res.status(200).json({ success: true, message: `Student status set to ${student.status}`, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { assignQuiz, getQuizAssignments, getStudentsList, toggleStudentStatus };
