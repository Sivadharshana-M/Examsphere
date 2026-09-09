const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CourseSchema.index({ department: 1 });
CourseSchema.index({ isActive: 1 });
CourseSchema.index({ code: 1 });

module.exports = mongoose.model('Course', CourseSchema);
