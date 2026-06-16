const POINTS_TO_ADVANCE = 20;
const CORRECT_POINTS = 2;
const INCORRECT_PENALTY = 2;
const QUESTIONS_PER_LEVEL = 12;
const LEVEL_TIMER_WINDOWS = [10, 8, 6, 6, 5];
const STORAGE_KEY = 'verlyn-math-game-stats';

const scoreEl = document.getElementById('score');
const progressEl = document.getElementById('progress');
const levelEl = document.getElementById('level');
const timerEl = document.getElementById('timer');
const timerProfileEl = document.getElementById('timer-profile');
const nextLevelTargetEl = document.getElementById('next-level-target');
const questionCountEl = document.getElementById('question-count');
const streakEl = document.getElementById('streak');
const bestStreakEl = document.getElementById('best-streak');
const accuracyEl = document.getElementById('accuracy');
const answerBreakdownEl = document.getElementById('answer-breakdown');
const bestScoreEl = document.getElementById('best-score');
const highestLevelEl = document.getElementById('highest-level');
const roundLabelEl = document.getElementById('round-label');
const questionTextEl = document.getElementById('question-text');
const choicesEl = document.getElementById('choices');
const feedbackEl = document.getElementById('feedback');
const startButtonEl = document.getElementById('start-button');

function getRoundTime(level) {
  return LEVEL_TIMER_WINDOWS[Math.min(level - 1, LEVEL_TIMER_WINDOWS.length - 1)];
}

function getOperationPool(level) {
  if (level === 1) {
    return ['+'];
  }

  if (level === 2) {
    return ['+', '-'];
  }

  if (level === 3) {
    return ['+', '-', '*'];
  }

  if (level === 4) {
    return ['+', '-', '*', '/'];
  }

  return ['+', '-', '*', '/'];
}

function getDefaultSavedStats() {
  return {
    totalCorrect: 0,
    totalMisses: 0,
    bestScore: 0,
    highestLevel: 1,
  };
}

function loadSavedStats() {
  try {
    const rawStats = window.localStorage.getItem(STORAGE_KEY);
    if (!rawStats) {
      return getDefaultSavedStats();
    }

    const parsedStats = JSON.parse(rawStats);
    return {
      totalCorrect: Number.isFinite(parsedStats.totalCorrect) ? Math.max(0, parsedStats.totalCorrect) : 0,
      totalMisses: Number.isFinite(parsedStats.totalMisses) ? Math.max(0, parsedStats.totalMisses) : 0,
      bestScore: Number.isFinite(parsedStats.bestScore) ? Math.max(0, parsedStats.bestScore) : 0,
      highestLevel: Number.isFinite(parsedStats.highestLevel) ? Math.max(1, parsedStats.highestLevel) : 1,
    };
  } catch (error) {
    return getDefaultSavedStats();
  }
}

const state = {
  score: 0,
  level: 1,
  questionNumber: 0,
  levelQuestionNumber: 0,
  streak: 0,
  bestStreak: 0,
  correctAnswers: 0,
  missedAnswers: 0,
  timeLeft: getRoundTime(1),
  currentQuestion: null,
  timerId: null,
  hasAnswered: false,
  gameStarted: false,
  levelTransitionPending: false,
  gameOver: false,
  savedStats: loadSavedStats(),
};

function saveStats() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedStats));
}

function syncSavedRecords() {
  state.savedStats.bestScore = Math.max(state.savedStats.bestScore, state.score);
  state.savedStats.highestLevel = Math.max(state.savedStats.highestLevel, state.level);
  saveStats();
}

function recordCorrectAnswer() {
  state.correctAnswers += 1;
  state.savedStats.totalCorrect += 1;
  syncSavedRecords();
}

function recordMiss() {
  state.missedAnswers += 1;
  state.savedStats.totalMisses += 1;
  syncSavedRecords();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function createQuestion(level) {
  const maxBase = 10 + level * 5;
  const operations = getOperationPool(level);
  const operation = operations[randomInt(0, operations.length - 1)];
  let left = randomInt(1, maxBase);
  let right = randomInt(1, maxBase);
  let answer = 0;

  if (operation === '+') {
    answer = left + right;
  } else if (operation === '-') {
    if (right > left) {
      [left, right] = [right, left];
    }
    answer = left - right;
  } else if (operation === '*') {
    left = randomInt(2, Math.max(4, Math.min(12, 3 + level * 2)));
    right = randomInt(2, Math.max(4, Math.min(12, 4 + level * 2)));
    answer = left * right;
  } else {
    right = randomInt(2, Math.max(4, Math.min(12, 3 + level * 2)));
    answer = randomInt(2, Math.max(4, Math.min(12, 4 + level * 2)));
    left = right * answer;
  }

  const distractors = new Set();
  while (distractors.size < 2) {
    const offset = randomInt(1, 4 + level);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const candidate = answer + direction * offset;
    if (candidate !== answer && candidate >= 0) {
      distractors.add(candidate);
    }
  }

  const choices = shuffle([answer, ...distractors]).map((value) => ({
    value,
    isCorrect: value === answer,
  }));

  return {
    prompt: `${left} ${operation} ${right} = ?`,
    answer,
    choices,
    operation,
  };
}

function getAccuracy(correct, misses) {
  const attempts = correct + misses;
  if (!attempts) {
    return 0;
  }

  return Math.round((correct / attempts) * 100);
}

function updateStatus() {
  const roundTime = getRoundTime(state.level);
  const pointsRemaining = Math.max(0, POINTS_TO_ADVANCE - state.score);

  scoreEl.textContent = String(state.score);
  progressEl.textContent = `${Math.min(state.score, POINTS_TO_ADVANCE)} / ${POINTS_TO_ADVANCE}`;
  levelEl.textContent = String(state.level);
  timerEl.textContent = `${state.timeLeft}s`;
  timerProfileEl.textContent = `${roundTime}s per question`;
  nextLevelTargetEl.textContent =
    pointsRemaining === 0 ? 'Milestone reached' : `${pointsRemaining} points to level ${state.level + 1}`;
  questionCountEl.textContent = `${state.levelQuestionNumber} / ${QUESTIONS_PER_LEVEL}`;
  streakEl.textContent = String(state.streak);
  bestStreakEl.textContent = String(state.bestStreak);
  accuracyEl.textContent = `${getAccuracy(state.correctAnswers, state.missedAnswers)}%`;
  answerBreakdownEl.textContent = `${state.correctAnswers} / ${state.missedAnswers}`;
  bestScoreEl.textContent = String(state.savedStats.bestScore);
  highestLevelEl.textContent = String(state.savedStats.highestLevel);
}

function setFeedback(message, tone = '') {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback${tone ? ` ${tone}` : ''}`;
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function renderChoices() {
  choicesEl.innerHTML = '';

  state.currentQuestion.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.textContent = String(choice.value);
    button.addEventListener('click', () => handleAnswer(choice.value, button));
    choicesEl.appendChild(button);
  });
}

function nextQuestion() {
  state.questionNumber += 1;
  state.levelQuestionNumber += 1;
  state.timeLeft = getRoundTime(state.level);
  state.hasAnswered = false;
  state.levelTransitionPending = false;
  state.currentQuestion = createQuestion(state.level);
  roundLabelEl.textContent = `Question ${state.questionNumber} · Level ${state.level}`;
  questionTextEl.textContent = state.currentQuestion.prompt;
  renderChoices();
  updateStatus();
  startRoundTimer();
}

function lockChoices(correctValue, selectedButton) {
  const buttons = choicesEl.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = true;
    if (Number(button.textContent) === correctValue) {
      button.classList.add('correct');
    }
  });

  if (selectedButton && Number(selectedButton.textContent) !== correctValue) {
    selectedButton.classList.add('incorrect');
  }
}

function handleLevelAdvance() {
  const previousLevel = state.level;
  state.level += 1;
  state.score = 0;
  state.streak = 0;
  state.levelQuestionNumber = 0;
  state.timeLeft = getRoundTime(state.level);
  state.levelTransitionPending = true;
  syncSavedRecords();
  roundLabelEl.textContent = `Level ${previousLevel} complete · Milestone reached`;
  questionTextEl.textContent = `Nice work! You reached 20 points and unlocked level ${state.level}.`;
  setFeedback(`Level cleared! Starting level ${state.level} in a moment with ${state.timeLeft}s per question.`, 'success');
  updateStatus();
  window.setTimeout(() => {
    if (state.gameStarted && !state.gameOver) {
      nextQuestion();
    }
  }, 1200);
}

function handleLevelFail() {
  state.gameStarted = false;
  state.gameOver = true;
  clearTimer();
  roundLabelEl.textContent = `Level ${state.level} failed`;
  questionTextEl.textContent = `You needed ${POINTS_TO_ADVANCE} points in ${QUESTIONS_PER_LEVEL} questions.`;
  choicesEl.innerHTML = '';
  startButtonEl.textContent = 'Retry level';
  setFeedback('Level failed. Wrong answers cost -2, timeouts count as misses only, and you can retry this level now.', 'warning');
  updateStatus();
}

function checkProgression() {
  if (state.score >= POINTS_TO_ADVANCE) {
    handleLevelAdvance();
    return true;
  }

  if (state.levelQuestionNumber >= QUESTIONS_PER_LEVEL) {
    handleLevelFail();
    return true;
  }

  return false;
}

function scheduleNextQuestion() {
  window.setTimeout(() => {
    if (state.gameStarted && !state.levelTransitionPending && !state.gameOver) {
      nextQuestion();
    }
  }, 900);
}

function handleAnswer(selectedValue, selectedButton) {
  if (state.hasAnswered || !state.currentQuestion || !state.gameStarted) {
    return;
  }

  state.hasAnswered = true;
  clearTimer();

  const isCorrect = selectedValue === state.currentQuestion.answer;
  if (isCorrect) {
    state.score += CORRECT_POINTS;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    recordCorrectAnswer();
    setFeedback(`Correct! +2 points. Accuracy: ${getAccuracy(state.correctAnswers, state.missedAnswers)}%.`, 'success');
  } else {
    state.score = Math.max(0, state.score - INCORRECT_PENALTY);
    state.streak = 0;
    recordMiss();
    setFeedback(`Not this time. -2 points. Correct answer: ${state.currentQuestion.answer}.`, 'warning');
  }

  syncSavedRecords();
  lockChoices(state.currentQuestion.answer, selectedButton);
  updateStatus();

  if (!checkProgression()) {
    scheduleNextQuestion();
  }
}

function handleTimeout() {
  if (state.hasAnswered || !state.currentQuestion || !state.gameStarted) {
    return;
  }

  state.hasAnswered = true;
  state.streak = 0;
  recordMiss();
  setFeedback(`Time ran out. That miss does not change your score. Correct answer: ${state.currentQuestion.answer}.`, 'warning');
  lockChoices(state.currentQuestion.answer);
  updateStatus();

  if (!checkProgression()) {
    scheduleNextQuestion();
  }
}

function startRoundTimer() {
  clearTimer();
  timerEl.textContent = `${state.timeLeft}s`;

  state.timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    timerEl.textContent = `${state.timeLeft}s`;

    if (state.timeLeft <= 0) {
      clearTimer();
      handleTimeout();
    }
  }, 1000);
}

function startGame() {
  clearTimer();
  state.gameStarted = true;
  state.gameOver = false;
  state.levelTransitionPending = false;
  state.score = 0;
  state.level = 1;
  state.questionNumber = 0;
  state.levelQuestionNumber = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctAnswers = 0;
  state.missedAnswers = 0;
  state.currentQuestion = null;
  state.hasAnswered = false;
  state.timeLeft = getRoundTime(1);
  state.savedStats = loadSavedStats();
  startButtonEl.textContent = 'Restart game';
  setFeedback('Choose 1 of 3 answers. Correct answers add +2, wrong answers cost -2, and timeouts count as misses without changing score.', '');
  updateStatus();
  nextQuestion();
}

startButtonEl.addEventListener('click', startGame);
updateStatus();