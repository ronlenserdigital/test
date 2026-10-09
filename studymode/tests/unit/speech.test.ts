import { describe, expect, it } from "vitest";
import { ReadAloud, type SpeechEngine, type VoiceInfo } from "../../src/platform/speech";

class FakeEngine implements SpeechEngine {
  spoken: string[] = [];
  active: { onend: () => void; onerror: (c: string) => void } | null = null;
  constructor(private v: VoiceInfo[] = [{ id: "v", name: "V", lang: "en", local: true, isDefault: true }], private ok = true) {}
  available() {
    return this.ok;
  }
  voices() {
    return this.v;
  }
  onVoicesChanged() {}
  speak(text: string, _p: unknown, h: { onstart: () => void; onend: () => void; onerror: (code: string) => void }) {
    this.spoken.push(text);
    this.active = h;
  }
  cancel() {
    const a = this.active;
    this.active = null;
    a?.onerror("interrupted");
  }
  end() {
    const a = this.active;
    this.active = null;
    a?.onend();
  }
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("read-aloud controller", () => {
  const sections = ["First paragraph one. First paragraph two.\n\nSecond paragraph.", "", "Third section text."];
  const loader = async (i: number) => (i < sections.length ? { text: sections[i], label: `S${i}` } : null);

  it("reads chunks in order, skips empty sections and reports the cursor", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    const cursors: number[][] = [];
    r.onCursor = (c) => cursors.push([c.sectionIdx, c.chunkIdx]);
    await r.playDocument("m", 0, 0, loader, sections.length);
    expect(e.spoken).toEqual(["First paragraph one. First paragraph two."]);
    e.end();
    await tick();
    e.end();
    await tick();
    await tick();
    expect(e.spoken.at(-1)).toBe("Third section text.");
    expect(cursors).toEqual([
      [0, 0],
      [0, 1],
      [2, 0],
    ]);
    e.end();
    await tick();
    expect(r.state.status).toBe("idle");
  });

  it("stops the previous task before starting another (no overlap)", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    await r.playDocument("m", 0, 0, loader, sections.length);
    r.speakText("New selection.");
    expect(r.state.kind).toBe("selection");
    expect(e.spoken.at(-1)).toBe("New selection.");
    e.end(); // ends selection; must not resume the document
    await tick();
    expect(r.state.status).toBe("idle");
    expect(e.spoken).toHaveLength(2);
  });

  it("pause cancels audio and resume restarts the current chunk", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    await r.playDocument("m", 0, 1, loader, sections.length);
    r.pause();
    expect(r.state.status).toBe("paused");
    expect(e.active).toBeNull();
    r.resume();
    expect(e.spoken).toEqual(["Second paragraph.", "Second paragraph."]);
  });

  it("next/prev move by paragraph", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    await r.playDocument("m", 0, 0, loader, sections.length);
    await r.next();
    expect(e.spoken.at(-1)).toBe("Second paragraph.");
    r.prev(); // at start of paragraph → previous paragraph
    expect(e.spoken.at(-1)).toBe("First paragraph one. First paragraph two.");
  });

  it("explains missing voices and unsupported engines", () => {
    const none = new ReadAloud(new FakeEngine([]));
    none.state = { ...none.state, voicesLoaded: true };
    none.speakText("x");
    expect(none.state.error).toMatch(/No speech voices/);
    const unsupported = new ReadAloud(new FakeEngine([], false));
    unsupported.speakText("x");
    expect(unsupported.state.error).toMatch(/not supported/);
  });

  it("surfaces engine errors once and ignores stale interruptions", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    r.speakText("Hello.");
    e.active!.onerror("network");
    expect(r.state.error).toMatch(/network/);
    expect(r.state.status).toBe("idle");
  });

  it("stops when the document being read changes", async () => {
    const e = new FakeEngine();
    const r = new ReadAloud(e);
    await r.playDocument("m", 0, 0, loader, sections.length);
    r.documentChanged("other");
    expect(r.state.status).toBe("playing");
    r.documentChanged("m");
    expect(r.state.status).toBe("idle");
  });
});
