/**
 * Full backup/export and validated restore.
 *
 * Format (.studymode.zip):
 *   manifest.json          { format, app, schemaVersion, createdAt, tables: {name: rows}, files: [{key, size, sha256}] }
 *   data/<table>.json      array of row objects
 *   files/<key>            original imported files
 *
 * Restore validates everything (format, schema version, row shapes, file
 * checksums, referenced files) BEFORE changing anything, then replaces the
 * database contents in a single transaction. Stored files are written before
 * the database swap and orphaned files are removed only after it succeeds.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import type { Db, SqlParam, Statement } from "./db";
import type { FileStore } from "./files";
import { DATA_TABLES, SCHEMA_VERSION } from "./migrations";

export const BACKUP_FORMAT = 1;

export interface BackupManifest {
  format: number;
  app: "StudyMode";
  schemaVersion: number;
  createdAt: number;
  tables: Record<string, number>;
  files: { key: string; size: number; sha256: string }[];
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Settings that are device-specific and should not travel with a backup. */
const DEVICE_SETTINGS = new Set(["activeTimer"]);

export async function createBackup(db: Db, files: FileStore): Promise<Uint8Array> {
  const zip: Zippable = {};
  const manifest: BackupManifest = { format: BACKUP_FORMAT, app: "StudyMode", schemaVersion: SCHEMA_VERSION, createdAt: Date.now(), tables: {}, files: [] };
  const fileKeys = new Set<string>();
  for (const t of DATA_TABLES) {
    let rows = await db.all(`SELECT * FROM ${t}`);
    if (t === "settings") rows = rows.filter((r) => !DEVICE_SETTINGS.has(String(r.key)));
    if (t === "materials") for (const r of rows) if (r.file_key) fileKeys.add(String(r.file_key));
    manifest.tables[t] = rows.length;
    zip[`data/${t}.json`] = strToU8(JSON.stringify(rows));
  }
  for (const key of fileKeys) {
    const data = await files.get(key);
    manifest.files.push({ key, size: data.length, sha256: await sha256Hex(data) });
    zip[`files/${key}`] = [data, { level: 0 }];
  }
  zip["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  return zipSync(zip, { level: 6 });
}

export class BackupError extends Error {}

export interface ParsedBackup {
  manifest: BackupManifest;
  tables: Record<string, Record<string, unknown>[]>;
  files: Map<string, Uint8Array>;
}

/** Validate a backup without touching the database. */
export async function parseBackup(bytes: Uint8Array, db: Db): Promise<ParsedBackup> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    throw new BackupError("This file is not a valid StudyMode backup (could not read the archive).");
  }
  const mf = entries["manifest.json"];
  if (!mf) throw new BackupError("Backup is missing manifest.json.");
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(mf));
  } catch {
    throw new BackupError("Backup manifest is corrupt.");
  }
  if (manifest.app !== "StudyMode" || manifest.format !== BACKUP_FORMAT) throw new BackupError("Unsupported backup format.");
  if (typeof manifest.schemaVersion !== "number" || manifest.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(`This backup was made by a newer StudyMode (schema ${manifest.schemaVersion}). Update the app to restore it.`);
  }

  const tables: ParsedBackup["tables"] = {};
  for (const t of DATA_TABLES) {
    const raw = entries[`data/${t}.json`];
    if (!raw) {
      if (manifest.tables[t] == null) {
        tables[t] = []; // table introduced after this backup's schema
        continue;
      }
      throw new BackupError(`Backup is missing data for ${t}.`);
    }
    let rows: unknown;
    try {
      rows = JSON.parse(strFromU8(raw));
    } catch {
      throw new BackupError(`Backup data for ${t} is corrupt.`);
    }
    if (!Array.isArray(rows) || rows.some((r) => typeof r !== "object" || r === null || Array.isArray(r))) {
      throw new BackupError(`Backup data for ${t} has an invalid shape.`);
    }
    if (rows.length !== manifest.tables[t]) throw new BackupError(`Backup row count mismatch for ${t}.`);
    // Only columns that exist in the current schema are accepted.
    const cols = new Set((await db.all<{ name: string }>(`PRAGMA table_info(${t})`)).map((c) => c.name));
    for (const r of rows as Record<string, unknown>[]) {
      for (const [k, v] of Object.entries(r)) {
        if (!cols.has(k)) throw new BackupError(`Backup contains an unknown column ${t}.${k}.`);
        if (v !== null && typeof v !== "string" && typeof v !== "number") throw new BackupError(`Invalid value in ${t}.${k}.`);
      }
    }
    tables[t] = rows as Record<string, unknown>[];
  }

  const files = new Map<string, Uint8Array>();
  for (const f of manifest.files ?? []) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(f.key) || f.key.startsWith(".") || f.key.includes("..")) throw new BackupError("Backup contains an invalid file name.");
    const data = entries[`files/${f.key}`];
    if (!data) throw new BackupError(`Backup is missing the file ${f.key}.`);
    if (data.length !== f.size || (await sha256Hex(data)) !== f.sha256) throw new BackupError(`File ${f.key} failed its integrity check.`);
    files.set(f.key, data);
  }
  for (const m of tables.materials ?? []) {
    if (m.file_key && !files.has(String(m.file_key))) throw new BackupError(`Material "${m.title}" references a file missing from the backup.`);
  }
  return { manifest, tables, files };
}

export interface RestoreSummary {
  tables: Record<string, number>;
  files: number;
}

export async function restoreBackup(bytes: Uint8Array, db: Db, store: FileStore): Promise<RestoreSummary> {
  const parsed = await parseBackup(bytes, db);
  const previousKeys = new Set(await store.list());

  // 1) Write files first (new keys only; identical keys are content-addressed by material id).
  for (const [key, data] of parsed.files) await store.put(key, data);

  // 2) Replace database contents atomically. Preserve device-only settings.
  const keep = await db.all<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key IN ('activeTimer')");
  const stmts: Statement[] = [];
  for (const t of [...DATA_TABLES].reverse()) stmts.push({ sql: `DELETE FROM ${t}` });
  for (const t of DATA_TABLES) {
    for (const row of parsed.tables[t]) {
      const cols = Object.keys(row);
      if (!cols.length) continue;
      stmts.push({
        sql: `INSERT INTO ${t} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        params: cols.map((c) => row[c] as SqlParam),
      });
    }
  }
  for (const k of keep) {
    stmts.push({ sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", params: [k.key, k.value] });
  }
  try {
    await db.batch(stmts);
  } catch (e) {
    // Roll back newly written files that did not exist before.
    for (const key of parsed.files.keys()) if (!previousKeys.has(key)) await store.delete(key).catch(() => undefined);
    throw new BackupError(`Restore failed and no changes were made: ${(e as Error).message}`);
  }

  // 3) Remove files no longer referenced.
  for (const key of previousKeys) if (!parsed.files.has(key)) await store.delete(key).catch(() => undefined);

  return { tables: Object.fromEntries(DATA_TABLES.map((t) => [t, parsed.tables[t].length])), files: parsed.files.size };
}
