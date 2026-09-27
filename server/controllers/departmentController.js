const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (college_admin, teacher, invigilator)
const getDepartments = async (req, res) => {
  try {
    const query = {};
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    const departments = await Department.find(query)
      .populate('headTeacher', 'name email')
      .sort({ name: 1 });
    res.json({ success: true, count: departments.length, departments });
  } catch (error) {
    console.error('[Get Departments Error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching departments' });
  }
};

// @desc    Get a single department
// @route   GET /api/departments/:id
// @access  Private (college_admin)
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('headTeacher', 'name email');
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, department });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching department' });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private (college_admin)
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, headTeacher } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required' });
    }

    const existing = await Department.findOne({ $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A department with this name or code already exists' });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      headTeacher: headTeacher || null,
      createdBy: req.user._id,
      isActive: true,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'DEPARTMENT_CREATED',
      details: `Department created: ${department.name} (${department.code})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Department created successfully', department });
  } catch (error) {
    console.error('[Create Department Error]', error);
    res.status(500).json({ success: false, message: 'Server error creating department', error: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private (college_admin)
const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, headTeacher } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description.trim();
    if (headTeacher !== undefined) updates.headTeacher = headTeacher || null;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('headTeacher', 'name email');

    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    await ActivityLog.create({
      user: req.user._id,
      action: 'DEPARTMENT_UPDATED',
      details: `Department updated: ${department.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Department updated successfully', department });
  } catch (error) {
    console.error('[Update Department Error]', error);
    res.status(500).json({ success: false, message: 'Server error updating department', error: error.message });
  }
};

// @desc    Toggle department active/inactive
// @route   PUT /api/departments/:id/toggle-status
// @access  Private (college_admin)
const toggleDepartmentStatus = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ success: false, message: 'Department not found' });

    department.isActive = !department.isActive;
    await department.save();

    await ActivityLog.create({
      user: req.user._id,
      action: department.isActive ? 'DEPARTMENT_ACTIVATED' : 'DEPARTMENT_DEACTIVATED',
      details: `Department ${department.isActive ? 'activated' : 'deactivated'}: ${department.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `Department ${department.isActive ? 'activated' : 'deactivated'}`, isActive: department.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error toggling department status' });
  }
};

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, toggleDepartmentStatus };
