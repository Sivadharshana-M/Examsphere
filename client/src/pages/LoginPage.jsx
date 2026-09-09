import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck, GraduationCap, Mic, ArrowRight } from 'lucide-react';
import AccessibilityToolbar from '../components/AccessibilityToolbar';

const roles = [
  {
    key: 'teacher',
    label: 'Teacher',
    subtitle: 'Examination Creator & Manager',
    icon: BookOpen,
    route: '/auth/teacher',
    accent: 'var(--primary)',
    glow: 'rgba(99, 102, 241, 0.25)',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
    border: 'rgba(99,102,241,0.35)',
  },
  {
    key: 'invigilator',
    label: 'Invigilator',
    subtitle: 'Examination Conductor & Live Monitor',
    icon: ShieldCheck,
    route: '/auth/invigilator',
    accent: 'var(--accent-cyan)',
    glow: 'rgba(6, 182, 212, 0.25)',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
    border: 'rgba(6,182,212,0.35)',
  },
  {
    key: 'student',
    label: 'Student',
    subtitle: 'Accessible Examination Candidate',
    icon: GraduationCap,
    route: '/auth/student',
    accent: 'var(--accent-emerald)',
    glow: 'rgba(16, 185, 129, 0.25)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
    border: 'rgba(16,185,129,0.35)',
  },
];

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background:
          'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.10) 0%, transparent 50%), var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}>
        <AccessibilityToolbar />
      </div>

      <div style={{ maxWidth: '640px', width: '100%', zIndex: 1 }} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 1.25rem auto',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 36px rgba(99,102,241,0.4)',
            }}
          >
            <Mic size={36} color="#fff" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.4rem',
              fontWeight: 900,
              color: 'var(--text-main)',
              letterSpacing: '-0.5px',
              marginBottom: '0.4rem',
            }}
          >
            ExamSphere <span style={{ color: 'var(--accent-cyan)' }}>AI</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Voice-Based Accessible Examination System
          </p>
          <div
            style={{
              marginTop: '1.25rem',
              display: 'inline-block',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '50px',
              padding: '0.35rem 1.1rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            SELECT YOUR ROLE TO CONTINUE
          </div>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.key}
                type="button"
                id={`role-select-${role.key}`}
                onClick={() => navigate(role.route)}
                aria-label={`Sign in as ${role.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: role.gradient,
                  border: `1.5px solid ${role.border}`,
                  borderRadius: '14px',
                  padding: '1.35rem 1.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${role.glow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '12px',
                      background: `${role.glow}`,
                      border: `1px solid ${role.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={26} color={role.accent} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {role.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {role.subtitle}
                    </div>
                  </div>
                </div>
                <ArrowRight size={20} color={role.accent} style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '2.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            opacity: 0.65,
          }}
        >
          ExamSphere AI — Secure, Accessible, Voice-Enabled Examinations
        </p>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              opacity: 0.5,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.8)}
            onMouseLeave={(e) => (e.target.style.opacity = 0.5)}
          >
            College Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
