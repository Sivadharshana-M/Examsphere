import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  PlayCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  Send,
} from 'lucide-react';
import { invigilatorAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const InvigilatorDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'assigned';

  const [assignedExams, setAssignedExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [monitorData, setMonitorData] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Assistance modal state
  const [assistanceModal, setAssistanceModal] = useState({ open: false, studentId: '', studentName: '' });
  const [assistanceForm, setAssistanceForm] = useState({ issueType: 'tts_audio', description: '', actionTaken: '' });

  // Pause modal state
  const [pauseModal, setPauseModal] = useState({ open: false, studentId: '', studentName: '' });
  const [pauseReason, setPauseReason] = useState('');

  const fetchAssignedExams = async () => {
    setLoading(true);
    try {
      const res = await invigilatorAPI.getAssignedExams();
      const exams = res.data.exams || [];
      setAssignedExams(exams);
      if (exams.length > 0 && !selectedExamId) {
        setSelectedExamId(exams[0]._id);
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to fetch assigned exams' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedExamId) return;
    try {
      const res = await invigilatorAPI.getExamStudents(selectedExamId);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonitoring = async () => {
    if (!selectedExamId) return;
    try {
      const res = await invigilatorAPI.getExamMonitoring(selectedExamId);
      setMonitorData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    if (!selectedExamId) return;
    try {
      const res = await invigilatorAPI.getExamReport(selectedExamId);
      setReportData(res.data.report);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      if (activeTab === 'verify' || activeTab === 'assigned') fetchStudents();
      if (activeTab === 'monitor') fetchMonitoring();
      if (activeTab === 'report') fetchReport();
    }
  }, [selectedExamId, activeTab]);

  // Polling for live monitoring tab
  useEffect(() => {
    if (activeTab !== 'monitor' || !selectedExamId) return;
    const interval = setInterval(fetchMonitoring, 5000);
    return () => clearInterval(interval);
  }, [activeTab, selectedExamId]);

  const handleVerifyStudent = async (studentId) => {
    setActionLoading(true);
    try {
      await invigilatorAPI.verifyStudent(selectedExamId, studentId);
      setNotification({ type: 'success', message: 'Student identity verified successfully.' });
      fetchStudents();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to verify student' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateSession = async (studentId) => {
    setActionLoading(true);
    try {
      await invigilatorAPI.activateStudentExam(selectedExamId, studentId);
      setNotification({ type: 'success', message: 'Student examination session activated! Server timer initialized.' });
      fetchStudents();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to activate session' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseSession = async () => {
    if (!pauseReason.trim()) return;
    setActionLoading(true);
    try {
      await invigilatorAPI.pauseStudentExam(selectedExamId, pauseModal.studentId, pauseReason);
      setNotification({ type: 'info', message: 'Student exam session paused.' });
      setPauseModal({ open: false, studentId: '', studentName: '' });
      setPauseReason('');
      fetchMonitoring();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to pause session' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSession = async (studentId) => {
    setActionLoading(true);
    try {
      await invigilatorAPI.resumeStudentExam(selectedExamId, studentId);
      setNotification({ type: 'success', message: 'Student exam session resumed.' });
      fetchMonitoring();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to resume session' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordAssistance = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await invigilatorAPI.recordTechnicalAssistance(selectedExamId, {
        studentId: assistanceModal.studentId,
        ...assistanceForm,
      });
      setNotification({ type: 'success', message: 'Technical assistance log saved.' });
      setAssistanceModal({ open: false, studentId: '', studentName: '' });
      setAssistanceForm({ issueType: 'tts_audio', description: '', actionTaken: '' });
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to log assistance' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSeconds = (sec) => {
    if (sec === null || sec === undefined) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            Invigilator Exam Conductor Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Verify students, activate sessions, monitor live conduct & log assistance
          </p>
        </div>

        {/* Selected Exam Selector */}
        {assignedExams.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Exam:</span>
            <select
              className="form-input"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.9rem', width: '250px' }}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {assignedExams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} ({exam.examDate})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn ${activeTab === 'assigned' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'assigned' })}
        >
          <BookOpen size={16} /> Assigned Exams ({assignedExams.length})
        </button>
        <button
          className={`btn ${activeTab === 'verify' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'verify' })}
        >
          <UserCheck size={16} /> Verification & Activation
        </button>
        <button
          className={`btn ${activeTab === 'monitor' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'monitor' })}
        >
          <Activity size={16} /> Live Monitoring
        </button>
        <button
          className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSearchParams({ tab: 'report' })}
        >
          <FileText size={16} /> Conduct Report
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching assigned examination datasets..." />
      ) : assignedExams.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
          <h3>No assigned examinations</h3>
          <p>You have not been assigned to conduct any published/locked examination sessions yet.</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Assigned Exams Cards */}
          {activeTab === 'assigned' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {assignedExams.map((exam) => (
                <div key={exam._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="badge badge-active">{exam.subject}</span>
                      <span className="badge" style={{ textTransform: 'uppercase', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>{exam.status}</span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                      {exam.title}
                    </h2>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Date: <strong>{exam.examDate}</strong> | Window: <strong>{exam.startTime} - {exam.endTime}</strong>
                    </p>
                  </div>

                  <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setSelectedExamId(exam._id);
                        setSearchParams({ tab: 'verify' });
                      }}
                    >
                      <UserCheck size={16} /> Conduct Exam Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Verification & Activation Workflow */}
          {activeTab === 'verify' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Student Verification & Activation</h2>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search candidate name..."
                    style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Student Candidate</th>
                      <th style={{ padding: '0.75rem' }}>Verification</th>
                      <th style={{ padding: '0.75rem' }}>Session Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Invigilator Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st) => (
                      <tr key={st._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.85rem' }}>
                          <div style={{ fontWeight: 700 }}>{st.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.email}</div>
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          {st.verifiedAt ? (
                            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={14} /> Verified ({new Date(st.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--accent-amber)', fontSize: '0.82rem' }}>Unverified</span>
                          )}
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{st.status}</span>
                        </td>

                        <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {!st.verifiedAt && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handleVerifyStudent(st._id)}
                                disabled={actionLoading}
                              >
                                <UserCheck size={14} /> Verify Candidate
                              </button>
                            )}

                            {st.verifiedAt && st.status === 'not_started' && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handleActivateSession(st._id)}
                                disabled={actionLoading}
                              >
                                <PlayCircle size={14} /> Activate Exam Session
                              </button>
                            )}

                            {st.status !== 'not_started' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => setAssistanceModal({ open: true, studentId: st._id, studentName: st.name })}
                              >
                                Log Tech Assistance
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Live Monitoring */}
          {activeTab === 'monitor' && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="var(--accent-cyan)" /> Live Candidate Monitoring Panel (No Answer Exposure)
                </h2>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={fetchMonitoring}>
                  <RefreshCw size={14} /> Refresh Stream
                </button>
              </div>

              {/* Status Summary Pills */}
              {monitorData?.summary && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ padding: '0.5rem 0.75rem' }}>Total: {monitorData.summary.total}</span>
                  <span className="badge" style={{ padding: '0.5rem 0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>Active: {monitorData.summary.active}</span>
                  <span className="badge" style={{ padding: '0.5rem 0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>Paused: {monitorData.summary.paused}</span>
                  <span className="badge" style={{ padding: '0.5rem 0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-cyan)' }}>Submitted: {monitorData.summary.submitted}</span>
                  <span className="badge" style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-rose)' }}>Auto Closed: {monitorData.summary.auto_closed}</span>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Student Candidate</th>
                      <th style={{ padding: '0.75rem' }}>Live Session Status</th>
                      <th style={{ padding: '0.75rem' }}>Server Time Remaining</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Invigilator Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitorData?.students?.map((s) => (
                      <tr key={s.studentId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.85rem' }}>
                          <div style={{ fontWeight: 700 }}>{s.studentName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.studentEmail}</div>
                        </td>

                        <td style={{ padding: '0.85rem' }}>
                          <span className="badge" style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>{s.status}</span>
                        </td>

                        <td style={{ padding: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: s.timeRemaining < 300 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                          <Clock size={14} style={{ marginRight: '0.35rem' }} />
                          {formatSeconds(s.timeRemaining)}
                        </td>

                        <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            {s.status === 'active' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                onClick={() => setPauseModal({ open: true, studentId: s.studentId, studentName: s.studentName })}
                              >
                                <PauseCircle size={14} /> Pause
                              </button>
                            )}

                            {s.status === 'paused' && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                onClick={() => handleResumeSession(s.studentId)}
                              >
                                <PlayCircle size={14} /> Resume
                              </button>
                            )}

                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              onClick={() => setAssistanceModal({ open: true, studentId: s.studentId, studentName: s.studentName })}
                            >
                              Log Issue
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Conduct Report */}
          {activeTab === 'report' && reportData && (
            <div className="glass-card">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
                Examination Conduct & Audit Summary
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Candidates</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{reportData.summary.registered}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Present Candidates</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{reportData.summary.present}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submitted</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{reportData.summary.submitted}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Technical Logs</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{reportData.summary.technicalIssues}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Logged Technical Assistance Events</h3>
              {reportData.technicalIssues?.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No technical issues logged for this exam session.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {reportData.technicalIssues.map((t) => (
                    <div key={t._id} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>Issue: {t.issueType} | Candidate: {t.student?.name}</div>
                      <div>{t.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Action Taken: {t.actionTaken || 'None recorded'} | Timestamp: {new Date(t.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Technical Assistance Modal */}
      {assistanceModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '450px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Log Assistance for {assistanceModal.studentName}
            </h3>
            <form onSubmit={handleRecordAssistance}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Issue Category</label>
                <select
                  className="form-input"
                  value={assistanceForm.issueType}
                  onChange={(e) => setAssistanceForm({ ...assistanceForm, issueType: e.target.value })}
                >
                  <option value="tts_audio">Audio / TTS Speech Problem</option>
                  <option value="microphone">Microphone Dictation Problem</option>
                  <option value="internet_connection">Internet Disconnection</option>
                  <option value="browser_device">Browser / Device Freeze</option>
                  <option value="accessibility">Accessibility Contrast/Font Adjustment</option>
                  <option value="other_technical">Other Technical Issue</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Issue Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="Describe the issue reported by candidate..."
                  value={assistanceForm.description}
                  onChange={(e) => setAssistanceForm({ ...assistanceForm, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Action Taken by Invigilator</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Restarted audio service / Adjusted contrast"
                  value={assistanceForm.actionTaken}
                  onChange={(e) => setAssistanceForm({ ...assistanceForm, actionTaken: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssistanceModal({ open: false, studentId: '', studentName: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  <Send size={16} /> Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {pauseModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '400px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Pause Session: {pauseModal.studentName}
            </h3>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Pause Reason (Audited)</label>
              <textarea
                className="form-textarea"
                rows={3}
                required
                placeholder="Reason for pausing session (e.g., Technical assistance required)..."
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPauseModal({ open: false, studentId: '', studentName: '' })}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePauseSession} disabled={actionLoading || !pauseReason.trim()}>
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvigilatorDashboard;
