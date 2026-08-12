const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Get all admins (SUPER_ADMIN only)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: admins });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create new Admin (SUPER_ADMIN only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'ADMIN',
      status: status || 'ACTIVE',
      isInitialSuperAdmin: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    // Protection rule: Initial Super Admin cannot be demoted or deactivated
    if (admin.isInitialSuperAdmin || admin.email === 'admin@quiz.com') {
      if (role && role !== 'SUPER_ADMIN') {
        return res.status(400).json({ success: false, message: 'The initial Super Admin role cannot be changed.' });
      }
      if (status && status !== 'ACTIVE') {
        return res.status(400).json({ success: false, message: 'The initial Super Admin cannot be deactivated.' });
      }
    }

    if (name) admin.name = name.trim();
    if (email) admin.email = email.toLowerCase().trim();
    if (role) admin.role = role;
    if (status) admin.status = status;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin updated successfully.',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle status (Activate/Deactivate)
const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    if (admin.isInitialSuperAdmin || admin.email === 'admin@quiz.com') {
      return res.status(400).json({ success: false, message: 'The initial Super Admin cannot be deactivated.' });
    }

    admin.status = status || (admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    await admin.save();

    return res.status(200).json({
      success: true,
      message: `Admin account ${admin.status.toLowerCase()}d successfully.`,
      data: { id: admin._id, status: admin.status },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password
const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return res.status(200).json({ success: true, message: 'Admin password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    if (admin.isInitialSuperAdmin || admin.email === 'admin@quiz.com') {
      return res.status(400).json({ success: false, message: 'The initial Super Admin cannot be deleted.' });
    }

    await Admin.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Admin deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  deleteAdmin,
};
