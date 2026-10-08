/** Composition root: builds platform adapters and the repository. */
import { isNative } from "../platform/env";
import type { Db } from "../data/db";
import { migrate } from "../data/migrations";
import { Repo } from "../data/repo";
import { IdbFileStore, IdbKv, MemoryFileStore, NativeFileStore, type FileStore } from "../data/files";
import { ReadAloud, WebSpeechEngine } from "../platform/speech";
import { AmbientMixer } from "../platform/ambient";
import { AnthropicProvider } from "../ai/anthropic";
import type { AiProvider } from "../ai/provider";
import type { PdfJsLike } from "../importers/pdf";

export interface Services {
  repo: Repo;
  speech: ReadAloud;
  ambient: AmbientMixer;
  ai: AiProvider;
  native: boolean;
  /** Where data lives, for Settings → Data. */
  storage: { kind: "native" | "browser" | "memory"; location: string; warning?: string };
  pdfjs: () => Promise<PdfJsLike>;
  flush: () => Promise<void>;
}

let pdfjsPromise: Promise<PdfJsLike> | null = null;
export function loadPdfJs(): Promise<PdfJsLike> {
  pdfjsPromise ??= (async () => {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs as unknown as PdfJsLike;
  })();
  return pdfjsPromise;
}

async function browserDb(): Promise<{ db: Db; files: FileStore; storage: Services["storage"]; flush: () => Promise<void> }> {
  const [{ default: initSqlJs }, wasm] = await Promise.all([import("sql.js"), import("sql.js/dist/sql-wasm.wasm?url")]);
  const SQL = await initSqlJs({ locateFile: () => wasm.default });
  const { SqlJsDb } = await import("../data/sqljsDb");
  let kv: IdbKv | null = null;
  try {
    kv = await IdbKv.open();
  } catch {
    kv = null;
  }
  if (!kv) {
    const db = await SqlJsDb.create(SQL);
    return {
      db,
      files: new MemoryFileStore(),
      storage: { kind: "memory", location: "Memory only", warning: "Browser storage is unavailable (private window?). Nothing will be saved after you close this tab." },
      flush: async () => undefined,
    };
  }
  const image = await kv.get<Uint8Array>("db", "main");
  const store = kv;
  const db = await SqlJsDb.create(SQL, image ?? null, (img) => store.set("db", "main", img));
  if (navigator.storage?.persist) void navigator.storage.persist().catch(() => undefined);
  return {
    db,
    files: new IdbFileStore(kv),
    storage: { kind: "browser", location: "This browser's IndexedDB (development build)" },
    flush: () => db.flush(),
  };
}

export async function initServices(): Promise<Services> {
  const native = isNative();
  let db: Db;
  let files: FileStore;
  let storage: Services["storage"];
  let flush: () => Promise<void> = async () => undefined;
  if (native) {
    const { NativeDb } = await import("../data/nativeDb");
    const { invoke } = await import("@tauri-apps/api/core");
    db = new NativeDb();
    files = new NativeFileStore();
    const info = await invoke<{ data_dir: string }>("app_info").catch(() => ({ data_dir: "app data folder" }));
    storage = { kind: "native", location: info.data_dir };
  } else {
    const b = await browserDb();
    db = b.db;
    files = b.files;
    storage = b.storage;
    flush = b.flush;
  }
  await migrate(db);
  const repo = new Repo(db, files);
  const speech = new ReadAloud(new WebSpeechEngine());
  const ambient = new AmbientMixer();
  const ai = new AnthropicProvider();
  return { repo, speech, ambient, ai, native, storage, pdfjs: loadPdfJs, flush };
}
