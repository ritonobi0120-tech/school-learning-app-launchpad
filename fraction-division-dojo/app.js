(function () {
  "use strict";

  const STORAGE_KEY = "fractionDivisionDojo.v1";
  const SESSION_LENGTH = 10;
  const MAX_RANK_STEP = 5;
  const WATER_GOAL = 100;

  const RANKS = [
    { level: "レベル1", name: "芽吹きの庭", color: "#80d861", skill: "分数 ÷ 整数", lesson: "分ける意味をつかむ" },
    { level: "レベル2", name: "水路の庭", color: "#32b7cf", skill: "分数 ÷ 整数", lesson: "約分までていねいに" },
    { level: "レベル3", name: "雲橋の庭", color: "#67a4ff", skill: "整数 ÷ 分数", lesson: "いくつ分あるか" },
    { level: "レベル4", name: "花めぐりの庭", color: "#f58bc1", skill: "分数 ÷ 分数", lesson: "逆数をかける" },
    { level: "レベル5", name: "結晶の庭", color: "#a885ff", skill: "帯分数・仮分数", lesson: "形を直して考える" },
    { level: "レベル6", name: "天空大庭園", color: "#f5b733", skill: "文章題 総合", lesson: "場面から式を作る" },
  ];

  const WATER_STAGES = [
    {
      key: "dry",
      badge: "",
      resultLabel: "はじまりの庭",
      title: "20しずくで景色が変わる",
      nextAt: 20,
    },
    {
      key: "returning",
      badge: "",
      resultLabel: "水が戻った庭",
      title: "60しずくで景色が変わる",
      nextAt: 60,
    },
    {
      key: "restored",
      badge: "",
      resultLabel: "緑が広がった庭",
      title: "100しずくで庭園完成",
      nextAt: 100,
    },
    {
      key: "splash",
      badge: "",
      resultLabel: "天空庭園完成",
      title: "天空大庭園が完成!",
      nextAt: 100,
    },
  ];

  const els = {
    homeView: document.getElementById("homeView"),
    practiceView: document.getElementById("practiceView"),
    reviewView: document.getElementById("reviewView"),
    resultView: document.getElementById("resultView"),
    rankRail: document.getElementById("rankRail"),
    resultRail: document.getElementById("resultRail"),
    startButton: document.getElementById("startButton"),
    reviewButton: document.getElementById("reviewButton"),
    settingsButton: document.getElementById("settingsButton"),
    sceneryButton: document.getElementById("sceneryButton"),
    homeProgressCount: document.getElementById("homeProgressCount"),
    homeProgressBar: document.getElementById("homeProgressBar"),
    homeMissionTitle: document.getElementById("homeMissionTitle"),
    homeStamp: document.getElementById("homeStamp"),
    homeCorrect: document.getElementById("homeCorrect"),
    homeMistakes: document.getElementById("homeMistakes"),
    homeAverage: document.getElementById("homeAverage"),
    backHomeButton: document.getElementById("backHomeButton"),
    menuButton: document.getElementById("menuButton"),
    sessionBelt: document.getElementById("sessionBelt"),
    sessionRankName: document.getElementById("sessionRankName"),
    questionNumberLabel: document.getElementById("questionNumberLabel"),
    questionNumber: document.getElementById("questionNumber"),
    questionProgress: document.getElementById("questionProgress"),
    focusBlocks: document.getElementById("focusBlocks"),
    lessonChip: document.getElementById("lessonChip"),
    problemCard: document.getElementById("problemCard"),
    problemLine: document.getElementById("problemLine"),
    answerPanel: document.getElementById("answerPanel"),
    fractionAnswer: document.getElementById("fractionAnswer"),
    answerFeedback: document.getElementById("answerFeedback"),
    numeratorBox: document.getElementById("numeratorBox"),
    denominatorBox: document.getElementById("denominatorBox"),
    swapFocusButton: document.getElementById("swapFocusButton"),
    wholeNumberButton: document.getElementById("wholeNumberButton"),
    keypad: document.getElementById("keypad"),
    hintPanel: document.getElementById("hintPanel"),
    hintButton: document.getElementById("hintButton"),
    hintBody: document.getElementById("hintBody"),
    visualHint: document.getElementById("visualHint"),
    reviewPlayerName: document.getElementById("reviewPlayerName"),
    reviewRankLabel: document.getElementById("reviewRankLabel"),
    reviewMenuButton: document.getElementById("reviewMenuButton"),
    reviewBackButton: document.getElementById("reviewBackButton"),
    reviewTitle: document.getElementById("reviewTitle"),
    reviewIntro: document.getElementById("reviewIntro"),
    reviewHintButton: document.getElementById("reviewHintButton"),
    reviewProblem: document.getElementById("reviewProblem"),
    studentAnswer: document.getElementById("studentAnswer"),
    correctAnswer: document.getElementById("correctAnswer"),
    workedQuestion: document.getElementById("workedQuestion"),
    workedSteps: document.getElementById("workedSteps"),
    reviewListButton: document.getElementById("reviewListButton"),
    retryButton: document.getElementById("retryButton"),
    reviewNextButton: document.getElementById("reviewNextButton"),
    resultHeadline: document.getElementById("resultHeadline"),
    rankRibbon: document.getElementById("rankRibbon"),
    previousBelt: document.getElementById("previousBelt"),
    currentBelt: document.getElementById("currentBelt"),
    previousRank: document.getElementById("previousRank"),
    currentRank: document.getElementById("currentRank"),
    resultMessage: document.getElementById("resultMessage"),
    resultCorrect: document.getElementById("resultCorrect"),
    resultMistake: document.getElementById("resultMistake"),
    resultSummaryTitle: document.getElementById("resultSummaryTitle"),
    resultProgressCount: document.getElementById("resultProgressCount"),
    resultProgressBar: document.getElementById("resultProgressBar"),
    resultProgressDots: document.getElementById("resultProgressDots"),
    nextSkill: document.getElementById("nextSkill"),
    coinTotal: document.getElementById("coinTotal"),
    nextTrainingButton: document.getElementById("nextTrainingButton"),
    resultReviewButton: document.getElementById("resultReviewButton"),
    resultHomeButton: document.getElementById("resultHomeButton"),
    modal: document.getElementById("modal"),
    modalTitle: document.getElementById("modalTitle"),
    modalBody: document.getElementById("modalBody"),
    modalCloseButton: document.getElementById("modalCloseButton"),
    toast: document.getElementById("toast"),
  };

  function fraction(n, d) {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return { n: 0, d: 1 };
    const sign = d < 0 ? -1 : 1;
    const g = gcd(Math.abs(n), Math.abs(d));
    return { n: sign * n / g, d: Math.abs(d) / g };
  }

  function gcd(a, b) {
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function add(a, b) {
    return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function multiply(a, b) {
    return fraction(a.n * b.n, a.d * b.d);
  }

  function divide(a, b) {
    return fraction(a.n * b.d, a.d * b.n);
  }

  function formatFraction(value) {
    if (!value) return "";
    if (value.d === 1) return String(value.n);
    return `${value.n}/${value.d}`;
  }

  function fractionHtml(value) {
    if (typeof value === "number") return `<span>${value}</span>`;
    if (value.d === 1) return `<span class="whole-number">${value.n}</span>`;
    return `<span class="frac"><span>${value.n}</span><span class="rule"></span><span>${value.d}</span></span>`;
  }

  function problemHtml(q) {
    if (q.word) return `<span class="word-problem">${q.word}</span>`;
    return `${fractionHtml(q.left)}<span class="op">÷</span>${fractionHtml(q.right)}`;
  }

  function rand(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pick(list, serial) {
    return list[Math.abs(serial) % list.length];
  }

  function stageForQuestion(questionIndex) {
    if (questionIndex >= 8) return 3;
    if (questionIndex >= 5) return 2;
    if (questionIndex >= 3) return 1;
    return 0;
  }

  function makeQuestion(rankIndex, serial, questionIndex = serial % SESSION_LENGTH) {
    if (rankIndex === 0) return makeFractionDivInteger(false, serial, questionIndex);
    if (rankIndex === 1) return makeFractionDivInteger(true, serial, questionIndex);
    if (rankIndex === 2) return makeIntegerDivFraction(serial, questionIndex);
    if (rankIndex === 3) return makeFractionDivFraction(serial, questionIndex);
    if (rankIndex === 4) return makeMixedQuestion(serial, questionIndex);
    return makeWordQuestion(serial, questionIndex);
  }

  function makeFractionDivInteger(reduce, serial, questionIndex = 0) {
    let left;
    let right;
    if (reduce) {
      const staged = [
        [[4, 5, 2], [6, 7, 3], [8, 9, 4], [10, 11, 5]],
        [[12, 13, 4], [14, 15, 7], [15, 16, 5], [18, 19, 6]],
        [[20, 21, 5], [21, 22, 7], [24, 25, 8], [27, 28, 9]],
        [[32, 35, 8], [36, 37, 9], [40, 41, 10], [48, 49, 12]],
      ];
      const [n, d, k] = pick(staged[stageForQuestion(questionIndex)], serial);
      left = fraction(n, d);
      right = fraction(k, 1);
    } else {
      const d = rand([2, 3, 4, 5, 6, 8]);
      const n = rand([...Array(d - 1)].map((_, i) => i + 1));
      const k = rand([2, 3, 4]);
      left = fraction(n, d);
      right = fraction(k, 1);
    }
    const answer = divide(left, right);
    return enrich({
      id: `fdi-${reduce ? "r" : "b"}-${serial}-${left.n}-${left.d}-${right.n}`,
      type: reduce ? "分数÷整数 約分" : "分数÷整数",
      left,
      right,
      answer,
      lesson: reduce ? "約分までていねいに" : "計算をしましょう",
      prompt: `${formatFraction(left)} を ${right.n} 等分します。`,
      core: `分数を整数でわると、分母に ${right.n} をかけます。`,
      steps: [
        `まず ${formatFraction(left)} ÷ ${right.n} と見る`,
        `分母に ${right.n} をかけて ${left.n}/${left.d * right.n}`,
        `約分して ${formatFraction(answer)}`,
      ],
    });
  }

  function makeIntegerDivFraction(serial, questionIndex = 0) {
    const staged = [
      [[2, 1, 2], [3, 1, 3], [4, 1, 2], [5, 2, 5], [6, 3, 4]],
      [[6, 2, 3], [8, 4, 5], [9, 3, 5], [10, 2, 5], [12, 3, 7]],
      [[12, 4, 5], [15, 5, 7], [16, 8, 9], [18, 6, 7], [20, 4, 9]],
      [[24, 8, 11], [28, 7, 9], [30, 6, 11], [36, 9, 10], [42, 7, 13]],
    ];
    const [whole, rn, rd] = pick(staged[stageForQuestion(questionIndex)], serial);
    const right = fraction(rn, rd);
    const answer = divide(fraction(whole, 1), right);
    return enrich({
      id: `idf-${serial}-${whole}-${right.n}-${right.d}`,
      type: "整数÷分数",
      left: fraction(whole, 1),
      right,
      answer,
      lesson: "いくつ分あるかを考えよう",
      prompt: `${whole} の中に ${formatFraction(right)} はいくつありますか。`,
      core: "わり算は「同じ大きさがいくつ分あるか」と考えることができます。",
      steps: [
        `${whole} を ${formatFraction(right)} の大きさにそろえる`,
        `${formatFraction(right)} を1つずつ数える`,
        `${whole} ÷ ${formatFraction(right)} = ${formatFraction(answer)}`,
      ],
    });
  }

  function makeFractionDivFraction(serial, questionIndex = 0) {
    const staged = [
      [[2, 3, 1, 2], [3, 4, 2, 3], [4, 5, 3, 5], [5, 6, 5, 6], [5, 8, 1, 2]],
      [[9, 10, 3, 4], [8, 15, 4, 5], [12, 25, 3, 5], [14, 27, 7, 9], [16, 21, 4, 7]],
      [[24, 35, 6, 7], [21, 22, 7, 6], [28, 45, 7, 9], [30, 49, 6, 7], [32, 55, 8, 11]],
      [[36, 55, 9, 11], [40, 63, 8, 9], [45, 77, 9, 11], [48, 65, 12, 13], [56, 81, 7, 9]],
    ];
    const [ln, ld, rn, rd] = pick(staged[stageForQuestion(questionIndex)], serial);
    const left = fraction(ln, ld);
    const right = fraction(rn, rd);
    const answer = divide(left, right);
    return enrich({
      id: `fdf-${serial}-${left.n}-${left.d}-${right.n}-${right.d}`,
      type: "分数÷分数",
      left,
      right,
      answer,
      lesson: "逆数をかけよう",
      prompt: `${formatFraction(left)} の中に ${formatFraction(right)} はいくつ分ありますか。`,
      core: `わる数 ${formatFraction(right)} を逆数 ${right.d}/${right.n} にしてかけます。`,
      steps: [
        `${formatFraction(right)} の逆数は ${right.d}/${right.n}`,
        `${formatFraction(left)} × ${right.d}/${right.n} を計算`,
        `約分して ${formatFraction(answer)}`,
      ],
    });
  }

  function makeMixedQuestion(serial, questionIndex = 0) {
    const staged = [
      [[1, 1, 2, 1, 2], [1, 1, 3, 2, 3], [2, 1, 3, 3, 4], [2, 3, 4, 4, 5]],
      [[2, 1, 3, 7, 9], [2, 1, 2, 5, 6], [3, 1, 4, 13, 16], [1, 2, 3, 5, 9]],
      [[3, 3, 5, 6, 25], [2, 5, 7, 19, 21], [3, 1, 2, 7, 15], [4, 2, 3, 14, 27]],
      [[4, 4, 5, 12, 25], [5, 3, 7, 19, 28], [3, 5, 8, 29, 32], [4, 5, 6, 29, 36]],
    ];
    const [whole, pn, pd, rn, rd] = pick(staged[stageForQuestion(questionIndex)], serial);
    const part = fraction(pn, pd);
    const left = add(fraction(whole, 1), part);
    const right = fraction(rn, rd);
    const answer = divide(left, right);
    return enrich({
      id: `mix-${serial}-${left.n}-${left.d}-${right.n}-${right.d}`,
      type: "帯分数",
      left,
      right,
      answer,
      lesson: "帯分数を仮分数に直そう",
      prompt: `${whole}と${formatFraction(part)} を仮分数に直してから計算します。`,
      core: `帯分数は ${formatFraction(left)} に直せます。`,
      steps: [
        `${whole}と${formatFraction(part)} = ${formatFraction(left)}`,
        `${formatFraction(left)} ÷ ${formatFraction(right)} は逆数をかける`,
        `答えは ${formatFraction(answer)}`,
      ],
    });
  }

  function makeWordQuestion(serial, questionIndex = 0) {
    const stagedProblems = [
      [
      {
        word: "3/4Lの水を、1/8Lずつコップに入れます。何杯分できますか。",
        left: fraction(3, 4),
        right: fraction(1, 8),
        unit: "杯分",
        prompt: "全体量の中に、1杯分がいくつ入るかを考えます。",
        focus: "何個分",
      },
      {
        word: "2/3mのリボンを、1/6mずつ切ります。何本分できますか。",
        left: fraction(2, 3),
        right: fraction(1, 6),
        unit: "本分",
        prompt: "同じ長さがいくつ分あるかを求めます。",
        focus: "何個分",
      },
      {
        word: "4mのテープを、2/3mずつ使います。何本分ありますか。",
        left: fraction(4, 1),
        right: fraction(2, 3),
        unit: "本分",
        prompt: "整数の中に分数がいくつ入るかを求めます。",
        focus: "整数÷分数",
      },
      ],
      [
      {
        word: "2と1/2kgの粉を、3/4kgずつ使います。何回分使えますか。",
        left: fraction(5, 2),
        right: fraction(3, 4),
        unit: "回分",
        prompt: "帯分数を仮分数に直してから、何回分かを考えます。",
        focus: "帯分数",
      },
      {
        word: "4mのテープを、2/3mずつ使います。何本分ありますか。",
        left: fraction(4, 1),
        right: fraction(2, 3),
        unit: "本分",
        prompt: "整数の中に分数がいくつ入るかを求めます。",
        focus: "整数÷分数",
      },
      {
        word: "5/6Lの絵の具を、1/4Lずつ小びんに分けます。何びん分できますか。",
        left: fraction(5, 6),
        right: fraction(1, 4),
        unit: "びん分",
        prompt: "全体量 ÷ 1びん分 で考えます。",
        focus: "何個分",
      },
      {
        word: "3mのひもを、2/5mずつ使って飾りを作ります。何こ分作れますか。",
        left: fraction(3, 1),
        right: fraction(2, 5),
        unit: "こ分",
        prompt: "3mの中に2/5mがいくつ分あるかを考えます。",
        focus: "整数÷分数",
      },
      ],
      [
      {
        word: "1と1/2dLのシロップを、3/10dLずつ使います。何杯分できますか。",
        left: fraction(3, 2),
        right: fraction(3, 10),
        unit: "杯分",
        prompt: "1と1/2を仮分数に直してから、同じ量で分けます。",
        focus: "帯分数",
      },
      {
        word: "3と3/4mのロープを、5/8mずつ切ります。何本分できますか。",
        left: fraction(15, 4),
        right: fraction(5, 8),
        unit: "本分",
        prompt: "帯分数を仮分数に直し、1本分がいくつ入るかを求めます。",
        focus: "帯分数",
      },
      {
        word: "花だんの2/3に水をまいたら、4/5L使いました。花だん全体では何L使いますか。",
        left: fraction(4, 5),
        right: fraction(2, 3),
        unit: "L",
        prompt: "部分の量 ÷ 部分の割合 で、全体の量を求めます。",
        focus: "全体量",
      },
      {
        word: "リボン全体の3/4が2/5mです。リボン全体の長さは何mですか。",
        left: fraction(2, 5),
        right: fraction(3, 4),
        unit: "m",
        prompt: "3/4にあたる量から、全体を求めます。",
        focus: "全体量",
      },
      {
        word: "1/2時間で3/5km歩きます。同じ速さで1時間歩くと何km進みますか。",
        left: fraction(3, 5),
        right: fraction(1, 2),
        unit: "km",
        prompt: "半分の時間で進む道のりから、1時間あたりを求めます。",
        focus: "単位量",
      },
      ],
      [
      {
        word: "18/25Lの薬品を、6/35Lずつ分けます。何本分できますか。",
        left: fraction(18, 25),
        right: fraction(6, 35),
        unit: "本分",
        prompt: "大きな数を長い線でまとめて、2か所を約分します。",
        focus: "何個分",
      },
      {
        word: "24/35mのリボンを、8/21mずつ切ります。何本分できますか。",
        left: fraction(24, 35),
        right: fraction(8, 21),
        unit: "本分",
        prompt: "上下の数字をよく見て、何で割れるか探します。",
        focus: "何個分",
      },
      {
        word: "36/55kgの材料を、9/22kgずつ使います。何回分使えますか。",
        left: fraction(36, 55),
        right: fraction(9, 22),
        unit: "回分",
        prompt: "長い線の上と下で、同時に約分できるところを見つけます。",
        focus: "何個分",
      },
      ],
    ];
    const base = pick(stagedProblems[stageForQuestion(questionIndex)], serial);
    const answer = divide(base.left, base.right);
    return enrich({
      id: `word-${serial}-${base.left.n}-${base.left.d}-${base.right.n}-${base.right.d}`,
      type: `文章題 ${base.focus}`,
      word: base.word,
      left: base.left,
      right: base.right,
      answer,
      unit: base.unit,
      lesson: "場面から式を作ろう",
      prompt: base.prompt,
      core: `${formatFraction(base.left)} ÷ ${formatFraction(base.right)} を計算します。`,
      steps: [
        `求めたいものは「${base.unit}」です`,
        `${formatFraction(base.left)} ÷ ${formatFraction(base.right)} の式にする`,
        `答えは ${formatFraction(answer)}${base.unit}`,
      ],
    });
  }

  function enrich(q) {
    q.hintParts = Math.min(12, Math.max(q.left.d || 1, q.right.d || 1));
    q.hintFill = Math.max(1, Math.min(q.hintParts, Math.round(q.hintParts * q.left.n / q.left.d)));
    return q;
  }

  function defaultProgress() {
    return {
      rankStep: 0,
      playerName: "",
      coins: 0,
      sessions: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      totalSeconds: 0,
      todayAnswered: 0,
      todayCorrect: 0,
      todayMistakes: 0,
      streak: 1,
      mistakes: [],
      pendingRetry: null,
      activeSession: null,
      sound: false,
      lastDay: new Date().toDateString(),
    };
  }

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return normalizeProgress({ ...defaultProgress(), ...(parsed || {}) });
    } catch {
      return defaultProgress();
    }
  }

  function normalizeProgress(value) {
    const today = new Date().toDateString();
    if (value.lastDay && value.lastDay !== today) {
      value.todayAnswered = 0;
      value.todayCorrect = 0;
      value.todayMistakes = 0;
      value.lastDay = today;
      value.streak = Math.max(1, Number(value.streak || 1) + 1);
    }
    if (!value.lastDay) value.lastDay = today;
    if (!Array.isArray(value.mistakes)) value.mistakes = [];
    value.pendingRetry = normalizePendingRetry(value.pendingRetry);
    value.activeSession = normalizeActiveSession(value.activeSession);
    value.rankStep = Math.max(0, Math.min(MAX_RANK_STEP, Number(value.rankStep || 0)));
    return value;
  }

  function normalizeActiveSession(value) {
    if (!value || value.mode !== "practice" || !Array.isArray(value.questions)) return null;
    const questions = value.questions.filter((q) => q?.answer && q?.left && q?.right);
    const index = Math.max(0, Number(value.index || 0));
    if (!questions.length || index >= questions.length) return null;
    const retryQueue = Array.isArray(value.retryQueue)
      ? value.retryQueue
        .filter((item) => item?.question?.answer)
        .map((item) => ({
          question: item.question,
          studentAnswer: item.studentAnswer || { n: 0, d: 1 },
        }))
      : [];
    return {
      mode: "practice",
      rankIndex: Math.max(0, Math.min(RANKS.length - 1, Number(value.rankIndex || 0))),
      questions,
      index,
      correct: Math.max(0, Math.min(questions.length, Number(value.correct || 0))),
      mistakes: Math.max(0, Number(value.mistakes || 0)),
      startTime: Number(value.startTime || Date.now()),
      pausedForReview: false,
      hintMode: false,
      lastStudentAnswer: null,
      retryQueue,
      forcedRetry: false,
      previousRankStep: Math.max(0, Math.min(MAX_RANK_STEP, Number(value.previousRankStep || 0))),
      previousCorrect: Math.max(0, Number(value.previousCorrect || 0)),
    };
  }

  function normalizePendingRetry(value) {
    if (!value || !Array.isArray(value.items) || value.items.length === 0) return null;
    const items = value.items
      .filter((item) => item?.question?.answer)
      .map((item) => ({
        question: item.question,
        studentAnswer: item.studentAnswer || { n: 0, d: 1 },
      }));
    if (!items.length) return null;
    return {
      rankIndex: Math.max(0, Math.min(RANKS.length - 1, Number(value.rankIndex || 0))),
      items,
      correct: Math.max(0, Number(value.correct || 0)),
      mistakes: Math.max(items.length, Number(value.mistakes || items.length)),
      previousRankStep: Math.max(0, Math.min(MAX_RANK_STEP, Number(value.previousRankStep || 0))),
      previousCorrect: Math.max(0, Number(value.previousCorrect || 0)),
      createdAt: Number(value.createdAt || Date.now()),
    };
  }

  function saveProgress() {
    progress = normalizeProgress(progress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function hasPendingRetry() {
    return Boolean(progress.pendingRetry && progress.pendingRetry.items?.length);
  }

  function encodeProgress() {
    const pending = compactPendingRetry(progress.pendingRetry);
    if (!pending) {
      const nums = [
        progress.rankStep || 0,
        progress.totalCorrect || 0,
        progress.totalAnswered || 0,
        progress.sessions || 0,
        progress.coins || 0,
        progress.sound !== false ? 1 : 0,
      ].map((value) => Math.max(0, Number(value || 0)).toString(36));
      return `FS3-${nums.join(".")}.${toBase64Url(progress.playerName || "")}`;
    }
    const payload = {
      n: progress.playerName || "",
      r: progress.rankStep || 0,
      tc: progress.totalCorrect || 0,
      ta: progress.totalAnswered || 0,
      ss: progress.sessions || 0,
      co: progress.coins || 0,
      so: progress.sound !== false,
      pr: pending,
    };
    return `FS4-${toBase64Url(JSON.stringify(payload))}`;
  }

  function decodeProgress(code) {
    const trimmed = code.trim();
    if (trimmed.startsWith("FS4-")) return expandCompactProgress(JSON.parse(fromBase64Url(trimmed.slice(4))));
    if (trimmed.startsWith("FS3-")) return expandShortProgress(trimmed.slice(4));
    if (trimmed.startsWith("FS2-")) return expandCompactProgress(JSON.parse(fromBase64Url(trimmed.slice(4))));
    return normalizeProgress(JSON.parse(decodeURIComponent(escape(atob(trimmed)))));
  }

  function toBase64Url(text) {
    return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fromBase64Url(text) {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
    return decodeURIComponent(escape(atob(padded)));
  }

  function compactFraction(value) {
    return [value?.n || 0, value?.d || 1];
  }

  function compactQuestion(q) {
    return [compactFraction(q.left), compactFraction(q.right), compactFraction(q.answer), q.word || ""];
  }

  function compactMistake(item) {
    return [compactQuestion(item.question), compactFraction(item.studentAnswer)];
  }

  function compactPendingRetry(value) {
    const pending = normalizePendingRetry(value);
    if (!pending) return null;
    return {
      r: pending.rankIndex,
      c: pending.correct,
      m: pending.mistakes,
      ps: pending.previousRankStep,
      pc: pending.previousCorrect,
      t: pending.createdAt,
      i: pending.items.map(compactMistake),
    };
  }

  function restoreCompactQuestion(item, index = 0) {
    const [left, right, answer, word] = item || [];
    const restored = enrich({
      id: `backup-${index}-${left?.join("-")}-${right?.join("-")}`,
      type: word ? "文章題" : "バックアップした問題",
      left: fraction(left?.[0] || 0, left?.[1] || 1),
      right: fraction(right?.[0] || 1, right?.[1] || 1),
      answer: fraction(answer?.[0] || 0, answer?.[1] || 1),
      word: word || "",
      lesson: "考え方を確認",
      prompt: word || "もう一度、分数のわり算を確認しよう。",
      core: "わる数を逆数にして、かけ算に直します。",
      steps: ["わる数を逆数にする", "長い線でまとめて約分する", "答えの形にする"],
    });
    return restored;
  }

  function expandCompactMistake(item, index) {
    return {
      question: restoreCompactQuestion(item?.[0], index),
      studentAnswer: fraction(item?.[1]?.[0] || 0, item?.[1]?.[1] || 1),
      at: Date.now(),
    };
  }

  function expandCompactProgress(data) {
    const next = normalizeProgress({
      playerName: data.n || "",
      rankStep: data.r || 0,
      totalCorrect: data.tc || 0,
      totalAnswered: data.ta || 0,
      sessions: data.ss || 0,
      coins: data.co || 0,
      sound: data.so !== false,
      mistakes: (data.m || []).map(expandCompactMistake),
      pendingRetry: data.pr ? {
        rankIndex: data.pr.r || 0,
        correct: data.pr.c || 0,
        mistakes: data.pr.m || 0,
        previousRankStep: data.pr.ps || 0,
        previousCorrect: data.pr.pc || 0,
        createdAt: data.pr.t || Date.now(),
        items: (data.pr.i || []).map(expandCompactMistake),
      } : null,
    });
    next.activeSession = null;
    return next;
  }

  function expandShortProgress(text) {
    const parts = text.split(".");
    const read = (index) => parseInt(parts[index] || "0", 36) || 0;
    return normalizeProgress({
      playerName: fromBase64Url(parts.slice(6).join(".") || ""),
      rankStep: read(0),
      totalCorrect: read(1),
      totalAnswered: read(2),
      sessions: read(3),
      coins: read(4),
      sound: read(5) !== 0,
      mistakes: [],
      pendingRetry: null,
      activeSession: null,
    });
  }

  function playerName() {
    return (progress.playerName || "").trim();
  }

  function requirePlayerName() {
    return true;
  }

  function currentRankIndex() {
    return Math.min(RANKS.length - 1, progress.rankStep);
  }

  function rankIndexForStep(step) {
    return Math.min(RANKS.length - 1, step);
  }

  function gardenStepLabel(step) {
    return RANKS[rankIndexForStep(step)].level;
  }

  function gardenState() {
    return gardenStateForDrops(progress.totalCorrect);
  }

  function gardenResultLabel(garden) {
    return garden.resultLabel || garden.title || "天空庭園";
  }

  function gardenStateForDrops(totalCorrect) {
    const fixedDrops = Math.max(0, Number(totalCorrect || 0));
    const stage = fixedDrops >= 100 ? WATER_STAGES[3] : fixedDrops >= 60 ? WATER_STAGES[2] : fixedDrops >= 20 ? WATER_STAGES[1] : WATER_STAGES[0];
    const stageStart = stage.key === "splash" ? 0 : stage.key === "restored" ? 60 : stage.key === "returning" ? 20 : 0;
    const goal = stage.key === "splash" ? WATER_GOAL : stage.nextAt - stageStart;
    const current = stage.key === "splash" ? WATER_GOAL : Math.min(goal, Math.max(0, fixedDrops - stageStart));
    return { ...stage, current, goal, percent: Math.min(100, Math.round(current / goal * 100)) };
  }

  function setBelt(el, rankIndex) {
    const color = RANKS[rankIndex].color;
    el.classList.remove("garden-token", "garden-token-dry", "garden-token-returning", "garden-token-restored", "garden-token-splash");
    el.classList.add("rank-token");
    delete el.dataset.garden;
    el.style.setProperty("--belt", color);
    if (!el.querySelector("span")) el.appendChild(document.createElement("span"));
  }

  function setGardenToken(el, garden) {
    el.classList.remove("rank-token", "garden-token-dry", "garden-token-returning", "garden-token-restored", "garden-token-splash");
    el.classList.add("garden-token", `garden-token-${garden.key}`);
    el.dataset.garden = garden.key;
    el.style.removeProperty("--belt");
    if (!el.querySelector("span")) el.appendChild(document.createElement("span"));
  }

  function renderRail(target, compact) {
    target.innerHTML = "";
    const unlockedRank = currentRankIndex();
    RANKS.forEach((rank, index) => {
      const button = document.createElement("button");
      button.className = `belt-card ${index === unlockedRank ? "active" : ""} ${index > unlockedRank ? "locked" : ""}`;
      button.type = "button";
      button.dataset.rank = String(index);
      button.disabled = index > unlockedRank;
      const railLabel = index > unlockedRank ? "前のレベルをクリア" : (index < unlockedRank ? "10問クリア" : "10問中8問で次へ");
      button.innerHTML = `<span class="belt-graphic"><span></span></span><b><em>${rank.level}</em>${rank.name}</b><small>${compact ? rank.skill : railLabel}</small>`;
      button.querySelector(".belt-graphic").style.setProperty("--belt", rank.color);
      button.addEventListener("click", () => {
        showToast(index === unlockedRank ? `${rank.name}の10問を始められます` : `${rank.name}を選びました`);
        if (index <= unlockedRank && target === els.rankRail) startSession("practice", index);
      });
      target.appendChild(button);
    });
  }

  function renderHome() {
    const garden = gardenState();
    els.homeView.classList.remove("garden-dry", "garden-returning", "garden-restored", "garden-splash");
    els.homeView.classList.add(`garden-${garden.key}`);
    els.homeMissionTitle.textContent = garden.title;
    els.homeStamp.textContent = garden.badge;
    els.homeProgressCount.textContent = `${garden.current} / ${garden.goal}しずく`;
    els.homeProgressBar.style.width = `${garden.percent}%`;
    els.homeProgressBar.style.setProperty("--home-progress-width", `${garden.percent}%`);
    els.homeProgressBar.parentElement?.style.setProperty("--home-progress-width", `${garden.percent}%`);
    els.homeCorrect.textContent = `${progress.todayCorrect || 0}問`;
    els.homeMistakes.textContent = `${progress.todayMistakes || 0}問`;
    const avg = progress.totalAnswered ? Math.round(progress.totalSeconds / progress.totalAnswered) : null;
    els.homeAverage.textContent = avg ? `${avg}秒` : "--秒";
    els.startButton.querySelector("b").textContent = hasPendingRetry()
      ? "やり直しモードへ"
      : hasActiveSession()
        ? "10問をつづける"
        : "分数のしずくを集める";
    renderRail(els.rankRail, false);
  }

  function showView(name) {
    [els.homeView, els.practiceView, els.reviewView, els.resultView].forEach((view) => view.classList.add("hidden"));
    ({ home: els.homeView, practice: els.practiceView, review: els.reviewView, result: els.resultView }[name]).classList.remove("hidden");
  }

  function toggleSceneryMode() {
    const next = !els.homeView.classList.contains("scenery-mode");
    els.homeView.classList.toggle("scenery-mode", next);
    els.sceneryButton.setAttribute("aria-pressed", String(next));
    els.sceneryButton.querySelector("b").textContent = next ? "表示を戻す" : "景色を見る";
    els.sceneryButton.querySelector("span").textContent = next ? "×" : "◱";
  }

  function makeSessionQuestions(rankIndex) {
    const list = [];
    const seen = new Set();
    const offset = Math.floor(Math.random() * 200);
    let serial = offset;
    while (list.length < SESSION_LENGTH && serial < offset + 600) {
      const q = makeQuestion(rankIndex, serial, list.length);
      serial += 1;
      const key = `${formatFraction(q.left)}-${formatFraction(q.right)}-${q.word || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(q);
    }
    while (list.length < SESSION_LENGTH) {
      const q = makeQuestion(rankIndex, serial, list.length);
      serial += 1;
      list.push(q);
    }
    return list;
  }

  let progress = loadProgress();
  let session = normalizeActiveSession(progress.activeSession);
  let activePart = "d";
  let answerN = "";
  let answerD = "";
  let toastTimer = null;
  let answerFxTimer = null;
  let audioContext = null;
  let answerLocked = false;

  function hasActiveSession() {
    return Boolean(session && Array.isArray(session.questions) && session.index < session.questions.length);
  }

  function activeSessionSnapshot(nextIndex = session?.index || 0) {
    if (!session || session.mode !== "practice") return null;
    if (nextIndex >= session.questions.length) return null;
    return {
      mode: "practice",
      rankIndex: session.rankIndex,
      questions: session.questions,
      index: nextIndex,
      correct: session.correct,
      mistakes: session.mistakes,
      startTime: session.startTime,
      retryQueue: session.retryQueue,
      previousRankStep: session.previousRankStep,
      previousCorrect: session.previousCorrect,
    };
  }

  function persistActiveSession(nextIndex = session?.index || 0) {
    progress.activeSession = activeSessionSnapshot(nextIndex);
  }

  function startSession(mode, forcedRankIndex) {
    if (!requirePlayerName()) return;
    if (mode !== "review" && hasPendingRetry()) {
      progress.activeSession = null;
      session = null;
      startPendingRetry();
      return;
    }
    const rankIndex = typeof forcedRankIndex === "number" ? forcedRankIndex : currentRankIndex();
    const reviewItems = progress.mistakes.slice(0, SESSION_LENGTH);
    if (mode === "review" && reviewItems.length === 0) {
      showToast("まちがい直しの問題はまだありません");
      return;
    }
    session = {
      mode,
      rankIndex,
      questions: mode === "review" ? reviewItems.map((m) => m.question) : makeSessionQuestions(rankIndex),
      index: 0,
      correct: 0,
      mistakes: 0,
      startTime: Date.now(),
      pausedForReview: false,
      hintMode: mode === "review",
      lastStudentAnswer: null,
      retryQueue: [],
      forcedRetry: false,
      previousRankStep: progress.rankStep,
      previousCorrect: progress.totalCorrect,
    };
    if (mode === "practice") {
      persistActiveSession(0);
      saveProgress();
    }
    showPracticeQuestion();
  }

  function showPracticeQuestion() {
    setAnswerLocked(false);
    const q = session.questions[session.index];
    if (!q) return finishSession();
    activePart = q.answer.d === 1 ? "n" : "d";
    answerN = "";
    answerD = "";
    window.__dojoCurrentAnswer = { ...q.answer };
    showView("practice");
    const rank = RANKS[session.rankIndex];
    setBelt(els.sessionBelt, session.rankIndex);
    els.sessionRankName.textContent = `今の庭：${rank.name}`;
    const questionText = `${session.index + 1}/${session.questions.length}`;
    els.questionNumberLabel.textContent = session.mode === "retry" ? "やり直し" : "もんだい";
    els.questionNumber.textContent = questionText;
    const progressIndex = session.mode === "retry" ? session.index : session.index + 1;
    els.practiceView.style.setProperty("--question-total", String(Math.max(1, session.questions.length)));
    els.questionProgress.parentElement?.style.setProperty("--question-total", String(Math.max(1, session.questions.length)));
    els.questionProgress.style.width = `${(progressIndex / session.questions.length) * 100}%`;
    els.lessonChip.innerHTML = "";
    els.problemLine.innerHTML = problemHtml(q);
    const showHint = session.mode === "review" || session.hintMode;
    els.practiceView.classList.toggle("retry-practice", session.mode === "retry");
    els.answerPanel.classList.toggle("integer-mode", q.answer.d === 1);
    els.hintPanel.classList.toggle("review-mode", showHint);
    els.hintButton.hidden = !showHint;
    els.hintBody.hidden = !showHint;
    els.visualHint.innerHTML = hintHtml(q, { concealedAnswer: session.mode === "retry" });
    clearAnswerFx();
    updateFocusBlocks();
    renderAnswer();
  }

  function progressPipsHtml(index, total) {
    const current = index + 1;
    const pips = Array.from({ length: total }, (_, i) => {
      const className = i < index ? "done" : (i === index ? "current" : "");
      return `<i class="${className}" aria-hidden="true"></i>`;
    }).join("");
    return `<span class="question-step-label"><b>${current}</b><small>問目 / ${total}問</small></span><span class="question-pips" aria-label="${current}問目">${pips}</span>`;
  }

  function updateFocusBlocks() {
    const left = Math.max(0, 8 - session.mistakes);
    els.focusBlocks.innerHTML = "";
    for (let i = 0; i < 8; i += 1) {
      const block = document.createElement("i");
      if (i < left) block.className = "on";
      els.focusBlocks.appendChild(block);
    }
  }

  function cancellationModel(q) {
    const top = [
      { value: q.left.n, now: q.left.n, by: 1 },
      { value: q.right.d, now: q.right.d, by: 1 },
    ];
    const bottom = [
      { value: q.left.d, now: q.left.d, by: 1 },
      { value: q.right.n, now: q.right.n, by: 1 },
    ];
    for (let i = 0; i < top.length; i += 1) {
      for (let j = 0; j < bottom.length; j += 1) {
        const common = gcd(Math.abs(top[i].now), Math.abs(bottom[j].now));
        if (common > 1) {
          top[i].now /= common;
          bottom[j].now /= common;
          top[i].by *= common;
          bottom[j].by *= common;
        }
      }
    }
    return { top, bottom };
  }

  function cancelFactorHtml(part, side) {
    const reduced = part.by > 1;
    return `
      <span class="cancel-factor ${side} ${reduced ? "reduced" : ""}">
        <em>${part.value}</em>
        ${reduced ? `<span class="cancel-result"><small>÷${part.by}</small><strong>${part.now}</strong></span>` : ""}
      </span>
    `;
  }

  function hintHtml(q, options = {}) {
    const rawN = q.left.n * q.right.d;
    const rawD = q.left.d * q.right.n;
    const common = gcd(Math.abs(rawN), Math.abs(rawD));
    const canReduce = common > 1;
    const raw = fraction(rawN, rawD);
    const cancel = cancellationModel(q);
    return `
      <div class="hint-steps">
        <article class="hint-step">
          <b><span>1</span>わる数を逆数にする</b>
          <div class="hint-formula">${fractionHtml(q.left)}<span class="op">×</span>${fractionHtml({ n: q.right.d, d: q.right.n })}</div>
        </article>
        <article class="hint-step reduce-step">
          <b><span>2</span>長い線でまとめて約分</b>
          <div class="long-fraction">
            <div class="long-top">${cancelFactorHtml(cancel.top[0], "top")}<small>×</small>${cancelFactorHtml(cancel.top[1], "top")}</div>
            <div class="long-rule"></div>
            <div class="long-bottom">${cancelFactorHtml(cancel.bottom[0], "bottom")}<small>×</small>${cancelFactorHtml(cancel.bottom[1], "bottom")}</div>
          </div>
          <p>${canReduce ? `斜め線で消して、割った後の数を書きます。` : "ここで、もう約分できない形か確認します。"}</p>
        </article>
        <article class="hint-step answer-step">
          <b><span>3</span>答えの形にする</b>
          ${options.concealedAnswer
            ? `<button class="hint-answer reveal-answer" type="button" aria-label="答えを見る" aria-expanded="false"><span class="answer-value">${fractionHtml(raw)}</span></button>`
            : `<div class="hint-answer">${fractionHtml(raw)}</div>`}
          <p>${canReduce ? `${rawN}/${rawD} は ${formatFraction(raw)}。` : `${formatFraction(raw)} が答えです。`}</p>
        </article>
      </div>
    `;
  }

  function renderAnswer() {
    const q = session?.questions?.[session.index];
    const integerMode = q?.answer?.d === 1;
    els.numeratorBox.textContent = answerN;
    els.denominatorBox.textContent = answerD;
    els.numeratorBox.setAttribute("aria-label", integerMode ? "答えの入力欄" : "分子の入力欄");
    els.denominatorBox.setAttribute("aria-label", "分母の入力欄");
    els.numeratorBox.classList.toggle("active", activePart === "n");
    els.denominatorBox.classList.toggle("active", activePart === "d");
    els.numeratorBox.classList.toggle("has-value", answerN !== "");
    els.denominatorBox.classList.toggle("has-value", answerD !== "");
    els.answerPanel.classList.toggle("integer-mode", integerMode);
    updateSubmitButtonLabel();
  }

  function setAnswerLocked(locked) {
    answerLocked = Boolean(locked);
    els.practiceView?.classList.toggle("answer-locked", answerLocked);
    els.keypad?.querySelectorAll("button").forEach((button) => {
      button.disabled = answerLocked;
    });
    if (els.numeratorBox) els.numeratorBox.disabled = answerLocked;
    if (els.denominatorBox) els.denominatorBox.disabled = answerLocked;
  }

  function moveAnswerPart(part) {
    if (answerLocked) return;
    const q = session?.questions?.[session.index];
    if (q?.answer?.d === 1) {
      activePart = "n";
      renderAnswer();
      return;
    }
    activePart = part === "d" ? "d" : "n";
    renderAnswer();
  }

  function inputDigit(digit) {
    if (answerLocked) return;
    const normalized = normalizeDigit(digit);
    if (normalized === "") return;
    if (activePart === "n") {
      if (answerN.length < 3) answerN += normalized;
    } else if (answerD.length < 3) {
      answerD += normalized;
    }
    renderAnswer();
  }

  function playToneSequence(tones) {
    if (!progress.sound || !tones?.length) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioContext = audioContext || new AudioCtor();
      if (audioContext.state === "suspended") audioContext.resume();
      const startAt = audioContext.currentTime + 0.01;
      tones.forEach((tone) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = tone.type || "sine";
        oscillator.frequency.setValueAtTime(tone.frequency, startAt + tone.at);
        gain.gain.setValueAtTime(0.0001, startAt + tone.at);
        gain.gain.exponentialRampToValueAtTime(tone.volume || 0.075, startAt + tone.at + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.at + tone.duration);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(startAt + tone.at);
        oscillator.stop(startAt + tone.at + tone.duration + 0.03);
      });
    } catch (error) {
      console.warn("sound effect skipped", error);
    }
  }

  function playSoundEffect(kind) {
    if (kind === "correct") {
      playToneSequence([
        { frequency: 660, at: 0, duration: 0.09, volume: 0.065, type: "triangle" },
        { frequency: 880, at: 0.08, duration: 0.12, volume: 0.075, type: "triangle" },
        { frequency: 1175, at: 0.18, duration: 0.16, volume: 0.065, type: "sine" },
      ]);
      return;
    }
    if (kind === "incorrect") {
      playToneSequence([
        { frequency: 220, at: 0, duration: 0.13, volume: 0.075, type: "sawtooth" },
        { frequency: 165, at: 0.11, duration: 0.16, volume: 0.06, type: "triangle" },
      ]);
      return;
    }
    if (kind === "move") {
      playToneSequence([{ frequency: 520, at: 0, duration: 0.06, volume: 0.04, type: "sine" }]);
    }
  }

  function normalizeDigit(value) {
    return String(value || "").replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0)).replace(/[^\d]/g, "");
  }

  function deleteDigit() {
    if (answerLocked) return;
    if (activePart === "n") answerN = answerN.slice(0, -1);
    else answerD = answerD.slice(0, -1);
    renderAnswer();
  }

  function clearAnswer() {
    if (answerLocked) return;
    answerN = "";
    answerD = "";
    renderAnswer();
  }

  function setIntegerAnswer() {
    activePart = "d";
    answerD = "1";
    renderAnswer();
  }

  function updateSubmitButtonLabel() {
    const button = els.keypad.querySelector("[data-action='submit']");
    if (!button) return;
    const q = session?.questions?.[session.index];
    button.textContent = q?.answer?.d === 1 || activePart === "n" ? "答え合わせ！" : "分子へ";
  }

  function enteredAnswer() {
    const q = session?.questions?.[session.index];
    const n = Number(answerN);
    const d = q?.answer?.d === 1 ? 1 : Number(answerD);
    if (!answerN || (q?.answer?.d !== 1 && !answerD) || !Number.isInteger(n) || !Number.isInteger(d) || d <= 0) return null;
    return fraction(n, d);
  }

  function submitAnswer() {
    if (!session || answerLocked) return;
    const q = session.questions[session.index];
    if (q.answer.d !== 1 && activePart === "d") {
      activePart = "n";
      renderAnswer();
      playSoundEffect("move");
      return;
    }
    const value = enteredAnswer();
    if (!value) {
      showToast("数字を入れてください");
      return;
    }
    const correct = value.n === q.answer.n && value.d === q.answer.d;
    const isRetry = session.mode === "retry";
    setAnswerLocked(true);
    if (!isRetry) {
      progress.totalAnswered += 1;
      progress.todayAnswered += 1;
      progress.totalSeconds += Math.max(2, Math.round((Date.now() - session.startTime) / 1000 / Math.max(1, session.index + 1)));
    }
    if (correct) {
      playAnswerFx("correct");
      playSoundEffect("correct");
      if (session.mode === "practice") {
        session.correct += 1;
        progress.totalCorrect += 1;
        progress.todayCorrect += 1;
        persistActiveSession(session.index + 1);
      }
      if (session.mode === "review" || isRetry) removeMistake(q.id);
      if (isRetry) removePendingRetryQuestion(q.id);
      saveProgress();
      if (isRetry) els.questionProgress.style.width = `${((session.index + 1) / session.questions.length) * 100}%`;
      setTimeout(() => {
        setAnswerLocked(false);
        if (!session) return;
        session.index += 1;
        session.hintMode = session.mode === "review" || session.mode === "retry";
        showPracticeQuestion();
      }, 520);
    } else {
      playAnswerFx("incorrect");
      playSoundEffect("incorrect");
      if (!isRetry) {
        session.mistakes += 1;
        progress.todayMistakes += 1;
        session.retryQueue.push({ question: q, studentAnswer: value });
        persistActiveSession(session.index + 1);
      }
      session.lastStudentAnswer = value;
      storeMistake(q, value);
      saveProgress();
      if (isRetry) {
        updatePendingRetryAnswer(q.id, value);
        activePart = q.answer.d === 1 ? "n" : "d";
        setAnswerLocked(false);
        clearAnswer();
      } else {
        setTimeout(() => {
          setAnswerLocked(false);
          if (!session) return;
          session.index += 1;
          showPracticeQuestion();
        }, 520);
      }
    }
  }

  function clearAnswerFx() {
    clearTimeout(answerFxTimer);
    els.problemCard?.classList.remove("fx-correct", "fx-incorrect");
    els.answerPanel?.classList.remove("fx-correct", "fx-incorrect");
    els.fractionAnswer?.classList.remove("fx-correct", "fx-incorrect");
    if (els.answerFeedback) {
      els.answerFeedback.className = "answer-feedback idle";
      els.answerFeedback.textContent = "";
    }
  }

  function playAnswerFx(kind) {
    clearAnswerFx();
    const fxClass = kind === "correct" ? "fx-correct" : "fx-incorrect";
    if (els.fractionAnswer) void els.fractionAnswer.offsetWidth;
    if (kind === "correct") {
      els.fractionAnswer?.classList.add(fxClass);
    } else {
      els.problemCard?.classList.add(fxClass);
      els.answerPanel?.classList.add(fxClass);
      els.fractionAnswer?.classList.add(fxClass);
    }
    if (els.answerFeedback) {
      els.answerFeedback.textContent = kind === "correct" ? "" : "おしい！";
      els.answerFeedback.className = kind === "correct"
        ? "answer-feedback idle"
        : "answer-feedback fx-incorrect";
    }
    answerFxTimer = setTimeout(() => {
      els.problemCard?.classList.remove(fxClass);
      els.answerPanel?.classList.remove(fxClass);
      els.fractionAnswer?.classList.remove(fxClass);
      if (els.answerFeedback) {
        els.answerFeedback.className = "answer-feedback idle";
        els.answerFeedback.textContent = "";
      }
    }, 760);
  }

  function storeMistake(question, studentAnswer) {
    progress.mistakes = progress.mistakes.filter((item) => item.question.id !== question.id);
    progress.mistakes.unshift({
      question,
      studentAnswer,
      lastMissed: Date.now(),
    });
    progress.mistakes = progress.mistakes.slice(0, 40);
  }

  function removeMistake(questionId) {
    progress.mistakes = progress.mistakes.filter((item) => item.question.id !== questionId);
  }

  function updatePendingRetryAnswer(questionId, value) {
    if (!hasPendingRetry()) return;
    const item = progress.pendingRetry.items.find((pending) => pending.question.id === questionId);
    if (item) item.studentAnswer = value;
  }

  function removePendingRetryQuestion(questionId) {
    if (!hasPendingRetry()) return;
    progress.pendingRetry.items = progress.pendingRetry.items.filter((item) => item.question.id !== questionId);
    if (!progress.pendingRetry.items.length) progress.pendingRetry = null;
  }

  function showReview(q, studentAnswer, reason) {
    showView("review");
    const rank = RANKS[currentRankIndex()];
    els.reviewPlayerName.textContent = playerName() || "研究生";
    els.reviewRankLabel.textContent = `今の庭 ${rank.name}`;
    els.reviewTitle.textContent = reason === "browse" ? "考え方の確認" : "まちがい直し";
    els.reviewIntro.textContent = q.prompt;
    els.reviewProblem.innerHTML = problemHtml(q);
    els.studentAnswer.innerHTML = fractionHtml(studentAnswer || { n: 0, d: 1 });
    els.correctAnswer.innerHTML = fractionHtml(q.answer);
    els.workedQuestion.textContent = `考え方を見てみよう!`;
    els.workedSteps.innerHTML = q.steps.map((step, index) => {
      const model = index === 1 ? hintHtml(q) : `<p>${q.core}</p>`;
      return `<article class="step-card"><h4><span>${index + 1}</span>${step}</h4>${model}</article>`;
    }).join("");
    session.pausedForReview = reason !== "browse";
  }

  function retryCurrentQuestion() {
    if (!session) {
      const item = progress.mistakes[0];
      if (!item) return showHome();
      session = {
        mode: "review",
        rankIndex: currentRankIndex(),
        questions: progress.mistakes.slice(0, SESSION_LENGTH).map((m) => m.question),
        index: 0,
        correct: 0,
        mistakes: 0,
        startTime: Date.now(),
        pausedForReview: false,
        hintMode: true,
        previousRankStep: progress.rankStep,
        previousCorrect: progress.totalCorrect,
      };
    }
    session.hintMode = true;
    showPracticeQuestion();
  }

  function continueAfterReview() {
    if (session && session.pausedForReview) {
      session.index += 1;
      session.pausedForReview = false;
      showPracticeQuestion();
      return;
    }
    const current = progress.mistakes[0];
    if (!current) return showHome();
    const next = progress.mistakes[1] || progress.mistakes[0];
    showReview(next.question, next.studentAnswer, "browse");
  }

  function finishSession() {
    if (session.mode === "practice" && session.retryQueue.length) {
      beginForcedRetry();
      return;
    }
    const prevStep = session.previousRankStep;
    const canRankUp = (session.mode === "practice" || session.mode === "retry") && session.correct >= 8 && progress.rankStep < MAX_RANK_STEP;
    if (canRankUp) progress.rankStep += 1;
    progress.sessions += 1;
    progress.activeSession = null;
    if (session.mode === "retry") progress.pendingRetry = null;
    saveProgress();
    renderResult(prevStep, canRankUp);
  }

  function beginForcedRetry() {
    const retryItems = session.retryQueue.slice();
    progress.pendingRetry = {
      rankIndex: session.rankIndex,
      items: retryItems,
      correct: session.correct,
      mistakes: session.mistakes,
      previousRankStep: session.previousRankStep,
      previousCorrect: session.previousCorrect,
      createdAt: Date.now(),
    };
    progress.activeSession = null;
    saveProgress();
    startPendingRetry();
  }

  function startPendingRetry() {
    const pending = normalizePendingRetry(progress.pendingRetry);
    if (!pending) {
      progress.pendingRetry = null;
      saveProgress();
      startSession("practice");
      return;
    }
    progress.pendingRetry = pending;
    progress.activeSession = null;
    session = {
      mode: "retry",
      rankIndex: pending.rankIndex,
      questions: pending.items.map((item) => item.question),
      index: 0,
      correct: pending.correct,
      mistakes: pending.mistakes,
      startTime: Date.now(),
      pausedForReview: false,
      hintMode: true,
      lastStudentAnswer: null,
      retryQueue: pending.items,
      forcedRetry: true,
      previousRankStep: pending.previousRankStep,
      previousCorrect: pending.previousCorrect,
    };
    showPracticeQuestion();
  }

  function renderResult(prevStep, rankedUp) {
    const prevRank = rankIndexForStep(prevStep);
    const nowRank = currentRankIndex();
    const previousGarden = gardenStateForDrops(session.previousCorrect);
    const currentGarden = gardenStateForDrops(progress.totalCorrect);
    const gardenChanged = previousGarden.key !== currentGarden.key;
    showView("result");
    els.resultView.classList.remove("garden-dry", "garden-returning", "garden-restored", "garden-splash", "final-clear", "garden-changed");
    els.resultView.classList.add(`garden-${currentGarden.key}`);
    renderRail(els.resultRail, true);
    const totalDrops = Math.min(WATER_GOAL, Math.max(0, Number(progress.totalCorrect || 0)));
    const earnedThisSession = session.mode === "retry" ? 0 : session.correct;
    const isFinalClear = totalDrops >= WATER_GOAL;
    els.resultView.classList.toggle("final-clear", isFinalClear);
    els.resultView.classList.toggle("garden-changed", gardenChanged && !isFinalClear);
    els.coinTotal.textContent = `${currentGarden.current}/${currentGarden.goal}`;
    if (els.resultProgressCount) els.resultProgressCount.textContent = `${currentGarden.current} / ${currentGarden.goal}`;
    if (els.resultProgressBar) els.resultProgressBar.style.width = `${currentGarden.percent}%`;
    if (els.resultProgressDots) {
      els.resultProgressDots.innerHTML = "";
    }
    els.previousRank.textContent = gardenChanged ? gardenResultLabel(previousGarden) : RANKS[prevRank].name;
    els.currentRank.textContent = gardenChanged ? gardenResultLabel(currentGarden) : RANKS[nowRank].name;
    if (gardenChanged) {
      setGardenToken(els.previousBelt, previousGarden);
      setGardenToken(els.currentBelt, currentGarden);
    } else {
      setBelt(els.previousBelt, prevRank);
      setBelt(els.currentBelt, nowRank);
    }
    els.resultCorrect.textContent = `${session.correct}/${SESSION_LENGTH}`;
    els.resultMistake.textContent = `${session.mistakes}問`;
    els.nextSkill.textContent = RANKS[nowRank].skill;
    if (els.resultSummaryTitle) els.resultSummaryTitle.textContent = isFinalClear ? "完成記録" : "今回の結果";
    if (els.nextTrainingButton) els.nextTrainingButton.textContent = isFinalClear ? "もう一度" : "→ つぎの10問";
    if (isFinalClear) {
      els.resultHeadline.textContent = "天空庭園 完成!";
      els.rankRibbon.textContent = "100しずく達成";
      els.resultMessage.textContent = "分数のわり算、最後までやりきりました。";
    } else if (session.mode === "retry") {
      els.resultHeadline.textContent = "やり直し完了!";
      els.rankRibbon.textContent = "100しずくまで";
      els.resultMessage.textContent = "復習分は増やさず、次へ進みます。";
    } else if (gardenChanged) {
      els.resultHeadline.textContent = "景色がひらいた!";
      els.rankRibbon.textContent = "新しい景色へ";
      els.resultMessage.textContent = `${earnedThisSession}こ分で、庭園が大きく変わりました。`;
    } else if (rankedUp) {
      els.resultHeadline.textContent = "練習完了!";
      els.rankRibbon.textContent = "100しずくまで";
      els.resultMessage.textContent = `${earnedThisSession}こ分、進みました。`;
    } else if (session.correct === SESSION_LENGTH) {
      els.resultHeadline.textContent = "全問正解!";
      els.rankRibbon.textContent = "100しずくまで";
      els.resultMessage.textContent = `${earnedThisSession}こ分、進みました。`;
    } else {
      els.resultHeadline.textContent = "練習完了!";
      els.rankRibbon.textContent = "100しずくまで";
      els.resultMessage.textContent = `${earnedThisSession}こ分、進みました。`;
    }
    if (els.resultReviewButton) els.resultReviewButton.disabled = progress.mistakes.length === 0;
  }

  function showHome() {
    renderHome();
    showView("home");
  }

  function continueActiveSession() {
    if (hasPendingRetry()) {
      progress.activeSession = null;
      session = null;
      saveProgress();
      startPendingRetry();
      return;
    }
    if (!hasActiveSession()) {
      startSession("practice");
      return;
    }
    session.pausedForReview = false;
    showPracticeQuestion();
  }

  function showRecords() {
    const rate = progress.totalAnswered ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0;
    const garden = gardenState();
    const mistakeRows = progress.mistakes.slice(0, 4).map((item, index) => {
      const label = item.question.word || `${formatFraction(item.question.left)} ÷ ${formatFraction(item.question.right)}`;
      return `<li><span>${index + 1}</span><b>${label}</b><small>正解 ${formatFraction(item.question.answer)}</small></li>`;
    }).join("");
    showModal("記録", `
      <section class="record-dashboard">
        <div class="record-hero">
          <div>
            <small>今の進み具合</small>
            <b>${RANKS[currentRankIndex()].name}</b>
            <span>${gardenStepLabel(progress.rankStep)} / ${garden.current} / ${garden.goal}しずく</span>
          </div>
          <i><em style="width:${garden.percent}%"></em></i>
        </div>
        <div class="record-stats">
          <article><small>練習</small><b>${progress.sessions}</b><span>回</span></article>
          <article><small>正解</small><b>${progress.totalCorrect}</b><span>${progress.totalAnswered}問中</span></article>
          <article><small>正答率</small><b>${rate}</b><span>%</span></article>
          <article><small>直す問題</small><b>${progress.mistakes.length}</b><span>問</span></article>
        </div>
        <div class="record-note">
          <b>しずく</b><span>${Math.min(WATER_GOAL, progress.totalCorrect || 0)}こ</span>
          <b>次の景色まで</b><span>${garden.goal - garden.current}しずく</span>
        </div>
        <div class="record-mistakes">
          <h3>最近のまちがい</h3>
          ${mistakeRows ? `<ul>${mistakeRows}</ul>` : `<p>今はありません。</p>`}
        </div>
      </section>
    `);
  }

  function showSettings() {
    showModal("設定", `
      <button class="inline-button" id="recordFromSettingsButton" type="button">記録を見る</button>
      <p>音: ${progress.sound ? "オン" : "オフ"}</p>
      <button class="inline-button" id="toggleSoundButton" type="button">音を${progress.sound ? "オフ" : "オン"}にする</button>
      <p>保存コードを使うと、このブラウザの進み具合を別の端末へ移せます。</p>
      <button class="inline-button" id="backupButton" type="button">保存コードを作る</button>
      <button class="inline-button" id="restoreButton" type="button">コードを読み込む</button>
      <p>進み具合はこのブラウザだけに保存されます。学校の名簿や外部サービスには送りません。</p>
    `);
    document.getElementById("recordFromSettingsButton").addEventListener("click", showRecords);
    document.getElementById("toggleSoundButton").addEventListener("click", () => {
      progress.sound = !progress.sound;
      saveProgress();
      if (progress.sound) playSoundEffect("correct");
      showSettings();
    });
    document.getElementById("backupButton").addEventListener("click", showBackupCode);
    document.getElementById("restoreButton").addEventListener("click", showRestoreCode);
  }

  function showBackupCode() {
    showModal("保存コード", `
      <p>このコードには進み具合が入っています。自分用に保存してください。</p>
      <textarea class="code-box" id="backupCodeBox" readonly>${encodeProgress()}</textarea>
      <button class="inline-button" id="selectBackupButton" type="button">コードを選択</button>
    `);
    document.getElementById("selectBackupButton").addEventListener("click", () => {
      const box = document.getElementById("backupCodeBox");
      box.focus();
      box.select();
    });
  }

  function showRestoreCode() {
    showModal("コードを読み込む", `
      <p>保存コードを貼り付けると、このブラウザの進み具合に上書きします。</p>
      <textarea class="code-box" id="restoreCodeBox" placeholder="ここにコードを貼り付け"></textarea>
      <button class="inline-button" id="applyRestoreButton" type="button">読み込む</button>
    `);
    document.getElementById("applyRestoreButton").addEventListener("click", () => {
      try {
        const next = decodeProgress(document.getElementById("restoreCodeBox").value);
        progress = next;
        saveProgress();
        renderHome();
        closeModal();
        showToast("進み具合を読み込みました");
      } catch {
        showToast("コードを読み込めませんでした");
      }
    });
  }

  function showNameSetup(required) {
    showModal(required ? "名前をえらぶ" : "名前を変える", `
      <p>この端末に保存する名前です。学校の名簿には送りません。</p>
      <label class="name-entry-label" for="playerNameInput">名前</label>
      <input id="playerNameInput" class="name-entry-input" maxlength="12" autocomplete="off" value="${playerName()}">
      <div class="name-presets" aria-label="名前の例">
        <button class="inline-button" type="button" data-name="さくらさん">さくらさん</button>
        <button class="inline-button" type="button" data-name="はるとさん">はるとさん</button>
        <button class="inline-button" type="button" data-name="研究生">研究生</button>
      </div>
      <button class="inline-button" id="saveNameButton" type="button">この名前で始める</button>
    `);
    const input = document.getElementById("playerNameInput");
    const save = () => {
      const name = input.value.trim().slice(0, 12);
      if (!name) {
        showToast("名前を入れてください");
        return;
      }
      progress.playerName = name;
      saveProgress();
      renderHome();
      closeModal();
      showToast(`${name}で始めます`);
    };
    document.querySelectorAll("[data-name]").forEach((button) => {
      button.addEventListener("click", () => {
        input.value = button.dataset.name;
        save();
      });
    });
    document.getElementById("saveNameButton").addEventListener("click", save);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") save();
    });
    setTimeout(() => input.focus(), 0);
  }

  function showReviewList() {
    if (!progress.mistakes.length) {
      showToast("まちがい直しの問題はありません");
      return;
    }
    const items = progress.mistakes.slice(0, 8).map((item, i) =>
      `<li>${i + 1}. ${item.question.word || `${formatFraction(item.question.left)} ÷ ${formatFraction(item.question.right)}`} / 正解 ${formatFraction(item.question.answer)}</li>`
    ).join("");
    showModal("まちがえた問題", `<ul>${items}</ul>`);
  }

  function showMenu() {
    showModal("メニュー", `
      <p>今の10問をどうしますか。</p>
      <button class="inline-button" id="resumeButton" type="button">10問にもどる</button>
      <button class="inline-button" id="menuHomeButton" type="button">ホームへ</button>
    `);
    document.getElementById("resumeButton").addEventListener("click", closeModal);
    document.getElementById("menuHomeButton").addEventListener("click", () => { closeModal(); showHome(); });
  }

  function showModal(title, body) {
    els.modalTitle.textContent = title;
    els.modalBody.innerHTML = body;
    if (!els.modal.open) els.modal.showModal();
  }

  function closeModal() {
    if (els.modal.open) els.modal.close();
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function buildKeypad() {
    const keys = [
      { label: "7", action: "digit" },
      { label: "8", action: "digit" },
      { label: "9", action: "digit" },
      { label: "4", action: "digit" },
      { label: "5", action: "digit" },
      { label: "6", action: "digit" },
      { label: "1", action: "digit" },
      { label: "2", action: "digit" },
      { label: "3", action: "digit" },
      { label: "全部消す", action: "clear", className: "utility clear-all" },
      { label: "0", action: "digit" },
      { label: "1つ消す", action: "delete", className: "utility delete-one" },
      { label: "送信！", action: "submit", className: "check submit" },
    ];
    els.keypad.innerHTML = "";
    keys.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = key.label;
      button.dataset.action = key.action;
      if (key.className) button.className = key.className;
      button.addEventListener("click", () => {
        if (key.action === "digit") inputDigit(key.label);
        else if (key.action === "clear") clearAnswer();
        else if (key.action === "delete") deleteDigit();
        else submitAnswer();
      });
      els.keypad.appendChild(button);
    });
  }

  function handleEnterKey() {
    const q = session?.questions?.[session.index];
    if (q?.answer?.d === 1) {
      submitAnswer();
      return;
    }
    if (activePart === "d") {
      activePart = "n";
      renderAnswer();
      return;
    }
    submitAnswer();
  }

  function wireEvents() {
    els.startButton.addEventListener("click", continueActiveSession);
    if (els.reviewButton) els.reviewButton.addEventListener("click", () => startSession("review"));
    els.settingsButton.addEventListener("click", showSettings);
    els.sceneryButton.addEventListener("click", toggleSceneryMode);
    els.backHomeButton.addEventListener("click", showHome);
    if (els.menuButton) els.menuButton.addEventListener("click", showMenu);
    if (els.reviewMenuButton) els.reviewMenuButton.addEventListener("click", showMenu);
    els.reviewBackButton.addEventListener("click", showHome);
    els.numeratorBox.addEventListener("click", () => { activePart = "n"; renderAnswer(); });
    els.denominatorBox.addEventListener("click", () => { activePart = "d"; renderAnswer(); });
    if (els.swapFocusButton) els.swapFocusButton.addEventListener("click", () => { activePart = activePart === "n" ? "d" : "n"; renderAnswer(); });
    if (els.wholeNumberButton) els.wholeNumberButton.addEventListener("click", setIntegerAnswer);
    els.hintButton.addEventListener("click", () => {
      els.hintBody.hidden = !els.hintBody.hidden;
    });
    els.visualHint.addEventListener("click", (event) => {
      const button = event.target.closest(".reveal-answer");
      if (!button) return;
      button.classList.add("revealed");
      button.setAttribute("aria-expanded", "true");
      button.disabled = true;
    });
    els.reviewHintButton.addEventListener("click", () => showToast("下の3ステップで考え方を確認できます"));
    els.reviewListButton.addEventListener("click", showReviewList);
    els.retryButton.addEventListener("click", retryCurrentQuestion);
    els.reviewNextButton.addEventListener("click", continueAfterReview);
    els.nextTrainingButton.addEventListener("click", () => startSession("practice"));
    if (els.resultReviewButton) els.resultReviewButton.addEventListener("click", () => startSession("review"));
    els.resultHomeButton.addEventListener("click", showHome);
    els.modalCloseButton.addEventListener("click", closeModal);
    document.addEventListener("dragstart", (event) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    });
    window.addEventListener("keydown", (event) => {
      if (!session || els.practiceView.classList.contains("hidden")) return;
      if (answerLocked) {
        event.preventDefault();
        return;
      }
      const digit = normalizeDigit(event.key);
      if (/^\d$/.test(digit)) {
        event.preventDefault();
        inputDigit(digit);
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        deleteDigit();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleEnterKey();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        moveAnswerPart(event.key === "ArrowUp" ? "n" : "d");
      }
      if (event.key === "Tab") {
        event.preventDefault();
        activePart = activePart === "n" ? "d" : "n";
        renderAnswer();
      }
    });
  }

  function exposeTestApi() {
    window.__fractionDojo = {
      STORAGE_KEY,
      getProgress: () => progress,
      clear: () => {
        progress = defaultProgress();
        session = null;
        saveProgress();
        renderHome();
      },
      setName: (name) => {
        progress.playerName = String(name || "").trim();
        saveProgress();
        renderHome();
      },
      encodeProgress,
      restoreProgress: (code) => {
        progress = decodeProgress(code);
        session = normalizeActiveSession(progress.activeSession);
        saveProgress();
        renderHome();
      },
      answerCurrent: () => window.__dojoCurrentAnswer,
      sampleQuestions: (rankIndex, count = 12) => Array.from({ length: count }, (_, i) => {
        const q = makeQuestion(rankIndex, i, i % SESSION_LENGTH);
        return {
          type: q.type,
          left: formatFraction(q.left),
          right: formatFraction(q.right),
          answer: formatFraction(q.answer),
          lesson: q.lesson,
          word: q.word || "",
          unit: q.unit || "",
        };
      }),
      sampleQuestionsRaw: (rankIndex, count = 12) => Array.from({ length: count }, (_, i) => makeQuestion(rankIndex, i, i % SESSION_LENGTH)),
      testSound: (kind = "correct") => playSoundEffect(kind),
      forceMistake: () => {
        const q = makeIntegerDivFraction(1);
        storeMistake(q, fraction(1, 1));
        saveProgress();
        renderHome();
      },
      setProgressForCheck: (patch = {}) => {
        progress = normalizeProgress({
          ...progress,
          ...patch,
          activeSession: null,
          pendingRetry: null,
        });
        session = null;
        saveProgress();
        renderHome();
        showView("home");
      },
      forceFinalClear: () => {
        progress = normalizeProgress({
          ...progress,
          rankStep: MAX_RANK_STEP,
          totalCorrect: WATER_GOAL,
          totalAnswered: Math.max(Number(progress.totalAnswered || 0), WATER_GOAL),
          sessions: Math.max(Number(progress.sessions || 0), 10),
          activeSession: null,
          pendingRetry: null,
        });
        session = {
          mode: "practice",
          rankIndex: currentRankIndex(),
          questions: [],
          index: SESSION_LENGTH,
          correct: SESSION_LENGTH,
          mistakes: 0,
          startTime: Date.now(),
          pausedForReview: false,
          hintMode: false,
          lastStudentAnswer: null,
          retryQueue: [],
          forcedRetry: false,
          previousRankStep: MAX_RANK_STEP,
          previousCorrect: WATER_GOAL - SESSION_LENGTH,
        };
        saveProgress();
        renderResult(MAX_RANK_STEP, false);
      },
    };
  }

  buildKeypad();
  wireEvents();
  exposeTestApi();
  renderHome();
  showView("home");
})();
