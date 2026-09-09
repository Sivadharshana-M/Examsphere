const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadQuestionPaper, getUploadedFiles } = require('../controllers/uploadController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', protect, authorizeRoles('teacher'), upload.single('questionPaper'), uploadQuestionPaper);
router.get('/files', protect, authorizeRoles('teacher'), getUploadedFiles);

module.exports = router;
