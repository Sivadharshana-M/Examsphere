import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  User, Mail, Lock, Phone, BookOpen, GraduationCap, ArrowRight, Mic,
  Building2, Hash, Award, ShieldCheck, Briefcase, BookMarked, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';
import AccessibilityToolbar from '../components/AccessibilityToolbar';

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: <GraduationCap size={18} />,
    color: 'var(--accent-emerald)',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: <BookOpen size={18} />,
    color: 'var(--primary)',
  },
  {
    key: 'invigilator',
    label: 'Invigilator',
    icon: <ShieldCheck size={18} />,
    color: 'var(--accent-cyan)',
  },
];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Student fields
    schoolOrCollegeName: '',
    studentId: '',
    department: '',
    courseOrClass: '',
    year: 'First Year',
    semester: 'Semester 1',
    // Teacher fields
    teacherEmployeeId: '',
    teacherDepartment: '',
    teacherDesignation: '',
    teacherInstitution: '',
    // Invigilator fields
    invigilatorEmployeeId: '',
    invigilatorDepartment: '',
    invigilatorInstitution: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await register(formData.name, formData.email, formData.password, selectedRole, formData);
      if (selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (selectedRole === 'invigilator') {
        navigate('/invigilator/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleConfig = {
    student: { title: 'Student Candidate Registration', subtitle: 'Register as a Student for Accessible Examination Sessions', color: 'var(--accent-emerald)', btnLabel: 'Register Student Account', btnLoading: 'Creating Student Account...' },
    teacher: { title: 'Teacher Registration', subtitle: 'Register as a Teacher to Create & Manage Examinations', color: 'var(--primary)', btnLabel: 'Register Teacher Account', btnLoading: 'Creating Teacher Account...' },
    invigilator: { title: 'Invigilator Registration', subtitle: 'Register as an Invigilator to Conduct & Monitor Exams', color: 'var(--accent-cyan)', btnLabel: 'Register Invigilator Account', btnLoading: 'Creating Invigilator Account...' },
  };

  const config = roleConfig[selectedRole];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.12), transparent 70%), var(--bg-primary)',
      }}
    >
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem' }}>
        <AccessibilityToolbar />
      </div>

      <div style={{ maxWidth: '660px', width: '100%' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              margin: '0 auto 0.75rem auto',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px var(--primary-glow)',
            }}
          >
            <Mic size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800 }}>
            {config.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {config.subtitle}
          </p>
        </div>

        {/* Role Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`btn ${selectedRole === r.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.35rem', fontSize: '0.85rem', flexDirection: 'column', gap: '0.2rem' }}
              onClick={() => handleRoleChange(r.key)}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-card">
          <Notification type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit}>
            {/* ── Personal Information ── */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: config.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="name" name="name" type="text" className="form-input"
                    placeholder="e.g. Kavya K"
                    value={formData.name} onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }} required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="email" name="email" type="email" className="form-input"
                    placeholder="you@university.edu"
                    value={formData.email} onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }} required
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="phone" name="phone" type="text" className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone} onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }} required
                />
              </div>
            </div>

            {/* ── Role-Specific Fields ── */}
            {selectedRole === 'student' && (
              <>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: config.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Academic Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="schoolOrCollegeName">School / College Name *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="schoolOrCollegeName" name="schoolOrCollegeName" type="text" className="form-input"
                        placeholder="e.g. Thiagarajar College"
                        value={formData.schoolOrCollegeName} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="studentId">Roll Number / Student ID *</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="studentId" name="studentId" type="text" className="form-input"
                        placeholder="e.g. 24BCA001"
                        value={formData.studentId} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="department">Department</label>
                    <input
                      id="department" name="department" type="text" className="form-input"
                      placeholder="e.g. Computer Applications"
                      value={formData.department} onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="courseOrClass">Course / Class *</label>
                    <input
                      id="courseOrClass" name="courseOrClass" type="text" className="form-input"
                      placeholder="e.g. BCA or Class XII"
                      value={formData.courseOrClass} onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="year">Year</label>
                    <select id="year" name="year" className="form-input" value={formData.year} onChange={handleChange}>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="semester">Semester</label>
                    <select id="semester" name="semester" className="form-input" value={formData.semester} onChange={handleChange}>
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={`Semester ${n}`}>Semester {n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'teacher' && (
              <>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: config.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Professional Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="teacherInstitution">Institution / College *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="teacherInstitution" name="teacherInstitution" type="text" className="form-input"
                        placeholder="e.g. Thiagarajar College"
                        value={formData.teacherInstitution} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="teacherEmployeeId">Employee ID *</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="teacherEmployeeId" name="teacherEmployeeId" type="text" className="form-input"
                        placeholder="e.g. TCE-TH-001"
                        value={formData.teacherEmployeeId} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="teacherDepartment">Department *</label>
                    <div style={{ position: 'relative' }}>
                      <BookMarked size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="teacherDepartment" name="teacherDepartment" type="text" className="form-input"
                        placeholder="e.g. Computer Applications"
                        value={formData.teacherDepartment} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="teacherDesignation">Designation</label>
                    <div style={{ position: 'relative' }}>
                      <Award size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="teacherDesignation" name="teacherDesignation" type="text" className="form-input"
                        placeholder="e.g. Assistant Professor"
                        value={formData.teacherDesignation} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedRole === 'invigilator' && (
              <>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: config.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Professional Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="invigilatorInstitution">Institution / College *</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="invigilatorInstitution" name="invigilatorInstitution" type="text" className="form-input"
                        placeholder="e.g. Thiagarajar College"
                        value={formData.invigilatorInstitution} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="invigilatorEmployeeId">Employee ID *</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="invigilatorEmployeeId" name="invigilatorEmployeeId" type="text" className="form-input"
                        placeholder="e.g. TCE-INV-001"
                        value={formData.invigilatorEmployeeId} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }} required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="invigilatorDepartment">Department</label>
                    <div style={{ position: 'relative' }}>
                      <Briefcase size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        id="invigilatorDepartment" name="invigilatorDepartment" type="text" className="form-input"
                        placeholder="e.g. Examinations Cell"
                        value={formData.invigilatorDepartment} onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                  <div /> {/* spacer */}
                </div>
              </>
            )}

            {/* ── Security Credentials ── */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: config.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Security Credentials
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password" name="password" type={showPassword ? "text" : "password"} className="form-input"
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    minLength={6} required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="form-input"
                    placeholder="••••••••"
                    value={formData.confirmPassword} onChange={handleChange}
                    minLength={6} required
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={submitting}
            >
              <span>{submitting ? config.btnLoading : config.btnLabel}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
