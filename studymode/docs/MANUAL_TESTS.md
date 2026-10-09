# Manual and device checks

Automated coverage: Vitest (unit + integration, Node), Playwright (browser build in Chromium with a fake speech engine), `cargo test`, and native builds in CI. The checks below need a real device/OS and are **not automated**. Record date, OS version and result for each.

## Windows desktop (primary) — not yet run

1. Install the MSI/NSIS artifact from the CI run (unsigned → SmartScreen "More info → Run anyway").
2. Create a certification, import a text PDF (≥50 pages) and a Markdown file; confirm page labels, search and progress feedback; import the same file again → duplicate prompt; import a scanned PDF → "OCR required".
3. Reader: select text in a PDF page → Read aloud, Highlight, Add note, Create flashcard all work. Press Alt+R with and without a selection.
4. Settings → Read aloud: installed voices are listed; "needs network" appears on Online/Natural voices; disconnect Wi-Fi and confirm a local voice still reads. Remove all voices (or test on a clean VM) → missing-voice guidance.
5. Listen through a section boundary; minimise the window for 5 minutes → speech continues, reader cursor follows; restart the app → "Listen" resumes near the saved chunk.
6. Focus: start a session, minimise for 10 minutes → time remains correct on restore. Put the PC to sleep for >5 minutes mid-session → on wake the timer is paused with the "not counted" notice. Kill the app via Task Manager mid-session → on restart it offers resume/end; ending saves once.
7. "Keep window on top" during a session; end the session → the window is no longer on top.
8. Ambient: enable rain + café, start Read aloud → ambient ducks; mute (Alt+M); end session → sounds stop if the setting is on.
9. Warm tint at 100%: text remains readable, selection/scroll/click work; Shift+Esc resets; evening schedule with manual times; "Use my location" with Windows location off → clear error.
10. AI (optional, needs a key): save key → Windows Credential Manager shows `com.studymode.app`; key never appears in Settings again. Explain, Draft cards, Draft questions, Ask: each shows the outgoing text and estimate before sending; Cancel mid-request; invalid key → auth error; disconnect network → network error.
11. Backup: export via Save dialog; restore on a second Windows account → identical data, highlights and review history; tamper the zip → rejected without changes.
12. Accessibility: navigate everything with keyboard only; Narrator announces dialogs, timer, toasts; Windows contrast themes; 200% scaling.

## macOS — not yet run
Same as Windows steps 2–11; voices from System Settings → Accessibility → Spoken Content; key stored in Keychain; check Night Shift guidance.

## Linux (Ubuntu 24.04, WebKitGTK 2.52) — partially run (2026-10-09, Xvfb)
- [x] Release build + `.deb` bundle.
- [x] App launches; migrations create `~/.local/share/com.studymode.app/studymode.sqlite3`.
- [x] Sample workspace created through the UI is stored in native SQLite; original file copied to `files/`.
- [x] Data visible after killing and relaunching the app.
- [x] Read aloud shows the "not available in this webview" state (WebKitGTK build has no speech synthesis).
- [ ] Secret Service key storage (needs a running keyring), backup Save dialog, warm tint, ambient audio on real hardware.

## Android / iOS — not started
Requires `npx tauri android init` (Android SDK + NDK) / `npx tauri ios init` (Xcode, Apple developer team). Check touch selection in the reader, bottom navigation, background speech behaviour, and timer accuracy after locking the device.
