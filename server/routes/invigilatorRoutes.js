const express = require('express');
const router = express.Router();
const {
  getAssignedExams,
  getExamStudents,
  verifyStudent,
  activateStudentExam,
  getExamMonitoring,
  recordTechnicalAssistance,
  pauseStudentExam,
  resumeStudentExam,
  closeStudentExam,
  getExamReport,
} = require('../controllers/invigilatorController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect, authorizeRoles('invigilator'));

router.get('/exams', getAssignedExams);
router.get('/exams/:examId/students', getExamStudents);
router.post('/exams/:examId/verify-student', verifyStudent);
router.post('/exams/:examId/activate-student', activateStudentExam);
router.get('/exams/:examId/monitor', getExamMonitoring);
router.post('/exams/:examId/technical-assistance', recordTechnicalAssistance);
router.post('/exams/:examId/pause-student', pauseStudentExam);
router.post('/exams/:examId/resume-student', resumeStudentExam);
router.post('/exams/:examId/close-student', closeStudentExam);
router.get('/exams/:examId/report', getExamReport);

module.exports = router;
