export function resetLayout(layoutState, text, boxwidth, measurer) {
  layoutState.currentLineIndex = 0;
  layoutState.textLines = buildLines(text, boxwidth, measurer);
}

export function lineChanged(layoutState, renderState) {
  const prevIndex = renderState.prevIndex;
  const newIndex = renderState.newIndex;
  if (newIndex < 0 || prevIndex === 0) return false;
  const prevIndexLine = layoutState.textLines.findIndex(
    (line) => prevIndex >= line.start && prevIndex <= line.end,
  );
  const newIndexLine = layoutState.textLines.findIndex(
    (line) => newIndex > line.start && newIndex <= line.end,
  );
  return prevIndexLine !== newIndexLine;
}

export function shouldGenerate(layoutState, threshold) {
  const currentLineIndex = layoutState.currentLineIndex;
  const maxVisibleLines = layoutState.maxVisibleLines;
  const totalLines = layoutState.textLines.length;
  const lastVisibleLine = currentLineIndex + maxVisibleLines;
  const linesLefttoThreshold = totalLines - lastVisibleLine;
  return linesLefttoThreshold <= threshold;
}

export function updateWindow(layoutState, index) {
  const lines = layoutState.textLines;
  const currentLineIndex = lines.findIndex(
    (line) => index >= line.start && index <= line.end,
  );

  if (
    currentLineIndex !== -1 &&
    currentLineIndex > layoutState.currentLineIndex
  ) {
    layoutState.currentLineIndex = currentLineIndex;
  }
}

export function buildLines(text, boxwidth, measurer) {
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
