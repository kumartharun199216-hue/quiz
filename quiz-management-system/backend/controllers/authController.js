const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const QuizAssignment = require('../models/QuizAssignment');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_assessment_system_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (admin.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact Super Admin.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, roleType: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        isInitialSuperAdmin: admin.isInitialSuperAdmin,
      },
    });
  } catch (error) {
    console.error('[Admin Login Error]', error);
    return res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// Student Login for Quiz Link
const studentLogin = async (req, res) => {
  try {
    const { email, password, assignmentToken } = req.body;

    if (!email || !password || !assignmentToken) {
      return res.status(400).json({ success: false, message: 'Email, password, and quiz token are required.' });
    }

    // 1. Validate Assignment
    const assignment = await QuizAssignment.findOne({ assignmentToken });
    if (!assignment || assignment.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Quiz assignment is invalid or no longer active.' });
    }

    // Validate 24-Hour Assignment Window Expiry
    const now = new Date();
    const assignmentExpiresAt = assignment.expiresAt || new Date(new Date(assignment.assignedAt).getTime() + 24 * 60 * 60 * 1000);
    if (now > assignmentExpiresAt) {
      assignment.status = 'EXPIRED';
      await assignment.save();
      return res.status(403).json({
        success: false,
        code: 'ASSIGNMENT_EXPIRED',
        message: 'Quiz Assignment Expired. The 24-hour window to take this assessment has passed. Please contact your administrator.',
      });
    }

    // Ensure student email matches assignment email
    if (assignment.email.toLowerCase() !== email.toLowerCase().trim()) {
      return res.status(401).json({ success: false, message: 'This quiz assignment is for a different email address.' });
    }

    // 2. Validate Student Credentials
    const student = await Student.findOne({ email: email.toLowerCase().trim() });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid student email or password.' });
    }

    const isMatch = await bcrypt.compare(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 3. Check existing attempt for this assignment
    const existingAttempt = await QuizAttempt.findOne({ assignmentId: assignment._id });

    if (existingAttempt) {
      if (existingAttempt.status === 'COMPLETED') {
        return res.status(403).json({
          success: false,
          code: 'QUIZ_COMPLETED',
          message: 'Quiz Already Completed. You have already completed this quiz. Multiple attempts are not allowed.',
        });
      }

      if (existingAttempt.status === 'EXPIRED') {
        return res.status(403).json({
          success: false,
          code: 'QUIZ_EXPIRED',
          message: 'Quiz Expired. The allowed time for this quiz has expired.',
        });
      }

      // If IN_PROGRESS, check if timer expired on server
      if (existingAttempt.status === 'IN_PROGRESS') {
        if (new Date() > new Date(existingAttempt.expiresAt)) {
          existingAttempt.status = 'EXPIRED';
          await existingAttempt.save();
          return res.status(403).json({
            success: false,
            code: 'QUIZ_EXPIRED',
            message: 'Quiz Expired. The allowed time for this quiz has expired.',
          });
        }
      }
    }

    const quiz = await Quiz.findById(assignment.quizId).select('title description duration passingPercentage totalMarks');

    const token = jwt.sign(
      {
        id: student._id,
        email: student.email,
        roleType: 'STUDENT',
        assignmentId: assignment._id,
        assignmentToken,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      assignment: {
        id: assignment._id,
        token: assignment.assignmentToken,
      },
      quiz: {
        id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration,
        totalMarks: quiz.totalMarks,
      },
      attemptStatus: existingAttempt ? existingAttempt.status : 'NOT_STARTED',
      attemptId: existingAttempt ? existingAttempt._id : null,
    });
  } catch (error) {
    console.error('[Student Login Error]', error);
    return res.status(500).json({ success: false, message: 'Server error during student login.' });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { adminLogin, studentLogin, logout };
