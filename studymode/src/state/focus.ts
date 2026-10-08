/**
 * Focus session controller: owns the single active timer, persists it so it
 * survives restarts, and records the finished session exactly once.
 */
import { finish, pause, POMODORO, resume, skipPhase, continueNext, startTimer, tick, type TimerState } from "../domain/timer";
import { uid } from "../data/repo";
import { nativeWindow } from "../platform/nativeWindow";
import { useApp, updatePrefs } from "./store";

const KEY = "activeTimer";
const HEARTBEAT_PERSIST_MS = 15_000;
let lastPersist = 0;
let loop: ReturnType<typeof setInterval> | null = null;

async function persist(t: TimerState | null) {
  const repo = useApp.getState().services?.repo;
  if (!repo) return;
  lastPersist = Date.now();
  if (t) await repo.setSetting(KEY, t, false);
  else await repo.deleteSetting(KEY);
}

function set(t: TimerState | null, save = true) {
  const prev = useApp.getState().timer;
  useApp.getState().setTimer(t);
  if (prev && t && prev.phase !== t.phase && !t.awaitingNext) chime(t.phase);
  if (prev && t && !prev.awaitingNext && t.awaitingNext) chime(t.phase);
  if (save) void persist(t);
}

let audio: AudioContext | null = null;
function chime(phase: "focus" | "break") {
  if (!useApp.getState().prefs.focus.chime) return;
  try {
    audio ??= new AudioContext();
    const t = audio.currentTime;
    const notes = phase === "break" ? [660, 523] : [523, 660];
    notes.forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.25);
      g.gain.exponentialRampToValueAtTime(0.15, t + i * 0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 0.6);
      o.connect(g).connect(audio!.destination);
      o.start(t + i * 0.25);
      o.stop(t + i * 0.25 + 0.7);
    });
  } catch {
    /* audio unavailable: silent */
  }
}

function ensureLoop() {
  if (loop) return;
  loop = setInterval(() => {
    const t = useApp.getState().timer;
    if (!t) return;
    const now = Date.now();
    const next = tick(t, now);
    const changed = next.phase !== t.phase || next.status !== t.status || next.awaitingNext !== t.awaitingNext;
    set(next, changed || now - lastPersist > HEARTBEAT_PERSIST_MS);
    if (changed && next.interruptedAt) {
      useApp.getState().toast("Timer paused: StudyMode wasn't running or the device slept. That time was not counted.", "info", true);
    }
  }, 1000);
}

/** Restore a persisted timer after app start (gap reconciliation happens in tick). */
export async function restoreTimer() {
  const repo = useApp.getState().services!.repo;
  const saved = await repo.getSetting<TimerState | null>(KEY, null);
  if (!saved || typeof saved !== "object" || !saved.id) return;
  const next = tick(saved, Date.now());
  set(next);
  ensureLoop();
  if (next.interruptedAt) {
    useApp.getState().toast("Your focus session was interrupted. Resume it or end it to save your study time.", "info", true);
  }
}

export function startFocus(task: string) {
  const { prefs, timer } = useApp.getState();
  if (timer) return;
  const settings = prefs.focus.mode === "pomodoro" ? POMODORO : prefs.focus.custom;
  set(startTimer({ id: uid(), certId: prefs.currentCertId, task: task.trim(), settings, now: Date.now() }));
  ensureLoop();
  if (prefs.focus.keepOnTop && nativeWindow.supported()) void nativeWindow.setAlwaysOnTop(true).catch(() => undefined);
}

export function pauseFocus() {
  const t = useApp.getState().timer;
  if (t) set(pause(t, Date.now()));
}
export function resumeFocus() {
  const t = useApp.getState().timer;
  if (t) set(resume(t, Date.now()));
}
export function skipFocusPhase() {
  const t = useApp.getState().timer;
  if (t) set(skipPhase(t, Date.now()));
}
export function continueFocus() {
  const t = useApp.getState().timer;
  if (t) set(continueNext(t, Date.now()));
}
export function setFocusTask(task: string) {
  const t = useApp.getState().timer;
  if (t) set({ ...t, task });
}

/** End the session, save it to history (idempotent by timer id) and clean up. */
export async function endFocus(): Promise<{ saved: boolean; focusSec: number }> {
  const { timer, services, prefs, toast } = useApp.getState();
  if (!timer || !services) return { saved: false, focusSec: 0 };
  const sum = finish(timer, Date.now());
  let saved = false;
  if (sum.focusSec >= 60) {
    const status = timer.interruptedAt != null ? "interrupted" : sum.completedCycles > 0 ? "completed" : "ended_early";
    await services.repo.recordSession({
      certId: timer.certId,
      kind: "focus",
      task: timer.task,
      startedAt: sum.startedAt,
      endedAt: sum.endedAt,
      focusSec: sum.focusSec,
      breakSec: sum.breakSec,
      pausedSec: sum.pausedSec,
      plannedFocusSec: sum.plannedFocusSec,
      status,
      timerId: timer.id,
    });
    saved = true;
  }
  set(null);
  if (loop) {
    clearInterval(loop);
    loop = null;
  }
  // Clean up only what this session turned on.
  if (prefs.focus.keepOnTop && nativeWindow.supported()) void nativeWindow.setAlwaysOnTop(false).catch(() => undefined);
  if (prefs.ambient.stopWhenSessionEnds) {
    await updatePrefs((p) => ({ ...p, ambient: { ...p.ambient, enabled: { rain: false, white: false, cafe: false } } }));
  }
  toast(saved ? `Session saved: ${Math.round(sum.focusSec / 60)} min of focused study.` : "Sessions shorter than one minute are not saved.", saved ? "success" : "info", true);
  return { saved, focusSec: sum.focusSec };
}
