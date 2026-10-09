# Architecture

## Stack decision

New project → Tauri 2 + React + TypeScript + local SQLite, as specified. No existing code constrained the choice (the repository root holds an unrelated static website, left untouched; StudyMode lives in `studymode/`).

## Layers

```
src/
  domain/      Pure study logic, no I/O: types, FSRS wrapper (srs.ts), quiz assembly/scoring,
               timer state machine, daily plan, analytics, objective parsing, CSV/IO, text chunking, sunset
  data/        Persistence: Db interface, migrations, sql.js + native adapters, Repo (all SQL), backup/restore, sample data
  importers/   PDF (pdf.js), Markdown, text → sections with page/heading labels
  ai/          Provider abstraction, Anthropic provider, local retrieval (BM25) + citation mapping, prompts + output validation
  platform/    Native/web adapters: env detection, speech (Web Speech), ambient audio (Web Audio), secrets, window, capability matrix
  state/       Composition root (services.ts), zustand store, preferences, focus controller, hooks
  ui/          Reusable accessible components, icons, app shell
  views/       Screens
src-tauri/     Rust: SQLite commands, file store, OS keychain, AI HTTP transport, native save dialog
```

Rules: views never write SQL (they call `Repo`); domain code has no I/O and is unit-tested; platform specifics sit behind small interfaces (`Db`, `FileStore`, `SpeechEngine`, `AiProvider`, `Transport`) so mobile/native adapters can be swapped in.

## Persistence

- One SQL schema, versioned in `src/data/migrations.ts` (append-only; `schema_migrations` table). Each migration runs in one transaction. A database from a newer app version is refused rather than corrupted.
- Native: Rust `rusqlite` (bundled SQLite, WAL) behind four commands (`db_execute`, `db_select`, `db_batch` = atomic transaction, `db_exec_script`). SQL parameters are never logged.
- Browser/dev & tests: `sql.js`; the browser build persists the DB image to IndexedDB (60 ms write batching). Integration tests run the same migrations and repository in Node.
- Files: originals copied into app storage (`files/<uuid>.<ext>`), written atomically (temp + rename), keys validated against path traversal in Rust.
- All timestamps are epoch ms; IDs are UUIDv4.

## Key behaviours

| Area | Decision |
|---|---|
| Spaced repetition | `ts-fsrs` (open-spaced-repetition, MIT): FSRS with 90% target retention, learning steps 1m/10m, fuzz on. Every review stored in `card_reviews` (rating, prior state, stability, difficulty, intervals, duration). |
| Multi-answer scoring | Default all-or-nothing (exact set); optional partial = (correct picks − wrong picks) ÷ correct count, floored at 0. Answers compare by stable choice id; shuffled display order is stored per attempt item. |
| Quiz assembly | Prefers unseen questions; weak-topic mode weights low-accuracy objectives (≥3 answers) and the mistake queue. Domain weights only when every domain has a user-supplied weight and each domain has enough tagged questions — otherwise a warning explains why they weren't applied. Warns on short pools and repeated questions. |
| Timer | Pure state machine over wall-clock deadlines. Gaps > 5 min between heartbeats (sleep, crash, app closed) are not counted as study: the timer auto-pauses at the last heartbeat. Sessions are written with a unique `timer_id` (INSERT OR IGNORE) so a retry never double counts. |
| Read aloud | Web Speech API via one controller; generation counter + cancel prevents overlapping audio; ≤240-char sentence chunks; pause = cancel + restart current chunk (native pause is unreliable); cursor persisted per material. |
| Reader | Displays extracted text (the PDF text layer) as paragraphs; highlights stored as offsets into the paragraph-normalised text; imported content is rendered as text nodes only (never HTML), so it cannot inject markup. |
| AI | Optional. Request bodies are built in TS; HTTP is sent from Rust with the key read from the OS keychain, so the key never reaches the webview. Imported text is wrapped in `<source>` tags with an instruction to treat it as data; source-tag breakouts are stripped. JSON-schema structured output + validation; drafts are reviewed before saving and labelled AI-generated. |
| Backup | ZIP (fflate): manifest with schema version, row counts and SHA-256 per file. Restore validates everything (format, version, columns against the live schema, value types, checksums, file-name safety, referenced files) before a single-transaction replace. |
| Warm display | CSS multiply overlay (`pointer-events: none`, max 38% opacity) — app window only. Shift+Esc always turns it off. |
| Ambient audio | Synthesised with Web Audio (no bundled recordings). Master duck gain drops to 30% while speech plays. |

## Security

- Tauri CSP: `default-src 'self'`, no remote scripts, `connect-src` IPC only (AI calls are made from Rust). `wasm-unsafe-eval` is allowed for pdf.js decoders.
- Capabilities: `core:default` plus only the window APIs used (always-on-top, fullscreen). No fs/shell/http plugins exposed to the webview. Exports go through a Rust command that opens the native Save dialog; the webview cannot pick paths.
- Secrets: `keyring` crate (Windows Credential Manager, macOS/iOS Keychain, Linux Secret Service). The webview can set/delete/check, never read.

## Tradeoffs

- **SQL defined in TS, executed in Rust**: one schema for native, browser and tests, at the cost of a thin IPC hop per query. Reads are small; batches are transactional.
- **Text-first reader** instead of rendering PDF pages: reliable selection, highlighting, search and TTS on every platform; figures/layout are not shown (export the original to view it).
- **LIKE search** instead of FTS5: portable across sql.js and rusqlite builds; adequate for personal libraries. Move to FTS5 if libraries grow large.
- **Web Speech instead of native TTS adapters**: works on Windows/macOS webviews today; Linux WebKitGTK builds may lack it (verified missing on Ubuntu 24.04). A native speech adapter can implement the same `SpeechEngine` interface.
