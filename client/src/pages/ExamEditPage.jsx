import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { examAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ExamEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    classOrCourse: '',
    examDate: '',
    startTime: '',
    endTime: '',
    duration: 60,
    totalMarks: 100,
    instructions: '',
    rules: '',
  });

  const [examStatus, setExamStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await examAPI.getExamById(id);
        const exam = res.data.exam;
        setExamStatus(exam.status);
        setFormData({
          title: exam.title || '',
          subject: exam.subject || '',
          description: exam.description || '',
          classOrCourse: exam.classOrCourse || '',
          examDate: exam.examDate || '',
          startTime: exam.startTime || '',
          endTime: exam.endTime || '',
          duration: exam.duration || 60,
          totalMarks: exam.totalMarks || 100,
          instructions: exam.instructions || '',
          rules: exam.rules || '',
        });
      } catch (err) {
        setNotification({
          type: 'error',
          message: err.response?.data?.message || 'Failed to load exam details',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (examStatus !== 'draft') {
      setNotification({ type: 'error', message: 'Only DRAFT examinations can be edited.' });
      return;
    }

    setSubmitting(true);
    try {
      await examAPI.updateExam(id, formData);
      setNotification({ type: 'success', message: 'Exam draft updated successfully!' });
      setTimeout(() => navigate(`/admin/exams/details/${id}`), 1200);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update exam draft',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Fetching draft exam parameters..." />;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
          Edit Examination Draft
        </h1>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {examStatus !== 'draft' && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={24} color="var(--accent-rose)" />
          <div>
            <h4 style={{ fontWeight: 800, color: 'var(--accent-rose)' }}>Locked Examination</h4>
            <p style={{ fontSize: '0.85rem' }}>This exam is currently in "{examStatus.toUpperCase()}" status and cannot be modified.</p>
          </div>
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <fieldset disabled={examStatus !== 'draft'} style={{ border: 'none', padding: 0, margin: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Exam Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="form-input"
                  value={formData.subject}
                  onChange={handleChange}
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
                <label className="form-label" htmlFor="startTime">Start Time *</label>
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
                <label className="form-label" htmlFor="endTime">End Time *</label>
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

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="instructions">Instructions</label>
              <textarea
                id="instructions"
                name="instructions"
                className="form-textarea"
                rows={3}
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>

            {examStatus === 'draft' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={18} />
                  <span>{submitting ? 'Saving Changes...' : 'Save Draft Updates'}</span>
                </button>
              </div>
            )}
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default ExamEditPage;
