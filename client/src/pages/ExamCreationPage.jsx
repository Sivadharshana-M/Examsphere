import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Award, FileText, CheckCircle, ArrowLeft, Shield, UserCheck, MapPin } from 'lucide-react';
import { examAPI } from '../services/api';
import Notification from '../components/Notification';

const ExamCreationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    classOrCourse: '',
    venue: 'Room 204 (Main Academic Block)',
    examDate: '',
    startTime: '09:00',
    endTime: '12:00',
    duration: 180,
    totalMarks: 100,
    instructions: 'Read all questions carefully. Voice navigation is enabled.',
    rules: 'No external materials permitted. Technical issues must be reported to the invigilator.',
    questionPaperCreator: '',
    assignedInvigilator: '',
    allowedLanguages: ['English'],
    accessibilityEnabled: true,
  });

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await examAPI.getInvigilators();
        setTeachers(res.data.invigilators || []);
      } catch (err) {
        console.error('Failed to load teachers', err);
      }
    };
    fetchTeachers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await examAPI.createExam(formData);
      setNotification({
        type: 'success',
        message: 'Exam draft created successfully!',
      });
      setTimeout(() => {
        navigate(`/admin/exams/details/${res.data.exam._id}`);
      }, 1500);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create exam draft',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
          Create New Examination Schedule
        </h1>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Exam Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                placeholder="e.g. Internal Examination 1"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="subject">Subject / Discipline *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="form-input"
                placeholder="e.g. Java Programming"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="classOrCourse">Class / Course Code</label>
              <input
                type="text"
                id="classOrCourse"
                name="classOrCourse"
                className="form-input"
                placeholder="e.g. BCA 3rd Year"
                value={formData.classOrCourse}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="venue">Venue / Examination Hall</label>
              <input
                type="text"
                id="venue"
                name="venue"
                className="form-input"
                placeholder="e.g. Room 204 (Academic Block)"
                value={formData.venue}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="totalMarks">Total Marks *</label>
              <input
                type="number"
                id="totalMarks"
                name="totalMarks"
                className="form-input"
                value={formData.totalMarks}
                onChange={handleChange}
                min={1}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="examDate">Exam Date *</label>
              <input
                type="date"
                id="examDate"
                name="examDate"
                className="form-input"
                value={formData.examDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="startTime">Window Start *</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                className="form-input"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="endTime">Window End *</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                className="form-input"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="duration">Duration (Mins) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                className="form-input"
                value={formData.duration}
                onChange={handleChange}
                min={1}
                required
              />
            </div>
          </div>

          {/* Teacher Assignments Section */}
          <div style={{ background: 'rgba(99,102,241,0.06)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} /> Teacher Assignments (Separate Responsibilities)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="questionPaperCreator">Question Paper Creator (Teacher)</label>
                <select
                  id="questionPaperCreator"
                  name="questionPaperCreator"
                  className="form-input"
                  value={formData.questionPaperCreator}
                  onChange={handleChange}
                >
                  <option value="">-- Assign Teacher to Prepare Paper --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.department || 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="assignedInvigilator">Assigned Exam Conductor (Invigilator)</label>
                <select
                  id="assignedInvigilator"
                  name="assignedInvigilator"
                  className="form-input"
                  value={formData.assignedInvigilator}
                  onChange={handleChange}
                >
                  <option value="">-- Assign Teacher as Invigilator --</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.department || 'Faculty'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="instructions">Examination Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              className="form-textarea"
              rows={3}
              value={formData.instructions}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="rules">Examination Conduct Rules</label>
            <textarea
              id="rules"
              name="rules"
              className="form-textarea"
              rows={2}
              value={formData.rules}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle size={18} />
              <span>{loading ? 'Creating Draft...' : 'Save Draft Exam'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamCreationPage;
