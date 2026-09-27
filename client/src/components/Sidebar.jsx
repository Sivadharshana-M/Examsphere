import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  UploadCloud,
  CheckSquare,
  BookOpen,
  UserCheck,
  Activity,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Building,
  Users,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isCollegeAdmin, isTeacher, isInvigilator } = useAuth();

  const collegeAdminLinks = [
    { to: '/admin/dashboard', label: 'College Admin', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/exams/create', label: 'Create New Exam', icon: <PlusCircle size={20} /> },
    { to: '/admin/profile', label: 'My Profile', icon: <User size={20} /> },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard',            label: 'Teacher Dashboard',        icon: <LayoutDashboard size={20} /> },
    { to: '/teacher/question-papers/create', label: 'Create Question Paper',  icon: <PlusCircle     size={20} /> },
    { to: '/teacher/upload',               label: 'Upload Question Paper',    icon: <UploadCloud    size={20} /> },
    { to: '/teacher/question-papers',      label: 'Manage My Question Papers',icon: <FileText       size={20} /> },
    { to: '/teacher/profile',              label: 'My Profile',               icon: <User           size={20} /> },
  ];

  const invigilatorLinks = [
    { to: '/invigilator/dashboard', label: 'Conductor Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/invigilator/dashboard?tab=verify', label: 'Student Verification', icon: <UserCheck size={20} /> },
    { to: '/invigilator/dashboard?tab=monitor', label: 'Live Monitoring', icon: <Activity size={20} /> },
    { to: '/invigilator/dashboard?tab=assistance', label: 'Technical Support', icon: <ShieldCheck size={20} /> },
    { to: '/invigilator/profile', label: 'My Profile', icon: <User size={20} /> },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/student/dashboard?tab=available', label: 'Active Sessions', icon: <BookOpen size={20} /> },
    { to: '/student/dashboard?tab=completed', label: 'Completed Exams', icon: <CheckSquare size={20} /> },
    { to: '/student/profile', label: 'My Profile', icon: <User size={20} /> },
  ];

  let links = studentLinks;
  let menuTitle = 'Student Navigation';

  if (isCollegeAdmin) {
    links = collegeAdminLinks;
    menuTitle = 'College Administration';
  } else if (isTeacher) {
    links = teacherLinks;
    menuTitle = 'Teacher Admin';
  } else if (isInvigilator) {
    links = invigilatorLinks;
    menuTitle = 'Invigilator Panel';
  }

  return (
    <aside
      style={{
        width: '260px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '0 0.75rem 0.75rem 0.75rem',
          }}
        >
          {menuTitle}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.25), rgba(99, 102, 241, 0.05))'
                  : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'var(--transition-fast)',
              })}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-cyan)' }}>
          <HelpCircle size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Voice Helper</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Screen-reader shortcut enabled. Press <strong>Alt + V</strong> anytime for audio guidance.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
