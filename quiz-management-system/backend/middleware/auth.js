const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_assessment_system_2026');

    if (decoded.roleType !== 'ADMIN' && decoded.roleType !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || admin.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Account is inactive or no longer exists.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission to access this resource.' });
    }
    next();
  };
};

const authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_quiz_assessment_system_2026');

    if (decoded.roleType !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden. Student access required.' });
    }

    const student = await Student.findById(decoded.id);
    if (!student || student.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Student account is inactive or invalid.' });
    }

    req.student = student;
    req.assignmentToken = decoded.assignmentToken;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

module.exports = { authenticateAdmin, requireRole, authenticateStudent };
