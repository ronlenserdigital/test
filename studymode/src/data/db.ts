/**
 * Database abstraction shared by the native (Tauri + rusqlite) adapter and the
 * browser/test adapter (sql.js). Both execute the same SQL from migrations.ts.
 */
export type SqlParam = string | number | null;

export interface Statement {
  sql: string;
  params?: SqlParam[];
}

export interface Db {
  readonly kind: "native" | "sqljs";
  /** Execute one statement; returns affected row count. */
  run(sql: string, params?: SqlParam[]): Promise<number>;
  /** Execute a query and return rows as plain objects. */
  all<T = Record<string, unknown>>(sql: string, params?: SqlParam[]): Promise<T[]>;
  /** Execute statements atomically (all-or-nothing). */
  batch(statements: Statement[]): Promise<void>;
  /** Execute a multi-statement script atomically (migrations). */
  script(sql: string): Promise<void>;
}

export async function one<T>(db: Db, sql: string, params?: SqlParam[]): Promise<T | undefined> {
  const rows = await db.all<T>(sql, params);
  return rows[0];
}
