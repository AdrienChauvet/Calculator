const beachBg = "./assets/images/pixel_beach_brighter.webp";
const otterVikingsBg = "./assets/images/otter_vikings_bg.jpg";
const seagullsOpening = "./assets/audio/seagulls_opening.mp3";
const fireworksSound = "./assets/audio/fireworks_button.mp3";
const nuclearAlertSound = "./assets/audio/nuclear_alert_button.mp3";
const noteC = "./assets/audio/note_c.mp3";
const noteD = "./assets/audio/note_d.mp3";
const noteE = "./assets/audio/note_e.mp3";
const noteF = "./assets/audio/note_f.mp3";
const noteG = "./assets/audio/note_g.mp3";
const noteA = "./assets/audio/note_a.mp3";
const noteB = "./assets/audio/note_b.mp3";
const noteCHigh = "./assets/audio/note_c_high.mp3";

const BODY_COLORS = [
  "#C6120D",
  "#128FC6",
  "#12C64E",
  "#C67C12",
  "#7C12C6",
  "#C6127C",
];
const NOTE_URLS = [noteC, noteD, noteE, noteF, noteG, noteA, noteB, noteCHigh];
const BUTTON_NOTE_MAP = {
  7: 0,
  8: 1,
  9: 2,
  "÷": 3,
  4: 4,
  5: 5,
  6: 6,
  "×": 7,
  1: 0,
  2: 1,
  3: 2,
  "-": 3,
  0: 4,
  ".": 5,
  "=": 6,
  "+": 7,
  clear: 0,
};

const noteAudios = new Map();
const effectAudios = new Map();

function getAudio(cache, key, url, volume) {
  if (!cache.has(key)) {
    const audio = new Audio();
    audio.preload = "none";
    audio.src = url;
    audio.volume = volume;
    cache.set(key, audio);
  }
  return cache.get(key);
}

const openingAudio = document.querySelector(".opening-audio");
if (openingAudio) {
  openingAudio.loop = false;
  openingAudio.volume = 0.4;
  openingAudio.preload = "none";
}

let openingAudioStarted = false;
let openingAudioFinished = false;
let openingAudioAttemptInFlight = false;

function playOpeningAudio() {
  if (
    !openingAudio ||
    openingAudioStarted ||
    openingAudioFinished ||
    openingAudioAttemptInFlight
  )
    return;

  openingAudioAttemptInFlight = true;
  if (!openingAudio.src) {
    openingAudio.src = seagullsOpening;
  }
  const playback = openingAudio.play();

  playback
    .then(() => {
      openingAudioAttemptInFlight = false;
      openingAudioStarted = true;
      document.removeEventListener(
        "pointerdown",
        enableMobileMusicFallback,
        true,
      );
      document.removeEventListener("keydown", enableMobileMusicFallback, true);

      window.setTimeout(() => {
        openingAudioFinished = true;
        openingAudio.pause();
        openingAudio.currentTime = 0;
      }, 6000);
    })
    .catch(() => {
      openingAudioAttemptInFlight = false;
    });
}

function enableMobileMusicFallback() {
  if (
    openingAudioStarted ||
    openingAudioFinished ||
    openingAudioAttemptInFlight
  )
    return;
  playOpeningAudio();
}

document.addEventListener("pointerdown", enableMobileMusicFallback, true);
document.addEventListener("keydown", enableMobileMusicFallback, true);

const state = {
  value: "0",
  previousValue: null,
  operator: null,
  waitingForNewValue: false,
};

const el = {
  calculator: document.querySelector(".calculator"),
  home: document.querySelector(".home"),
  previous: document.querySelector(".previous-value"),
  current: document.querySelector(".current-value"),
  clearBtn: document.querySelector('[data-id="clear"]'),
  pageBg: document.querySelector(".page-bg"),
  screenBg: document.querySelector(".screen-bg"),
};

el.pageBg.style.backgroundImage = `linear-gradient(rgba(6,8,20,0.55), rgba(6,8,20,0.55)), url(${otterVikingsBg})`;
el.screenBg.style.backgroundImage = `url(${beachBg})`;

let bodyColorIndex = 0;
setInterval(() => {
  bodyColorIndex = (bodyColorIndex + 1) % BODY_COLORS.length;
  el.calculator.style.backgroundColor = BODY_COLORS[bodyColorIndex];
}, 2000);

function formatValue(val) {
  if (val === "NaN" || val === "Infinity" || val === "-Infinity")
    return "Error";
  if (val.includes("e")) return parseFloat(val).toExponential(4);

  const [intPart, decPart] = val.split(".");
  const isNegative = val.startsWith("-");
  let rawInt = intPart.replace(/\D/g, "");
  if (rawInt === "") rawInt = "0";

  let intFormatted = rawInt;
  try {
    intFormatted = new Intl.NumberFormat("en-US").format(BigInt(rawInt));
  } catch {
    // keep rawInt
  }

  const finalInt = isNegative ? `-${intFormatted}` : intFormatted;
  return decPart !== undefined
    ? `${finalInt}.${decPart.slice(0, 8)}`
    : finalInt;
}

function updateScreen() {
  const clearAll =
    state.value === "0" &&
    state.previousValue === null &&
    state.operator === null;
  el.clearBtn.textContent = clearAll ? "AC" : "C";
  el.clearBtn.setAttribute("data-variant", clearAll ? "ac" : "aux");
  el.previous.textContent =
    state.previousValue && state.operator
      ? `${formatValue(state.previousValue)} ${state.operator}`
      : "";
  el.current.textContent = formatValue(state.value);
  updateOperatorActive();
}

function updateOperatorActive() {
  document.querySelectorAll("[data-op]").forEach((btn) => {
    const op = btn.getAttribute("data-op");
    btn.classList.toggle(
      "active-operator",
      state.operator === op && state.waitingForNewValue,
    );
  });
}

function inputDigit(digit) {
  if (state.waitingForNewValue) {
    state.value = digit;
    state.waitingForNewValue = false;
  } else if (state.value.replace(/\D/g, "").length >= 10) {
    return;
  } else if (state.value === "0") {
    state.value = digit;
  } else if (state.value === "-0") {
    state.value = `-${digit}`;
  } else {
    state.value += digit;
  }
  updateScreen();
}

function inputDecimal() {
  if (state.waitingForNewValue) {
    state.value = "0.";
    state.waitingForNewValue = false;
  } else if (!state.value.includes(".")) {
    state.value += ".";
  }
  updateScreen();
}

function createEffectRoot() {
  const effectRoot = document.createElement("div");
  effectRoot.className = "effect-root";
  effectRoot.setAttribute("aria-hidden", "true");
  el.home.appendChild(effectRoot);
  return effectRoot;
}

function showFireworks() {
  const effectRoot = createEffectRoot();
  const colors = [
    "#ff3cac",
    "#ffef5a",
    "#4dfff3",
    "#8c5bff",
    "#ff774d",
    "#ffffff",
  ];
  const bursts = document.createDocumentFragment();

  for (let burstIndex = 0; burstIndex < 6; burstIndex += 1) {
    const burst = document.createElement("div");
    burst.className = "firework-burst";
    burst.style.left = `${15 + Math.random() * 70}%`;
    burst.style.top = `${12 + Math.random() * 48}%`;
    burst.style.setProperty("--burst-delay", `${burstIndex * 90}ms`);

    const color = colors[burstIndex % colors.length];
    const sparkCount = 18 + Math.floor(Math.random() * 8);
    for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
      const spark = document.createElement("i");
      spark.className = "firework-spark";
      spark.style.setProperty(
        "--spark-angle",
        `${(360 / sparkCount) * sparkIndex}deg`,
      );
      spark.style.setProperty(
        "--spark-distance",
        `${55 + Math.random() * 90}px`,
      );
      spark.style.setProperty("--spark-color", color);
      spark.style.setProperty("--spark-delay", `${Math.random() * 160}ms`);
      burst.appendChild(spark);
    }
    bursts.appendChild(burst);
  }

  effectRoot.appendChild(bursts);
  window.setTimeout(() => effectRoot.remove(), 1900);
}

function showNuclearBlast() {
  const effectRoot = createEffectRoot();
  effectRoot.classList.add("nuclear-effect");

  const flash = document.createElement("div");
  flash.className = "nuclear-flash";
  const shockwave = document.createElement("div");
  shockwave.className = "nuclear-shockwave";
  const fireball = document.createElement("div");
  fireball.className = "nuclear-fireball";
  const cloud = document.createElement("div");
  cloud.className = "nuclear-cloud";
  const stem = document.createElement("div");
  stem.className = "nuclear-stem";
  const ground = document.createElement("div");
  ground.className = "nuclear-ground";

  effectRoot.append(flash, shockwave, fireball, stem, cloud, ground);
  window.setTimeout(() => effectRoot.remove(), 4200);
}

function handleClear() {
  if (state.value === "0" && !state.waitingForNewValue) {
    state.previousValue = null;
    state.operator = null;
  }
  state.value = "0";
  state.waitingForNewValue = false;
  updateScreen();
}

function calculate(prev, next, op) {
  switch (op) {
    case "+":
      return parseFloat((prev + next).toFixed(10));
    case "-":
      return parseFloat((prev - next).toFixed(10));
    case "×":
      return parseFloat((prev * next).toFixed(10));
    case "÷":
      return parseFloat((prev / next).toFixed(10));
    default:
      return next;
  }
}

function performOperation(nextOperator) {
  const inputValue = parseFloat(state.value);

  if (state.previousValue == null) {
    state.previousValue = state.value;
  } else if (state.operator && !state.waitingForNewValue) {
    const newValue = calculate(
      parseFloat(state.previousValue),
      inputValue,
      state.operator,
    );
    state.value = String(newValue);
    state.previousValue = String(newValue);
  }

  state.waitingForNewValue = true;
  state.operator = nextOperator;
  updateScreen();
}

function triggerShake() {
  el.calculator.classList.add("shake");
  setTimeout(() => el.calculator.classList.remove("shake"), 420);
}

function playNote(id) {
  const index = BUTTON_NOTE_MAP[id];
  const url = NOTE_URLS[index];
  if (!url) return;
  const audio = getAudio(noteAudios, index, url, 0.6);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playEffectSound(effect) {
  const soundUrls = {
    fireworks: fireworksSound,
    nuclear: nuclearAlertSound,
  };
  const url = soundUrls[effect];
  if (!url) return;
  const audio = getAudio(effectAudios, effect, url, 0.72);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function handleButtonClick(id) {
  if (Object.hasOwn(BUTTON_NOTE_MAP, id)) {
    playNote(id);
  }
  switch (id) {
    case "clear":
      handleClear();
      break;
    case "fireworks":
      playEffectSound("fireworks");
      showFireworks();
      break;
    case "nuclear":
      playEffectSound("nuclear");
      showNuclearBlast();
      break;
    case "÷":
    case "×":
    case "-":
    case "+":
      performOperation(id);
      break;
    case "=":
      triggerShake();
      performOperation(null);
      break;
    case ".":
      inputDecimal();
      break;
    default:
      if (/^\d$/.test(id)) inputDigit(id);
      break;
  }
}

function pressButton(btn) {
  btn.classList.add("pressed");
}

function releaseButton(btn) {
  btn.classList.remove("pressed");
}

document.querySelectorAll("[data-id]").forEach((btn) => {
  const id = btn.getAttribute("data-id");

  btn.addEventListener("mousedown", () => pressButton(btn));
  btn.addEventListener("mouseup", () => releaseButton(btn));
  btn.addEventListener("mouseleave", () => releaseButton(btn));
  btn.addEventListener("touchstart", () => pressButton(btn), { passive: true });
  btn.addEventListener("touchend", () => releaseButton(btn));
  btn.addEventListener("touchcancel", () => releaseButton(btn));
  btn.addEventListener("click", () => {
    btn.blur();
    handleButtonClick(id);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey) return;

  const key = event.key;
  const map = {
    ".": ".",
    Escape: "clear",
    "+": "+",
    "-": "-",
    "*": "×",
    "/": "÷",
    Enter: "=",
    "=": "=",
  };
  if (/\d/.test(key)) map[key] = key;

  const id = map[key];
  if (!id) return;

  event.preventDefault();
  const btn = document.querySelector(`[data-id="${id}"]`);
  if (btn) {
    pressButton(btn);
    setTimeout(() => releaseButton(btn), 100);
    btn.click();
  }
});

updateScreen();
playOpeningAudio();
