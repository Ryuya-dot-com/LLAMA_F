/* ===========================================================
 * LLAMA F (Grammatical Inferencing Test, local implementation)
 *
 * Artificial language: "Velmoran" (constructed for this test)
 *
 * Lexicon
 *   Nouns:    mela=woman drun=man kira=girl tovo=boy
 *             niva=cat   bali=dog  sero=bird
 *   Objects:  fava=apple groni=ball kelo=book voren=flower
 *   Verbs:    shen=holds moval=eats dosko=watches harik=chases
 *
 * Grammar rules to infer
 *   R1. Word order:        Subject - Verb - Object  (SVO)
 *   R2. Plural noun:       prefix  "i-"   (mela -> imela; fava -> ifava)
 *   R3. Plural verb agr.:  suffix  "-na"  (shen -> shenna)  when subject is plural
 *   R4. Direct object:     suffix  "-ot"  on the object NP (favaot, ikeloot)
 *
 * Picture format
 *   Each picture is rendered as:  [SUBJ emoji(s)]  [ACTION emoji]  [OBJ emoji(s)]
 *   Subject / object counts encode singular / plural visually.
 * =========================================================== */

/* ----------------- Training items (18) ----------------- */
const TRAINING = [
  // sg subject, sg object
  { id: "T01", subj: "👩", subN: 1, act: "🤲", obj: "🍎", objN: 1, sentence: "mela shen favaot" },
  { id: "T02", subj: "🧑", subN: 1, act: "🤲", obj: "⚽", objN: 1, sentence: "drun shen groniot" },
  { id: "T03", subj: "👧", subN: 1, act: "🍽️", obj: "🍎", objN: 1, sentence: "kira moval favaot" },
  { id: "T04", subj: "👦", subN: 1, act: "🍽️", obj: "🍎", objN: 1, sentence: "tovo moval favaot" },
  { id: "T05", subj: "🐱", subN: 1, act: "🍽️", obj: "🐦", objN: 1, sentence: "niva moval seroot" },
  { id: "T06", subj: "🐶", subN: 1, act: "🏃", obj: "🐱", objN: 1, sentence: "bali harik nivaot" },
  { id: "T07", subj: "👩", subN: 1, act: "👀", obj: "🐶", objN: 1, sentence: "mela dosko baliot" },
  { id: "T08", subj: "🧑", subN: 1, act: "🤲", obj: "💐", objN: 1, sentence: "drun shen vorenot" },
  // pl subject, sg object
  { id: "T09", subj: "👩", subN: 2, act: "🤲", obj: "🍎", objN: 1, sentence: "imela shenna favaot" },
  { id: "T10", subj: "🧑", subN: 2, act: "🤲", obj: "⚽", objN: 1, sentence: "idrun shenna groniot" },
  { id: "T11", subj: "👦", subN: 2, act: "🤲", obj: "📖", objN: 1, sentence: "itovo shenna keloot" },
  { id: "T12", subj: "🐱", subN: 2, act: "🍽️", obj: "🐦", objN: 1, sentence: "iniva movalna seroot" },
  { id: "T13", subj: "🐶", subN: 2, act: "🏃", obj: "🐱", objN: 1, sentence: "ibali harikna nivaot" },
  // sg subject, pl object
  { id: "T14", subj: "👩", subN: 1, act: "🤲", obj: "📖", objN: 2, sentence: "mela shen ikeloot" },
  { id: "T15", subj: "👦", subN: 1, act: "🍽️", obj: "🍎", objN: 2, sentence: "tovo moval ifavaot" },
  { id: "T16", subj: "🧑", subN: 1, act: "🤲", obj: "⚽", objN: 2, sentence: "drun shen igroniot" },
  // pl subject, pl object
  { id: "T17", subj: "👩", subN: 2, act: "🤲", obj: "🍎", objN: 2, sentence: "imela shenna ifavaot" },
  { id: "T18", subj: "👦", subN: 2, act: "🤲", obj: "📖", objN: 2, sentence: "itovo shenna ikeloot" }
];

/* ----------------- Test items (20, 2AFC) -----------------
 * `correct` indicates which choice (A or B) is the
 * grammatically + picture-matching sentence. `violation`
 * documents which Velmoran rule the distractor breaks.
 */
const TEST = [
  { id: "Q01", subj: "👩", subN: 1, act: "🤲", obj: "🍎", objN: 1,
    a: "mela shen favaot", b: "mela shenna favaot",
    correct: "A", violation: "R3 (pl verb with sg subject)" },

  { id: "Q02", subj: "👦", subN: 2, act: "🤲", obj: "📖", objN: 1,
    a: "tovo shenna keloot", b: "itovo shenna keloot",
    correct: "B", violation: "R2 (missing pl on subject)" },

  { id: "Q03", subj: "🧑", subN: 1, act: "🤲", obj: "⚽", objN: 2,
    a: "drun shen igroniot", b: "drun shen groniot",
    correct: "A", violation: "R2 (missing pl on object)" },

  { id: "Q04", subj: "👧", subN: 1, act: "🍽️", obj: "🍎", objN: 1,
    a: "kira moval fava", b: "kira moval favaot",
    correct: "B", violation: "R4 (missing object marker)" },

  { id: "Q05", subj: "🐶", subN: 1, act: "🏃", obj: "🐱", objN: 1,
    a: "niva harik baliot", b: "bali harik nivaot",
    correct: "B", violation: "subject/object identification" },

  { id: "Q06", subj: "🐱", subN: 2, act: "🍽️", obj: "🐦", objN: 1,
    a: "iniva movalna seroot", b: "iniva moval seroot",
    correct: "A", violation: "R3 (missing pl verb agreement)" },

  { id: "Q07", subj: "👩", subN: 2, act: "🤲", obj: "🍎", objN: 2,
    a: "mela shenna ifavaot", b: "imela shenna ifavaot",
    correct: "B", violation: "R2 (missing pl on subject)" },

  { id: "Q08", subj: "👦", subN: 1, act: "🍽️", obj: "🍎", objN: 2,
    a: "tovo movalna ifavaot", b: "tovo moval ifavaot",
    correct: "B", violation: "R3 (pl verb with sg subject)" },

  { id: "Q09", subj: "🧑", subN: 1, act: "🤲", obj: "💐", objN: 1,
    a: "drun shen vorenot", b: "drun vorenot shen",
    correct: "A", violation: "R1 (SOV instead of SVO)" },

  { id: "Q10", subj: "👩", subN: 1, act: "👀", obj: "🐶", objN: 1,
    a: "mela dosko bali", b: "mela dosko baliot",
    correct: "B", violation: "R4 (missing object marker)" },

  { id: "Q11", subj: "👩", subN: 2, act: "🤲", obj: "💐", objN: 1,
    a: "imela shenna vorenot", b: "imela shen vorenot",
    correct: "A", violation: "R3 (missing pl verb agreement)" },

  { id: "Q12", subj: "🐶", subN: 2, act: "🏃", obj: "🐱", objN: 2,
    a: "ibali harikna inivaot", b: "ibali harikna nivaot",
    correct: "A", violation: "R2 (missing pl on object)" },

  { id: "Q13", subj: "👧", subN: 1, act: "🤲", obj: "📖", objN: 2,
    a: "kira shen kelo", b: "kira shen ikeloot",
    correct: "B", violation: "R2 + R4 (missing pl and object marker)" },

  { id: "Q14", subj: "👧", subN: 1, act: "🍽️", obj: "🍎", objN: 1,
    a: "favaot moval kira", b: "kira moval favaot",
    correct: "B", violation: "R1 (OVS reverse order)" },

  { id: "Q15", subj: "👦", subN: 2, act: "🤲", obj: "📖", objN: 2,
    a: "itovo shenna ikeloot", b: "tovo shen kelo",
    correct: "A", violation: "R2 + R3 + R4 (no plural marking at all)" },

  { id: "Q16", subj: "🐱", subN: 1, act: "🍽️", obj: "🐦", objN: 1,
    a: "niva moval seroot", b: "niva movalna seroot",
    correct: "A", violation: "R3 (pl verb with sg subject)" },

  { id: "Q17", subj: "👩", subN: 1, act: "🤲", obj: "🍎", objN: 2,
    a: "imela shen ifavaot", b: "mela shen ifavaot",
    correct: "B", violation: "R2 (incorrect pl on sg subject)" },

  { id: "Q18", subj: "🧑", subN: 1, act: "🏃", obj: "👦", objN: 1,
    a: "drun harik tovoot", b: "tovo harik drunot",
    correct: "A", violation: "subject/object identification" },

  { id: "Q19", subj: "🐶", subN: 2, act: "🏃", obj: "🐦", objN: 1,
    a: "ibali harikna seroot", b: "bali harikna seroot",
    correct: "A", violation: "R2 (missing pl on subject)" },

  { id: "Q20", subj: "👦", subN: 1, act: "🤲", obj: "📖", objN: 1,
    a: "tovo shenna keloot", b: "tovo shen keloot",
    correct: "B", violation: "R3 (pl verb with sg subject)" }
];

/* ----------------- i18n ----------------- */
const I18N = {
  ja: {
    subtitle: "5分間で未知言語の文と絵のペアを観察し、文法規則を推測します。テストでは絵に合う文を A と B から選びます。",
    badge: "文法推測テスト",
    intro_heading: "はじめに",
    intro_step1: "学習フェーズ（5分間）: 18個の絵と未知言語の文のペアを観察します。",
    intro_step2: "開始から2分後に「テスト開始」が有効になります。準備ができれば早めに進めます。",
    intro_step3: "テスト（全20問）: 絵を見て、AとBの2文のうち絵を正しく説明している方を選びます。",
    id_label: "ID（1〜15文字の英大文字・数字）",
    id_placeholder: "例: SUBJ001",
    id_hint: "入力できるのは A-Z と 0-9 のみです（1〜15文字）",
    id_error: "IDは英大文字と数字で1〜15文字入力してください。",
    start_btn: "開始",
    rotate_alert: "スマートフォンは横向きでの操作を推奨します。",
    learn_heading: "学習フェーズ",
    id_display: "ID:",
    learn_hint: "各カードは絵と、その絵を説明する未知言語の文のペアです。文と絵の対応関係を観察してください。",
    learn_callout: "学習中",
    start_test_btn: "テスト開始",
    test_heading: "テストフェーズ",
    test_prompt_first: "「次へ」を押して最初の問題を表示してください。",
    test_prompt: "下の絵を正しく説明している文を A と B から選んでください。",
    test_prompt_end: "すべての問題に回答しました。「終了」を押して結果へ進んでください。",
    next_btn: "次へ",
    end_btn: "終了",
    result_heading: "結果",
    score_label: "の得点:",
    score_summary_high: "非常に高い文法推測力です。短時間で複数の規則を正確に推測できています。",
    score_summary_good: "良好な成績です。主要な規則を概ね捉えています。",
    score_summary_avg: "標準的な範囲です。",
    score_summary_low: "チャンス（=10）に近い、または下回る結果でした。",
    download_note: "結果ファイルをダウンロードしました:",
    restart_btn: "もう一度",
    exit_fullscreen_btn: "全画面を終了",
    timer_format: (m, s) => `${m}分${String(s).padStart(2, "0")}秒`,
    timer_end: "時間終了",
    timer_initial: "5分00秒",
    toggle_target_label: "EN"
  },
  en: {
    subtitle: "For 5 minutes, observe sentence-picture pairs in an unknown language and infer the grammar. In the test, choose A or B to describe each picture.",
    badge: "Grammatical Inference",
    intro_heading: "Instructions",
    intro_step1: "Training phase (5 minutes): observe 18 picture-sentence pairs in an unknown language.",
    intro_step2: "The \"Start Test\" button becomes active after 2 minutes. You may proceed early once you feel ready.",
    intro_step3: "Test (20 trials): for each picture, choose whichever of the two sentences (A or B) correctly describes it.",
    id_label: "ID (1–15 alphanumeric)",
    id_placeholder: "e.g. SUBJ001",
    id_hint: "A–Z and 0–9 only, 1–15 characters",
    id_error: "ID must be 1–15 uppercase letters or digits.",
    start_btn: "Start",
    rotate_alert: "Landscape orientation is recommended on phones.",
    learn_heading: "Training",
    id_display: "ID:",
    learn_hint: "Each card pairs a picture with a sentence describing it. Observe how the sentences relate to the pictures.",
    learn_callout: "Studying",
    start_test_btn: "Start Test",
    test_heading: "Test",
    test_prompt_first: "Press \"Next\" to show the first trial.",
    test_prompt: "Choose A or B — the sentence that correctly describes the picture.",
    test_prompt_end: "You've answered all trials. Press \"Finish\" to see your result.",
    next_btn: "Next",
    end_btn: "Finish",
    result_heading: "Result",
    score_label: "score:",
    score_summary_high: "Outstanding grammatical inference — you picked up multiple rules quickly and accurately.",
    score_summary_good: "Good performance. You captured the major rules.",
    score_summary_avg: "Within the typical range.",
    score_summary_low: "Near or below chance level (= 10).",
    download_note: "Result file downloaded:",
    restart_btn: "Restart",
    exit_fullscreen_btn: "Exit Fullscreen",
    timer_format: (m, s) => `${m}m ${String(s).padStart(2, "0")}s`,
    timer_end: "Time's up",
    timer_initial: "5m 00s",
    toggle_target_label: "日本語"
  }
};

function detectInitialLang() {
  try {
    const saved = localStorage.getItem("llama_f_lang");
    if (saved === "ja" || saved === "en") return saved;
  } catch (e) { /* localStorage may be unavailable */ }
  const nav = (navigator.language || "ja").toLowerCase();
  return nav.startsWith("ja") ? "ja" : "en";
}

function t(key) {
  const dict = I18N[currentLang] || I18N.ja;
  return dict[key];
}

let currentLang = "ja";

function applyI18n() {
  const dict = I18N[currentLang] || I18N.ja;
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (typeof dict[key] === "string") el.textContent = dict[key];
  });
  // Placeholder for ID input
  const idInput = document.getElementById("identifier-input");
  if (idInput) idInput.placeholder = dict.id_placeholder || "";
  // Language toggle label
  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.textContent = dict.toggle_target_label;
  // Title (browser tab) stays "LLAMA F" in both languages — no change needed.
  // Re-render any phase-dependent dynamic strings:
  refreshDynamicText();
}

function refreshDynamicText() {
  // Timer (only if in learn phase and not finished)
  if (state.learningLocked) {
    learnTimer.textContent = t("timer_end");
  } else if (!state.learningStartedAt) {
    learnTimer.textContent = t("timer_initial");
  }
  // Test prompt depending on current state
  if (state.testLocked) {
    testPrompt.textContent = t("test_prompt_end");
  } else if (state.testIndex === 0) {
    testPrompt.textContent = t("test_prompt_first");
  } else {
    testPrompt.textContent = t("test_prompt");
  }
}

function setLanguage(lang) {
  if (lang !== "ja" && lang !== "en") return;
  currentLang = lang;
  try { localStorage.setItem("llama_f_lang", lang); } catch (e) { /* noop */ }
  applyI18n();
  logEvent("language_change", { detail: lang });
}

/* ----------------- State ----------------- */
const state = {
  identifier: "",
  testIndex: 0,
  answers: [],            // final "A" | "B" per trial (= last click)
  firstAnswers: [],       // first "A" | "B" clicked per trial
  trialRtFirstMs: [],     // ms from picture appearance to FIRST click
  trialRtFinalMs: [],     // ms from picture appearance to FINAL (recorded) click
  trialChangeCount: [],   // number of A<->B switches within trial
  trialClicksLog: [],     // [[{letter, t_ms_since_test_start}, ...], ...]
  timerId: null,
  enableId: null,
  endLockId: null,
  learningLocked: false,
  testLocked: false,
  pageLoadedAt: null,         // Date at script execution
  pageLoadedPerf: 0,          // performance.now() reference origin
  learningStartedAt: null,
  trainingEndedAt: null,      // when "Start Test" was clicked / auto-lock fired
  testStartedAt: null,
  testStartedPerf: 0,         // performance.now() at test start
  testEndedAt: null,
  trialStartedAt: null,       // performance.now() of current trial's picture display
  learnOrder: [],
  testOrder: [],
  events: [],                 // detailed behavior log (see logEvent)
  nBlur: 0,                   // count of window blur events
  nFocus: 0,
  nFullscreenChange: 0,
  nVisibilityHidden: 0
};

/* Total training duration (5 min) and unlock delay (2 min) for "Start Test" */
const TRAIN_TOTAL_MS = 5 * 60 * 1000;
const TRAIN_UNLOCK_MS = 2 * 60 * 1000;

/* ----------------- DOM ----------------- */
const panels = {
  intro: document.querySelector('[data-panel="intro"]'),
  learn: document.querySelector('[data-panel="learn"]'),
  test: document.querySelector('[data-panel="test"]'),
  result: document.querySelector('[data-panel="result"]')
};

const identifierForm = document.getElementById("identifier-form");
const identifierInput = document.getElementById("identifier-input");
const identifierError = document.getElementById("identifier-error");
const identifierDisplay = document.getElementById("identifier-display");
const identifierDisplay2 = document.getElementById("identifier-display-2");
const learnTimer = document.getElementById("learn-timer");
const learnGrid = document.getElementById("learn-grid");
const startTestBtn = document.getElementById("start-test");
const testPic = document.getElementById("test-pic");
const testPrompt = document.getElementById("test-prompt");
const choicesEl = document.getElementById("choices");
const choiceA = document.getElementById("choice-a");
const choiceB = document.getElementById("choice-b");
const choiceAText = document.getElementById("choice-a-text");
const choiceBText = document.getElementById("choice-b-text");
const nextBtn = document.getElementById("next-btn");
const endBtn = document.getElementById("end-btn");
const progressDisplay = document.getElementById("progress-display");
const resultId = document.getElementById("result-id");
const scoreTotal = document.getElementById("score-total");
const scoreMax = document.getElementById("score-max");
const scoreFill = document.getElementById("score-fill");
const scoreSummary = document.getElementById("score-summary");
const downloadNote = document.getElementById("download-note");
const restartBtn = document.getElementById("restart-btn");
const exitFullscreenBtn = document.getElementById("exit-fullscreen");

/* ----------------- Helpers ----------------- */
function showPanel(name) {
  Object.keys(panels).forEach((key) => {
    panels[key].classList.toggle("is-active", key === name);
  });
}

/* Log a behavioral event with absolute and relative timestamps. */
function logEvent(eventType, extra = {}) {
  const now = new Date();
  const perfNow = performance.now();
  state.events.push({
    iso: now.toISOString(),
    ts: formatTimestamp(now),
    t_since_pageload_ms: state.pageLoadedPerf ? Math.round(perfNow - state.pageLoadedPerf) : 0,
    t_since_test_start_ms:
      state.testStartedAt && state.testStartedPerf
        ? Math.round(perfNow - state.testStartedPerf)
        : "",
    phase: currentPhase(),
    trial: state.testIndex || "",
    event: eventType,
    ...extra
  });
}

function currentPhase() {
  const active = document.querySelector(".panel.is-active");
  return active ? active.dataset.panel : "intro";
}

function durationSeconds(startDate, endDate) {
  if (!startDate || !endDate) return "";
  return Math.round((endDate.getTime() - startDate.getTime()) / 1000);
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValidIdentifier(value) {
  return /^[A-Z0-9]{1,15}$/.test(value);
}

function cleanIdentifier(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function setIdentifier(value) {
  state.identifier = value;
  identifierDisplay.textContent = value;
  identifierDisplay2.textContent = value;
  resultId.textContent = value;
}

function repeatGlyph(glyph, count) {
  return glyph.repeat(Math.max(1, count));
}

function pictureHtml(item) {
  return `
    <span class="subj" aria-hidden="true">${repeatGlyph(item.subj, item.subN)}</span>
    <span class="action" aria-hidden="true">${item.act}</span>
    <span class="obj" aria-hidden="true">${repeatGlyph(item.obj, item.objN)}</span>
  `;
}

/* ----------------- Training ----------------- */
function buildLearningGrid(items = TRAINING) {
  learnGrid.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("figure");
    card.className = "learn-card";
    card.innerHTML = `
      <div class="picture">${pictureHtml(item)}</div>
      <figcaption class="sentence">${item.sentence}</figcaption>
    `;
    learnGrid.appendChild(card);
  });
}

function initRandomization() {
  state.learnOrder = shuffleArray(TRAINING);
  state.testOrder = shuffleArray(TEST);
  buildLearningGrid(state.learnOrder);
}

function startLearningTimer() {
  clearInterval(state.timerId);
  clearTimeout(state.enableId);
  clearTimeout(state.endLockId);
  state.learningLocked = false;
  learnGrid.classList.remove("is-locked");
  startTestBtn.disabled = true;

  const start = state.learningStartedAt ? state.learningStartedAt.getTime() : Date.now();
  const enableAt = start + TRAIN_UNLOCK_MS;
  const endAt = start + TRAIN_TOTAL_MS;

  state.enableId = window.setTimeout(() => {
    startTestBtn.disabled = false;
  }, Math.max(0, enableAt - Date.now()));

  state.endLockId = window.setTimeout(() => {
    state.learningLocked = true;
    learnGrid.classList.add("is-locked");
    learnTimer.textContent = t("timer_end");
    startTestBtn.disabled = false;
    if (!state.trainingEndedAt) {
      state.trainingEndedAt = new Date();
      logEvent("training_timeout");
    }
  }, Math.max(0, endAt - Date.now()));

  const updateTimer = () => {
    const now = Date.now();
    const remaining = Math.max(0, endAt - now);
    if (now >= enableAt) {
      startTestBtn.disabled = false;
    }
    if (remaining === 0) {
      clearInterval(state.timerId);
      return;
    }
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const fmt = t("timer_format");
    learnTimer.textContent = typeof fmt === "function" ? fmt(minutes, seconds) : `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  updateTimer();
  state.timerId = window.setInterval(updateTimer, 250);
}

/* ----------------- Test ----------------- */
function resetTestState() {
  state.testIndex = 0;
  state.answers = [];
  state.firstAnswers = [];
  state.trialRtFirstMs = [];
  state.trialRtFinalMs = [];
  state.trialChangeCount = [];
  state.trialClicksLog = [];
  state.testLocked = false;
  state.trialStartedAt = null;
  testPic.innerHTML = "";
  choiceAText.textContent = "—";
  choiceBText.textContent = "—";
  choiceA.classList.remove("is-selected");
  choiceB.classList.remove("is-selected");
  choicesEl.classList.remove("is-locked");
  nextBtn.disabled = true;
  endBtn.disabled = true;
  progressDisplay.textContent = `0 / ${state.testOrder.length}`;
  testPrompt.textContent = t("test_prompt_first");
}

function startTestPhase() {
  clearInterval(state.timerId);
  clearTimeout(state.enableId);
  clearTimeout(state.endLockId);
  if (!state.trainingEndedAt) {
    state.trainingEndedAt = new Date();
    logEvent("training_end");
  }
  state.testStartedAt = new Date();
  state.testStartedPerf = performance.now();
  resetTestState();
  logEvent("test_phase_start");
  // First press of "Next" reveals trial 1
  nextBtn.disabled = false;
  showPanel("test");
}

function renderTrial(item) {
  testPic.innerHTML = pictureHtml(item);
  choiceAText.textContent = item.a;
  choiceBText.textContent = item.b;
  choiceA.classList.remove("is-selected");
  choiceB.classList.remove("is-selected");
  choicesEl.classList.remove("is-locked");
  testPrompt.textContent = t("test_prompt");
}

function handleNext() {
  if (state.testLocked) return;
  const order = state.testOrder;
  if (state.testIndex >= order.length) return;

  state.testIndex += 1;
  const item = order[state.testIndex - 1];
  // Initialize per-trial fields
  state.trialClicksLog[state.testIndex - 1] = [];
  state.firstAnswers[state.testIndex - 1] = "";
  state.trialChangeCount[state.testIndex - 1] = 0;
  state.trialRtFirstMs[state.testIndex - 1] = null;
  state.trialRtFinalMs[state.testIndex - 1] = null;
  state.trialStartedAt = performance.now();
  renderTrial(item);
  logEvent("trial_shown", { item_id: item.id });

  nextBtn.disabled = true;
  progressDisplay.textContent = `${state.testIndex} / ${order.length}`;
}

function handleChoice(letter, btn) {
  if (state.testLocked || state.testIndex === 0) return;
  const idx = state.testIndex - 1;
  const rt = state.trialStartedAt ? performance.now() - state.trialStartedAt : null;
  const prevFinal = state.answers[idx];

  // Track first click
  if (!state.firstAnswers[idx]) {
    state.firstAnswers[idx] = letter;
    state.trialRtFirstMs[idx] = rt;
  } else if (prevFinal && prevFinal !== letter) {
    // A switch (A->B or B->A)
    state.trialChangeCount[idx] += 1;
  }

  state.answers[idx] = letter;
  state.trialRtFinalMs[idx] = rt;
  (state.trialClicksLog[idx] || (state.trialClicksLog[idx] = [])).push({
    letter,
    t_ms: rt == null ? null : Math.round(rt)
  });

  logEvent("choice_click", {
    item_id: state.testOrder[idx].id,
    choice: letter,
    rt_ms: rt == null ? "" : Math.round(rt),
    is_first: !prevFinal ? 1 : 0
  });

  choiceA.classList.toggle("is-selected", btn === choiceA);
  choiceB.classList.toggle("is-selected", btn === choiceB);

  const order = state.testOrder;
  if (state.testIndex >= order.length) {
    state.testLocked = true;
    choicesEl.classList.add("is-locked");
    testPrompt.textContent = t("test_prompt_end");
    nextBtn.disabled = true;
    endBtn.disabled = false;
    return;
  }
  nextBtn.disabled = false;
}

/* ----------------- Scoring + CSV ----------------- */
function calculateScore() {
  const order = state.testOrder;
  let score = 0;
  for (let i = 0; i < order.length; i += 1) {
    if (state.answers[i] === order[i].correct) score += 1;
  }
  return score;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTimestamp(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const M = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const m = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${y}-${M}-${d} ${h}:${m}:${s}`;
}

function formatFileTimestamp(date) {
  if (!date) return "unknown";
  const y = date.getFullYear();
  const M = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  const m = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${y}${M}${d}_${h}${m}${s}`;
}

function toCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

/* ----------------- AOA (Array-of-arrays) data builders -----------------
 * Each function returns a 2D array suitable for both:
 *   (a) XLSX.utils.aoa_to_sheet  → Excel sheet
 *   (b) joining + CSV-escaping   → CSV file (fallback)
 */

function buildMetaRows(score) {
  const order = state.testOrder;
  const total = order.length;
  const scorePct = total ? Math.round((score / total) * 1000) / 10 : "";
  return [
    ["field", "value"],
    ["experiment_id", state.identifier],
    ["learning_start", formatTimestamp(state.learningStartedAt)],
    ["training_end", formatTimestamp(state.trainingEndedAt)],
    ["test_start", formatTimestamp(state.testStartedAt)],
    ["test_end", formatTimestamp(state.testEndedAt)],
    ["training_duration_s", durationSeconds(state.learningStartedAt, state.trainingEndedAt)],
    ["test_duration_s", durationSeconds(state.testStartedAt, state.testEndedAt)],
    ["score", score],
    ["total", total],
    ["score_pct", scorePct],
    ["n_window_blur", state.nBlur],
    ["n_window_focus", state.nFocus],
    ["n_visibility_hidden", state.nVisibilityHidden],
    ["n_fullscreen_change", state.nFullscreenChange],
    ["language_at_completion", currentLang],
    ["user_agent", navigator.userAgent || ""]
  ];
}

function buildWideRows(score) {
  const order = state.testOrder;
  const total = order.length;
  const scorePct = total ? Math.round((score / total) * 1000) / 10 : "";
  const canonicalIds = TEST.map((t) => t.id);
  const idToResult = {};
  order.forEach((item, index) => {
    const selected = state.answers[index] || "";
    idToResult[item.id] = {
      correct: selected === item.correct ? 1 : 0,
      rt_first_ms: state.trialRtFirstMs[index] == null ? "" : Math.round(state.trialRtFirstMs[index]),
      rt_final_ms: state.trialRtFinalMs[index] == null ? "" : Math.round(state.trialRtFinalMs[index]),
      n_changes: state.trialChangeCount[index] || 0
    };
  });

  const header = [
    "experiment_id", "score", "total", "score_pct",
    "training_duration_s", "test_duration_s",
    "n_window_blur", "n_window_focus", "n_visibility_hidden", "n_fullscreen_change",
    ...canonicalIds.map((id) => `correct_${id}`),
    ...canonicalIds.map((id) => `rt_first_ms_${id}`),
    ...canonicalIds.map((id) => `rt_final_ms_${id}`),
    ...canonicalIds.map((id) => `n_changes_${id}`)
  ];
  const row = [
    state.identifier, score, total, scorePct,
    durationSeconds(state.learningStartedAt, state.trainingEndedAt),
    durationSeconds(state.testStartedAt, state.testEndedAt),
    state.nBlur, state.nFocus, state.nVisibilityHidden, state.nFullscreenChange,
    ...canonicalIds.map((id) => (idToResult[id] ? idToResult[id].correct : "")),
    ...canonicalIds.map((id) => (idToResult[id] ? idToResult[id].rt_first_ms : "")),
    ...canonicalIds.map((id) => (idToResult[id] ? idToResult[id].rt_final_ms : "")),
    ...canonicalIds.map((id) => (idToResult[id] ? idToResult[id].n_changes : ""))
  ];
  return [header, row];
}

function buildTrialsRows() {
  const header = [
    "trial", "item_id", "sentence_a", "sentence_b",
    "correct_choice", "first_selected", "final_selected",
    "n_changes", "rt_first_ms", "rt_final_ms",
    "correct", "violation_type"
  ];
  const rows = state.testOrder.map((item, index) => {
    const finalSel = state.answers[index] || "";
    const firstSel = state.firstAnswers[index] || "";
    const rtFirst = state.trialRtFirstMs[index];
    const rtFinal = state.trialRtFinalMs[index];
    return [
      index + 1,
      item.id,
      item.a,
      item.b,
      item.correct,
      firstSel,
      finalSel,
      state.trialChangeCount[index] || 0,
      rtFirst == null ? "" : Math.round(rtFirst),
      rtFinal == null ? "" : Math.round(rtFinal),
      finalSel === item.correct ? 1 : 0,
      item.violation
    ];
  });
  return [header, ...rows];
}

function buildEventsRows() {
  const header = [
    "iso", "timestamp", "t_since_pageload_ms", "t_since_test_start_ms",
    "phase", "trial", "event", "item_id", "choice", "rt_ms", "is_first", "detail"
  ];
  const rows = state.events.map((e) => [
    e.iso,
    e.ts,
    e.t_since_pageload_ms,
    e.t_since_test_start_ms,
    e.phase,
    e.trial,
    e.event,
    e.item_id || "",
    e.choice || "",
    e.rt_ms == null || e.rt_ms === undefined ? "" : e.rt_ms,
    e.is_first == null || e.is_first === undefined ? "" : e.is_first,
    e.detail || ""
  ]);
  return [header, ...rows];
}

/* CSV serializer: AOA → CSV string */
function aoaToCsv(aoa) {
  return aoa.map((row) => row.map(toCsvValue).join(",")).join("\n");
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadResults(score) {
  const endedAt = state.testEndedAt || new Date();
  const ts = formatFileTimestamp(endedAt);
  const safeId = state.identifier && state.identifier !== "-" ? state.identifier : "participant";

  const metaRows = buildMetaRows(score);
  const wideRows = buildWideRows(score);
  const trialsRows = buildTrialsRows();
  const eventsRows = buildEventsRows();

  let downloadedFiles = [];

  if (typeof XLSX !== "undefined" && XLSX && XLSX.utils && XLSX.write) {
    // ===== XLSX path: single multi-sheet workbook =====
    const filename = `LLAMA_F_${safeId}_${ts}.xlsx`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaRows), "Meta");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wideRows), "Wide");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trialsRows), "Trials");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(eventsRows), "Events");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(filename, new Blob([wbout], { type: "application/octet-stream" }));
    downloadedFiles = [filename];
  } else {
    // ===== CSV fallback: 2 files (results + events) =====
    const csvBlob = (text) => new Blob([text], { type: "text/csv;charset=utf-8" });
    const resultsFilename = `LLAMA_F_${safeId}_${ts}.csv`;
    const eventsFilename = `LLAMA_F_${safeId}_${ts}_events.csv`;
    // Combine meta + blank + wide + blank + trials into the results CSV
    const resultsCsv = [
      aoaToCsv(metaRows),
      "",
      aoaToCsv(wideRows),
      "",
      aoaToCsv(trialsRows)
    ].join("\n");
    triggerDownload(resultsFilename, csvBlob(resultsCsv));
    triggerDownload(eventsFilename, csvBlob(aoaToCsv(eventsRows)));
    downloadedFiles = [resultsFilename, eventsFilename];
  }

  if (downloadNote) {
    const note = t("download_note");
    downloadNote.innerHTML =
      `${note}<br>` +
      downloadedFiles.map((f) => `&nbsp;&nbsp;・<code>${f}</code>`).join("<br>");
  }
}

function showResults() {
  state.testEndedAt = new Date();
  logEvent("test_phase_end");
  const score = calculateScore();
  const total = state.testOrder.length;
  scoreTotal.textContent = score;
  scoreMax.textContent = total;
  scoreFill.style.width = `${(score / total) * 100}%`;
  const summaryKey =
    score >= 16 ? "score_summary_high" :
    score >= 12 ? "score_summary_good" :
    score >= 8  ? "score_summary_avg" :
                  "score_summary_low";
  scoreSummary.textContent = t(summaryKey);

  showPanel("result");
  downloadResults(score);
}

/* ----------------- Misc ----------------- */
function requestFullscreen() {
  const root = document.documentElement;
  if (root.requestFullscreen) {
    root.requestFullscreen().catch(() => {});
  }
}

function exitFullscreen() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function resetAll() {
  clearInterval(state.timerId);
  clearTimeout(state.enableId);
  clearTimeout(state.endLockId);
  state.identifier = "";
  state.learningStartedAt = null;
  state.trainingEndedAt = null;
  state.testStartedAt = null;
  state.testStartedPerf = 0;
  state.testEndedAt = null;
  state.learnOrder = [];
  state.testOrder = [];
  state.events = [];
  state.nBlur = 0;
  state.nFocus = 0;
  state.nFullscreenChange = 0;
  state.nVisibilityHidden = 0;
  identifierInput.value = "";
  identifierError.textContent = "";
  setIdentifier("-");
  learnTimer.textContent = t("timer_initial");
  startTestBtn.disabled = true;
  scoreTotal.textContent = "0";
  scoreMax.textContent = TEST.length;
  scoreFill.style.width = "0%";
  scoreSummary.textContent = "";
  if (downloadNote) downloadNote.innerHTML = "";
  resetTestState();
  // After reset, the test order length isn't known yet; set the static fallback
  progressDisplay.textContent = `0 / ${TEST.length}`;
  showPanel("intro");
}

/* ----------------- Wiring ----------------- */
identifierInput.addEventListener("input", () => {
  const cleaned = cleanIdentifier(identifierInput.value);
  if (identifierInput.value !== cleaned) {
    identifierInput.value = cleaned;
  }
  if (identifierError.textContent) {
    identifierError.textContent = "";
  }
});

identifierForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = cleanIdentifier(identifierInput.value.trim());
  identifierInput.value = value;

  if (!isValidIdentifier(value)) {
    identifierError.textContent = t("id_error");
    identifierInput.focus();
    return;
  }

  setIdentifier(value);
  state.learningStartedAt = new Date();
  logEvent("learning_start");
  initRandomization();
  showPanel("learn");
  startLearningTimer();
  requestFullscreen();
});

startTestBtn.addEventListener("click", startTestPhase);
nextBtn.addEventListener("click", () => {
  logEvent("next_click");
  handleNext();
});
endBtn.addEventListener("click", () => {
  logEvent("end_click");
  showResults();
});
choiceA.addEventListener("click", () => handleChoice("A", choiceA));
choiceB.addEventListener("click", () => handleChoice("B", choiceB));
restartBtn.addEventListener("click", () => {
  logEvent("restart");
  resetAll();
});
exitFullscreenBtn.addEventListener("click", () => {
  logEvent("exit_fullscreen_click");
  exitFullscreen();
});

/* ----- Inattention / focus tracking ----- */
window.addEventListener("blur", () => {
  state.nBlur += 1;
  logEvent("window_blur");
});
window.addEventListener("focus", () => {
  state.nFocus += 1;
  logEvent("window_focus");
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    state.nVisibilityHidden += 1;
    logEvent("visibility_hidden");
  } else {
    logEvent("visibility_visible");
  }
});
document.addEventListener("fullscreenchange", () => {
  state.nFullscreenChange += 1;
  logEvent("fullscreen_change", {
    detail: document.fullscreenElement ? "entered" : "exited"
  });
});

/* ----- Language toggle ----- */
const langToggle = document.getElementById("lang-toggle");
if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLanguage(currentLang === "ja" ? "en" : "ja");
  });
}

/* ----- Page-load reference ----- */
state.pageLoadedAt = new Date();
state.pageLoadedPerf = performance.now();

// Initialize language BEFORE resetAll so all UI text is set in chosen language
currentLang = detectInitialLang();
applyI18n();

resetAll();
// Log page_load AFTER resetAll so the entry isn't wiped by event-array reset
logEvent("page_load", { detail: `lang=${currentLang}` });
