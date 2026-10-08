import { describe, expect, it } from "vitest";
import { formatInterval, makeScheduler, newSchedule, preview, review } from "../../src/domain/srs";

const DAY = 86_400_000;
const t0 = Date.UTC(2026, 0, 1, 9);

describe("FSRS scheduling", () => {
  const f = makeScheduler({ enableFuzz: false });

  it("new cards are due immediately and in state New", () => {
    const s = newSchedule(t0);
    expect(s.state).toBe(0);
    expect(s.due).toBe(t0);
    expect(s.reps).toBe(0);
  });

  it("ratings order the next interval: Again < Hard < Good < Easy", () => {
    const p = preview(f, newSchedule(t0), t0);
    expect(p[1]).toBeLessThan(p[2]);
    expect(p[2]).toBeLessThan(p[3]);
    expect(p[3]).toBeLessThan(p[4]);
  });

  it("Good repeatedly grows the interval, Again causes a lapse", () => {
    let s = newSchedule(t0);
    let now = t0;
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = review(f, s, 3, now);
      intervals.push(r.schedule.due - now);
      s = r.schedule;
      now = s.due;
    }
    for (let i = 2; i < intervals.length; i++) expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    expect(s.state).toBe(2);
    const lapse = review(f, s, 1, now);
    expect(lapse.schedule.lapses).toBe(1);
    expect(lapse.schedule.state).toBe(3); // Relearning
    expect(lapse.schedule.due - now).toBeLessThan(DAY);
    expect(lapse.log.rating).toBe(1);
  });

  it("is deterministic without fuzz", () => {
    const a = review(f, newSchedule(t0), 4, t0).schedule;
    const b = review(f, newSchedule(t0), 4, t0).schedule;
    expect(a).toEqual(b);
  });

  it("rejects invalid grades", () => {
    expect(() => review(f, newSchedule(t0), 0 as never, t0)).toThrow();
  });

  it("formats intervals", () => {
    expect(formatInterval(60_000)).toBe("1m");
    expect(formatInterval(3 * 3600_000)).toBe("3h");
    expect(formatInterval(4 * DAY)).toBe("4d");
    expect(formatInterval(90 * DAY)).toBe("3mo");
  });
});
