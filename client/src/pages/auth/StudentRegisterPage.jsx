import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Phone, Building2, Hash, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Notification from '../../components/Notification';
import AccessibilityToolbar from '../../components/AccessibilityToolbar';

const StudentRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    schoolOrCollegeName: '', studentId: '', department: '', courseOrClass: '',
    year: 'First Year', semester: 'Semester 1',
    password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register(formData.name, formData.email, formData.password, 'student', formData);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sectionTitle = (title) => (
    <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '1rem', marginTop: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>{title}</h3>
  );
  const iconStyle = { position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' };
  const inputWrap = { position: 'relative' };
  const pl = { paddingLeft: '2.5rem' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'radial-gradient(circle at 50% 20%, rgba(16,185,129,0.11), transparent 60%), var(--bg-primary)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}><AccessibilityToolbar /></div>

      <div style={{ maxWidth: '640px', width: '100%' }} className="animate-fade-in">
        <button type="button" onClick={() => navigate('/auth/student')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.5rem', padding: 0 }}>
          <ArrowLeft size={16} /> Back to Student Login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '56px', height: '56px', margin: '0 auto 0.9rem auto', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-emerald), #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 28px rgba(16,185,129,0.4)' }}>
            <GraduationCap size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Student Registration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Register as a Student for Accessible Examination Sessions</p>
        </div>

        <div className="glass-card">
          <Notification type="error" message={error} onClose={() => setError('')} />
          <form onSubmit={handleSubmit}>
            {sectionTitle('Personal Information')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="s-name">Full Name *</label>
                <div style={inputWrap}><User size={17} style={iconStyle} /><input id="s-name" name="name" type="text" className="form-input" placeholder="e.g. Kavya K" value={formData.name} onChange={handleChange} style={pl} required /></div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-email">Email Address *</label>
                <div style={inputWrap}><Mail size={17} style={iconStyle} /><input id="s-email" name="email" type="email" className="form-input" placeholder="student@university.edu" value={formData.email} onChange={handleChange} style={pl} required /></div>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '0.25rem' }}>
              <label className="form-label" htmlFor="s-phone">Phone Number</label>
              <div style={inputWrap}><Phone size={17} style={iconStyle} /><input id="s-phone" name="phone" type="text" className="form-input" placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange} style={pl} /></div>
            </div>

            {sectionTitle('Academic / Identification Information')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="s-school">School / College Name *</label>
                <div style={inputWrap}><Building2 size={17} style={iconStyle} /><input id="s-school" name="schoolOrCollegeName" type="text" className="form-input" placeholder="e.g. Thiagarajar College" value={formData.schoolOrCollegeName} onChange={handleChange} style={pl} required /></div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-roll">Roll Number / Student ID *</label>
                <div style={inputWrap}><Hash size={17} style={iconStyle} /><input id="s-roll" name="studentId" type="text" className="form-input" placeholder="e.g. 24BCA001" value={formData.studentId} onChange={handleChange} style={pl} required /></div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-dept">Department</label>
                <input id="s-dept" name="department" type="text" className="form-input" placeholder="e.g. Computer Applications" value={formData.department} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-course">Course / Class *</label>
                <input id="s-course" name="courseOrClass" type="text" className="form-input" placeholder="e.g. BCA or Class XII" value={formData.courseOrClass} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-year">Year</label>
                <select id="s-year" name="year" className="form-input" value={formData.year} onChange={handleChange}>
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Fourth Year">Fourth Year</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-sem">Semester</label>
                <select id="s-sem" name="semester" className="form-input" value={formData.semester} onChange={handleChange}>
                  {[1,2,3,4,5,6,7,8].map((n) => (
                    <option key={n} value={`Semester ${n}`}>Semester {n}</option>
                  ))}
                </select>
              </div>
            </div>

            {sectionTitle('Account Security')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="s-pass">Password *</label>
                <div style={inputWrap}>
                  <input id="s-pass" name="password" type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={formData.password} onChange={handleChange} minLength={6} required style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-cpass">Confirm Password *</label>
                <div style={inputWrap}>
                  <input id="s-cpass" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} minLength={6} required style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }} disabled={submitting}>
              <span>{submitting ? 'Creating Student Account...' : 'Register Student Account'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/auth/student" style={{ color: 'var(--accent-emerald)', fontWeight: 700, textDecoration: 'none' }}>Sign In Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
