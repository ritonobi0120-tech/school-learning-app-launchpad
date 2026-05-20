const STORAGE_KEY = "tenSecondAdditionBest";
const QUESTION_SECONDS = 10;
const CLEAR_COUNT = 100;

const state = {
  running: false,
  answered: 0,
  best: readBestScore(),
  problem: null,
  startedAt: 0,
  rafId: 0,
  nextTimerId: 0,
  recentKeys: [],
  recentAnswerKeys: [],
  recentRightAddends: [],
  activeAnswerInputId: "",
  feedbackFx: "",
  urgentBeat: -1,
  lastEnd: null
};

const app = document.getElementById("app");
let audioContext = null;
const audioState = {
  quietUntil: 0,
  lastInputAt: 0
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(values) {
  return values[randomInt(0, values.length - 1)];
}

function readBestScore() {
  let value = 0;
  try {
    value = Number(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return 0;
  }
  if (!Number.isFinite(value) || value < 0 || value > CLEAR_COUNT) return 0;
  return Math.floor(value);
}

function saveBestScore(score) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch (error) {
    // 記録保存に失敗しても、学習画面は止めない。
  }
}

function createProblem(answeredCount) {
  const number = answeredCount + 1;

  if (number <= 5) {
    return createAdditionProblem({
      number,
      stage: "入口",
      label: "まずは安心",
      aMin: 1,
      aMax: 6,
      bMin: 1,
      bMax: 5,
      carry: "none",
      sumMax: 9
    });
  }

  if (number <= 10) {
    return createAdditionProblem({
      number,
      stage: "前半",
      label: "1けた",
      aMin: 3,
      aMax: 9,
      bMin: 2,
      bMax: 9,
      carry: "mixed",
      carryRate: .3
    });
  }

  if (number <= 20) {
    return createAdditionProblem({
      number,
      stage: "中盤",
      label: "2けた入口",
      aMin: 10,
      aMax: 49,
      bMin: 1,
      bMax: 9,
      carry: "none"
    });
  }

  if (number <= 30) {
    return createAdditionProblem({
      number,
      stage: "後半",
      label: "くり上がり",
      aMin: 12,
      aMax: 79,
      bMin: 2,
      bMax: 9,
      carry: "ones",
      carryRate: .72,
      sumMax: 99
    });
  }

  if (number <= 40) {
    return createAdditionProblem({
      number,
      stage: "終盤",
      label: "2けた同士",
      aMin: 12,
      aMax: 89,
      bMin: 11,
      bMax: 89,
      carry: "none",
      sumMax: 99
    });
  }

  if (number <= 50) {
    return createAdditionProblem({
      number,
      stage: "最終盤",
      label: "2けた完成",
      aMin: 18,
      aMax: 89,
      bMin: 12,
      bMax: 89,
      carry: "ones",
      sumMax: 99
    });
  }

  if (number <= 60) {
    return createAdditionProblem({
      number,
      stage: "ラスト前",
      label: "100こえ",
      aMin: 45,
      aMax: 99,
      bMin: 25,
      bMax: 89,
      carry: "mixed",
      carryRate: .65,
      sumMin: 100,
      sumMax: 169
    });
  }

  if (number <= 70) {
    return createAdditionProblem({
      number,
      stage: "3けた入口",
      label: "3けたへ",
      aMin: 101,
      aMax: 499,
      bMin: 4,
      bMax: 89,
      carry: "mixed",
      carryRate: .45,
      sumMax: 599
    });
  }

  if (number <= 80) {
    return createAdditionProblem({
      number,
      stage: "3けた強化",
      label: "3けた+2けた",
      aMin: 120,
      aMax: 699,
      bMin: 21,
      bMax: 99,
      carry: "mixed",
      carryRate: .62,
      sumMax: 799
    });
  }

  if (number <= 90) {
    return createAdditionProblem({
      number,
      stage: "ラスト前",
      label: "3けた同士",
      aMin: 102,
      aMax: 599,
      bMin: 101,
      bMax: 399,
      carry: "light",
      sumMax: 899
    });
  }

  return createAdditionProblem({
    number,
    stage: "ラスト",
    label: "100日目前",
    aMin: 201,
    aMax: 799,
    bMin: 102,
    bMax: 699,
    carry: "heavy",
    carryRate: .76,
    sumMax: 999
  });
}

function createAdditionProblem(config) {
  const carryTarget = pickCarryTarget(config);
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const a = randomInt(config.aMin, config.aMax);
    const b = randomInt(config.bMin, config.bMax);
    const sum = a + b;
    if (config.sumMin && sum < config.sumMin) continue;
    if (config.sumMax && sum > config.sumMax) continue;
    if (!matchesCarryTarget(a, b, carryTarget)) continue;
    return toAdditionProblem(config, a, b);
  }

  return createAdditionFallback(config);
}

function createAdditionFallback(config) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const a = randomInt(config.aMin, config.aMax);
    const b = randomInt(config.bMin, config.bMax);
    const sum = a + b;
    if (config.sumMin && sum < config.sumMin) continue;
    if (config.sumMax && sum > config.sumMax) continue;
    return toAdditionProblem(config, a, b);
  }
  return toAdditionProblem(config, config.aMin, config.bMin);
}

function toAdditionProblem(config, a, b) {
  const left = Math.max(a, b);
  const right = Math.min(a, b);
  return {
    number: config.number,
    stage: config.stage,
    label: config.label,
    left,
    right,
    answer: left + right,
    carryCount: countCarries(left, right)
  };
}

function pickCarryTarget(config) {
  if (config.carry === "mixed") {
    return Math.random() < (config.carryRate || .5) ? "some" : "none";
  }
  if (config.carry === "heavy") {
    return Math.random() < (config.carryRate || .7) ? "multi" : "any";
  }
  return config.carry || "any";
}

function matchesCarryTarget(a, b, target) {
  const carries = countCarries(a, b);
  if (target === "none") return carries === 0;
  if (target === "some") return carries >= 1;
  if (target === "ones") return hasOnesCarry(a, b) && carries <= 1;
  if (target === "light") return carries <= 1;
  if (target === "multi") return carries >= 2;
  return true;
}

function hasOnesCarry(a, b) {
  return (a % 10) + (b % 10) >= 10;
}

function countCarries(a, b) {
  let carries = 0;
  let carry = 0;
  let left = a;
  let right = b;
  while (left > 0 || right > 0) {
    const digitSum = (left % 10) + (right % 10) + carry;
    carry = digitSum >= 10 ? 1 : 0;
    if (carry) carries += 1;
    left = Math.floor(left / 10);
    right = Math.floor(right / 10);
  }
  return carries;
}

function renderHome() {
  stopActiveRun();
  const completeBadge = state.best >= CLEAR_COUNT
    ? `
        <div class="home-complete-badge" aria-label="100日達成">
          <span>★</span>
          <strong>100日達成</strong>
          <small>100日到達</small>
        </div>
      `
    : "";
  app.innerHTML = `
    <section class="screen home-shell">
      <div class="home-screen">
        ${completeBadge}
        <div class="home-top">
          <button class="home-tool-btn" type="button" data-action="howto" aria-label="使い方" title="使い方">?</button>
        </div>
        <div class="home-center">
          <div class="brand">10秒チャレンジ</div>
          <h1><span>足し算</span><span>サバイバル</span></h1>
        </div>
        <div class="home-bottom">
          <div class="home-mission">
            <strong>10秒で答えて何日生き残れるか</strong>
            <span>現在の最高記録 <b>${state.best}</b>日</span>
          </div>
          <button class="primary home-cta" type="button" data-action="start">スタート</button>
        </div>
      </div>
    </section>
  `;
}

function renderPractice() {
  const p = state.problem;
  const bestLabel = Math.max(state.best, state.answered);
  const problemTextSizeClass = String(p.left).length >= 3 ? "problem-text-wide" : "";
  app.innerHTML = `
    <section class="screen">
      <div class="practice-card session-card compact-session">
        <div class="session-topbar">
          <div class="session-topbar-left">
            <span class="session-counter">第${p.number}日</span>
            <div class="session-collect-chip timer-wrap">
              <span>のこり</span>
              <strong id="timerText">10.0</strong>
              <span>秒</span>
            </div>
          </div>
          <div class="session-topbar-right">
            <span class="session-best">記録 ${state.answered}日</span>
            <span class="session-best">過去最高 ${bestLabel}日</span>
          </div>
        </div>
        <div class="timer-progress" aria-hidden="true">
          <div id="timerFill" class="timer-fill"></div>
        </div>
        <div class="question-area session-main">
          <div class="question problem-board">
            <div class="formula problem-text ${problemTextSizeClass}"><span>${p.left}</span><span>+</span><span>${p.right}</span></div>
          </div>
          <div class="session-side">
            <form class="answer-form" data-action="answer">
              ${renderAnswerInput(p)}
              ${renderKeypad()}
              <div id="feedback" class="feedback-slot" aria-live="assertive"></div>
              <div class="result-actions compact-actions sticky-submit">
                <button class="submit button-accent" type="submit">こたえを送る！</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;

  startTimer();
}

function renderAnswerInput(problem) {
  return `
    <div class="field answer-box-wrap">
      <label for="answer" class="answer-label">答え</label>
      <input id="answer" class="answer-input answer-box" name="answer" inputmode="none" autocomplete="off" pattern="[0-9]*" maxlength="4" placeholder="□" readonly aria-readonly="true">
    </div>
  `;
}

function renderKeypad() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"];
  return `
    <div class="keypad compact-keypad" aria-label="テンキー">
      ${keys.map((key) => {
        const label = key === "clear" ? "けす" : key === "backspace" ? "1字けす" : key;
        const className = key === "clear" ? "special keypad-clear" : key === "backspace" ? "special keypad-backspace" : "";
        return `<button type="button" class="${className}" data-keypad="${key}">${label}</button>`;
      }).join("")}
    </div>
  `;
}

function startPractice() {
  unlockAudio();
  playStartSound();
  state.running = true;
  state.answered = 0;
  state.recentKeys = [];
  state.recentAnswerKeys = [];
  state.recentRightAddends = [];
  state.lastEnd = null;
  nextQuestion();
}

function nextQuestion() {
  cancelAnimationFrame(state.rafId);
  clearTimeout(state.nextTimerId);
  state.running = true;
  state.feedbackFx = "";
  state.urgentBeat = -1;
  state.problem = selectProblem(state.answered);
  renderPractice();
}

function selectProblem(answeredCount) {
  let selected = null;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const candidate = createProblem(answeredCount);
    const key = getProblemKey(candidate);
    const answerKey = getAnswerKey(candidate);
    const sameRecentProblem = state.recentKeys.includes(key);
    const sameRecentAnswer = state.recentAnswerKeys.includes(answerKey);
    const sameLastAnswer = state.recentAnswerKeys[0] === answerKey;
    const sameLastRightAddend = state.recentRightAddends[0] === candidate.right;
    const strictOk = !sameRecentProblem && !sameRecentAnswer && !sameLastRightAddend;
    const relaxedOk = !sameRecentProblem && !sameLastAnswer && !sameLastRightAddend;
    if (strictOk || (attempt > 60 && relaxedOk) || attempt === 119) {
      selected = candidate;
      break;
    }
  }

  state.recentKeys = [getProblemKey(selected), ...state.recentKeys].slice(0, 14);
  state.recentAnswerKeys = [getAnswerKey(selected), ...state.recentAnswerKeys].slice(0, 5);
  state.recentRightAddends = [selected.right, ...state.recentRightAddends].slice(0, 2);
  return selected;
}

function getProblemKey(problem) {
  return `${problem.left}+${problem.right}`;
}

function getAnswerKey(problem) {
  return String(problem.answer);
}

function startTimer() {
  state.startedAt = performance.now();

  function tick(now) {
    if (!state.running) return;
    const remaining = getRemainingSeconds(now);
    updateTimerDisplay(remaining);
    playUrgentBeat(remaining);

    if (remaining <= 0) {
      finishPractice("time");
      return;
    }

    state.rafId = requestAnimationFrame(tick);
  }

  state.rafId = requestAnimationFrame(tick);
}

function getRemainingSeconds(now = performance.now()) {
  const elapsed = (now - state.startedAt) / 1000;
  return Math.max(0, QUESTION_SECONDS - elapsed);
}

function updateTimerDisplay(remaining) {
  const timerText = document.getElementById("timerText");
  const timerFill = document.getElementById("timerFill");
  const practiceCard = document.querySelector(".practice-card");
  if (timerText) {
    timerText.textContent = remaining.toFixed(1);
    timerText.classList.toggle("timer-danger", remaining <= 3);
  }
  if (timerFill) {
    const remainingRatio = remaining / QUESTION_SECONDS;
    const hue = getTimerHue(remainingRatio);
    timerFill.style.transform = `scaleX(${remainingRatio})`;
    timerFill.style.setProperty("--timer-hue", String(hue));
    timerFill.classList.toggle("timer-danger", remaining <= 3);
  }
  if (practiceCard) practiceCard.classList.toggle("fx-hurry", remaining <= 3);
}

function getTimerHue(remainingRatio) {
  if (remainingRatio > .65) {
    return Math.round(70 + ((remainingRatio - .65) / .35) * 62);
  }
  if (remainingRatio > .3) {
    return Math.round(25 + ((remainingRatio - .3) / .35) * 45);
  }
  return Math.round((remainingRatio / .3) * 25);
}

function submitAnswer(form) {
  if (!state.running) return;
  const p = state.problem;
  const data = new FormData(form);
  const parsed = parseAnswer(data, p);

  if (!parsed) {
    playMissingSound();
    showMissingAnswerFeedback(data, p);
    return;
  }

  if (parsed.answer === p.answer) {
    cancelAnimationFrame(state.rafId);
    state.running = false;
    state.answered += 1;
    if (state.answered > state.best) {
      state.best = state.answered;
      saveBestScore(state.best);
    }
    if (state.answered >= CLEAR_COUNT) {
      finishPractice("clear", parsed);
      return;
    }
    playCorrectSound();
    showCorrectEffect();
    state.nextTimerId = window.setTimeout(nextQuestion, 520);
    return;
  }

  updateTimerDisplay(getRemainingSeconds());
  cancelAnimationFrame(state.rafId);
  clearTimeout(state.nextTimerId);
  state.running = false;
  playWrongSound();
  showWrongEffect();
  showCorrectAnswerReveal(p, parsed);
}

function parseAnswer(data, problem) {
  const digits = normalizeDigits(data.get("answer")).replace(/\D/g, "");
  if (!digits) return null;
  return {
    answer: Number(digits)
  };
}

function showMissingAnswerFeedback(data, problem) {
  showFeedback("答えを入れてね。", true);
  if (canFocusAnswerInput()) {
    document.getElementById("answer")?.focus({ preventScroll: true });
  }
}


function showCorrectEffect() {
  const board = document.querySelector(".problem-board");
  if (!board) return;
  board.classList.remove("fx-correct");
  board.classList.remove("fx-wrong");
  board.querySelector(".problem-celebration-overlay")?.remove();
  board.insertAdjacentHTML("afterbegin", `
    <div class="problem-celebration-overlay" aria-hidden="true">
      <svg class="problem-celebration-ring" viewBox="0 0 640 220">
        <path pathLength="100" d="M320 204 C154 204 20 162 20 110 C20 58 154 16 320 16 C486 16 620 58 620 110 C620 162 486 204 320 204"></path>
      </svg>
    </div>
  `);
  window.requestAnimationFrame(() => board.classList.add("fx-correct"));
}

function showWrongEffect() {
  const board = document.querySelector(".problem-board");
  const form = document.querySelector(".answer-form");
  const card = document.querySelector(".practice-card");
  if (card) {
    card.classList.remove("fx-wrong-scene");
    window.requestAnimationFrame(() => card.classList.add("fx-wrong-scene"));
  }
  if (board) {
    board.classList.remove("fx-wrong");
    window.requestAnimationFrame(() => board.classList.add("fx-wrong"));
  }
  if (form) {
    form.classList.remove("fx-wrong");
    window.requestAnimationFrame(() => form.classList.add("fx-wrong"));
  }
}

function showCorrectAnswerReveal(problem, userAnswer) {
  const correct = formatCorrectAnswer(problem);
  const user = formatParsedAnswer(problem, userAnswer);
  const feedback = document.getElementById("feedback");
  const answerLabel = document.querySelector(".answer-label");

  if (answerLabel) answerLabel.textContent = "あなたの答え";

  if (feedback) {
    feedback.innerHTML = `
      <div class="answer-reveal" role="alert">
        <div class="wrong-result-summary">
          <div>
            <span>今回の記録</span>
            <strong>${state.answered}<small>日</small></strong>
          </div>
          <div>
            <span>最高記録</span>
            <strong>${state.best}<small>日</small></strong>
          </div>
        </div>
        <div class="wrong-answer-note">
          <span>あなたの答え</span>
          <strong>${user}</strong>
        </div>
        <div class="correct-answer-card">
          <span>正解</span>
          <strong>${correct}</strong>
        </div>
        <div class="wrong-result-actions">
          <button class="primary reveal-retry" type="button" data-action="start">もう一回</button>
          <button class="ghost reveal-home" type="button" data-action="home">ホームに戻る</button>
        </div>
      </div>
    `;
  }

  document.querySelectorAll(".answer-form input, .answer-form [data-keypad], .answer-form .submit").forEach((control) => {
    control.disabled = true;
  });
}

function showFeedback(message, isBad) {
  const feedback = document.getElementById("feedback");
  if (!feedback) return;
  feedback.innerHTML = `<div class="feedback ${isBad ? "incorrect" : "correct"} compact-feedback">${message}</div>`;
}

function formatCorrectAnswer(problem) {
  return String(problem.answer);
}

function formatParsedAnswer(problem, parsed) {
  if (!parsed) return "未入力";
  return String(parsed.answer);
}

function finishPractice(reason, userAnswer) {
  cancelAnimationFrame(state.rafId);
  clearTimeout(state.nextTimerId);
  if (reason === "time") playTimeUpSound();
  if (reason === "clear") playClearSound();
  state.running = false;
  state.lastEnd = {
    reason,
    problem: state.problem,
    userAnswer
  };
  renderResult();
}

function unlockAudio() {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    audioContext = new AudioContextClass();
  } catch (error) {
    return null;
  }
  return audioContext;
}

function playTone(frequency, start, duration, options = {}) {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  if (options.slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(options.slideTo, start + duration);
  }
  const volume = options.volume ?? .06;
  const attack = options.attack ?? .012;
  const releaseAt = Math.max(start + attack + .01, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, releaseAt);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(releaseAt + .03);
}

function playToneSequence(steps, options = {}) {
  const context = getAudioContext();
  if (!context || !steps || !steps.length) return;
  if (context.state === "suspended") context.resume().catch(() => {});
  const startAt = context.currentTime + .01;
  const quietFor = Number(options.quietFor || 0);
  if (quietFor) audioState.quietUntil = Math.max(audioState.quietUntil, startAt + quietFor);
  steps.forEach((step) => {
    playTone(Number(step.freq || 880), startAt + Number(step.at || 0), Number(step.duration || .08), {
      type: step.type || "triangle",
      volume: Number(step.gain || .04),
      slideTo: step.endFreq,
      attack: step.attack
    });
  });
}

function playStartSound() {
  playToneSequence([
    { at: 0, freq: 523, duration: .045, gain: .025, type: "triangle" },
    { at: .055, freq: 784, duration: .07, gain: .032, type: "triangle" }
  ], { quietFor: .16 });
}

function playInputSound(kind = "digit") {
  const context = getAudioContext();
  if (!context || !state.running) return;
  if (context.currentTime - audioState.lastInputAt < .035) return;
  audioState.lastInputAt = context.currentTime;
  if (kind === "erase") {
    playTone(420, context.currentTime + .006, .032, { type: "triangle", volume: .014, slideTo: 360, attack: .004 });
    return;
  }
  playTone(980, context.currentTime + .006, .026, { type: "sine", volume: .014, attack: .003 });
}

function playMissingSound() {
  playToneSequence([
    { at: 0, freq: 330, duration: .045, gain: .026, type: "triangle" },
    { at: .065, freq: 294, duration: .055, gain: .022, type: "triangle" }
  ], { quietFor: .16 });
}

function playCorrectSound() {
  playToneSequence([
    { at: 0, freq: 784, duration: .065, gain: .056, type: "triangle" },
    { at: .045, freq: 1175, duration: .075, gain: .066, type: "triangle" },
    { at: .105, freq: 1568, duration: .13, gain: .068, type: "sine" },
    { at: .155, freq: 2093, duration: .095, gain: .04, type: "sine" }
  ], { quietFor: .42 });
}

function playWrongSound() {
  playToneSequence([
    { at: 0, freq: 784, endFreq: 587, duration: .075, gain: .11, type: "square", attack: .003 },
    { at: .07, freq: 587, endFreq: 440, duration: .105, gain: .095, type: "triangle", attack: .004 },
    { at: .17, freq: 392, endFreq: 294, duration: .15, gain: .082, type: "sawtooth", attack: .006 },
    { at: .32, freq: 262, endFreq: 220, duration: .18, gain: .06, type: "triangle", attack: .008 },
    { at: .5, freq: 196, duration: .14, gain: .042, type: "sine", attack: .012 }
  ], { quietFor: .78 });
}

function playTimeUpSound() {
  playToneSequence([
    { at: 0, freq: 880, duration: .075, gain: .092, type: "square", attack: .003 },
    { at: .13, freq: 880, duration: .075, gain: .092, type: "square", attack: .003 },
    { at: .27, freq: 659, endFreq: 494, duration: .16, gain: .078, type: "triangle", attack: .006 },
    { at: .43, freq: 392, endFreq: 294, duration: .2, gain: .066, type: "sawtooth", attack: .008 },
    { at: .64, freq: 247, duration: .18, gain: .044, type: "sine", attack: .012 }
  ], { quietFor: .96 });
}

function playClearSound() {
  playToneSequence([
    { at: 0, freq: 196, duration: .18, gain: .052, type: "triangle", attack: .006 },
    { at: 0, freq: 784, duration: .16, gain: .058, type: "square", attack: .004 },
    { at: 0, freq: 988, duration: .16, gain: .046, type: "triangle", attack: .004 },
    { at: 0, freq: 1175, duration: .16, gain: .04, type: "triangle", attack: .004 },

    { at: .18, freq: 262, duration: .2, gain: .052, type: "triangle", attack: .006 },
    { at: .18, freq: 1047, duration: .18, gain: .06, type: "square", attack: .004 },
    { at: .18, freq: 1319, duration: .18, gain: .048, type: "triangle", attack: .004 },
    { at: .18, freq: 1568, duration: .18, gain: .042, type: "triangle", attack: .004 },

    { at: .43, freq: 392, duration: .12, gain: .04, type: "triangle", attack: .004 },
    { at: .51, freq: 523, duration: .12, gain: .044, type: "triangle", attack: .004 },
    { at: .59, freq: 659, duration: .12, gain: .048, type: "triangle", attack: .004 },
    { at: .67, freq: 784, duration: .12, gain: .052, type: "triangle", attack: .004 },

    { at: .82, freq: 262, duration: .6, gain: .058, type: "triangle", attack: .012 },
    { at: .82, freq: 1047, duration: .55, gain: .07, type: "square", attack: .006 },
    { at: .82, freq: 1319, duration: .55, gain: .054, type: "triangle", attack: .006 },
    { at: .82, freq: 1568, duration: .55, gain: .048, type: "sine", attack: .006 },
    { at: 1.04, freq: 2093, duration: .38, gain: .034, type: "sine", attack: .01 }
  ], { quietFor: 1.62 });
}

function playUrgentBeat(remaining) {
  if (remaining > 3 || remaining <= .18) return;
  const beatRate = remaining <= 1.25 ? 4 : 2;
  const beat = `${beatRate}:${Math.ceil(remaining * beatRate)}`;
  if (beat === state.urgentBeat) return;
  state.urgentBeat = beat;
  const context = getAudioContext();
  if (!context) return;
  if (context.currentTime < audioState.quietUntil) return;
  const now = context.currentTime;
  const pressure = (3 - remaining) / 3;
  const freq = 240 + pressure * 180;
  const volume = .018 + pressure * .022;
  playTone(freq, now, .045, { type: "square", volume, slideTo: freq * .72, attack: .004 });
  if (remaining <= 1.25) {
    playTone(freq * 1.48, now + .055, .032, { type: "triangle", volume: volume * .68, attack: .004 });
  }
}

function renderResult() {
  stopActiveRun();
  const end = state.lastEnd;
  const p = end.problem;
  if (end.reason === "clear") {
    renderClearResult();
    return;
  }
  const correct = formatCorrectAnswer(p);
  const user = end.userAnswer
    ? String(end.userAnswer.answer || 0)
    : "時間切れ";
  const resultCopy = getResultCopy(end.reason, state.answered);
  const resultClass = end.reason === "time" ? "result-timeout" : "result-stop";

  app.innerHTML = `
    <section class="screen result-shell">
      <div class="result-card ${resultClass}">
        <div class="timeout-burst" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div class="result-hero">
          <div class="brand">${resultCopy.badge}</div>
          <h2>${resultCopy.title}</h2>
          <p class="result-lead">${resultCopy.lead}</p>
        </div>
        <div class="result-score-grid">
          <div class="result-score-card primary-score">
            <span>今回の記録</span>
            <strong>${state.answered}<small>日</small></strong>
          </div>
          <div class="result-score-card">
            <span>最高記録</span>
            <strong>${state.best}<small>日</small></strong>
          </div>
        </div>
        <div class="result-review">
          <div>
            <span>止まった問題</span>
            <strong>${p.left} + ${p.right}</strong>
          </div>
          <div>
            <span>あなたの答え</span>
            <strong>${user}</strong>
          </div>
          <div class="result-correct">
            <span>正解</span>
            <strong>${correct}</strong>
          </div>
          <p>${explainProblem(p)}</p>
        </div>
        ${resultCopy.tip ? `<p class="result-tip">${resultCopy.tip}</p>` : ""}
        <div class="actions">
          <button class="primary" type="button" data-action="start">もう一回</button>
          <button class="ghost" type="button" data-action="home">最初の画面へ</button>
        </div>
      </div>
    </section>
  `;
}

function getResultCopy(reason, answered) {
  if (reason === "time") {
    return {
      badge: "時間切れ",
      title: "時間切れ",
      lead: "止まった問題を確認しよう。",
      tip: ""
    };
  }

  return {
    badge: "STOP",
    title: "ここで終了",
    lead: "止まった問題を確認しよう。",
    tip: ""
  };
}

function renderClearResult() {
  app.innerHTML = `
    <section class="screen clear-shell">
      <div class="clear-screen">
        <div class="clear-content">
          <div class="brand">100日到達</div>
          <h2>100日達成</h2>
          <p>足し算サバイバルを100日生き残った</p>
          <div class="clear-stats">
            <span>今回の記録</span>
            <strong>${CLEAR_COUNT}日</strong>
          </div>
        </div>
        <div class="clear-actions">
          <button class="primary clear-primary" type="button" data-action="start">もう一回</button>
          <button class="ghost clear-ghost" type="button" data-action="home">最初の画面へ</button>
        </div>
      </div>
    </section>
  `;
}

function explainProblem(p) {
  return `${p.left} + ${p.right} = ${p.answer}。答えは ${p.answer}。`;
}

function showHowTo() {
  stopActiveRun();
  app.innerHTML = `
    <section class="screen howto-screen">
      <div class="result-card howto-card">
        <div class="brand">使い方</div>
        <h2>10秒で答えを送る</h2>
        <div class="review howto-panel">
          <strong>操作のしかた</strong>
          <span>「スタート」を押すと、すぐに第1日目が始まる。</span>
          <span>答えは、画面のテンキーを押して入れられる。</span>
          <span>キーボードで数字を入れて、Enterキーで送ることもできる。</span>
          <span>10秒以内に答えを送る。正解するとすぐ次の問題へ進む。</span>
          <span>まちがえた時は、問題・あなたの答え・正解を見てからホームへ戻る。</span>
          <span>最高記録は、このブラウザだけに残る。</span>
        </div>
        <div class="actions">
          <button class="primary" type="button" data-action="start">スタート</button>
          <button class="ghost" type="button" data-action="home">もどる</button>
        </div>
      </div>
    </section>
  `;
}

function stopActiveRun() {
  cancelAnimationFrame(state.rafId);
  clearTimeout(state.nextTimerId);
  state.running = false;
  state.urgentBeat = -1;
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.keypad) {
    useKeypad(button.dataset.keypad);
    return;
  }
  const action = button.dataset.action;
  if (action === "start") startPractice();
  if (action === "home") renderHome();
  if (action === "howto") showHowTo();
});

app.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-action='answer']")) return;
  event.preventDefault();
  submitAnswer(event.target);
});

app.addEventListener("input", (event) => {
  if (!event.target.matches("input")) return;
  event.target.value = sanitizeInputValue(event.target.value, event.target.maxLength);
  if (state.running && event.target.matches(".answer-form input")) {
    playInputSound(event.inputType === "deleteContentBackward" ? "erase" : "digit");
  }
});

app.addEventListener("focusin", (event) => {
  if (!event.target.matches(".answer-form input")) return;
  state.activeAnswerInputId = event.target.id;
});

document.addEventListener("keydown", (event) => {
  if (!state.running) return;
  if (handleAnswerKeyboard(event)) return;
});

renderHome();

function useKeypad(key) {
  const input = getActiveAnswerInput();
  if (!input || !state.running) return;
  const before = input.value;
  if (key === "clear") {
    input.value = "";
  } else if (key === "backspace") {
    input.value = input.value.slice(0, -1);
  } else if (input.value.length < Number(input.maxLength || 4)) {
    input.value += key;
  }
  if (input.value !== before) playInputSound(key === "clear" || key === "backspace" ? "erase" : "digit");
  if (canFocusAnswerInput()) {
    input.focus({ preventScroll: true });
  }
}

function handleAnswerKeyboard(event) {
  const key = event.key;
  const digit = normalizeDigit(key);
  const isDigit = digit !== "";
  const isBackspace = key === "Backspace";
  const isDelete = key === "Delete";
  const isEnter = key === "Enter";

  if (isDigit) {
    event.preventDefault();
    useKeypad(digit);
    return true;
  }

  if (isBackspace || isDelete) {
    event.preventDefault();
    useKeypad(isBackspace ? "backspace" : "clear");
    return true;
  }

  if (!isEnter) return false;

  const form = app.querySelector(".answer-form");
  if (!form) return false;

  if (isEnter) {
    event.preventDefault();
    submitAnswer(form);
    return true;
  }

  return false;
}

function sanitizeInputValue(value, maxLength) {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  const limit = Number(maxLength);
  if (!Number.isFinite(limit) || limit <= 0) return digits;
  return digits.slice(0, limit);
}

function normalizeDigits(value) {
  return String(value || "").replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function normalizeDigit(value) {
  const normalized = normalizeDigits(value);
  return /^[0-9]$/.test(normalized) ? normalized : "";
}

function canFocusAnswerInput() {
  return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

function getActiveAnswerInput() {
  const active = document.activeElement;
  if (active?.matches?.(".answer-form input")) return active;
  if (state.activeAnswerInputId) {
    const saved = document.getElementById(state.activeAnswerInputId);
    if (saved?.matches?.(".answer-form input")) return saved;
  }
  return document.getElementById("answer");
}

