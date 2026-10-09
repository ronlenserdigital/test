# StudyMode

Personal, offline-first certification study app: choose a certification → import material → read/listen → practise recall → review mistakes → decide what to study next.

- **Stack:** Tauri 2 (Rust) + React 19 + TypeScript + SQLite (rusqlite, bundled). Browser/dev build uses SQLite compiled to WebAssembly (sql.js) + IndexedDB.
- **Status:** Milestones 1–4 implemented. Linux desktop build verified here; Windows/macOS builds run in CI (see [docs/REPORT.md](docs/REPORT.md)). Not signed, not production-ready.
- No account, no cloud sync, no paid API required. AI assistance is optional.

## Requirements

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 22.x | npm 10 |
| Rust | 1.77.2+ (tested 1.97) | `rustup` stable |
| Windows | WebView2 runtime (preinstalled on Windows 11), Microsoft C++ Build Tools | see https://v2.tauri.app/start/prerequisites/ |
| macOS | Xcode Command Line Tools | |
| Linux | `libwebkit2gtk-4.1-dev build-essential libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev` (+ `libsecret`/GNOME Keyring for AI key storage) | |

## Commands

Run everything from this `studymode/` folder.

```bash
npm ci                      # install exact locked dependencies

# Development
npm run dev                 # browser build at http://localhost:1420 (sql.js + IndexedDB storage)
npm run tauri:dev           # native desktop app with hot reload

# Checks
npm run typecheck           # TypeScript
npm test                    # unit + integration tests (Vitest, Node)
npx playwright test         # browser end-to-end tests (starts the dev server)
cd src-tauri && cargo test  # Rust unit tests

# Production build / packaging (unsigned)
npm run build               # web assets → dist/
npm run tauri:build         # native bundles → src-tauri/target/release/bundle/
#   Windows: msi/ + nsis/   macOS: dmg/ + macos/   Linux: deb/ + appimage/ + rpm/
npx tauri build --bundles deb   # a single bundle type
```

Playwright uses Chromium. If your environment pins its own browser, set `PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium`.

Optional screenshots for visual review: `SCREENS=1 npx playwright test screens` (writes `test-results/screens/`).

## Where data lives

| Build | Location |
|---|---|
| Windows | `%APPDATA%\com.studymode.app\` (`studymode.sqlite3`, `files\`) |
| macOS | `~/Library/Application Support/com.studymode.app/` |
| Linux | `~/.local/share/com.studymode.app/` |
| Browser dev build | the browser's IndexedDB (`studymode`) |

Settings → Data & backup shows the exact path and exports/restores a full `.zip` backup (database rows + original files + checksums). API keys are stored only in the OS credential store and never in the database or backups.

## Configuration

No environment variables or secrets are needed (`.env.example` documents the one optional dev variable). Import format examples: [docs/examples/](docs/examples/) (objectives outline/CSV, flashcards CSV, questions CSV/JSON).

Optional AI assistance (desktop app only): Settings → AI assistance → accept the data notice → paste an Anthropic API key. Each request shows exactly what will be sent and an estimated cost before you press Send.

## Documentation

- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — milestones, status, remaining work, next action
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, data model, key decisions and tradeoffs
- [docs/CAPABILITY_MATRIX.md](docs/CAPABILITY_MATRIX.md) — per-OS support for focus, display, speech and key storage
- [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md) — device checks that automation cannot cover
- [docs/REPORT.md](docs/REPORT.md) — what was implemented and verified, failures fixed, limitations
- [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md) — third-party licenses and generated assets
