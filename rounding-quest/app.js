(function () {
  'use strict';

  const APP_VERSION = 113;
  const params = new URLSearchParams(window.location.search);
  const shownVersion = Number(params.get('cb') || 0);
  if (shownVersion && shownVersion < APP_VERSION) {
    params.set('cb', String(APP_VERSION));
    window.location.replace(`${window.location.pathname}?${params.toString()}${window.location.hash}`);
    return;
  }

  const core = window.RoundingCore;
  const els = {
    homeView: document.getElementById('homeView'),
    sessionView: document.getElementById('sessionView'),
    resultView: document.getElementById('resultView'),
    stageSelect: document.getElementById('stageSelect'),
    homeMapOverlay: document.getElementById('homeMapOverlay'),
    sessionMap: document.getElementById('sessionMap'),
    stageBanner: document.getElementById('stageBanner'),
    questionCard: document.querySelector('#sessionView .question-card'),
    startButton: document.getElementById('startButton'),
    reviewButton: document.getElementById('reviewButton'),
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
    heroIcon: 'assets/generated/hero-walker.png',
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
    if (stage.id === selectedStageId) return '挑戦中';
    return '開放中';
  }

  function artifactIcon(stageId) {
    return stageCardBadge(stageId);
  }

  function artifactUnit(stage) {
    return stage.artifactUnit || 'つ';
  }

  function artifactAmount(stage, count) {
    return `${count}${artifactUnit(stage)}`;
  }

  function artifactProgressText(stage, count) {
    return `${stage.artifact} ${count}/${STAGE_GOAL}${artifactUnit(stage)}`;
  }

  function artifactCollectText(stage, count) {
    const verb = stage.collectVerb || '集めました';
    return `${stage.artifact}を${artifactAmount(stage, count)}${verb}`;
  }

  function artifactCompleteText(stage) {
    const verb = stage.completeVerb || '集まりました';
    return `${stage.artifact}が${artifactAmount(stage, STAGE_GOAL)}${verb}`;
  }

  function stageClearCopy(stage) {
    const messages = {
      'round-digit': '光の鍵で門が開きました。',
      'round-place': '塔の頂上まで光が届きました。',
      significant: '天空儀が星のしるしで動き出しました。',
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

  let progress = core.loadProgress(localStorage);
  let selectedStageId = 'round-digit';
  let session = null;
  const TENKEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'クリア', '0', '1つ消す'];
  const SESSION_LENGTH = core.SESSION_LENGTH || 10;
  const STAGE_GOAL = core.STAGE_GOAL || 30;
  const IS_LOCAL_DEV = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  let audioContext = null;

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    return audioContext;
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
    [els.homeView, els.sessionView, els.resultView].forEach((el) => el.classList.add('hidden'));
    view.classList.remove('hidden');
    const inSession = view === els.sessionView;
    const inResult = view === els.resultView;
    document.body.classList.toggle('session-mode', inSession);
    document.body.classList.toggle('result-mode', inResult);
    els.stageSelect.classList.toggle('hidden', inSession || inResult);
  }

  function startSession(reviewOnly) {
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
    const reviewQuestions = ((progress.mistakes || {})[selectedStageId] || []).slice(-10).map((mistake) => mistake.question);
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
    els.questionCard.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    els.sessionView.classList.toggle('review-mode', session.reviewOnly);
    els.stageBanner.innerHTML = `<img src="${miniStageBadge(stage.id)}" alt=""><span>第${stage.order}章</span><strong>${stage.title}</strong>`;
    els.modeLabel.textContent = session.reviewOnly ? '見直しクエスト' : stage.shortTitle;
    els.questionCounter.textContent = `${session.index + 1} / ${session.questions.length}`;
    els.scoreText.textContent = `${session.correct}正解`;
    els.scoreBar.style.width = `${(session.correct / session.questions.length) * 100}%`;
    const stageKeys = getProjectedStageKeyCount(session.stageId);
    const pathCount = getProjectedStagePathCount(session.stageId);
    els.comboChip.textContent = `あと${Math.max(0, STAGE_GOAL - stageKeys)}問`;
    els.comboChip.classList.toggle('hot', session.streak >= 3);
    renderSessionMap(q.stageId, stageKeys, pathCount, false, false, sessionPathMarks());
    const promptLong = q.prompt.length > 18;
    els.questionCard.classList.toggle('prompt-long', promptLong);
    els.questionLabel.textContent = session.reviewOnly ? '見直し' : (q.level || stage.shortTitle);
    els.questionText.classList.toggle('prompt-long', promptLong);
    els.questionText.innerHTML = renderQuestionPrompt(q.prompt);
    renderSupportText(q);
    els.answerInput.value = '';
    els.answerInput.disabled = false;
    els.submitButton.textContent = '答える';
    els.feedbackBox.className = 'feedback hidden';
    if (session.reviewOnly) {
      renderFocusVisual(q, null);
    } else {
      renderClosedGate(q);
    }
    renderTypeBadges(q);
    els.answerInput.focus();
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

  function renderQuestionPrompt(prompt) {
    return String(prompt || '')
      .match(/[^。]+。?/g)
      .flatMap(promptChunks)
      .map((chunk) => `<span class="prompt-chunk">${escapeHtml(chunk)}</span>`)
      .join('');
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
        <div><span>残す</span><strong>${v.targetLabel}</strong></div>
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

  function renderFocusVisual(q, result) {
    const v = q.visual;
    const stage = core.getStage(q.stageId);
    const digits = String(v.value).split('');
    const checkPower = Math.max(0, Math.round(Math.log10(v.checkUnit || 1)));
    const focusIndex = Math.max(0, Math.min(digits.length - 1, digits.length - 1 - checkPower));
    const action = v.checkDigit >= 5 ? '5以上 → 1上げる' : '4以下 → そのまま';
    const verdict = result
      ? `<div class="answer-gate ${result.correct ? 'open' : 'repair'}">
          <img src="${result.correct ? artifactIcon(q.stageId) : img(RPG_ASSETS.repair)}" alt="">
          <span>${result.correct ? stage.successTitle : 'もう一度'}</span>
          <strong>${core.formatNumber(q.answer)}</strong>
        </div>`
      : '';
    const answerStep = result && result.correct ? `<span><b>答え</b>${core.formatNumber(q.answer)}</span>` : '';
    els.visualBoard.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.visualBoard.innerHTML = `
      <div class="focus-board">
        <p>位を確認</p>
        <div class="focus-number" aria-label="${v.value}の${v.checkLabel}">
          ${digits.map((digit, index) => `<span class="${index === focusIndex ? 'focus' : ''}">${digit}</span>`).join('')}
        </div>
        <div class="review-steps" aria-label="見直しの手順">
          <span><b>1</b>${v.checkLabel}: ${v.checkDigit}</span>
          <span><b>2</b>${action}</span>
          ${answerStep}
        </div>
      </div>
      ${verdict}
    `;
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
      playSound('notice');
      els.feedbackBox.className = 'feedback notice';
      els.feedbackBox.innerHTML = '<strong>数字を入れてから答えよう。</strong>';
      els.answerInput.focus();
      return;
    }
    const q = session.questions[session.index];
    const result = core.checkAnswer(q, els.answerInput.value);
    session.answered = true;
    els.answerInput.disabled = true;
    let mapRendered = false;
    if (result.correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      if (!session.reviewOnly) session.pathCorrectMarks.push(getCurrentPathMark(q.stageId));
      if (session.reviewOnly) removeSessionMistake(q);
      els.submitButton.textContent = '正解';
      els.feedbackBox.className = 'feedback hidden';
      els.feedbackBox.innerHTML = '';
      renderProgressChrome(q.stageId, result);
      mapRendered = true;
      playSound('correct');
      celebrate();
      scheduleAutoAdvance(820);
    } else {
      session.streak = 0;
      if (!session.reviewOnly) session.pathMissMarks.push(getCurrentPathMark(q.stageId));
      upsertSessionMistake(q, els.answerInput.value);
      playSound('wrong');
      miss();
      if (session.reviewOnly) {
        session.answered = false;
        els.answerInput.disabled = false;
        els.answerInput.value = '';
        els.submitButton.textContent = 'もう一回';
        els.feedbackBox.className = 'feedback hidden';
        els.feedbackBox.innerHTML = '';
        renderFocusVisual(q, null);
        window.setTimeout(() => els.answerInput.focus(), 0);
      } else {
        els.submitButton.textContent = session.index + 1 >= session.questions.length ? '結果へ' : '次へ';
        els.feedbackBox.className = 'feedback wrong compact-wrong-feedback';
        els.feedbackBox.innerHTML = '<strong>おしい！</strong><span>見直しクエストで取り返そう。</span>';
        scheduleAutoAdvance(1080);
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

  function celebrate(progressHtml = '') {
    els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
    els.questionCard.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    void els.questionCard.offsetWidth;
    els.questionCard.classList.add('fx-correct');
    els.questionCard.insertAdjacentHTML('beforeend', `
      <div class="problem-celebration-overlay" aria-hidden="true">
        <svg class="problem-celebration-ring" viewBox="0 0 240 255">
          <circle cx="120" cy="127.5" r="88" transform="rotate(90 120 127.5)"></circle>
        </svg>
        ${progressHtml ? `<div class="progress-toast">${progressHtml}</div>` : ''}
      </div>
    `);
    window.setTimeout(() => {
      els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
      els.questionCard.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    }, 720);
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
    void document.body.offsetWidth;
    document.body.classList.add('screen-miss-flash');
    els.questionCard.classList.remove('fx-correct', 'fx-incorrect');
    els.questionCard.querySelectorAll('.problem-celebration-overlay').forEach((node) => node.remove());
    void els.questionCard.offsetWidth;
    els.questionCard.classList.add('fx-incorrect');
    window.setTimeout(() => {
      els.questionCard.classList.remove('fx-incorrect');
      document.body.classList.remove('screen-miss-flash');
    }, 720);
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

  function pressTenkey(key) {
    if (!session || session.answered || els.answerInput.disabled) return;
    playSound('tap');
    if (/^\d$/.test(key)) {
      const nextValue = `${els.answerInput.value}${key}`.slice(0, Number(els.answerInput.maxLength) || 9);
      els.answerInput.value = nextValue;
    } else if (key === '消す' || key === '1つ消す') {
      els.answerInput.value = els.answerInput.value.slice(0, -1);
    } else if (key === 'クリア') {
      els.answerInput.value = '';
    }
    els.answerInput.focus();
  }

  function finishSession() {
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
    core.saveProgress(localStorage, progress);
    renderHomeStats();
    renderStageSelect();
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
    const cleanResult = !mustReview && !finalClear;
    els.sparkLayer.innerHTML = '';
    els.resultView.classList.toggle('final-clear', finalClear);
    els.resultView.classList.toggle('must-review', mustReview);
    els.resultView.classList.toggle('clean-result', cleanResult);
    const resultArt = finalClear ? 'assets/rpg/final-castle.png' : stage.image;
    els.resultView.style.setProperty('--result-art', `url("${img(resultArt)}")`);
    if (finalClear) playSound('finalClear');
    else if (stageCleared && !mustReview) playSound('stageClear');
    else if (mustReview) playSound('notice');
    els.resultTitle.textContent = mustReview
      ? '見直しクエストへ'
      : finalClear
      ? '完全クリア！'
      : session.reviewOnly
      ? '見直しクリア！'
      : stageCleared
        ? `第${stage.order}章クリア！`
        : `${total}問ぜんぶ正解！`;
    els.resultCopy.textContent = mustReview
      ? 'もう一度とくと、続きの道が開きます。'
      : finalClear
      ? '王城に到着しました。'
      : stageCleared
        ? stageClearCopy(stage)
        : '次の5問へ進もう。';
    els.againButton.textContent = mustReview ? '見直しクエストへ' : (finalClear ? 'もう一度まとめバトル' : (stageCleared && nextStage ? `第${nextStage.order}章へ` : `第${stage.order}章を続ける`));
    els.homeButton.classList.toggle('hidden', mustReview);
    els.rewardScene.innerHTML = `
      <img src="${img(finalClear ? RPG_ASSETS.finalReward : stage.image)}" alt="">
      ${renderResultProgressSummary(stage, stageKeys, remaining, stageCleared, finalClear, mustReview)}
    `;
    const mistakes = session.mistakes.length ? session.mistakes : (progress.mistakes[session.stageId] || []).slice(-5);
    els.resultReviewButton.classList.toggle('hidden', mustReview || !mistakes.length);
    if (finalClear) {
      els.mistakeList.innerHTML = renderFinalClearCertificate(mistakes.length);
      return;
    }
    els.mistakeList.innerHTML = mustReview
      ? '<h3>もう一度とく問題</h3>'
      : '<h3>あとで見直せる問題</h3>';
    if (!mistakes.length) {
      els.mistakeList.insertAdjacentHTML('beforeend', '<p>今は見直す問題がありません。</p>');
      return;
    }
    const visibleMistakes = mistakes.slice(0, mustReview ? 2 : 3);
    visibleMistakes.forEach((mistake) => {
      const item = document.createElement('div');
      item.className = 'mistake-item';
      const input = mistake.input ? core.normalizeAnswerText(String(mistake.input)) : '';
      item.innerHTML = `
        <strong>${mistake.question.prompt}</strong>
        ${input ? `<span class="mistake-input">あなた: ${input}</span>` : ''}
        <small>${mustReview ? 'もう一回チャレンジ' : `答え: ${core.formatNumber(mistake.question.answer)}`}</small>
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

  function getNextMilestone(count) {
    if (count >= STAGE_GOAL) return STAGE_GOAL;
    return Math.min(STAGE_GOAL, Math.ceil(Math.max(1, count) / SESSION_LENGTH) * SESSION_LENGTH);
  }

  function getCorrectProgressHtml(q, projectedKeys) {
    if (session.reviewOnly) {
      return `<img src="${artifactIcon(q.stageId)}" alt=""><strong>OK</strong>`;
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
      return `<div class="result-progress-summary"><strong>今回 ${artifactCollectText(stage, gained)}</strong><span>まちがえた問題が残っています。</span></div>`;
    }
    if (session.reviewOnly) {
      return `<div class="result-progress-summary"><strong>見直しクエスト ${session.correct}問クリア</strong><span>できる問題が増えています。</span></div>`;
    }
    if (finalClear) {
      const totalQuestions = core.STAGES.length * STAGE_GOAL;
      return `<div class="result-progress-summary complete final"><strong>全${totalQuestions}問を走り切りました</strong><span>これで「がい数マスター」です。</span></div>`;
    }
    if (stageCleared) {
      return `<div class="result-progress-summary complete"><strong>第${stage.order}章クリア！</strong><span>${artifactCompleteText(stage)}。</span></div>`;
    }
    const nextMilestone = getNextMilestone(stageKeys);
    const milestoneText = stageKeys % SESSION_LENGTH === 0
      ? `${stageKeys}問目の目印に到着。`
      : `${nextMilestone}問目の目印まであと${nextMilestone - stageKeys}問。`;
    return `<div class="result-progress-summary"><strong>今回 ${artifactCollectText(stage, gained)}</strong><span>第${stage.order}章 ${stageKeys}/${STAGE_GOAL}問。${milestoneText}</span></div>`;
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
              <em>${artifactAmount(stage, count)}</em>
            </span>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderFinalClearCertificate(mistakeCount) {
    const reviewLine = mistakeCount
      ? `<p class="master-note">見直しリストが${mistakeCount}問あります。気になるときは最後に確認できます。</p>`
      : '<p class="master-note">見直す問題はありません。最後までよく走り切りました。</p>';
    return `
      <div class="master-certificate">
        <img class="master-medal" src="${stageCardBadge('final-mix')}" alt="">
        <h3>がい数マスター証</h3>
        <p>四つの力をすべて集めました。</p>
        <div class="final-practice-grid" aria-label="練習する章">
          ${core.STAGES.map((stage) => `
            <button type="button" data-practice-stage="${stage.id}">
              <span>第${stage.order}章</span>
              <strong>${stage.title}</strong>
            </button>
          `).join('')}
        </div>
        ${reviewLine}
      </div>
    `;
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
    if (!session || session.reviewOnly) return {};
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
    if (!isStageUnlocked(selectedStageId)) selectedStageId = getHighestUnlockedStage().id;
  }

  function getPendingReviewStageId() {
    const mistakes = progress.mistakes || {};
    const stage = core.STAGES.find((item) => Array.isArray(mistakes[item.id]) && mistakes[item.id].length > 0);
    return stage ? stage.id : null;
  }

  function renderHomeStats() {
    ensureSelectedStageUnlocked();
    const selectedStage = core.getStage(selectedStageId);
    const selectedMistakes = ((progress.mistakes || {})[selectedStageId] || []).length;
    const hasMistakes = selectedMistakes > 0;
    els.startButton.textContent = hasMistakes
      ? `第${selectedStage.order}章の見直しクエスト`
      : isStageCleared(selectedStageId)
        ? `第${selectedStage.order}章をもう一度`
        : `第${selectedStage.order}章を始める`;
    els.reviewButton.disabled = true;
    els.reviewButton.classList.add('hidden');
    els.reviewButton.textContent = '';
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
        <span>${zone}・${artifactAmount(selected, best)}</span>
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

  function renderSessionMap(stageId, keyCount, pathCount, pulse, missPulse, markState = {}) {
    const stage = core.getStage(stageId);
    els.sessionMap.style.setProperty('--session-road-art', `url("${img(stage.image)}")`);
    const count = Math.min(STAGE_GOAL, Math.max(0, keyCount));
    const path = Math.min(STAGE_GOAL, Math.max(0, pathCount));
    const heroStep = Math.min(STAGE_GOAL, Math.max(1, path + 1));
    const rest = Math.max(0, STAGE_GOAL - count);
    const baseCount = Math.min(STAGE_GOAL, Math.max(0, Number(markState.baseCount) || 0));
    const correctMarks = new Set((markState.correct || []).map(Number));
    const missedMarks = new Set((markState.missed || []).map(Number));
    const pulseMark = Number(markState.pulseMark) || 0;
    const missPulseMark = Number(markState.missPulseMark) || 0;
    const windowStart = Math.floor(Math.max(0, heroStep - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const windowEnd = Math.min(STAGE_GOAL, windowStart + SESSION_LENGTH - 1);
    const zone = `${windowStart}〜${windowEnd}問目`;
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
      const label = isMissed ? '×' : (!isHeroStep ? mark : '');
      const hero = isCurrentCell
        ? `<span class="mini-hero ${pulse ? 'pop' : ''} ${missPulse ? 'miss' : ''}" aria-hidden="true"><img src="${img(RPG_ASSETS.heroIcon)}" alt="勇者"><b>勇</b></span>`
        : '';
      return `<span class="mini-cell ${state}" aria-label="${mark}問目"><b>${label}</b>${hero}</span>`;
    }).join('');
    const plus = pulse
      ? `<span class="map-plus" aria-hidden="true"><img src="${artifactIcon(stageId)}" alt=""><b>+1</b></span>`
      : '';
    els.sessionMap.innerHTML = `
      <div class="key-rail" aria-label="${artifactProgressText(stage, count)}">
        <b>${artifactProgressText(stage, count)}</b>
        <div class="mini-map-track">
          <div class="mini-steps">${cells}</div>
          ${plus}
          <span class="mini-gate"><img src="${artifactIcon(stage.id)}" alt=""></span>
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
        : '前の章クリアで開く';
      return `
        <button class="stage-card ${active} ${stateClass}" type="button" data-stage="${stage.id}" data-state-label="${stateLabel}" ${unlocked && !blockedByReview ? '' : 'disabled'}>
          <img class="stage-bg" src="${img(stage.image)}" alt="">
          <img class="stage-badge" src="${stageCardBadge(stage.id)}" alt="">
          <span>第${stage.order}章</span>
          <strong>${stage.title}</strong>
          <small>${stage.copy}</small>
          <em>${status}</em>
        </button>
      `;
    }).join('');
    els.stageSelect.querySelectorAll('[data-stage]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedStageId = button.dataset.stage;
        renderStageSelect();
        renderHomeStats();
      });
    });
  }

  els.startButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    startSession(Boolean(getPendingReviewStageId()));
  });
  els.reviewButton.addEventListener('click', () => {
    unlockAudio();
    playSound('tap');
    startSession(true);
  });
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
  els.answerInput.addEventListener('input', () => {
    const normalized = core.normalizeAnswerText(els.answerInput.value);
    if (els.answerInput.value !== normalized) els.answerInput.value = normalized;
  });
  els.answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      unlockAudio();
      if (session && session.answered && session.reviewOnly) nextQuestion();
      else submitAnswer();
    }
  });
  window.addEventListener('resize', () => {
    if (!els.homeView.classList.contains('hidden')) renderHomeMap();
  });

  preloadImages([
    RPG_ASSETS.heroIcon,
    RPG_ASSETS.castle,
    RPG_ASSETS.finalReward,
    ...core.STAGES.map((stage) => stage.image),
  ]);
  renderTenkey();
  renderHomeStats();
  renderStageSelect();
})();
