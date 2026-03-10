import { commonWords } from "../words.js";
import { createAppState } from "./state.js";
import { createController } from "./controller/controller.js";

const textElement = document.getElementById("quote");
const resultElement = document.getElementById("result");
const timerElement = document.getElementById("timer");
const resetBtn = document.getElementById("reset");
const nextBtn = document.getElementById("next");
const modeBtn = document.getElementById("mode");
const modeList = document.getElementById("mode-list");
const caret = document.getElementById("caret");
const dropdown = modeBtn.parentElement;

const measurer = document.createElement("span");
measurer.style.position = "absolute";
measurer.style.visibility = "hidden";
measurer.style.whiteSpace = "pre";
const style = getComputedStyle(textElement);
measurer.style.font = style.font;
measurer.style.letterSpacing = style.letterSpacing;
measurer.style.fontSize = style.fontSize;
document.body.appendChild(measurer);

const defaults = {
  mode: "classic",
  duration: 60,
  maxVisibleLines: 3,
  wordstoGenerate: 60,
  wordsList: commonWords,
  generationThreshold: 5, //if for this lines much close to last visible line
};
const dom = { textElement, caret, timerElement, resultElement, measurer };

const appState = createAppState(defaults);
const controller = createController(appState, dom);

function resetTest() {
  //stopTimer(appState.session);
  controller.init(true);
}

function nextTest() {
  controller.init();
}

controller.init(); //here app initializes

//event listeners
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (appState.session.testEnded) return;
  if (e.key === "Backspace" || e.key === "Spacebar") {
    e.preventDefault();
  }

  controller.handleKeydown(e.key);
});

window.addEventListener("resize", () => {
  controller.handleResize();
});

timerElement.addEventListener("click", (e) => {
  if (appState.engine.mode !== "classic" || appState.session.testStarted)
    return;

  const value = e.target.dataset.time;

  if (value) {
    controller.handleTimer(false, true, value);
  } else {
    controller.handleTimer(true);
  }
});

resetBtn.addEventListener("click", () => {
  resetTest();
  resetBtn.blur();
});

nextBtn.addEventListener("click", () => {
  nextTest();
  nextBtn.blur();
});

modeList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    dropdown.classList.remove("open");
    controller.setMode(appState, e.target.dataset.mode);
  }
});

modeBtn.addEventListener("click", () => {
  dropdown.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});
