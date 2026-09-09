import React from 'react';
import { Volume2, VolumeX, Eye, Type, Sparkles } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const AccessibilityToolbar = () => {
  const {
    highContrast,
    toggleHighContrast,
    fontSize,
    cycleFontSize,
    ttsEnabled,
    toggleTts,
    speakText,
    speaking,
  } = useAccessibility();

  const handleTestVoice = () => {
    speakText('Welcome to ExamSphere AI. Voice accessibility system is active and ready.');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '0.4rem 0.8rem',
        borderRadius: '9999px',
        border: '1px solid var(--border-color)',
      }}
      aria-label="Accessibility Options Bar"
    >
      <button
        className="btn btn-secondary"
        onClick={cycleFontSize}
        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
        title={`Font Size: ${fontSize.toUpperCase()}`}
        aria-label={`Cycle font size, current size is ${fontSize}`}
      >
        <Type size={16} />
        <span>Font ({fontSize.toUpperCase()})</span>
      </button>

      <button
        className="btn btn-secondary"
        onClick={toggleHighContrast}
        style={{
          padding: '0.35rem 0.65rem',
          fontSize: '0.8rem',
          background: highContrast ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
          color: highContrast ? '#000' : 'var(--text-main)',
        }}
        title="Toggle High Contrast Mode"
        aria-label="Toggle High Contrast Mode"
      >
        <Eye size={16} />
        <span>{highContrast ? 'High Contrast: ON' : 'Contrast'}</span>
      </button>

      <button
        className="btn btn-secondary"
        onClick={toggleTts}
        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
        title={ttsEnabled ? 'Mute Voice Reader' : 'Enable Voice Reader'}
        aria-label="Toggle Text to Speech"
      >
        {ttsEnabled ? <Volume2 size={16} color="var(--accent-emerald)" /> : <VolumeX size={16} />}
        <span>{ttsEnabled ? 'Voice Reader ON' : 'Voice Reader OFF'}</span>
      </button>

      {ttsEnabled && (
        <button
          className="btn btn-primary"
          onClick={handleTestVoice}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          disabled={speaking}
          aria-label="Test Voice Assistant"
        >
          <Sparkles size={14} />
          <span>{speaking ? 'Speaking...' : 'Test Voice AI'}</span>
        </button>
      )}
    </div>
  );
};

export default AccessibilityToolbar;
