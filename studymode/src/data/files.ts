import { invoke } from "@tauri-apps/api/core";

/** App-managed storage for imported originals. */
export interface FileStore {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, Uint8Array>();
  async put(key: string, data: Uint8Array) {
    this.files.set(key, data.slice());
  }
  async get(key: string) {
    const f = this.files.get(key);
    if (!f) throw new Error(`Stored file not found: ${key}`);
    return f.slice();
  }
  async delete(key: string) {
    this.files.delete(key);
  }
  async list() {
    return [...this.files.keys()];
  }
}

export class NativeFileStore implements FileStore {
  async put(key: string, data: Uint8Array) {
    await invoke("file_put", data, { headers: { "x-file-key": key } });
  }
  async get(key: string) {
    const buf = await invoke<ArrayBuffer | number[]>("file_get", { key });
    return buf instanceof ArrayBuffer ? new Uint8Array(buf) : Uint8Array.from(buf);
  }
  async delete(key: string) {
    await invoke("file_delete", { key });
  }
  list() {
    return invoke<string[]>("file_list");
  }
}

/** IndexedDB-backed storage used by the browser build (development/testing). */
export class IdbFileStore implements FileStore {
  constructor(private readonly idb: IdbKv) {}
  put(key: string, data: Uint8Array) {
    return this.idb.set("files", key, data);
  }
  async get(key: string) {
    const v = await this.idb.get<Uint8Array>("files", key);
    if (!v) throw new Error(`Stored file not found: ${key}`);
    return v;
  }
  delete(key: string) {
    return this.idb.del("files", key);
  }
  list() {
    return this.idb.keys("files");
  }
}

/** Minimal promise wrapper around IndexedDB with two stores: "db" and "files". */
export class IdbKv {
  private constructor(private readonly db: IDBDatabase) {}

  static open(name = "studymode"): Promise<IdbKv> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("db");
        req.result.createObjectStore("files");
      };
      req.onsuccess = () => resolve(new IdbKv(req.result));
      req.onerror = () => reject(req.error);
    });
  }

  private tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = this.db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error ?? new Error("IndexedDB transaction aborted"));
    });
  }
  get<T>(store: string, key: string) {
    return this.tx<T | undefined>(store, "readonly", (s) => s.get(key));
  }
  async set(store: string, key: string, value: unknown) {
    await this.tx(store, "readwrite", (s) => s.put(value, key));
  }
  async del(store: string, key: string) {
    await this.tx(store, "readwrite", (s) => s.delete(key));
  }
  async keys(store: string) {
    const k = await this.tx(store, "readonly", (s) => s.getAllKeys());
    return k.map(String);
  }
}
