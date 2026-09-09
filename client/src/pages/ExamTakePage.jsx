import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Volume2, Mic, CheckCircle, FileText, Download, Save } from 'lucide-react';
import { studentAPI, examAPI } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ExamTakePage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [examSession, setExamSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const { speakText, stopSpeech } = useAccessibility();

  // 1. Initialize Exam Session & Check Window/Attempt Status
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await studentAPI.startExam(examId);
        setExam(res.data.exam);
        setExamSession(res.data.examSession);

        if (res.data.examSession && res.data.examSession.studentAnswers) {
          const savedAns = res.data.examSession.studentAnswers.mainResponse || '';
          setCurrentAnswerText(savedAns);
        }

        // Calculate remaining seconds from server expiresAt
        let remainingSeconds = 0;
        if (res.data.examSession && res.data.examSession.expiresAt) {
          const expiresAt = new Date(res.data.examSession.expiresAt).getTime();
          remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);
          if (remainingSeconds < 0) remainingSeconds = 0;
        } else {
          remainingSeconds = (res.data.exam.duration || 60) * 60;
        }
        setTimeLeft(remainingSeconds);

        speakText(
          `Exam session started. ${res.data.exam.title}. Duration is ${res.data.exam.duration} minutes. Please listen to the question paper or type your responses below.`
        );
      } catch (err) {
        setNotification({
          type: 'error',
          message: err.response?.data?.message || 'Failed to access examination session',
        });
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, [examId]);

  // 2. Countdown Timer & Auto-Submit on Expiration
  useEffect(() => {
    if (timeLeft <= 0 || submitting || !examSession) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, examSession]);

  // Periodic Auto-save answers every 30 seconds
  useEffect(() => {
    if (!examSession || submitting || !currentAnswerText) return;
    const saveInterval = setInterval(async () => {
      try {
        setSaving(true);
        await studentAPI.saveAnswers(examId, {
          answers: { mainResponse: currentAnswerText },
        });
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setSaving(false);
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [examSession, submitting, currentAnswerText, examId]);

  const handleAutoClose = async () => {
    setSubmitting(true);
    speakText('Exam duration has expired. Automatically submitting your examination responses now.');

    try {
      await studentAPI.submitExam(examId, {
        answers: { mainResponse: currentAnswerText },
      });
      setNotification({
        type: 'info',
        message: 'Exam duration expired. Your answers have been auto-closed and saved.',
      });
      setTimeout(() => {
        navigate('/student/dashboard?tab=completed');
      }, 2500);
    } catch (err) {
      setNotification({ type: 'error', message: 'Error during auto-submission' });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to submit your examination paper?')) return;

    setSubmitting(true);
    stopSpeech();

    try {
      await studentAPI.submitExam(examId, {
        answers: { mainResponse: currentAnswerText },
      });
      setNotification({
        type: 'success',
        message: 'Congratulations! Your examination has been submitted successfully.',
      });
      speakText('Your examination has been submitted successfully.');
      setTimeout(() => {
        navigate('/student/dashboard?tab=completed');
      }, 2000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit exam',
      });
      setSubmitting(false);
    }
  };

  const handleDownloadQuestionPaper = async () => {
    try {
      setNotification({ type: 'info', message: 'Downloading question paper...' });
      const res = await examAPI.downloadQuestionPaper(examId);
      const blob = new Blob([res.data], { type: res.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exam.questionPaperFile.originalName || 'question-paper');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'Download started' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Failed to download question paper. You may not be authorized.' });
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner text="Securing examination session & verifying Invigilator activation..." />;
  }

  if (!exam || !examSession) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
        <Notification type="error" message={notification.message || 'Unable to access exam session.'} />
        <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')} style={{ marginTop: '1rem' }}>
          Back to Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Exam Active Header with Live Timer */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: timeLeft < 300 ? 'var(--accent-rose)' : 'var(--primary)',
        }}
      >
        <div>
          <span className="badge badge-active">{exam.subject}</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>
            {exam.title}
          </h1>
          {saving && <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>Auto-saving response...</span>}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end' }}>
            <Clock size={16} color={timeLeft < 300 ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
            <span>Time Remaining</span>
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: timeLeft < 300 ? 'var(--accent-rose)' : 'var(--text-main)',
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {/* Main Examination Working Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Question Paper & Instructions */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={20} color="var(--accent-cyan)" />
              Question Paper & Cues
            </h2>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
              onClick={() => speakText(`Question Paper Instructions: ${exam.instructions}`)}
            >
              <Volume2 size={16} /> Read Aloud
            </button>
          </div>

          <div style={{ marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>Instructions:</h4>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>{exam.instructions}</p>
          </div>

          {/* Attached Paper File link if any */}
          {exam.questionPaperFile ? (
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--primary-glow)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                Attached Document: {exam.questionPaperFile.originalName}
              </div>
              <button
                onClick={handleDownloadQuestionPaper}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem' }}
              >
                <Download size={16} /> Download Question Paper File
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              No external file attached. Standard question text active.
            </div>
          )}
        </div>

        {/* Right Column: Answer Sheet & Dictation Input */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mic size={20} color="var(--accent-emerald)" />
            Student Answer Sheet (Voice Ready)
          </h2>

          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="answer-input">
                <span>Type or Dictate Answers</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>Voice Mode Active</span>
              </label>
              <textarea
                id="answer-input"
                className="form-textarea"
                rows={12}
                placeholder="Type your exam responses here. Voice dictation is enabled..."
                value={currentAnswerText}
                onChange={(e) => setCurrentAnswerText(e.target.value)}
                style={{ fontSize: '1rem', lineHeight: 1.6 }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => speakText(`Current entered response is: ${currentAnswerText || 'Blank'}`)}
              >
                <Volume2 size={16} /> Read My Answer
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
              >
                <CheckCircle size={18} />
                <span>{submitting ? 'Submitting...' : 'Final Submit Exam'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamTakePage;
