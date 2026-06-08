const { chromium } = require("@playwright/test");
const { pathToFileURL } = require("url");
const path = require("path");

const root = path.resolve(__dirname, "..");
const url = process.env.APP_URL || pathToFileURL(path.join(root, "index.html")).href;

async function enterCurrentAnswer(page) {
  const answer = await page.evaluate(() => window.__fractionDojo.answerCurrent());
  const digitButton = (digit) => page.locator("#keypad button").filter({ hasText: new RegExp(`^${digit}$`) });
  if (answer.d !== 1) {
    await page.locator("#denominatorBox").click();
    for (const digit of String(answer.d)) await digitButton(digit).click();
    await page.locator("#keypad button", { hasText: "分子へ" }).click();
  }
  await page.locator("#numeratorBox").click();
  for (const digit of String(answer.n)) await digitButton(digit).click();
}

async function startCleanPractice(page) {
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => window.__fractionDojo.clear());
  await page.reload({ waitUntil: "load" });
  await page.locator("#startButton").click();
  await page.locator("#practiceView").waitFor({ state: "visible" });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await startCleanPractice(page);
  await enterCurrentAnswer(page);
  await page.locator("#keypad button", { hasText: "答え合わせ！" }).click();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  const duringFx = await page.evaluate(() => ({
    totalCorrect: window.__fractionDojo.getProgress().totalCorrect,
    totalAnswered: window.__fractionDojo.getProgress().totalAnswered,
    locked: document.querySelector("#practiceView")?.classList.contains("answer-locked"),
  }));
  await page.waitForTimeout(700);
  const afterFx = await page.evaluate(() => ({
    totalCorrect: window.__fractionDojo.getProgress().totalCorrect,
    totalAnswered: window.__fractionDojo.getProgress().totalAnswered,
    index: window.__fractionDojo.getProgress().activeSession?.index,
    question: document.querySelector("#questionNumber")?.textContent,
  }));
  if (duringFx.totalCorrect !== 1 || duringFx.totalAnswered !== 1 || !duringFx.locked) {
    throw new Error(`double-submit lock failed during fx: ${JSON.stringify(duringFx)}`);
  }
  if (afterFx.totalCorrect !== 1 || afterFx.totalAnswered !== 1 || afterFx.index !== 1 || afterFx.question !== "2/10") {
    throw new Error(`double-submit lock failed after fx: ${JSON.stringify(afterFx)}`);
  }

  await page.evaluate(() => {
    const progress = window.__fractionDojo.getProgress();
    const question = progress.activeSession.questions[progress.activeSession.index];
    progress.pendingRetry = {
      rankIndex: progress.activeSession.rankIndex,
      correct: 0,
      mistakes: 1,
      previousRankStep: progress.rankStep,
      previousCorrect: progress.totalCorrect,
      createdAt: Date.now(),
      items: [{ question, studentAnswer: { n: question.answer.n + 1, d: question.answer.d } }],
    };
    progress.activeSession = null;
    localStorage.setItem("fractionDivisionDojo.v1", JSON.stringify(progress));
  });
  await page.reload({ waitUntil: "load" });
  const backupCode = await page.evaluate(() => window.__fractionDojo.encodeProgress());
  await page.evaluate((code) => {
    window.__fractionDojo.clear();
    window.__fractionDojo.restoreProgress(code);
  }, backupCode);
  const restored = await page.evaluate((code) => ({
    prefix: code.slice(0, 3),
    startText: document.querySelector("#startButton b")?.textContent,
    hasPendingRetry: Boolean(window.__fractionDojo.getProgress().pendingRetry),
  }), backupCode);
  if (restored.prefix !== "FS4" || restored.startText !== "やり直しモードへ" || !restored.hasPendingRetry) {
    throw new Error(`FS4 retry restore failed: ${JSON.stringify(restored)}`);
  }

  for (let run = 0; run < 12; run += 1) {
    await page.evaluate(() => {
      window.__fractionDojo.clear();
      window.__fractionDojo.setProgressForCheck({ rankStep: 1 });
    });
    await page.locator("#startButton").click();
    await page.locator("#practiceView").waitFor({ state: "visible" });
    const keys = await page.evaluate(() => window.__fractionDojo.getProgress().activeSession.questions.map((q) => `${q.left.n}/${q.left.d}÷${q.right.n}/${q.right.d}`));
    const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicate) throw new Error(`duplicate rank 1 question: ${duplicate} in ${JSON.stringify(keys)}`);
    await page.evaluate(() => window.__fractionDojo.clear());
  }

  await browser.close();
  console.log(JSON.stringify({ duringFx, afterFx, restored, duplicateRuns: 12 }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
