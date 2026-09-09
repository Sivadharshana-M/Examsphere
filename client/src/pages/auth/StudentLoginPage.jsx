import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Notification from '../../components/Notification';
import AccessibilityToolbar from '../../components/AccessibilityToolbar';

const StudentLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password, 'student');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'radial-gradient(circle at 50% 30%, rgba(16,185,129,0.12), transparent 65%), var(--bg-primary)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}><AccessibilityToolbar /></div>

      <div style={{ maxWidth: '460px', width: '100%' }} className="animate-fade-in">
        <button type="button" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.5rem', padding: 0 }}>
          <ArrowLeft size={16} /> Back to Role Selection
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '58px', height: '58px', margin: '0 auto 1rem auto', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-emerald), #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(16,185,129,0.4)' }}>
            <GraduationCap size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Student Portal Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>Accessible Examination Candidate</p>
        </div>

        <div className="glass-card">
          <Notification type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label" htmlFor="student-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="student-email" name="student_email" type="email" autoComplete="off" className="form-input" placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="student-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="student-password" name="student_password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Link to="/auth/student/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', textDecoration: 'none', fontWeight: 500 }}>Forgot Password?</Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }} disabled={submitting}>
              <span>{submitting ? 'Signing in...' : 'Sign In as Student'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Account issues? Student candidate credentials are assigned &amp; managed by your Institution Administrator.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
