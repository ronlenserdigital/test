# StudyMode — implementation plan and status

Last updated: 2026-10-09. Working branch: `claude/nifty-turing-qlthw5`. App root: `studymode/`.

## Assumptions

- No specific certification was named, so nothing exam-specific is built in. Users enter/import objectives from their official guide; weights are used only when supplied.
- Windows desktop is the first delivery target; it is built in CI (`.github/workflows/studymode.yml`) because this development container is Linux.
- The browser build exists for development and automated tests; the shipped product is the Tauri desktop app.
- One real AI provider: Anthropic Messages API (default model `claude-opus-5-5`, user-selectable Sonnet/Haiku), called from Rust.

## Milestones

| # | Scope | Status |
|---|---|---|
| 1 | Foundation, persistence (migrations, native SQLite + sql.js), certification setup, import (PDF/MD/TXT/paste) + reader, read aloud, focus session saved to history | **Done**, verified by e2e + unit/integration tests; native persistence verified on Linux |
| 2 | Flashcards (FSRS, CSV/JSON), quizzes/exams (study/exam modes, timed, shuffling, scoring), mistakes queue, objective progress, daily plan, optional AI (explain, draft cards/questions, ask with citations) | **Done**; AI verified with mocked transport only |
| 3 | Warm tint + schedule (manual/sunset), ambient audio + ducking, shortcuts, in-app focus + always-on-top reminder, capability matrix + manual guidance, responsive/touch layout | **Done** for desktop; mobile projects not generated |
| 4 | Accessibility pass, failure recovery, backup/restore, packaging, docs, final verification | **Done** except signing and device checks (see Remaining) |

## Completed (highlights)

- Versioned migrations; atomic batches; atomic file writes; cascade deletes; duplicate/corrupt/empty/scanned import handling with progress + cancel.
- Reader: per-page/heading sections, search (library-wide and in-section), bookmarks, highlights, notes with objective links, typography settings, saved position, selection toolbar (Read aloud, Highlight, Add note, Create flashcard; AI actions only when configured).
- Read aloud: chunked, cursor highlight, follows across sections, persisted position, no overlap, pause/resume/stop/prev/next, voice/speed/volume/pitch, network-voice labelling, missing-voice/unsupported states, Alt+R shortcut.
- Focus: Pomodoro/custom, deadline-based timer surviving minimise/restart, sleep/crash gap excluded, idempotent session save, in-app focus (hidden nav, muted alerts), compact TTS/sound/warmth controls, protection summary.
- Dashboard daily plan (adjustable: done/remove/reorder/custom) with one Start Studying button; analytics with sample sizes and new-vs-repeated split; streaks; review forecast; objective coverage.
- Backup/restore with full validation; sample data labelled and removable.

## Remaining work

1. **Windows device verification** — run docs/MANUAL_TESTS.md §Windows on a real Windows 10/11 machine using the CI artifact.
2. **Code signing** — Windows: obtain an Authenticode certificate and set `bundle.windows.certificateThumbprint` (or Azure Trusted Signing); macOS: Developer ID + notarisation (`APPLE_*` env vars in CI). Unsigned builds trigger SmartScreen/Gatekeeper warnings.
3. **Linux speech** — implement a native `SpeechEngine` adapter (e.g. speech-dispatcher via a Rust command) for WebKitGTK builds without Web Speech.
4. **Mobile** — `npx tauri android init` / `npx tauri ios init`, add mobile capability files, verify touch reader selection, background audio and timer behaviour; secure key storage on Android is not implemented (AI disabled there).
5. **Optional system integrations** — Android notification-policy (ACCESS_NOTIFICATION_POLICY) and iOS Screen Time (FamilyControls entitlement) were deliberately not implemented; currently manual guidance only.
6. Nice-to-have: FTS5 search for very large libraries; OCR integration; pdf.js `standardFontDataUrl` to silence a harmless warning.

## Known limitations

- Reader shows extracted text, not page images/figures (export the original to view layout).
- Highlights in editable pasted-notes materials can shift if text before them is edited.
- Browser build batches IndexedDB writes (~60 ms); the native build writes synchronously.
- AI was not exercised against the live API in this environment (no key); request/response handling is unit-tested with a mocked transport.

## Exact next action

Open the latest "StudyMode" GitHub Actions run for this branch, download the `studymode-Windows` artifact, install it on Windows 11, and execute docs/MANUAL_TESTS.md §Windows, recording results in that file.
