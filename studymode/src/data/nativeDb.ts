import { invoke } from "@tauri-apps/api/core";
import type { Db, SqlParam, Statement } from "./db";

/** Native adapter: statements execute in Rust (rusqlite, bundled SQLite). */
export class NativeDb implements Db {
  readonly kind = "native" as const;

  run(sql: string, params: SqlParam[] = []): Promise<number> {
    return invoke<number>("db_execute", { sql, params });
  }
  all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return invoke<T[]>("db_select", { sql, params });
  }
  async batch(statements: Statement[]): Promise<void> {
    await invoke("db_batch", {
      statements: statements.map((s) => ({ sql: s.sql, params: s.params ?? [] })),
    });
  }
  script(sql: string): Promise<void> {
    return invoke("db_exec_script", { sql });
  }
}
