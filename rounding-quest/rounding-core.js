(function (root) {
  'use strict';

  const PLACE_DEFS = [
    { key: 'ones', label: '一の位', unit: 1 },
    { key: 'tens', label: '十の位', unit: 10 },
    { key: 'hundreds', label: '百の位', unit: 100 },
    { key: 'thousands', label: '千の位', unit: 1000 },
    { key: 'tenThousands', label: '一万の位', unit: 10000 },
  ];

  const PLACE_BY_KEY = Object.fromEntries(PLACE_DEFS.map((place) => [place.key, place]));
  const STORAGE_KEY = 'roundingQuest.rpg.v1';
  const STAGES = [
    {
      id: 'round-digit',
      order: 1,
      title: '何の位で四捨五入',
      shortTitle: '位で四捨五入',
      copy: '指定された位の数字を見る。',
      artifact: '光の鍵',
      artifactUnit: '本',
      destination: '門',
      collectVerb: '見つけました',
      completeVerb: 'そろいました',
      goalLabel: '門まであと',
      closedTitle: '門がひかえています',
      closedCopy: '答えを入れて、光の鍵を手に入れよう。',
      successTitle: '光の鍵を手に入れた！',
      successCopy: '門がひらきました。',
      badge: 'assets/rpg/badge-stage1.png',
      image: 'assets/rpg/stage1-gate.png',
    },
    {
      id: 'round-place',
      order: 2,
      title: '何の位までのがい数',
      shortTitle: '位までのがい数',
      copy: '残す位を決めて、すぐ右を見る。',
      artifact: '塔の光',
      artifactUnit: '灯',
      destination: '塔の頂上',
      collectVerb: 'ともしました',
      completeVerb: 'ともりました',
      goalLabel: '塔の頂上まであと',
      closedTitle: '塔の光をともそう',
      closedCopy: '答えを入れて、塔に光をともそう。',
      successTitle: '塔の光がともった！',
      successCopy: '光の階段がのびました。',
      badge: 'assets/rpg/badge-stage2.png',
      image: 'assets/rpg/stage2-tower.png',
    },
    {
      id: 'significant',
      order: 3,
      title: '上から何けたのがい数',
      shortTitle: '上から何けた',
      copy: '左から何けた残すかを見つける。',
      artifact: '星のメダル',
      artifactUnit: '枚',
      destination: '天空儀',
      collectVerb: '見つけました',
      completeVerb: 'そろいました',
      goalLabel: '天空儀まであと',
      closedTitle: '天空儀を動かそう',
      closedCopy: '答えを入れて、星のメダルを集めよう。',
      successTitle: '星のメダルを見つけた！',
      successCopy: '天空儀が光りました。',
      badge: 'assets/rpg/badge-stage3.png',
      image: 'assets/rpg/stage3-observatory.png',
    },
    {
      id: 'final-mix',
      order: 4,
      title: 'まとめバトル',
      shortTitle: 'まとめ',
      copy: '3つの型を見分ける、最後の章。',
      artifact: '王冠の宝石',
      artifactUnit: '個',
      destination: '王城',
      collectVerb: '集めました',
      completeVerb: '集まりました',
      goalLabel: '王城クリアまであと',
      closedTitle: '王城の扉が待っています',
      closedCopy: '問題のことばを見分けて、王冠の宝石を集めよう。',
      successTitle: '王冠の宝石を手に入れた！',
      successCopy: '王城へ近づきました。',
      badge: 'assets/rpg/badge-stage4.png',
      image: 'assets/rpg/final-castle.png',
    },
  ];

  const CHECK_DIGIT_ORDER = [2, 7, 1, 6, 3, 8, 0, 5, 4, 9];
  const SESSION_LENGTH = 5;
  const STAGE_GOAL = 30;
  const DEFAULT_PROGRESS = { sessions: 0, best: 0, bestStreak: 0, materials: 0, mistakes: {}, stageWins: {} };
  const TRANSFER_PREFIX = 'RQ1-';
  const TYPE_LABELS = {
    'round-digit': '何の位で四捨五入',
    'round-place': '何の位までのがい数',
    significant: '上から何けた',
  };

  function withLevels(plans) {
    return plans.map((plan, index) => ({
      ...plan,
      level: index < 10 ? 'はじめ' : index < 20 ? 'たしかめ' : 'チャレンジ',
    }));
  }

  const STAGE_PLANS = {
    'round-digit': withLevels([
      { place: 'ones', kept: 34, tail: 0 },
      { place: 'ones', kept: 48, tail: 0 },
      { place: 'tens', kept: 52, tail: 4 },
      { place: 'tens', kept: 67, tail: 3 },
      { place: 'hundreds', kept: 43, tail: 25 },
      { place: 'hundreds', kept: 58, tail: 42 },
      { place: 'thousands', kept: 3, tail: 260 },
      { place: 'thousands', kept: 4, tail: 510 },
      { place: 'hundreds', kept: 89, tail: 75 },
      { place: 'thousands', kept: 8, tail: 330 },
      { place: 'ones', kept: 150, tail: 0 },
      { place: 'ones', kept: 205, tail: 0 },
      { place: 'tens', kept: 14, tail: 9 },
      { place: 'tens', kept: 24, tail: 9 },
      { place: 'hundreds', kept: 32, tail: 49 },
      { place: 'hundreds', kept: 30, tail: 50 },
      { place: 'thousands', kept: 10, tail: 499 },
      { place: 'thousands', kept: 10, tail: 500 },
      { place: 'hundreds', kept: 76, tail: 99 },
      { place: 'thousands', kept: 98, tail: 999 },
      { place: 'ones', kept: 1203, tail: 0 },
      { place: 'tens', kept: 407, tail: 6 },
      { place: 'hundreds', kept: 905, tail: 5 },
      { place: 'thousands', kept: 45, tail: 67 },
      { place: 'tenThousands', kept: 12, tail: 3456 },
      { place: 'tenThousands', kept: 23, tail: 4501 },
      { place: 'hundreds', kept: 1001, tail: 1 },
      { place: 'thousands', kept: 100, tail: 50 },
      { place: 'tenThousands', kept: 80, tail: 987 },
      { place: 'tenThousands', kept: 90, tail: 9999 },
    ]),
    'round-place': withLevels([
      { place: 'tens', kept: 48, tail: 0 },
      { place: 'tens', kept: 63, tail: 0 },
      { place: 'hundreds', kept: 37, tail: 4 },
      { place: 'hundreds', kept: 52, tail: 3 },
      { place: 'thousands', kept: 28, tail: 25 },
      { place: 'thousands', kept: 41, tail: 42 },
      { place: 'tenThousands', kept: 12, tail: 260 },
      { place: 'tenThousands', kept: 25, tail: 510 },
      { place: 'thousands', kept: 73, tail: 75 },
      { place: 'tenThousands', kept: 48, tail: 330 },
      { place: 'tens', kept: 149, tail: 0 },
      { place: 'tens', kept: 150, tail: 0 },
      { place: 'hundreds', kept: 30, tail: 49 },
      { place: 'hundreds', kept: 30, tail: 50 },
      { place: 'thousands', kept: 54, tail: 499 },
      { place: 'thousands', kept: 55, tail: 500 },
      { place: 'tenThousands', kept: 7, tail: 4999 },
      { place: 'tenThousands', kept: 7, tail: 5000 },
      { place: 'thousands', kept: 100, tail: 99 },
      { place: 'tenThousands', kept: 90, tail: 999 },
      { place: 'tens', kept: 1203, tail: 0 },
      { place: 'hundreds', kept: 405, tail: 6 },
      { place: 'thousands', kept: 987, tail: 5 },
      { place: 'tenThousands', kept: 12, tail: 345 },
      { place: 'tenThousands', kept: 18, tail: 4300 },
      { place: 'thousands', kept: 760, tail: 800 },
      { place: 'hundreds', kept: 1001, tail: 1 },
      { place: 'tenThousands', kept: 99, tail: 50 },
      { place: 'thousands', kept: 890, tail: 901 },
      { place: 'tenThousands', kept: 70, tail: 9999 },
    ]),
    significant: withLevels([
      { digits: 2, totalDigits: 4, kept: 24, tail: 0 },
      { digits: 2, totalDigits: 4, kept: 37, tail: 0 },
      { digits: 3, totalDigits: 4, kept: 412, tail: 0 },
      { digits: 3, totalDigits: 4, kept: 536, tail: 0 },
      { digits: 2, totalDigits: 5, kept: 64, tail: 5 },
      { digits: 3, totalDigits: 5, kept: 583, tail: 4 },
      { digits: 2, totalDigits: 6, kept: 70, tail: 25 },
      { digits: 3, totalDigits: 6, kept: 815, tail: 42 },
      { digits: 2, totalDigits: 5, kept: 88, tail: 75 },
      { digits: 3, totalDigits: 6, kept: 489, tail: 33 },
      { digits: 2, totalDigits: 4, kept: 14, tail: 9 },
      { digits: 2, totalDigits: 4, kept: 15, tail: 0 },
      { digits: 3, totalDigits: 5, kept: 304, tail: 9 },
      { digits: 3, totalDigits: 5, kept: 305, tail: 0 },
      { digits: 2, totalDigits: 6, kept: 54, tail: 99 },
      { digits: 2, totalDigits: 6, kept: 55, tail: 0 },
      { digits: 3, totalDigits: 6, kept: 999, tail: 9 },
      { digits: 3, totalDigits: 6, kept: 100, tail: 0 },
      { digits: 2, totalDigits: 5, kept: 70, tail: 99 },
      { digits: 3, totalDigits: 6, kept: 900, tail: 99 },
      { digits: 2, totalDigits: 6, kept: 12, tail: 345 },
      { digits: 3, totalDigits: 6, kept: 408, tail: 6 },
      { digits: 2, totalDigits: 5, kept: 98, tail: 5 },
      { digits: 3, totalDigits: 5, kept: 765, tail: 4 },
      { digits: 2, totalDigits: 6, kept: 50, tail: 25 },
      { digits: 3, totalDigits: 6, kept: 801, tail: 42 },
      { digits: 2, totalDigits: 4, kept: 99, tail: 0 },
      { digits: 3, totalDigits: 6, kept: 120, tail: 50 },
      { digits: 2, totalDigits: 5, kept: 89, tail: 75 },
      { digits: 3, totalDigits: 6, kept: 987, tail: 33 },
    ]),
    'final-mix': withLevels([
      { type: 'round-digit', place: 'ones', kept: 91, tail: 0 },
      { type: 'round-place', place: 'tens', kept: 74, tail: 0 },
      { type: 'significant', digits: 2, totalDigits: 4, kept: 56, tail: 0 },
      { type: 'round-digit', place: 'tens', kept: 83, tail: 2 },
      { type: 'round-place', place: 'hundreds', kept: 69, tail: 4 },
      { type: 'significant', digits: 3, totalDigits: 5, kept: 724, tail: 2 },
      { type: 'round-digit', place: 'hundreds', kept: 76, tail: 25 },
      { type: 'round-place', place: 'thousands', kept: 54, tail: 42 },
      { type: 'significant', digits: 2, totalDigits: 6, kept: 93, tail: 75 },
      { type: 'round-place', place: 'tenThousands', kept: 67, tail: 330 },
      { type: 'round-digit', place: 'ones', kept: 149, tail: 0 },
      { type: 'round-place', place: 'tens', kept: 150, tail: 0 },
      { type: 'significant', digits: 2, totalDigits: 4, kept: 15, tail: 0 },
      { type: 'round-digit', place: 'tens', kept: 30, tail: 9 },
      { type: 'round-place', place: 'hundreds', kept: 30, tail: 50 },
      { type: 'significant', digits: 3, totalDigits: 5, kept: 305, tail: 0 },
      { type: 'round-digit', place: 'thousands', kept: 10, tail: 499 },
      { type: 'round-place', place: 'tenThousands', kept: 7, tail: 5000 },
      { type: 'significant', digits: 3, totalDigits: 6, kept: 999, tail: 9 },
      { type: 'round-place', place: 'thousands', kept: 100, tail: 99 },
      { type: 'round-digit', place: 'tens', kept: 407, tail: 6 },
      { type: 'round-place', place: 'hundreds', kept: 405, tail: 6 },
      { type: 'significant', digits: 2, totalDigits: 6, kept: 12, tail: 345 },
      { type: 'round-digit', place: 'hundreds', kept: 905, tail: 5 },
      { type: 'round-place', place: 'tenThousands', kept: 18, tail: 4300 },
      { type: 'significant', digits: 3, totalDigits: 6, kept: 408, tail: 6 },
      { type: 'round-place', place: 'thousands', kept: 890, tail: 901 },
      { type: 'round-digit', place: 'tenThousands', kept: 80, tail: 987 },
      { type: 'significant', digits: 2, totalDigits: 5, kept: 89, tail: 75 },
      { type: 'round-place', place: 'tenThousands', kept: 70, tail: 9999 },
    ]),
  };

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function formatNumber(value) {
    return Number(value).toLocaleString('ja-JP');
  }

  function roundToUnit(value, unit) {
    return Math.round(value / unit) * unit;
  }

  function getDigit(value, unit) {
    return Math.floor(value / unit) % 10;
  }

  function mostSignificantUnit(value) {
    return 10 ** Math.floor(Math.log10(Math.max(1, value)));
  }

  function describeUnit(unit) {
    const found = PLACE_DEFS.find((place) => place.unit === unit);
    return found ? found.label : `${formatNumber(unit)}の位`;
  }

  function getStage(stageId) {
    return STAGES.find((stage) => stage.id === stageId) || STAGES[0];
  }

  function makeVisual(value, answer, targetUnit, checkUnit, checkDigit) {
    const lower = Math.floor(value / targetUnit) * targetUnit;
    const upper = lower + targetUnit;
    const percent = Math.max(0, Math.min(100, ((value - lower) / targetUnit) * 100));
    return {
      value,
      answer,
      targetUnit,
      checkUnit,
      checkDigit,
      targetLabel: describeUnit(targetUnit),
      checkLabel: describeUnit(checkUnit),
      lower,
      upper,
      percent,
      action: checkDigit >= 5 ? '切り上げ' : 'そのまま',
      actionShort: checkDigit >= 5 ? '上へ' : 'そのまま',
    };
  }

  function makeValue(targetUnit, checkUnit, checkDigit, kept, tail) {
    return kept * targetUnit + checkDigit * checkUnit + Math.min(tail || 0, checkUnit - 1);
  }

  function createRoundDigitQuestion(checkPlaceKey, forcedValue) {
    const checkPlace = PLACE_BY_KEY[checkPlaceKey];
    const targetUnit = checkPlace.unit * 10;
    const value = forcedValue == null ? randomInt(targetUnit * 12, Math.min(987654, targetUnit * 987 + 89)) : forcedValue;
    const answer = roundToUnit(value, targetUnit);
    const checkDigit = getDigit(value, checkPlace.unit);
    return {
      id: `round-digit-${checkPlaceKey}-${value}`,
      type: 'round-digit',
      stageId: 'round-digit',
      value,
      answer,
      visual: makeVisual(value, answer, targetUnit, checkPlace.unit, checkDigit),
      prompt: `${formatNumber(value)}を${checkPlace.label}で四捨五入しましょう。`,
      label: '指定された位を見る',
      support: `${checkPlace.label}の数字を見ます。5以上なら、ひとつ左の位を1上げます。`,
      explanation: `${formatNumber(value)}の${checkPlace.label}は${checkDigit}です。${checkDigit}は${checkDigit >= 5 ? '5以上なので、ひとつ左の位を1上げます' : '4以下なので、そのままです'}。答えは${formatNumber(answer)}です。`,
    };
  }

  function createRoundPlaceQuestion(placeKey, forcedValue) {
    const place = PLACE_BY_KEY[placeKey];
    const checkUnit = Math.max(1, place.unit / 10);
    const value = forcedValue == null ? randomInt(place.unit * 12, Math.min(987654, place.unit * 987 + 89)) : forcedValue;
    const answer = roundToUnit(value, place.unit);
    const checkDigit = getDigit(value, checkUnit);
    return {
      id: `round-place-${placeKey}-${value}`,
      type: 'round-place',
      stageId: 'round-place',
      value,
      answer,
      visual: makeVisual(value, answer, place.unit, checkUnit, checkDigit),
      prompt: `${formatNumber(value)}を${place.label}までのがい数にしましょう。`,
      label: '残す位を決める',
      support: `${place.label}まで残すので、すぐ右の${describeUnit(checkUnit)}を見ます。5以上なら、残す位を1上げます。`,
      explanation: `${formatNumber(value)}の${describeUnit(checkUnit)}は${checkDigit}です。${checkDigit}は${checkDigit >= 5 ? '5以上なので、残す位を1上げます' : '4以下なので、そのままです'}。答えは${formatNumber(answer)}です。`,
    };
  }

  function roundToSignificantDigits(value, digits) {
    const topUnit = mostSignificantUnit(value);
    const targetUnit = topUnit / (10 ** (digits - 1));
    return roundToUnit(value, targetUnit);
  }

  function createSignificantQuestion(digits, forcedValue) {
    const value = forcedValue == null ? randomInt(1023, 987654) : forcedValue;
    const topUnit = mostSignificantUnit(value);
    const targetUnit = topUnit / (10 ** (digits - 1));
    const checkUnit = targetUnit / 10;
    const checkDigit = getDigit(value, checkUnit);
    const answer = roundToUnit(value, targetUnit);
    return {
      id: `significant-${digits}-${value}`,
      type: 'significant',
      stageId: 'significant',
      value,
      digits,
      answer,
      visual: makeVisual(value, answer, targetUnit, checkUnit, checkDigit),
      prompt: `${formatNumber(value)}を上から${digits}けたのがい数にしましょう。`,
      label: '上から何けた残すか',
      support: `左から${digits}けた残します。次の${describeUnit(checkUnit)}を見ます。5以上なら、残す位を1上げます。`,
      explanation: `${formatNumber(value)}は${describeUnit(targetUnit)}まで残します。次の${describeUnit(checkUnit)}は${checkDigit}です。${checkDigit}は${checkDigit >= 5 ? '5以上なので、残す位を1上げます' : '4以下なので、そのままです'}。答えは${formatNumber(answer)}です。`,
    };
  }

  function createSignificantPlannedQuestion(plan, checkDigit) {
    const targetUnit = 10 ** (plan.totalDigits - plan.digits);
    const checkUnit = targetUnit / 10;
    const value = makeValue(targetUnit, checkUnit, checkDigit, plan.kept, plan.tail);
    return createSignificantQuestion(plan.digits, value);
  }

  function varyKept(value, digits, cycle) {
    const min = 10 ** (digits - 1);
    const max = (10 ** digits) - 1;
    return min + ((value - min + cycle * 17) % (max - min + 1));
  }

  function varyPlan(stageId, plan, index, planCount) {
    if (!plan) return plan;
    const cycle = Math.floor(index / Math.max(1, planCount || SESSION_LENGTH));
    if (!cycle) return { ...plan };
    if (stageId === 'significant' || plan.type === 'significant') {
      return {
        ...plan,
        kept: varyKept(plan.kept, plan.digits, cycle),
        tail: (Number(plan.tail) || 0) + cycle,
      };
    }
    return {
      ...plan,
      kept: plan.kept + cycle * 17,
      tail: (Number(plan.tail) || 0) + cycle,
    };
  }

  function decorateQuestion(question, plan) {
    if (plan && plan.level) question.level = plan.level;
    return question;
  }

  function finalMixPrompt(question, plan, index) {
    const contexts = {
      'round-digit': [
        (q, p) => `体育館に${formatNumber(q.value)}人います。${PLACE_BY_KEY[p.place].label}で四捨五入した人数を答えましょう。`,
        (q, p) => `本棚に${formatNumber(q.value)}冊あります。${PLACE_BY_KEY[p.place].label}で四捨五入した冊数を答えましょう。`,
        (q, p) => `代金は${formatNumber(q.value)}円です。${PLACE_BY_KEY[p.place].label}で四捨五入した金額を答えましょう。`,
      ],
      'round-place': [
        (q, p) => `町の人口は${formatNumber(q.value)}人です。${PLACE_BY_KEY[p.place].label}までのがい数で表しましょう。`,
        (q, p) => `図書館の本は${formatNumber(q.value)}冊です。${PLACE_BY_KEY[p.place].label}までのがい数で表しましょう。`,
        (q, p) => `売上は${formatNumber(q.value)}円です。${PLACE_BY_KEY[p.place].label}までのがい数で表しましょう。`,
      ],
      significant: [
        (q, p) => `来場者は${formatNumber(q.value)}人です。上から${p.digits}けたのがい数で表しましょう。`,
        (q, p) => `走ったきょりは${formatNumber(q.value)}mです。上から${p.digits}けたのがい数で表しましょう。`,
        (q, p) => `集めた点数は${formatNumber(q.value)}点です。上から${p.digits}けたのがい数で表しましょう。`,
      ],
    };
    const options = contexts[question.type] || [];
    const makePrompt = options[index % Math.max(1, options.length)];
    return makePrompt ? makePrompt(question, plan) : question.prompt;
  }

  function createStageQuestion(stageId, index) {
    const plans = STAGE_PLANS[stageId] || [];
    const basePlan = plans[index % Math.max(1, plans.length)];
    const plan = varyPlan(stageId, basePlan, index, plans.length);
    const checkDigit = CHECK_DIGIT_ORDER[index % CHECK_DIGIT_ORDER.length];
    if (plan && stageId === 'round-digit') {
      const checkPlace = PLACE_BY_KEY[plan.place];
      const value = makeValue(checkPlace.unit * 10, checkPlace.unit, checkDigit, plan.kept, plan.tail);
      return decorateQuestion(createRoundDigitQuestion(plan.place, value), plan);
    }
    if (plan && stageId === 'round-place') {
      const place = PLACE_BY_KEY[plan.place];
      const value = makeValue(place.unit, Math.max(1, place.unit / 10), checkDigit, plan.kept, plan.tail);
      return decorateQuestion(createRoundPlaceQuestion(plan.place, value), plan);
    }
    if (plan && stageId === 'significant') {
      return decorateQuestion(createSignificantPlannedQuestion(plan, checkDigit), plan);
    }
    if (plan && stageId === 'final-mix') {
      const question = createMixedPlannedQuestion(plan, checkDigit);
      const typeOccurrence = Array.from({ length: index + 1 }, (_, itemIndex) => plans[itemIndex % plans.length])
        .filter((item) => item && item.type === plan.type).length - 1;
      question.stageId = 'final-mix';
      question.id = `final-mix-${question.id}`;
      question.prompt = finalMixPrompt(question, plan, typeOccurrence);
      question.label = `まとめ: ${TYPE_LABELS[question.type] || question.label}`;
      question.support = `${TYPE_LABELS[question.type] || '問題のことば'}を見分けます。${question.support}`;
      return decorateQuestion(question, plan);
    }
    if (stageId === 'round-digit') {
      return createRoundDigitQuestion(['ones', 'tens', 'hundreds', 'thousands'][index % 4]);
    }
    if (stageId === 'round-place') {
      return createRoundPlaceQuestion(['tens', 'hundreds', 'thousands', 'tenThousands'][index % 4]);
    }
    return createSignificantQuestion(index % 2 === 0 ? 2 : 3);
  }

  function createMixedPlannedQuestion(plan, checkDigit) {
    if (plan.type === 'round-digit') {
      const checkPlace = PLACE_BY_KEY[plan.place];
      const value = makeValue(checkPlace.unit * 10, checkPlace.unit, checkDigit, plan.kept, plan.tail);
      return createRoundDigitQuestion(plan.place, value);
    }
    if (plan.type === 'round-place') {
      const place = PLACE_BY_KEY[plan.place];
      const value = makeValue(place.unit, Math.max(1, place.unit / 10), checkDigit, plan.kept, plan.tail);
      return createRoundPlaceQuestion(plan.place, value);
    }
    return createSignificantPlannedQuestion(plan, checkDigit);
  }

  function createQuestion(index) {
    const stage = STAGES[index % STAGES.length];
    return createStageQuestion(stage.id, index);
  }

  function normalizeAnswerText(input) {
    return String(input || '')
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[，、]/g, ',')
      .replace(/[^\d,]/g, '');
  }

  function normalizeAnswer(input) {
    const text = normalizeAnswerText(input).replace(/,/g, '');
    if (!/^\d+$/.test(text)) return null;
    return Number(text);
  }

  function checkAnswer(question, input) {
    const normalized = normalizeAnswer(input);
    return {
      normalized,
      correct: normalized === question.answer,
    };
  }

  function defaultProgress() {
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  }

  function normalizeProgress(progress) {
    const base = defaultProgress();
    if (!progress || typeof progress !== 'object') return base;
    return {
      sessions: Math.max(0, Number(progress.sessions) || 0),
      best: Math.max(0, Number(progress.best) || 0),
      bestStreak: Math.max(0, Number(progress.bestStreak) || 0),
      materials: Math.max(0, Number(progress.materials) || 0),
      mistakes: progress.mistakes && typeof progress.mistakes === 'object' ? progress.mistakes : {},
      stageWins: progress.stageWins && typeof progress.stageWins === 'object' ? progress.stageWins : {},
    };
  }

  function encodeBase64Url(text) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(text, 'utf8').toString('base64url');
    }
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function decodeBase64Url(text) {
    const normalized = String(text || '').trim().replace(/^RQ1-/, '').replace(/-/g, '+').replace(/_/g, '/');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(normalized, 'base64').toString('utf8');
    }
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function exportProgressCode(progress) {
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      progress: normalizeProgress(progress),
    };
    return `${TRANSFER_PREFIX}${encodeBase64Url(JSON.stringify(payload))}`;
  }

  function importProgressCode(code) {
    try {
      const payload = JSON.parse(decodeBase64Url(code));
      if (!payload || payload.version !== 1 || !payload.progress) {
        return { ok: false, error: 'このコードは読みこめません。' };
      }
      return { ok: true, progress: normalizeProgress(payload.progress), savedAt: payload.savedAt || '' };
    } catch (_) {
      return { ok: false, error: 'コードの文字が足りないか、別のコードのようです。' };
    }
  }

  function loadProgress(storage) {
    try {
      return normalizeProgress(JSON.parse(storage.getItem(STORAGE_KEY)));
    } catch (_) {
      return defaultProgress();
    }
  }

  function saveProgress(storage, progress) {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
  }

  root.RoundingCore = {
    PLACE_DEFS,
    STAGES,
    STORAGE_KEY,
    SESSION_LENGTH,
    STAGE_GOAL,
    getStage,
    createQuestion,
    createStageQuestion,
    createRoundDigitQuestion,
    createRoundPlaceQuestion,
    createSignificantQuestion,
    checkAnswer,
    normalizeAnswerText,
    formatNumber,
    defaultProgress,
    exportProgressCode,
    importProgressCode,
    loadProgress,
    saveProgress,
    roundToUnit,
    roundToSignificantDigits,
  };

  if (typeof module !== 'undefined') module.exports = root.RoundingCore;
})(typeof window !== 'undefined' ? window : globalThis);
