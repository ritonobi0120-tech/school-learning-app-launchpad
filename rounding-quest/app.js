(function () {
  'use strict';

  const APP_VERSION = 78;
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
    guide: 'assets/rpg/guide-spirit.png',
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
    if (blockedByReview) return '見直し中';
    if (cleared) return 'クリア済み';
    if (!unlocked) return '未開放';
    if (stage.id === selectedStageId) return '挑戦中';
    return '開放中';
  }

  function artifactIcon(stageId) {
    return stageCardBadge(stageId);
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

  function show(view) {
    if (session && session.advanceTimer) {
      window.clearTimeout(session.advanceTimer);
      session.advanceTimer = null;
    }
    [els.homeView, els.sessionView, els.resultView].forEach((el) => el.classList.add('hidden'));
    view.classList.remove('hidden');
    const inSession = view === els.sessionView;
    document.body.classList.toggle('session-mode', inSession);
    els.stageSelect.classList.toggle('hidden', inSession || view === els.resultView);
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
    els.modeLabel.textContent = session.reviewOnly ? '見直しタイム' : stage.shortTitle;
    els.questionCounter.textContent = `${session.index + 1} / ${session.questions.length}`;
    els.scoreText.textContent = `${session.correct}正解`;
    els.scoreBar.style.width = `${(session.correct / session.questions.length) * 100}%`;
    const stageKeys = getProjectedStageKeyCount(session.stageId);
    const pathCount = getProjectedStagePathCount(session.stageId);
    els.comboChip.textContent = `あと${Math.max(0, STAGE_GOAL - stageKeys)}こ`;
    els.comboChip.classList.toggle('hot', session.streak >= 3);
    renderSessionMap(q.stageId, stageKeys, pathCount, false, false);
    els.questionLabel.textContent = q.level ? `${q.level}：${q.label}` : q.label;
    els.questionText.textContent = q.prompt;
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

  function renderVisual(q, result) {
    const v = q.visual;
    const stage = core.getStage(q.stageId);
    const statusClass = result ? (result.correct ? 'ok' : 'ng') : '';
    const resultImage = result ? (result.correct ? artifactIcon(q.stageId) : img(RPG_ASSETS.repair)) : img(RPG_ASSETS.treasure);
    const resultLine = result
      ? `<div class="answer-gate ${result.correct ? 'open' : 'repair'}"><img src="${resultImage}" alt=""><span>${result.correct ? `${stage.artifact}を見つけた！` : '見直すところ'}</span><strong>${core.formatNumber(q.answer)}</strong></div>`
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
          <span>${result.correct ? `${stage.artifact}を見つけた！` : '答え'}</span>
          <strong>${core.formatNumber(q.answer)}</strong>
        </div>`
      : '';
    const answerStep = result ? `<span><b>答え</b>${core.formatNumber(q.answer)}</span>` : '';
    els.visualBoard.style.setProperty('--stage-art', `url("${img(stage.image)}")`);
    els.visualBoard.innerHTML = `
      <div class="focus-board">
        <p>ここを見る</p>
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
      ? (isStageUnlocked(nextStage.id) ? `次: 第${nextStage.order}章 ${nextStage.title}` : `あと${Math.max(0, STAGE_GOAL - getStageKeyCount(q.stageId))}こで 第${nextStage.order}章`)
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
      if (session.reviewOnly) removeSessionMistake(q);
      els.submitButton.textContent = '正解';
      els.feedbackBox.className = 'feedback hidden';
      els.feedbackBox.innerHTML = '';
      renderProgressChrome(q.stageId, result);
      mapRendered = true;
      celebrate();
      scheduleAutoAdvance(820);
    } else {
      session.streak = 0;
      upsertSessionMistake(q, els.answerInput.value);
      miss();
      if (session.reviewOnly) {
        session.answered = false;
        els.answerInput.disabled = false;
        els.answerInput.value = '';
        els.submitButton.textContent = 'もう一回';
        els.feedbackBox.className = 'feedback wrong';
        els.feedbackBox.innerHTML = `<strong>ここを見直そう</strong><span>答えは ${core.formatNumber(q.answer)}</span>`;
        renderFocusVisual(q, result);
        window.setTimeout(() => els.answerInput.focus(), 0);
      } else {
        els.submitButton.textContent = session.index + 1 >= session.questions.length ? '結果へ' : '次へ';
        els.feedbackBox.className = 'feedback wrong compact-wrong-feedback';
        els.feedbackBox.innerHTML = '<strong>おしい！</strong><span>あとで一緒に見直そう。</span>';
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
    const pathCount = getProjectedStagePathCount(stageId);
    els.comboChip.textContent = `あと${Math.max(0, STAGE_GOAL - stageKeys)}こ`;
    els.comboChip.classList.toggle('hot', session.streak >= 3);
    renderSessionMap(stageId, stageKeys, pathCount, result.correct, !result.correct);
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
    if (!session || !session.reviewOnly) {
      els.supportText.textContent = '';
      els.supportText.classList.add('hidden');
      return;
    }
    const v = q.visual;
    const stateClass = result ? (result.correct ? 'review-ok' : 'review-ng') : '';
    const action = v.checkDigit >= 5 ? '5以上 → 1上げる' : '4以下 → そのまま';
    els.supportText.classList.add('review-tip');
    if (stateClass) els.supportText.classList.add(stateClass);
    const title = result
      ? (result.correct ? 'できた！' : '見直そう')
      : '見直し';
    els.supportText.innerHTML = `
      <span>${title}</span>
      <strong>${v.checkLabel}: ${v.checkDigit}</strong>
      <em>${action}</em>
    `;
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
    els.resultTitle.textContent = mustReview ? 'もう一回で道が開くよ' : (finalClear ? 'がい数王国 完全クリア！' : `${session.correct} / ${total} 正解`);
    els.resultCopy.textContent = mustReview
      ? 'まちがえた問題だけ、もう一度チャレンジ。'
      : finalClear
      ? `4つの章をすべて${STAGE_GOAL}/${STAGE_GOAL}まで集めました。四捨五入、何の位まで、上から何けた、まとめの問題まで走り切った証です。`
      : stageCleared
        ? nextStage
          ? `第${stage.order}章クリア。次の章へ進めます。`
          : `全4章を${STAGE_GOAL}/${STAGE_GOAL}まで攻略。がい数マスターです。`
        : `いいペース。次の5問へ進もう。あと${remaining}こで次の扉。`;
    els.againButton.textContent = mustReview ? '見直しにチャレンジ' : (finalClear ? 'もう一度まとめバトル' : (stageCleared && nextStage ? `第${nextStage.order}章へ` : `第${stage.order}章を続ける`));
    els.homeButton.classList.toggle('hidden', mustReview);
    els.rewardScene.innerHTML = `
      <img src="${img(finalClear ? RPG_ASSETS.finalReward : RPG_ASSETS.castle)}" alt="">
      ${renderResultProgressSummary(stage, stageKeys, remaining, stageCleared, finalClear, mustReview)}
      <div>${core.STAGES.map((item) => `<span class="${isStageCleared(item.id) ? 'active' : ''}"><img src="${miniStageBadge(item.id)}" alt="">${item.order}</span>`).join('')}</div>
    `;
    const mistakes = session.mistakes.length ? session.mistakes : (progress.mistakes[session.stageId] || []).slice(-5);
    els.resultReviewButton.classList.toggle('hidden', mustReview || !mistakes.length);
    if (finalClear) {
      els.mistakeList.innerHTML = renderFinalClearCertificate(mistakes.length);
      return;
    }
    els.mistakeList.innerHTML = mustReview
      ? '<h3>もう一度チャレンジ</h3><p class="mistake-lead">ここをクリアしたら、続きへ進めます。</p>'
      : '<h3>見直しリスト</h3>';
    if (!mistakes.length) {
      els.mistakeList.insertAdjacentHTML('beforeend', '<p>今は見直す問題がありません。</p>');
      return;
    }
    mistakes.forEach((mistake) => {
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
      return `<div class="result-progress-summary"><strong>今回 ${stage.artifact}を${gained}こ発見</strong><span>見直したら、続きへ進もう。</span></div>`;
    }
    if (session.reviewOnly) {
      return `<div class="result-progress-summary"><strong>見直しを${session.correct}問クリア</strong><span>できる問題が増えています。</span></div>`;
    }
    if (finalClear) {
      const totalKeys = core.STAGES.length * STAGE_GOAL;
      return `<div class="result-progress-summary complete final"><strong>全${totalKeys}この光を集めました</strong><span>これで「がい数マスター」。最後の画面まで到着です。</span></div>`;
    }
    if (stageCleared) {
      return `<div class="result-progress-summary complete"><strong>第${stage.order}章クリア！</strong><span>${stage.artifact}が${STAGE_GOAL}こ集まりました。次の章へ進めます。</span></div>`;
    }
    const nextMilestone = getNextMilestone(stageKeys);
    const milestoneText = stageKeys % SESSION_LENGTH === 0
      ? `${stageKeys}こ目の目印に到着。`
      : `${nextMilestone}こ目の目印まであと${nextMilestone - stageKeys}こ。`;
    return `<div class="result-progress-summary"><strong>今回 ${stage.artifact}を${gained}こ発見</strong><span>第${stage.order}章 ${stageKeys}/${STAGE_GOAL}。${milestoneText}</span></div>`;
  }

  function renderFinalClearCertificate(mistakeCount) {
    const reviewLine = mistakeCount
      ? `<p class="master-note">見直しリストが${mistakeCount}こあります。気になるときは最後に確認できます。</p>`
      : '<p class="master-note">見直す問題はありません。最後までよく走り切りました。</p>';
    return `
      <div class="master-certificate">
        <span class="master-medal">🏆</span>
        <h3>がい数マスター証</h3>
        <p>4つの力をぜんぶ集めました。</p>
        <div class="master-badges">
          ${core.STAGES.map((stage) => `<span><img src="${miniStageBadge(stage.id)}" alt="">${stage.title}</span>`).join('')}
        </div>
        ${reviewLine}
      </div>
    `;
  }

  function isStageCleared(stageId) {
    return getStageKeyCount(stageId) >= STAGE_GOAL;
  }

  function getStageKeyCount(stageId) {
    return Math.min(STAGE_GOAL, Math.max(0, Number((progress.stageWins || {})[stageId]) || 0));
  }

  function getProjectedStageKeyCount(stageId) {
    const earned = session && !session.reviewOnly && session.stageId === stageId ? session.correct : 0;
    return Math.min(STAGE_GOAL, getStageKeyCount(stageId) + earned);
  }

  function getProjectedStagePathCount(stageId) {
    return getProjectedStageKeyCount(stageId);
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
    els.startButton.textContent = hasMistakes ? `第${selectedStage.order}章を見直す` : `第${selectedStage.order}章を始める`;
    els.reviewButton.disabled = !hasMistakes;
    els.reviewButton.classList.toggle('hidden', !hasMistakes);
    els.reviewButton.textContent = hasMistakes ? `第${selectedStage.order}章の見直し` : '';
    renderHomeMap();
  }

  function mapPercent(stageId, keyCount) {
    const stageIndex = Math.max(0, core.STAGES.findIndex((stage) => stage.id === stageId));
    const base = [10, 34, 58, 78][stageIndex] || 10;
    return Math.min(92, base + Math.min(10, keyCount) * 1.8);
  }

  function mapPoint(stageId, keyCount) {
    const segments = {
      'round-digit': { from: [10, 66], to: [34, 77] },
      'round-place': { from: [36, 77], to: [62, 64] },
      significant: { from: [64, 61], to: [88, 35] },
      'final-mix': { from: [72, 48], to: [91, 23] },
    };
    const segment = segments[stageId] || segments['round-digit'];
    const rate = Math.min(STAGE_GOAL, Math.max(0, keyCount)) / STAGE_GOAL;
    return {
      x: segment.from[0] + (segment.to[0] - segment.from[0]) * rate,
      y: segment.from[1] + (segment.to[1] - segment.from[1]) * rate,
    };
  }

  function renderHomeMap() {
    const selected = core.getStage(selectedStageId);
    const best = getStageKeyCount(selectedStageId);
    const hero = mapPoint(selectedStageId, best);
    const rest = Math.max(0, STAGE_GOAL - best);
    const nextStep = Math.min(STAGE_GOAL, best + 1);
    const zoneStart = Math.floor(Math.max(0, nextStep - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const zoneEnd = Math.min(STAGE_GOAL, zoneStart + SESSION_LENGTH - 1);
    const zone = best >= STAGE_GOAL ? '章クリア' : `${zoneStart}-${zoneEnd}こ目`;
    const tiles = [10, 20, 30].map((milestone) => {
      const on = best >= milestone ? 'on' : '';
      const point = mapPoint(selectedStageId, milestone);
      return `<span class="map-checkpoint ${on}" style="--x:${point.x}%;--y:${point.y}%"><b>${milestone}</b></span>`;
    }).join('');
    els.homeMapOverlay.innerHTML = `
      <div class="map-road"></div>
      <div class="map-tiles">${tiles}</div>
      <div class="path-nodes">
        ${core.STAGES.map((stage) => {
          const point = mapPoint(stage.id, 10);
          const state = isStageCleared(stage.id) ? 'open' : isStageUnlocked(stage.id) ? '' : 'locked';
          return `<span class="${state}" style="--x:${point.x}%;--y:${point.y}%"><img src="${miniStageBadge(stage.id)}" alt=""></span>`;
        }).join('')}
      </div>
      <img class="hero-marker" src="${img(RPG_ASSETS.guide)}" alt="" style="--x:${hero.x}%;--y:${hero.y}%">
      <div class="map-caption"><strong>今は${zone}</strong><span>第${selected.order}章 ${selected.artifact} ${best}/${STAGE_GOAL}、あと${rest}こ</span></div>
    `;
  }

  function renderSessionMap(stageId, keyCount, pathCount, pulse, missPulse) {
    const stage = core.getStage(stageId);
    els.sessionMap.style.setProperty('--session-road-art', `url("${img(stage.image)}")`);
    const count = Math.min(STAGE_GOAL, Math.max(0, keyCount));
    const path = Math.min(STAGE_GOAL, Math.max(0, pathCount));
    const heroStep = Math.min(STAGE_GOAL, Math.max(1, path + 1));
    const rest = Math.max(0, STAGE_GOAL - count);
    const windowStart = Math.floor(Math.max(0, heroStep - 1) / SESSION_LENGTH) * SESSION_LENGTH + 1;
    const windowEnd = Math.min(STAGE_GOAL, windowStart + SESSION_LENGTH - 1);
    const zone = `${windowStart}-${windowEnd}こ目`;
    const cells = Array.from({ length: windowEnd - windowStart + 1 }, (_, index) => {
      const mark = windowStart + index;
      const isCurrentCell = mark === heroStep;
      const isHeroStep = path > 0 && isCurrentCell;
      const state = [
        count >= mark ? 'done' : '',
        path >= mark && count < mark ? 'walked' : '',
        isCurrentCell ? 'now' : '',
        isCurrentCell && pulse ? 'correct-pulse' : '',
        isCurrentCell && missPulse ? 'miss-pulse' : '',
        mark % SESSION_LENGTH === 0 ? 'checkpoint' : '',
      ].filter(Boolean).join(' ');
      const label = !isHeroStep ? mark : '';
      const hero = isCurrentCell
        ? `<span class="mini-hero ${pulse ? 'pop' : ''} ${missPulse ? 'miss' : ''}" aria-hidden="true"><img src="${img(RPG_ASSETS.heroIcon)}" alt="勇者"><b>勇</b></span>`
        : '';
      return `<span class="mini-cell ${state}" aria-label="${mark}こ目"><b>${label}</b>${hero}</span>`;
    }).join('');
    const plus = pulse
      ? `<span class="map-plus" aria-hidden="true"><img src="${artifactIcon(stageId)}" alt=""><b>+1</b></span>`
      : '';
    els.sessionMap.innerHTML = `
      <div class="key-rail" aria-label="${stage.artifact} ${count}/${STAGE_GOAL}">
        <b>${stage.artifact} ${count}/${STAGE_GOAL}</b>
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
        ? 'まちがい直しで開く'
        : unlocked
        ? (cleared ? `${STAGE_GOAL}/${STAGE_GOAL}クリア済み` : `${best}/${STAGE_GOAL}・あと${STAGE_GOAL - best}こ`)
        : `前の章を${STAGE_GOAL}こで開く`;
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

  els.startButton.addEventListener('click', () => startSession(Boolean(getPendingReviewStageId())));
  els.reviewButton.addEventListener('click', () => startSession(true));
  els.againButton.addEventListener('click', () => {
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
  els.resultReviewButton.addEventListener('click', () => startSession(true));
  els.homeButton.addEventListener('click', () => show(els.homeView));
  els.submitButton.addEventListener('click', () => {
    if (session && session.answered) {
      nextQuestion();
      return;
    }
    submitAnswer();
  });
  els.tenkey.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-key]');
    if (!button) return;
    pressTenkey(button.dataset.key);
  });
  els.answerInput.addEventListener('input', () => {
    const normalized = core.normalizeAnswerText(els.answerInput.value);
    if (els.answerInput.value !== normalized) els.answerInput.value = normalized;
  });
  els.answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      if (session && session.answered && session.reviewOnly) nextQuestion();
      else submitAnswer();
    }
  });

  preloadImages([
    RPG_ASSETS.guide,
    RPG_ASSETS.heroIcon,
    RPG_ASSETS.castle,
    RPG_ASSETS.finalReward,
    ...core.STAGES.map((stage) => stage.image),
  ]);
  renderTenkey();
  renderHomeStats();
  renderStageSelect();
})();
