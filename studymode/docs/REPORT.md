# Verification report

Date: 2026-10-09. Environment: Linux container (Ubuntu 24.04, Node 22.22, Rust 1.97, Chromium 1194 via Playwright 1.56.1, WebKitGTK 2.52 under Xvfb).

## Checks actually run

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | Pass |
| Unit + integration (Vitest) | `npm test` | **98/98 pass** across 9 files (FSRS scheduling, scoring/shuffling/assembly, timer recovery, speech controller, AI response handling + validation + injection containment, plan, analytics, parsing/IO, migrations, persistence across reload, quiz flow, mistakes queue, backup/restore incl. tamper/traversal/unknown-column/newer-schema rejection, PDF/MD/TXT import incl. scanned/partial/corrupt/duplicate) |
| Browser e2e (Playwright, Chromium) | `npx playwright test` | **6/6 pass** (+1 opt-in screenshot spec skipped) |
| Rust unit tests | `cargo test` | Pass (file-key traversal guard) |
| Native release build | `npx tauri build --bundles deb` | Pass — `StudyMode_0.1.0_amd64.deb` (3.8 MB) |
| Native run (Linux, Xvfb) | launched binary, drove with xdotool | Pass — migrations applied in `~/.local/share/com.studymode.app/studymode.sqlite3`; sample data written through native SQLite + file store; data intact after kill + relaunch; read-aloud "unavailable" state shown (WebKitGTK built without speech) |
| Windows / macOS / Linux CI builds | `.github/workflows/studymode.yml` | Added; results depend on the GitHub Actions run for this branch (see PR/Actions tab) |

The main e2e test performs the acceptance workflow end to end: create certification → set goal → import Markdown → highlight, note, flashcard from selection → read aloud across a section boundary with pause/resume/stop and no overlap → review the card → write a question → study-mode quiz with immediate explanation → submit → mistake queue → 25-minute focus session (simulated clock) saved with focus/break split → progress shows the session and reviews → reload: materials, cards, sessions, mistakes, reading position survive → export backup → wipe storage → restore → data and highlights back.

Other e2e tests: missing-voice guidance; warm tint persists, doesn't block clicks, resets with Shift+Esc; sample data labelled/removable and analytics start empty; scanned PDF → "OCR required" (not silently imported); corrupt PDF → clear error.

## Failures found and fixed during verification

- Dialog accessible names broke when titles contained spaces (IDs derived from titles) → switched to `useId`.
- Reloading within 250 ms of a write could lose the last change in the browser build → write batching cut to 60 ms and flushed on `pagehide`/`visibilitychange`.
- Unused-variable, regex (`\1` in a character class) and effect-cleanup type errors caught by `tsc`.
- Speech: cancelled utterances could deliver late events → handlers detached on cancel, plus a generation guard.
- Quiz assembly test exposed largest-remainder rounding at ties → test corrected to the documented behaviour.
- Mobile layout: secondary navigation unreachable and plan rows cramped → bottom bar scrolls with all items; rows wrap.
- Linux WebKitGTK lacks speech synthesis → capability matrix corrected to "unavailable (verified)".

## Platform status

| Platform | Build | Run | Notes |
|---|---|---|---|
| Linux (Ubuntu 24.04) | Verified | Verified (Xvfb) | No speech in this WebKitGTK build |
| Windows 10/11 | CI only | **Unverified** | Primary target; needs the manual checklist |
| macOS | CI only | **Unverified** | |
| Android / iOS | Not generated | **Unverified** | Needs SDK/NDK / Xcode |
| Browser (dev) | Verified | Verified (Chromium) | Development/testing build |

## Remaining limitations (honest list)

- Not code-signed; not production-ready. No device has run the Windows build yet.
- Optional AI path not exercised against the live API (no key here); covered by mocked-transport unit tests.
- No system-level notification control, app restriction or website blocking is implemented; StudyMode shows manual OS steps instead. "Keep window on top" is a reminder only.
- Warm tint covers the app window only; system-wide tint is left to OS Night light/Night Shift.
- See docs/IMPLEMENTATION_PLAN.md → Remaining work for the full list and next action.
