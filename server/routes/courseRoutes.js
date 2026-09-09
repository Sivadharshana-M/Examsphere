const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, toggleCourseStatus } = require('../controllers/courseController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, authorizeRoles('college_admin', 'teacher', 'invigilator', 'student'), getCourses);
router.get('/:id', protect, authorizeRoles('college_admin', 'teacher'), getCourseById);
router.post('/', protect, authorizeRoles('college_admin'), createCourse);
router.put('/:id', protect, authorizeRoles('college_admin'), updateCourse);
router.put('/:id/toggle-status', protect, authorizeRoles('college_admin'), toggleCourseStatus);

module.exports = router;
