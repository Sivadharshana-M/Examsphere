/**
 * Command Matcher for ExamSphere AI Voice Examination Interface
 * Provides deterministic matching for all student voice commands
 * Handles variations, filler words, punctuation, and question numbers.
 */

export const INTENTS = {
  START_READING: 'START_READING',
  NEXT_QUESTION: 'NEXT_QUESTION',
  PREV_QUESTION: 'PREV_QUESTION',
  REPEAT_QUESTION: 'REPEAT_QUESTION',
  GOTO_QUESTION: 'GOTO_QUESTION',
  START_ANSWERING: 'START_ANSWERING',
  STOP_ANSWERING: 'STOP_ANSWERING',
  READ_ANSWER: 'READ_ANSWER',
  CLEAR_ANSWER: 'CLEAR_ANSWER',
  CHECK_TIME: 'CHECK_TIME',
  READ_INSTRUCTIONS: 'READ_INSTRUCTIONS',
  CONFIRM_SUBMIT: 'CONFIRM_SUBMIT',
  AFFIRM_YES: 'AFFIRM_YES',
  AFFIRM_NO: 'AFFIRM_NO',
  HELP: 'HELP',
  UNKNOWN: 'UNKNOWN',
};

// Clean and normalize spoken input
export const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
    .replace(/\s+/g, ' ');
};

// Extract question number from spoken phrase (e.g. "go to question three", "question 4")
const wordToNumber = {
  one: 1, first: 1,
  two: 2, second: 2,
  three: 3, third: 3,
  four: 4, fourth: 4,
  five: 5, fifth: 5,
  six: 6, sixth: 6,
  seven: 7, seventh: 7,
  eight: 8, eighth: 8,
  nine: 9, ninth: 9,
  ten: 10, tenth: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

export const extractQuestionNumber = (normalized) => {
  // Check digits e.g. "question 3", "number 3", "go to 3"
  const digitMatch = normalized.match(/(?:question|number|go to|jump to)\s+(\d+)/);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }

  // Check word numbers e.g. "question three"
  for (const [word, num] of Object.entries(wordToNumber)) {
    if (
      normalized.includes(`question ${word}`) ||
      normalized.includes(`number ${word}`) ||
      normalized.includes(`go to ${word}`) ||
      normalized.includes(`jump to ${word}`)
    ) {
      return num;
    }
  }

  // Standalone digits e.g. "3"
  const standaloneDigit = normalized.match(/^(\d+)$/);
  if (standaloneDigit) {
    return parseInt(standaloneDigit[1], 10);
  }

  return null;
};

/**
 * Classifies spoken user text into an intent
 * @param {string} rawText Spoken text from STT
 * @param {string} currentMode 'IDLE' | 'READING' | 'ANSWERING' | 'CONFIRMING_SUBMISSION'
 * @returns {{ intent: string, raw: string, targetQuestion?: number }}
 */
export const matchCommand = (rawText, currentMode = 'IDLE') => {
  const norm = normalizeText(rawText);
  if (!norm) return { intent: INTENTS.UNKNOWN, raw: rawText };

  // When confirming submission
  if (currentMode === 'CONFIRMING_SUBMISSION') {
    if (/^(yes|yeah|yep|confirm|submit|yes submit|yes please|sure|do it)/i.test(norm)) {
      return { intent: INTENTS.AFFIRM_YES, raw: rawText };
    }
    if (/^(no|cancel|stop|don't|dont|wait|back|no cancel)/i.test(norm)) {
      return { intent: INTENTS.AFFIRM_NO, raw: rawText };
    }
  }

  // When student is in the middle of answering, check for stop commands
  if (currentMode === 'ANSWERING') {
    if (
      norm.includes('stop answering') ||
      norm.includes('done answering') ||
      norm.includes('finish answer') ||
      norm.includes('save answer') ||
      norm.includes('save and next') ||
      norm === 'stop' ||
      norm === 'done' ||
      norm === 'finished'
    ) {
      return { intent: INTENTS.STOP_ANSWERING, raw: rawText };
    }
    // Any other speech while ANSWERING is treated as the answer text
    return { intent: INTENTS.START_ANSWERING, raw: rawText };
  }

  // Check question jumps
  const targetQ = extractQuestionNumber(norm);
  if (targetQ !== null) {
    return { intent: INTENTS.GOTO_QUESTION, raw: rawText, targetQuestion: targetQ };
  }

  // Start reading commands
  if (
    norm.includes('may i start reading') ||
    norm.includes('start reading') ||
    norm.includes('start exam') ||
    norm.includes('begin exam') ||
    norm.includes('read first question') ||
    norm.includes('start questions') ||
    norm === 'start' ||
    norm === 'begin'
  ) {
    return { intent: INTENTS.START_READING, raw: rawText };
  }

  // Next Question
  if (
    norm.includes('next question') ||
    norm.includes('next one') ||
    norm.includes('move to next') ||
    norm === 'next' ||
    norm === 'forward'
  ) {
    return { intent: INTENTS.NEXT_QUESTION, raw: rawText };
  }

  // Previous Question
  if (
    norm.includes('previous question') ||
    norm.includes('prev question') ||
    norm.includes('last question') ||
    norm.includes('go back') ||
    norm === 'previous' ||
    norm === 'back'
  ) {
    return { intent: INTENTS.PREV_QUESTION, raw: rawText };
  }

  // Repeat Question
  if (
    norm.includes('repeat question') ||
    norm.includes('read question again') ||
    norm.includes('read again') ||
    norm.includes('say again') ||
    norm.includes('repeat') ||
    norm === 'again'
  ) {
    return { intent: INTENTS.REPEAT_QUESTION, raw: rawText };
  }

  // Start Answering
  if (
    norm.includes('answer') ||
    norm.includes('start answering') ||
    norm.includes('record answer') ||
    norm.includes('take answer') ||
    norm.includes('type answer') ||
    norm.includes('i want to answer')
  ) {
    return { intent: INTENTS.START_ANSWERING, raw: rawText };
  }

  // Read My Answer
  if (
    norm.includes('read my answer') ||
    norm.includes('read answer') ||
    norm.includes('what is my answer') ||
    norm.includes('check my answer') ||
    norm.includes('playback answer')
  ) {
    return { intent: INTENTS.READ_ANSWER, raw: rawText };
  }

  // Clear Answer
  if (
    norm.includes('clear answer') ||
    norm.includes('erase answer') ||
    norm.includes('delete answer') ||
    norm.includes('remove answer')
  ) {
    return { intent: INTENTS.CLEAR_ANSWER, raw: rawText };
  }

  // Check Remaining Time
  if (
    norm.includes('time left') ||
    norm.includes('how much time') ||
    norm.includes('remaining time') ||
    norm.includes('check time') ||
    norm.includes('timer') ||
    norm === 'time'
  ) {
    return { intent: INTENTS.CHECK_TIME, raw: rawText };
  }

  // Read Instructions
  if (
    norm.includes('read instruction') ||
    norm.includes('read instructions') ||
    norm.includes('exam instructions') ||
    norm.includes('instructions')
  ) {
    return { intent: INTENTS.READ_INSTRUCTIONS, raw: rawText };
  }

  // Submit Exam
  if (
    norm.includes('submit my exam') ||
    norm.includes('submit exam') ||
    norm.includes('finish exam') ||
    norm.includes('end exam') ||
    norm.includes('i want to submit') ||
    norm === 'submit'
  ) {
    return { intent: INTENTS.CONFIRM_SUBMIT, raw: rawText };
  }

  // Help
  if (
    norm.includes('help') ||
    norm.includes('what can i say') ||
    norm.includes('list commands') ||
    norm.includes('commands')
  ) {
    return { intent: INTENTS.HELP, raw: rawText };
  }

  // Affirmations
  if (/^(yes|yeah|yep|sure|okay|ok)$/i.test(norm)) {
    return { intent: INTENTS.AFFIRM_YES, raw: rawText };
  }
  if (/^(no|nope|cancel)$/i.test(norm)) {
    return { intent: INTENTS.AFFIRM_NO, raw: rawText };
  }

  return { intent: INTENTS.UNKNOWN, raw: rawText };
};
