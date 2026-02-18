export function resetView(viewState) {
  viewState.visCharElementMap = [];
  viewState.caretMoveTimeout = null;
}

export function resetRender(renderState) {
  renderState.onlyCharChange = false;
  renderState.deltas = [];
  renderState.layoutDirty = true;
}

export function renderClassicMode(appState, dom) {
  const { textElement, caret } = dom;
  textElement.innerHTML = "";
  textElement.appendChild(caret);
  appState.view.visCharElementMap = [];

  const visibleStart =
    appState.layout.currentLineIndex > 0
      ? appState.layout.currentLineIndex - 1
      : 0;
  const visibleEnd =
    appState.layout.currentLineIndex === 0
      ? appState.layout.currentLineIndex + appState.layout.maxVisibleLines
      : appState.layout.currentLineIndex + appState.layout.maxVisibleLines - 1;
  const visibleLines = appState.layout.textLines.slice(
    visibleStart,
    visibleEnd,
  );

  visibleLines.forEach((lineObj) => {
    const div = document.createElement("div");
    const fragment = document.createDocumentFragment();

    lineObj.text.split("").forEach((char, i) => {
      let realIndex = lineObj.start + i;
      const span = document.createElement("span");
      span.textContent = char;

      if (realIndex < appState.engine.index) {
        if (appState.engine.charCorrect[realIndex]) {
          span.classList.add("correct");
        } else {
          span.classList.add("incorrect");
        }
      }

      appState.view.visCharElementMap[realIndex] = span;
      fragment.appendChild(span);
    });

    div.appendChild(fragment);

    textElement.appendChild(div);
  });
  appState.render.layoutDirty = false;
  appState.render.onlyCharChange = true;
}

export function renderDeltaBatch(appState) {
  for (let d of appState.render.deltas) {
    const i = d.index;
    const span = appState.view.visCharElementMap[i];

    if (!span) {
      console.warn("Missing span for index", i);
      continue;
    }

    span.classList.remove("correct", "incorrect");
    console.log("render sees delta:", d.type, d.index, d);

    if (d.type === "alphameric" || d.type === "space") {
      if (appState.engine.charCorrect[i] === true) {
        span.classList.add("correct");
      } else if (appState.engine.charCorrect[i] === false) {
        span.classList.add("incorrect");
      }
    }
  }
  appState.render.deltas.length = 0;
}

export function updateCaretPosition(viewState, i, dom) {
  const map = viewState.visCharElementMap;
  const { textElement, caret } = dom;
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
