const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const connectDB = require('../config/db');

const seedDemoAccounts = async () => {
  try {
    await connectDB();

    const users = [
      {
        name: 'System Administrator',
        email: 'overalladmin@examsphere.ai',
        password: 'admin123',
        role: 'overall_admin',
        phone: '+91 9000000000',
        schoolOrCollegeName: 'ExamSphere AI Platform',
        department: 'Platform Administration',
        designation: 'Overall Administrator',
      },
      {
        name: 'Dr. Subramanian V',
        email: 'instadmin@examsphere.ai',
        password: 'instadmin123',
        role: 'institution_admin',
        phone: '+91 9876500001',
        schoolOrCollegeName: 'Thiagarajar College of Arts and Science',
        institutionId: 'INST-TCA-001',
        department: 'Academic Affairs',
        designation: 'Dean of Examinations',
      },
      {
        name: 'Prof. Ramesh Sharma',
        email: 'teacher@examsphere.ai',
        password: 'teacher123',
        role: 'teacher',
        phone: '+91 9876543210',
        schoolOrCollegeName: 'Thiagarajar College of Arts and Science',
        institutionId: 'INST-TCA-001',
        employeeId: 'EMP-T-101',
        department: 'Computer Applications',
        designation: 'Associate Professor',
      },
      {
        name: 'Dr. Anita Verma',
        email: 'invigilator@examsphere.ai',
        password: 'invigilator123',
        role: 'invigilator',
        phone: '+91 9876543211',
        schoolOrCollegeName: 'Thiagarajar College of Arts and Science',
        institutionId: 'INST-TCA-001',
        employeeId: 'EMP-I-202',
        department: 'Examination Control Cell',
        designation: 'Senior Examination Officer',
      },
      {
        name: 'Kavya K',
        email: 'student@examsphere.ai',
        password: 'student123',
        role: 'student',
        phone: '+91 9876543212',
        schoolOrCollegeName: 'Thiagarajar College of Arts and Science',
        institutionId: 'INST-TCA-001',
        studentId: '24BCA001',
        department: 'Computer Applications',
        courseOrClass: 'BCA',
        year: 'Second Year',
        semester: 'Semester 3',
      },
    ];

    for (const u of users) {
      const existingUser = await User.findOne({ email: u.email });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);

      if (!existingUser) {
        await User.create({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          phone: u.phone,
          schoolOrCollegeName: u.schoolOrCollegeName,
          institutionId: u.institutionId || '',
          studentId: u.studentId || '',
          employeeId: u.employeeId || '',
          department: u.department || '',
          courseOrClass: u.courseOrClass || '',
          year: u.year || '',
          semester: u.semester || '',
          designation: u.designation || '',
        });
        console.log(`Created user: ${u.email} as ${u.role}`);
      } else {
        existingUser.name = u.name;
        existingUser.password = hashedPassword;
        existingUser.role = u.role;
        existingUser.phone = u.phone;
        existingUser.schoolOrCollegeName = u.schoolOrCollegeName;
        existingUser.institutionId = u.institutionId || '';
        existingUser.studentId = u.studentId || '';
        existingUser.employeeId = u.employeeId || '';
        existingUser.department = u.department || '';
        existingUser.courseOrClass = u.courseOrClass || '';
        existingUser.year = u.year || '';
        existingUser.semester = u.semester || '';
        existingUser.designation = u.designation || '';
        await existingUser.save();
        console.log(`User updated: ${u.email} (${u.role})`);
      }
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDemoAccounts();
