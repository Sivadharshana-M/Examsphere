import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { authAPI } from '../../services/api';
import Notification from '../../components/Notification';

const CollegeAdminRegisterPage = () => {
  const [institutionName, setInstitutionName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setSubmitting(true);
    try {
      await authAPI.registerAdmin({ institutionName, name, email, password });
      // Redirect to login page after successful registration
      navigate('/admin/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'radial-gradient(circle at 50% 30%, rgba(245,158,11,0.12), transparent 65%), var(--bg-primary)', position: 'relative' }}>
      <div style={{ maxWidth: '460px', width: '100%' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '58px', height: '58px', margin: '0 auto 1rem auto', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(245,158,11,0.4)' }}>
            <Building size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Register Institution</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>Create the College Administrator account</p>
        </div>

        <div className="glass-card">
          <Notification type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-institution">College / Institution Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-institution" type="text" className="form-input" placeholder="University of Science" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-name">Administrator Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-name" type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-email" type="email" className="form-input" placeholder="admin@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-confirm-password">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="admin-confirm-password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.875rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} disabled={submitting}>
              <span>{submitting ? 'Creating Account...' : 'Register Institution'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/admin/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeAdminRegisterPage;
