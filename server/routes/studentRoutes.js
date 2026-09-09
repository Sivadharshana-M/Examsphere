const express = require('express');
const router = express.Router();
const {
  getStudentExams,
  startExam,
  saveAnswers,
  submitExam,
} = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.use(protect, authorizeRoles('student'));

router.get('/exams', getStudentExams);
router.post('/start/:examId', startExam);
router.post('/save-answers/:examId', saveAnswers);
router.post('/submit/:examId', submitExam);

module.exports = router;
