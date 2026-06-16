const POINTS_TO_ADVANCE = 20;
const CORRECT_POINTS = 5;
const INCORRECT_PENALTY = 2;
const LEVEL_TIMER_WINDOWS = [10, 8, 6];
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
  streak: 0,
  bestStreak: 0,
  correctAnswers: 0,
  missedAnswers: 0,
  timeLeft: getRoundTime(1),
  currentQuestion: null,
  timerId: null,
  hasAnswered: false,
  gameStarted: false,
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
  const operations = ['+', '-'];
  const operation = operations[randomInt(0, operations.length - 1)];
  let left = randomInt(1, maxBase);
  let right = randomInt(1, maxBase);

  if (operation === '-' && right > left) {
    [left, right] = [right, left];
  }

  const answer = operation === '+' ? left + right : left - right;
  const distractors = new Set();

  while (distractors.size < 2) {
    const offset = randomInt(1, 4 + level);
    const candidate = answer + (Math.random() > 0.5 ? offset : -offset);
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
  nextLevelTargetEl.textContent = pointsRemaining === 0 ? 'Level up on this question' : `${pointsRemaining} points to level ${state.level + 1}`;
  questionCountEl.textContent = String(state.questionNumber);
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
  state.timeLeft = getRoundTime(state.level);
  state.hasAnswered = false;
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

function checkProgression() {
  if (state.score >= POINTS_TO_ADVANCE) {
    const previousLevel = state.level;
    state.level += 1;
    state.score = 0;
    state.streak = 0;
    state.timeLeft = getRoundTime(state.level);
    syncSavedRecords();
    roundLabelEl.textContent = `Level ${previousLevel} complete · Moving to level ${state.level}`;
    questionTextEl.textContent = `You hit ${POINTS_TO_ADVANCE} points. Get ready for faster questions.`;
    setFeedback(`Level cleared! Timer tightens to ${state.timeLeft}s for level ${state.level}.`, 'success');
  }
}

function scheduleNextQuestion() {
  window.setTimeout(() => {
    if (state.gameStarted) {
      nextQuestion();
    }
  }, 900);
}

function handleAnswer(selectedValue, selectedButton) {
  if (state.hasAnswered || !state.currentQuestion) {
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
    setFeedback(`Correct! +5 points. Accuracy: ${getAccuracy(state.correctAnswers, state.missedAnswers)}%.`, 'success');
  } else {
    state.score = Math.max(0, state.score - INCORRECT_PENALTY);
    state.streak = 0;
    recordMiss();
    setFeedback(`Not this time. -2 points. Correct answer: ${state.currentQuestion.answer}.`, 'warning');
  }

  syncSavedRecords();
  lockChoices(state.currentQuestion.answer, selectedButton);
  checkProgression();
  updateStatus();
  scheduleNextQuestion();
}

function handleTimeout() {
  if (state.hasAnswered || !state.currentQuestion) {
    return;
  }

  state.hasAnswered = true;
  state.score = Math.max(0, state.score - INCORRECT_PENALTY);
  state.streak = 0;
  recordMiss();
  setFeedback(`Time ran out and counts as a miss. -2 points. Correct answer: ${state.currentQuestion.answer}.`, 'warning');
  lockChoices(state.currentQuestion.answer);
  checkProgression();
  updateStatus();
  scheduleNextQuestion();
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
  state.score = 0;
  state.level = 1;
  state.questionNumber = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctAnswers = 0;
  state.missedAnswers = 0;
  state.currentQuestion = null;
  state.hasAnswered = false;
  state.timeLeft = getRoundTime(1);
  state.savedStats = loadSavedStats();
  startButtonEl.textContent = 'Restart game';
  setFeedback('Choose the correct answer before the timer runs out. Misses and timeouts both cost 2 points, and your device keeps lifetime records.', '');
  updateStatus();
  nextQuestion();
}

startButtonEl.addEventListener('click', startGame);
updateStatus();
