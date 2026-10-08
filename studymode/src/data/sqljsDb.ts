import type { Database, SqlJsStatic } from "sql.js";
import type { Db, SqlParam, Statement } from "./db";

/**
 * sql.js (SQLite compiled to WebAssembly) adapter. Used for browser
 * development, automated browser tests, and Node integration tests. In the
 * browser the database image is persisted to IndexedDB after writes.
 */
export class SqlJsDb implements Db {
  readonly kind = "sqljs" as const;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly db: Database,
    private readonly onPersist?: (image: Uint8Array) => Promise<void>,
  ) {
    db.run("PRAGMA foreign_keys = ON");
  }

  static async create(SQL: SqlJsStatic, image?: Uint8Array | null, onPersist?: (image: Uint8Array) => Promise<void>) {
    return new SqlJsDb(image ? new SQL.Database(image) : new SQL.Database(), onPersist);
  }

  /** Serialise all operations so a batch is never interleaved with another call. */
  private serial<T>(fn: () => T): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private schedulePersist() {
    if (!this.onPersist) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.flush();
    }, 250);
  }

  async flush(): Promise<void> {
    if (!this.onPersist) return;
    const image = await this.serial(() => this.db.export());
    // export() resets PRAGMAs on some builds; re-assert foreign keys.
    this.db.run("PRAGMA foreign_keys = ON");
    await this.onPersist(image);
  }

  run(sql: string, params: SqlParam[] = []): Promise<number> {
    return this.serial(() => {
      this.db.run(sql, params);
      this.schedulePersist();
      return this.db.getRowsModified();
    });
  }

  all<T = Record<string, unknown>>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return this.serial(() => {
      const stmt = this.db.prepare(sql);
      try {
        stmt.bind(params);
        const out: T[] = [];
        while (stmt.step()) out.push(stmt.getAsObject() as T);
        return out;
      } finally {
        stmt.free();
      }
    });
  }

  batch(statements: Statement[]): Promise<void> {
    return this.serial(() => {
      this.db.run("BEGIN");
      try {
        for (const s of statements) this.db.run(s.sql, s.params ?? []);
        this.db.run("COMMIT");
      } catch (e) {
        this.db.run("ROLLBACK");
        throw e;
      }
      this.schedulePersist();
    });
  }

  script(sql: string): Promise<void> {
    return this.serial(() => {
      this.db.run("BEGIN");
      try {
        this.db.exec(sql);
        this.db.run("COMMIT");
      } catch (e) {
        this.db.run("ROLLBACK");
        throw e;
      }
      this.schedulePersist();
    });
  }

  close() {
    this.db.close();
  }
}
