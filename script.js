import { commonWords } from "./words.js";

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

let currentMode = "classic";
let timerID = null;
let caretMoveTimeout = null;
let spaceRepeating = 0;

// Single source of truth or engine state
const typingEngineState = {
  text: "",
  index: 0,
  started: false, //timer
  startTime: null,
  ended: false, //test
  charResults: [],
  visibleCharMap: [],
  duration: 60,
  timeLeft: 60,

  wordstoGenerate: 60,
  visibleLinesIndex: 0,
  maxVisibleLines: 3,
  lines: [],
};

const renderState = {
  onlyCharChange: true,
  prevIndex: 0,
  newIndex: 0,
  deltas: [],
  layoutDirty: false,
};

function resetRenderState() {
  renderState.onlyCharChange = true;
  renderState.deltas = [];
  renderState.layoutDirty = false;
}

// Engine logic

function startTest() {
  typingEngineState.started = true;
  typingEngineState.startTime = new Date();
  startTimer();
}

function startEngine() {
  //typingEngineState.mode = mode;
  typingEngineState.text = textGenerator();

  typingEngineState.index = 0;
  typingEngineState.visibleLinesIndex = 0;
  typingEngineState.started = false;
  typingEngineState.ended = false;
  typingEngineState.startTime = null;
  typingEngineState.charResults = [];
  typingEngineState.visibleCharMap = [];
  typingEngineState.duration = 60;
  typingEngineState.timeLeft = typingEngineState.duration;

  typingEngineState.lines = buildLines(typingEngineState.text);

  requestAnimationFrame(() => {
    render();
    updateCaretPosition();
  });
  resetRenderState();
  renderState.layoutDirty = true;
}

function handleCharInput(typedChar) {
  if (typingEngineState.ended) return;
  if (!typingEngineState.started) startTest();

  const index = typingEngineState.index;
  if (index >= typingEngineState.text.length) return;
  const expectedChar = typingEngineState.text[index];
  const isCorrect = typedChar === expectedChar;

  typingEngineState.charResults[index] = isCorrect;
  if (expectedChar === " " && !isCorrect) {
    spaceRepeating = 0;
    renderState.deltas.push({ type: "type", index });
    return;
  } else if (expectedChar !== " " && typedChar === " ") {
    if (spaceRepeating <= 3) {
      renderState.prevIndex = index;
      typingEngineState.index++;
      renderState.newIndex = typingEngineState.index;
      renderState.onlyCharChange = true;
      renderState.deltas.push({ type: "type", index });
      return;
    }
    renderState.deltas.push({ type: "morespace", index });
    return;
  } else {
    spaceRepeating = 0;
    renderState.prevIndex = index;
    typingEngineState.index++;
    renderState.newIndex = typingEngineState.index;
    renderState.onlyCharChange = true;
    renderState.deltas.push({ type: "type", index });
  }

  const lastVisibleLine =
    typingEngineState.visibleLinesIndex + typingEngineState.maxVisibleLines;
  const totalLines = typingEngineState.lines.length;
  if (totalLines - lastVisibleLine < 5) {
    typingEngineState.text += textGenerator();
    typingEngineState.lines = buildLines(typingEngineState.text);
    renderState.layoutDirty = true;
  }
  const oldLine = typingEngineState.visibleLinesIndex;
  updateWindow(typingEngineState.lines);

  if (typingEngineState.visibleLinesIndex !== oldLine) {
    renderState.onlyCharChange = false;
    renderState.layoutDirty = true;
  }
}

function handleBackspace() {
  if (typingEngineState.index <= 0) return;
  const currentLineIndex = typingEngineState.lines.findIndex(
    (line) =>
      typingEngineState.index >= line.start &&
      typingEngineState.index <= line.end,
  );
  const currentLine = typingEngineState.lines[currentLineIndex];

  if (typingEngineState.index === currentLine.start) {
    return;
  }

  renderState.prevIndex = typingEngineState.index;
  typingEngineState.index--;
  typingEngineState.charResults.pop();
  renderState.newIndex = typingEngineState.index;
  renderState.onlyCharChange = true;
  renderState.deltas.push({
    type: "backspace",
    index: typingEngineState.index,
  });
}

function showResult() {
  const elapsedSeconds = typingEngineState.startTime
    ? Math.floor((Date.now() - typingEngineState.startTime.getTime()) / 1000)
    : typingEngineState.duration - typingEngineState.timeLeft;
  const timeTaken = Math.max(0.01, elapsedSeconds / 60);

  const correctChars = typingEngineState.charResults.filter(Boolean).length;
  const totalChars = typingEngineState.charResults.length;

  const accuracy = totalChars === 0 ? 0 : (correctChars / totalChars) * 100;
  const raw = totalChars / 5 / timeTaken;
  const wpm = raw * (accuracy / 100);

  resultElement.innerHTML = `
        Raw speed: ${raw.toFixed(1)}<br>
        Accuracy: ${accuracy.toFixed(1)}%<br>
        WPM: ${wpm.toFixed(1)}
    `;
}

function textGenerator(wordsInLine = typingEngineState.wordstoGenerate) {
  let words = [];

  for (let i = 0; i < wordsInLine; i++) {
    const randomWord = commonWords[getRandomInt(0, commonWords.length)];
    words.push(randomWord);
  }

  return words.join(" ") + " ";
}

function buildLines(text, containerElement = textElement) {
  const boxwidth = containerElement.clientWidth;
  const words = text.trim().split(/\s+/);

  const lines = [];
  let currentLine = "";
  let currentStartIndex = 0;
  let currentCharCount = 0;

  for (let word of words) {
    let testLine = currentLine ? currentLine + " " + word : word;

    measurer.textContent = testLine;
    const width = measurer.getBoundingClientRect().width;

    if (width <= boxwidth) {
      currentLine = testLine;
      currentCharCount += word.length + 1;
    } else {
      lines.push({
        text: currentLine,
        start: currentStartIndex,
        end: currentStartIndex + currentCharCount - 1,
      });

      currentStartIndex += currentCharCount;
      currentCharCount = word.length + 1;
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push({
      text: currentLine,
      start: currentStartIndex,
      end: currentStartIndex + currentCharCount - 1,
    });
  }

  return lines;
}

function updateWindow(lines) {
  const currentLineIndex = lines.findIndex(
    (line) =>
      typingEngineState.index >= line.start &&
      typingEngineState.index <= line.end,
  );

  if (
    currentLineIndex !== -1 &&
    currentLineIndex > typingEngineState.visibleLinesIndex
  ) {
    typingEngineState.visibleLinesIndex = currentLineIndex;
  }
}

function updateCaretPosition() {
  const i = typingEngineState.index;
  const map = typingEngineState.visibleCharMap;
  if (!map || map.length === 0) return;

  const containerRect = textElement.getBoundingClientRect();
  caret.classList.add("moving");

  let span = map[i] || map[i - 1];
  if (!span) return;

  const rect = span.getBoundingClientRect();
  const x = map[i] ? rect.left : rect.right;

  caret.style.transform = `translate(${x - containerRect.left}px, ${rect.top - containerRect.top}px)`;
  caret.style.height = rect.height + "px";

  clearTimeout(caretMoveTimeout);
  caretMoveTimeout = setTimeout(() => caret.classList.remove("moving"), 480);
}

//Mode renderer
function renderClassicMode() {
  const caretNode = caret;
  textElement.innerHTML = "";
  textElement.appendChild(caretNode);
  typingEngineState.visibleCharMap = [];

  const visibleStart =
    typingEngineState.visibleLinesIndex > 0
      ? typingEngineState.visibleLinesIndex - 1
      : 0;
  const visibleEnd =
    typingEngineState.visibleLinesIndex === 0
      ? typingEngineState.visibleLinesIndex + typingEngineState.maxVisibleLines
      : typingEngineState.visibleLinesIndex +
        typingEngineState.maxVisibleLines -
        1;
  const visibleLines = typingEngineState.lines.slice(visibleStart, visibleEnd);

  visibleLines.forEach((lineObj) => {
    const div = document.createElement("div");
    const fragment = document.createDocumentFragment();

    lineObj.text.split("").forEach((char, i) => {
      let realIndex = lineObj.start + i;
      const span = document.createElement("span");
      span.textContent = char;

      if (realIndex < typingEngineState.index) {
        if (typingEngineState.charResults[realIndex]) {
          span.classList.add("correct");
        } else {
          span.classList.add("incorrect");
        }
      }

      typingEngineState.visibleCharMap[realIndex] = span;
      fragment.appendChild(span);
    });

    div.appendChild(fragment);

    textElement.appendChild(div);
  });
  resetRenderState();
}

function renderDeltaBatch() {
  for (let d of renderState.deltas) {
    const i = d.index;
    const span = typingEngineState.visibleCharMap[i];

    if (!span) continue;

    span.classList.remove("correct", "incorrect");

    if (d.type === "type") {
      if (typingEngineState.charResults[i] === true) {
        span.classList.add("correct");
      } else if (typingEngineState.charResults[i] === false) {
        span.classList.add("incorrect");
      }
    }
  }
  renderState.deltas.length = 0;
}

function renderClassic() {
  if (
    renderState.onlyCharChange &&
    !renderState.layoutDirty &&
    typingEngineState.visibleCharMap.length
  ) {
    renderDeltaBatch();
  } else {
    renderClassicMode();
  }
}

//Mode system
const modes = {
  classic: {
    start: () => startEngine(),
    render: () => renderClassic(),
  },

  story: {
    start: () => startEngine(),
    render: () => renderClassic(),
  },

  race: {
    start: () => startEngine(),
    render: () => renderClassic(),
  },
};
function render() {
  modes[currentMode].render();
}

function setMode(mode) {
  currentMode = mode;
  modes[mode].start();
  modes[mode].render();
  updateCaretPosition();
}

modeList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    dropdown.classList.remove("open");
    setMode(e.target.dataset.mode);
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

setMode(currentMode); //First real action begin, not loading function, but executing them
//Input layer

//Event listeners

resetBtn.addEventListener("click", () => {
  resetTest();
  resetBtn.blur();
});
nextBtn.addEventListener("click", () => {
  nextTest();
  nextBtn.blur();
});

function resetTest() {
  stopTimer();
  startEngine();
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
  render();
  updateCaretPosition();
}

function nextTest() {
  startEngine();
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
  render();
  updateCaretPosition();
}

function startTimer() {
  if (timerID !== null) return;
  if (!typingEngineState.startTime) {
    typingEngineState.startTime = new Date();
  }

  timerID = setInterval(() => {
    const now = Date.now();
    const start = typingEngineState.startTime?.getTime();
    if (!start) return;

    const timePassed = Math.floor((now - start) / 1000);
    typingEngineState.timeLeft = Math.max(
      0,
      typingEngineState.duration - timePassed,
    );

    if (typingEngineState.timeLeft === 0) {
      stopTimer();
      typingEngineState.ended = true;
      showResult();
    }

    const seconds = typingEngineState.timeLeft % 60;
    const minutes = Math.floor(typingEngineState.timeLeft / 60);
    timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, 1000);

  //Stopwatch
  /*timerID = setInterval(() => {
        const timeStamp = new Date();
        const timePassed = Math.floor((timeStamp - typingEngineState.startTime) / 1000);
        const seconds = timePassed % 60;
        const minutes = Math.floor(timePassed / 60);
        timerElement.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }, 1000);*/
}

function stopTimer() {
  if (timerID !== null) {
    clearInterval(timerID);
    timerID = null;
  }
}

document.addEventListener("keydown", (e) => {
  if (typingEngineState.ended) return;

  if (e.key === "Backspace") {
    e.preventDefault();
    handleBackspace();
  } else if (e.key === " ") {
    e.preventDefault();
    spaceRepeating++;
    handleCharInput(" ");
  } else if (e.key.length === 1) {
    handleCharInput(e.key);
  }

  render();
  requestAnimationFrame(() => {
    updateCaretPosition();
  });
});

window.addEventListener("resize", () => {
  typingEngineState.lines = buildLines(typingEngineState.text);
  renderState.layoutDirty = true;
  render();
  requestAnimationFrame(updateCaretPosition);
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
