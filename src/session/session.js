export function resetSession(sessionState) {
  sessionState.testStarted = false;
  sessionState.testEnded = false;
  sessionState.startTime = null;
  sessionState.timeLeft = sessionState.duration;
}

export function startTest(sessionState) {
  sessionState.testStarted = true;
  sessionState.startTime = new Date();
}

export function updateTimer(sessionState) {
  if (!sessionState.startTime) {
    sessionState.startTime = new Date();
  }
  const now = Date.now();
  const start = sessionState.startTime?.getTime();
  if (!start) return { minutes: 0, seconds: 0 };

  const timePassed = Math.floor((now - start) / 1000);
  sessionState.timeLeft = Math.max(0, sessionState.duration - timePassed);

  if (sessionState.timeLeft === 0) {
    stopInterval(sessionState);
    sessionState.testEnded = true;
  }
  const seconds = sessionState.timeLeft % 60;
  const minutes = Math.floor(sessionState.timeLeft / 60);

  return { minutes, seconds };
}

export function updateStopwatch(sessionState) {
  if (!sessionState.startTime) {
    sessionState.startTime = new Date();
  }
  const now = Date.now();
  const start = sessionState.startTime?.getTime();
  if (!start) return { minutes: 0, seconds: 0 };

  const timePassed = Math.floor((now - start) / 1000);
  const seconds = timePassed % 60;
  const minutes = Math.floor(timePassed / 60);

  return { minutes, seconds };
}

export function stopInterval(sessionState) {
  if (sessionState.timerID !== null) {
    clearInterval(sessionState.timerID);
    sessionState.timerID = null;
  }
}

export function calculateResult(appState) {
  const elapsedSeconds = appState.session.startTime
    ? Math.floor((Date.now() - appState.session.startTime.getTime()) / 1000)
    : appState.session.duration - appState.session.timeLeft;
  const timeTaken = Math.max(0.01, elapsedSeconds / 60);

  const correctChars = appState.engine.charCorrect.filter(Boolean).length;
  const totalChars = appState.engine.charCorrect.length;

  const accuracy = totalChars === 0 ? 0 : (correctChars / totalChars) * 100;
  const raw = totalChars / 5 / timeTaken;
  const wpm = raw * (accuracy / 100);

  return { raw, accuracy, wpm };
}
