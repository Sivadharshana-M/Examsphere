const path = require('path');
const UploadedFile = require('../models/UploadedFile');
const ActivityLog = require('../models/ActivityLog');

// @desc    Upload Question Paper File (PDF, DOC/DOCX, PNG/JPG)
// @route   POST /api/upload
// @access  Private (Teacher)
const uploadQuestionPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file attached or file format not allowed' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const uploadedFileRecord = await UploadedFile.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/${req.file.filename}`,
      fileType: fileExt,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'QUESTION_PAPER_UPLOADED',
      details: `Uploaded file "${req.file.originalname}" (${req.file.size} bytes)`,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Question paper uploaded successfully',
      file: uploadedFileRecord,
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ success: false, message: 'Failed to upload question paper file', error: error.message });
  }
};

// @desc    Get all uploaded files metadata owned by user
// @route   GET /api/upload/files
// @access  Private (Teacher)
const getUploadedFiles = async (req, res) => {
  try {
    const filter = req.user.role === 'teacher' ? { uploadedBy: req.user._id } : {};
    const files = await UploadedFile.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    console.error('[Get Files Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve uploaded files', error: error.message });
  }
};

module.exports = {
  uploadQuestionPaper,
  getUploadedFiles,
};
