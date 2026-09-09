import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('examsphere_contrast') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('examsphere_fontsize') || 'normal';
  });

  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('examsphere_tts') !== 'false';
  });

  const [speaking, setSpeaking] = useState(false);

  // Sync DOM classes whenever accessibility modes change
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('examsphere_contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (fontSize === 'large') {
      document.body.classList.add('font-large');
    } else if (fontSize === 'xlarge') {
      document.body.classList.add('font-xlarge');
    }
    localStorage.setItem('examsphere_fontsize', fontSize);
  }, [fontSize]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const toggleTts = () => setTtsEnabled((prev) => !prev);

  // Text-To-Speech assistant reader
  const speakText = (text) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        fontSize,
        cycleFontSize,
        ttsEnabled,
        toggleTts,
        speakText,
        stopSpeech,
        speaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
