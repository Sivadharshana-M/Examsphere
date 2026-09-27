const express = require('express');
const router = express.Router();
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} = require('../controllers/departmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Read — accessible to all authenticated staff
router.get('/', protect, authorizeRoles('college_admin', 'teacher', 'invigilator', 'student'), getDepartments);
router.get('/:id', protect, authorizeRoles('college_admin', 'teacher'), getDepartmentById);

// Write — College Admin only
router.post('/', protect, authorizeRoles('college_admin'), createDepartment);
router.put('/:id', protect, authorizeRoles('college_admin'), updateDepartment);
router.put('/:id/toggle-status', protect, authorizeRoles('college_admin'), toggleDepartmentStatus);

module.exports = router;
