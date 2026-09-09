const mongoose = require('mongoose');

const TechnicalAssistanceSchema = new mongoose.Schema({
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
  invigilator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issueType: {
    type: String,
    enum: [
      'tts_audio',
      'microphone',
      'internet_connection',
      'browser_device',
      'accessibility',
      'other_technical',
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionTaken: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

TechnicalAssistanceSchema.index({ exam: 1 });
TechnicalAssistanceSchema.index({ student: 1, exam: 1 });

module.exports = mongoose.model('TechnicalAssistance', TechnicalAssistanceSchema);
