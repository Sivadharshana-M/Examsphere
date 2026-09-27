import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import AccessibilityToolbar from '../components/AccessibilityToolbar';

const roleConfig = {
  teacher: { label: 'Teacher', accent: 'var(--primary)', back: '/auth/teacher', backLabel: 'Back to Teacher Login' },
  invigilator: { label: 'Invigilator', accent: 'var(--accent-cyan)', back: '/auth/invigilator', backLabel: 'Back to Invigilator Login' },
  student: { label: 'Student', accent: 'var(--accent-emerald)', back: '/auth/student', backLabel: 'Back to Student Login' },
};

const ForgotPasswordPage = ({ role: roleProp }) => {
  // role can come from a prop (used in routes) or from URL params
  const params = useParams();
  const role = roleProp || params.role || 'student';
  const config = roleConfig[role] || roleConfig.student;

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: `radial-gradient(circle, ${config.accent} 0%, transparent 70%)`, opacity: 0.12, filter: 'blur(40px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(50px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}><AccessibilityToolbar /></div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', zIndex: 1 }}>
        <button type="button" onClick={() => navigate(config.back)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.5rem', padding: 0 }}>
          <ArrowLeft size={16} /> {config.backLabel}
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Forgot <span style={{ color: config.accent }}>Password</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            {config.label} Portal — Enter your registered email
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>
        )}
        {message && (
          <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem', border: '1px solid rgba(16,185,129,0.2)' }}>{message}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="forgot-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="forgot-email" type="email" className="form-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.75rem' }} required disabled={submitting} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={submitting}>
            <span>{submitting ? 'Sending...' : 'Send Reset Link'}</span>
            {!submitting && <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
