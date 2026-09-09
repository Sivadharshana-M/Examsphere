const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    default: null,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  invigilatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ examId: 1 });
ActivityLogSchema.index({ user: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
