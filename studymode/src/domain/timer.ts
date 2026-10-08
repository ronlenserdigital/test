/**
 * Focus timer as a pure state machine driven by wall-clock timestamps.
 *
 * Accuracy model:
 *  - Remaining time is always `deadline − now`, never a decremented counter,
 *    so throttled timers while minimised still show the right value.
 *  - Elapsed time is accrued per segment (focus/break) only when a segment
 *    closes, so totals cannot be double-counted.
 *  - A heartbeat records the last time the app was observed alive. If the gap
 *    between heartbeats exceeds GAP_MS (device slept, app closed or crashed),
 *    the unobserved time is NOT counted as study: the timer is paused at the
 *    last heartbeat and the gap is recorded as paused time. The user can then
 *    resume or end the session.
 */

export type TimerPhase = "focus" | "break";
export type TimerStatus = "running" | "paused";

export interface TimerSettings {
  focusMin: number;
  breakMin: number;
  longBreakMin: number;
  cyclesBeforeLong: number;
  /** Start the next phase automatically when one ends. */
  autoContinue: boolean;
}

export const POMODORO: TimerSettings = { focusMin: 25, breakMin: 5, longBreakMin: 15, cyclesBeforeLong: 4, autoContinue: true };

export interface TimerState {
  id: string;
  certId: string | null;
  task: string;
  settings: TimerSettings;
  startedAt: number;
  status: TimerStatus;
  phase: TimerPhase;
  /** Completed focus phases. */
  cycle: number;
  /** Phase duration for the current phase. */
  phaseMs: number;
  /** Remaining phase time at segmentStart (for running) or frozen (paused). */
  remainingMs: number;
  segmentStart: number;
  focusMs: number;
  breakMs: number;
  pausedMs: number;
  lastHeartbeat: number;
  /** Set when the timer auto-paused after an unobserved gap. */
  interruptedAt: number | null;
  /** Phase finished and waiting for the user (autoContinue = false). */
  awaitingNext: boolean;
}

export const GAP_MS = 5 * 60 * 1000;

const min = (m: number) => Math.round(m * 60_000);

export function startTimer(opts: { id: string; certId: string | null; task: string; settings: TimerSettings; now: number }): TimerState {
  const phaseMs = min(opts.settings.focusMin);
  return {
    id: opts.id,
    certId: opts.certId,
    task: opts.task,
    settings: opts.settings,
    startedAt: opts.now,
    status: "running",
    phase: "focus",
    cycle: 0,
    phaseMs,
    remainingMs: phaseMs,
    segmentStart: opts.now,
    focusMs: 0,
    breakMs: 0,
    pausedMs: 0,
    lastHeartbeat: opts.now,
    interruptedAt: null,
    awaitingNext: false,
  };
}

export function remaining(s: TimerState, now: number): number {
  if (s.status === "paused" || s.awaitingNext) return Math.max(0, s.remainingMs);
  return Math.max(0, s.remainingMs - (now - s.segmentStart));
}

function accrue(s: TimerState, ms: number): TimerState {
  if (ms <= 0) return s;
  return s.phase === "focus" ? { ...s, focusMs: s.focusMs + ms } : { ...s, breakMs: s.breakMs + ms };
}

function nextPhase(s: TimerState, at: number): TimerState {
  if (s.phase === "focus") {
    const cycle = s.cycle + 1;
    const long = s.settings.cyclesBeforeLong > 0 && cycle % s.settings.cyclesBeforeLong === 0;
    const phaseMs = min(long ? s.settings.longBreakMin : s.settings.breakMin);
    return { ...s, cycle, phase: "break", phaseMs, remainingMs: phaseMs, segmentStart: at, awaitingNext: !s.settings.autoContinue };
  }
  const phaseMs = min(s.settings.focusMin);
  return { ...s, phase: "focus", phaseMs, remainingMs: phaseMs, segmentStart: at, awaitingNext: !s.settings.autoContinue };
}

/**
 * Advance the timer to `now`: detect unobserved gaps, then roll over any
 * phases whose deadlines have passed.
 */
export function tick(state: TimerState, now: number): TimerState {
  let s = state;
  if (s.status === "running" && !s.awaitingNext && now - s.lastHeartbeat > GAP_MS) {
    // Count only up to the last observed moment; the rest is a pause.
    const seen = s.lastHeartbeat;
    s = advanceTo(s, seen);
    if (!s.awaitingNext) {
      const frozen = remaining(s, seen);
      s = accrue(s, seen - s.segmentStart);
      s = { ...s, remainingMs: frozen };
    }
    s = { ...s, status: "paused", segmentStart: seen, interruptedAt: seen, awaitingNext: false };
    return { ...s, lastHeartbeat: now };
  }
  s = advanceTo(s, now);
  return { ...s, lastHeartbeat: now };
}

function advanceTo(state: TimerState, now: number): TimerState {
  let s = state;
  let guard = 0;
  while (s.status === "running" && !s.awaitingNext && guard++ < 1000) {
    const deadline = s.segmentStart + s.remainingMs;
    if (now < deadline) break;
    s = accrue(s, deadline - s.segmentStart);
    s = nextPhase(s, deadline);
  }
  return s;
}

export function pause(state: TimerState, now: number): TimerState {
  let s = tick(state, now);
  if (s.status === "paused") return s;
  if (s.awaitingNext) return { ...s, status: "paused", segmentStart: now };
  const rem = remaining(s, now);
  s = accrue(s, now - s.segmentStart);
  return { ...s, status: "paused", remainingMs: rem, segmentStart: now };
}

export function resume(state: TimerState, now: number): TimerState {
  if (state.status !== "paused") return state;
  return {
    ...state,
    status: "running",
    pausedMs: state.pausedMs + Math.max(0, now - state.segmentStart),
    segmentStart: now,
    lastHeartbeat: now,
    interruptedAt: null,
  };
}

/** Continue after a phase ended with autoContinue = false. */
export function continueNext(state: TimerState, now: number): TimerState {
  if (!state.awaitingNext) return state;
  const waited = Math.max(0, now - state.segmentStart);
  return { ...state, awaitingNext: false, status: "running", segmentStart: now, pausedMs: state.pausedMs + waited, lastHeartbeat: now };
}

/** Skip the current break and go straight to focus (or end focus early into break). */
export function skipPhase(state: TimerState, now: number): TimerState {
  let s = state.status === "running" ? pause(state, now) : state;
  s = nextPhase({ ...s, awaitingNext: false }, now);
  return { ...s, status: "running", awaitingNext: false, lastHeartbeat: now };
}

export interface TimerSummary {
  focusSec: number;
  breakSec: number;
  pausedSec: number;
  startedAt: number;
  endedAt: number;
  plannedFocusSec: number;
  completedCycles: number;
}

/** Close the timer and return final totals (focus excludes breaks and pauses). */
export function finish(state: TimerState, now: number): TimerSummary {
  let s = tick(state, now);
  let endedAt = now;
  if (s.status === "running" && !s.awaitingNext) {
    s = accrue(s, now - s.segmentStart);
  } else if (s.status === "paused" || s.awaitingNext) {
    // Paused time up to now counts as paused, but if interrupted, the session
    // effectively ended at the last observed moment.
    if (s.interruptedAt != null) endedAt = s.interruptedAt;
    else s = { ...s, pausedMs: s.pausedMs + Math.max(0, now - s.segmentStart) };
  }
  return {
    focusSec: Math.round(s.focusMs / 1000),
    breakSec: Math.round(s.breakMs / 1000),
    pausedSec: Math.round(s.pausedMs / 1000),
    startedAt: s.startedAt,
    endedAt,
    plannedFocusSec: Math.round((s.settings.focusMin * 60) * Math.max(1, s.cycle + (s.phase === "focus" ? 1 : 0))),
    completedCycles: s.cycle,
  };
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
