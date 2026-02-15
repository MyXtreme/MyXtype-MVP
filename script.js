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

const defaults = {
  mode: "classic",
  duration: 60,
  maxVisibleLines: 3,
  wordstoGenerate: 60,
  wordsList: commonWords,
  generationThreshold: 5, //if for this lines much close to last visible line
};

// State of text engine
const engineState = {
  //text generation
  wordsList: defaults.wordsList,
  wordstoGenerate: defaults.wordstoGenerate,

  //text
  text: "",
  index: 0,
  charCorrect: [],

  mode: defaults.mode,
};

// State of time
const sessionState = {
  testStarted: false,
  testEnded: false, //time finished or reached end of text
  startTime: null,

  //timer
  duration: defaults.duration,
  timeLeft: defaults.duration,
  timerID: null,
};

// Geometry
const layoutState = {
  textLines: [],
  currentLineIndex: 0,
  maxVisibleLines: defaults.maxVisibleLines,
};

// Visible objects
const viewState = {
  visCharElementMap: [],
  caretMoveTimeout: null,
};

//Mostly render delta state
const renderState = {
  onlyCharChange: true,
  prevIndex: 0,
  newIndex: 0,
  deltas: [],
  layoutDirty: false,
};

const inputState = {
  lastKey: [],
  spaceRepeated: 0,
};

//Single source of truth(SSoT)
const appState = {
  engine: engineState,
  session: sessionState,
  layout: layoutState,
  view: viewState,
  render: renderState,
  input: inputState,
};

// Engine logic

function startTest(sessionState) {
  sessionState.testStarted = true;
  sessionState.startTime = new Date();
  startTimer(sessionState);
}

function resetEngine(engineState) {
  engineState.text = textGenerator(
    engineState.wordsList,
    engineState.wordstoGenerate,
  );

  engineState.index = 0;
  engineState.charCorrect = [];
}

function resetLayout(layoutState) {
  layoutState.currentLineIndex = 0;
  layoutState.textLines = buildLines(appState.engine.text);
}

function resetSession(sessionState) {
  sessionState.testStarted = false;
  sessionState.testEnded = false;
  sessionState.startTime = null;
  sessionState.timeLeft = sessionState.duration;
}

function resetView(viewState) {
  viewState.visCharElementMap = [];
  viewState.caretMoveTimeout = null;
}

function resetRender(renderState) {
  renderState.onlyCharChange = false;
  renderState.deltas = [];
  renderState.layoutDirty = true;
}

//handlers
function handleStart(appState) {
  resetEngine(appState.engine);
  resetLayout(appState.layout);
  resetSession(appState.session);
  resetView(appState.view);
  resetRender(appState.render);

  handleRender(modes, appState.engine.mode);
  requestAnimationFrame(() => {
    updateCaretPosition(appState.view, appState.engine.index);
  });
}

function handleResize(appState) {
  appState.layout.textLines = buildLines(appState.engine.text);
  appState.render.layoutDirty = true;
}

function handleKeydown(appState, key) {
  if (appState.session.testEnded) return;
  if (!appState.session.testStarted) startTest(appState.session);

  const index = appState.engine.index;
  const expectedChar = appState.engine.text[index];
  appState.engine.charCorrect[index] = key === expectedChar;

  if (key === "Backspace") {
    typedBackspace(appState);
  } else if (key === " ") {
    typedSpace(appState);
  } else if (/^[a-zA-Z0-9]$/.test(key)) {
    typedAlphameric(appState);
  } else {
    typedSymbols(appState); //temporarly <------------------------ don't forget
  }

  if (shouldGenerate(appState.layout, defaults.generationThreshold)) {
    appState.engine.text += textGenerator(
      appState.engine.wordsList,
      appState.engine.wordstoGenerate,
    );
    appState.layout.textLines = buildLines(appState.engine.text);
    appState.render.layoutDirty = true;
  }

  updateWindow(appState.layout, appState.engine.index);

  if (lineChanged(appState.layout, appState.render)) {
    appState.render.onlyCharChange = false;
    appState.render.layoutDirty = true;
  }
}

function handleRender(appState, modes = modes) {
  const mode = appState.engine.mode;
  if (
    appState.render.layoutDirty &&
    !appState.engine.text.length &&
    !appState.session.testStarted
  ) {
    setMode(appState, mode, modes);
  } else {
    if (
      appState.render.onlyCharChange &&
      !appState.render.layoutDirty &&
      appState.view.visCharElementMap.length
    ) {
      renderDeltaBatch(
        appState.render,
        appState.view,
        appState.engine.charCorrect,
      );
    } else {
      modes[mode].render(appState);
    }
  }
}

function typedSpace(appState) {
  const index = appState.engine.index;
  if (index >= appState.engine.text.length) return;

  appState.input.spaceRepeated++;

  if (appState.engine.charCorrect[index]) {
    if (appState.input.spaceRepeated <= 3) {
      appState.render.prevIndex = index;
      appState.engine.index++;
      appState.render.newIndex = appState.engine.index;
      appState.render.onlyCharChange = true;
      appState.render.deltas.push({ type: "space", index });
      return;
    }
    appState.render.deltas.push({ type: "repeated-space", index });
    return;
  }
}

function typedAlphameric(appState) {
  const index = appState.engine.index;
  appState.input.spaceRepeated = 0;
  appState.render.prevIndex = index;
  appState.engine.index++;
  appState.render.newIndex = appState.engine.index;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({ type: "alphameric", index });
}
function typedSymbols(appState) {
  const index = appState.engine.index;
  appState.input.spaceRepeated = 0;
  appState.render.prevIndex = index;
  appState.engine.index++;
  appState.render.newIndex = appState.engine.index;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({ type: "symbols", index });
}

function lineChanged(layoutState, renderState) {
  const prevIndex = renderState.prevIndex;
  const newIndex = renderState.newIndex;
  if (newIndex < 0 || prevIndex === 0) return;
  const prevIndexLine = layoutState.textLines.findIndex(
    (line) => prevIndex >= line.start && prevIndex <= line.end,
  );
  const newIndexLine = layoutState.textLines.findIndex(
    (line) => newIndex > line.start && newIndex <= line.end,
  );
  return prevIndexLine !== newIndexLine;
}

function typedBackspace(appState) {
  if (appState.engine.index <= 0) return;

  let prevIndex = appState.engine.index;
  let newIndex = appState.engine.index - 1;
  if (lineChanged(appState.layout, appState.render)) {
    return;
  }

  appState.engine.index--;
  appState.engine.charCorrect.pop();

  appState.render.prevIndex = prevIndex;
  appState.render.newIndex = newIndex;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({
    type: "backspace",
    index: newIndex,
  });
}

function showResult() {
  const elapsedSeconds = appState.session.startTime
    ? Math.floor((Date.now() - appState.session.startTime.getTime()) / 1000)
    : appState.session.duration - appState.session.timeLeft;
  const timeTaken = Math.max(0.01, elapsedSeconds / 60);

  const correctChars = appState.engine.charCorrect.filter(Boolean).length;
  const totalChars = appState.engine.charCorrect.length;

  const accuracy = totalChars === 0 ? 0 : (correctChars / totalChars) * 100;
  const raw = totalChars / 5 / timeTaken;
  const wpm = raw * (accuracy / 100);

  resultElement.innerHTML = `
        Raw speed: ${raw.toFixed(1)}<br>
        Accuracy: ${accuracy.toFixed(1)}%<br>
        WPM: ${wpm.toFixed(1)}
    `;
}

function textGenerator(
  wordsList = defaults.wordsList,
  wordstoGenerate = defaults.wordstoGenerate,
) {
  let words = [];

  for (let i = 0; i < wordstoGenerate; i++) {
    const randomWord = wordsList[getRandomInt(0, wordsList.length)];
    words.push(randomWord);
  }

  return words.join(" ") + " ";
}

function shouldGenerate(layoutState, threshold) {
  const currentLineIndex = layoutState.currentLineIndex;
  const maxVisibleLines = layoutState.maxVisibleLines;
  const totalLines = layoutState.textLines.length;
  const lastVisibleLine = currentLineIndex + maxVisibleLines;
  const linesLefttoThreshold = totalLines - lastVisibleLine;
  return linesLefttoThreshold <= threshold;
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

function updateWindow(layoutState, index) {
  const lines = layoutState.textLines;
  const currentLineIndex = lines.findIndex(
    (line) => index >= line.start && engine.index <= line.end,
  );

  if (
    currentLineIndex !== -1 &&
    currentLineIndex > layoutState.currentLineIndex
  ) {
    layoutState.currentLineIndex = currentLineIndex;
  }
}

function updateCaretPosition(viewState, i) {
  const map = viewState.visCharElementMap;
  if (!map || map.length === 0) return;

  const containerRect = textElement.getBoundingClientRect();
  caret.classList.add("moving");

  let span = map[i] || map[i - 1];
  if (!span) return;

  const rect = span.getBoundingClientRect();
  const x = map[i] ? rect.left : rect.right;

  caret.style.transform = `translate(${x - containerRect.left}px, ${rect.top - containerRect.top}px)`;
  caret.style.height = rect.height + "px";

  clearTimeout(viewState.caretMoveTimeout);
  viewState.caretMoveTimeout = setTimeout(
    () => caret.classList.remove("moving"),
    480,
  );
}

//Mode renderer
function renderClassicMode(layoutState, renderState, viewState, charCorrect) {
  const caretNode = caret;
  textElement.innerHTML = "";
  textElement.appendChild(caretNode);
  viewState.visCharElementMap = [];

  const visibleStart =
    layoutState.currentLineIndex > 0 ? layoutState.currentLineIndex - 1 : 0;
  const visibleEnd =
    layoutState.currentLineIndex === 0
      ? layoutState.currentLineIndex + layoutState.maxVisibleLines
      : layoutState.currentLineIndex + layoutState.maxVisibleLines - 1;
  const visibleLines = layoutState.textLines.slice(visibleStart, visibleEnd);

  visibleLines.forEach((lineObj) => {
    const div = document.createElement("div");
    const fragment = document.createDocumentFragment();

    lineObj.text.split("").forEach((char, i) => {
      let realIndex = lineObj.start + i;
      const span = document.createElement("span");
      span.textContent = char;

      if (realIndex < appState.engine.index) {
        if (charCorrect[realIndex]) {
          span.classList.add("correct");
        } else {
          span.classList.add("incorrect");
        }
      }

      viewState.visCharElementMap[realIndex] = span;
      fragment.appendChild(span);
    });

    div.appendChild(fragment);

    textElement.appendChild(div);
  });
  renderState.layoutDirty = false;
}

function renderDeltaBatch(renderState, viewState, charCorrect) {
  for (let d of renderState.deltas) {
    const i = d.index;
    const span = viewState.visCharElementMap[i];

    if (!span) continue;

    span.classList.remove("correct", "incorrect");

    if (d.type === "type" || d.type === "space") {
      if (charCorrect[i] === true) {
        span.classList.add("correct");
      } else if (charCorrect[i] === false) {
        span.classList.add("incorrect");
      }
    }
  }
  renderState.deltas.length = 0;
}

//Mode system
const modes = {
  classic: {
    start: (appState) => handleStart(appState),
    render: (appState) =>
      renderClassicMode(
        appState.render,
        appState.layout,
        appState.view,
        appState.engine.charCorrect,
      ),
  },

  story: {
    start: () => handleStart(appState),
    render: (appState) =>
      renderClassicMode(
        appState.render,
        appState.layout,
        appState.view,
        appState.engine.charCorrect,
      ),
  },

  race: {
    start: () => handleStart(appState),
    render: (appState) =>
      renderClassicMode(
        appState.render,
        appState.layout,
        appState.view,
        appState.engine.charCorrect,
      ),
  },
};

function setMode(appState, mode, modes = modes) {
  appState.engine.mode = mode;
  modes[mode].start(appState);
  modes[mode].render(appState);
  updateCaretPosition(appState.view, appState.engine.index);
}

//Input layer

function resetTest(appState) {
  stopTimer(appState.session);
  handleStart(appState);
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
  handleRender(modes, appState.engine.mode);
  updateCaretPosition(appState.view, appState.engine.index);
}

function nextTest(appState) {
  handleStart(appState);
  timerElement.textContent = "01:00";
  resultElement.textContent = "";
  handleRender(modes, appState.engine.mode);
  updateCaretPosition(appState.view, appState.engine.index);
}

function startTimer(sessionState) {
  if (sessionState.timerID !== null) return;
  if (!sessionState.startTime) {
    sessionState.startTime = new Date();
  }

  sessionState.timerID = setInterval(() => {
    const now = Date.now();
    const start = sessionState.startTime?.getTime();
    if (!start) return;

    const timePassed = Math.floor((now - start) / 1000);
    sessionState.timeLeft = Math.max(0, sessionState.duration - timePassed);

    if (sessionState.timeLeft === 0) {
      stopTimer(sessionState);
      sessionState.testEnded = true;
      showResult();
    }

    const seconds = sessionState.timeLeft % 60;
    const minutes = Math.floor(sessionState.timeLeft / 60);
    timerElement.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, 1000);

  //Stopwatch
  /*sessionState.timerID = setInterval(() => {
        const timeStamp = new Date();
        const timePassed = Math.floor((timeStamp - appState.session.startTime) / 1000);
        const seconds = timePassed % 60;
        const minutes = Math.floor(timePassed / 60);
        timerElement.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
    }, 1000);*/
}

function stopTimer(sessionState) {
  if (sessionState.timerID !== null) {
    clearInterval(sessionState.timerID);
    sessionState.timerID = null;
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

handleRender(appState, modes); //First real action begin, not loading function, but executing them
//Event listeners
document.addEventListener("keydown", (e) => {
  if (appState.session.testEnded) return;
  if (e.key === "Backspace" || e.key === "Spacebar") {
    e.preventDefault();
  }

  handleKeydown(appState, e.key);
  handleRender(modes, appState.engine.mode);
  requestAnimationFrame(() => {
    updateCaretPosition(appState.view, appState.engine.index);
  });
});

window.addEventListener("resize", () => {
  handleResize(appState);
  handleRender(modes, appState.engine.mode);
  requestAnimationFrame(() => {
    updateCaretPosition(appState.view, appState.engine.index);
  });
});

resetBtn.addEventListener("click", () => {
  resetTest(appState);
  resetBtn.blur();
});

nextBtn.addEventListener("click", () => {
  nextTest(appState);
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
