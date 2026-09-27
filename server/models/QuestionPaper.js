const mongoose = require('mongoose');

// ── Option schema (for MCQ, True/False, Match Following, etc.) ───────────────
const OptionSchema = new mongoose.Schema({
  label: { type: String, required: true }, // A, B, C, D or 1, 2, 3
  text:  { type: String, default: '' },
}, { _id: false });

// ── Question schema ──────────────────────────────────────────────────────────
const QuestionSchema = new mongoose.Schema({
  questionNumber: { type: String, default: '' }, // e.g. "1", "2", "6(a)"
  questionText:   { type: String, default: '' },
  type: {
    type: String, // 'very_short_answer', 'short_answer', 'descriptive', 'long_answer', 'essay', 'mcq', 'true_false', 'fill_in_blank', 'match_following', 'numerical', 'coding', 'case_study', 'other'
    default: 'short_answer',
  },
  marks:         { type: Number, default: 2, min: 0 },
  options:       { type: [OptionSchema], default: [] },  // for MCQ / True-False / Options
  correctAnswer: { type: String, default: '' },
  difficulty:    { type: String, default: '' }, // easy, medium, hard
  instructions:  { type: String, default: '' }, // Optional question-level instructions
  order:         { type: Number, default: 0 },
}, { _id: true });

// ── Section schema ───────────────────────────────────────────────────────────
const SectionSchema = new mongoose.Schema({
  title:               { type: String, default: 'Section A' },
  instructions:        { type: String, default: '' }, // e.g. "Answer all questions" or "Answer any 5 questions"
  defaultMarks:        { type: Number, default: 2 },
  defaultQuestionType: { type: String, default: 'short_answer' },
  questionCount:       { type: Number, default: 0 }, // Total questions provided in section
  questionsToAnswer:   { type: Number, default: 0 }, // Questions student must answer (0 = answer all)
  sectionMarks:        { type: Number, default: 0 }, // Calculated section max marks contribution
  order:               { type: Number, default: 0 },
  questions:           { type: [QuestionSchema], default: [] },
}, { _id: true });

// ── QuestionPaper schema ─────────────────────────────────────────────────────
const QuestionPaperSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator (teacher) is required'],
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['created', 'uploaded'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'published'],
      default: 'draft',
    },
    // Structured question sections
    sections: {
      type: [SectionSchema],
      default: [],
    },
    // Reference to uploaded file (for type = 'uploaded')
    uploadedFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedFile',
      default: null,
    },
    // Computed maximum total marks across all sections
    totalMarks: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
QuestionPaperSchema.index({ exam: 1 });
QuestionPaperSchema.index({ createdBy: 1 });
QuestionPaperSchema.index({ status: 1 });
QuestionPaperSchema.index({ type: 1 });

// ── Virtual: total question count ───────────────────────────────────────────
QuestionPaperSchema.virtual('totalQuestions').get(function () {
  return this.sections.reduce((sum, s) => sum + s.questions.length, 0);
});

QuestionPaperSchema.set('toJSON', { virtuals: true });
QuestionPaperSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('QuestionPaper', QuestionPaperSchema);
