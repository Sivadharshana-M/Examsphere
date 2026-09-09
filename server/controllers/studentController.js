const Exam = require('../models/Exam');
const StudentExamAttempt = require('../models/StudentExamStatus');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get exams accessible to student (must have an active/submitted/auto_closed attempt or published/locked/in_progress exam)
// @route   GET /api/student/exams
// @access  Private (Student)
const getStudentExams = async (req, res) => {
  try {
    const attempts = await StudentExamAttempt.find({ student: req.user._id })
      .populate({
        path: 'exam',
        populate: [
          { path: 'createdBy', select: 'name email' },
          { path: 'questionPaperFile' },
        ],
      });

    const enrichedExams = attempts
      .filter((attempt) => attempt.exam && attempt.exam.status !== 'cancelled' && attempt.exam.status !== 'draft')
      .map((attempt) => {
        const now = new Date();
        let displayStatus = attempt.status;
        if (attempt.status === 'active' && attempt.expiresAt && now >= attempt.expiresAt) {
          displayStatus = 'auto_closed';
        }

        return {
          ...attempt.exam.toObject(),
          studentStatus: displayStatus,
          attemptId: attempt._id,
          verifiedAt: attempt.verifiedAt,
          activatedAt: attempt.activatedAt,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          submittedAt: attempt.submittedAt,
        };
      });

    res.json({
      success: true,
      count: enrichedExams.length,
      exams: enrichedExams,
    });
  } catch (error) {
    console.error('[Student Exams Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student exams', error: error.message });
  }
};

// @desc    Access exam session (Student can ONLY access if session was activated by Invigilator)
// @route   POST /api/student/start/:examId
// @access  Private (Student)
const startExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate('questionPaperFile');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const attempt = await StudentExamAttempt.findOne({
      student: req.user._id,
      exam: examId,
    });

    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your examination session has not been activated by the Invigilator yet.',
      });
    }

    if (attempt.status === 'not_started') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Student verified but session has not been activated by the Invigilator.',
      });
    }

    if (attempt.status === 'paused') {
      return res.status(403).json({
        success: false,
        message: 'Examination Session Paused: The Invigilator has currently paused your exam session.',
      });
    }

    if (attempt.status === 'submitted' || attempt.status === 'auto_closed') {
      return res.status(403).json({
        success: false,
        message: 'Security Restriction: You have already submitted or completed this examination.',
      });
    }

    // Check timer expiration on server side
    const now = new Date();
    if (attempt.expiresAt && now >= attempt.expiresAt) {
      attempt.status = 'auto_closed';
      attempt.submittedAt = attempt.expiresAt;
      await attempt.save();

      return res.status(403).json({
        success: false,
        message: 'Exam session duration has expired. Answers auto-closed.',
      });
    }

    res.json({
      success: true,
      message: 'Access granted to active examination session',
      examSession: attempt,
      exam,
    });
  } catch (error) {
    console.error('[Student Access Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to access exam session', error: error.message });
  }
};

// @desc    Save draft answers periodically
// @route   POST /api/student/save-answers/:examId
// @access  Private (Student)
const saveAnswers = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    const attempt = await StudentExamAttempt.findOne({
      student: req.user._id,
      exam: examId,
    });

    if (!attempt || attempt.status !== 'active') {
      return res.status(400).json({ success: false, message: 'No active session found to save answers.' });
    }

    const now = new Date();
    if (attempt.expiresAt && now >= attempt.expiresAt) {
      attempt.status = 'auto_closed';
      attempt.submittedAt = attempt.expiresAt;
      await attempt.save();
      return res.status(403).json({ success: false, message: 'Session expired. Answers auto-closed.' });
    }

    if (answers) {
      attempt.studentAnswers = answers;
      await attempt.save();
    }

    res.json({ success: true, message: 'Progress saved successfully.' });
  } catch (error) {
    console.error('[Save Answers Error]', error);
    res.status(500).json({ success: false, message: 'Failed to save answers', error: error.message });
  }
};

// @desc    Submit an exam
// @route   POST /api/student/submit/:examId
// @access  Private (Student)
const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;

    const attempt = await StudentExamAttempt.findOne({
      student: req.user._id,
      exam: examId,
    });

    if (!attempt) {
      return res.status(400).json({ success: false, message: 'Active exam session not found' });
    }

    if (attempt.status === 'submitted' || attempt.status === 'auto_closed') {
      return res.status(400).json({ success: false, message: 'Exam is already submitted' });
    }

    const now = new Date();
    let isAutoClosed = false;
    if (attempt.expiresAt && now >= attempt.expiresAt) {
      isAutoClosed = true;
    }

    attempt.status = isAutoClosed ? 'auto_closed' : 'submitted';
    attempt.submittedAt = now;
    if (answers) {
      attempt.studentAnswers = answers;
    }
    await attempt.save();

    await ActivityLog.create({
      user: req.user._id,
      action: isAutoClosed ? 'EXAM_AUTO_CLOSED' : 'EXAM_SUBMITTED',
      details: `Exam ID ${examId} submitted by student ${req.user.email}`,
      examId,
      studentId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: isAutoClosed
        ? 'Exam duration expired. Answers submitted automatically.'
        : 'Exam submitted successfully!',
      statusRecord: attempt,
    });
  } catch (error) {
    console.error('[Submit Exam Error]', error);
    res.status(500).json({ success: false, message: 'Failed to submit exam', error: error.message });
  }
};

module.exports = {
  getStudentExams,
  startExam,
  saveAnswers,
  submitExam,
};
