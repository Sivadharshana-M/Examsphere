import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, Clock, CheckCircle2, PlayCircle, Volume2, Sparkles, Award, AlertCircle } from 'lucide-react';
import { studentAPI } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const StudentDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const { speakText } = useAccessibility();

  const fetchStudentExams = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getStudentExams();
      setExams(res.data.exams || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load your examination list',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentExams();
  }, []);

  const handleSpeakExam = (exam) => {
    const speech = `Exam Title: ${exam.title}. Subject: ${exam.subject}. Scheduled Date: ${exam.examDate}. Duration: ${exam.duration} minutes. Status: ${exam.studentStatus}.`;
    speakText(speech);
  };

  const filteredExams = exams.filter((exam) => {
    if (activeTab === 'available') return exam.studentStatus === 'active';
    if (activeTab === 'completed') return exam.studentStatus === 'submitted' || exam.studentStatus === 'auto_closed';
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            Student Examination Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Accessible exam portal with voice navigation & screen-reader support
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => speakText(`Welcome to your Student Portal. You have ${exams.length} active or completed examinations.`)}
        >
          <Volume2 size={18} />
          <span>Read Dashboard Cues</span>
        </button>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {/* Navigation Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'all' })}
        >
          All Sessions ({exams.length})
        </button>
        <button
          className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'available' })}
        >
          Active Now ({exams.filter((e) => e.studentStatus === 'active').length})
        </button>
        <button
          className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'completed' })}
        >
          Completed ({exams.filter((e) => e.studentStatus === 'submitted' || e.studentStatus === 'auto_closed').length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching student examination schedules..." />
      ) : filteredExams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3>No active examination sessions found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Your assigned Invigilator must verify your candidate identity and activate your exam session before it appears here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredExams.map((exam) => {
            const isSubmitted = exam.studentStatus === 'submitted' || exam.studentStatus === 'auto_closed';
            const isActive = exam.studentStatus === 'active';

            return (
              <div
                key={exam._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  borderColor: isActive ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-active">{exam.subject}</span>
                    {isSubmitted ? (
                      <span className="badge badge-completed">
                        <CheckCircle2 size={12} /> {exam.studentStatus === 'auto_closed' ? 'Auto Closed' : 'Submitted'}
                      </span>
                    ) : isActive ? (
                      <span className="badge badge-upcoming" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                        Activated & Ready
                      </span>
                    ) : (
                      <span className="badge badge-expired">Pending Activation</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    {exam.title}
                  </h2>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {exam.instructions || 'No special instructions.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="var(--accent-cyan)" />
                      <span>{exam.examDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} color="var(--accent-emerald)" />
                      <span>{exam.duration} Minutes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={14} color="var(--accent-amber)" />
                      <span>{exam.totalMarks} Marks</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} color="var(--primary)" />
                      <span>Voice Ready</span>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSpeakExam(exam)}
                    title="Read Exam Audio Summary"
                    aria-label={`Read exam summary for ${exam.title}`}
                  >
                    <Volume2 size={18} />
                  </button>

                  {isSubmitted ? (
                    <button className="btn btn-secondary" disabled style={{ flex: 1 }}>
                      <CheckCircle2 size={18} />
                      <span>Submitted</span>
                    </button>
                  ) : isActive ? (
                    <Link
                      to={`/student/exam/take/${exam._id}`}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      <PlayCircle size={18} />
                      <span>Enter Exam Session</span>
                    </Link>
                  ) : (
                    <button className="btn btn-secondary" disabled style={{ flex: 1 }}>
                      <AlertCircle size={18} />
                      <span>Awaiting Invigilator</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
