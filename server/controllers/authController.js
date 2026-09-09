const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Exam = require('../models/Exam');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper to sign JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'antigravity-jwt-secret-key-examsphere-2026', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ============================================================
// @desc    Register initial College Administrator (Public setup)
// @route   POST /api/auth/admin/register
// @access  Public
// ============================================================
const registerCollegeAdmin = async (req, res) => {
  try {
    const { name, email, password, institutionName, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'college_admin',
      institutionName: institutionName ? institutionName.trim() : 'ExamSphere AI College',
      phone: phone ? phone.trim() : '',
      isActive: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'College Administrator registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionName: user.institutionName,
      },
    });
  } catch (error) {
    console.error('[Register Admin Error]', error);
    res.status(500).json({ success: false, message: 'Server error during admin registration', error: error.message });
  }
};

// ============================================================
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact your college administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    await ActivityLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      details: `${user.role.toUpperCase()} logged in: ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        employeeId: user.employeeId,
        institutionName: user.institutionName,
      },
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// ============================================================
// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
// ============================================================
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('[Profile Error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile', error: error.message });
  }
};

// ============================================================
// @desc    Update user profile (WHITELISTED fields only)
// @route   PUT /api/auth/profile
// @access  Private
// ============================================================
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, phone, department, courseOrClass, batch, year, semester, designation } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (department !== undefined) updates.department = department.trim();

    if (user.role === 'student') {
      if (courseOrClass !== undefined) updates.courseOrClass = courseOrClass.trim();
      if (batch !== undefined) updates.batch = batch.trim();
      if (year !== undefined) updates.year = year.trim();
      if (semester !== undefined) updates.semester = semester.trim();
    } else {
      if (designation !== undefined) updates.designation = designation.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }).select('-password');

    await ActivityLog.create({
      user: req.user._id,
      action: 'PROFILE_UPDATED',
      details: `Profile updated for ${updatedUser.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
};

// ============================================================
// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'PASSWORD_CHANGED',
      details: `Password changed for ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Change Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error changing password', error: error.message });
  }
};

// ============================================================
// @desc    Forgot Password — generate token
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, password reset instructions have been set.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken,
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error generating password reset token', error: error.message });
  }
};

// ============================================================
// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
// ============================================================
const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error resetting password', error: error.message });
  }
};

// ============================================================
// @desc    Create a managed user (College Admin only)
// @route   POST /api/auth/admin/create-user
// @access  Private (College Admin)
// ============================================================
const createManagedUser = async (req, res) => {
  try {
    const {
      name, email, password, role, phone, studentId, employeeId,
      department, courseOrClass, batch, year, semester, designation, subjects
    } = req.body;

    if (!role || !['teacher', 'invigilator', 'student'].includes(role.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Role must be teacher, invigilator, or student' });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password' });
    }

    const targetEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: targetEmail });
    if (existingUser) {
      if (existingUser.isActive) {
        return res.status(400).json({ success: false, message: `An active account with email "${email}" already exists.` });
      } else {
        // Stale or soft-deleted account from past: remove permanently to free email
        const oldUserId = existingUser._id;
        await Exam.updateMany({ assignedInvigilator: oldUserId }, { $unset: { assignedInvigilator: '' } });
        await Exam.updateMany({ assignedQuestionPaperCreator: oldUserId }, { $unset: { assignedQuestionPaperCreator: '' } });
        await Exam.updateMany({ assignedStudents: oldUserId }, { $pull: { assignedStudents: oldUserId } });
        await User.findByIdAndDelete(oldUserId);
      }
    }

    const userCode = (employeeId || studentId || '').trim();
    if (userCode) {
      const existingCode = await User.findOne({
        $or: [
          { employeeId: userCode },
          { studentId: userCode },
        ],
        department: department ? department.trim() : 'BCA',
        isActive: true,
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: `An active user with ID/Roll No "${userCode}" already exists in ${department || 'this department'}.`,
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isInvig = role.toLowerCase() === 'invigilator';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role.toLowerCase(),
      isActive: true,
      isInvigilator: isInvig,
      phone: phone ? phone.trim() : '',
      studentId: studentId ? studentId.trim() : '',
      employeeId: employeeId ? employeeId.trim() : '',
      department: department ? department.trim() : '',
      courseOrClass: courseOrClass ? courseOrClass.trim() : '',
      batch: batch ? batch.trim() : '',
      year: year ? year.trim() : '',
      semester: semester ? semester.trim() : '',
      designation: designation ? designation.trim() : '',
      subjects: subjects ? subjects : [],
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'USER_CREATED_BY_ADMIN',
      details: `College Admin ${req.user.email} created ${user.role}: ${user.email}`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isInvigilator: user.isInvigilator,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        year: user.year,
      },
    });
  } catch (error) {
    console.error('[Create Managed User Error]', error);
    res.status(500).json({ success: false, message: 'Server error creating user', error: error.message });
  }
};

// ============================================================
// @desc    Get all managed users with filters (College Admin only)
// @route   GET /api/auth/admin/users
// @access  Private (College Admin)
// ============================================================
const getManagedUsers = async (req, res) => {
  try {
    const { role, department, year, search, status, isActive } = req.query;
    const query = {};

    // STATUS FILTER: By default, return ONLY ACTIVE users unless status param explicitly specifies 'inactive' or 'all'
    if (status === 'inactive' || isActive === 'false') {
      query.isActive = false;
    } else if (status === 'all') {
      // include both active and inactive
    } else {
      query.isActive = true; // DEFAULT: ACTIVE USERS ONLY!
    }

    if (role && ['teacher', 'invigilator', 'student'].includes(role.toLowerCase())) {
      const r = role.toLowerCase();
      if (r === 'invigilator') {
        query.$or = [{ role: 'invigilator' }, { isInvigilator: true }];
      } else {
        query.role = r;
      }
    } else {
      query.role = { $in: ['teacher', 'invigilator', 'student'] };
    }

    if (department) query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
    if (year) query.year = { $regex: new RegExp(`^${year.trim()}$`, 'i') };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex },
          { employeeId: searchRegex },
        ],
      });
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .populate('departmentRef', 'name code');

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('[Get Managed Users Error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

// ============================================================
// @desc    Get a single managed user by ID (College Admin only)
// @route   GET /api/auth/admin/users/:id
// @access  Private (College Admin)
// ============================================================
const getManagedUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('departmentRef', 'name code');
    if (!user || user.role === 'college_admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('[Get User By ID Error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};

// ============================================================
// @desc    Update a managed user (College Admin only)
// @route   PUT /api/auth/admin/users/:id
// @access  Private (College Admin)
// ============================================================
const updateManagedUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'college_admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name, phone, department, courseOrClass, batch, year, semester,
      designation, subjects, employeeId, studentId, role, isInvigilator
    } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (department !== undefined) updates.department = department.trim();
    if (employeeId !== undefined) updates.employeeId = employeeId.trim();
    if (studentId !== undefined) updates.studentId = studentId.trim();
    if (year !== undefined) updates.year = year.trim();
    if (semester !== undefined) updates.semester = semester.trim();
    if (courseOrClass !== undefined) updates.courseOrClass = courseOrClass.trim();
    if (designation !== undefined) updates.designation = designation.trim();
    if (subjects) updates.subjects = subjects;
    if (role && ['teacher', 'invigilator', 'student'].includes(role)) updates.role = role;
    if (isInvigilator !== undefined) updates.isInvigilator = Boolean(isInvigilator);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    await ActivityLog.create({
      user: req.user._id,
      action: 'USER_UPDATED_BY_ADMIN',
      details: `College Admin ${req.user.email} updated ${user.role}: ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('[Update Managed User Error]', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

// ============================================================
// @desc    Remove Teacher role from user (College Admin)
// @route   PUT /api/auth/admin/users/:id/remove-teacher-role
// @access  Private (College Admin)
// ============================================================
const removeTeacherRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isInvigilator || user.role === 'invigilator') {
      user.role = 'invigilator';
      user.isInvigilator = true;
      user.isActive = true;
      await user.save();
      return res.json({
        success: true,
        message: `Teacher role removed for "${user.name}". User remains an active Invigilator.`,
        user,
      });
    } else {
      user.isActive = false;
      await user.save();
      return res.json({
        success: true,
        message: `Teacher role removed for "${user.name}". User account deactivated as no active roles remain.`,
        user,
      });
    }
  } catch (error) {
    console.error('[Remove Teacher Role Error]', error);
    res.status(500).json({ success: false, message: 'Failed to remove Teacher role', error: error.message });
  }
};

// ============================================================
// @desc    Remove Invigilator capability/role from user (College Admin)
// @route   PUT /api/auth/admin/users/:id/remove-invigilator-role
// @access  Private (College Admin)
// ============================================================
const removeInvigilatorRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Unassign user from any active exams
    await Exam.updateMany(
      { assignedInvigilator: user._id },
      { $unset: { assignedInvigilator: '' } }
    );

    user.isInvigilator = false;

    if (user.role === 'teacher') {
      await user.save();
      return res.json({
        success: true,
        message: `Invigilator capability removed for "${user.name}". User remains an active Teacher.`,
        user,
      });
    } else {
      // Primary role was invigilator
      user.isActive = false;
      await user.save();
      return res.json({
        success: true,
        message: `Invigilator capability removed for "${user.name}". User account deactivated.`,
        user,
      });
    }
  } catch (error) {
    console.error('[Remove Invigilator Role Error]', error);
    res.status(500).json({ success: false, message: 'Failed to remove Invigilator role', error: error.message });
  }
};

// ============================================================
// @desc    Remove an individual managed user completely (College Admin only)
// @route   DELETE /api/auth/admin/users/:id
// @access  Private (College Admin)
// ============================================================
const removeManagedUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'college_admin' || user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be removed using user removal.' });
    }

    const userId = user._id;

    // 1. Clean up references in Exams (unassign from invigilation, QP creation, student list)
    await Exam.updateMany(
      { assignedInvigilator: userId },
      { $unset: { assignedInvigilator: '' } }
    );
    await Exam.updateMany(
      { assignedQuestionPaperCreator: userId },
      { $unset: { assignedQuestionPaperCreator: '' } }
    );
    await Exam.updateMany(
      { assignedStudents: userId },
      { $pull: { assignedStudents: userId } }
    );

    // 2. Clean up references in Departments / Courses if applicable
    const Department = require('../models/Department');
    const Course = require('../models/Course');
    await Department.updateMany(
      { headOfDepartment: userId },
      { $unset: { headOfDepartment: '' } }
    );
    await Course.updateMany(
      { facultyInCharge: userId },
      { $unset: { facultyInCharge: '' } }
    );

    // 3. Clean up student exam attempts/status if student
    if (user.role === 'student') {
      const StudentExamStatus = require('../models/StudentExamStatus');
      await StudentExamStatus.deleteMany({ student: userId });
    }

    // 4. Perform PERMANENT DELETION of the User document & authentication record
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        message: 'Unable to completely remove this user. The authentication account could not be deleted.',
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'USER_DELETED_PERMANENTLY',
      details: `College Admin ${req.user.email} permanently removed user: ${user.name} (${user.email})`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User '${user.name}' was permanently removed successfully.`,
    });
  } catch (error) {
    console.error('[Remove Managed User Error]', error);
    res.status(500).json({
      success: false,
      message: 'Unable to completely remove this user. The authentication account could not be deleted.',
      error: error.message,
    });
  }
};

// ============================================================
// @desc    Bulk remove users permanently (College Admin only)
// @route   POST /api/auth/admin/users/bulk-remove
// @access  Private (College Admin)
// ============================================================
const bulkRemoveUsers = async (req, res) => {
  try {
    const { userIds, department, year, role, removeAllMatching } = req.body;

    let targetIds = [];

    if (removeAllMatching) {
      const query = { role: { $in: ['teacher', 'invigilator', 'student'] } };
      if (department) query.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
      if (year) query.year = { $regex: new RegExp(`^${year.trim()}$`, 'i') };
      if (role && ['teacher', 'invigilator', 'student'].includes(role)) query.role = role;

      const matchingUsers = await User.find(query).select('_id role');
      targetIds = matchingUsers
        .filter(u => u.role !== 'college_admin' && u._id.toString() !== req.user._id.toString())
        .map(u => u._id);
    } else if (Array.isArray(userIds) && userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds }, role: { $ne: 'college_admin' } }).select('_id');
      targetIds = users.filter(u => u._id.toString() !== req.user._id.toString()).map(u => u._id);
    } else {
      return res.status(400).json({ success: false, message: 'No users specified for removal.' });
    }

    if (targetIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No eligible non-administrator users found matching criteria.' });
    }

    // Clean up exam references
    await Exam.updateMany(
      { assignedInvigilator: { $in: targetIds } },
      { $unset: { assignedInvigilator: '' } }
    );
    await Exam.updateMany(
      { assignedQuestionPaperCreator: { $in: targetIds } },
      { $unset: { assignedQuestionPaperCreator: '' } }
    );
    await Exam.updateMany(
      { assignedStudents: { $in: targetIds } },
      { $pull: { assignedStudents: { $in: targetIds } } }
    );

    const Department = require('../models/Department');
    const Course = require('../models/Course');
    await Department.updateMany(
      { headOfDepartment: { $in: targetIds } },
      { $unset: { headOfDepartment: '' } }
    );
    await Course.updateMany(
      { facultyInCharge: { $in: targetIds } },
      { $unset: { facultyInCharge: '' } }
    );

    const StudentExamStatus = require('../models/StudentExamStatus');
    await StudentExamStatus.deleteMany({ student: { $in: targetIds } });

    // Perform PERMANENT DELETION
    const deleteResult = await User.deleteMany({ _id: { $in: targetIds } });

    await ActivityLog.create({
      user: req.user._id,
      action: 'BULK_USERS_REMOVED',
      details: `College Admin ${req.user.email} bulk permanently removed ${deleteResult.deletedCount} user(s)`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Successfully permanently removed ${deleteResult.deletedCount} user(s).`,
      removedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('[Bulk Remove Users Error]', error);
    res.status(500).json({
      success: false,
      message: 'Unable to completely remove these users. The authentication accounts could not be deleted.',
      error: error.message
    });
  }
};

// ============================================================
// @desc    Toggle user active/inactive (College Admin only)
// @route   PUT /api/auth/admin/users/:id/toggle-status
// @access  Private (College Admin)
// ============================================================
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'college_admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      details: `College Admin ${req.user.email} ${user.isActive ? 'activated' : 'deactivated'} user: ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('[Toggle User Status Error]', error);
    res.status(500).json({ success: false, message: 'Failed to toggle user status', error: error.message });
  }
};

// ============================================================
// @desc    Reset a user's password (College Admin only)
// @route   PUT /api/auth/admin/users/:id/reset-password
// @access  Private (College Admin)
// ============================================================
const adminResetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.role === 'college_admin') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_PASSWORD_RESET',
      details: `College Admin ${req.user.email} reset password for: ${user.email}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User password reset successfully' });
  } catch (error) {
    console.error('[Admin Reset Password Error]', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
};

// ============================================================
// @desc    Get dashboard metrics & statistics for College Admin
// @route   GET /api/auth/admin/stats
// @access  Private (College Admin)
// ============================================================
const getAdminStats = async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalInvigilators = await User.countDocuments({
      $or: [{ role: 'invigilator' }, { isInvigilator: true }],
      isActive: true,
    });
    const recentActivity = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalTeachers,
        totalStudents,
        totalInvigilators,
        totalUsers: totalTeachers + totalStudents + totalInvigilators,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('[Get Admin Stats Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  }
};

// ============================================================
// @desc    Get system activity logs (College Admin only)
// @route   GET /api/auth/admin/activity
// @access  Private (College Admin)
// ============================================================
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('[Get Activity Logs Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs', error: error.message });
  }
};

module.exports = {
  registerCollegeAdmin,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  createManagedUser,
  getManagedUsers,
  getManagedUserById,
  updateManagedUser,
  removeTeacherRole,
  removeInvigilatorRole,
  removeManagedUser,
  bulkRemoveUsers,
  toggleUserStatus,
  adminResetPassword,
  getAdminStats,
  getActivityLogs,
};
