import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useApp, updatePrefs, type Route } from "../state/store";
import { useLive, useNow } from "../state/hooks";
import { Icon, Logo, type IconName } from "./icons";
import { Button, Dialog, IconButton, Slider } from "./components";
import { remaining, formatClock } from "../domain/timer";
import { inWindow, parseHm, sunTimes } from "../domain/sunset";
import { AMBIENT_LABELS, type AmbientId } from "../platform/ambient";
import { Onboarding } from "../views/Onboarding";
import { Dashboard } from "../views/Dashboard";
import { Workspace } from "../views/Workspace";
import { Library } from "../views/Library";
import { Reader } from "../views/Reader";
import { CardsView, ReviewView } from "../views/Flashcards";
import { QuestionsView } from "../views/Questions";
import { QuizView, ResultsView, MistakesView } from "../views/Quiz";
import { FocusView } from "../views/Focus";
import { AnalyticsView } from "../views/Analytics";
import { SettingsView } from "../views/Settings";

const NAV: { view: Route["view"]; label: string; icon: IconName }[] = [
  { view: "dashboard", label: "Today", icon: "home" },
  { view: "library", label: "Library", icon: "book" },
  { view: "review", label: "Review", icon: "cards" },
  { view: "quiz", label: "Practice", icon: "quiz" },
  { view: "focus", label: "Focus", icon: "timer" },
  { view: "analytics", label: "Progress", icon: "chart" },
];
const NAV2: { view: Route["view"]; label: string; icon: IconName }[] = [
  { view: "workspace", label: "Certification", icon: "target" },
  { view: "cards", label: "Flashcards", icon: "layers" },
  { view: "questions", label: "Question bank", icon: "note" },
  { view: "mistakes", label: "Mistakes", icon: "flag" },
  { view: "settings", label: "Settings", icon: "settings" },
];

function View({ route }: { route: Route }) {
  switch (route.view) {
    case "onboarding":
      return <Onboarding />;
    case "dashboard":
      return <Dashboard />;
    case "workspace":
      return <Workspace />;
    case "library":
      return <Library />;
    case "reader":
      return <Reader key={route.materialId} materialId={route.materialId} sectionIdx={route.sectionIdx} offset={route.offset} />;
    case "cards":
      return <CardsView />;
    case "review":
      return <ReviewView />;
    case "questions":
      return <QuestionsView />;
    case "quiz":
      return <QuizView key={route.attemptId ?? "setup"} attemptId={route.attemptId} />;
    case "results":
      return <ResultsView attemptId={route.attemptId} />;
    case "mistakes":
      return <MistakesView />;
    case "focus":
      return <FocusView />;
    case "analytics":
      return <AnalyticsView />;
    case "settings":
      return <SettingsView section={route.section} />;
  }
}

/** Effective warm intensity (0–100) from manual toggle or schedule. */
export function useWarmIntensity(): number {
  const warm = useApp((s) => s.prefs.warm);
  const now = useNow(60_000);
  if (warm.enabled) return warm.intensity;
  if (warm.schedule === "manual") {
    const s = parseHm(warm.start);
    const e = parseHm(warm.end);
    const d = new Date(now);
    if (s != null && e != null && inWindow(d.getHours() * 60 + d.getMinutes(), s, e)) return warm.scheduledIntensity;
  }
  if (warm.schedule === "sunset" && warm.lat != null && warm.lon != null) {
    const today = sunTimes(now, warm.lat, warm.lon);
    if (today && (now >= today.sunset || now < today.sunrise)) return warm.scheduledIntensity;
  }
  return 0;
}

function useEffects() {
  const prefs = useApp((s) => s.prefs);
  const services = useApp((s) => s.services)!;
  const { speech, ambient } = services;

  // Theme & motion
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = prefs.theme === "dark" || (prefs.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    root.dataset.motion = prefs.motion;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [prefs.theme, prefs.motion]);

  // Speech prefs & persisted reading cursor
  useEffect(() => {
    speech.setPrefs(prefs.speech);
  }, [speech, prefs.speech]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    speech.onCursor = (c) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const m = await services.repo.getMaterial(c.materialId);
        if (m) await services.repo.savePosition(c.materialId, { sectionIdx: c.sectionIdx, scrollRatio: m.position?.scrollRatio ?? 0, ttsChunk: c.chunkIdx });
      }, 800);
    };
  }, [speech, services.repo]);

  // Ambient sound + ducking during speech
  useEffect(() => {
    try {
      ambient.apply(prefs.ambient);
    } catch {
      /* Web Audio unavailable; Settings explains */
    }
  }, [ambient, prefs.ambient]);
  useEffect(() => speech.subscribe((s) => ambient.setDuck(s.status === "playing")), [speech, ambient]);

  // Flush browser persistence when hidden/closing
  useEffect(() => {
    const flush = () => void services.flush();
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [services]);

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if (e.shiftKey && e.key === "Escape") {
        // Emergency off for the warm tint (works everywhere).
        e.preventDefault();
        void updatePrefs((p) => ({ ...p, warm: { ...p.warm, enabled: false, schedule: "off" } }));
        useApp.getState().toast("Warm tint off.", "info", true);
        return;
      }
      if (!e.altKey || e.ctrlKey || e.metaKey) {
        if (!typing && e.key === "?" && !e.altKey) document.dispatchEvent(new CustomEvent("studymode:shortcuts"));
        return;
      }
      const k = e.code;
      if (k === "KeyR") {
        e.preventDefault();
        const sel = window.getSelection()?.toString().trim();
        if (sel && !typing) speech.speakText(sel);
        else if (speech.state.status !== "idle") speech.toggle();
        else document.dispatchEvent(new CustomEvent("studymode:read-document"));
      } else if (k === "Period") {
        e.preventDefault();
        speech.stop();
      } else if (k === "ArrowRight" && speech.state.status !== "idle") {
        e.preventDefault();
        void speech.next();
      } else if (k === "ArrowLeft" && speech.state.status !== "idle") {
        e.preventDefault();
        speech.prev();
      } else if (k === "KeyW") {
        e.preventDefault();
        void updatePrefs((p) => ({ ...p, warm: { ...p.warm, enabled: !p.warm.enabled } }));
      } else if (k === "KeyM") {
        e.preventDefault();
        void updatePrefs((p) => ({ ...p, ambient: { ...p.ambient, muted: !p.ambient.muted } }));
      } else if (k === "KeyF") {
        e.preventDefault();
        useApp.getState().navigate({ view: "focus" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [speech]);
}

function CertSwitcher() {
  const certId = useApp((s) => s.prefs.currentCertId);
  const navigate = useApp((s) => s.navigate);
  const certs = useLive((r) => r.listCertifications(), []);
  if (!certs.data) return null;
  return (
    <div className="row" style={{ gap: 6 }}>
      <label className="sr-only" htmlFor="cert-switch">
        Current certification
      </label>
      <select
        id="cert-switch"
        className="select"
        style={{ maxWidth: 260, minHeight: 34 }}
        value={certId ?? ""}
        onChange={(e) => {
          if (e.target.value === "__new") navigate({ view: "onboarding" });
          else void updatePrefs((p) => ({ ...p, currentCertId: e.target.value }));
        }}
      >
        {certs.data.length === 0 && <option value="">No certification</option>}
        {certs.data.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.examCode ? ` (${c.examCode})` : ""}
            {c.isSample ? " — sample" : ""}
          </option>
        ))}
        <option value="__new">+ New certification…</option>
      </select>
    </div>
  );
}

function MiniTimer() {
  const timer = useApp((s) => s.timer);
  const navigate = useApp((s) => s.navigate);
  const now = useNow(1000);
  if (!timer) return null;
  const label = timer.status === "paused" ? "Paused" : timer.awaitingNext ? "Ready" : timer.phase === "focus" ? "Focus" : "Break";
  return (
    <button className="chip-toggle" onClick={() => navigate({ view: "focus" })} aria-label={`${label}, ${formatClock(remaining(timer, now))} remaining. Open focus session.`}>
      <Icon name="timer" style={{ width: 16, height: 16, color: timer.phase === "break" ? "var(--accent)" : "var(--primary)" }} />
      <span className="mini-timer">
        {label} {formatClock(remaining(timer, now))}
      </span>
    </button>
  );
}

export function SpeechPlayer({ compact }: { compact?: boolean }) {
  const speech = useApp((s) => s.services!.speech);
  const st = useSyncExternalStore(
    (cb) => speech.subscribe(cb),
    () => speech.state,
  );
  const toast = useApp((s) => s.toast);
  useEffect(() => {
    if (st.error) {
      toast(st.error, "error");
      speech.clearError();
    }
  }, [st.error, speech, toast]);
  if (st.status === "idle" && compact) return null;
  return (
    <div className="player" role="group" aria-label="Read aloud controls">
      <IconButton size="sm" variant="ghost" icon="prev" label="Previous paragraph (Alt+←)" onClick={() => speech.prev()} disabled={st.status === "idle"} />
      {st.status === "playing" ? (
        <IconButton size="sm" variant="ghost" icon="pause" label="Pause reading (Alt+R)" onClick={() => speech.pause()} />
      ) : (
        <IconButton
          size="sm"
          variant="ghost"
          icon="play"
          label={st.status === "paused" ? "Resume reading (Alt+R)" : "Read (Alt+R)"}
          onClick={() => (st.status === "paused" ? speech.resume() : document.dispatchEvent(new CustomEvent("studymode:read-document")))}
        />
      )}
      <IconButton size="sm" variant="ghost" icon="stop" label="Stop reading (Alt+.)" onClick={() => speech.stop()} disabled={st.status === "idle"} />
      <IconButton size="sm" variant="ghost" icon="next" label="Next paragraph (Alt+→)" onClick={() => void speech.next()} disabled={st.status === "idle"} />
      {st.status !== "idle" && (
        <span className="label" aria-live="polite">
          {st.status === "paused" ? "Paused · " : ""}
          {st.sectionLabel}
        </span>
      )}
    </div>
  );
}

export function ComfortControls() {
  const prefs = useApp((s) => s.prefs);
  const ambient = prefs.ambient;
  const set = (fn: Parameters<typeof updatePrefs>[0]) => void updatePrefs(fn);
  return (
    <div className="stack">
      <Slider
        label="Warmth"
        value={prefs.warm.intensity}
        min={0}
        max={100}
        format={(v) => `${v}%`}
        onChange={(v) => set((p) => ({ ...p, warm: { ...p.warm, intensity: v, enabled: v > 0 } }))}
      />
      <div className="row">
        <Button size="sm" onClick={() => set((p) => ({ ...p, warm: { ...p.warm, enabled: !p.warm.enabled } }))} aria-pressed={prefs.warm.enabled}>
          {prefs.warm.enabled ? "Turn warmth off" : "Turn warmth on"}
        </Button>
        <span className="subtle">App window only · Shift+Esc resets</span>
      </div>
      <div className="row between">
        <strong>Ambient sound</strong>
        <Button size="sm" variant="ghost" icon={ambient.muted ? "mute" : "volume"} onClick={() => set((p) => ({ ...p, ambient: { ...p.ambient, muted: !p.ambient.muted } }))}>
          {ambient.muted ? "Unmute" : "Mute all"}
        </Button>
      </div>
      {(Object.keys(AMBIENT_LABELS) as AmbientId[]).map((id) => (
        <div key={id} className="row" style={{ flexWrap: "nowrap" }}>
          <button
            className="chip-toggle"
            aria-pressed={ambient.enabled[id]}
            onClick={() => set((p) => ({ ...p, ambient: { ...p.ambient, enabled: { ...p.ambient.enabled, [id]: !p.ambient.enabled[id] } } }))}
            style={{ minWidth: 120 }}
          >
            <Icon name={id === "rain" ? "rain" : id === "cafe" ? "coffee" : "wave"} style={{ width: 16, height: 16 }} />
            {AMBIENT_LABELS[id]}
          </button>
          <input
            type="range"
            aria-label={`${AMBIENT_LABELS[id]} volume`}
            min={0}
            max={1}
            step={0.05}
            value={ambient.volumes[id]}
            onChange={(e) => {
              const v = Number(e.target.value);
              set((p) => ({ ...p, ambient: { ...p.ambient, volumes: { ...p.ambient.volumes, [id]: v } } }));
            }}
            style={{ flex: 1, accentColor: "var(--primary)" }}
          />
        </div>
      ))}
    </div>
  );
}

function ComfortButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const warmOn = useApp((s) => s.prefs.warm.enabled);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <IconButton icon={warmOn ? "moon" : "sun"} label="Warmth and ambient sound" aria-expanded={open} onClick={() => setOpen(!open)} variant="ghost" />
      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: 44, width: 320, zIndex: 40 }} role="dialog" aria-label="Warmth and ambient sound">
          <ComfortControls />
        </div>
      )}
    </div>
  );
}

function ShortcutsDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    document.addEventListener("studymode:shortcuts", on);
    return () => document.removeEventListener("studymode:shortcuts", on);
  }, []);
  const rows: [string, string][] = [
    ["Alt+R", "Read selection aloud, or play/pause"],
    ["Alt+.", "Stop reading"],
    ["Alt+← / Alt+→", "Previous / next paragraph"],
    ["Alt+W", "Toggle warm tint"],
    ["Shift+Esc", "Turn warm tint off immediately"],
    ["Alt+M", "Mute or unmute ambient sound"],
    ["Alt+F", "Open focus session"],
    ["Space / 1–4", "Flashcards: reveal / rate"],
    ["1–6, ←/→, F", "Quiz: choose answer, move, flag"],
    ["?", "Show this list"],
  ];
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Keyboard shortcuts">
      <table className="table">
        <tbody>
          {rows.map(([k, d]) => (
            <tr key={k}>
              <td>
                <kbd>{k}</kbd>
              </td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

function Toasts() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role={t.kind === "error" ? "alert" : "status"}>
          <span>{t.text}</span>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function NavCounts() {
  const certId = useApp((s) => s.prefs.currentCertId);
  const now = useNow(60_000);
  return useLive(
    async (r) => {
      if (!certId) return { due: 0, mistakes: 0 };
      const c = await r.cardCounts(certId, now);
      const m = await r.reviewQueueEntries(certId);
      return { due: c.due, mistakes: m.length };
    },
    [certId, now],
  ).data;
}

export function Shell() {
  useEffects();
  const route = useApp((s) => s.route);
  const navigate = useApp((s) => s.navigate);
  const timer = useApp((s) => s.timer);
  const focusPrefs = useApp((s) => s.prefs.focus);
  const warm = useWarmIntensity();
  const counts = NavCounts();
  const mainRef = useRef<HTMLElement>(null);
  const storage = useApp((s) => s.services!.storage);

  // Move focus to main content on navigation for screen readers/keyboard users.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [route.view]);

  if (route.view === "onboarding") {
    return (
      <>
        <main ref={mainRef} tabIndex={-1} style={{ height: "100%" }}>
          <Onboarding />
        </main>
        <Toasts />
        <WarmOverlay intensity={warm} />
      </>
    );
  }

  // In-app focus hides navigation while a session runs (except Focus/Reader/Review/Quiz tasks).
  const hideNav = !!timer && focusPrefs.hideNav;
  const navBtn = (n: (typeof NAV)[number]): ReactNode => (
    <button key={n.view} className="nav-item" aria-current={route.view === n.view || (n.view === "library" && route.view === "reader") ? "page" : undefined} onClick={() => navigate({ view: n.view } as Route)}>
      <Icon name={n.icon} />
      <span>{n.label}</span>
      {n.view === "review" && counts?.due ? <span className="count">{counts.due}</span> : null}
      {n.view === "mistakes" && counts?.mistakes ? <span className="count">{counts.mistakes}</span> : null}
    </button>
  );

  return (
    <div className={`shell ${hideNav ? "nav-hidden" : ""}`}>
      <a href="#main" className="skip-link" onClick={(e) => (e.preventDefault(), mainRef.current?.focus())}>
        Skip to content
      </a>
      <nav className="sidebar" aria-label="Main">
        <div className="brand">
          <Logo /> StudyMode
        </div>
        {NAV.map(navBtn)}
        <div className="nav-sep" />
        <div className="nav-secondary" style={{ display: "contents" }}>
          {NAV2.map(navBtn)}
        </div>
      </nav>
      <header className="topbar">
        {hideNav ? (
          <span className="badge blue">
            <Icon name="shield" style={{ width: 14, height: 14 }} /> In-app focus on
          </span>
        ) : (
          <CertSwitcher />
        )}
        <div className="grow" />
        <MiniTimer />
        <SpeechPlayer compact />
        <ComfortButton />
        {hideNav && (
          <Button size="sm" variant="ghost" onClick={() => navigate({ view: "focus" })}>
            Back to focus
          </Button>
        )}
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {storage.warning && (
          <div className="page" style={{ paddingBottom: 0 }}>
            <div className="notice warn">{storage.warning}</div>
          </div>
        )}
        <View route={route} />
      </main>
      <Toasts />
      <ShortcutsDialog />
      <WarmOverlay intensity={warm} />
    </div>
  );
}

function WarmOverlay({ intensity }: { intensity: number }) {
  // Multiply blend with a capped opacity keeps text contrast acceptable; pointer-events: none keeps clicks, scrolling and selection working.
  return <div className="warm-overlay" aria-hidden="true" data-testid="warm-overlay" style={{ opacity: (Math.max(0, Math.min(100, intensity)) / 100) * 0.38 }} />;
}
