import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AccessibilityContext = createContext();

// Cross-browser SpeechRecognition
const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micState, setMicState] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const onResultCallbackRef = useRef(null);
  const onEndCallbackRef = useRef(null);
  const continuousRef = useRef(false);

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

  // ── Text-To-Speech assistant reader ──────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setSpeaking(true);

    // Temporarily pause recognition while speaking to prevent self-triggering
    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setSpeaking(true);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setSpeaking(false);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, isListening]);

  // Sequential speech with callback on completion
  const speakWithCallback = useCallback((text, onEnd) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setSpeaking(true);

    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setSpeaking(true);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setSpeaking(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn('[TTS Error]', err);
      isSpeakingRef.current = false;
      setSpeaking(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, isListening]);

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setSpeaking(false);
    }
  }, []);

  // ── Speech-to-Text (STT) ───────────────────────────────────────────────────
  const startListening = useCallback(({ onResult, onEnd, continuous = false, lang = 'en-US' } = {}) => {
    if (!SpeechRecognition) {
      console.warn('[STT] SpeechRecognition not supported in this browser');
      setMicState('unsupported');
      speakText('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return false;
    }

    // Do not listen while TTS is active
    if (isSpeakingRef.current) {
      console.log('[STT] TTS currently active, deferring STT start');
      return false;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      onResultCallbackRef.current = onResult;
      onEndCallbackRef.current = onEnd;
      continuousRef.current = continuous;

      recognition.onstart = () => {
        setIsListening(true);
        setMicState('granted');
      };

      recognition.onresult = (event) => {
        // Double check TTS gate
        if (isSpeakingRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const currentText = final || interim;
        setTranscript(currentText);

        if (final && onResultCallbackRef.current) {
          onResultCallbackRef.current(final.trim(), true);
        } else if (interim && onResultCallbackRef.current) {
          onResultCallbackRef.current(interim.trim(), false);
        }
      };

      recognition.onerror = (event) => {
        console.warn('[STT Error]', event.error);
        if (event.error === 'not-allowed') {
          setMicState('denied');
          speakText('Microphone permission was denied. Please allow microphone access to proceed.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onEndCallbackRef.current) {
          onEndCallbackRef.current();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.error('[STT Start Error]', err);
      setIsListening(false);
      return false;
    }
  }, [speakText]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
        speakWithCallback,
        stopSpeech,
        speaking,
        // STT exports
        startListening,
        stopListening,
        isListening,
        transcript,
        micState,
        sttSupported: !!SpeechRecognition,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
