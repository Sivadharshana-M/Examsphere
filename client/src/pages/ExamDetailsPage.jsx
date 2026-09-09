import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, FileText, CheckCircle, Volume2, Globe, Shield, Download, Lock, UserCheck, UploadCloud, Search, X, ChevronDown, UserX, MapPin, UserPlus } from 'lucide-react';
import { examAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ExamDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTeacher, isCollegeAdmin } = useAuth();

  const [exam, setExam] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  
  // Invigilator Selection State
  const [selectedInvigilator, setSelectedInvigilator] = useState('');
  const [invigSearchTerm, setInvigSearchTerm] = useState('');
  const [isInvigDropdownOpen, setIsInvigDropdownOpen] = useState(false);
  const [isEditingConductor, setIsEditingConductor] = useState(false);

  // Question Paper Creator Selection State
  const [selectedQPCreator, setSelectedQPCreator] = useState('');
  const [creatorSearchTerm, setCreatorSearchTerm] = useState('');
  const [isCreatorDropdownOpen, setIsCreatorDropdownOpen] = useState(false);
  const [isEditingCreator, setIsEditingCreator] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [downloading, setDownloading] = useState(false);

  const fetchExamDetails = async () => {
    try {
      const res = await examAPI.getExamById(id);
      setExam(res.data.exam);
      if (res.data.exam.assignedInvigilator) {
        setSelectedInvigilator(res.data.exam.assignedInvigilator._id);
        setInvigSearchTerm(res.data.exam.assignedInvigilator.name || '');
      }
      if (res.data.exam.questionPaperCreator) {
        setSelectedQPCreator(res.data.exam.questionPaperCreator._id);
        setCreatorSearchTerm(res.data.exam.questionPaperCreator.name || '');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch exam details',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    if (!isCollegeAdmin) return;
    try {
      const res = await examAPI.getInvigilators();
      setTeachersList(res.data.invigilators || []);
    } catch (err) {
      console.error('Failed to load teachers', err);
    }
  };

  useEffect(() => {
    fetchExamDetails();
    fetchTeachers();
  }, [id]);

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await examAPI.publishExam(id);
      setNotification({ type: 'success', message: 'Exam published successfully!' });
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to publish exam' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async () => {
    if (!window.confirm('Locking will prevent any further edits to this exam. Continue?')) return;
    setActionLoading(true);
    try {
      await examAPI.lockExam(id);
      setNotification({ type: 'success', message: 'Exam locked successfully!' });
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to lock exam' });
    } finally {
      setActionLoading(false);
    }
  };

  // Invigilator assignment handlers
  const handleAssignInvigilator = async (e) => {
    if (e) e.preventDefault();
    if (!selectedInvigilator) return;
    setActionLoading(true);
    try {
      await examAPI.assignInvigilator(id, selectedInvigilator);
      setNotification({ type: 'success', message: 'Invigilator assigned successfully!' });
      setIsEditingConductor(false);
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to assign invigilator' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveInvigilator = async () => {
    if (!window.confirm('Are you sure you want to remove the assigned invigilator?')) return;
    setActionLoading(true);
    try {
      await examAPI.assignInvigilator(id, null);
      setNotification({ type: 'success', message: 'Invigilator removed successfully!' });
      setSelectedInvigilator('');
      setInvigSearchTerm('');
      setIsEditingConductor(false);
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to remove invigilator' });
    } finally {
      setActionLoading(false);
    }
  };

  // Question Paper Creator assignment handlers
  const handleAssignCreator = async (e) => {
    if (e) e.preventDefault();
    if (!selectedQPCreator) return;
    setActionLoading(true);
    try {
      await examAPI.assignQuestionPaperCreator(id, selectedQPCreator);
      setNotification({ type: 'success', message: 'Question Paper Creator assigned successfully!' });
      setIsEditingCreator(false);
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to assign QP creator' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCreator = async () => {
    if (!window.confirm('Are you sure you want to remove the assigned Question Paper Creator?')) return;
    setActionLoading(true);
    try {
      await examAPI.assignQuestionPaperCreator(id, null);
      setNotification({ type: 'success', message: 'Question Paper Creator removed successfully!' });
      setSelectedQPCreator('');
      setCreatorSearchTerm('');
      setIsEditingCreator(false);
      fetchExamDetails();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to remove QP creator' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadQuestionPaper = async () => {
    try {
      setDownloading(true);
      const res = await examAPI.downloadQuestionPaper(id);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exam.questionPaperFile?.originalName || 'question-paper');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to download question paper' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Fetching examination details..." />;
  if (!exam) return <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}><h2>Exam Not Found</h2></div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
            Exam Overview & Assignments
          </h1>
        </div>

        {/* Admin Lifecycle Buttons */}
        {isCollegeAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {exam.status === 'draft' && (
              <>
                <Link to={`/admin/exams/edit/${exam._id}`} className="btn btn-secondary">
                  <span>Edit Draft</span>
                </Link>
                <button type="button" className="btn btn-primary" onClick={handlePublish} disabled={actionLoading}>
                  <CheckCircle size={18} />
                  <span>Publish Exam</span>
                </button>
              </>
            )}

            {exam.status === 'published' && (
              <button type="button" className="btn btn-primary" onClick={handleLock} disabled={actionLoading}>
                <Lock size={18} />
                <span>Lock Exam Schedule</span>
              </button>
            )}
          </div>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-active">{exam.subject}</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
              {exam.title}
            </h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              {exam.status}
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {exam.description || 'No specific description provided.'}
        </p>

        {/* Schedule & Timing Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Calendar size={14} /> Date</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{exam.examDate}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Clock size={14} /> Time Window</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{exam.startTime} - {exam.endTime}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{exam.duration} Minutes</div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><MapPin size={14} /> Venue</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-amber)' }}>{exam.venue || 'Room 204'}</div>
          </div>
        </div>

        {/* ADMIN ASSIGNMENTS SECTION (Two Independent Roles) */}
        {isCollegeAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* 1. QUESTION PAPER CREATOR ASSIGNMENT */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <FileText size={18} />
                Question Paper Creator
              </h3>

              {exam.questionPaperCreator && !isEditingCreator ? (
                <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{exam.questionPaperCreator.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exam.questionPaperCreator.department || 'Faculty'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => setIsEditingCreator(true)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>Change</button>
                      <button onClick={handleRemoveCreator} className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search teacher for QP Creator..."
                      value={creatorSearchTerm}
                      onChange={(e) => {
                        setCreatorSearchTerm(e.target.value);
                        setIsCreatorDropdownOpen(true);
                      }}
                      onFocus={() => setIsCreatorDropdownOpen(true)}
                    />
                    <button onClick={handleAssignCreator} className="btn btn-primary" disabled={actionLoading || !selectedQPCreator} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
                      Assign
                    </button>
                  </div>

                  {isCreatorDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {teachersList.filter(t => (t.name || '').toLowerCase().includes(creatorSearchTerm.toLowerCase())).map(t => (
                        <div
                          key={t._id}
                          onClick={() => {
                            setSelectedQPCreator(t._id);
                            setCreatorSearchTerm(t.name);
                            setIsCreatorDropdownOpen(false);
                          }}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}
                        >
                          <strong style={{ color: 'var(--text-main)' }}>{t.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({t.department})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. ASSIGNED EXAM CONDUCTOR (INVIGILATOR) ASSIGNMENT */}
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)' }}>
                <Shield size={18} />
                Assigned Exam Conductor (Invigilator)
              </h3>

              {exam.assignedInvigilator && !isEditingConductor ? (
                <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{exam.assignedInvigilator.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exam.assignedInvigilator.department || 'Faculty'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => setIsEditingConductor(true)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>Change</button>
                      <button onClick={handleRemoveInvigilator} className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search teacher for Invigilator..."
                      value={invigSearchTerm}
                      onChange={(e) => {
                        setInvigSearchTerm(e.target.value);
                        setIsInvigDropdownOpen(true);
                      }}
                      onFocus={() => setIsInvigDropdownOpen(true)}
                    />
                    <button onClick={handleAssignInvigilator} className="btn btn-primary" disabled={actionLoading || !selectedInvigilator} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                      Assign
                    </button>
                  </div>

                  {isInvigDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {teachersList.filter(t => (t.name || '').toLowerCase().includes(invigSearchTerm.toLowerCase())).map(t => (
                        <div
                          key={t._id}
                          onClick={() => {
                            setSelectedInvigilator(t._id);
                            setInvigSearchTerm(t.name);
                            setIsInvigDropdownOpen(false);
                          }}
                          style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}
                        >
                          <strong style={{ color: 'var(--text-main)' }}>{t.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({t.department})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attached Question Paper */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Question Paper Document</h3>
          {exam.questionPaperFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={24} color="var(--accent-emerald)" />
                <div>
                  <div style={{ fontWeight: 700 }}>{exam.questionPaperFile.originalName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Format: {exam.questionPaperFile.fileType.toUpperCase()}
                  </div>
                </div>
              </div>
              <button onClick={handleDownloadQuestionPaper} disabled={downloading} className="btn btn-secondary">
                <Download size={16} /> {downloading ? 'Downloading...' : 'Download Paper'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>No question paper file attached to this draft exam yet.</span>
              {isTeacher && exam.status === 'draft' && (
                <Link to={`/teacher/upload?examId=${exam._id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem' }}>
                  <UploadCloud size={16} /> Attach Question Paper
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetailsPage;
