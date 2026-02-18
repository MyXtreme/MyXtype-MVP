// text engine
export function createEngineState(defaults) {
  return {
    //text generation
    wordsList: defaults.wordsList,
    wordstoGenerate: defaults.wordstoGenerate,

    //text
    text: "",
    index: 0,
    charCorrect: [],

    mode: defaults.mode,
  };
}

// state of time
export function createSessionState(defaults) {
  return {
    testStarted: false,
    testEnded: false, //time finished or reached end of text
    startTime: null,

    //timer
    duration: defaults.duration,
    timeLeft: defaults.duration,
    timerID: null,
  };
}

// Geometry
export function createLayoutState(defaults) {
  return {
    textLines: [],
    currentLineIndex: 0,
    maxVisibleLines: defaults.maxVisibleLines,
    generationThreshold: defaults.generationThreshold,
  };
}

// Visible objects
export function createViewState() {
  return {
    visCharElementMap: [],
    caretMoveTimeout: null,
  };
}

//Mostly render delta state
export function createRenderState() {
  return {
    onlyCharChange: true,
    prevIndex: 0,
    newIndex: 0,
    deltas: [],
    layoutDirty: false,
  };
}

export function createInputState() {
  return {
    lastKey: [],
    spaceRepeated: 0,
  };
}

//Single source of truth(SSoT)
export function createAppState(defaults) {
  return {
    engine: createEngineState(defaults),
    session: createSessionState(defaults),
    layout: createLayoutState(defaults),
    view: createViewState(),
    render: createRenderState(),
    input: createInputState(),
  };
}
