import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Volume2, Mic, MicOff, CheckCircle2, ChevronRight, ChevronLeft,
  RotateCcw, HelpCircle, Send, AlertTriangle, Sparkles, BookOpen, Check
} from 'lucide-react';
import { studentAPI } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';
import { matchCommand, INTENTS } from '../services/commandMatcher';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

const ExamTakePage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  // States: 'LOADING' | 'AWAITING_START' | 'IDLE' | 'ANSWERING' | 'CONFIRMING_SUBMIT' | 'SUBMITTED'
  const [mode, setMode] = useState('LOADING');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [lastHeard, setLastHeard] = useState('');
  const [liveAnswerBuffer, setLiveAnswerBuffer] = useState('');

  const {
    speakText,
    speakWithCallback,
    stopSpeech,
    speaking,
    startListening,
    stopListening,
    isListening,
    micState,
    sttSupported,
  } = useAccessibility();

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  // ── Helper: Format Question for TTS ─────────────────────────────────────────
  const getQuestionSpeech = useCallback((q, index) => {
    if (!q) return '';
    let text = `Question ${q.questionNumber || index + 1}. `;
    if (q.marks) text += `Worth ${q.marks} marks. `;
    text += `${q.questionText}. `;
    if (q.options && q.options.length > 0) {
      text += 'Options are: ';
      q.options.forEach((opt) => {
        text += `Option ${opt.label}: ${opt.text}. `;
      });
    }
    if (q.instructions) text += `Note: ${q.instructions}. `;
    return text;
  }, []);

  // ── Helper: Read Question out loud then resume listening ────────────────────
  const readCurrentQuestion = useCallback((idx) => {
    const qList = questionsRef.current;
    if (!qList || qList.length === 0) return;
    const targetIdx = idx !== undefined ? idx : currentIdxRef.current;
    const q = qList[targetIdx];
    if (!q) return;

    const speech = getQuestionSpeech(q, targetIdx);
    speakWithCallback(speech, () => {
      // Resume listening for command after TTS finishes
      if (modeRef.current !== 'SUBMITTED') {
        listenForCommands();
      }
    });
  }, [getQuestionSpeech, speakWithCallback]);

  // ── Voice Input Handlers ───────────────────────────────────────────────────
  const listenForCommands = useCallback(() => {
    if (modeRef.current === 'SUBMITTED') return;

    startListening({
      continuous: true,
      onResult: (spokenText, isFinal) => {
        if (!spokenText) return;
        setLastHeard(spokenText);

        if (isFinal) {
          handleVoiceCommand(spokenText);
        }
      },
    });
  }, [startListening]);

  const listenForAnswer = useCallback(() => {
    setLiveAnswerBuffer('');
    startListening({
      continuous: true,
      onResult: (spokenText, isFinal) => {
        setLastHeard(spokenText);
        const { intent } = matchCommand(spokenText, 'ANSWERING');

        if (intent === INTENTS.STOP_ANSWERING) {
          // Stop answering command detected
          handleStopAnswering();
          return;
        }

        // Live transcription into buffer and answer
        const currentQ = questionsRef.current[currentIdxRef.current];
        if (currentQ) {
          const qId = currentQ._id;
          const existing = answersRef.current[qId] || '';
          // If final chunk, append to state
          if (isFinal) {
            const separator = existing.length > 0 && !existing.endsWith(' ') ? ' ' : '';
            const updated = (existing + separator + spokenText).trim();
            setAnswers((prev) => ({ ...prev, [qId]: updated }));
            setLiveAnswerBuffer('');
          } else {
            setLiveAnswerBuffer(spokenText);
          }
        }
      },
    });
  }, [startListening]);

  // ── Stop Answering and Auto-Save ───────────────────────────────────────────
  const handleStopAnswering = useCallback(async () => {
    stopListening();
    setMode('IDLE');
    setLiveAnswerBuffer('');

    const currentQ = questionsRef.current[currentIdxRef.current];
    if (!currentQ) return;

    const qId = currentQ._id;
    const currentAnswer = answersRef.current[qId] || '';

    setSaving(true);
    try {
      await studentAPI.saveSingleAnswer(examId, qId, currentAnswer);
      speakWithCallback(`Answer saved for question ${currentQ.questionNumber || currentIdxRef.current + 1}. Say next question, or say read my answer.`, () => {
        listenForCommands();
      });
    } catch (err) {
      console.error('Failed to save answer', err);
      speakWithCallback('Could not save answer to server. Progress is preserved locally.', () => {
        listenForCommands();
      });
    } finally {
      setSaving(false);
    }
  }, [stopListening, examId, speakWithCallback, listenForCommands]);

  // ── Submit Exam ────────────────────────────────────────────────────────────
  const executeSubmission = useCallback(async () => {
    setSubmitting(true);
    setMode('SUBMITTED');
    stopSpeech();
    stopListening();

    speakText('Submitting your examination responses to the invigilator. Please wait.');

    try {
      await studentAPI.submitExam(examId, { answers: answersRef.current });
      setNotification({
        type: 'success',
        message: 'Your examination has been successfully submitted.',
      });
      speakText('Your examination has been successfully submitted. Thank you. You may now relax.');
      setTimeout(() => {
        navigate('/student/dashboard?tab=completed');
      }, 3500);
    } catch (err) {
      console.error('[Submit Error]', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit exam',
      });
      speakText('There was an error submitting your examination. Please alert the invigilator.');
      setSubmitting(false);
      setMode('IDLE');
    }
  }, [examId, stopSpeech, stopListening, speakText, navigate]);

  // ── Dispatch Voice Command ─────────────────────────────────────────────────
  const handleVoiceCommand = useCallback((rawText) => {
    const currentM = modeRef.current;
    const { intent, targetQuestion } = matchCommand(rawText, currentM === 'CONFIRMING_SUBMIT' ? 'CONFIRMING_SUBMISSION' : 'IDLE');

    console.log('[Voice Command]', { rawText, intent, targetQuestion, currentM });

    // Handle Confirmation state
    if (currentM === 'CONFIRMING_SUBMIT') {
      if (intent === INTENTS.AFFIRM_YES) {
        executeSubmission();
        return;
      }
      if (intent === INTENTS.AFFIRM_NO) {
        setMode('IDLE');
        speakWithCallback('Submission cancelled. Returning to examination. Say repeat question to continue.', () => {
          listenForCommands();
        });
        return;
      }
      speakWithCallback('Please say Yes to confirm submission, or say No to continue your exam.', () => {
        listenForCommands();
      });
      return;
    }

    // Handle Awaiting Start state
    if (currentM === 'AWAITING_START') {
      if (intent === INTENTS.START_READING || intent === INTENTS.AFFIRM_YES) {
        setMode('IDLE');
        setCurrentIdx(0);
        readCurrentQuestion(0);
        return;
      }
      if (intent === INTENTS.HELP) {
        speakWithCallback('You can say: start reading, next question, previous question, answer, read my answer, check time, or submit exam. Ready to begin? Say yes.', () => {
          listenForCommands();
        });
        return;
      }
      speakWithCallback('Say start or begin to start reading the questions.', () => {
        listenForCommands();
      });
      return;
    }

    // Normal command mode
    switch (intent) {
      case INTENTS.START_READING:
      case INTENTS.REPEAT_QUESTION: {
        readCurrentQuestion(currentIdxRef.current);
        break;
      }

      case INTENTS.NEXT_QUESTION: {
        const nextIdx = currentIdxRef.current + 1;
        if (nextIdx < questionsRef.current.length) {
          setCurrentIdx(nextIdx);
          readCurrentQuestion(nextIdx);
        } else {
          speakWithCallback('You are on the last question. Say submit my exam when you are ready to finish.', () => {
            listenForCommands();
          });
        }
        break;
      }

      case INTENTS.PREV_QUESTION: {
        const prevIdx = currentIdxRef.current - 1;
        if (prevIdx >= 0) {
          setCurrentIdx(prevIdx);
          readCurrentQuestion(prevIdx);
        } else {
          speakWithCallback('You are on the first question.', () => {
            listenForCommands();
          });
        }
        break;
      }

      case INTENTS.GOTO_QUESTION: {
        const qNum = targetQuestion;
        const foundIdx = questionsRef.current.findIndex(
          (q, i) => q.questionNumber === String(qNum) || i + 1 === qNum
        );
        if (foundIdx !== -1) {
          setCurrentIdx(foundIdx);
          readCurrentQuestion(foundIdx);
        } else {
          speakWithCallback(`Question ${qNum} not found. There are ${questionsRef.current.length} questions in total.`, () => {
            listenForCommands();
          });
        }
        break;
      }

      case INTENTS.START_ANSWERING: {
        setMode('ANSWERING');
        const q = questionsRef.current[currentIdxRef.current];
        speakWithCallback(`Recording answer for question ${q?.questionNumber || currentIdxRef.current + 1}. Please speak your answer clearly. Say 'done' or 'stop answering' when finished.`, () => {
          listenForAnswer();
        });
        break;
      }

      case INTENTS.READ_ANSWER: {
        const currentQ = questionsRef.current[currentIdxRef.current];
        const ans = answersRef.current[currentQ?._id];
        if (ans && ans.trim().length > 0) {
          speakWithCallback(`Your current answer for question ${currentQ?.questionNumber || currentIdxRef.current + 1} is: ${ans}`, () => {
            listenForCommands();
          });
        } else {
          speakWithCallback(`You have not recorded an answer for question ${currentQ?.questionNumber || currentIdxRef.current + 1} yet. Say answer to record your response.`, () => {
            listenForCommands();
          });
        }
        break;
      }

      case INTENTS.CLEAR_ANSWER: {
        const currentQ = questionsRef.current[currentIdxRef.current];
        if (currentQ) {
          setAnswers((prev) => ({ ...prev, [currentQ._id]: '' }));
          studentAPI.saveSingleAnswer(examId, currentQ._id, '').catch(() => {});
          speakWithCallback(`Answer cleared for question ${currentQ.questionNumber || currentIdxRef.current + 1}.`, () => {
            listenForCommands();
          });
        }
        break;
      }

      case INTENTS.CHECK_TIME: {
        const rem = timeLeftRef.current;
        const mins = Math.floor(rem / 60);
        const secs = rem % 60;
        speakWithCallback(`You have ${mins} minutes and ${secs} seconds remaining.`, () => {
          listenForCommands();
        });
        break;
      }

      case INTENTS.READ_INSTRUCTIONS: {
        const inst = exam?.instructions || 'Answer all questions to the best of your ability.';
        speakWithCallback(`Exam instructions: ${inst}`, () => {
          listenForCommands();
        });
        break;
      }

      case INTENTS.CONFIRM_SUBMIT: {
        setMode('CONFIRMING_SUBMIT');
        speakWithCallback('Are you sure you want to submit your examination? Please say Yes to confirm or No to cancel.', () => {
          listenForCommands();
        });
        break;
      }

      case INTENTS.HELP: {
        speakWithCallback(
          'Available commands: Start reading, Next question, Previous question, Repeat question, Go to question number, Answer, Read my answer, Clear answer, Check time, Read instructions, Submit my exam.',
          () => {
            listenForCommands();
          }
        );
        break;
      }

      default: {
        console.log('[Unrecognized Command]', rawText);
        // Do not interrupt aggressively; give a subtle cue if needed
        speakWithCallback("Sorry, I didn't recognize that command. Say help to hear options.", () => {
          listenForCommands();
        });
        break;
      }
    }
  }, [
    executeSubmission,
    readCurrentQuestion,
    listenForCommands,
    listenForAnswer,
    exam,
    examId,
    speakWithCallback,
  ]);

  // ── Initialize Session & Questions on Load ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const initExam = async () => {
      try {
        const [sessionRes, qRes] = await Promise.all([
          studentAPI.startExam(examId),
          studentAPI.getExamQuestions(examId),
        ]);

        if (!isMounted) return;

        const examData = sessionRes.data.exam;
        const attemptData = sessionRes.data.examSession;
        const qList = qRes.data.questions || [];
        const savedAns = qRes.data.savedAnswers || {};

        setExam(examData);
        setAttempt(attemptData);
        setQuestions(qList);
        setAnswers(savedAns);

        // Compute time remaining
        let remainingSeconds = 0;
        if (attemptData?.expiresAt) {
          const expiresAt = new Date(attemptData.expiresAt).getTime();
          remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        } else {
          remainingSeconds = (examData.duration || 60) * 60;
        }
        setTimeLeft(remainingSeconds);

        setMode('AWAITING_START');

        // Automatic voice greeting per accessibility requirement
        const greeting = `You are successfully in your examination for ${examData.title}, subject ${examData.subject}. Duration is ${examData.duration} minutes. There are ${qList.length} questions. You do not need to click anything. May I start reading the questions? Please say 'start' or 'yes' to begin.`;
        speakWithCallback(greeting, () => {
          if (isMounted) {
            listenForCommands();
          }
        });
      } catch (err) {
        if (!isMounted) return;
        console.error('[Exam Init Error]', err);
        setNotification({
          type: 'error',
          message: err.response?.data?.message || 'Unable to access examination session',
        });
        speakText('Unable to access examination session. Please notify your invigilator.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initExam();

    return () => {
      isMounted = false;
      stopSpeech();
      stopListening();
    };
  }, [examId]);

  // ── Countdown Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || submitting || !attempt || mode === 'SUBMITTED') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeSubmission();
          return 0;
        }
        // 5-minute warning audio alert
        if (prev === 300) {
          speakText('Alert: Five minutes remaining in your examination.');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, attempt, mode, executeSubmission, speakText]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const currentAnswer = currentQuestion ? (answers[currentQuestion._id] || '') : '';

  if (mode === 'LOADING') {
    return <LoadingSpinner text="Connecting to authenticated exam session..." />;
  }

  if (!exam || !attempt) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
        <Notification type="error" message={notification.message || 'Unable to load exam session.'} />
        <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')} style={{ marginTop: '1rem' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Top Header with Voice State & Timer ── */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderColor: mode === 'ANSWERING' ? 'var(--accent-emerald)' : timeLeft < 300 ? 'var(--accent-rose)' : 'var(--primary)',
          transition: 'border-color 0.3s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span className="badge badge-active">{exam.subject}</span>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
              Question {currentIdx + 1} of {questions.length}
            </span>
            {saving && <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>Saving...</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            {exam.title}
          </h1>
        </div>

        {/* Live Audio Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '9999px',
              background: speaking
                ? 'rgba(59, 130, 246, 0.2)'
                : mode === 'ANSWERING'
                ? 'rgba(16, 185, 129, 0.25)'
                : isListening
                ? 'rgba(99, 102, 241, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
            }}
          >
            {speaking ? (
              <>
                <Volume2 size={18} color="var(--accent-cyan)" className="animate-pulse" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Reading Aloud...</span>
              </>
            ) : mode === 'ANSWERING' ? (
              <>
                <Mic size={18} color="var(--accent-emerald)" className="animate-pulse" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>Recording Your Answer</span>
              </>
            ) : isListening ? (
              <>
                <Mic size={18} color="var(--primary-light)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Listening for Commands</span>
              </>
            ) : (
              <>
                <MicOff size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Mic Standby</span>
              </>
            )}
          </div>

          {/* Time Remaining Display */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
              <Clock size={14} color={timeLeft < 300 ? 'var(--accent-rose)' : 'var(--accent-cyan)'} />
              <span>Time Left</span>
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: timeLeft < 300 ? 'var(--accent-rose)' : 'var(--text-main)',
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />

      {/* ── Real-Time Voice Activity / Transcript Bar ── */}
      <div
        className="glass-card"
        style={{
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Voice Input:</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {lastHeard || (isListening ? 'Speak your command or answer...' : 'Ready')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
            onClick={() => handleVoiceCommand('help')}
          >
            <HelpCircle size={14} /> Voice Commands
          </button>
        </div>
      </div>

      {/* ── Submission Confirmation Banner ── */}
      {mode === 'CONFIRMING_SUBMIT' && (
        <div
          className="glass-card animate-fade-in"
          style={{
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'var(--accent-rose)',
            textAlign: 'center',
            padding: '1.5rem',
          }}
        >
          <AlertTriangle size={32} color="var(--accent-rose)" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Confirm Examination Submission
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            Say <strong style={{ color: 'var(--accent-emerald)' }}>"Yes"</strong> to submit your answers now, or say <strong style={{ color: 'var(--accent-rose)' }}>"No"</strong> to keep working.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
              onClick={() => executeSubmission()}
            >
              <Check size={16} /> Yes, Submit Exam
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setMode('IDLE');
                speakWithCallback('Submission cancelled. Returning to examination.', () => {
                  listenForCommands();
                });
              }}
            >
              Cancel & Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Main Question & Answer Interface ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Current Question Display */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {currentQuestion?.sectionTitle || 'Section A'}
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Question {currentQuestion?.questionNumber || currentIdx + 1}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-active">{currentQuestion?.marks || 2} Marks</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem' }}
                  onClick={() => readCurrentQuestion(currentIdx)}
                  title="Read Question Aloud"
                  aria-label="Read Question Aloud"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div style={{ fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              {currentQuestion?.questionText}
            </div>

            {/* MCQ Options if any */}
            {currentQuestion?.options && currentQuestion.options.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                {currentQuestion.options.map((opt) => (
                  <div
                    key={opt.label}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--primary-light)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '0.95rem' }}>{opt.text}</span>
                  </div>
                ))}
              </div>
            )}

            {currentQuestion?.instructions && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Note: {currentQuestion.instructions}
              </div>
            )}
          </div>

          {/* Question Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="btn btn-secondary"
              disabled={currentIdx === 0}
              onClick={() => {
                const prev = currentIdx - 1;
                setCurrentIdx(prev);
                readCurrentQuestion(prev);
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => readCurrentQuestion(currentIdx)}
            >
              <RotateCcw size={16} /> Repeat
            </button>

            <button
              className="btn btn-primary"
              disabled={currentIdx >= questions.length - 1}
              onClick={() => {
                const next = currentIdx + 1;
                setCurrentIdx(next);
                readCurrentQuestion(next);
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: Student Answer Sheet */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mic size={18} color="var(--accent-emerald)" />
                Candidate Answer Sheet
              </h2>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {mode === 'ANSWERING' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-emerald)', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={handleStopAnswering}
                  >
                    <Check size={14} /> Stop & Save Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      setMode('ANSWERING');
                      speakWithCallback('Recording answer. Speak clearly. Say done when finished.', () => {
                        listenForAnswer();
                      });
                    }}
                  >
                    <Mic size={14} /> Start Answering
                  </button>
                )}
              </div>
            </div>

            {/* Answer Text Area */}
            <div className="form-group">
              <label className="form-label" htmlFor="answer-sheet" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Answer for Question {currentQuestion?.questionNumber || currentIdx + 1}</span>
                <span style={{ fontSize: '0.75rem', color: currentAnswer ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {currentAnswer ? 'Answer Recorded' : 'No Answer Yet'}
                </span>
              </label>

              <textarea
                id="answer-sheet"
                className="form-textarea"
                rows={10}
                placeholder={
                  mode === 'ANSWERING'
                    ? 'Listening... Dictate your answer now.'
                    : "Your spoken response will appear here. Say 'answer' to dictate or type directly."
                }
                value={currentAnswer + (liveAnswerBuffer ? ` ${liveAnswerBuffer}` : '')}
                onChange={(e) => {
                  if (currentQuestion) {
                    const text = e.target.value;
                    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: text }));
                  }
                }}
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  borderColor: mode === 'ANSWERING' ? 'var(--accent-emerald)' : 'var(--border-color)',
                }}
              />
            </div>
          </div>

          {/* Action Row for Answer */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                if (currentAnswer && currentAnswer.trim().length > 0) {
                  speakWithCallback(`Your answer for question ${currentQuestion?.questionNumber || currentIdx + 1} is: ${currentAnswer}`, () => {
                    listenForCommands();
                  });
                } else {
                  speakWithCallback('You have not recorded an answer for this question yet.', () => {
                    listenForCommands();
                  });
                }
              }}
            >
              <Volume2 size={16} /> Read My Answer
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (currentQuestion) {
                  setAnswers((prev) => ({ ...prev, [currentQuestion._id]: '' }));
                  studentAPI.saveSingleAnswer(examId, currentQuestion._id, '').catch(() => {});
                  speakWithCallback('Answer cleared.', () => {
                    listenForCommands();
                  });
                }
              }}
              title="Clear Answer"
            >
              Clear
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
              onClick={() => {
                setMode('CONFIRMING_SUBMIT');
                speakWithCallback('Are you sure you want to submit your examination? Please say Yes to confirm or No to cancel.', () => {
                  listenForCommands();
                });
              }}
            >
              <Send size={16} /> Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* ── Question Navigator Bar (Bottom) ── */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
          Question Navigation:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {questions.map((q, idx) => {
            const hasAns = answers[q._id] && answers[q._id].trim().length > 0;
            const isCurr = idx === currentIdx;
            return (
              <button
                key={q._id || idx}
                onClick={() => {
                  setCurrentIdx(idx);
                  readCurrentQuestion(idx);
                }}
                className={`btn ${isCurr ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  minWidth: '42px',
                  height: '42px',
                  padding: '0.3rem',
                  fontWeight: 700,
                  position: 'relative',
                  borderColor: hasAns ? 'var(--accent-emerald)' : undefined,
                }}
                aria-label={`Go to question ${q.questionNumber || idx + 1}${hasAns ? ' (Answered)' : ''}`}
              >
                {q.questionNumber || idx + 1}
                {hasAns && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--accent-emerald)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamTakePage;
