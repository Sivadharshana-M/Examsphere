const Exam = require('../models/Exam');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const StudentExamAttempt = require('../models/StudentExamStatus');
const path = require('path');
const fs = require('fs');

// @desc    Create a new exam (DRAFT)
// @route   POST /api/exams
// @access  Private (College Admin)
const createExam = async (req, res) => {
  try {
    const {
      title, subject, description, classOrCourse,
      examDate, startTime, endTime, duration,
      totalMarks, instructions, rules, venue,
      allowedLanguages, accessibilityEnabled, questionPaperFile,
      questionPaperCreator, assignedInvigilator,
    } = req.body;

    if (!title || !subject || !examDate || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, examDate, startTime, endTime, duration',
      });
    }

    const dur = Number(duration);
    if (dur <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0' });
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins >= endMins) {
      return res.status(400).json({ success: false, message: 'Start time must be before end time' });
    }
    if (dur > (endMins - startMins)) {
      return res.status(400).json({ success: false, message: 'Duration cannot exceed the available exam window' });
    }

    const exam = await Exam.create({
      title, subject,
      description: description || '',
      classOrCourse: classOrCourse || '',
      examDate, startTime, endTime,
      duration: dur,
      totalMarks: Number(totalMarks) || 100,
      venue: venue || 'Room 204 (Main Academic Block)',
      instructions: instructions || 'Read all questions carefully. Voice navigation is available.',
      rules: rules || '',
      allowedLanguages: allowedLanguages || ['English'],
      accessibilityEnabled: accessibilityEnabled !== undefined ? Boolean(accessibilityEnabled) : true,
      questionPaperFile: questionPaperFile || null,
      questionPaperCreator: questionPaperCreator || null,
      assignedInvigilator: assignedInvigilator || null,
      status: 'draft',
      createdBy: req.user._id,
    });

    if (assignedInvigilator) {
      await User.findByIdAndUpdate(assignedInvigilator, { isInvigilator: true });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'EXAM_CREATED',
      details: `Created Exam: "${exam.title}" (${exam.subject}) scheduled on ${exam.examDate}`,
      examId: exam._id,
      ipAddress: req.ip,
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    res.status(201).json({
      success: true,
      message: 'Exam created as draft',
      exam: populatedExam,
    });
  } catch (error) {
    console.error('[Create Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }
};

// @desc    Get all exams for teachers to select when creating a question paper
// @route   GET /api/exams/all-for-teachers
// @access  Private (teacher)
const getAllExamsForTeacher = async (req, res) => {
  try {
    const exams = await Exam.find({})
      .select('title subject classOrCourse examDate startTime endTime duration totalMarks status venue instructions rules')
      .populate('createdBy', 'name')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get All Exams For Teacher Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

// @desc    Get exams assigned to teacher for Question Paper Preparation
// @route   GET /api/exams/teacher/qp-assignments
// @access  Private (teacher)
const getTeacherQPAssignmentExams = async (req, res) => {
  try {
    const exams = await Exam.find({
      $or: [
        { questionPaperCreator: req.user._id },
        { createdBy: req.user._id },
      ],
    })
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get Teacher QP Assignments Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch QP assignments', error: error.message });
  }
};

// @desc    Get exams assigned to teacher for Invigilation Duties
// @route   GET /api/exams/teacher/invigilation-duties
// @access  Private (teacher, invigilator)
const getTeacherInvigilationDuties = async (req, res) => {
  try {
    const exams = await Exam.find({
      assignedInvigilator: req.user._id,
    })
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile')
      .sort({ examDate: 1, startTime: 1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get Teacher Invigilation Duties Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invigilation duties', error: error.message });
  }
};

// @desc    Get exams (role-filtered)
// @route   GET /api/exams/admin/all
// @access  Private (college_admin)
const getAllExams = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get All Exams Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch all exams', error: error.message });
  }
};

// @desc    Get exams (role-filtered)
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'college_admin') {
      // College Admin sees all exams
    } else if (req.user.role === 'teacher' || req.user.role === 'invigilator') {
      filter.$or = [
        { questionPaperCreator: req.user._id },
        { createdBy: req.user._id },
        { assignedInvigilator: req.user._id },
      ];
    } else if (req.user.role === 'student') {
      filter.assignedStudents = req.user._id;
      filter.status = { $in: ['published', 'locked', 'in_progress', 'completed'] };
    }

    const exams = await Exam.find(filter)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get Exams Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({ success: true, exam });
  } catch (error) {
    console.error('[Get Exam By ID Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam details', error: error.message });
  }
};

// @desc    Update exam (DRAFT only)
// @route   PUT /api/exams/:id
// @access  Private (College Admin)
const updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (req.user.role !== 'college_admin' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this exam' });
    }
    if (exam.status !== 'draft') {
      return res.status(403).json({
        success: false,
        message: `Cannot edit exam in "${exam.status}" state. Only DRAFT exams can be edited.`,
      });
    }

    const {
      title, subject, description, classOrCourse,
      examDate, startTime, endTime, duration,
      totalMarks, instructions, rules, venue,
      allowedLanguages, accessibilityEnabled,
      questionPaperCreator, assignedInvigilator,
    } = req.body;

    if (startTime && endTime && duration) {
      const dur = Number(duration);
      if (dur <= 0) {
        return res.status(400).json({ success: false, message: 'Duration must be greater than 0' });
      }
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      if (sH * 60 + sM >= eH * 60 + eM) {
        return res.status(400).json({ success: false, message: 'Start time must be before end time' });
      }
      if (dur > (eH * 60 + eM - sH * 60 - sM)) {
        return res.status(400).json({ success: false, message: 'Duration cannot exceed the available exam window' });
      }
    }

    const fields = {};
    if (title) fields.title = title;
    if (subject) fields.subject = subject;
    if (description !== undefined) fields.description = description;
    if (classOrCourse !== undefined) fields.classOrCourse = classOrCourse;
    if (examDate) fields.examDate = examDate;
    if (startTime) fields.startTime = startTime;
    if (endTime) fields.endTime = endTime;
    if (duration) fields.duration = Number(duration);
    if (totalMarks) fields.totalMarks = Number(totalMarks);
    if (venue !== undefined) fields.venue = venue;
    if (instructions !== undefined) fields.instructions = instructions;
    if (rules !== undefined) fields.rules = rules;
    if (allowedLanguages) fields.allowedLanguages = allowedLanguages;
    if (accessibilityEnabled !== undefined) fields.accessibilityEnabled = Boolean(accessibilityEnabled);
    if (questionPaperCreator !== undefined) fields.questionPaperCreator = questionPaperCreator || null;
    if (assignedInvigilator !== undefined) fields.assignedInvigilator = assignedInvigilator || null;

    if (assignedInvigilator) {
      await User.findByIdAndUpdate(assignedInvigilator, { isInvigilator: true });
    }

    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true, runValidators: true })
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_UPDATED',
      details: `Updated Exam: "${updatedExam.title}" (ID: ${req.params.id})`,
      examId: exam._id, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Exam updated successfully', exam: updatedExam });
  } catch (error) {
    console.error('[Update Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
  }
};

// @desc    Delete exam (DRAFT only)
// @route   DELETE /api/exams/:id
// @access  Private (College Admin)
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    if (exam.status !== 'draft') {
      return res.status(403).json({
        success: false,
        message: `Cannot delete exam in "${exam.status}" state. Only DRAFT exams can be deleted.`,
      });
    }

    await exam.deleteOne();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_DELETED',
      details: `Deleted Exam: "${exam.title}" (ID: ${req.params.id})`,
      examId: exam._id, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('[Delete Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }
};

// @desc    Publish exam (draft → published)
// @route   PUT /api/exams/:id/publish
// @access  Private (College Admin)
const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.status !== 'draft') {
      return res.status(400).json({ success: false, message: `Cannot publish exam in "${exam.status}" state` });
    }

    exam.status = 'published';
    await exam.save();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_PUBLISHED',
      details: `Published Exam: "${exam.title}"`,
      examId: exam._id, ipAddress: req.ip,
    });

    const populated = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    res.json({ success: true, message: 'Exam published successfully', exam: populated });
  } catch (error) {
    console.error('[Publish Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to publish exam', error: error.message });
  }
};

// @desc    Lock exam (published → locked)
// @route   PUT /api/exams/:id/lock
// @access  Private (College Admin)
const lockExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.status !== 'published') {
      return res.status(400).json({ success: false, message: `Cannot lock exam in "${exam.status}" state. Must be published first.` });
    }

    exam.status = 'locked';
    await exam.save();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_LOCKED',
      details: `Locked Exam: "${exam.title}"`,
      examId: exam._id, ipAddress: req.ip,
    });

    const populated = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    res.json({ success: true, message: 'Exam locked successfully.', exam: populated });
  } catch (error) {
    console.error('[Lock Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to lock exam', error: error.message });
  }
};

// @desc    Assign invigilator to exam (College Admin)
// @route   PUT /api/exams/:id/assign-invigilator
// @access  Private (College Admin)
const assignInvigilator = async (req, res) => {
  try {
    const { invigilatorId, venue, instructions } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (venue !== undefined) exam.venue = venue;
    if (instructions !== undefined) exam.instructions = instructions;

    if (invigilatorId === null || invigilatorId === '') {
      exam.assignedInvigilator = undefined;
      await exam.save();
      await ActivityLog.create({
        user: req.user._id, action: 'INVIGILATOR_REMOVED',
        details: `Removed invigilator from exam "${exam.title}"`,
        examId: exam._id, ipAddress: req.ip,
      });
      const populated = await Exam.findById(exam._id)
        .populate('createdBy', 'name email')
        .populate('questionPaperCreator', 'name email department')
        .populate('questionPaperFile');
      return res.json({ success: true, message: `Invigilator assignment removed successfully`, exam: populated });
    }

    const invigilator = await User.findById(invigilatorId);
    if (!invigilator || !['teacher', 'invigilator'].includes(invigilator.role)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment. User not found or is not a teacher/invigilator.' });
    }

    // Duplicate Assignment Prevention
    if (exam.assignedInvigilator && exam.assignedInvigilator.toString() === invigilator._id.toString()) {
      return res.status(400).json({ success: false, message: 'This Invigilator is already assigned to this exam.' });
    }

    exam.assignedInvigilator = invigilator._id;
    await exam.save();

    // Set isInvigilator = true on user record
    invigilator.isInvigilator = true;
    await invigilator.save();

    await ActivityLog.create({
      user: req.user._id, action: 'INVIGILATOR_ASSIGNED',
      details: `Assigned invigilator "${invigilator.name}" to exam "${exam.title}"`,
      examId: exam._id, invigilatorId: invigilator._id, ipAddress: req.ip,
    });

    const populated = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department employeeId roll_no studentId role')
      .populate('questionPaperFile');

    res.json({ success: true, message: `Invigilator "${invigilator.name}" assigned to exam "${exam.title}" successfully`, exam: populated });
  } catch (error) {
    console.error('[Assign Invigilator Error]', error);
    res.status(500).json({ success: false, message: 'Failed to assign invigilator', error: error.message });
  }
};

// @desc    Assign Question Paper Creator to exam (College Admin)
// @route   PUT /api/exams/:id/assign-creator
// @access  Private (College Admin)
const assignQuestionPaperCreator = async (req, res) => {
  try {
    const { teacherId } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (teacherId === null || teacherId === '') {
      exam.questionPaperCreator = undefined;
      await exam.save();
      await ActivityLog.create({
        user: req.user._id, action: 'QP_CREATOR_REMOVED',
        details: `Removed Question Paper Creator from exam "${exam.title}"`,
        examId: exam._id, ipAddress: req.ip,
      });
      const populated = await Exam.findById(exam._id)
        .populate('createdBy', 'name email')
        .populate('assignedInvigilator', 'name email department');
      return res.json({ success: true, message: `Question Paper Creator removed successfully`, exam: populated });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'Invalid assignment. User not found or is not a teacher.' });
    }

    exam.questionPaperCreator = teacher._id;
    await exam.save();

    await ActivityLog.create({
      user: req.user._id, action: 'QP_CREATOR_ASSIGNED',
      details: `Assigned Question Paper Creator "${teacher.name}" to exam "${exam.title}"`,
      examId: exam._id, ipAddress: req.ip,
    });

    const populated = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('questionPaperCreator', 'name email department')
      .populate('assignedInvigilator', 'name email department')
      .populate('questionPaperFile');

    res.json({ success: true, message: `Question Paper Creator "${teacher.name}" assigned successfully`, exam: populated });
  } catch (error) {
    console.error('[Assign QP Creator Error]', error);
    res.status(500).json({ success: false, message: 'Failed to assign QP creator', error: error.message });
  }
};

// @desc    Get list of teachers & invigilators (for assignment dropdowns)
// @route   GET /api/exams/invigilators
// @access  Private (Teacher, College Admin)
const getInvigilators = async (req, res) => {
  try {
    const invigilators = await User.find({
      role: { $in: ['teacher', 'invigilator'] },
      isActive: true,
    }).select('name email department employeeId roll_no studentId role isInvigilator _id');
    res.json({ success: true, invigilators });
  } catch (error) {
    console.error('[Get Invigilators Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invigilators', error: error.message });
  }
};

// @desc    Download question paper file securely
// @route   GET /api/exams/:id/question-paper
// @access  Private
const getQuestionPaper = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questionPaperFile');
    if (!exam || !exam.questionPaperFile) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    let isAuthorized = false;

    if (req.user.role === 'college_admin') isAuthorized = true;
    if (req.user.role === 'teacher' || req.user.role === 'invigilator') {
      const isCreator = exam.createdBy && exam.createdBy.toString() === req.user._id.toString();
      const isQPCreator = exam.questionPaperCreator && exam.questionPaperCreator.toString() === req.user._id.toString();
      const isInvig = exam.assignedInvigilator && exam.assignedInvigilator.toString() === req.user._id.toString();
      if (isCreator || isQPCreator || isInvig) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this file' });
    }

    const filePath = path.join(__dirname, '..', exam.questionPaperFile.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('[Download File Error]', error);
    res.status(500).json({ success: false, message: 'Failed to download question paper', error: error.message });
  }
};

// @desc    Assign students to exam (College Admin only)
// @route   PUT /api/exams/:id/assign-students
// @access  Private (College Admin)
const assignStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds array is required' });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ success: false, message: 'One or more student IDs are invalid' });
    }

    exam.assignedStudents = studentIds;
    await exam.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'STUDENTS_ASSIGNED_TO_EXAM',
      details: `College Admin assigned ${studentIds.length} student(s) to exam "${exam.title}"`,
      examId: exam._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `${studentIds.length} student(s) assigned to exam successfully`, assignedCount: studentIds.length });
  } catch (error) {
    console.error('[Assign Students Error]', error);
    res.status(500).json({ success: false, message: 'Failed to assign students', error: error.message });
  }
};

// @desc    Get directory of invigilators with optional status filter (default: active users only)
// @route   GET /api/exams/invigilators-directory
// @access  Private (College Admin)
const getInvigilatorsDirectory = async (req, res) => {
  try {
    const { status } = req.query; // 'active' (default), 'inactive', 'all'
    const userFilter = {};

    if (status === 'inactive') {
      userFilter.isActive = false;
    } else if (status === 'all') {
      // include all
    } else {
      userFilter.isActive = true; // DEFAULT: ONLY ACTIVE USERS!
    }

    userFilter.$or = [{ role: 'invigilator' }, { isInvigilator: true }];

    // 1. Fetch users matching invigilator criteria
    const invigUsers = await User.find(userFilter)
      .select('name email department employeeId roll_no studentId role isActive isInvigilator')
      .lean();

    // 2. Fetch ALL exams with an assignedInvigilator
    const examsWithInvigilators = await Exam.find(
      { assignedInvigilator: { $exists: true, $ne: null } },
      { title: 1, subject: 1, examDate: 1, startTime: 1, endTime: 1, duration: 1, totalMarks: 1, venue: 1, status: 1, assignedInvigilator: 1 }
    ).populate('assignedInvigilator', 'name email department employeeId roll_no studentId role isActive isInvigilator').lean();

    const invigilatorMap = new Map();

    // Add provisioned invigilators to map
    for (const u of invigUsers) {
      const uId = u._id.toString();
      invigilatorMap.set(uId, {
        teacher: {
          _id: u._id,
          name: u.name,
          email: u.email,
          department: u.department || 'BCA',
          employeeId: u.employeeId || u.roll_no || u.studentId || '24suca51',
          role: u.role,
          isInvigilator: u.isInvigilator || u.role === 'invigilator',
          isActive: u.isActive !== undefined ? u.isActive : true,
        },
        assignedExams: [],
      });
    }

    // Add exams for assigned invigilators
    for (const exam of examsWithInvigilators) {
      if (!exam.assignedInvigilator) continue;
      const u = exam.assignedInvigilator;

      // Status filtering check
      if (status !== 'inactive' && status !== 'all' && u.isActive === false) continue;
      if (status === 'inactive' && u.isActive !== false) continue;

      const uId = u._id.toString();
      if (!invigilatorMap.has(uId)) {
        invigilatorMap.set(uId, {
          teacher: {
            _id: u._id,
            name: u.name,
            email: u.email,
            department: u.department || 'Faculty',
            employeeId: u.employeeId || u.roll_no || u.studentId || '--',
            role: u.role,
            isInvigilator: true,
            isActive: u.isActive !== undefined ? u.isActive : true,
          },
          assignedExams: [],
        });
      }

      invigilatorMap.get(uId).assignedExams.push({
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        venue: exam.venue || 'Room 204',
        status: exam.status,
      });
    }

    const invigilators = Array.from(invigilatorMap.values());
    res.json({ success: true, count: invigilators.length, invigilators });
  } catch (error) {
    console.error('[Get Invigilators Directory Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invigilators directory', error: error.message });
  }
};

module.exports = {
  createExam, getExams, getAllExams, getAllExamsForTeacher,
  getTeacherQPAssignmentExams, getTeacherInvigilationDuties,
  getExamById, updateExam, deleteExam,
  publishExam, lockExam, assignInvigilator, assignQuestionPaperCreator, assignStudents, getInvigilators,
  getInvigilatorsDirectory, getQuestionPaper,
};
