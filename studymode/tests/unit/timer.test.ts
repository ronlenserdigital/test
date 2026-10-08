import { describe, expect, it } from "vitest";
import { continueNext, finish, GAP_MS, pause, POMODORO, remaining, resume, skipPhase, startTimer, tick } from "../../src/domain/timer";

const MIN = 60_000;
const t0 = 1_000_000_000_000;
const start = (over = {}) => startTimer({ id: "t", certId: "c", task: "Read", settings: { ...POMODORO, ...over }, now: t0 });

/** Simulate a live app ticking every `step` ms up to `until`. */
function run(s: ReturnType<typeof start>, from: number, until: number, step = 1000) {
  let st = s;
  for (let t = from + step; t <= until; t += step) st = tick(st, t);
  return st;
}

describe("focus timer", () => {
  it("remaining is computed from the deadline, not a counter", () => {
    const s = start();
    expect(remaining(s, t0 + 10 * MIN)).toBe(15 * MIN);
    // Even with no ticks in between (throttled while minimised), value is right.
    expect(remaining(tick(s, t0 + 4 * MIN), t0 + 4 * MIN)).toBe(21 * MIN);
  });

  it("rolls into a break and records focus separately from break", () => {
    let s = run(start(), t0, t0 + 27 * MIN, 30_000);
    expect(s.phase).toBe("break");
    expect(s.cycle).toBe(1);
    const sum = finish(s, t0 + 27 * MIN);
    expect(sum.focusSec).toBe(25 * 60);
    expect(sum.breakSec).toBe(2 * 60);
  });

  it("uses a long break after the configured number of cycles", () => {
    const s = run(start({ focusMin: 1, breakMin: 1, longBreakMin: 3, cyclesBeforeLong: 2 }), t0, t0 + 3.5 * MIN, 10_000);
    expect(s.cycle).toBe(2);
    expect(s.phase).toBe("break");
    expect(s.phaseMs).toBe(3 * MIN);
  });

  it("pause and resume exclude paused time from study time", () => {
    let s = start();
    s = run(s, t0, t0 + 5 * MIN);
    s = pause(s, t0 + 5 * MIN);
    expect(remaining(s, t0 + 9 * MIN)).toBe(20 * MIN);
    s = resume(s, t0 + 9 * MIN);
    s = run(s, t0 + 9 * MIN, t0 + 12 * MIN);
    const sum = finish(s, t0 + 12 * MIN);
    expect(sum.focusSec).toBe(8 * 60);
    expect(sum.pausedSec).toBe(4 * 60);
  });

  it("pausing twice does not double count", () => {
    let s = run(start(), t0, t0 + 2 * MIN);
    s = pause(s, t0 + 2 * MIN);
    s = pause(s, t0 + 3 * MIN);
    expect(finish(s, t0 + 3 * MIN).focusSec).toBe(2 * 60);
  });

  it("an unobserved gap (sleep/close) is not counted as study and auto-pauses", () => {
    let s = run(start(), t0, t0 + 10 * MIN);
    // App closed/slept for an hour; next observation:
    s = tick(s, t0 + 70 * MIN);
    expect(s.status).toBe("paused");
    expect(s.interruptedAt).toBe(t0 + 10 * MIN);
    expect(remaining(s, t0 + 70 * MIN)).toBe(15 * MIN);
    const sum = finish(s, t0 + 71 * MIN);
    expect(sum.focusSec).toBe(10 * 60);
    expect(sum.endedAt).toBe(t0 + 10 * MIN);
    expect(sum.pausedSec).toBe(0);
  });

  it("after a restart the user can resume; the gap becomes paused time", () => {
    let s = run(start(), t0, t0 + 10 * MIN);
    // persisted & restored: JSON round trip
    s = JSON.parse(JSON.stringify(s));
    s = tick(s, t0 + 40 * MIN);
    s = resume(s, t0 + 41 * MIN);
    s = run(s, t0 + 41 * MIN, t0 + 46 * MIN);
    const sum = finish(s, t0 + 46 * MIN);
    expect(sum.focusSec).toBe(15 * 60);
    expect(sum.pausedSec).toBe(31 * 60);
  });

  it("short gaps below the threshold (throttled timers) still count", () => {
    let s = start();
    s = tick(s, t0 + GAP_MS - 1000);
    expect(s.status).toBe("running");
    expect(finish(s, t0 + GAP_MS - 1000).focusSec).toBe(Math.round((GAP_MS - 1000) / 1000));
  });

  it("waits for the user when autoContinue is off", () => {
    let s = run(start({ autoContinue: false, focusMin: 1 }), t0, t0 + 3 * MIN);
    expect(s.awaitingNext).toBe(true);
    expect(s.phase).toBe("break");
    expect(finish(s, t0 + 3 * MIN).focusSec).toBe(60);
    s = continueNext(s, t0 + 3 * MIN);
    s = run(s, t0 + 3 * MIN, t0 + 4 * MIN);
    const sum = finish(s, t0 + 4 * MIN);
    expect(sum.breakSec).toBe(60);
    expect(sum.pausedSec).toBe(120);
  });

  it("skip break goes straight to focus", () => {
    let s = run(start({ focusMin: 1 }), t0, t0 + 1.5 * MIN);
    expect(s.phase).toBe("break");
    s = skipPhase(s, t0 + 1.5 * MIN);
    expect(s.phase).toBe("focus");
    expect(s.status).toBe("running");
    const sum = finish(run(s, t0 + 1.5 * MIN, t0 + 2 * MIN), t0 + 2 * MIN);
    expect(sum.focusSec).toBe(90);
    expect(sum.breakSec).toBe(30);
  });
});
