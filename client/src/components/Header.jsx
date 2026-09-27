import React from 'react';
import { LogOut, Shield, GraduationCap, Mic, BookOpen, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccessibilityToolbar from './AccessibilityToolbar';

const Header = () => {
  const { user, logout, isTeacher, isInvigilator, isCollegeAdmin } = useAuth();

  let roleLabel = 'Visually Impaired Student';
  let RoleIcon = GraduationCap;
  let roleColor = 'var(--accent-emerald)';

  if (isCollegeAdmin) {
    roleLabel = 'College Administrator';
    RoleIcon = Building2;
    roleColor = 'var(--accent-amber)';
  } else if (isTeacher) {
    roleLabel = 'Teacher';
    RoleIcon = BookOpen;
    roleColor = 'var(--primary)';
  } else if (isInvigilator) {
    roleLabel = 'Exam Conductor (Invigilator)';
    RoleIcon = Shield;
    roleColor = 'var(--accent-cyan)';
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 800,
            fontSize: '1.35rem',
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
          >
            <Mic size={22} color="#fff" />
          </div>
          <span>ExamSphere <span style={{ color: 'var(--accent-cyan)' }}>AI</span></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <AccessibilityToolbar />

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              paddingLeft: '1rem',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {user.name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: roleColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.25rem',
                  fontWeight: 600,
                }}
              >
                <RoleIcon size={12} />
                {roleLabel}
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={logout}
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
