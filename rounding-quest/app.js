(function () {
  'use strict';

  const APP_VERSION = 503;
  const CORRECT_FX_MS = 900;
  const ACTIVE_SESSION_KEY = 'roundingQuest.activeSession.v1';
  const params = new URLSearchParams(window.location.search);
  const shownVersion = Math.max(Number(params.get('cb') || 0), Number(params.get('v') || 0));
  const hasVersionParam = params.has('cb') || params.has('v');
  if (!hasVersionParam || shownVersion !== APP_VERSION) {
    params.set('cb', String(APP_VERSION));
    params.set('v', String(APP_VERSION));
    window.location.replace(`${window.location.pathname}?${params.toString()}${window.location.hash}`);
    return;
  }

  const core = window.RoundingCore;
  const els = {
    homeView: document.getElementById('homeView'),
    sessionView: document.getElementById('sessionView'),
    resultView: document.getElementById('resultView'),
    stageSelect: document.getElementById('stageSelect'),
    homeDock: document.querySelector('.home-dock'),
    homeMapOverlay: document.getElementById('homeMapOverlay'),
    homeProgress: document.querySelector('.home-progress'),
    homeGoal: document.querySelector('.hero-copy > p:not(.eyebrow):not(.save-note)'),
    homeProgressCurrent: document.getElementById('homeProgressCurrent'),
    homeProgressRemain: document.getElementById('homeProgressRemain'),
    sessionMap: document.getElementById('sessionMap'),
    stageBanner: document.getElementById('stageBanner'),
    questionCard: document.querySelector('#sessionView .question-card'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    reviewButton: document.getElementById('reviewButton'),
    sessionHomeButton: document.getElementById('sessionHomeButton'),
    againButton: document.getElementById('againButton'),
    resultReviewButton: document.getElementById('resultReviewButton'),
    homeButton: document.getElementById('homeButton'),
    modeLabel: document.getElementById('modeLabel'),
    questionCounter: document.getElementById('questionCounter'),
    scoreText: document.getElementById('scoreText'),
    scoreBar: document.getElementById('scoreBar'),
    comboChip: document.getElementById('comboChip'),
    questionLabel: document.getElementById('questionLabel'),
    questionText: document.getElementById('questionText'),
    supportText: document.getElementById('supportText'),
    answerInput: document.getElementById('answerInput'),
    submitButton: document.getElementById('submitButton'),
    tenkey: document.getElementById('tenkey'),
    coachStrip: document.getElementById('coachStrip'),
    typeBadges: document.getElementById('typeBadges'),
    feedbackBox: document.getElementById('feedbackBox'),
    visualBoard: document.getElementById('visualBoard'),
    sparkLayer: document.getElementById('sparkLayer'),
    resultTitle: document.getElementById('resultTitle'),
    resultCopy: document.getElementById('resultCopy'),
    rewardScene: document.getElementById('rewardScene'),
    mistakeList: document.getElementById('mistakeList'),
  };

  const RPG_ASSETS = {
    correct: 'assets/rpg/correct-burst.png',
    repair: 'assets/rpg/repair-workshop.png',
    treasure: 'assets/rpg/treasure-chest.png',
    castle: 'assets/rpg/ending-castle.png',
    finalReward: 'assets/rpg/final-reward.png',
    worldMap: 'assets/rpg/world-map.png',
    heroIcon: 'assets/generated/hero-walker.png',
    resultClear: 'assets/generated/result-clear-celebration.png',
    chapterUnlock: 'assets/generated/chapter-unlock-gate.png',
    chapterUnlocks: {
      'round-place': 'assets/generated/chapter-unlock-round-place.png',
      significant: 'assets/generated/chapter-unlock-significant.png',
      'final-mix': 'assets/generated/chapter-unlock-final-mix.png',
    },
    finalClear: 'assets/generated/final-clear-celebration.png',
  };

  const STAGE_CARD_IMAGE_PATHS = {
    'round-digit': 'assets/generated/stage-card-round-digit.png',
    'round-place': 'assets/generated/stage-card-round-place.png',
    significant: 'assets/generated/stage-card-significant.png',
    'final-mix': 'assets/generated/stage-card-final-mix.png',
  };

  function img(path) {
    if (!path || path.startsWith('data:') || /^https?:\/\//.test(path)) return path;
    const normalized = path.replace(/^\.\//, '');
    const embedded = window.__ROUNDING_ASSET_IMAGES__ || {};
    if (embedded[normalized]) return embedded[normalized];
    return `./${normalized}`;
  }

  function miniStageBadge(stageId) {
    return stageCardBadge(stageId);
  }

  function stageCardBadge(stageId) {
    const embedded = window.__ROUNDING_STAGE_CARD_IMAGES__ || {};
    if (embedded[stageId]) return embedded[stageId];
    const path = STAGE_CARD_IMAGE_PATHS[stageId];
    if (path) return img(path);
    const stage = core.getStage(stageId);
    return stage ? img(stage.badge) : '';
  }

  function stageStateLabel(stage, unlocked, blockedByReview, cleared) {
    if (blockedByReview) return '見直し後';
    if (cleared) return 'クリア済み';
    if (!unlocked) return '未開放';
    if (stage.id === selectedStageId) return 'チャレンジ中';
    return '開放中';
  }

  function stageCardTitle(stage) {
    const titles = {
      'round-digit': '何の位で<br>四捨五入',
      'round-place': '何の位までの<br>がい数',
      significant: '上から何けたの<br>がい数',
      'final-mix': 'まとめバトル',
    };
    return titles[stage.id] || stage.title;
  }

  function questionActionLabel(stageId, reviewOnly) {
    if (reviewOnly) return 'やり直し';
    if (stageId === 'significant') return 'がい数にしよう';
    if (stageId === 'final-mix') return 'まとめてとこう';
    return '四捨五入しよう';
  }

  function stageCardQuestName(stage) {
    const names = {
      'round-digit': '光の鍵',
      'round-place': '塔の光',
      significant: '星のメダル',
      'final-mix': '王冠の宝石',
    };
    return names[stage.id] || stage.artifact || stage.title;
  }

  function artifactIcon(stageId) {
    return stageCardBadge(stageId);
  }

  function chapterUnlockArt(nextStage) {
    if (!nextStage) return RPG_ASSETS.chapterUnlock;
    return RPG_ASSETS.chapterUnlocks[nextStage.id] || RPG_ASSETS.chapterUnlock;
  }

  function artifactUnit(stage) {
    return stage.artifactUnit || 'つ';
  }

  function artifactAmount(stage, count) {
    return `${count}`;
  }

  function artifactProgressText(stage, count) {
    return `${stage.artifact} ${count}/${STAGE_GOAL}`;
  }

  function artifactCollectText(stage, count) {
    return `${stage.artifact} +${count}`;
  }

  function artifactCompleteText(stage) {
    const verb = stage.completeVerb || '集まりました';
    return `${stage.artifact}が${artifactAmount(stage, STAGE_GOAL)}${verb}`;
  }

  function stageClearCopy(stage) {
    const messages = {
      'round-digit': '光の鍵で門が開きました。',
      'round-place': '塔の頂上まで光が届きました。',
      significant: '天空儀が星のメダルで動き出しました。',
      'final-mix': '王城に到着しました。',
    };
    return messages[stage.id] || `${stage.destination || '目的地'}に到着しました。`;
  }

  function preloadImages(paths) {
    paths.filter(Boolean).forEach((path) => {
      const image = new Image();
      image.src = img(path);
    });
  }

  function createStorage() {
    try {
      const testKey = 'roundingQuest.storageCheck';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    } catch (_) {
      const memory = new Map();
      return {
        getItem(key) {
          return memory.has(key) ? memory.get(key) : null;
        },
        setItem(key, value) {
          memory.set(key, String(value));
        },
        removeItem(key) {
          memory.delete(key);
        },
      };
    }
  }

  const storage = createStorage();
  let progress = core.loadProgress(storage);
  let selectedStageId = 'round-digit';
  let homeStageManuallySelected = false;
  let session = null;
  let noticeTimer = null;
  let ignoreEmptySubmitUntil = 0;
  let suppressEmptySubmitAfterRender = false;
  const TENKEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '全部消す', '0', '1つ消す'];
  const SESSION_LENGTH = core.SESSION_LENGTH || 10;
  const STAGE_GOAL = core.STAGE_GOAL || 30;
  const IS_LOCAL_DEV = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  let audioContext = null;

  function isValidQuestion(question) {
    if (!question || typeof question !== 'object') return false;
    if (!core.getStage(question.stageId)) return false;
    if (typeof question.id !== 'string' || !question.id.trim()) return false;
    if (typeof question.type !== 'string' || !question.type.trim()) return false;
    if (typeof question.prompt !== 'string' || !question.prompt.trim()) return false;
    if (!Number.isFinite(Number(question.answer))) return false;
    if (!question.visual || typeof question.visual !== 'object') return false;
    return true;
  }

  function cleanQuestionList(questions, expectedStageId = '') {
    if (!Array.isArray(questions)) return [];
    return questions.filter((question) => {
      if (!isValidQuestion(question)) return false;
      return !expectedStageId || question.stageId === expectedStageId;
    });
  }

  function cleanMistakeList(list, expectedStageId) {
    if (!Array.isArray(list)) return [];
    const cleaned = [];
    list.forEach((mistake) => {
      if (!mistake || typeof mistake !== 'object') return;
      if (!isValidQuestion(mistake.question)) return;
      if (expectedStageId && mistake.question.stageId !== expectedStageId) return;
      cleaned.push({
        question: mistake.question,
        input: core.normalizeAnswerText(String(mistake.input || '')).slice(0, 9),
        type: mistake.type || mistake.question.type || mistake.question.stageId,
      });
    });
    return cleaned.slice(-12);
  }

  function sanitizeProgressState(rawProgress) {
    const next = core.defaultProgress();
    next.sessions = Math.max(0, Number(rawProgress && rawProgress.sessions) || 0);
    next.best = Math.max(0, Number(rawProgress && rawProgress.best) || 0);
    next.bestStreak = Math.max(0, Number(rawProgress && rawProgress.bestStreak) || 0);
    next.materials = Math.max(0, Number(rawProgress && rawProgress.materials) || 0);
    next.mistakes = {};
    next.stageWins = {};
    core.STAGES.forEach((stage) => {
      const wins = rawProgress && rawProgress.stageWins ? rawProgress.stageWins[stage.id] : 0;
      next.stageWins[stage.id] = Math.min(STAGE_GOAL, Math.max(0, Number(wins) || 0));
      const mistakes = cleanMistakeList(rawProgress && rawProgress.mistakes ? rawProgress.mistakes[stage.id] : [], stage.id);
      if (mistakes.length) next.mistakes[stage.id] = mistakes;
    });
    return next;
  }

  function normalizeActiveSession(saved) {
    if (!saved || typeof saved !== 'object') return null;
    const stage = core.getStage(saved.stageId);
    if (!stage) return null;
    if (!Boolean(saved.reviewOnly) && !isStageUnlocked(stage.id)) return null;
    const questions = cleanQuestionList(saved.questions, saved.reviewOnly ? stage.id : '');
    if (!questions.length) return null;
    const index = Math.min(questions.length - 1, Math.max(0, Number(saved.index) || 0));
    return {
      reviewOnly: Boolean(saved.reviewOnly),
      stageId: stage.id,
      questions,
      index,
      correct: Math.min(questions.length, Math.max(0, Number(saved.correct) || 0)),
      streak: Math.min(questions.length, Math.max(0, Number(saved.streak) || 0)),
      bestStreak: Math.max(0, Number(saved.bestStreak) || 0),
      mistakes: cleanMistakeList(saved.mistakes, stage.id),
      reviewMistakes: cleanMistakeList(saved.reviewMistakes, stage.id),
      pathCorrectMarks: Array.isArray(saved.pathCorrectMarks) ? saved.pathCorrectMarks : [],
      pathMissMarks: Array.isArray(saved.pathMissMarks) ? saved.pathMissMarks : [],
      returnResultAfterReview: saved.returnResultAfterReview || null,
      answered: false,
      advanceTimer: null,
      startKeys: Math.min(STAGE_GOAL, Math.max(0, Number(saved.startKeys) || 0)),
      finishKeys: Math.min(STAGE_GOAL, Math.max(0, Number(saved.finishKeys) || 0)),
      resumeInput: String(saved.input || '').replace(/[^\d]/g, '').slice(0, 9),
    };
  }

  function loadActiveSession() {
    try {
      return normalizeActiveSession(JSON.parse(storage.getItem(ACTIVE_SESSION_KEY)));
    } catch (_) {
      return null;
    }
  }

  function clearActiveSession() {
    storage.removeItem(ACTIVE_SESSION_KEY);
  }

  function saveActiveSession() {
    if (!session) return;
    const nextIndex = session.answered ? session.index + 1 : session.index;
    if (nextIndex >= session.questions.length) {
      clearActiveSession();
      return;
    }
    const payload = {
      reviewOnly: session.reviewOnly,
      stageId: session.stageId,
      questions: session.questions,
      index: nextIndex,
      correct: session.correct,
      streak: session.streak,
      bestStreak: session.bestStreak,
      mistakes: session.mistakes,
      reviewMistakes: session.reviewMistakes,
      pathCorrectMarks: session.pathCorrectMarks,
      pathMissMarks: session.pathMissMarks,
      returnResultAfterReview: session.returnResultAfterReview || null,
      startKeys: session.startKeys,
      finishKeys: session.finishKeys,
      input: session.answered ? '' : els.answerInput.value,
    };
    storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(payload));
  }

  function resumeActiveSession() {
    const saved = loadActiveSession();
    if (!saved) return false;
    const pendingStageId = getPendingReviewStageId();
    if (pendingStageId && (!saved.reviewOnly || saved.stageId !== pendingStageId)) {
      clearActiveSession();
      return false;
    }
    session = saved;
    selectedStageId = saved.stageId;
    show(els.sessionView);
    renderQuestion();
    if (saved.resumeInput) {
      els.answerInput.value = saved.resumeInput;
      els.answerInput.focus();
    }
    return true;
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    return audioContext;
  }

  function hasSavedProgressData() {
    const stageWins = progress.stageWins || {};
    const mistakes = progress.mistakes || {};
    const hasStageWins = Object.values(stageWins).some((value) => Number(value) > 0);
    const hasMistakes = Object.values(mistakes).some((list) => Array.isArray(list) && list.length > 0);
    return Boolean(loadActiveSession())
      || Number(progress.sessions) > 0
      || Number(progress.best) > 0
      || Number(progress.bestStreak) > 0
      || Number(progress.materials) > 0
      || hasStageWins
      || hasMistakes;
  }

  function showFreshStartConfirm() {
    return new Promise((resolve) => {
      document.querySelectorAll('.fresh-start-confirm').forEach((node) => node.remove());
      const overlay = document.createElement('div');
      overlay.className = 'fresh-start-confirm';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'freshStartTitle');
      overlay.innerHTML = `
        <div class="fresh-start-panel">
          <strong id="freshStartTitle">はじめからにする？</strong>
          <p>これまでの進みぐあいを消して、最初の問題から始めます。</p>
          <p class="fresh-start-warning">あとから元にもどせません。</p>
          <div>
            <button type="button" class="fresh-cancel">やめる</button>
            <button type="button" class="fresh-accept">はじめから</button>
          </div>
        </div>
      `;
      const finish = (answer) => {
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
        resolve(answer);
      };
      const onKeyDown = (event) => {
        if (event.key === 'Escape') finish(false);
      };
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay || event.target.closest('.fresh-cancel')) finish(false);
        if (event.target.closest('.fresh-accept')) finish(true);
      });
      document.addEventListener('keydown', onKeyDown);
      document.body.appendChild(overlay);
      overlay.querySelector('.fresh-cancel')?.focus();
    });
  }

  async function startFromBeginning() {
    if (hasSavedProgressData()) {
      const confirmed = await showFreshStartConfirm();
      if (!confirmed) return;
    }
    clearActiveSession();
    session = null;
    progress = core.defaultProgress();
    selectedStageId = core.STAGES[0].id;
    homeStageManuallySelected = false;
    core.saveProgress(storage, progress);
    renderStageSelect();
    renderHomeStats();
    show(els.homeView);
  }

  function unlockAudio() {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  function playTone(context, time, frequency, duration, type, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  function playSound(kind) {
    const context = getAudioContext();
    if (!context) return;
    const schedule = () => {
      const now = context.currentTime + 0.01;
      if (kind === 'tap') {
        playTone(context, now, 520, 0.045, 'triangle', 0.028);
      } else if (kind === 'notice') {
        playTone(context, now, 320, 0.08, 'triangle', 0.035);
      } else if (kind === 'wrong') {
        playTone(context, now, 165, 0.13, 'sawtooth', 0.04);
        playTone(context, now + 0.08, 125, 0.16, 'sawtooth', 0.032);
      } else if (kind === 'correct') {
        [523, 659, 784].forEach((frequency, index) => {
          playTone(context, now + index * 0.07, frequency, 0.12, 'triangle', 0.045);
        });
      } else if (kind === 'stageClear') {
        [523, 659, 784, 1046].forEach((frequency, index) => {
          playTone(context, now + index * 0.09, frequency, 0.18, 'triangle', 0.05);
        });
      } else if (kind === 'finalClear') {
        [523, 659, 784, 1046, 1318].forEach((frequency, index) => {
          playTone(context, now + index * 0.11, frequency, 0.22, 'triangle', 0.052);
        });
      }
    };
    if (context.state === 'suspended') {
      context.resume().then(schedule).catch(() => {});
    } else {
      schedule();
    }
  }

  function show(view) {
    if (session && session.advanceTimer) {
      window.clearTimeout(session.advanceTimer);
      session.advanceTimer = null;
    }
    [els.homeView, els.sessionView, els.resultView].forEach((el) => {
      el.classList.add('hidden');
      if (el !== view) el.style.removeProperty('display');
    });
    view.classList.remove('hidden');
    const inSession = view === els.sessionView;
    const inResult = view === els.resultView;
    document.body.classList.toggle('session-mode', inSession);
    document.body.classList.toggle('result-mode', inResult);
    els.stageSelect.classList.toggle('hidden', inSession || inResult);
  }

  function createReturnResultAfterReview(sourceSession) {
    return {
      stageId: sourceSession.stageId,
      questions: sourceSession.questions,
      correct: sourceSession.correct,
      bestStreak: sourceSession.bestStreak,
      startKeys: sourceSession.startKeys,
      finishKeys: sourceSession.finishKeys,
      pathCorrectMarks: sourceSession.pathCorrectMarks,
      pathMissMarks: sourceSession.pathMissMarks,
    };
  }

  function showReturnResultAfterReview(snapshot) {
    session = {
      reviewOnly: false,
      stageId: snapshot.stageId,
      questions: Array.isArray(snapshot.questions) ? snapshot.questions : [],
      index: Array.isArray(snapshot.questions) ? snapshot.questions.length : 0,
      correct: Math.max(0, Number(snapshot.correct) || 0),
      streak: 0,
      bestStreak: Math.max(0, Number(snapshot.bestStreak) || 0),
      mistakes: [],
      reviewMistakes: [],
      pathCorrectMarks: Array.isArray(snapshot.pathCorrectMarks) ? snapshot.pathCorrectMarks : [],
      pathMissMarks: Array.isArray(snapshot.pathMissMarks) ? snapshot.pathMissMarks : [],
      returnResultAfterReview: null,
      answered: true,
      advanceTimer: null,
      startKeys: Math.min(STAGE_GOAL, Math.max(0, Number(snapshot.startKeys) || 0)),
      finishKeys: Math.min(STAGE_GOAL, Math.max(0, Number(snapshot.finishKeys) || 0)),
    };
    renderResult();
  }

  function startSession(reviewOnly, options = {}) {
    clearActiveSession();
    const pendingStageId = getPendingReviewStageId();
    if (pendingStageId) {
      selectedStageId = pendingStageId;
      reviewOnly = true;
    }
    if (!isStageUnlocked(selectedStageId)) {
      selectedStageId = getHighestUnlockedStage().id;
      renderStageSelect();
      renderHomeStats();
    }
    const reviewMistakes = cleanMistakeList(((progress.mistakes || {})[selectedStageId] || []).slice(-10), selectedStageId);
    if (reviewOnly && reviewMistakes.length !== (((progress.mistakes || {})[selectedStageId] || []).slice(-10)).length) {
      progress.mistakes[selectedStageId] = reviewMistakes;
      core.saveProgress(storage, progress);
    }
    const reviewQuestions = reviewMistakes.map((mistake) => mistake.question);
    if (reviewOnly && !reviewQuestions.length) {
      renderHomeStats();
      return;
    }
    const startIndex = Math.min(STAGE_GOAL, getStageKeyCount(selectedStageId));
    const questions = reviewOnly && reviewQuestions.length
      ? reviewQuestions
      : Array.from({ length: SESSION_LENGTH }, (_, index) => core.createStageQuestion(selectedStageId, startIndex + index));
    const sessionStageId = reviewOnly && questions[0] ? questions[0].stageId : selectedStageId;
    session = {
      reviewOnly,
      stageId: sessionStageId,
      questions,
      index: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      mistakes: [],
      reviewMistakes,
      returnResultAfterReview: options.returnResultAfterReview || null,
      pathCorrectMarks: [],
      pathMissMarks: [],
      answered: false,
      advanceTimer: null,
      startKeys: Math.min(STAGE_GOAL, getStageKeyCount(sessionStageId)),
      finishKeys: Math.min(STAGE_GOAL, getStageKeyCount(sessionStageId)),
    };
    show(els.sessionView);
    renderQuestion();
  }

  function renderQuestion() {
    const q = session.questions[session.index];
    if (!isValidQuestion(q)) {
      clearActiveSession();
      session = null;
      progress = sanitizeProgressState(progress);
      core.saveProgress(storage, progress);
      renderHomeStats();
      show(els.homeView);
      return;
    }
    const stage = core.getStage(q.stageId);
    if (session.advanceTimer) {
      window.clearTimeout(session.advanceTimer);
      session.advanceTimer = null;
    }
    if (IS_LOCAL_DEV) {
      window.__roundingCurrentAnswer = q.answer;
    } else {
      try { delete window.__roundingCurrentAnswer; } catch (_) { window.__roundingCurrentAnswer = undefined; }
    }
    session.answered = false;
    document.body.classList.remove('screen-miss-flash');
    els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
    document.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    els.sessionView.classList.toggle('review-mode', session.reviewOnly);
    els.sessionView.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.stageBanner.innerHTML = `<img src="${miniStageBadge(stage.id)}" alt=""><span>第${stage.order}章</span><strong>${stage.title}</strong>`;
    els.modeLabel.textContent = session.reviewOnly ? 'やり直し' : stage.artifact;
    const currentMark = getCurrentPathMark(q.stageId);
    const windowStart = Math.floor(Math.max(0, currentMark - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const windowEnd = Math.min(STAGE_GOAL, windowStart + SESSION_LENGTH - 1);
    if (session.reviewOnly) {
      els.questionCounter.textContent = `やり直し ${session.index + 1} / ${session.questions.length}`;
    } else {
      els.questionCounter.innerHTML = `${windowStart}〜${windowEnd}問目<span class="counter-test-text">${session.index + 1} / ${session.questions.length}</span>`;
    }
    els.scoreText.textContent = `${session.correct}正解`;
    els.scoreBar.style.width = `${(session.correct / session.questions.length) * 100}%`;
    const stageKeys = getProjectedStageKeyCount(session.stageId);
    const pathCount = getProjectedStagePathCount(session.stageId);
    els.comboChip.textContent = `あと${Math.max(0, STAGE_GOAL - stageKeys)}問`;
    els.comboChip.classList.toggle('hot', session.streak >= 3);
    renderSessionMap(q.stageId, stageKeys, pathCount, false, false, sessionPathMarks());
    const promptLayout = getQuestionPromptLayout(q);
    const promptLong = !promptLayout && q.prompt.length > 18;
    els.questionCard.classList.toggle('prompt-long', promptLong);
    els.questionLabel.textContent = questionActionLabel(q.stageId, session.reviewOnly);
    els.questionText.classList.toggle('prompt-long', promptLong);
    els.questionText.innerHTML = renderQuestionPrompt(q, promptLayout);
    els.coachStrip.innerHTML = session.reviewOnly
      ? '<span></span><strong>やり直し</strong><em>ここを見よう。</em>'
      : '<span></span><strong>いいね！</strong><em>その調子！</em>';
    renderSupportText(q);
    els.answerInput.value = '';
    els.answerInput.disabled = false;
    els.submitButton.textContent = 'こたえる';
    els.submitButton.setAttribute('aria-label', 'こたえあわせ');
    clearNoticeFeedback();
    els.feedbackBox.className = 'feedback hidden';
    els.feedbackBox.innerHTML = '';
    if (session.reviewOnly) {
      renderFocusVisual(q, null);
    } else {
      renderClosedGate(q);
    }
    renderTypeBadges(q);
    applyPcV4Layout(q);
    ignoreEmptySubmitUntil = suppressEmptySubmitAfterRender ? performance.now() + 360 : 0;
    suppressEmptySubmitAfterRender = false;
    els.answerInput.focus();
  }

  function setImportantStyle(el, styles) {
    if (!el) return;
    Object.entries(styles).forEach(([key, value]) => {
      el.style.setProperty(key, value, 'important');
    });
  }

  function removeLayoutStyles(el) {
    if (!el) return;
    [
      'position', 'inset', 'left', 'right', 'top', 'bottom', 'width', 'height',
      'min-width', 'max-width', 'min-height', 'max-height', 'display',
      'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
      'grid-area', 'grid-auto-flow', 'align-items', 'align-self',
      'justify-items', 'justify-self', 'place-items', 'place-self',
      'gap', 'padding', 'margin', 'border', 'border-radius', 'background',
      'box-shadow', 'transform', 'overflow', 'visibility', 'opacity',
      'pointer-events', 'z-index', 'box-sizing', 'line-height',
    ].forEach((key) => el.style.removeProperty(key));
  }

  function applyPcV4Layout() {
    if (!window.matchMedia('(min-width: 600px)').matches) return;
    const prompt = session && session.reviewOnly
      ? els.questionText.querySelector('.review-problem-layout')
      : els.questionText.querySelector('.prompt-layout');
    const answerRow = els.answerInput.closest('.answer-row');
    const sessionTop = els.modeLabel ? els.modeLabel.closest('.session-top') : null;
    const problemSide = els.questionCard ? els.questionCard.querySelector('.problem-side') : null;
    [
      els.sessionView,
      els.sessionHomeButton,
      els.comboChip,
      els.modeLabel && els.modeLabel.parentElement,
      sessionTop,
      els.sessionMap,
      els.sessionMap && els.sessionMap.querySelector('.key-rail'),
      els.sessionMap && els.sessionMap.querySelector('.session-hud'),
      els.sessionMap && els.sessionMap.querySelector('.session-progress-label'),
      els.sessionMap && els.sessionMap.querySelector('.question-step-label'),
      els.questionCard,
      els.questionCard && els.questionCard.querySelector('.problem-side'),
      els.visualBoard,
      els.questionText,
      prompt,
      els.questionLabel,
      els.answerInput,
      answerRow,
      els.submitButton,
      els.tenkey,
      ...Array.from(els.tenkey ? els.tenkey.children : []),
    ].forEach(removeLayoutStyles);
    setImportantStyle(els.sessionView, {
      position: 'relative',
      display: 'grid',
      width: 'min(1180px, calc(100vw - 48px))',
      'min-width': '0',
      'max-width': 'calc(100vw - 48px)',
      height: 'calc(100dvh - clamp(18px, 2.8vh, 28px))',
      'min-height': '0',
      margin: '0 auto',
      'grid-template-rows': 'clamp(58px, 9vh, 72px) minmax(0, 1fr)',
      'grid-template-columns': 'minmax(0, 1fr)',
      gap: 'clamp(8px, 1.5vh, 12px)',
      'justify-self': 'center',
      'align-self': 'center',
      overflow: 'visible',
    });
    setImportantStyle(els.questionCard, {
      position: 'relative',
      display: 'grid',
      width: '100%',
      height: '100%',
      'min-height': '0',
      'grid-template-rows': 'minmax(0, 1fr)',
      'grid-template-columns': session && session.reviewOnly
        ? 'minmax(0, 1fr) clamp(280px, 29vw, 350px)'
        : 'minmax(0, 1fr)',
      gap: 'clamp(10px, 1.6vw, 22px)',
      overflow: 'hidden',
      transform: 'none',
    });
    setImportantStyle(problemSide, {
      position: 'relative',
      display: 'grid',
      width: session && session.reviewOnly ? '100%' : 'min(800px, 100%)',
      height: '100%',
      'min-height': '0',
      'grid-template-columns': 'minmax(0, 1fr)',
      'grid-template-rows': session && session.reviewOnly
        ? 'minmax(150px, 1fr) clamp(62px, 10.5vh, 76px) minmax(154px, .86fr)'
        : 'minmax(132px, 1fr) clamp(62px, 11.5vh, 76px) minmax(154px, .92fr)',
      'grid-template-areas': '"prompt" "answer" "tenkey"',
      gap: 'clamp(8px, 1.6vh, 14px)',
      'justify-self': 'center',
      overflow: 'hidden',
    });
    setImportantStyle(els.questionText, {
      position: 'relative',
      display: 'grid',
      'grid-area': 'prompt',
      'grid-row': '1',
      'grid-column': '1',
      order: '0',
      width: '100%',
      height: '100%',
      'min-height': '0',
      margin: '0',
      transform: 'none',
      overflow: session && session.reviewOnly ? 'visible' : 'hidden',
    });
    setImportantStyle(answerRow, {
      position: 'relative',
      display: 'grid',
      'grid-area': 'answer',
      'grid-row': '2',
      'grid-column': '1',
      order: '0',
      width: '100%',
      height: '100%',
      'min-height': '0',
      'grid-template-columns': 'minmax(0, 1fr) clamp(132px, 15vw, 168px)',
      'grid-template-rows': 'minmax(0, 1fr)',
      gap: 'clamp(8px, 1.2vw, 12px)',
      transform: 'none',
    });
    if (!session || !session.reviewOnly) {
      setImportantStyle(els.answerInput, {
        position: 'static',
        'grid-column': '1',
        'grid-row': '1',
        width: '100%',
        height: '100%',
        'min-height': '0',
        'max-height': 'none',
        transform: 'none',
        'align-self': 'stretch',
        'justify-self': 'stretch',
      });
      setImportantStyle(els.submitButton, {
        position: 'static',
        'grid-column': '2',
        'grid-row': '1',
        width: '100%',
        height: '100%',
        'min-height': '0',
        'max-height': 'none',
        transform: 'none',
        'align-self': 'stretch',
        'justify-self': 'stretch',
      });
    }
    setImportantStyle(els.tenkey, {
      position: 'relative',
      display: 'grid',
      'grid-area': 'tenkey',
      'grid-row': '3',
      'grid-column': '1',
      order: '0',
      width: '100%',
      height: '100%',
      'min-height': '0',
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
      'grid-template-rows': 'repeat(4, minmax(0, 1fr))',
      gap: 'clamp(6px, 1.2vh, 10px) clamp(8px, 1.4vw, 16px)',
      transform: 'none',
      overflow: 'hidden',
    });
  }

  function renderClosedGate(q) {
    const stage = core.getStage(q.stageId);
    els.visualBoard.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.visualBoard.innerHTML = `
      <div class="closed-gate">
        <img src="${miniStageBadge(stage.id)}" alt="">
        <strong>${stage.closedTitle}</strong>
        <span>${stage.closedCopy}</span>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function promptChunks(sentence) {
    const text = String(sentence || '');
    const patterns = [
      /^(.*?を)(.+?で)(四捨五入しましょう。)$/,
      /^(.*?を)(.+?までの)(がい数にしましょう。)$/,
      /^(.*?を)(上から\d+けたの)(がい数にしましょう。)$/,
      /^(.*?で)(四捨五入した.+?を)(答えましょう。)$/,
      /^(.*?までの)(がい数で)(表しましょう。)$/,
      /^(上から\d+けたの)(がい数で)(表しましょう。)$/,
      /^(.*?[はに])([0-9,]+(?:人|冊|円|m|点)(?:います|あります|です)。)$/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match.slice(1).filter(Boolean);
    }
    return [text];
  }

  function getQuestionPromptLayout(q) {
    if (!q || typeof q !== 'object') return null;
    const prompt = String(q.prompt || '');
    if (q.stageId === 'final-mix') {
      const storyMatch = prompt.match(/^(.+?)([0-9][0-9,]*(?:人|冊|円|m|点)?)([^。]*。)(.+)$/);
      if (storyMatch) {
        return {
          lead: storyMatch[1],
          number: storyMatch[2].replace(/[^\d]/g, ''),
          tail: storyMatch[3],
          task: storyMatch[4],
          original: prompt,
          story: true,
        };
      }
    }
    if (q.type === 'round-digit' && q.visual) {
      return {
        lead: 'つぎの数を',
        number: core.formatNumber(q.value),
        task: childFriendlyTask(`${q.visual.checkLabel}で四捨五入しましょう。`),
        original: prompt,
      };
    }
    if (q.type === 'round-place' && q.visual) {
      return {
        lead: 'つぎの数を',
        number: core.formatNumber(q.value),
        task: childFriendlyTask(`${q.visual.targetLabel}までのがい数にしましょう。`),
        original: prompt,
      };
    }
    if (q.type === 'significant' && q.digits) {
      return {
        lead: 'つぎの数を',
        number: core.formatNumber(q.value),
        task: `上から${q.digits}けたのがい数にしましょう。`,
        original: prompt,
      };
    }
    return null;
  }

  function childFriendlyTask(text) {
    return String(text || '')
      .replace(/答えましょう/g, 'こたえましょう')
      .replace(/で四捨五入/g, 'で\n四捨五入')
      .replace(/までのがい数/g, 'までの\nがい数')
      .replace(/けたのがい数/g, 'けたの\nがい数');
  }

  function oneLineFriendlyTask(text) {
    return childFriendlyTask(text).replace(/\s*\n\s*/g, ' ');
  }

  function problemFocusText(q) {
    if (!q || typeof q !== 'object') return '';
    if (q.type === 'round-digit' && q.visual) return q.visual.checkLabel;
    if (q.type === 'round-place' && q.visual) return q.visual.targetLabel;
    if (q.type === 'significant' && q.digits) return `上から${q.digits}けた`;
    return '';
  }

  function renderHighlightedTask(q, task) {
    const friendly = childFriendlyTask(task);
    const focus = childFriendlyTask(problemFocusText(q));
    if (!focus) return escapeHtml(friendly);
    const escaped = escapeHtml(friendly);
    const escapedFocus = escapeHtml(focus);
    return escaped.replace(
      escapedFocus,
      `<span class="prompt-focus-underline">${escapedFocus}</span>`,
    );
  }

  function renderQuestionPrompt(q, promptLayout) {
    if (session && session.reviewOnly && q && q.visual) {
      return renderReviewQuestionPrompt(q);
    }
    const layout = promptLayout || getQuestionPromptLayout(q);
    if (layout) {
      return `
        <span class="prompt-layout number-below${layout.story ? ' story' : ''}" aria-label="${escapeHtml(layout.original || '')}">
          <span class="prompt-task prompt-task-first">${escapeHtml(oneLineFriendlyTask(layout.task))}</span>
          <strong class="prompt-main-number">${escapeHtml(layout.number)}</strong>
        </span>
      `;
    }
    return String(q && typeof q === 'object' ? q.prompt : q || '')
      .match(/[^。]+。?/g)
      .flatMap(promptChunks)
      .map(renderPromptChunk)
      .join('');
  }

  function renderReviewQuestionPrompt(q) {
    const v = q.visual;
    const digits = String(v.value).split('');
    const checkPower = Math.max(0, Math.round(Math.log10(v.checkUnit || 1)));
    const focusIndex = Math.max(0, Math.min(digits.length - 1, digits.length - 1 - checkPower));
    const targetPower = Math.max(0, Math.round(Math.log10(v.targetUnit || 1)));
    const targetIndex = Math.max(0, Math.min(digits.length - 1, digits.length - 1 - targetPower));
    return `
      <span class="review-problem-layout" aria-label="${escapeHtml(q.prompt)}">
        <span class="review-problem-title">${core.formatNumber(v.value)}を <span class="prompt-focus-underline">${escapeHtml(v.checkLabel)}</span>で 四捨五入</span>
        <span class="review-digit-row" style="--digit-count:${digits.length}">
          ${digits.map((digit, index) => `
            <span class="review-digit ${index === focusIndex ? 'is-focus' : ''} ${index === targetIndex ? 'is-target' : ''}">
              ${index === focusIndex ? '<em class="digit-tag look">ここを見る</em>' : ''}
              <b>${escapeHtml(digit)}</b>
            </span>
          `).join('')}
        </span>
      </span>
    `;
  }

  function renderPromptChunk(chunk) {
    const text = String(chunk || '');
    const numberPattern = /[0-9][0-9,]{1,}(?:人|冊|円|m|点)?/g;
    let cursor = 0;
    let hasNumber = false;
    let html = '';
    text.replace(numberPattern, (match, offset) => {
      hasNumber = true;
      html += escapeHtml(text.slice(cursor, offset));
      html += `<strong class="prompt-number">${escapeHtml(match)}</strong>`;
      cursor = offset + match.length;
      return match;
    });
    html += escapeHtml(text.slice(cursor));
    return `<span class="prompt-chunk${hasNumber ? ' has-prompt-number' : ''}">${html}</span>`;
  }

  function renderVisual(q, result) {
    const v = q.visual;
    const stage = core.getStage(q.stageId);
    const statusClass = result ? (result.correct ? 'ok' : 'ng') : '';
    const resultImage = result ? (result.correct ? artifactIcon(q.stageId) : img(RPG_ASSETS.repair)) : img(RPG_ASSETS.treasure);
    const resultLine = result
      ? `<div class="answer-gate ${result.correct ? 'open' : 'repair'}"><img src="${resultImage}" alt=""><span>${result.correct ? stage.successTitle : '見直すところ'}</span><strong>${core.formatNumber(q.answer)}</strong></div>`
      : '';
    els.visualBoard.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.visualBoard.innerHTML = `
      <div class="place-lens ${statusClass}">
        <div><span>位</span><strong>${v.targetLabel}</strong></div>
        <div><span>見る</span><strong>${v.checkLabel}</strong></div>
        <div><span>数字</span><strong>${v.checkDigit}</strong></div>
      </div>
      <div class="number-line">
        <div class="line-track"><i style="left:${v.percent}%"></i></div>
        <div class="line-labels">
          <span>${core.formatNumber(v.lower)}</span>
          <b>${core.formatNumber(v.value)}</b>
          <span>${core.formatNumber(v.upper)}</span>
        </div>
      </div>
      <div class="decision ${v.checkDigit >= 5 ? 'up' : 'down'}">
        <span>${v.checkDigit}は${v.checkDigit >= 5 ? '5以上' : '4以下'}</span>
        <strong>${v.actionShort}</strong>
      </div>
      ${resultLine}
    `;
  }

  function getReviewMistakeForQuestion(q) {
    if (!session) return null;
    const current = (session.mistakes || []).find((mistake) => isSameQuestion(mistake.question, q));
    if (current) return current;
    return (session.reviewMistakes || []).find((mistake) => isSameQuestion(mistake.question, q)) || null;
  }

  function reviewChangeText(q) {
    const v = q.visual;
    if (!v) return `${core.formatNumber(q.value)} → ${core.formatNumber(q.answer)}`;
    return `${core.formatNumber(v.value)} → ${core.formatNumber(v.answer)}`;
  }

  function renderFocusVisual(q, result, latestInput = '') {
    const v = q.visual;
    const stage = core.getStage(q.stageId);
    const digits = String(v.value).split('');
    const checkPower = Math.max(0, Math.round(Math.log10(v.checkUnit || 1)));
    const focusIndex = Math.max(0, Math.min(digits.length - 1, digits.length - 1 - checkPower));
    const action = v.checkDigit >= 5 ? '切り上げ' : '切り捨て';
    els.visualBoard.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.visualBoard.innerHTML = `
      <div class="focus-board">
        <p>見方</p>
        <div class="focus-number" aria-label="${v.value}の${v.checkLabel}">
          ${digits.map((digit, index) => `<span class="${index === focusIndex ? 'focus' : ''}">${digit}</span>`).join('')}
        </div>
        <ul class="review-steps" aria-label="見直しの手順">
          <li><b>1</b><span>見る数字 <strong>${escapeHtml(String(v.checkDigit))}</strong></span></li>
          <li><b>2</b><span>${escapeHtml(action)}</span></li>
          <li class="review-answer-step"><b>3</b><span><button type="button" data-review-answer-reveal>答えを見る</button><strong class="review-answer-reveal">${core.formatNumber(q.answer)}</strong></span></li>
        </ul>
      </div>
    `;
  }

  function revealReviewAnswer(button) {
    const board = button.closest('.focus-board');
    if (!board) return;
    board.classList.add('answer-open');
    button.textContent = '答えを表示中';
    button.setAttribute('aria-expanded', 'true');
  }

  function renderTypeBadges(q) {
    const stage = core.getStage(q.stageId);
    const nextStage = getNextStage(q.stageId);
    const nextText = nextStage
      ? (isStageUnlocked(nextStage.id) ? `次: 第${nextStage.order}章 ${nextStage.title}` : `あと${Math.max(0, STAGE_GOAL - getStageKeyCount(q.stageId))}問で 第${nextStage.order}章`)
      : '次: 王城のゴール';
    els.typeBadges.innerHTML = `
      <span class="active"><img src="${miniStageBadge(stage.id)}" alt="">いま: 第${stage.order}章 ${stage.title}</span>
      <span class="next"><img src="${nextStage ? miniStageBadge(nextStage.id) : img(RPG_ASSETS.castle)}" alt="">${nextText}</span>
    `;
  }

  function submitAnswer() {
    if (!session || session.answered) {
      return;
    }
    if (!els.answerInput.value.trim()) {
      if (performance.now() < ignoreEmptySubmitUntil) return;
      playSound('notice');
      showNoticeFeedback('数字を入れてから答えよう。');
      els.answerInput.focus();
      return;
    }
    clearNoticeFeedback();
    const q = session.questions[session.index];
    const submittedInput = els.answerInput.value;
    const result = core.checkAnswer(q, submittedInput);
    session.answered = true;
    els.answerInput.disabled = true;
    let mapRendered = false;
    if (result.correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      if (!session.reviewOnly) session.pathCorrectMarks.push(getCurrentPathMark(q.stageId));
      if (session.reviewOnly) removeSessionMistake(q);
      els.submitButton.textContent = 'つぎへ';
      els.feedbackBox.className = 'feedback hidden';
      els.feedbackBox.innerHTML = '';
      renderProgressChrome(q.stageId, result);
      mapRendered = true;
      if (session.reviewOnly) renderFocusVisual(q, result, submittedInput);
      playSound('correct');
      showAnswerCorrectFx();
      scheduleAutoAdvance(CORRECT_FX_MS);
    } else {
      session.streak = 0;
      if (!session.reviewOnly) session.pathMissMarks.push(getCurrentPathMark(q.stageId));
      upsertSessionMistake(q, els.answerInput.value);
      playSound('wrong');
      miss();
      showAnswerWrongFx();
      if (session.reviewOnly) {
        session.answered = false;
        els.answerInput.disabled = false;
        els.answerInput.value = '';
        els.submitButton.textContent = 'こたえる';
        els.submitButton.setAttribute('aria-label', 'こたえあわせ');
        els.feedbackBox.className = 'feedback hidden';
        els.feedbackBox.innerHTML = '';
        renderFocusVisual(q, result, submittedInput);
        window.setTimeout(() => els.answerInput.focus(), 0);
      } else {
        els.submitButton.textContent = session.index + 1 >= session.questions.length ? '結果へ' : '次へ';
        els.feedbackBox.className = 'feedback wrong compact-wrong-feedback';
        els.feedbackBox.innerHTML = '<strong>まちがい</strong><span>あとでやり直し。この問題は最後にもう一回出ます。</span>';
        scheduleAutoAdvance(760);
      }
    }
    renderSupportText(q, result);
    if (!mapRendered) renderProgressChrome(q.stageId, result);
  }

  function renderProgressChrome(stageId, result) {
    els.scoreText.textContent = `${session.correct}正解`;
    els.scoreBar.style.width = `${(session.correct / session.questions.length) * 100}%`;
    const stageKeys = getProjectedStageKeyCount(stageId);
    const pathCount = getProjectedStagePathCount(stageId, result);
    const marks = sessionPathMarks();
    const currentMark = getCurrentPathMark(stageId);
    if (result.correct) marks.pulseMark = currentMark;
    else marks.missPulseMark = currentMark;
    els.comboChip.textContent = `あと${Math.max(0, STAGE_GOAL - stageKeys)}問`;
    els.comboChip.classList.toggle('hot', session.streak >= 3);
    renderSessionMap(stageId, stageKeys, pathCount, result.correct, !result.correct, marks);
  }

  function celebrate(q, result, progressHtml = '') {
    els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
    document.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    void els.questionCard.offsetWidth;
    els.questionCard.classList.add('fx-correct');
    const answerText = result && result.correct ? core.formatNumber(q.answer) : '';
    const stage = core.getStage(q.stageId);
    document.body.insertAdjacentHTML('beforeend', `
      <div class="problem-celebration-overlay" style="--celebration-art:url('${img(stage.image)}')" aria-hidden="true">
        <svg class="problem-celebration-ring" viewBox="0 0 240 255">
          <circle cx="120" cy="127.5" r="88" transform="rotate(90 120 127.5)"></circle>
        </svg>
        <strong class="problem-celebration-text">せいかい！</strong>
        <div class="instant-answer-card">
          <span>こたえは</span>
          <strong>${answerText}</strong>
        </div>
        <div class="instant-hero-card">
          <img src="${img(RPG_ASSETS.heroIcon)}" alt="">
          <p><strong>よくできたね！</strong><span>つぎに いこう！</span></p>
        </div>
        ${progressHtml ? `<div class="progress-toast">${progressHtml}</div>` : ''}
      </div>
    `);
    window.setTimeout(() => {
      els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
      document.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    }, 1000);
  }

  function showAnswerCorrectFx() {
    const answerRow = els.answerInput.closest('.answer-row');
    const answerCard = document.querySelector('.instant-answer-card');
    document.querySelectorAll('.answer-correct-maru').forEach((node) => node.remove());
    answerRow?.classList.remove('fx-answer-correct', 'fx-answer-wrong');
    els.answerInput.classList.remove('fx-answer-correct', 'fx-answer-wrong');
    answerCard?.classList.remove('fx-answer-correct');
    void els.answerInput.offsetWidth;
    answerRow?.classList.add('fx-answer-correct');
    els.answerInput.classList.add('fx-answer-correct');
    if (answerCard) {
      void answerCard.offsetWidth;
      answerCard.classList.add('fx-answer-correct');
      window.setTimeout(() => {
        answerCard.classList.remove('fx-answer-correct');
      }, CORRECT_FX_MS);
    }
    const rect = els.answerInput.getBoundingClientRect();
    const digitCount = Math.max(1, core.normalizeAnswerText(els.answerInput.value).replace(/,/g, '').length);
    const maru = document.createElement('span');
    maru.className = 'answer-correct-maru';
    maru.style.setProperty('--maru-left', `${rect.left + rect.width / 2}px`);
    maru.style.setProperty('--maru-top', `${rect.top + rect.height * 0.55}px`);
    maru.style.setProperty('--maru-width', `${Math.min(rect.width - 24, Math.max(178, digitCount * 56 + 126))}px`);
    maru.style.setProperty('--maru-height', `${Math.min(74, rect.height * 0.97)}px`);
    maru.insertAdjacentHTML('beforeend', `
      <svg class="maru-draw" viewBox="0 0 160 112" preserveAspectRatio="none" aria-hidden="true">
        <path class="maru-stroke-draw" pathLength="480" d="M80 104 A66 43 0 1 1 80 18 A66 43 0 1 1 80 104 Z"></path>
        <path class="maru-stroke-complete" d="M80 104 A66 43 0 1 1 80 18 A66 43 0 1 1 80 104 Z"></path>
      </svg>
    `);
    const maruText = document.createElement('span');
    maruText.className = 'maru-answer-text';
    maruText.textContent = els.answerInput.value;
    maru.appendChild(maruText);
    document.body.appendChild(maru);
    window.setTimeout(() => {
      answerRow?.classList.remove('fx-answer-correct');
      els.answerInput.classList.remove('fx-answer-correct');
      maru.remove();
    }, CORRECT_FX_MS);
  }

  function showAnswerWrongFx() {
    const answerRow = els.answerInput.closest('.answer-row');
    document.querySelectorAll('.answer-correct-maru').forEach((node) => node.remove());
    answerRow?.classList.remove('fx-answer-correct', 'fx-answer-wrong');
    els.answerInput.classList.remove('fx-answer-correct', 'fx-answer-wrong');
    void els.answerInput.offsetWidth;
    answerRow?.classList.add('fx-answer-wrong');
    els.answerInput.classList.add('fx-answer-wrong');
    window.setTimeout(() => {
      answerRow?.classList.remove('fx-answer-wrong');
      els.answerInput.classList.remove('fx-answer-wrong');
    }, 620);
  }

  function launchArtifactFly(stageId) {
    document.querySelectorAll('.flying-artifact').forEach((node) => node.remove());
    const startRect = els.answerInput.getBoundingClientRect();
    const target =
      document.querySelector('#sessionMap .mini-cell.correct-pulse') ||
      document.querySelector('#sessionMap .mini-cell.now') ||
      els.sessionMap;
    const targetRect = target.getBoundingClientRect();
    const startX = startRect.left + startRect.width * 0.52;
    const startY = startRect.top + startRect.height * 0.18;
    const endX = targetRect.left + targetRect.width * 0.5;
    const endY = targetRect.top + targetRect.height * 0.5;
    const node = document.createElement('span');
    node.className = 'flying-artifact flying-key';
    node.style.setProperty('--from-x', `${startX}px`);
    node.style.setProperty('--from-y', `${startY}px`);
    node.style.setProperty('--mid-x', `${(startX + endX) / 2}px`);
    node.style.setProperty('--mid-y', `${Math.max(48, Math.min(startY, endY) - 70)}px`);
    node.style.setProperty('--to-x', `${endX}px`);
    node.style.setProperty('--to-y', `${endY}px`);
    node.innerHTML = `<img src="${artifactIcon(stageId)}" alt="">`;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 980);
  }

  function miss() {
    document.body.classList.remove('screen-miss-flash');
    els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
    document.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    void document.body.offsetWidth;
    document.body.classList.add('screen-miss-flash');
    window.setTimeout(() => document.body.classList.remove('screen-miss-flash'), 420);
  }

  function renderSupportText(q, result) {
    els.supportText.classList.remove('hidden', 'review-tip', 'review-ok', 'review-ng');
    els.supportText.textContent = '';
    els.supportText.classList.add('hidden');
  }

  function scheduleAutoAdvance(delay = 760) {
    if (!session) return;
    if (session.advanceTimer) window.clearTimeout(session.advanceTimer);
    session.advanceTimer = window.setTimeout(() => {
      session.advanceTimer = null;
      suppressEmptySubmitAfterRender = true;
      nextQuestion();
    }, delay);
  }

  function nextQuestion() {
    if (!session.answered) {
      submitAnswer();
      return;
    }
    session.index += 1;
    if (session.index >= session.questions.length) {
      finishSession();
      return;
    }
    renderQuestion();
  }

  function renderTenkey() {
    els.tenkey.innerHTML = TENKEYS.map((key) => `<button type="button" data-key="${key}">${key}</button>`).join('');
  }

  function clearNoticeFeedback() {
    if (noticeTimer) {
      window.clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    if (!els.feedbackBox.classList.contains('notice')) return;
    resetEmptyNoticeStyle();
    els.feedbackBox.className = 'feedback hidden';
    els.feedbackBox.innerHTML = '';
  }

  function resetEmptyNoticeStyle() {
    [
      'position',
      'left',
      'right',
      'top',
      'bottom',
      'width',
      'height',
      'min-height',
      'max-height',
      'padding',
      'display',
      'align-items',
      'justify-content',
      'gap',
      'transform',
      'z-index',
      'box-sizing',
      'pointer-events',
    ].forEach((key) => els.feedbackBox.style.removeProperty(key));
  }

  function showNoticeFeedback(message) {
    clearNoticeFeedback();
    els.feedbackBox.className = 'feedback notice empty-notice';
    els.feedbackBox.innerHTML = `<strong>${message}</strong>`;
    positionEmptyNotice();
    window.requestAnimationFrame(positionEmptyNotice);
    noticeTimer = window.setTimeout(() => {
      clearNoticeFeedback();
    }, 1700);
  }

  function positionEmptyNotice() {
    if (!els.feedbackBox.classList.contains('empty-notice')) return;
    const inputRect = els.answerInput.getBoundingClientRect();
    if (!inputRect.width || !inputRect.height) return;
    if (window.innerWidth < 600) {
      const height = window.innerHeight < 600 ? 40 : 44;
      const width = Math.min(window.innerWidth - 32, Math.max(228, inputRect.width));
      const left = Math.max(16, (window.innerWidth - width) / 2);
      const top = Math.max(12, inputRect.top - height - 8);
      setImportantStyle(els.feedbackBox, {
        position: 'fixed',
        left: `${Math.round(left)}px`,
        right: 'auto',
        top: `${Math.round(top)}px`,
        bottom: 'auto',
        width: `${Math.round(width)}px`,
        height: `${height}px`,
        'min-height': `${height}px`,
        'max-height': `${height}px`,
        padding: '0 12px',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '8px',
        transform: 'none',
        'z-index': '180',
        'box-sizing': 'border-box',
        'pointer-events': 'none',
      });
      return;
    }
    const isTiny = window.innerWidth < 420;
    const height = isTiny ? 42 : 48;
    const width = Math.max(188, Math.min(isTiny ? inputRect.width - 20 : 340, inputRect.width - 28));
    const left = inputRect.left + ((inputRect.width - width) / 2);
    const top = inputRect.top + Math.max(5, (inputRect.height - height) / 2);
    setImportantStyle(els.feedbackBox, {
      position: 'fixed',
      left: `${Math.round(left)}px`,
      right: 'auto',
      top: `${Math.round(top)}px`,
      bottom: 'auto',
      width: `${Math.round(width)}px`,
      height: `${height}px`,
      'min-height': `${height}px`,
      'max-height': `${height}px`,
      padding: isTiny ? '0 10px' : '0 14px',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      gap: isTiny ? '7px' : '9px',
      transform: 'none',
      'z-index': '140',
      'box-sizing': 'border-box',
      'pointer-events': 'none',
    });
  }

  function pressTenkey(key) {
    if (!session || session.answered || els.answerInput.disabled) return;
    playSound('tap');
    let changed = false;
    if (/^\d$/.test(key)) {
      const nextValue = `${els.answerInput.value}${key}`.slice(0, Number(els.answerInput.maxLength) || 9);
      els.answerInput.value = nextValue;
      changed = true;
    } else if (key === '消す' || key === '1つ消す') {
      els.answerInput.value = els.answerInput.value.slice(0, -1);
      changed = true;
    } else if (key === 'クリア' || key === '全部消す') {
      els.answerInput.value = '';
      changed = true;
    }
    if (changed) {
      clearNoticeFeedback();
      saveActiveSession();
    }
    els.answerInput.focus();
  }

  function handlePhysicalKeyboard(event) {
    if (!session || !document.body.classList.contains('session-mode')) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;

    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isTextEditingTarget = activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (isTextEditingTarget) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      unlockAudio();
      if (session.answered) {
        nextQuestion();
      } else {
        submitAnswer();
      }
      return;
    }

    if (session.answered || els.answerInput.disabled) return;

    const numpadDigit = /^Numpad\d$/.test(event.code || '') ? event.code.slice(-1) : '';
    const digit = /^\d$/.test(event.key || '') ? event.key : numpadDigit;
    if (digit) {
      if (document.activeElement === els.answerInput) return;
      event.preventDefault();
      event.stopPropagation();
      unlockAudio();
      pressTenkey(digit);
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();
      unlockAudio();
      pressTenkey('1つ消す');
      return;
    }

    if (event.key === 'Delete' || event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      unlockAudio();
      pressTenkey('全部消す');
    }
  }

  function finishSession() {
    clearActiveSession();
    progress.sessions += 1;
    progress.best = Math.max(progress.best, session.correct);
    progress.bestStreak = Math.max(progress.bestStreak || 0, session.bestStreak);
    progress.stageWins = progress.stageWins || {};
    if (!session.reviewOnly) {
      progress.materials += session.correct;
      progress.stageWins[session.stageId] = Math.min(STAGE_GOAL, getStageKeyCount(session.stageId) + session.correct);
    }
    session.finishKeys = Math.min(STAGE_GOAL, getStageKeyCount(session.stageId));
    progress.mistakes = progress.mistakes || {};
    const current = progress.mistakes[session.stageId] || [];
    progress.mistakes[session.stageId] = [...current, ...session.mistakes].slice(-12);
    if (session.reviewOnly) progress.mistakes[session.stageId] = session.mistakes.slice(-12);
    core.saveProgress(storage, progress);
    renderHomeStats();
    renderStageSelect();
    const returnResultAfterReview = session.returnResultAfterReview;
    if (session.reviewOnly && !session.mistakes.length && returnResultAfterReview) {
      showReturnResultAfterReview(returnResultAfterReview);
      return;
    }
    if (!session.reviewOnly && session.mistakes.length) {
      const returnResult = createReturnResultAfterReview(session);
      startSession(true, { returnResultAfterReview: returnResult });
      return;
    }
    renderResult();
  }

  function renderResult() {
    show(els.resultView);
    const total = session.questions.length;
    const stage = core.getStage(session.stageId);
    const nextStage = getNextStage(session.stageId);
    const stageKeys = getStageKeyCount(session.stageId);
    const remaining = Math.max(0, STAGE_GOAL - stageKeys);
    const stageCleared = isStageCleared(session.stageId);
    const mustReview = session.mistakes.length > 0;
    const finalClear = stageCleared && !nextStage && !mustReview;
    const stageUnlock = stageCleared && Boolean(nextStage) && !mustReview && !session.reviewOnly;
    const cleanResult = !mustReview && !finalClear;
    els.sparkLayer.innerHTML = '';
    document.querySelectorAll('.answer-correct-maru, .problem-celebration-overlay, .flying-artifact').forEach((node) => node.remove());
    els.resultView.classList.toggle('final-clear', finalClear);
    els.resultView.classList.toggle('stage-unlock', stageUnlock);
    els.resultView.classList.toggle('must-review', mustReview);
    els.resultView.classList.toggle('clean-result', cleanResult);
    els.resultView.classList.toggle('review-result', session.reviewOnly && !mustReview && !finalClear);
    els.resultView.classList.toggle('simple-session-clear', cleanResult && !session.reviewOnly && !stageUnlock);
    const resultArt = finalClear ? RPG_ASSETS.finalClear : (stageUnlock ? chapterUnlockArt(nextStage) : (cleanResult ? RPG_ASSETS.resultClear : stage.image));
    els.resultView.style.setProperty('--result-art', `url("${img(resultArt)}")`);
    if (finalClear) playSound('finalClear');
    else if (stageCleared && !mustReview) playSound('stageClear');
    else if (mustReview) playSound('notice');
    els.resultTitle.textContent = mustReview
      ? 'やり直し'
      : finalClear
      ? '完全クリア！'
      : stageUnlock
      ? `第${nextStage.order}章が開いた！`
      : session.reviewOnly
      ? 'やり直しクリア！'
      : stageCleared
        ? `第${stage.order}章クリア！`
        : '5問クリア！';
    els.resultCopy.textContent = cleanResult && !session.reviewOnly && !stageCleared && !finalClear
      ? ''
      : mustReview
      ? 'この1問を直そう'
      : finalClear
      ? ''
      : stageUnlock
      ? `第${stage.order}章クリア。次は${nextStage.artifact}を集めよう。`
      : session.reviewOnly
      ? 'まちがえた問題を直したよ'
      : stageCleared
        ? stageClearCopy(stage)
        : `${stage.artifact}を ${Math.max(0, stageKeys - (session.startKeys || 0))}こ あつめたよ`;
    const nextActionLabel = '続ける';
    els.againButton.textContent = mustReview ? 'やり直しへ' : (finalClear ? 'もう一度' : nextActionLabel);
    els.againButton.setAttribute('aria-label', mustReview ? 'やり直しへ' : (finalClear ? 'もう一度まとめバトル' : nextActionLabel));
    els.homeButton.classList.toggle('hidden', mustReview);
    const victoryOverlay = !mustReview && !session.reviewOnly && !finalClear
      ? `
        <div class="result-item-pop" aria-hidden="true">
          <img src="${artifactIcon(stage.id)}" alt="">
          <strong>+${Math.max(1, stageKeys - (session.startKeys || 0))}</strong>
        </div>
      `
      : '';
    const lastQuestion = session.questions[Math.max(0, total - 1)];
    const answerShowcase = cleanResult && !session.reviewOnly && lastQuestion
      ? `
        <div class="result-answer-showcase" aria-label="最後の答え">
          <span>こたえ</span>
          <strong>${core.formatNumber(lastQuestion.answer)}</strong>
          <b>✓</b>
        </div>
      `
      : '';
    const resultStatusCard = cleanResult && !session.reviewOnly
      ? `
        <div class="result-reward-status" aria-label="今回の正解とアイテム">
          <strong>${stageKeys}/${STAGE_GOAL}</strong>
          <span>${stage.artifact}</span>
          <img src="${artifactIcon(stage.id)}" alt="">
          <b>+${Math.max(1, stageKeys - (session.startKeys || 0))}</b>
        </div>
      `
      : '';
    const finalCollection = finalClear
      ? `
        <div class="final-collection-pill" aria-label="コレクション完全達成">
          <img src="${stageCardBadge('final-mix')}" alt="">
          <span>コレクション</span>
          <strong>${core.STAGES.length * STAGE_GOAL}/${core.STAGES.length * STAGE_GOAL}</strong>
        </div>
      `
      : '';
    els.rewardScene.innerHTML = stageUnlock
      ? renderStageUnlockClear(stage, nextStage, stageKeys)
      : cleanResult && !session.reviewOnly
      ? renderSimpleSessionClear(stage, stageKeys)
      : `
        <img src="${img(finalClear ? RPG_ASSETS.finalClear : (cleanResult ? RPG_ASSETS.resultClear : stage.image))}" alt="">
        ${answerShowcase}
        ${resultStatusCard}
        ${finalClear ? '' : finalCollection}
        ${victoryOverlay}
        ${renderResultProgressSummary(stage, stageKeys, remaining, stageCleared, finalClear, mustReview)}
      `;
    animateSimpleProgressBar();
    const mistakes = session.mistakes.length ? session.mistakes : (progress.mistakes[session.stageId] || []).slice(-5);
    els.resultReviewButton.classList.toggle('hidden', mustReview || finalClear || session.reviewOnly || !mistakes.length);
    els.resultReviewButton.disabled = !mistakes.length;
    els.resultReviewButton.textContent = '見直し';
    if (finalClear) {
      els.mistakeList.innerHTML = renderFinalClearCertificate(mistakes.length);
      return;
    }
    els.mistakeList.innerHTML = mustReview
      ? '<h3>やり直す問題</h3>'
      : '<h3>あとで見直せる問題</h3>';
    if (!mistakes.length) {
      els.mistakeList.insertAdjacentHTML('beforeend', '<p>今は見直す問題がありません。</p>');
      return;
    }
    const visibleMistakes = mistakes.slice(0, mustReview ? 1 : 3);
    visibleMistakes.forEach((mistake) => {
      const item = document.createElement('div');
      item.className = 'mistake-item';
      const input = mistake.input ? core.normalizeAnswerText(String(mistake.input)) : '';
      item.innerHTML = `
        <strong>${mistake.question.prompt}</strong>
        ${input ? `<span class="mistake-input">あなた: ${input}</span>` : ''}
        ${mustReview ? '<small>この問題から見直します</small>' : `<small>答え: ${core.formatNumber(mistake.question.answer)}</small>`}
      `;
      els.mistakeList.appendChild(item);
    });
    if (mistakes.length > visibleMistakes.length) {
      els.mistakeList.insertAdjacentHTML(
        'beforeend',
        `<p class="mistake-more">ほか${mistakes.length - visibleMistakes.length}問も、見直しクエストで順番に出ます。</p>`,
      );
    }
  }

  function renderSimpleSessionClear(stage, stageKeys) {
    const gained = Math.max(0, stageKeys - (session.startKeys || 0));
    const startPct = Math.min(100, Math.round(((session.startKeys || 0) / STAGE_GOAL) * 100));
    const progressPct = Math.min(100, Math.round((stageKeys / STAGE_GOAL) * 100));
    return `
      <div class="simple-clear-panel">
        <div class="simple-stat-list" aria-label="今回の結果">
          <span><b>✓</b><strong>正解</strong><em>${session.correct}問</em></span>
        </div>
        <div class="simple-clear-center">
          <img src="${artifactIcon(stage.id)}" alt="">
          <span class="simple-progress-label">${stage.artifact}</span>
          <strong>${stageKeys}/${STAGE_GOAL}</strong>
          <div class="simple-progress" data-from-pct="${startPct}" data-to-pct="${progressPct}" style="--from-pct:${startPct}%; --pct:${progressPct}%"><i></i></div>
        </div>
      </div>
    `;
  }

  function renderStageUnlockClear(stage, nextStage, stageKeys) {
    return `
      <img class="chapter-unlock-art" src="${img(chapterUnlockArt(nextStage))}" alt="">
      <div class="chapter-unlock-text">
        <strong>第${nextStage.order}章が開いた！</strong>
        <span>第${stage.order}章クリア。次は${nextStage.artifact}を集めよう。</span>
      </div>
      <div class="chapter-unlock-badges" aria-label="章の切り替わり">
        <span class="cleared">
          <img src="${artifactIcon(stage.id)}" alt="">
          <b>第${stage.order}章</b>
          <strong>${stage.artifact} ${stageKeys}/${STAGE_GOAL}</strong>
        </span>
        <span class="next">
          <img src="${artifactIcon(nextStage.id)}" alt="">
          <b>次へ</b>
          <strong>第${nextStage.order}章 ${nextStage.artifact}</strong>
        </span>
      </div>
    `;
  }

  function animateSimpleProgressBar() {
    const track = els.rewardScene.querySelector('.simple-progress');
    const bar = track ? track.querySelector('i') : null;
    if (!track || !bar) return;
    const from = Number(track.dataset.fromPct || 0);
    const to = Number(track.dataset.toPct || from);
    bar.style.transition = 'none';
    bar.style.setProperty('width', `${from}%`, 'important');
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        bar.style.transition = 'width 2.8s cubic-bezier(.18, .82, .18, 1)';
        bar.style.setProperty('width', `${to}%`, 'important');
      });
    });
  }

  function getNextStage(stageId) {
    const index = core.STAGES.findIndex((stage) => stage.id === stageId);
    return index >= 0 ? core.STAGES[index + 1] : null;
  }

  function isSameQuestion(a, b) {
    if (!a || !b) return false;
    if (a.id && b.id) return a.id === b.id;
    return a.prompt === b.prompt && a.answer === b.answer;
  }

  function upsertSessionMistake(question, input) {
    const existing = session.mistakes.find((mistake) => isSameQuestion(mistake.question, question));
    if (existing) {
      existing.input = input;
      return;
    }
    session.mistakes.push({ question, input, type: question.stageId });
  }

  function removeSessionMistake(question) {
    session.mistakes = session.mistakes.filter((mistake) => !isSameQuestion(mistake.question, question));
  }

  function persistSessionMistakes() {
    if (!session || !session.mistakes.length) return;
    progress.mistakes = progress.mistakes || {};
    const merged = cleanMistakeList(progress.mistakes[session.stageId] || [], session.stageId);
    session.mistakes.forEach((mistake) => {
      if (!mistake || !isValidQuestion(mistake.question)) return;
      const existingIndex = merged.findIndex((item) => isSameQuestion(item.question, mistake.question));
      if (existingIndex >= 0) merged[existingIndex] = mistake;
      else merged.push(mistake);
    });
    progress.mistakes[session.stageId] = merged.slice(-12);
    core.saveProgress(storage, progress);
  }

  function getNextMilestone(count) {
    if (count >= STAGE_GOAL) return STAGE_GOAL;
    return Math.min(STAGE_GOAL, Math.ceil(Math.max(1, count) / SESSION_LENGTH) * SESSION_LENGTH);
  }

  function getCorrectProgressHtml(q, projectedKeys) {
    if (session.reviewOnly) {
      return `<img src="${artifactIcon(q.stageId)}" alt=""><strong>直せた</strong>`;
    }
    const stage = core.getStage(q.stageId);
    if (projectedKeys >= STAGE_GOAL) {
      return `<img src="${artifactIcon(q.stageId)}" alt=""><strong>+1</strong>`;
    }
    return `<img src="${artifactIcon(q.stageId)}" alt=""><strong>+1</strong>`;
  }

  function renderResultProgressSummary(stage, stageKeys, remaining, stageCleared, finalClear, mustReview = false) {
    const gained = session.reviewOnly ? 0 : Math.max(0, stageKeys - (session.startKeys || 0));
    if (mustReview) {
      return `<div class="result-progress-summary"><strong>今回 ${artifactCollectText(stage, gained)}</strong></div>`;
    }
    if (session.reviewOnly) {
      return `
        <div class="result-progress-summary review-clear-card">
          <b>見直しクリア</b>
          <img class="review-clear-hero" src="${img(RPG_ASSETS.heroIcon)}" alt="">
          <strong>道がひらいた！</strong>
          <span>つづきを進めよう</span>
        </div>
      `;
    }
    if (finalClear) {
      return '';
    }
    if (stageCleared) {
      return `
        <div class="result-progress-summary complete joy-result">
          <img src="${artifactIcon(stage.id)}" alt="">
          <strong>第${stage.order}章クリア！</strong>
          <span class="result-stage-progress">${stage.artifact} ${stageKeys}/${STAGE_GOAL}</span>
        </div>
      `;
    }
    const nextMilestone = getNextMilestone(stageKeys);
    const milestoneText = stageKeys % SESSION_LENGTH === 0
      ? `${stageKeys}問目の目印に到着。`
      : `${nextMilestone}問目の目印まであと${nextMilestone - stageKeys}問。`;
    return `
        <div class="result-progress-summary joy-result target-clear-card">
          <div class="result-session-ribbon">${session.questions.length}問クリア</div>
          <div class="result-item-score">
            <img src="${artifactIcon(stage.id)}" alt="">
            <span>${stage.artifact}を手に入れた！</span>
            <strong>${stage.artifact}</strong>
            <b class="result-stage-progress">${stageKeys}/${STAGE_GOAL}</b>
          </div>
          <div class="result-hero-message">
            <img src="${img(RPG_ASSETS.heroIcon)}" alt="">
            <p><strong>よくできたね！</strong><span>つぎに いこう！</span></p>
          </div>
        </div>
    `;
  }

  function renderRewardBadges() {
    return `
      <div class="reward-badges" aria-label="集めたもの">
        ${core.STAGES.map((stage) => {
          const count = getStageKeyCount(stage.id);
          const state = count >= STAGE_GOAL ? 'complete' : count > 0 ? 'active' : '';
          return `
            <span class="${state}">
              <img src="${miniStageBadge(stage.id)}" alt="">
              <b>${stage.artifact}</b>
              <em>${count}/${STAGE_GOAL}</em>
            </span>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderFinalClearCertificate(mistakeCount) {
    return '';
  }

  function isStageCleared(stageId) {
    return getStageKeyCount(stageId) >= STAGE_GOAL;
  }

  function isAllClear() {
    return core.STAGES.every((stage) => isStageCleared(stage.id));
  }

  function getStageKeyCount(stageId) {
    return Math.min(STAGE_GOAL, Math.max(0, Number((progress.stageWins || {})[stageId]) || 0));
  }

  function getProjectedStageKeyCount(stageId) {
    const earned = session && !session.reviewOnly && session.stageId === stageId ? session.correct : 0;
    return Math.min(STAGE_GOAL, getStageKeyCount(stageId) + earned);
  }

  function getCurrentPathMark(stageId) {
    if (!session || session.reviewOnly || session.stageId !== stageId) return getProjectedStageKeyCount(stageId);
    return Math.min(STAGE_GOAL, session.startKeys + session.index + 1);
  }

  function getProjectedStagePathCount(stageId, result = null) {
    if (!session || session.reviewOnly || session.stageId !== stageId) return getProjectedStageKeyCount(stageId);
    const answeredStep = session.answered && result && result.correct ? 1 : 0;
    return Math.min(STAGE_GOAL, session.startKeys + session.index + answeredStep);
  }

  function sessionPathMarks() {
    if (!session) return {};
    if (session.reviewOnly) {
      return { baseCount: getStageKeyCount(session.stageId) };
    }
    return {
      baseCount: session.startKeys,
      correct: session.pathCorrectMarks,
      missed: session.pathMissMarks,
    };
  }

  function isStageUnlocked(stageId) {
    const index = core.STAGES.findIndex((stage) => stage.id === stageId);
    if (index <= 0) return true;
    return isStageCleared(core.STAGES[index - 1].id);
  }

  function getHighestUnlockedStage() {
    return core.STAGES.reduce((current, stage) => (isStageUnlocked(stage.id) ? stage : current), core.STAGES[0]);
  }

  function ensureSelectedStageUnlocked() {
    const pendingStageId = getPendingReviewStageId();
    if (pendingStageId) {
      selectedStageId = pendingStageId;
      return;
    }
    const saved = loadActiveSession();
    if (!homeStageManuallySelected && saved && !saved.reviewOnly && isStageUnlocked(saved.stageId)) {
      selectedStageId = saved.stageId;
      return;
    }
    if (!isStageUnlocked(selectedStageId)) selectedStageId = getHighestUnlockedStage().id;
  }

  function selectHomeStage(stageId, { sound = false } = {}) {
    const pendingStageId = getPendingReviewStageId();
    if (pendingStageId || !isStageUnlocked(stageId)) return false;
    homeStageManuallySelected = true;
    if (selectedStageId === stageId) return true;
    if (sound) playSound('tap');
    selectedStageId = stageId;
    renderStageSelect();
    renderHomeStats();
    return true;
  }

  function startHomeSelection() {
    const pendingStageId = getPendingReviewStageId();
    if (pendingStageId) {
      selectedStageId = pendingStageId;
      clearActiveSession();
      startSession(true);
      return;
    }
    const saved = loadActiveSession();
    if (saved && saved.stageId === selectedStageId && resumeActiveSession()) return;
    if (saved && saved.stageId !== selectedStageId) clearActiveSession();
    startSession(false);
  }

  function getPendingReviewStageId() {
    const mistakes = progress.mistakes || {};
    const stage = core.STAGES.find((item) => cleanMistakeList(mistakes[item.id], item.id).length > 0);
    return stage ? stage.id : null;
  }

  function renderHomeStats() {
    ensureSelectedStageUnlocked();
    const selectedStage = core.getStage(selectedStageId);
    const pendingReviewStageId = getPendingReviewStageId();
    const hasMistakes = Boolean(pendingReviewStageId);
    const totalKeys = core.STAGES.reduce((sum, stage) => sum + getStageKeyCount(stage.id), 0);
    const totalGoal = core.STAGES.length * STAGE_GOAL;
    const remainingKeys = Math.max(0, totalGoal - totalKeys);
    const stageKeys = getStageKeyCount(selectedStageId);
    const stageRemaining = Math.max(0, STAGE_GOAL - stageKeys);
    els.homeProgress.style.setProperty('--home-progress-rate', `${Math.min(100, Math.round((totalKeys / totalGoal) * 100))}%`);
    els.homeProgressCurrent.textContent = `${totalKeys} / ${totalGoal}問`;
    els.homeProgressRemain.textContent = remainingKeys > 0 ? `あと${remainingKeys}問` : '全クリ済み';
    if (els.homeGoal) {
      els.homeGoal.textContent = hasMistakes
        ? '今の目的：見直しで続きの道をひらこう'
        : remainingKeys === 0
          ? '全120問クリア！がい数マスターです'
          : `今の目的：${selectedStage.artifact}をあと${stageRemaining}こ集めよう`;
    }
    const savedSession = loadActiveSession();
    els.startButton.textContent = hasMistakes
        ? '見直しクエストへ'
      : savedSession && savedSession.stageId === selectedStageId
        ? 'つづきから'
        : isStageCleared(selectedStageId)
          ? 'もう一度とく'
          : 'はじめる';
    els.reviewButton.disabled = !hasMistakes;
    els.reviewButton.classList.toggle('hidden', !hasMistakes);
    els.reviewButton.textContent = hasMistakes ? '見直しクエスト' : '';
    if (els.homeDock) {
      const reviewDockButton = els.homeDock.querySelector('[data-home-action="review"]');
      if (reviewDockButton) {
        reviewDockButton.disabled = !hasMistakes;
        reviewDockButton.classList.toggle('disabled', !hasMistakes);
        reviewDockButton.setAttribute('aria-disabled', String(!hasMistakes));
      }
    }
    renderHomeMap();
  }

  function mapPoint(stageId, keyCount) {
    const routes = {
      'round-digit': [[18.2, 73.1], [29.9, 78.5], [37.3, 81.0], [55.2, 67.3]],
      'round-place': [[55.2, 67.3], [62.8, 65.2], [70.6, 60.4], [75.6, 46.6]],
      significant: [[73.8, 48.6], [77.4, 43.0], [80.0, 39.2], [82.4, 35.8]],
      'final-mix': [[82.4, 35.8], [84.0, 33.8], [86.2, 30.2], [89.0, 26.0]],
    };
    return interpolateRoute(routes[stageId] || routes['round-digit'], keyCount);
  }

  function mapChapterPoint(stageId) {
    const points = {
      'round-digit': [17.6, 62.6],
      'round-place': [51.0, 38.0],
      significant: [82.8, 25.2],
      'final-mix': [91.2, 25.8],
    };
    const point = points[stageId] || points['round-digit'];
    return { x: point[0], y: point[1] };
  }

  function interpolateRoute(route, keyCount) {
    const rate = Math.min(STAGE_GOAL, Math.max(0, keyCount)) / STAGE_GOAL;
    const scaled = rate * (route.length - 1);
    const index = Math.min(route.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const from = route[index];
    const to = route[index + 1];
    return {
      x: from[0] + (to[0] - from[0]) * local,
      y: from[1] + (to[1] - from[1]) * local,
    };
  }

  function renderHomeMap() {
    const selected = core.getStage(selectedStageId);
    const best = getStageKeyCount(selectedStageId);
    const allClear = isAllClear();
    const hero = mapPoint(selectedStageId, best);
    const heroHtml = best < STAGE_GOAL
      ? `<img class="hero-marker" src="${img(RPG_ASSETS.heroIcon)}" alt="" style="--x:${hero.x}%;--y:${hero.y}%">`
      : '';
    const rest = Math.max(0, STAGE_GOAL - best);
    const nextStep = Math.min(STAGE_GOAL, best + 1);
    const zoneStart = Math.floor(Math.max(0, nextStep - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const zoneEnd = Math.min(STAGE_GOAL, zoneStart + SESSION_LENGTH - 1);
    const zone = best >= STAGE_GOAL ? `第${selected.order}章クリア` : `今は${zoneStart}〜${zoneEnd}問目`;
    const progressMarks = [5, 10, 15, 20, 25, 30].map((mark) => {
      const state = best >= mark ? 'done' : (best < mark && best >= mark - SESSION_LENGTH ? 'now' : '');
      return `<span class="${state}"><b>${mark}</b></span>`;
    }).join('');
    const caption = best >= STAGE_GOAL
      ? `第${selected.order}章 ${selected.destination || '目的地'}に到着済み`
      : `第${selected.order}章 ${selected.artifact}を集めて${selected.destination || '目的地'}へ`;
    const selectedGoal = mapChapterPoint(selectedStageId);
    const selectedGoalHtml = selectedGoal
      ? `<span class="selected-goal" style="--x:${selectedGoal.x}%;--y:${selectedGoal.y}%"><img src="${miniStageBadge(selected.id)}" alt=""></span>`
      : '';
    els.homeMapOverlay.dataset.mapStage = selected.id;
    els.homeMapOverlay.dataset.allClear = allClear ? 'true' : 'false';
    els.homeMapOverlay.innerHTML = `
      <div class="map-road"></div>
      <div class="path-nodes">
        ${selectedGoalHtml}
        ${core.STAGES.filter((stage) => {
          if (selected.id === 'final-mix') return false;
          if (selected.order >= 3) return false;
          if (stage.id === selectedStageId) return false;
          return !(selected.order >= 3 && stage.order >= selected.order);
        }).map((stage) => {
          const point = mapChapterPoint(stage.id);
          const state = isStageCleared(stage.id) ? 'open' : isStageUnlocked(stage.id) ? '' : 'locked';
          return `<span class="${state}" style="--x:${point.x}%;--y:${point.y}%"><img src="${miniStageBadge(stage.id)}" alt=""></span>`;
        }).join('')}
      </div>
      ${heroHtml}
      <div class="map-caption">
        <strong>第${selected.order}章 ${selected.title}</strong>
        <span>${zone}・${selected.artifact} ${best}/${STAGE_GOAL}</span>
        <em>${caption}</em>
        <div class="map-progress-marks">${progressMarks}</div>
      </div>
      ${allClear ? `
        <div class="home-master-badge" aria-label="全クリ済み">
          <img src="${stageCardBadge('final-mix')}" alt="">
          <span>全クリ</span>
          <strong>がい数マスター</strong>
        </div>
      ` : ''}
    `;
  }

  function renderReviewSessionMap(stageId, pulse, missPulse) {
    const stage = core.getStage(stageId);
    const total = Math.max(1, session.questions.length);
    const current = Math.min(total, session.index + 1);
    const pips = Array.from({ length: total }, (_, index) => {
      const className = [
        index < session.index || (pulse && index === session.index) ? 'done' : '',
        missPulse && index === session.index ? 'missed' : '',
        index === session.index ? 'current' : '',
      ].filter(Boolean).join(' ');
      return `<i class="${className}" aria-hidden="true"></i>`;
    }).join('');
    els.sessionMap.innerHTML = `
      <div class="key-rail review-rail" aria-label="やり直し ${current}/${total}">
        <div class="session-hud">
          <div class="session-plaque">
            <small>やり直し</small>
            <strong>${stage.artifact}</strong>
            <span>${current}/${total}問</span>
          </div>
          <div class="session-progress-label" aria-hidden="true">
            <span class="question-step-label"><b>${current}</b><small>問目 / ${total}問</small></span>
            <span class="question-pips review-pips" style="grid-template-columns: repeat(${total}, minmax(0, 1fr))" aria-label="やり直し ${current}問目">${pips}</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderSessionMap(stageId, keyCount, pathCount, pulse, missPulse, markState = {}) {
    if (session && session.reviewOnly && session.stageId === stageId) {
      renderReviewSessionMap(stageId, pulse, missPulse);
      return;
    }
    const stage = core.getStage(stageId);
    els.sessionMap.style.setProperty('--session-road-art', `url("${img(RPG_ASSETS.worldMap)}")`);
    const count = Math.min(STAGE_GOAL, Math.max(0, keyCount));
    const path = Math.min(STAGE_GOAL, Math.max(0, pathCount));
    const heroStep = path > 0 && path % SESSION_LENGTH === 0
      ? path
      : Math.min(STAGE_GOAL, Math.max(1, path + 1));
    const rest = Math.max(0, STAGE_GOAL - count);
    const baseCount = Math.min(STAGE_GOAL, Math.max(0, Number(markState.baseCount) || 0));
    const correctMarks = new Set((markState.correct || []).map(Number));
    const missedMarks = new Set((markState.missed || []).map(Number));
    const pulseMark = Number(markState.pulseMark) || 0;
    const missPulseMark = Number(markState.missPulseMark) || 0;
    const inActiveNormalSession = session && !session.reviewOnly && session.stageId === stageId;
    const windowStart = Math.floor(Math.max(0, heroStep - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const windowEnd = Math.min(STAGE_GOAL, windowStart + SESSION_LENGTH - 1);
    const zone = `${windowStart}〜${windowEnd}問目`;
    const totalPips = inActiveNormalSession ? Math.max(1, session.questions.length) : SESSION_LENGTH;
    const currentInSession = inActiveNormalSession
      ? Math.min(totalPips, Math.max(1, session.index + 1))
      : Math.min(SESSION_LENGTH, Math.max(1, heroStep - windowStart + 1));
    const cells = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => {
      const mark = windowStart + index;
      const isCurrentCell = mark === heroStep;
      const isHeroStep = path > 0 && isCurrentCell;
      const isDone = mark <= baseCount || correctMarks.has(mark);
      const isMissed = missedMarks.has(mark) && !isDone;
      const isCorrectPulse = pulse && mark === pulseMark;
      const isMissPulse = missPulse && mark === missPulseMark;
      const state = [
        isDone ? 'done' : '',
        isMissed ? 'missed' : '',
        path >= mark && !isDone && !isMissed ? 'walked' : '',
        isCurrentCell ? 'now' : '',
        isCorrectPulse ? 'correct-pulse' : '',
        isMissPulse ? 'miss-pulse' : '',
        mark % SESSION_LENGTH === 0 ? 'checkpoint' : '',
      ].filter(Boolean).join(' ');
      const label = isMissed ? '×' : mark;
      const hero = isCurrentCell
        ? `<span class="mini-hero ${pulse ? 'pop' : ''} ${missPulse ? 'miss' : ''}" aria-hidden="true"><img src="${img(RPG_ASSETS.heroIcon)}" alt="勇者"><b>勇</b></span>`
        : '';
      return `<span class="mini-cell ${state}" aria-label="${mark}問目"><b>${label}</b>${hero}</span>`;
    }).join('');
    const plus = pulse
      ? `<span class="map-plus" aria-hidden="true"><img src="${artifactIcon(stageId)}" alt=""><b>+1</b></span>`
      : '';
    const progressPips = Array.from({ length: totalPips }, (_, index) => {
      const mark = inActiveNormalSession ? session.startKeys + index + 1 : windowStart + index;
      const className = [
        missedMarks.has(mark) || (missPulse && mark === missPulseMark) ? 'missed' : '',
        correctMarks.has(mark) || (!inActiveNormalSession && mark <= baseCount) ? 'done' : '',
        index === currentInSession - 1 ? 'current' : '',
      ].filter(Boolean).join(' ');
      return `<i class="${className}" aria-hidden="true"></i>`;
    }).join('');
    const reviewCount = session && session.stageId === stageId ? session.mistakes.length : 0;
    const reviewChip = reviewCount
      ? `<em class="session-review-chip" aria-label="見直しが${reviewCount}問あります">見直し ${reviewCount}問</em>`
      : '';
    els.sessionMap.innerHTML = `
      <div class="key-rail" aria-label="${artifactProgressText(stage, count)}">
        <div class="session-hud">
          <div class="session-plaque">
            <small>第${stage.order}章</small>
            <strong>${stage.artifact}</strong>
            <span>${zone}・${artifactProgressText(stage, count)}</span>
          </div>
          <div class="session-progress-label" aria-hidden="true">
            <span class="question-step-label"><b>${currentInSession}</b><small>問目 / ${totalPips}問</small></span>
            <span class="question-pips" aria-label="${currentInSession}問目">${progressPips}</span>
          </div>
          <div class="mini-map-track">
            <div class="mini-steps">${cells}</div>
            ${plus}
            <span class="mini-gate"><img src="${artifactIcon(stage.id)}" alt=""></span>
          </div>
          <div class="session-item-card">
            <img src="${artifactIcon(stage.id)}" alt="">
            <strong>${count}/${STAGE_GOAL}</strong>
            ${reviewChip}
          </div>
        </div>
      </div>
    `;
  }

  function renderStageSelect() {
    ensureSelectedStageUnlocked();
    els.stageSelect.innerHTML = core.STAGES.map((stage) => {
      const active = stage.id === selectedStageId ? 'active' : '';
      const best = getStageKeyCount(stage.id);
      const unlocked = isStageUnlocked(stage.id);
      const pendingStageId = getPendingReviewStageId();
      const blockedByReview = pendingStageId && pendingStageId !== stage.id;
      const cleared = isStageCleared(stage.id);
      const stateClass = unlocked && !blockedByReview ? (cleared ? 'cleared' : '') : 'locked';
      const stateLabel = stageStateLabel(stage, unlocked, blockedByReview, cleared);
      const status = blockedByReview
        ? '見直し後に開く'
        : unlocked
        ? artifactProgressText(stage, best)
        : (stage.unlockHint || '前の章を終えると進めます');
      const progressPct = `${Math.round((Math.min(STAGE_GOAL, best) / STAGE_GOAL) * 100)}%`;
      return `
        <button class="stage-card ${active} ${stateClass}" type="button" data-stage="${stage.id}" data-state-label="${stateLabel}" aria-pressed="${stage.id === selectedStageId ? 'true' : 'false'}" ${unlocked && !blockedByReview ? '' : 'disabled'}>
          <span class="stage-select-pencil" aria-hidden="true"></span>
          <b class="stage-order" aria-hidden="true">${stage.order}</b>
          <img class="stage-bg" src="${img(stage.image)}" alt="">
          <img class="stage-badge" src="${stageCardBadge(stage.id)}" alt="">
          <span>第${stage.order}章</span>
          <strong>${stageCardQuestName(stage)}</strong>
          <small>${stageCardTitle(stage)}</small>
          <span class="stage-count-pill"><b>${best}/${STAGE_GOAL}</b></span>
          <i class="stage-progress" style="--pct:${progressPct}" aria-hidden="true"></i>
          <em>${status}</em>
        </button>
      `;
    }).join('');
    els.stageSelect.querySelectorAll('[data-stage]').forEach((button) => {
      const stageId = button.dataset.stage;
      button.addEventListener('pointerenter', () => {
        selectHomeStage(stageId);
      });
      button.addEventListener('focus', () => {
        selectHomeStage(stageId);
      });
      button.addEventListener('click', () => {
        unlockAudio();
        selectHomeStage(stageId, { sound: true });
      });
    });
  }

  els.startButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    startHomeSelection();
  });
  els.restartButton.addEventListener('click', async () => {
    unlockAudio();
    playSound('tap');
    await startFromBeginning();
  });
  els.reviewButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    startSession(true);
  });
  els.sessionHomeButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    saveActiveSession();
    renderHomeStats();
    show(els.homeView);
  });
  if (els.homeDock) {
    els.homeDock.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-home-action]');
      if (!button) return;
      unlockAudio();
      playSound('tap');
      const action = button.dataset.homeAction;
      if (action === 'start') {
        startHomeSelection();
      } else if (action === 'review') {
        if (!getPendingReviewStageId()) {
          renderHomeStats();
          return;
        }
        startSession(true);
      } else if (action === 'sound') {
        button.classList.add('sound-pop');
        window.setTimeout(() => button.classList.remove('sound-pop'), 360);
      }
    });
  }
  els.againButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    if (session && session.mistakes.length) {
      startSession(true);
      return;
    }
    const nextStage = session && isStageCleared(session.stageId) ? getNextStage(session.stageId) : null;
    if (nextStage) {
      selectedStageId = nextStage.id;
      renderStageSelect();
      renderHomeStats();
    }
    startSession(false);
  });
  els.resultReviewButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    startSession(true);
  });
  els.homeButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    show(els.homeView);
  });
  els.mistakeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-practice-stage]');
    if (!button) return;
    unlockAudio();
    playSound('tap');
    selectedStageId = button.dataset.practiceStage;
    renderStageSelect();
    renderHomeStats();
    startSession(false);
  });
  els.submitButton.addEventListener('click', () => {
    unlockAudio();
    if (session && session.answered) {
      playSound('tap');
      suppressEmptySubmitAfterRender = true;
      nextQuestion();
      return;
    }
    submitAnswer();
  });
  els.tenkey.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-key]');
    if (!button) return;
    unlockAudio();
    pressTenkey(button.dataset.key);
  });
  els.visualBoard.addEventListener('click', (event) => {
    const button = event.target.closest('[data-review-answer-reveal]');
    if (!button) return;
    unlockAudio();
    playSound('tap');
    revealReviewAnswer(button);
  });
  els.answerInput.addEventListener('input', () => {
    const maxLength = Number(els.answerInput.maxLength) || 9;
    const normalized = core.normalizeAnswerText(els.answerInput.value).slice(0, maxLength);
    if (els.answerInput.value !== normalized) els.answerInput.value = normalized;
    clearNoticeFeedback();
    saveActiveSession();
  });
  window.addEventListener('keydown', handlePhysicalKeyboard);
  window.addEventListener('resize', () => {
    if (!els.homeView.classList.contains('hidden')) renderHomeMap();
  });

  preloadImages([
    RPG_ASSETS.heroIcon,
    RPG_ASSETS.castle,
    RPG_ASSETS.finalReward,
    RPG_ASSETS.resultClear,
    RPG_ASSETS.finalClear,
    ...core.STAGES.map((stage) => stage.image),
  ]);
  progress = sanitizeProgressState(progress);
  core.saveProgress(storage, progress);
  renderTenkey();
  renderHomeStats();
  renderStageSelect();
})();
