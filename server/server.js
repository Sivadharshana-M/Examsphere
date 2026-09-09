const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { verifyEmailService } = require('./services/emailService');

// Connect to MongoDB Database
connectDB();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'ExamSphere AI Backend',
    module: 'Single-Institution 4-Role System',
    roles: ['college_admin', 'teacher', 'invigilator', 'student'],
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/question-papers', require('./routes/questionPaperRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/invigilator', require('./routes/invigilatorRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `API Endpoint ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 ExamSphere AI Server running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`🎓 Roles: college_admin | teacher | invigilator | student`);
  console.log(`====================================================`);
  await verifyEmailService();
});
