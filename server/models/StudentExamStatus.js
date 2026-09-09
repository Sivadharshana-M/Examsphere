const mongoose = require('mongoose');

const PauseEventSchema = new mongoose.Schema({
  pausedAt: { type: Date, required: true },
  resumedAt: { type: Date, default: null },
  pausedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
}, { _id: true });

const StudentExamAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  activatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['not_started', 'active', 'paused', 'submitted', 'auto_closed'],
    default: 'not_started',
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  activatedAt: {
    type: Date,
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  score: {
    type: Number,
    default: null,
  },
  studentAnswers: {
    type: Map,
    of: String,
    default: {},
  },
  pauseEvents: [PauseEventSchema],
}, { timestamps: true });

// Prevent duplicate attempts for same student and exam
StudentExamAttemptSchema.index({ student: 1, exam: 1 }, { unique: true });
StudentExamAttemptSchema.index({ exam: 1, status: 1 });

module.exports = mongoose.model('StudentExamAttempt', StudentExamAttemptSchema);
