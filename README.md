# MyXtype — MVP

A lightweight, client-only typing test. This repository is an MVP focused on a clean typing experience with a visible caret, per-character correctness, auto-generated words, and multiple modes (classic, story, race — more planned). The app runs entirely in the browser (no backend required).

Live demo -https://myxtreme.github.io/MyXtype-MVP/ 

Quick summary (MVP)
- Render typed text into visually separated lines that fit container width.
- Per-character correctness highlighting (correct / incorrect).
- Moving caret visually anchored to the current character.
- Countdown timer and results (Raw speed, Accuracy, WPM).
- Auto-generate more text as user approaches the end of the visible content.
- Minimal UI: mode selector, reset/next buttons.

Table of contents
- Features (MVP)
- How it works (brief)
- Run locally
- Recommended tests
- Known limitations (MVP)
- Roadmap / planned features
- Contributing
- License

Features (what's included in this MVP)
- Classic typing mode implemented and tested.
- Timer (countdown) and results calculations.
- Efficient rendering for visible text window using DocumentFragment.
- Delta updates for per-character changes (minimizes DOM ops).
- Simple mode selector UI (modes scaffolded).
- Words come from `words.js` (commonWords array).

How it works (high level)
- textGenerator() creates a stream of words.
- buildLines() measures text width using a hidden measurer span and breaks text into lines that fit the text container.
- renderClassicMode() creates spans per character for visible lines and keeps a visibleCharMap to map absolute character index -> DOM span.
- Typing engine state (typingEngineState) holds text, current index, charResults, visible lines, timer info.
- Key input (keydown) updates engine state and triggers minimal re-render (renderDeltaBatch) when possible; full re-render when layout changes.
- Caret position is computed from the bounding rect of the active span and transformed into place.

Run locally
- This project is static — open `index.html` in a modern browser (Chrome, Firefox, Safari).
- For best results (module import) serve via a local HTTP server (recommended):
  - Python 3:
    - python -m http.server 8080
    - open http://localhost:8080
  - Node (http-server):
    - npm install -g http-server
    - http-server -p 8080
    - open http://localhost:8080
- Note: script uses `type="module"`. Opening via the file:// protocol in some browsers can cause module loading errors. Use a local server for consistent behavior.

Browser compatibility
- Modern browsers that support ES modules. Test at least in Chrome, Firefox, and Safari (desktop and mobile).

Recommended manual tests (prior to publishing)
1. Basic flow
  - Click anywhere to focus the page (or start typing).
  - Start typing; ensure correct / incorrect spans update and caret moves.
2. Timer
  - Start a test, let the timer reach 0: verify the test ends, result is shown, and further keystrokes are ignored.
3. Reset/Next
  - Click reset and next multiple times (including rapid clicks) to ensure no errors or dangling timers.
4. Space/backspace behavior
  - Test spaces (correct/incorrect) and ensure backspace at index 0 doesn't crash.
5. Resize
  - Resize window while typing and confirm layout reflow and caret reposition correctly.
6. Long session
  - Keep typing until text auto-generates more text; ensure no memory blow-up and visibleCharMap remains correct.
7. Mobile typing
  - Test on mobile browser (Android/iOS). Pay attention to virtual keyboard and key event differences.

Automated tests to add (recommended)
- Unit tests
  - textGenerator: returns expected shape (non-empty, words joined by spaces).
  - buildLines: for a mocked measurer ensure proper line splitting.
  - Timer functions: startTimer/stopTimer state management using fake timers.
- E2E tests (Cypress / Playwright)
  - Full typing flow: type a known string and assert results and classes.
  - Resize behavior and caret update.
- Linting/format checks in CI (ESLint + Prettier).

Known limitations (intentional MVP decisions)
- Accessibility: basic keyboard handling; ARIA and screen-reader announcements are minimal — improve before advertising to wider audience.
- Mobile support: key events on mobile can be inconsistent; adding a hidden input element to proxy text input may be required.
- Modes: story / race / chat scaffolds currently re-use classic rendering; mode-specific behaviors (scoring, pacing) are not fully implemented.
- Persistence and user profiles: no scoreboard, no local storage of best scores.
- No automated CI or unit tests included yet (add before broader release).
- Backspace going back from visible slice, not scroll back the previous line, probably crash the code now.
- State of truthes of render and engine mixed at some parts. For now left unchanged

Essential fixes to do before publishing (high priority)
- Ensure stopTimer() clears interval and sets timerID = null to avoid multiple timers.
- Add defensive checks for required DOM elements (e.g., #quote, #timer) and fail gracefully if missing.
- Prevent rapid double-click races on reset/next (disable buttons or debounce).
- Verify words.js exists and has a fallback if empty.

UX / accessibility improvements to add (before or shortly after launch)
- Add aria-live for results, role and labels for interactive controls.
- Indicate when typing area is focused and whether key events will be captured.
- Provide visual hints for mobile users explaining how to type (and how to enable native keyboard).

Publishing checklist (quick)
- [ ] Add README (this file).
- [ ] Add LICENSE (MIT recommended).
- [ ] Add a short release note / changelog and tag v0.1.0.
- [ ] Add a demo (GitHub Pages) and link it in README.
- [ ] Run manual tests above; fix critical issues (timer/WPM, timer cleanup).
- [ ] Add basic unit tests and CI that runs linters and tests.
- [ ] Ensure assets (imgs/, words.js) are included and paths correct.
- [ ] Run Lighthouse and fix obvious accessibility/perf regressions.

Roadmap / suggested next features (post-MVP)
- Leaderboard (local or server-backed) with anonymized scores.
- Mode-specific gameplay (race: live competitors; story: narrative pacing; chat: type-to-chat).
- Difficulty levels, keyboard layouts, multi-language wordlists.
- Save best scores locally and show progress.
- Visual improvements: highlight current word, smoother caret animations using transform/translate3d.

Contributing
- Issues and PRs welcome. For PRs:
  - Fork the repo, create a branch, and open a PR explaining the change.
  - Run linting and tests locally before submitting.
  - Keep changes scoped (bug fix vs feature).

Privacy & Security
- Client-only app; no data is sent to servers by default.
- If you add analytics or remote storage later, disclose it in README and follow privacy best-practices.

License
- Add a LICENSE file. If you want a permissive license, include the MIT license.

Contact / author
- Mukhtar (MyXtreme) — open an issue or PR for questions.

---

Notes for release text / short MVP description you can copy to GitHub release:
"MyXtype v0.1.0 — MVP release. A client-only typing-test with per-character feedback, caret tracking, and timer. This release focuses on a fast, minimal typing experience. Known limitations: accessibility and mobile-specific input handling will be improved in future releases."
