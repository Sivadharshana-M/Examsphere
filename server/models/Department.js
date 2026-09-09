const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true,
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    trim: true,
    uppercase: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  headTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

DepartmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);
