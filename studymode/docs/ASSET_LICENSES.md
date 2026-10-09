# Assets and licenses

## Bundled assets

| Asset | Origin | License |
|---|---|---|
| App icon (`assets/icon.svg`, generated `src-tauri/icons/*`) | Created for this project; icons generated with `npx tauri icon` | Project-owned |
| UI icons (`src/ui/icons.tsx`) | Original SVG paths written for this project | Project-owned |
| Ambient sounds (rain, white noise, café) | Synthesised at runtime with the Web Audio API (`src/platform/ambient.ts`); no audio files are bundled | Project-owned code; no third-party audio |
| Focus chime | Synthesised sine tones (`src/state/focus.ts`) | Project-owned |
| Sample workspace text | Written for this project; describes study techniques, not any real exam | Project-owned |

## Runtime dependencies

| Package | License | Use |
|---|---|---|
| react, react-dom 19 | MIT | UI |
| zustand 5 | MIT | App state |
| @tauri-apps/api 2 | Apache-2.0 OR MIT | IPC to Rust |
| ts-fsrs 5 | MIT | FSRS spaced-repetition scheduler |
| pdfjs-dist 5 | Apache-2.0 | PDF text extraction |
| sql.js 1.14 | MIT (SQLite: public domain) | Browser/dev SQLite |
| fflate 0.8 | MIT | Backup ZIP |
| tauri 2, tauri-build, tauri-plugin-dialog | Apache-2.0 OR MIT | Desktop shell, Save dialog |
| rusqlite (bundled SQLite) | MIT (SQLite: public domain) | Native database |
| keyring 3 | Apache-2.0 OR MIT | OS credential store |
| reqwest (rustls) | Apache-2.0 OR MIT | AI HTTP transport |
| serde, serde_json, tokio, sha2, hex | Apache-2.0 OR MIT | Rust utilities |

Full transitive license lists: `npx license-checker --production` (npm) and `cargo install cargo-about && cargo about generate` (Rust), run before any public release.
