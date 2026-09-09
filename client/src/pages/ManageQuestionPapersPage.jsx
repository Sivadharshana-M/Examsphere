import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, UploadCloud, PlusCircle, Eye, Edit3, Send,
  Calendar, CheckCircle, Clock, Award, BookOpen, AlertCircle,
  Filter, RefreshCw,
} from 'lucide-react';
import { questionPaperAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    draft:     { bg: 'rgba(245,158,11,0.15)',  color: 'var(--accent-amber)',   label: 'Draft' },
    submitted: { bg: 'rgba(99,102,241,0.15)',  color: 'var(--primary)',        label: 'Submitted' },
    published: { bg: 'rgba(16,185,129,0.15)',  color: 'var(--accent-emerald)', label: 'Published' },
  };
  const s = map[status] || { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', label: status };
  return (
    <span style={{
      padding: '0.2rem 0.65rem', borderRadius: '50px',
      fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.04em',
      background: s.bg, color: s.color,
    }}>
      {s.label.toUpperCase()}
    </span>
  );
};

// ── Type badge ────────────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const isCreated = type === 'created';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '50px',
      fontSize: '0.73rem', fontWeight: 800,
      background: isCreated ? 'rgba(6,182,212,0.12)' : 'rgba(139,92,246,0.12)',
      color: isCreated ? 'var(--accent-cyan)' : '#a78bfa',
    }}>
      {isCreated ? <FileText size={11} /> : <UploadCloud size={11} />}
      {isCreated ? 'Created' : 'Uploaded'}
    </span>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ManageQuestionPapersPage = () => {
  const navigate = useNavigate();
  const [papers, setPapers]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [submitting, setSubmitting]     = useState(null); // paper id being submitted

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await questionPaperAPI.getMyQuestionPapers();
      const data = res.data.questionPapers || [];
      setPapers(data);
      setFiltered(data);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to load your question papers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPapers(); }, []);

  // Apply filters
  useEffect(() => {
    let out = [...papers];
    if (statusFilter !== 'all') out = out.filter(p => p.status === statusFilter);
    if (typeFilter   !== 'all') out = out.filter(p => p.type   === typeFilter);
    setFiltered(out);
  }, [statusFilter, typeFilter, papers]);

  const handleSubmit = async (paperId) => {
    if (!window.confirm('Submit this question paper? It will be sent to the administrator for review.')) return;
    setSubmitting(paperId);
    try {
      await questionPaperAPI.submitQuestionPaper(paperId);
      setNotification({ type: 'success', message: 'Question paper submitted successfully!' });
      fetchPapers();
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to submit question paper.' });
    } finally {
      setSubmitting(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     papers.length,
    draft:     papers.filter(p => p.status === 'draft').length,
    submitted: papers.filter(p => p.status === 'submitted').length,
    published: papers.filter(p => p.status === 'published').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            My Question Papers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
            All question papers you have created or uploaded
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/teacher/question-papers/create" className="btn btn-primary">
            <PlusCircle size={18} /> Create Question Paper
          </Link>
          <Link to="/teacher/upload" className="btn btn-secondary">
            <UploadCloud size={18} /> Upload Question Paper
          </Link>
        </div>
      </div>

      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Papers', value: stats.total,     color: 'var(--primary)',        icon: <FileText size={22} /> },
          { label: 'Drafts',       value: stats.draft,     color: 'var(--accent-amber)',   icon: <Edit3    size={22} /> },
          { label: 'Submitted',    value: stats.submitted, color: 'var(--primary)',        icon: <Send     size={22} /> },
          { label: 'Published',    value: stats.published, color: 'var(--accent-emerald)', icon: <CheckCircle size={22} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)', background: `${color}22`, color }}>{icon}</div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        <select
          className="form-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="published">Published</option>
        </select>
        <select
          className="form-input"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
        >
          <option value="all">All Types</option>
          <option value="created">Created</option>
          <option value="uploaded">Uploaded</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchPapers} style={{ padding: '0.45rem 0.75rem' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Paper List */}
      {loading ? (
        <LoadingSpinner text="Loading your question papers..." />
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
          <FileText size={50} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>
            {papers.length === 0 ? 'No question papers yet' : 'No papers match the current filters'}
          </h3>
          {papers.length === 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Link to="/teacher/question-papers/create" className="btn btn-primary">
                <PlusCircle size={16} /> Create Question Paper
              </Link>
              <Link to="/teacher/upload" className="btn btn-secondary">
                <UploadCloud size={16} /> Upload Question Paper
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(paper => {
            const exam = paper.exam || {};
            const isDraft = paper.status === 'draft';
            return (
              <div key={paper._id} className="glass-card" style={{
                display: 'flex', flexDirection: 'column', gap: '0.85rem',
                border: isDraft ? '1px solid rgba(245,158,11,0.15)' : '1px solid var(--border-color)',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <TypeBadge type={paper.type} />
                      <StatusBadge status={paper.status} />
                    </div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      {paper.title || `Question Paper — ${exam.title || 'Unknown Exam'}`}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Exam: <strong style={{ color: 'var(--text-main)' }}>{exam.title || '—'}</strong>
                    </p>
                  </div>

                  {/* Meta chips */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {exam.subject && (
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '50px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700 }}>
                        {exam.subject}
                      </span>
                    )}
                    {exam.classOrCourse && (
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '50px', background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                        {exam.classOrCourse}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {paper.type === 'created' ? (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FileText size={13} color="var(--accent-cyan)" />
                        {paper.totalQuestions ?? 0} question{paper.totalQuestions !== 1 ? 's' : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Award size={13} color="var(--accent-emerald)" />
                        {paper.totalMarks} / {exam.totalMarks || '?'} marks
                      </span>
                    </>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <UploadCloud size={13} color="#a78bfa" />
                      {paper.uploadedFile?.originalName || 'Uploaded file'}
                    </span>
                  )}
                  {exam.examDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} color="var(--accent-amber)" /> {exam.examDate}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    {paper.updatedAt ? `Updated ${new Date(paper.updatedAt).toLocaleDateString()}` : `Created ${new Date(paper.createdAt).toLocaleDateString()}`}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {isDraft && paper.type === 'created' && (
                    <Link to={`/teacher/question-papers/create?paperId=${paper._id}&examId=${exam._id}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                      <Edit3 size={14} /> Edit
                    </Link>
                  )}
                  {isDraft && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                      disabled={submitting === paper._id}
                      onClick={() => handleSubmit(paper._id)}
                    >
                      <Send size={14} /> {submitting === paper._id ? 'Submitting…' : 'Submit'}
                    </button>
                  )}
                  {!isDraft && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      <CheckCircle size={13} /> {paper.status === 'submitted' ? 'Awaiting review' : 'Published'}
                    </span>
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

export default ManageQuestionPapersPage;
