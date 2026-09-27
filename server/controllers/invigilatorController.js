const Exam = require('../models/Exam');
const User = require('../models/User');
const StudentExamAttempt = require('../models/StudentExamStatus');
const TechnicalAssistance = require('../models/TechnicalAssistance');
const ActivityLog = require('../models/ActivityLog');

// Lazy-load io to avoid circular dependency at module load time
const getIo = () => {
  try { return require('../server').io; } catch { return null; }
};

// Helper: verify invigilator is assigned to exam
const verifyAssignment = async (examId, userId) => {
  const exam = await Exam.findById(examId);
  if (!exam) return { error: 'Exam not found', status: 404 };
  if (!exam.assignedInvigilator || exam.assignedInvigilator.toString() !== userId.toString()) {
    return { error: 'You are not assigned to this exam', status: 403 };
  }
  return { exam };
};

// @desc    Get exams assigned to this invigilator
// @route   GET /api/invigilator/exams
// @access  Private (Invigilator)
const getAssignedExams = async (req, res) => {
  try {
    const exams = await Exam.find({
      assignedInvigilator: req.user._id,
      status: { $in: ['published', 'locked', 'in_progress', 'completed'] },
    })
      .populate('createdBy', 'name email')
      .populate('questionPaperFile')
      .sort({ examDate: 1, startTime: 1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (error) {
    console.error('[Get Assigned Exams Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assigned exams', error: error.message });
  }
};

// @desc    Get students registered for an exam with attempt status (no answers)
// @route   GET /api/invigilator/exams/:examId/students
// @access  Private (Invigilator)
const getExamStudents = async (req, res) => {
  try {
    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    // Get all students in system (in a real system, students would be enrolled per exam)
    const students = await User.find({ role: 'student' }).select('name email _id');

    // Get all attempts for this exam
    const attempts = await StudentExamAttempt.find({ exam: exam._id })
      .select('-studentAnswers') // Never expose answers to invigilator
      .populate('student', 'name email');

    const attemptMap = new Map();
    attempts.forEach(a => attemptMap.set(a.student._id.toString(), a));

    const studentList = students.map(s => {
      const attempt = attemptMap.get(s._id.toString());
      return {
        _id: s._id,
        name: s.name,
        email: s.email,
        status: attempt ? attempt.status : 'not_started',
        verifiedAt: attempt ? attempt.verifiedAt : null,
        activatedAt: attempt ? attempt.activatedAt : null,
        startedAt: attempt ? attempt.startedAt : null,
        expiresAt: attempt ? attempt.expiresAt : null,
        submittedAt: attempt ? attempt.submittedAt : null,
        pauseEvents: attempt ? attempt.pauseEvents : [],
      };
    });

    res.json({ success: true, examId: exam._id, examTitle: exam.title, students: studentList });
  } catch (error) {
    console.error('[Get Exam Students Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

// @desc    Verify a student for an exam
// @route   POST /api/invigilator/exams/:examId/verify-student
// @access  Private (Invigilator)
const verifyStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    if (!['locked', 'in_progress'].includes(exam.status)) {
      return res.status(400).json({ success: false, message: `Exam must be locked or in_progress. Current: "${exam.status}"` });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid student' });
    }

    let attempt = await StudentExamAttempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) {
      attempt = await StudentExamAttempt.create({
        student: studentId, exam: exam._id,
        status: 'not_started',
        verifiedAt: new Date(),
      });
    } else {
      attempt.verifiedAt = new Date();
      await attempt.save();
    }

    await ActivityLog.create({
      user: req.user._id, action: 'STUDENT_VERIFIED',
      details: `Invigilator verified student "${student.name}" for exam "${exam.title}"`,
      examId: exam._id, studentId: student._id, invigilatorId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Student "${student.name}" verified successfully`,
      attempt: { _id: attempt._id, status: attempt.status, verifiedAt: attempt.verifiedAt },
    });
  } catch (error) {
    console.error('[Verify Student Error]', error);
    res.status(500).json({ success: false, message: 'Failed to verify student', error: error.message });
  }
};

// @desc    Activate a student's exam session
// @route   POST /api/invigilator/exams/:examId/activate-student
// @access  Private (Invigilator)
const activateStudentExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    if (!['locked', 'in_progress'].includes(exam.status)) {
      return res.status(400).json({ success: false, message: `Exam must be locked or in_progress. Current: "${exam.status}"` });
    }

    let attempt = await StudentExamAttempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) {
      return res.status(400).json({ success: false, message: 'Student must be verified first' });
    }
    if (!attempt.verifiedAt) {
      return res.status(400).json({ success: false, message: 'Student must be verified before activation' });
    }
    if (['active', 'submitted', 'auto_closed'].includes(attempt.status)) {
      return res.status(400).json({ success: false, message: `Cannot activate. Current status: "${attempt.status}"` });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + exam.duration * 60000);

    attempt.status = 'active';
    attempt.activatedBy = req.user._id;
    attempt.activatedAt = now;
    attempt.startedAt = now;
    attempt.expiresAt = expiresAt;
    await attempt.save();

    // Transition exam to in_progress if not already
    if (exam.status === 'locked') {
      exam.status = 'in_progress';
      await exam.save();
    }

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_ACTIVATED',
      details: `Activated exam session for student (ID: ${studentId}) on exam "${exam.title}"`,
      examId: exam._id, studentId, invigilatorId: req.user._id,
      ipAddress: req.ip,
    });

    // ── Real-Time: Push access grant directly to student's browser ────────────
    // The student does NOT need to refresh, click, or manually navigate.
    // Their authenticated socket room receives this event and the frontend
    // automatically transitions them into the exam interface.
    const io = getIo();
    if (io) {
      io.to(`student:${studentId}`).emit('STUDENT_ACCESS_GRANTED', {
        examId: exam._id.toString(),
        examTitle: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        invigilatorName: req.user.name,
        message: 'Access granted by invigilator. Entering examination...',
      });
      console.log(`[Socket] STUDENT_ACCESS_GRANTED emitted → room student:${studentId}`);
    } else {
      console.warn('[Socket] io not available — real-time event not sent');
    }

    res.json({
      success: true,
      message: 'Student exam session activated',
      attempt: {
        _id: attempt._id, status: attempt.status,
        startedAt: attempt.startedAt, expiresAt: attempt.expiresAt,
      },
    });
  } catch (error) {
    console.error('[Activate Student Error]', error);
    res.status(500).json({ success: false, message: 'Failed to activate student exam', error: error.message });
  }
};

// @desc    Get live monitoring data for an exam (no answers)
// @route   GET /api/invigilator/exams/:examId/monitor
// @access  Private (Invigilator)
const getExamMonitoring = async (req, res) => {
  try {
    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const attempts = await StudentExamAttempt.find({ exam: exam._id })
      .select('-studentAnswers')
      .populate('student', 'name email');

    const now = new Date();
    const monitorData = attempts.map(a => {
      let displayStatus = a.status;
      // Check if active but expired
      if (a.status === 'active' && a.expiresAt && now >= a.expiresAt) {
        displayStatus = 'auto_closed';
      }

      let timeRemaining = null;
      if (a.status === 'active' && a.expiresAt) {
        timeRemaining = Math.max(0, Math.floor((a.expiresAt.getTime() - now.getTime()) / 1000));
      }

      return {
        studentId: a.student._id,
        studentName: a.student.name,
        studentEmail: a.student.email,
        status: displayStatus,
        verifiedAt: a.verifiedAt,
        activatedAt: a.activatedAt,
        startedAt: a.startedAt,
        expiresAt: a.expiresAt,
        submittedAt: a.submittedAt,
        timeRemaining,
        pauseEvents: a.pauseEvents,
      };
    });

    // Summary stats
    const summary = {
      total: monitorData.length,
      not_started: monitorData.filter(m => m.status === 'not_started').length,
      active: monitorData.filter(m => m.status === 'active').length,
      paused: monitorData.filter(m => m.status === 'paused').length,
      submitted: monitorData.filter(m => m.status === 'submitted').length,
      auto_closed: monitorData.filter(m => m.status === 'auto_closed').length,
    };

    res.json({ success: true, exam: { _id: exam._id, title: exam.title, status: exam.status }, students: monitorData, summary });
  } catch (error) {
    console.error('[Monitor Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monitoring data', error: error.message });
  }
};

// @desc    Record a technical/accessibility issue
// @route   POST /api/invigilator/exams/:examId/technical-assistance
// @access  Private (Invigilator)
const recordTechnicalAssistance = async (req, res) => {
  try {
    const { studentId, issueType, description, actionTaken } = req.body;
    if (!studentId || !issueType || !description) {
      return res.status(400).json({ success: false, message: 'studentId, issueType, and description are required' });
    }

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const record = await TechnicalAssistance.create({
      student: studentId, exam: exam._id, invigilator: req.user._id,
      issueType, description, actionTaken: actionTaken || '',
    });

    await ActivityLog.create({
      user: req.user._id, action: 'TECHNICAL_ISSUE_RECORDED',
      details: `Technical issue "${issueType}" recorded for student (ID: ${studentId}) on exam "${exam.title}"`,
      examId: exam._id, studentId, invigilatorId: req.user._id,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Technical assistance recorded', record });
  } catch (error) {
    console.error('[Technical Assistance Error]', error);
    res.status(500).json({ success: false, message: 'Failed to record technical assistance', error: error.message });
  }
};

// @desc    Pause a student's exam
// @route   POST /api/invigilator/exams/:examId/pause-student
// @access  Private (Invigilator)
const pauseStudentExam = async (req, res) => {
  try {
    const { studentId, reason } = req.body;
    if (!studentId || !reason) {
      return res.status(400).json({ success: false, message: 'studentId and reason are required' });
    }

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const attempt = await StudentExamAttempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot pause. Current status: "${attempt.status}"` });
    }

    attempt.status = 'paused';
    attempt.pauseEvents.push({
      pausedAt: new Date(),
      pausedBy: req.user._id,
      reason,
    });
    await attempt.save();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_PAUSED',
      details: `Paused exam for student (ID: ${studentId}). Reason: ${reason}`,
      examId: exam._id, studentId, invigilatorId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Student exam paused', attempt: { status: attempt.status } });
  } catch (error) {
    console.error('[Pause Error]', error);
    res.status(500).json({ success: false, message: 'Failed to pause exam', error: error.message });
  }
};

// @desc    Resume a student's paused exam
// @route   POST /api/invigilator/exams/:examId/resume-student
// @access  Private (Invigilator)
const resumeStudentExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const attempt = await StudentExamAttempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.status !== 'paused') {
      return res.status(400).json({ success: false, message: `Cannot resume. Current status: "${attempt.status}"` });
    }

    // Find the last unfinished pause event and calculate extension
    const lastPause = attempt.pauseEvents[attempt.pauseEvents.length - 1];
    if (lastPause && !lastPause.resumedAt) {
      const now = new Date();
      const pausedDuration = now.getTime() - lastPause.pausedAt.getTime();
      lastPause.resumedAt = now;

      // Extend expiresAt by the paused duration
      if (attempt.expiresAt) {
        attempt.expiresAt = new Date(attempt.expiresAt.getTime() + pausedDuration);
      }
    }

    attempt.status = 'active';
    await attempt.save();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_RESUMED',
      details: `Resumed exam for student (ID: ${studentId})`,
      examId: exam._id, studentId, invigilatorId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({
      success: true, message: 'Student exam resumed',
      attempt: { status: attempt.status, expiresAt: attempt.expiresAt },
    });
  } catch (error) {
    console.error('[Resume Error]', error);
    res.status(500).json({ success: false, message: 'Failed to resume exam', error: error.message });
  }
};

// @desc    Exceptional closure of a student's exam
// @route   POST /api/invigilator/exams/:examId/close-student
// @access  Private (Invigilator)
const closeStudentExam = async (req, res) => {
  try {
    const { studentId, reason } = req.body;
    if (!studentId || !reason) {
      return res.status(400).json({ success: false, message: 'studentId and reason are required' });
    }

    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const attempt = await StudentExamAttempt.findOne({ student: studentId, exam: exam._id });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (['submitted', 'auto_closed'].includes(attempt.status)) {
      return res.status(400).json({ success: false, message: `Already closed. Status: "${attempt.status}"` });
    }

    attempt.status = 'auto_closed';
    attempt.submittedAt = new Date();
    await attempt.save();

    await ActivityLog.create({
      user: req.user._id, action: 'EXAM_CLOSED_BY_INVIGILATOR',
      details: `Invigilator closed exam for student (ID: ${studentId}). Reason: ${reason}`,
      examId: exam._id, studentId, invigilatorId: req.user._id,
      ipAddress: req.ip, metadata: { reason },
    });

    res.json({ success: true, message: 'Student exam closed', attempt: { status: attempt.status } });
  } catch (error) {
    console.error('[Close Student Error]', error);
    res.status(500).json({ success: false, message: 'Failed to close student exam', error: error.message });
  }
};

// @desc    Get post-exam report
// @route   GET /api/invigilator/exams/:examId/report
// @access  Private (Invigilator)
const getExamReport = async (req, res) => {
  try {
    const { exam, error, status } = await verifyAssignment(req.params.examId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const populatedExam = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .populate('assignedInvigilator', 'name email');

    const attempts = await StudentExamAttempt.find({ exam: exam._id })
      .select('-studentAnswers')
      .populate('student', 'name email');

    const technicalIssues = await TechnicalAssistance.find({ exam: exam._id })
      .populate('student', 'name email');

    const logs = await ActivityLog.find({ examId: exam._id })
      .sort({ timestamp: -1 })
      .limit(100);

    const summary = {
      registered: attempts.length,
      present: attempts.filter(a => a.activatedAt).length,
      absent: attempts.filter(a => !a.activatedAt).length,
      submitted: attempts.filter(a => a.status === 'submitted').length,
      auto_closed: attempts.filter(a => a.status === 'auto_closed').length,
      active: attempts.filter(a => a.status === 'active').length,
      paused: attempts.filter(a => a.status === 'paused').length,
      technicalIssues: technicalIssues.length,
      totalPauseEvents: attempts.reduce((sum, a) => sum + a.pauseEvents.length, 0),
    };

    res.json({
      success: true,
      report: {
        exam: {
          title: populatedExam.title,
          subject: populatedExam.subject,
          date: populatedExam.examDate,
          duration: populatedExam.duration,
          status: populatedExam.status,
          teacher: populatedExam.createdBy,
          invigilator: populatedExam.assignedInvigilator,
        },
        summary,
        students: attempts,
        technicalIssues,
        activityLogs: logs,
      },
    });
  } catch (error) {
    console.error('[Exam Report Error]', error);
    res.status(500).json({ success: false, message: 'Failed to generate report', error: error.message });
  }
};

module.exports = {
  getAssignedExams, getExamStudents, verifyStudent, activateStudentExam,
  getExamMonitoring, recordTechnicalAssistance,
  pauseStudentExam, resumeStudentExam, closeStudentExam, getExamReport,
};
