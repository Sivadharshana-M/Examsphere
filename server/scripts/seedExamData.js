const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Exam = require('../models/Exam');
const QuestionPaper = require('../models/QuestionPaper');
const StudentExamAttempt = require('../models/StudentExamStatus');

const seedExamData = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected for exam seeding...');

    const teacher = await User.findOne({ email: 'teacher@examsphere.ai' });
    const invigilator = await User.findOne({ email: 'invigilator@examsphere.ai' });
    const student = await User.findOne({ email: 'student@examsphere.ai' });

    if (!teacher || !invigilator || !student) {
      console.error('Teacher, Invigilator, or Student demo user not found. Please run seedDemoAccounts.js first.');
      process.exit(1);
    }

    // 1. Create or Find Demo Exam
    let exam = await Exam.findOne({ examCode: 'AI-ACC-2026' });
    if (!exam) {
      exam = new Exam({
        title: 'Artificial Intelligence & Assistive Technologies Examination',
        subject: 'Artificial Intelligence',
        examCode: 'AI-ACC-2026',
        examDate: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '12:00',
        duration: 60,
        totalMarks: 50,
        passingMarks: 20,
        status: 'locked', // Ready for invigilator verification & activation
        assignedInvigilator: invigilator._id,
        assignedStudents: [student._id],
        createdBy: teacher._id,
        instructions: 'This is a voice-accessible examination. Answer all questions clearly. You may use voice commands to navigate, listen, dictate answers, and submit.',
      });
      await exam.save();
      console.log('Created Demo Exam:', exam.title);
    } else {
      exam.assignedInvigilator = invigilator._id;
      exam.assignedStudents = [student._id];
      exam.status = 'locked';
      await exam.save();
      console.log('Updated Demo Exam:', exam.title);
    }

    // 2. Create or Update Structured Question Paper
    let qp = await QuestionPaper.findOne({ exam: exam._id });
    const structuredQuestions = [
      {
        questionNumber: '1',
        questionText: 'What is the primary role of Speech-to-Text and Text-to-Speech in building accessible examination interfaces for visually impaired candidates?',
        type: 'short_answer',
        marks: 5,
        options: [],
        instructions: 'State at least two benefits for candidates.',
        order: 1,
      },
      {
        questionNumber: '2',
        questionText: 'Explain how WebSocket technology enables automatic session synchronization between an invigilator and a remote candidate without requiring manual page reloads.',
        type: 'long_answer',
        marks: 10,
        options: [],
        instructions: 'Describe the handshake, room isolation, and event emission flow.',
        order: 2,
      },
      {
        questionNumber: '3',
        questionText: 'Which Web API standard is used for client-side Speech Recognition in modern web browsers? Option A: Web Audio API, Option B: Web Speech API, Option C: Speech Synthesis API, Option D: WebRTC API.',
        type: 'mcq',
        marks: 2,
        options: [
          { label: 'A', text: 'Web Audio API' },
          { label: 'B', text: 'Web Speech API' },
          { label: 'C', text: 'Speech Synthesis API' },
          { label: 'D', text: 'WebRTC API' },
        ],
        instructions: 'Specify the correct option letter.',
        order: 3,
      },
      {
        questionNumber: '4',
        questionText: 'Describe three critical security and integrity measures implemented during an AI-assisted online examination.',
        type: 'long_answer',
        marks: 10,
        options: [],
        instructions: 'Include discussion on session locking and server-side timer validation.',
        order: 4,
      },
    ];

    if (!qp) {
      qp = new QuestionPaper({
        exam: exam._id,
        createdBy: teacher._id,
        title: 'AI & Assistive Technologies Question Paper',
        type: 'created',
        status: 'published',
        totalMarks: 27,
        sections: [
          {
            title: 'Section A - Core Concepts',
            instructions: 'Answer all questions in this section.',
            defaultMarks: 5,
            questions: structuredQuestions,
          },
        ],
      });
      await qp.save();
      console.log('Created Structured Question Paper with', structuredQuestions.length, 'questions');
    } else {
      qp.sections = [
        {
          title: 'Section A - Core Concepts',
          instructions: 'Answer all questions in this section.',
          defaultMarks: 5,
          questions: structuredQuestions,
        },
      ];
      qp.status = 'published';
      await qp.save();
      console.log('Updated Structured Question Paper with', structuredQuestions.length, 'questions');
    }

    // 3. Create or Reset StudentExamAttempt so Invigilator can verify & activate
    let attempt = await StudentExamAttempt.findOne({ student: student._id, exam: exam._id });
    if (!attempt) {
      attempt = new StudentExamAttempt({
        student: student._id,
        exam: exam._id,
        status: 'not_started',
        studentAnswers: new Map(),
      });
      await attempt.save();
      console.log('Created StudentExamAttempt in status: not_started');
    } else {
      attempt.status = 'not_started';
      attempt.verifiedAt = null;
      attempt.activatedAt = null;
      attempt.startedAt = null;
      attempt.expiresAt = null;
      attempt.submittedAt = null;
      attempt.studentAnswers = new Map();
      await attempt.save();
      console.log('Reset StudentExamAttempt to status: not_started');
    }

    console.log('======================================================');
    console.log('✅ Demo Exam Seeding Complete!');
    console.log('Exam Title:', exam.title);
    console.log('Exam ID:', exam._id.toString());
    console.log('Invigilator Email: invigilator@examsphere.ai (password: invigilator123)');
    console.log('Student Email: student@examsphere.ai (password: student123)');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedExamData();
