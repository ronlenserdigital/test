import type { Db } from "./db";

/**
 * Versioned, append-only schema migrations. Never edit a released migration;
 * add a new one. Each migration runs inside one transaction together with the
 * row that records it in schema_migrations.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    sql: `
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE certifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  exam_code TEXT NOT NULL DEFAULT '',
  exam_version TEXT NOT NULL DEFAULT '',
  exam_date TEXT,
  daily_minutes INTEGER NOT NULL DEFAULT 30,
  daily_cards INTEGER NOT NULL DEFAULT 20,
  notes TEXT NOT NULL DEFAULT '',
  is_sample INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE domains (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight REAL,
  position INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT '',
  source_version TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_domains_cert ON domains(cert_id);

CREATE TABLE objectives (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
  code TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT '',
  source_version TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_objectives_cert ON objectives(cert_id);

CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  original_name TEXT NOT NULL DEFAULT '',
  file_key TEXT,
  mime TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT NOT NULL DEFAULT '',
  section_count INTEGER NOT NULL DEFAULT 0,
  char_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready',
  status_detail TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  position TEXT,
  furthest_section INTEGER NOT NULL DEFAULT 0,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_materials_cert ON materials(cert_id);
CREATE INDEX idx_materials_sha ON materials(cert_id, sha256);

CREATE TABLE material_sections (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  label TEXT NOT NULL,
  page INTEGER,
  text TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_sections_material ON material_sections(material_id, idx);

CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  section_idx INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE highlights (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  section_idx INTEGER NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'amber',
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_highlights_material ON highlights(material_id);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
  section_idx INTEGER,
  source_label TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  origin TEXT NOT NULL DEFAULT 'manual',
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_notes_cert ON notes(cert_id);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
  section_idx INTEGER,
  source_label TEXT NOT NULL DEFAULT '',
  source_quote TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  origin TEXT NOT NULL DEFAULT 'manual',
  suspended INTEGER NOT NULL DEFAULT 0,
  due INTEGER NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  last_review INTEGER,
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_cards_due ON cards(cert_id, suspended, due);

CREATE TABLE card_reviews (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  cert_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  state INTEGER NOT NULL,
  due INTEGER NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days INTEGER NOT NULL,
  last_elapsed_days INTEGER NOT NULL,
  scheduled_days INTEGER NOT NULL,
  learning_steps INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_reviews_cert ON card_reviews(cert_id, reviewed_at);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  stem TEXT NOT NULL,
  choices TEXT NOT NULL,
  correct TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
  section_idx INTEGER,
  source_label TEXT NOT NULL DEFAULT '',
  source_quote TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT 'manual',
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_questions_cert ON questions(cert_id);

CREATE TABLE item_objectives (
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  objective_id TEXT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  PRIMARY KEY (item_type, item_id, objective_id)
);
CREATE INDEX idx_item_objectives_obj ON item_objectives(objective_id);

CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY,
  cert_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at INTEGER NOT NULL,
  deadline_at INTEGER,
  submitted_at INTEGER,
  question_count INTEGER NOT NULL,
  score REAL,
  max_score REAL,
  config TEXT NOT NULL DEFAULT '{}',
  warnings TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX idx_attempts_cert ON quiz_attempts(cert_id, started_at);

CREATE TABLE attempt_items (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  choice_order TEXT NOT NULL,
  selected TEXT NOT NULL DEFAULT '[]',
  flagged INTEGER NOT NULL DEFAULT 0,
  score REAL,
  is_correct INTEGER,
  seen_before INTEGER NOT NULL DEFAULT 0,
  answered_at INTEGER
);
CREATE INDEX idx_items_attempt ON attempt_items(attempt_id, position);
CREATE INDEX idx_items_question ON attempt_items(question_id);

CREATE TABLE review_queue (
  question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  cert_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  added_at INTEGER NOT NULL,
  last_attempt_id TEXT,
  resolved_at INTEGER
);

CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  cert_id TEXT REFERENCES certifications(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  task TEXT NOT NULL DEFAULT '',
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  focus_sec INTEGER NOT NULL DEFAULT 0,
  break_sec INTEGER NOT NULL DEFAULT 0,
  paused_sec INTEGER NOT NULL DEFAULT 0,
  planned_focus_sec INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  timer_id TEXT UNIQUE
);
CREATE INDEX idx_sessions_cert ON study_sessions(cert_id, started_at);
`,
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function migrate(db: Db): Promise<number> {
  await db.run(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)",
  );
  const rows = await db.all<{ version: number }>("SELECT version FROM schema_migrations");
  const applied = new Set(rows.map((r) => Number(r.version)));
  const current = Math.max(0, ...applied);
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `This database was created by a newer StudyMode (schema ${current}); this version supports up to ${SCHEMA_VERSION}.`,
    );
  }
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    const record = `INSERT INTO schema_migrations (version, name, applied_at) VALUES (${m.version}, '${m.name.replace(/'/g, "''")}', ${Date.now()});`;
    await db.script(m.sql + "\n" + record);
  }
  return SCHEMA_VERSION;
}

/** Tables included in backups, in foreign-key-safe insert order. */
export const DATA_TABLES = [
  "settings",
  "certifications",
  "domains",
  "objectives",
  "materials",
  "material_sections",
  "bookmarks",
  "highlights",
  "notes",
  "cards",
  "card_reviews",
  "questions",
  "item_objectives",
  "quiz_attempts",
  "attempt_items",
  "review_queue",
  "study_sessions",
] as const;
export type DataTable = (typeof DATA_TABLES)[number];
