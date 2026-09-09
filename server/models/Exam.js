const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam Title is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  courseRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
    trim: true,
  },
  departmentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  classOrCourse: {
    type: String,
    default: '',
    trim: true,
  },
  batch: {
    type: String,
    default: '',
    trim: true,
  },
  semester: {
    type: String,
    default: '',
    trim: true,
  },
  examDate: {
    type: String, // YYYY-MM-DD
    required: [true, 'Exam Date is required'],
  },
  startTime: {
    type: String, // HH:mm (24h)
    required: [true, 'Start Time is required'],
  },
  endTime: {
    type: String, // HH:mm (24h)
    required: [true, 'End Time is required'],
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: 1,
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total Marks is required'],
    default: 100,
  },
  passingMarks: {
    type: Number,
    default: null,
  },
  venue: {
    type: String,
    default: 'Room 204 (Main Academic Block)',
    trim: true,
  },
  instructions: {
    type: String,
    default: 'Please read each question carefully. Voice commands are active for accessibility.',
  },
  rules: {
    type: String,
    default: '',
  },
  allowedLanguages: {
    type: [String],
    default: ['English'],
  },
  accessibilityEnabled: {
    type: Boolean,
    default: true,
  },
  questionPaperFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadedFile',
    default: null,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'locked', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Teacher explicitly assigned to create/prepare the question paper
  questionPaperCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Teacher explicitly assigned as exam conductor / invigilator
  assignedInvigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Students explicitly assigned to this exam by College Admin
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ExamSchema.index({ createdBy: 1 });
ExamSchema.index({ questionPaperCreator: 1 });
ExamSchema.index({ assignedInvigilator: 1 });
ExamSchema.index({ status: 1 });
ExamSchema.index({ assignedStudents: 1 });
ExamSchema.index({ departmentRef: 1 });

module.exports = mongoose.model('Exam', ExamSchema);
