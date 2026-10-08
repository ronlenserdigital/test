/**
 * Ambient sound generated in real time with the Web Audio API — no bundled
 * recordings, so there is nothing to license. Each sound is synthesised from
 * noise sources and filters:
 *  - White noise: looped random buffer (loops are inaudible for noise).
 *  - Rain: band-limited noise with slow intensity variation plus randomly
 *    scheduled droplet transients.
 *  - Café: low "room" rumble, a murmur band with drifting amplitude, and
 *    occasional soft cup clinks.
 * A master "duck" gain lowers ambient volume while read-aloud is speaking.
 */
export type AmbientId = "rain" | "white" | "cafe";

export const AMBIENT_LABELS: Record<AmbientId, string> = {
  rain: "Rain",
  white: "White noise",
  cafe: "Café",
};

export interface AmbientPrefs {
  volumes: Record<AmbientId, number>; // 0–1
  enabled: Record<AmbientId, boolean>;
  muted: boolean;
  duckDuringSpeech: boolean;
  stopWhenSessionEnds: boolean;
}

export const DEFAULT_AMBIENT: AmbientPrefs = {
  volumes: { rain: 0.5, white: 0.3, cafe: 0.4 },
  enabled: { rain: false, white: false, cafe: false },
  muted: false,
  duckDuringSpeech: true,
  stopWhenSessionEnds: true,
};

interface Voice {
  gain: GainNode;
  stop: () => void;
}

export class AmbientMixer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duck: GainNode | null = null;
  private voices = new Map<AmbientId, Voice>();
  private prefs: AmbientPrefs = structuredClone(DEFAULT_AMBIENT);
  private ducked = false;

  static supported() {
    return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      this.ctx = new Ctor();
      this.duck = this.ctx.createGain();
      this.master = this.ctx.createGain();
      this.duck.connect(this.master).connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext, seconds: number, color: "white" | "brown" | "pink"): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (color === "white") d[i] = w * 0.5;
        else if (color === "brown") {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        } else {
          // Paul Kellet's pink noise filter
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      }
      // Crossfade the loop seam.
      const fade = Math.min(2048, Math.floor(len / 10));
      for (let i = 0; i < fade; i++) {
        const t = i / fade;
        d[i] = d[i] * t + d[len - fade + i] * (1 - t);
      }
    }
    return buf;
  }

  private loop(ctx: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopEnd = buf.duration - Math.min(2048, buf.length / 10) / ctx.sampleRate;
    return src;
  }

  private lfo(ctx: AudioContext, freq: number, depth: number, target: AudioParam) {
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g).connect(target);
    o.start();
    return o;
  }

  private build(id: AmbientId): Voice {
    const ctx = this.ensure();
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.duck!);
    const stops: (() => void)[] = [];

    if (id === "white") {
      const src = this.loop(ctx, this.noiseBuffer(ctx, 4, "white"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 9000;
      src.connect(lp).connect(out);
      src.start();
      stops.push(() => src.stop());
    } else if (id === "rain") {
      const src = this.loop(ctx, this.noiseBuffer(ctx, 6, "pink"));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1600;
      bp.Q.value = 0.5;
      const body = ctx.createGain();
      body.gain.value = 0.9;
      src.connect(bp).connect(body).connect(out);
      const l1 = this.lfo(ctx, 0.07, 0.15, body.gain);
      const rumble = this.loop(ctx, this.noiseBuffer(ctx, 5, "brown"));
      const rg = ctx.createGain();
      rg.gain.value = 0.35;
      rumble.connect(rg).connect(out);
      src.start();
      rumble.start();
      // Droplets: short high-passed noise bursts at random times.
      const dropBuf = this.noiseBuffer(ctx, 0.05, "white");
      let alive = true;
      const schedule = () => {
        if (!alive || !this.ctx) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 6; i++) {
          const t = now + Math.random() * 0.5;
          const s = ctx.createBufferSource();
          s.buffer = dropBuf;
          const hp = ctx.createBiquadFilter();
          hp.type = "highpass";
          hp.frequency.value = 2500 + Math.random() * 3000;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.08 + Math.random() * 0.12, t + 0.002);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
          s.connect(hp).connect(g).connect(out);
          s.start(t);
          s.stop(t + 0.05);
        }
        timer = setTimeout(schedule, 500);
      };
      let timer = setTimeout(schedule, 0);
      stops.push(() => {
        alive = false;
        clearTimeout(timer);
        src.stop();
        rumble.stop();
        l1.stop();
      });
    } else {
      const room = this.loop(ctx, this.noiseBuffer(ctx, 5, "brown"));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 400;
      const rg = ctx.createGain();
      rg.gain.value = 0.6;
      room.connect(lp).connect(rg).connect(out);
      const murmur = this.loop(ctx, this.noiseBuffer(ctx, 7, "pink"));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 550;
      bp.Q.value = 1.2;
      const mg = ctx.createGain();
      mg.gain.value = 0.5;
      murmur.connect(bp).connect(mg).connect(out);
      const l1 = this.lfo(ctx, 0.23, 0.18, mg.gain);
      const l2 = this.lfo(ctx, 0.11, 120, bp.frequency);
      room.start();
      murmur.start();
      let alive = true;
      const clink = () => {
        if (!alive || !this.ctx) return;
        const t = ctx.currentTime + 0.05;
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = 2200 + Math.random() * 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.03, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g).connect(out);
        o.start(t);
        o.stop(t + 0.4);
        timer = setTimeout(clink, 3000 + Math.random() * 9000);
      };
      let timer = setTimeout(clink, 4000);
      stops.push(() => {
        alive = false;
        clearTimeout(timer);
        room.stop();
        murmur.stop();
        l1.stop();
        l2.stop();
      });
    }
    return {
      gain: out,
      stop: () => {
        for (const s of stops) {
          try {
            s();
          } catch {
            /* already stopped */
          }
        }
        out.disconnect();
      },
    };
  }

  /** Apply preferences: start/stop sounds and ramp volumes smoothly. */
  apply(prefs: AmbientPrefs) {
    this.prefs = structuredClone(prefs);
    const anyOn = (Object.keys(prefs.enabled) as AmbientId[]).some((k) => prefs.enabled[k]);
    if (!anyOn && !this.ctx) return;
    for (const id of Object.keys(prefs.enabled) as AmbientId[]) {
      const on = prefs.enabled[id] && !prefs.muted;
      let v = this.voices.get(id);
      if (on && !v) {
        v = this.build(id);
        this.voices.set(id, v);
      }
      if (v && this.ctx) {
        const target = on ? prefs.volumes[id] : 0;
        const now = this.ctx.currentTime;
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setTargetAtTime(target, now, 0.25);
        if (!on) {
          const voice = v;
          this.voices.delete(id);
          setTimeout(() => voice.stop(), 1200);
        }
      }
    }
    this.setDuck(this.ducked);
  }

  setDuck(on: boolean) {
    this.ducked = on;
    if (!this.duck || !this.ctx) return;
    const target = on && this.prefs.duckDuringSpeech ? 0.3 : 1;
    this.duck.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  playing(): boolean {
    return this.voices.size > 0 && !this.prefs.muted;
  }

  stopAll() {
    for (const v of this.voices.values()) v.stop();
    this.voices.clear();
  }
}
