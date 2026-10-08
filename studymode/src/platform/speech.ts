/**
 * Read-aloud controller over the Web Speech API (speechSynthesis), which the
 * system webviews expose with the OS voices:
 *  - Windows (WebView2): SAPI/OneCore voices, local; some "Online"/"Natural"
 *    voices require network (localService = false).
 *  - macOS (WKWebView): system voices.
 *  - Linux (WebKitGTK): depends on the WebKitGTK build; may be unavailable.
 *  - Android/iOS webviews: support varies; not yet verified (see docs).
 *
 * Design:
 *  - One controller, one active task. Starting a task stops the previous one
 *    (speechSynthesis.cancel) and bumps a generation counter so late events
 *    from cancelled utterances are ignored — no overlapping audio.
 *  - Text is chunked into ≤240-char sentence groups for reliability.
 *  - Pause is implemented as cancel + remember chunk; resume restarts the
 *    current chunk. Native pause/resume is unreliable in several engines.
 */
import { speechChunks, type SpeechChunk } from "../domain/text";

export interface VoiceInfo {
  id: string;
  name: string;
  lang: string;
  local: boolean;
  isDefault: boolean;
}

export interface SpeechPrefs {
  voiceId: string | null;
  rate: number; // 0.5–2
  pitch: number; // 0–2
  volume: number; // 0–1
}

export const DEFAULT_SPEECH: SpeechPrefs = { voiceId: null, rate: 1, pitch: 1, volume: 1 };

export interface DocCursor {
  materialId: string;
  sectionIdx: number;
  chunkIdx: number;
}

export type SpeechStatus = "idle" | "playing" | "paused";

export interface SpeechState {
  supported: boolean;
  voicesLoaded: boolean;
  status: SpeechStatus;
  kind: "selection" | "document" | null;
  cursor: DocCursor | null;
  chunk: SpeechChunk | null;
  sectionLabel: string;
  error: string | null;
}

export interface SectionLoader {
  (sectionIdx: number): Promise<{ text: string; label: string } | null>;
}

type Listener = (s: SpeechState) => void;

export interface SpeechEngine {
  available(): boolean;
  voices(): VoiceInfo[];
  onVoicesChanged(cb: () => void): void;
  speak(text: string, prefs: SpeechPrefs, handlers: { onstart: () => void; onend: () => void; onerror: (code: string) => void }): void;
  cancel(): void;
}

/** Browser/webview engine backed by window.speechSynthesis. */
export class WebSpeechEngine implements SpeechEngine {
  private current: SpeechSynthesisUtterance | null = null;
  available() {
    return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  }
  voices(): VoiceInfo[] {
    if (!this.available()) return [];
    return speechSynthesis.getVoices().map((v) => ({ id: v.voiceURI, name: v.name, lang: v.lang, local: v.localService, isDefault: v.default }));
  }
  onVoicesChanged(cb: () => void) {
    if (this.available()) speechSynthesis.addEventListener("voiceschanged", cb);
  }
  speak(text: string, prefs: SpeechPrefs, h: { onstart: () => void; onend: () => void; onerror: (code: string) => void }) {
    const u = new SpeechSynthesisUtterance(text);
    const voice = speechSynthesis.getVoices().find((v) => v.voiceURI === prefs.voiceId);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = prefs.rate;
    u.pitch = prefs.pitch;
    u.volume = prefs.volume;
    u.onstart = h.onstart;
    u.onend = h.onend;
    u.onerror = (e) => h.onerror(e.error);
    this.current = u; // keep a reference: some engines GC utterances mid-speech
    speechSynthesis.speak(u);
  }
  cancel() {
    if (this.current) {
      // Detach handlers so a cancelled utterance cannot report late events.
      this.current.onend = null;
      this.current.onerror = null;
    }
    if (this.available()) speechSynthesis.cancel();
    this.current = null;
  }
}

const ERROR_TEXT: Record<string, string> = {
  "synthesis-unavailable": "Speech synthesis is unavailable on this device.",
  "synthesis-failed": "The speech engine failed to read this passage.",
  "voice-unavailable": "The selected voice is not available. Choose another voice in Settings.",
  "audio-busy": "The audio device is busy. Close other audio apps and try again.",
  "audio-hardware": "No audio output device was found.",
  network: "This voice needs a network connection. Choose an on-device voice to read offline.",
  "language-unavailable": "No voice is installed for this language.",
  "text-too-long": "This passage is too long for the speech engine.",
  "invalid-argument": "The speech settings are invalid (rate, pitch or volume).",
  "not-allowed": "Playback was blocked. Click Play to start reading.",
};

export class ReadAloud {
  private gen = 0;
  private chunks: SpeechChunk[] = [];
  private loader: SectionLoader | null = null;
  private listeners = new Set<Listener>();
  private sectionCount = 0;
  prefs: SpeechPrefs = { ...DEFAULT_SPEECH };
  state: SpeechState;
  /** Called with the cursor whenever a chunk starts (for persistence). */
  onCursor: ((c: DocCursor) => void) | null = null;

  constructor(private readonly engine: SpeechEngine) {
    this.state = {
      supported: engine.available(),
      voicesLoaded: engine.voices().length > 0,
      status: "idle",
      kind: null,
      cursor: null,
      chunk: null,
      sectionLabel: "",
      error: null,
    };
    engine.onVoicesChanged(() => this.set({ voicesLoaded: engine.voices().length > 0 }));
    // Some engines never fire voiceschanged; settle after a short wait.
    if (typeof setTimeout !== "undefined") setTimeout(() => this.set({ voicesLoaded: true }), 1500);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private set(patch: Partial<SpeechState>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }

  voices() {
    return this.engine.voices();
  }
  /** Voices exist but none is on-device. */
  onlyNetworkVoices() {
    const v = this.voices();
    return v.length > 0 && v.every((x) => !x.local);
  }

  setPrefs(p: Partial<SpeechPrefs>) {
    this.prefs = { ...this.prefs, ...p };
  }

  private guard(): boolean {
    if (!this.state.supported) {
      this.set({ error: "Read aloud is not supported in this environment." });
      return false;
    }
    if (this.state.voicesLoaded && this.voices().length === 0) {
      this.set({ error: "No speech voices are installed. See Settings → Read aloud for setup steps." });
      return false;
    }
    return true;
  }

  /** Read arbitrary text (a selection). Stops any current reading first. */
  speakText(text: string) {
    this.stop();
    if (!this.guard()) return;
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    this.chunks = chunks;
    this.loader = null;
    this.set({ kind: "selection", cursor: null, sectionLabel: "Selection", error: null });
    this.playChunk(0);
  }

  /** Read a document from a cursor, continuing through following sections. */
  async playDocument(materialId: string, sectionIdx: number, chunkIdx: number, loader: SectionLoader, sectionCount: number) {
    this.stop();
    if (!this.guard()) return;
    this.loader = loader;
    this.sectionCount = sectionCount;
    const ok = await this.loadSection(materialId, sectionIdx);
    if (!ok) return;
    this.set({ kind: "document", error: null });
    this.playChunk(Math.min(chunkIdx, this.chunks.length - 1), materialId, sectionIdx);
  }

  private async loadSection(materialId: string, sectionIdx: number): Promise<boolean> {
    let idx = sectionIdx;
    while (this.loader && idx < this.sectionCount) {
      const sec = await this.loader(idx);
      if (!sec) break;
      const chunks = speechChunks(sec.text);
      if (chunks.length) {
        this.chunks = chunks;
        this.set({ cursor: { materialId, sectionIdx: idx, chunkIdx: 0 }, sectionLabel: sec.label });
        return true;
      }
      idx++; // skip empty sections (e.g. image-only pages)
    }
    return false;
  }

  private playChunk(i: number, materialId?: string, sectionIdx?: number) {
    const chunk = this.chunks[i];
    if (!chunk) return;
    const gen = ++this.gen;
    this.engine.cancel();
    const cursor =
      this.state.kind === "document" && (materialId ?? this.state.cursor?.materialId)
        ? { materialId: materialId ?? this.state.cursor!.materialId, sectionIdx: sectionIdx ?? this.state.cursor!.sectionIdx, chunkIdx: i }
        : null;
    this.set({ status: "playing", chunk, cursor });
    if (cursor) this.onCursor?.(cursor);
    this.engine.speak(chunk.text, this.prefs, {
      onstart: () => undefined,
      onend: () => {
        if (gen !== this.gen) return;
        void this.advance(i);
      },
      onerror: (code) => {
        if (gen !== this.gen) return; // stale (cancelled) utterance
        if (code === "interrupted" || code === "canceled") return;
        this.gen++;
        this.engine.cancel();
        this.set({ status: "idle", error: ERROR_TEXT[code] ?? `Read aloud stopped (${code}).` });
      },
    });
  }

  private async advance(i: number) {
    if (i + 1 < this.chunks.length) return this.playChunk(i + 1);
    if (this.state.kind === "document" && this.state.cursor && this.loader) {
      const gen = this.gen;
      const next = this.state.cursor.sectionIdx + 1;
      const ok = await this.loadSection(this.state.cursor.materialId, next);
      if (gen !== this.gen) return; // stopped while loading
      if (ok) return this.playChunk(0);
    }
    this.finish();
  }

  private finish() {
    this.gen++;
    this.set({ status: "idle", chunk: null });
  }

  pause() {
    if (this.state.status !== "playing") return;
    this.gen++;
    this.engine.cancel();
    this.set({ status: "paused" });
  }

  resume() {
    if (this.state.status !== "paused") return;
    const i = this.currentIndex();
    this.playChunk(Math.max(0, i));
  }

  toggle() {
    if (this.state.status === "playing") this.pause();
    else if (this.state.status === "paused") this.resume();
  }

  stop() {
    this.gen++;
    this.engine.cancel();
    this.set({ status: "idle", chunk: null, kind: null, cursor: null, sectionLabel: "" });
  }

  private currentIndex(): number {
    if (this.state.cursor) return this.state.cursor.chunkIdx;
    return this.state.chunk ? this.chunks.indexOf(this.state.chunk) : 0;
  }

  /** Jump to the next paragraph (or section). */
  async next() {
    if (this.state.status === "idle") return;
    const i = this.currentIndex();
    const para = this.chunks[i]?.para ?? 0;
    const j = this.chunks.findIndex((c, k) => k > i && c.para > para);
    if (j !== -1) return this.playChunk(j);
    if (this.state.kind === "document" && this.state.cursor) {
      const gen = ++this.gen;
      this.engine.cancel();
      const ok = await this.loadSection(this.state.cursor.materialId, this.state.cursor.sectionIdx + 1);
      if (gen === this.gen && ok) return this.playChunk(0);
    }
    this.finish();
  }

  /** Jump to the start of the current paragraph, or the previous one if already at its start. */
  prev() {
    if (this.state.status === "idle") return;
    const i = this.currentIndex();
    const para = this.chunks[i]?.para ?? 0;
    const startOfPara = this.chunks.findIndex((c) => c.para === para);
    const target = startOfPara < i ? para : Math.max(0, para - 1);
    const j = this.chunks.findIndex((c) => c.para === target);
    this.playChunk(Math.max(0, j));
  }

  /** The document being read changed underneath us (edited/deleted). */
  documentChanged(materialId: string) {
    if (this.state.cursor?.materialId === materialId) this.stop();
  }

  clearError() {
    this.set({ error: null });
  }
}
