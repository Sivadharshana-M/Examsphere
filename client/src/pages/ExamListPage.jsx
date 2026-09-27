import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, UploadCloud, Calendar, Clock, BookOpen } from 'lucide-react';
import { examAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ExamListPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchExams = async () => {
    try {
      const res = await examAPI.getExams();
      setExams(res.data.exams || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch examination portfolio',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            Examination Portfolio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            All exams created and configured by you
          </p>
        </div>

        <Link to="/teacher/exams/create" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Create New Exam</span>
        </Link>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {loading ? (
        <LoadingSpinner text="Fetching examination portfolio..." />
      ) : exams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3>No examinations found</h3>
          <Link to="/teacher/exams/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <PlusCircle size={18} />
            <span>Create New Exam</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {exams.map((exam) => (
            <div key={exam._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-active">{exam.subject}</span>
                  <span className="badge" style={{ textTransform: 'uppercase' }}>{exam.status}</span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                  {exam.title}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="var(--accent-cyan)" />
                    <span>{exam.examDate}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} color="var(--accent-emerald)" />
                    <span>{exam.duration} Mins</span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                <Link to={`/teacher/exams/details/${exam._id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                  <FileText size={16} />
                  <span>Overview</span>
                </Link>
                {exam.status === 'draft' && (
                  <Link to={`/teacher/exams/edit/${exam._id}`} className="btn btn-primary" style={{ padding: '0.5rem 0.85rem' }}>
                    <span>Edit</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamListPage;
