import React, { useState } from 'react';
import { User, Mail, Phone, Building2, Hash, BookOpen, ShieldCheck, GraduationCap, Edit3, Key, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    schoolOrCollegeName: user?.schoolOrCollegeName || '',
    department: user?.department || '',
    courseOrClass: user?.courseOrClass || '',
    year: user?.year || 'First Year',
    semester: user?.semester || 'Semester 1',
    designation: user?.designation || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(profileForm);
      setNotification({ type: 'success', message: 'Profile information updated successfully.' });
      setIsEditing(false);
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setNotification({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }
    setLoading(true);
    try {
      await changePassword(passwordForm);
      setNotification({ type: 'success', message: 'Password changed successfully.' });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isInvigilator = user?.role === 'invigilator';
  const isCollegeAdmin = user?.role === 'college_admin' || user?.role === 'COLLEGE_ADMIN';

  let RoleIcon = GraduationCap;
  let roleTitle = 'STUDENT PROFILE';
  let roleSubtitle = 'Official account credentials & academic details';

  if (isTeacher) {
    RoleIcon = BookOpen;
    roleTitle = 'TEACHER PROFILE';
    roleSubtitle = 'Official account credentials & professional details';
  } else if (isInvigilator) {
    RoleIcon = ShieldCheck;
    roleTitle = 'INVIGILATOR PROFILE';
    roleSubtitle = 'Official account credentials & professional details';
  } else if (isCollegeAdmin) {
    RoleIcon = Building2;
    roleTitle = 'ADMIN PROFILE';
    roleSubtitle = 'Official account credentials & professional details';
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <RoleIcon size={24} color="var(--accent-cyan)" />
            {roleTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {roleSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
            <Key size={16} />
            <span>Change Password</span>
          </button>
          {!isEditing && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {isEditing ? (
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Edit Profile Information</h2>
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School / College Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.schoolOrCollegeName}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolOrCollegeName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </div>
            </div>

            {isStudent ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Course / Class</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.courseOrClass}
                      onChange={(e) => setProfileForm({ ...profileForm, courseOrClass: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select
                      className="form-input"
                      value={profileForm.year}
                      onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value })}
                    >
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select
                      className="form-input"
                      value={profileForm.semester}
                      onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '1rem', textTransform: 'uppercase' }}>
            Personal Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full Name</div>
              <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.name || '--'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</div>
              <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.email || '--'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</div>
              <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.phone || 'Not provided'}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Role</div>
              <div style={{ fontWeight: 700, marginTop: '0.2rem', textTransform: 'uppercase', color: 'var(--primary)' }}>
                {user?.role}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '1rem', textTransform: 'uppercase' }}>
            {isStudent ? 'Academic Information' : 'Professional Information'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.95rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>School / College Name</div>
              <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.schoolOrCollegeName || 'Not specified'}</div>
            </div>

            {isStudent ? (
              <>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll Number / Student ID</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.studentId || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.department || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Course / Class</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.courseOrClass || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Year</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.year || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.semester || 'Not specified'}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employee / Staff ID</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.employeeId || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.department || 'Not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Designation</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{user?.designation || 'Not specified'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '420px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
              Change Account Password
            </h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Current Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="form-input"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="form-input"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Confirm New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    className="form-input"
                    required
                    minLength={6}
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
