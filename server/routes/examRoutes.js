const express = require('express');
const router = express.Router();
const {
  createExam,
  getExams,
  getAllExams,
  getAllExamsForTeacher,
  getTeacherQPAssignmentExams,
  getTeacherInvigilationDuties,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  lockExam,
  assignInvigilator,
  assignQuestionPaperCreator,
  assignStudents,
  getInvigilators,
  getInvigilatorsDirectory,
  getQuestionPaper,
} = require('../controllers/examController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Invigilator list — teacher and college_admin can fetch
router.get('/invigilators', protect, authorizeRoles('teacher', 'college_admin'), getInvigilators);

// Invigilators Directory — college_admin gets aggregated data of teachers assigned as invigilators
router.get('/invigilators-directory', protect, authorizeRoles('college_admin'), getInvigilatorsDirectory);

// College Admin — all exams overview
router.get('/admin/all', protect, authorizeRoles('college_admin'), getAllExams);

// All exams for teachers (to select when creating a question paper)
router.get('/all-for-teachers', protect, authorizeRoles('teacher'), getAllExamsForTeacher);

// Teacher Question Paper Preparation Assignments (strictly for authenticated teacher)
router.get('/teacher/qp-assignments', protect, authorizeRoles('teacher'), getTeacherQPAssignmentExams);

// Teacher Invigilation Duties (strictly for authenticated teacher)
router.get('/teacher/invigilation-duties', protect, authorizeRoles('teacher'), getTeacherInvigilationDuties);

// Standard exam CRUD
router.route('/')
  .get(protect, getExams)
  .post(protect, authorizeRoles('college_admin'), createExam);

router.route('/:id')
  .get(protect, getExamById)
  .put(protect, authorizeRoles('college_admin'), updateExam)
  .delete(protect, authorizeRoles('college_admin'), deleteExam);

// Exam workflow
router.put('/:id/publish', protect, authorizeRoles('college_admin'), publishExam);
router.put('/:id/lock', protect, authorizeRoles('college_admin'), lockExam);
router.put('/:id/assign-invigilator', protect, authorizeRoles('college_admin'), assignInvigilator);
router.put('/:id/assign-creator', protect, authorizeRoles('college_admin'), assignQuestionPaperCreator);
router.put('/:id/assign-students', protect, authorizeRoles('college_admin'), assignStudents);

// Question paper access (authenticated users with access to that exam)
router.get('/:id/question-paper', protect, getQuestionPaper);

module.exports = router;
