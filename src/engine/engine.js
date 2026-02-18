import { getRandomInt } from "../utils/utils.js";

export function resetEngine(engineState, isRestart) {
  if (!isRestart) {
    engineState.text = textGenerator(
      engineState.wordsList,
      engineState.wordstoGenerate,
    );
  }
  engineState.index = 0;
  engineState.charCorrect = [];
}

export function textGenerator(wordsList, wordstoGenerate) {
  let words = [];

  for (let i = 0; i < wordstoGenerate; i++) {
    const randomWord = wordsList[getRandomInt(0, wordsList.length)];
    words.push(randomWord);
  }

  return words.join(" ") + " ";
}

export function typedBackspace(appState, lineChanged) {
  if (appState.engine.index <= 0) return;
  if (lineChanged) {
    return;
  }

  appState.render.prevIndex = appState.engine.index;
  appState.engine.index--;
  appState.engine.charCorrect.pop();
  appState.render.newIndex = appState.engine.index;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({
    type: "backspace",
    index: appState.render.prevIndex,
  });
}

export function typedSpace(appState) {
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

export function typedAlphameric(appState) {
  const index = appState.engine.index;
  appState.input.spaceRepeated = 0;
  appState.render.prevIndex = index;
  appState.engine.index++;
  appState.render.newIndex = appState.engine.index;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({ type: "alphameric", index });
}

export function typedSymbols(appState) {
  const index = appState.engine.index;
  appState.input.spaceRepeated = 0;
  appState.render.prevIndex = index;
  appState.engine.index++;
  appState.render.newIndex = appState.engine.index;
  appState.render.onlyCharChange = true;
  appState.render.deltas.push({ type: "symbols", index });
}
