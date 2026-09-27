const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['college_admin', 'teacher', 'invigilator', 'student'],
    default: 'student',
    lowercase: true,
  },
  institutionName: {
    type: String,
    default: '',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isInvigilator: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  studentId: {
    type: String,
    default: '',
    trim: true,
  },
  employeeId: {
    type: String,
    default: '',
    trim: true,
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
  courseOrClass: {
    type: String,
    default: '',
    trim: true,
  },
  batch: {
    type: String,
    default: '',
    trim: true,
  },
  year: {
    type: String,
    default: '',
    trim: true,
  },
  semester: {
    type: String,
    default: '',
    trim: true,
  },
  designation: {
    type: String,
    default: '',
    trim: true,
  },
  subjects: {
    type: [String],
    default: [],
  },
  accessibilityPreferences: {
    fontSize: { type: String, default: 'normal' },
    highContrast: { type: Boolean, default: false },
    textToSpeechEnabled: { type: Boolean, default: true },
    speechRate: { type: Number, default: 1.0 },
    preferredLanguage: { type: String, default: 'English' },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isInvigilator: 1 });
UserSchema.index({ departmentRef: 1 });

module.exports = mongoose.model('User', UserSchema);
