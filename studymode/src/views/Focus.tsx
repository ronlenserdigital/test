import { useState } from "react";
import { useApp, updatePrefs } from "../state/store";
import { useLive, useNow, useServices } from "../state/hooks";
import { continueFocus, endFocus, pauseFocus, resumeFocus, setFocusTask, skipFocusPhase, startFocus } from "../state/focus";
import { formatClock, POMODORO, remaining } from "../domain/timer";
import { Button, Field, Toggle, fmtDateTime, fmtMinutes, ConfirmButton } from "../ui/components";
import { Icon } from "../ui/icons";
import { ComfortControls, SpeechPlayer } from "../ui/Shell";
import { Page } from "./common";
import { CAPABILITIES, STATUS_LABEL } from "../platform/capabilities";
import { detectOs, OS_LABEL } from "../platform/env";

export const focusTaskDraft = { value: "" };

function Dial({ fraction, phase, children }: { fraction: number; phase: "focus" | "break"; children: React.ReactNode }) {
  const r = 140;
  const c = 2 * Math.PI * r;
  return (
    <div className={`dial ${phase}`}>
      <svg viewBox="0 0 320 320" aria-hidden="true">
        <circle className="track" cx="160" cy="160" r={r} fill="none" strokeWidth="14" />
        <circle className="bar" cx="160" cy="160" r={r} fill="none" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, fraction)))} />
      </svg>
      <div className="center">{children}</div>
    </div>
  );
}

function ProtectionSummary() {
  const os = detectOs();
  const { native } = useServices();
  const focus = useApp((s) => s.prefs.focus);
  const navigate = useApp((s) => s.navigate);
  const key = os === "unknown" ? "windows" : os;
  const notif = CAPABILITIES.find((c) => c.id === "notifications")!.cells[key];
  const web = CAPABILITIES.find((c) => c.id === "website-blocking")!.cells[key];
  return (
    <div className="card tight stack" style={{ gap: 6 }}>
      <strong>
        <Icon name="shield" style={{ width: 16, height: 16, verticalAlign: "-3px" }} /> Protection active on {OS_LABEL[os]}
      </strong>
      <ul className="subtle" style={{ margin: 0, paddingLeft: 18 }}>
        <li>In-app focus: {focus.hideNav ? "navigation hidden" : "navigation visible"}, {focus.muteAlerts ? "StudyMode alerts muted" : "alerts on"}.</li>
        <li>Window on top: {native ? (focus.keepOnTop ? "on (a reminder only — other apps can still open)" : "off") : "desktop app only"}.</li>
        <li>System notifications: {STATUS_LABEL[notif.status].toLowerCase()} — not controlled by StudyMode.</li>
        <li>Website blocking: {STATUS_LABEL[web.status].toLowerCase()} — not controlled by StudyMode.</li>
      </ul>
      <div>
        <Button size="sm" variant="ghost" onClick={() => navigate({ view: "settings", section: "focus" })}>
          Set up system focus features
        </Button>
      </div>
    </div>
  );
}

export function FocusView() {
  const timer = useApp((s) => s.timer);
  const prefs = useApp((s) => s.prefs);
  const certId = prefs.currentCertId;
  const { native } = useServices();
  const now = useNow(500);
  const [task, setTask] = useState(focusTaskDraft.value);
  const [ending, setEnding] = useState(false);
  const sessions = useLive((r) => r.listSessions(certId, 20), [certId]);
  const f = prefs.focus;
  const setFocus = (patch: Partial<typeof f>) => void updatePrefs((p) => ({ ...p, focus: { ...p.focus, ...patch } }));
  const settings = f.mode === "pomodoro" ? POMODORO : f.custom;

  if (!timer) {
    return (
      <Page title="Focus session" subtitle="Timers stay accurate if you minimise the app; time while the device sleeps is not counted.">
        <div className="stack lg" style={{ maxWidth: 720 }}>
          <div className="card stack">
            <Field label="What are you studying?">
              <input className="input" value={task} onChange={(e) => ((focusTaskDraft.value = e.target.value), setTask(e.target.value))} placeholder="e.g. Read chapter 3, review due cards" />
            </Field>
            <div className="row" role="radiogroup" aria-label="Timer type">
              <button className="chip-toggle" role="radio" aria-checked={f.mode === "pomodoro"} aria-pressed={f.mode === "pomodoro"} onClick={() => setFocus({ mode: "pomodoro" })}>
                Pomodoro 25 / 5
              </button>
              <button className="chip-toggle" role="radio" aria-checked={f.mode === "custom"} aria-pressed={f.mode === "custom"} onClick={() => setFocus({ mode: "custom" })}>
                Custom
              </button>
            </div>
            {f.mode === "custom" && (
              <div className="form-grid">
                {(
                  [
                    ["focusMin", "Focus (min)", 1, 240],
                    ["breakMin", "Break (min)", 0, 60],
                    ["longBreakMin", "Long break (min)", 0, 90],
                    ["cyclesBeforeLong", "Blocks before long break", 0, 12],
                  ] as const
                ).map(([k, label, min, max]) => (
                  <Field key={k} label={label}>
                    <input
                      className="input"
                      type="number"
                      min={min}
                      max={max}
                      value={f.custom[k]}
                      onChange={(e) => setFocus({ custom: { ...f.custom, [k]: Math.max(min, Math.min(max, Number(e.target.value) || 0)) } })}
                    />
                  </Field>
                ))}
              </div>
            )}
            <div className="stack" style={{ gap: 10 }}>
              <Toggle label="Hide navigation during the session" checked={f.hideNav} onChange={(v) => setFocus({ hideNav: v })} />
              <Toggle label="Mute StudyMode's non-essential alerts" checked={f.muteAlerts} onChange={(v) => setFocus({ muteAlerts: v })} />
              <Toggle label="Start next phase automatically" checked={f.custom.autoContinue && settings.autoContinue} onChange={(v) => setFocus({ custom: { ...f.custom, autoContinue: v } })} disabled={f.mode === "pomodoro"} description={f.mode === "pomodoro" ? "Always on for Pomodoro" : undefined} />
              <Toggle label="Chime when a phase ends" checked={f.chime} onChange={(v) => setFocus({ chime: v })} />
              <Toggle
                label="Keep StudyMode on top of other windows"
                checked={f.keepOnTop && native}
                disabled={!native}
                onChange={(v) => setFocus({ keepOnTop: v })}
                description={native ? "A visual reminder only. It does not stop other apps from opening." : "Available in the desktop app."}
              />
            </div>
            <Button variant="primary" size="lg" icon="play" onClick={() => startFocus(task)}>
              Start {settings.focusMin}-minute focus
            </Button>
          </div>
          <ProtectionSummary />
          <History sessions={sessions.data ?? []} />
        </div>
      </Page>
    );
  }

  const rem = remaining(timer, now);
  const frac = timer.phaseMs > 0 ? 1 - rem / timer.phaseMs : 0;
  const label = timer.awaitingNext ? (timer.phase === "break" ? "Focus block done" : "Break over") : timer.status === "paused" ? "Paused" : timer.phase === "focus" ? "Focus" : "Break";

  return (
    <div className="page">
      <div className="focus-wrap">
        <Dial fraction={frac} phase={timer.phase}>
          <div className="subtle" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }} aria-live="polite">
            {label}
          </div>
          <div className="time" role="timer" aria-label={`${formatClock(rem)} remaining`}>
            {formatClock(rem)}
          </div>
          <div className="subtle">Block {timer.cycle + (timer.phase === "focus" ? 1 : 0)}</div>
        </Dial>

        {timer.interruptedAt && (
          <div className="notice warn" style={{ maxWidth: 520 }}>
            Paused automatically at {new Date(timer.interruptedAt).toLocaleTimeString()} because StudyMode wasn't running or the device slept. That gap is not counted as study time.
          </div>
        )}

        <input
          className="input"
          style={{ maxWidth: 420, textAlign: "center" }}
          aria-label="Current study task"
          placeholder="Current task"
          value={timer.task}
          onChange={(e) => setFocusTask(e.target.value)}
        />

        <div className="focus-controls">
          {timer.awaitingNext ? (
            <Button variant="primary" size="lg" icon="play" onClick={continueFocus}>
              Start {timer.phase === "break" ? "break" : "focus"}
            </Button>
          ) : timer.status === "running" ? (
            <Button variant="primary" size="lg" icon="pause" onClick={pauseFocus}>
              Pause
            </Button>
          ) : (
            <Button variant="primary" size="lg" icon="play" onClick={resumeFocus}>
              Resume
            </Button>
          )}
          <Button size="lg" onClick={skipFocusPhase}>
            {timer.phase === "break" ? "Skip break" : "Take a break now"}
          </Button>
          <Button
            size="lg"
            variant="accent"
            icon="stop"
            busy={ending}
            onClick={async () => {
              setEnding(true);
              await endFocus();
              setEnding(false);
            }}
          >
            End session
          </Button>
        </div>
        <div className="subtle" style={{ fontVariantNumeric: "tabular-nums" }}>
          Focused {Math.floor((timer.focusMs + (timer.status === "running" && timer.phase === "focus" && !timer.awaitingNext ? now - timer.segmentStart : 0)) / 60000)} min so far · breaks and pauses are counted separately
        </div>

        <div className="grid" style={{ width: "100%", maxWidth: 820 }}>
          <div className="card tight stack">
            <strong>Read aloud</strong>
            <SpeechPlayer />
            <span className="subtle">Select text in the reader and press Alt+R.</span>
          </div>
          <div className="card tight">
            <ComfortControls />
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: 820 }}>
          <ProtectionSummary />
        </div>
      </div>
    </div>
  );
}

function History({ sessions }: { sessions: import("../domain/types").StudySession[] }) {
  const { repo } = useServices();
  if (!sessions.length) return <p className="subtle">Completed sessions appear here and count toward your progress.</p>;
  return (
    <div className="card">
      <h2>Recent sessions</h2>
      <ul className="list">
        {sessions.map((s) => (
          <li key={s.id} className="row">
            <div className="grow">
              <strong>{s.task || "Focus session"}</strong>
              <div className="subtle">
                {fmtDateTime(s.startedAt)} · {fmtMinutes(s.focusSec)} focus
                {s.breakSec ? ` · ${fmtMinutes(s.breakSec)} break` : ""}
                {s.pausedSec ? ` · ${fmtMinutes(s.pausedSec)} paused` : ""}
              </div>
            </div>
            <span className={`badge ${s.status === "completed" ? "green" : s.status === "interrupted" ? "amber" : ""}`}>{s.status === "completed" ? "Completed" : s.status === "interrupted" ? "Interrupted" : "Ended early"}</span>
            <ConfirmButton size="sm" variant="ghost" label="Delete" confirmLabel="Delete this session from your history" onConfirm={() => void repo.deleteSession(s.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
