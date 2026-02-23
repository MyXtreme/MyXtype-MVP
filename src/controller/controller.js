import * as engine from "../engine/engine.js";
import * as layout from "../layout/layout.js";
import * as render from "../render/render.js";
import * as session from "../session/session.js";

export function createController(appState, dom) {
  const modes = {
    classic: {
      start: () => handleStart(),
      render: () => render.renderClassicMode(appState, renderDom),
      strategy: () => session.updateTimer(appState.session),
    },

    /*story: {
      start: () => handleStart(appState),
      render: (appState) => render.,
    },

    race: {
      start: () => handleStart(appState),
      render: (appState) => render.,
    },*/
  };
  const renderDom = { textElement: dom.textElement, caret: dom.caret };
  const sessionDom = { result: dom.resultElement, timer: dom.timerElement };

  function handleStart(isRestart = false) {
    engine.resetEngine(appState.engine, isRestart);
    layout.resetLayout(
      appState.layout,
      appState.engine.text,
      renderDom.textElement.clientWidth,
      dom.measurer,
    );
    session.resetSession(appState.session);
    render.resetView(appState.view);
    render.resetRender(appState.render);

    requestAnimationFrame(() => handleRender());
  }

  function handleResize() {
    const textElement = dom.textElement;
    const measurer = dom.measurer;
    const boxwidth = textElement.clientWidth;
    appState.layout.textLines = layout.buildLines(
      appState.engine.text,
      boxwidth,
      measurer,
    );
    appState.render.layoutDirty = true;
    requestAnimationFrame(() => handleRender());
  }

  function handleKeydown(key) {
    if (appState.session.testEnded) return;
    if (!appState.session.testStarted) handleSession();

    const index = appState.engine.index;
    const expectedChar = appState.engine.text[index];
    appState.engine.charCorrect[index] = key === expectedChar;

    const lineChanged = layout.lineChanged(appState.layout, appState.render);
    if (key === "Backspace") {
      if (lineChanged) return;
      engine.typedBackspace(appState, lineChanged);
      appState.render.onlyCharChange = true;
    } else if (key === " ") {
      engine.typedSpace(appState);
      appState.render.onlyCharChange = true;
    } else if (/^[a-zA-Z0-9]$/.test(key)) {
      engine.typedAlphameric(appState);
      appState.render.onlyCharChange = true;
    } else {
      engine.typedSymbols(appState); //temporarly <------------------------ don't forget
      appState.render.onlyCharChange = true;
    }

    const boxwidth = dom.textElement.clientWidth;
    const measurer = dom.measurer;
    if (
      layout.shouldGenerate(
        appState.layout,
        appState.layout.generationThreshold,
      )
    ) {
      appState.engine.text += engine.textGenerator(
        appState.engine.wordsList,
        appState.engine.wordstoGenerate,
      );
      appState.layout.textLines = layout.buildLines(
        appState.engine.text,
        boxwidth,
        measurer,
      );
      appState.render.layoutDirty = true;
    }

    layout.updateWindow(appState.layout, appState.engine.index);

    if (layout.lineChanged(appState.layout, appState.render)) {
      appState.render.onlyCharChange = false;
      appState.render.layoutDirty = true;
    }
    requestAnimationFrame(() => handleRender());
  }

  function handleRender() {
    const mode = appState.engine.mode;
    if (
      appState.render.layoutDirty &&
      !appState.engine.text.length &&
      !appState.session.testStarted
    ) {
      setMode(appState, mode);
    } else {
      if (
        appState.render.onlyCharChange &&
        !appState.render.layoutDirty &&
        appState.view.visCharElementMap.length
      ) {
        render.renderDeltaBatch(appState);
      } else {
        modes[mode].render();
      }
    }
    render.updateCaretPosition(appState.view, appState.engine.index, renderDom);
  }

  function handleSession() {
    if (!appState.session.testStarted) {
      if (appState.session.timerID !== null) return;
      session.startTest(appState.session);

      function tick() {
        const { minutes, seconds } = modes[appState.engine.mode].strategy();
        sessionDom.timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        if (appState.session.testEnded) {
          session.stopInterval(appState.session);
          const { raw, accuracy, wpm } = session.calculateResult(appState);
          sessionDom.result.innerHTML = `
          Raw speed: ${raw.toFixed(1)}<br>
          Accuracy: ${accuracy.toFixed(1)}%<br>
          WPM: ${wpm.toFixed(1)}
          `;
        }
      }
      tick();
      appState.session.timerID = setInterval(() => tick(), 1000);
    } else {
      console.log("How test not started, but somehow reached end");
    }
  }

  function setMode(appState, mode) {
    appState.engine.mode = mode;
    modes[mode].start();
    modes[mode].render();
    updateCaretPosition(appState.view, appState.engine.index, renderDom);
  }

  function init(isRestart = false) {
    handleStart(isRestart);
  }

  return { init, handleKeydown, handleResize };
}
