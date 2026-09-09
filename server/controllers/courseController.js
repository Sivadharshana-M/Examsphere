const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all courses/subjects
// @route   GET /api/courses
// @access  Private (authenticated)
const getCourses = async (req, res) => {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    const courses = await Course.find(query).populate('department', 'name code').sort({ name: 1 });
    res.json({ success: true, count: courses.length, courses });
  } catch (error) {
    console.error('[Get Courses Error]', error);
    res.status(500).json({ success: false, message: 'Server error fetching courses' });
  }
};

// @desc    Get a single course
// @route   GET /api/courses/:id
// @access  Private (college_admin, teacher)
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('department', 'name code');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching course' });
  }
};

// @desc    Create a course/subject
// @route   POST /api/courses
// @access  Private (college_admin)
const createCourse = async (req, res) => {
  try {
    const { name, code, description, department } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Course name and code are required' });
    }

    const course = await Course.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : '',
      department: department || null,
      createdBy: req.user._id,
      isActive: true,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'COURSE_CREATED',
      details: `Course/Subject created: ${course.name} (${course.code})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (error) {
    console.error('[Create Course Error]', error);
    res.status(500).json({ success: false, message: 'Server error creating course', error: error.message });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (college_admin)
const updateCourse = async (req, res) => {
  try {
    const { name, code, description, department } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description.trim();
    if (department !== undefined) updates.department = department || null;

    const course = await Course.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).populate('department', 'name code');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    res.json({ success: true, message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating course', error: error.message });
  }
};

// @desc    Toggle course active/inactive
// @route   PUT /api/courses/:id/toggle-status
// @access  Private (college_admin)
const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.isActive = !course.isActive;
    await course.save();
    res.json({ success: true, message: `Course ${course.isActive ? 'activated' : 'deactivated'}`, isActive: course.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error toggling course status' });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, toggleCourseStatus };
