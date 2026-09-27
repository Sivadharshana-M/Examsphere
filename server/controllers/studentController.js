const Exam = require('../models/Exam');
const QuestionPaper = require('../models/QuestionPaper');
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

// @desc    Get structured exam questions for voice navigation (correct answers stripped)
// @route   GET /api/student/exam/:examId/questions
// @access  Private (Student)
const getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const attempt = await StudentExamAttempt.findOne({
      student: req.user._id,
      exam: examId,
    });

    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Exam session not activated by invigilator.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Try finding QuestionPaper
    let qp = await QuestionPaper.findOne({ exam: examId });
    if (!qp && exam.questionPaperFile) {
      qp = await QuestionPaper.findById(exam.questionPaperFile);
    }

    // If no QuestionPaper found in DB, fallback to structured questions or default mock questions for testing
    let flatQuestions = [];
    let sectionsData = [];

    if (qp && qp.sections && qp.sections.length > 0) {
      qp.sections.forEach((sec, secIdx) => {
        const secQuestions = (sec.questions || []).map((q, qIdx) => {
          const sanitized = {
            _id: q._id ? q._id.toString() : `q_${secIdx}_${qIdx}`,
            questionNumber: q.questionNumber || `${flatQuestions.length + 1}`,
            questionText: q.questionText || '',
            type: q.type || 'short_answer',
            marks: q.marks || 2,
            options: (q.options || []).map(opt => ({ label: opt.label, text: opt.text })),
            instructions: q.instructions || '',
            sectionTitle: sec.title || `Section ${secIdx + 1}`,
            order: q.order || qIdx,
          };
          flatQuestions.push(sanitized);
          return sanitized;
        });

        sectionsData.push({
          title: sec.title,
          instructions: sec.instructions,
          questions: secQuestions,
        });
      });
    }

    // If no structured questions exist yet in QuestionPaper, create a clean default question paper so student voice exam works seamlessly
    if (flatQuestions.length === 0) {
      const defaultQuestions = [
        {
          _id: `${examId}_q1`,
          questionNumber: '1',
          questionText: `Explain the fundamental principles of ${exam.subject || 'this subject'}. Provide examples to support your answer.`,
          type: 'long_answer',
          marks: 10,
          options: [],
          instructions: 'Answer in clear, complete sentences.',
          sectionTitle: 'Section A - Descriptive Questions',
        },
        {
          _id: `${examId}_q2`,
          questionNumber: '2',
          questionText: 'What are the main advantages and challenges of applying artificial intelligence in examination systems?',
          type: 'short_answer',
          marks: 5,
          options: [],
          instructions: 'State at least three distinct points.',
          sectionTitle: 'Section A - Descriptive Questions',
        },
        {
          _id: `${examId}_q3`,
          questionNumber: '3',
          questionText: 'Which of the following is an accessibility requirement for visually impaired students? A: High contrast mode, B: Real-time voice interaction, C: Screen reader accessibility, D: All of the above.',
          type: 'mcq',
          marks: 2,
          options: [
            { label: 'A', text: 'High contrast mode' },
            { label: 'B', text: 'Real-time voice interaction' },
            { label: 'C', text: 'Screen reader accessibility' },
            { label: 'D', text: 'All of the above' },
          ],
          instructions: 'Select the best option (A, B, C, or D).',
          sectionTitle: 'Section B - Objective Questions',
        },
      ];
      flatQuestions = defaultQuestions;
      sectionsData = [{ title: 'Section A', questions: defaultQuestions }];
    }

    // Convert Map of student answers to plain JavaScript Object
    const savedAnswers = {};
    if (attempt.studentAnswers) {
      if (attempt.studentAnswers instanceof Map) {
        attempt.studentAnswers.forEach((val, key) => {
          savedAnswers[key] = val;
        });
      } else if (typeof attempt.studentAnswers === 'object') {
        Object.assign(savedAnswers, attempt.studentAnswers);
      }
    }

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        instructions: exam.instructions,
        totalMarks: exam.totalMarks,
        status: exam.status,
      },
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        activatedAt: attempt.activatedAt,
      },
      sections: sectionsData,
      questions: flatQuestions,
      savedAnswers,
    });
  } catch (error) {
    console.error('[Get Exam Questions Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve examination questions', error: error.message });
  }
};

// @desc    Save single question answer
// @route   POST /api/student/save-answer/:examId/:questionId
// @access  Private (Student)
const saveSingleAnswer = async (req, res) => {
  try {
    const { examId, questionId } = req.params;
    const { answer } = req.body;

    const attempt = await StudentExamAttempt.findOne({
      student: req.user._id,
      exam: examId,
    });

    if (!attempt || attempt.status !== 'active') {
      return res.status(400).json({ success: false, message: 'No active session found to save answer.' });
    }

    const now = new Date();
    if (attempt.expiresAt && now >= attempt.expiresAt) {
      attempt.status = 'auto_closed';
      attempt.submittedAt = attempt.expiresAt;
      await attempt.save();
      return res.status(403).json({ success: false, message: 'Session expired. Answers auto-closed.' });
    }

    if (!attempt.studentAnswers) {
      attempt.studentAnswers = new Map();
    }

    if (attempt.studentAnswers instanceof Map) {
      attempt.studentAnswers.set(questionId, String(answer ?? ''));
    } else {
      attempt.studentAnswers[questionId] = String(answer ?? '');
      attempt.markModified('studentAnswers');
    }

    await attempt.save();

    res.json({
      success: true,
      message: `Answer for question ${questionId} saved successfully.`,
      questionId,
      answer,
      savedAt: new Date(),
    });
  } catch (error) {
    console.error('[Save Single Answer Error]', error);
    res.status(500).json({ success: false, message: 'Failed to save answer', error: error.message });
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

    if (answers && typeof answers === 'object') {
      if (!attempt.studentAnswers) {
        attempt.studentAnswers = new Map();
      }
      Object.entries(answers).forEach(([k, v]) => {
        if (attempt.studentAnswers instanceof Map) {
          attempt.studentAnswers.set(k, String(v ?? ''));
        } else {
          attempt.studentAnswers[k] = String(v ?? '');
        }
      });
      attempt.markModified('studentAnswers');
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

    if (answers && typeof answers === 'object') {
      if (!attempt.studentAnswers) attempt.studentAnswers = new Map();
      Object.entries(answers).forEach(([k, v]) => {
        if (attempt.studentAnswers instanceof Map) {
          attempt.studentAnswers.set(k, String(v ?? ''));
        } else {
          attempt.studentAnswers[k] = String(v ?? '');
        }
      });
      attempt.markModified('studentAnswers');
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
  getExamQuestions,
  saveSingleAnswer,
  saveAnswers,
  submitExam,
};
