import { commonWords } from "../words.js";
import { createAppState } from "./state.js";
import { createController } from "./controller/controller.js";

console.log("it reached index.js");

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
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
}

function nextTest() {
  controller.init();
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
}

controller.init(); //here app initializes

//event listeners
document.addEventListener("keydown", (e) => {
  if (appState.session.testEnded) return;
  if (e.key === "Backspace" || e.key === "Spacebar") {
    e.preventDefault();
  }

  controller.handleKeydown(e.key);
});

window.addEventListener("resize", () => {
  controller.handleResize();
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
    setMode(appState, e.target.dataset.mode, modes);
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
