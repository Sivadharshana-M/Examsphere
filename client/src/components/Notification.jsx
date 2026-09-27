import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Notification = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const bgColors = {
    success: 'rgba(16, 185, 129, 0.15)',
    error: 'rgba(244, 63, 94, 0.15)',
    info: 'rgba(6, 182, 212, 0.15)',
  };

  const borderColors = {
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(244, 63, 94, 0.4)',
    info: 'rgba(6, 182, 212, 0.4)',
  };

  const icons = {
    success: <CheckCircle2 size={20} color="var(--accent-emerald)" />,
    error: <AlertCircle size={20} color="var(--accent-rose)" />,
    info: <Info size={20} color="var(--accent-cyan)" />,
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: bgColors[type] || bgColors.info,
        border: `1px solid ${borderColors[type] || borderColors.info}`,
        color: 'var(--text-main)',
        marginBottom: '1.25rem',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {icons[type]}
        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
          }}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Notification;
