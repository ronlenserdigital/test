import { useEffect, useState, useSyncExternalStore } from "react";
import { useApp, updatePrefs } from "../state/store";
import { useServices, useAction, useLive } from "../state/hooks";
import { createBackup, restoreBackup, BackupError } from "../data/backup";
import { createSampleWorkspace } from "../data/sample";
import { secrets } from "../platform/secrets";
import { CAPABILITIES, STATUS_LABEL } from "../platform/capabilities";
import { detectOs, OS_LABEL, type OsId } from "../platform/env";
import { AmbientMixer } from "../platform/ambient";
import { sunTimes } from "../domain/sunset";
import { Button, ConfirmButton, Dialog, Field, Notice, Slider, Tabs, Toggle, Unavailable, downloadFile, pickFiles } from "../ui/components";
import { ComfortControls } from "../ui/Shell";
import { Page } from "./common";

type Section = "appearance" | "speech" | "display" | "sound" | "focus" | "ai" | "data";

export function SettingsView({ section }: { section?: string }) {
  const [tab, setTab] = useState<Section>((section as Section) ?? "appearance");
  useEffect(() => {
    if (section) setTab(section as Section);
  }, [section]);
  return (
    <Page title="Settings">
      <Tabs
        label="Settings sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "appearance", label: "Appearance" },
          { id: "speech", label: "Read aloud" },
          { id: "display", label: "Warm display" },
          { id: "sound", label: "Ambient sound" },
          { id: "focus", label: "Focus & distractions" },
          { id: "ai", label: "AI assistance" },
          { id: "data", label: "Data & backup" },
        ]}
      />
      <div style={{ maxWidth: 820 }}>
        {tab === "appearance" && <Appearance />}
        {tab === "speech" && <Speech />}
        {tab === "display" && <Display />}
        {tab === "sound" && <Sound />}
        {tab === "focus" && <FocusSettings />}
        {tab === "ai" && <AiSettings />}
        {tab === "data" && <DataSettings />}
      </div>
    </Page>
  );
}

function Appearance() {
  const prefs = useApp((s) => s.prefs);
  return (
    <div className="card stack">
      <Field label="Theme">
        <select className="select" value={prefs.theme} onChange={(e) => void updatePrefs((p) => ({ ...p, theme: e.target.value as typeof p.theme }))}>
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </Field>
      <Field label="Motion">
        <select className="select" value={prefs.motion} onChange={(e) => void updatePrefs((p) => ({ ...p, motion: e.target.value as typeof p.motion }))}>
          <option value="system">Match system (reduce if your OS asks)</option>
          <option value="reduce">Always reduce motion</option>
        </select>
      </Field>
      <p className="subtle">Reader font, size and spacing are in the reader's text settings (the “T” button).</p>
      <Button onClick={() => document.dispatchEvent(new CustomEvent("studymode:shortcuts"))}>Show keyboard shortcuts</Button>
    </div>
  );
}

function Speech() {
  const { speech } = useServices();
  const prefs = useApp((s) => s.prefs.speech);
  const st = useSyncExternalStore((cb) => speech.subscribe(cb), () => speech.state);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => force((x) => x + 1), 1600);
    return () => clearTimeout(t);
  }, []);
  const voices = speech.voices();
  const os = detectOs();
  const set = (patch: Partial<typeof prefs>) => void updatePrefs((p) => ({ ...p, speech: { ...p.speech, ...patch } }));
  const selected = voices.find((v) => v.id === prefs.voiceId);
  const steps = CAPABILITIES.find((c) => c.id === "tts")!.manualSteps?.[os === "unknown" ? "windows" : os] ?? [];

  if (!st.supported) {
    return (
      <div className="card stack">
        <Notice kind="warn">Read aloud is not available here: this webview does not provide speech synthesis.</Notice>
        <Steps steps={steps} />
      </div>
    );
  }
  return (
    <div className="card stack">
      {st.voicesLoaded && voices.length === 0 && (
        <Notice kind="warn">
          No voices are installed for speech synthesis.
          <Steps steps={steps} />
        </Notice>
      )}
      {speech.onlyNetworkVoices() && <Notice kind="warn">All available voices need a network connection. Install an on-device voice to listen offline.</Notice>}
      <Field label="Voice" hint={selected ? (selected.local ? "On-device voice — works offline." : "Network voice — text is sent to the voice provider and needs internet.") : "System default voice."}>
        <select className="select" value={prefs.voiceId ?? ""} onChange={(e) => set({ voiceId: e.target.value || null })}>
          <option value="">System default</option>
          {[...voices]
            .sort((a, b) => Number(b.local) - Number(a.local) || a.lang.localeCompare(b.lang))
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.lang}){v.local ? "" : " — needs network"}
              </option>
            ))}
        </select>
      </Field>
      <Slider label="Speed" value={prefs.rate} min={0.5} max={2} step={0.05} onChange={(v) => set({ rate: v })} format={(v) => `${v.toFixed(2)}×`} />
      <Slider label="Volume" value={prefs.volume} min={0} max={1} step={0.05} onChange={(v) => set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Pitch" value={prefs.pitch} min={0.5} max={1.5} step={0.05} onChange={(v) => set({ pitch: v })} format={(v) => v.toFixed(2)} />
      <p className="subtle" style={{ marginTop: -8 }}>Some voices ignore pitch.</p>
      <div className="row">
        <Button icon="play" onClick={() => speech.speakText("This is how StudyMode will read your study material.")}>
          Test voice
        </Button>
        <Button icon="stop" onClick={() => speech.stop()}>
          Stop
        </Button>
      </div>
      <details>
        <summary>How read aloud differs by platform</summary>
        <ul className="subtle">
          <li>Windows: uses installed Windows voices through WebView2. “Online”/“Natural” voices require internet.</li>
          <li>macOS: uses system voices through WebKit.</li>
          <li>Linux: depends on whether your WebKitGTK build includes speech synthesis; StudyMode tells you if it doesn't.</li>
          <li>Android/iOS: mobile webviews may stop speech when the app is in the background or the screen locks. Not yet verified on devices.</li>
          <li>Pause restarts the current sentence when you resume, because native pause is unreliable in several engines.</li>
        </ul>
      </details>
    </div>
  );
}

function Display() {
  const warm = useApp((s) => s.prefs.warm);
  const toast = useApp((s) => s.toast);
  const os = detectOs();
  const set = (patch: Partial<typeof warm>) => void updatePrefs((p) => ({ ...p, warm: { ...p.warm, ...patch } }));
  const times = warm.lat != null && warm.lon != null ? sunTimes(Date.now(), warm.lat, warm.lon) : null;
  const [lat, setLat] = useState(warm.lat != null ? String(warm.lat) : "");
  const [lon, setLon] = useState(warm.lon != null ? String(warm.lon) : "");
  const sys = CAPABILITIES.find((c) => c.id === "warm-system")!;
  return (
    <div className="stack lg">
      <div className="card stack">
        <Notice kind="info">This warm tint covers the StudyMode window only. It does not change other apps or your whole screen.</Notice>
        <Toggle label="Warm tint on now" checked={warm.enabled} onChange={(v) => set({ enabled: v })} />
        <Slider label="Intensity" value={warm.intensity} min={0} max={100} onChange={(v) => set({ intensity: v })} format={(v) => `${v}%`} />
        <div className="row">
          <Button onClick={() => set({ enabled: false, schedule: "off" })}>Reset (Shift+Esc)</Button>
        </div>
      </div>
      <div className="card stack">
        <h2>Evening schedule</h2>
        <Field label="Schedule">
          <select className="select" value={warm.schedule} onChange={(e) => set({ schedule: e.target.value as typeof warm.schedule })}>
            <option value="off">Off</option>
            <option value="manual">Between set times</option>
            <option value="sunset">Sunset to sunrise</option>
          </select>
        </Field>
        <Slider label="Scheduled intensity" value={warm.scheduledIntensity} min={0} max={100} onChange={(v) => set({ scheduledIntensity: v })} format={(v) => `${v}%`} />
        {warm.schedule === "manual" && (
          <div className="form-grid">
            <Field label="Start">
              <input className="input" type="time" value={warm.start} onChange={(e) => set({ start: e.target.value })} />
            </Field>
            <Field label="End">
              <input className="input" type="time" value={warm.end} onChange={(e) => set({ end: e.target.value })} />
            </Field>
          </div>
        )}
        {warm.schedule === "sunset" && (
          <div className="stack">
            <p className="subtle">Sunset is calculated on this device from the location you choose. Times are shown in this device's time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
            <div className="form-grid">
              <Field label="Latitude">
                <input className="input" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 38.30" />
              </Field>
              <Field label="Longitude">
                <input className="input" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="e.g. -77.46" />
              </Field>
            </div>
            <div className="row">
              <Button
                onClick={() => {
                  const a = Number(lat);
                  const b = Number(lon);
                  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180 || lat.trim() === "" || lon.trim() === "") return toast("Enter a valid latitude (−90 to 90) and longitude (−180 to 180).", "error");
                  set({ lat: a, lon: b, locationLabel: "Entered manually" });
                }}
              >
                Save location
              </Button>
              <Button
                onClick={() => {
                  if (!navigator.geolocation) return toast("Location is unavailable here. Enter coordinates instead.", "error");
                  navigator.geolocation.getCurrentPosition(
                    (p) => {
                      const a = Math.round(p.coords.latitude * 100) / 100;
                      const b = Math.round(p.coords.longitude * 100) / 100;
                      setLat(String(a));
                      setLon(String(b));
                      set({ lat: a, lon: b, locationLabel: "From device location (rounded)" });
                    },
                    (err) => toast(err.code === err.PERMISSION_DENIED ? "Location permission was denied. Enter coordinates instead, or use set times." : "Could not get your location. Enter coordinates instead.", "error"),
                    { timeout: 10000, maximumAge: 3600_000 },
                  );
                }}
              >
                Use my location (optional)
              </Button>
            </div>
            {warm.lat != null && (
              <p className="subtle">
                {warm.locationLabel}: {warm.lat}, {warm.lon}.{" "}
                {times ? `Today: sunset ${new Date(times.sunset).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}, sunrise ${new Date(times.sunrise).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : "No sunset today at this latitude — use set times instead."}
              </p>
            )}
            {warm.lat == null && <Notice kind="warn">Choose a location to use sunset scheduling. Until then the schedule stays off.</Notice>}
          </div>
        )}
      </div>
      <div className="card stack">
        <h2>Whole-screen warmth</h2>
        <p>StudyMode does not tint your entire screen. Your operating system can:</p>
        <CapRow cap={sys} os={os} />
      </div>
    </div>
  );
}

function Sound() {
  const ambient = useApp((s) => s.prefs.ambient);
  const set = (patch: Partial<typeof ambient>) => void updatePrefs((p) => ({ ...p, ambient: { ...p.ambient, ...patch } }));
  if (!AmbientMixer.supported()) return <div className="card"><Notice kind="warn">Ambient sound needs the Web Audio API, which is unavailable here.</Notice></div>;
  return (
    <div className="card stack">
      <ComfortControls />
      <Toggle label="Lower ambient volume while reading aloud" checked={ambient.duckDuringSpeech} onChange={(v) => set({ duckDuringSpeech: v })} />
      <Toggle label="Stop ambient sound when a focus session ends" checked={ambient.stopWhenSessionEnds} onChange={(v) => set({ stopWhenSessionEnds: v })} />
      <p className="subtle">All sounds are synthesised on your device from filtered noise; no recordings are bundled, so there is nothing to license or download.</p>
    </div>
  );
}

function Steps({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <ol className="subtle" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
      {steps.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ol>
  );
}

function CapRow({ cap, os }: { cap: (typeof CAPABILITIES)[number]; os: OsId }) {
  const key = os === "unknown" ? "windows" : os;
  const cell = cap.cells[key];
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div>
        <span className={`cap-status ${cell.status}`}>{STATUS_LABEL[cell.status]}</span> on {OS_LABEL[os]} — {cell.note}
      </div>
      <Steps steps={cap.manualSteps?.[key] ?? []} />
    </div>
  );
}

function FocusSettings() {
  const os = detectOs();
  const focus = useApp((s) => s.prefs.focus);
  const { native } = useServices();
  const set = (patch: Partial<typeof focus>) => void updatePrefs((p) => ({ ...p, focus: { ...p.focus, ...patch } }));
  const osList: Exclude<OsId, "unknown">[] = ["windows", "macos", "linux", "android", "ios"];
  return (
    <div className="stack lg">
      <div className="card stack">
        <h2>In StudyMode</h2>
        <Toggle label="Hide navigation during focus sessions" checked={focus.hideNav} onChange={(v) => set({ hideNav: v })} />
        <Toggle label="Mute StudyMode's non-essential alerts during focus" checked={focus.muteAlerts} onChange={(v) => set({ muteAlerts: v })} />
        <Toggle label="Keep the window on top during focus (reminder only)" checked={focus.keepOnTop} disabled={!native} onChange={(v) => set({ keepOnTop: v })} description={native ? "Other apps can still be opened." : "Desktop app only."} />
      </div>
      <div className="card stack">
        <h2>On {OS_LABEL[os]}</h2>
        <p className="muted">StudyMode does not change system settings. These are the protections your system offers and how to turn them on:</p>
        {CAPABILITIES.filter((c) => ["notifications", "app-restrictions", "website-blocking"].includes(c.id)).map((c) => (
          <div key={c.id}>
            <strong>{c.label}</strong>
            <CapRow cap={c} os={os} />
          </div>
        ))}
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <h2>Capability matrix</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              {osList.map((o) => (
                <th key={o} style={{ background: o === os ? "var(--primary-soft)" : undefined }}>
                  {OS_LABEL[o]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPABILITIES.map((c) => (
              <tr key={c.id}>
                <td>{c.label}</td>
                {osList.map((o) => (
                  <td key={o} title={c.cells[o].note} style={{ background: o === os ? "var(--primary-soft)" : undefined }}>
                    <span className={`cap-status ${c.cells[o].status}`}>{STATUS_LABEL[c.cells[o].status]}</span>
                    {!c.cells[o].verified && <div className="subtle">unverified</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="subtle">“Unverified” means the feature is implemented but has not been tested on that platform yet. Hover a cell for details.</p>
      </div>
    </div>
  );
}

function AiSettings() {
  const ai = useApp((s) => s.prefs.ai);
  const { native, ai: provider } = useServices();
  const { run, busy } = useAction();
  const [key, setKey] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const status = useLive(async () => ({ available: await secrets.available(), exists: await secrets.exists("anthropic_api_key") }), [busy]);
  const set = (patch: Partial<typeof ai>) => void updatePrefs((p) => ({ ...p, ai: { ...p.ai, ...patch } }));
  return (
    <div className="stack lg">
      <div className="card stack">
        <p>
          AI assistance is optional. StudyMode works fully offline without it. When enabled, you can explain selected text, draft flashcards or practice questions, and ask questions about your imported material with citations.
        </p>
        {!native && <Unavailable>AI assistance needs the desktop app, which keeps your API key in the operating system's secure credential store. The browser build has no secure storage.</Unavailable>}
        <Toggle
          label="Enable AI assistance"
          checked={ai.enabled}
          disabled={!native}
          onChange={(v) => {
            if (v && !ai.consented) setShowNotice(true);
            else set({ enabled: v });
          }}
        />
        {ai.consented && (
          <p className="subtle">
            Data notice accepted.{" "}
            <button className="btn ghost sm" onClick={() => set({ consented: false, enabled: false })}>
              Withdraw
            </button>
          </p>
        )}
      </div>
      <div className="card stack">
        <h2>Provider: {provider.label}</h2>
        <Field label="Model">
          <select className="select" value={ai.model} onChange={(e) => set({ model: e.target.value })} disabled={!native}>
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — ${m.inputPerMTok}/${m.outputPerMTok} per million input/output tokens
              </option>
            ))}
          </select>
        </Field>
        {native && status.data && !status.data.available && <Notice kind="warn">The secure credential store isn't available on this system, so an API key can't be saved.</Notice>}
        <Field label="API key" hint={status.data?.exists ? "A key is saved in your OS credential store. It is never shown again or written to logs." : "Stored in your OS credential store, never in StudyMode's database or backups."}>
          <input className="input" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} disabled={!native || !status.data?.available} placeholder={status.data?.exists ? "•••••••• (saved)" : "Paste your Anthropic API key"} />
        </Field>
        <div className="row">
          <Button variant="primary" busy={busy} disabled={!key.trim()} onClick={() => void run(async () => (await secrets.set("anthropic_api_key", key), setKey("")), "API key saved securely.")}>
            Save key
          </Button>
          <Button disabled={!status.data?.exists} onClick={() => void run(() => secrets.remove("anthropic_api_key"), "API key removed.")}>
            Remove key
          </Button>
        </div>
        <p className="subtle">Requests use refusal fallbacks (if a model declines, the provider may retry on another model). Costs are billed to your API account; each request shows an estimate first.</p>
      </div>
      <Dialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        title="Before you enable AI assistance"
        footer={
          <>
            <Button onClick={() => setShowNotice(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                set({ consented: true, enabled: true });
                setShowNotice(false);
              }}
            >
              I understand — enable
            </Button>
          </>
        }
      >
        <ul>
          <li>When you use an AI action, the selected text and nearby passages from your material are sent to {provider.destination}. You'll see exactly what is sent, and nothing is sent until you press Send.</li>
          <li>Nothing is sent automatically or in the background.</li>
          <li>AI output can be wrong. Drafts are labelled “AI-generated” and you review them before saving.</li>
          <li>AI-drafted questions are practice material, not official exam content.</li>
          <li>Usage is billed by the provider to your API key.</li>
        </ul>
      </Dialog>
    </div>
  );
}

function DataSettings() {
  const services = useServices();
  const { repo, storage } = services;
  const toast = useApp((s) => s.toast);
  const navigate = useApp((s) => s.navigate);
  const { run, busy } = useAction();
  const hasSample = useLive((r) => r.hasSampleData(), []);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  return (
    <div className="stack lg">
      <div className="card stack">
        <h2>Where your data lives</h2>
        <p>
          <strong>{storage.kind === "native" ? "On this computer" : storage.kind === "browser" ? "In this browser" : "In memory only"}:</strong> <code style={{ wordBreak: "break-all" }}>{storage.location}</code>
        </p>
        <p className="subtle">No account, no cloud sync. Imported files are copied into this app storage.</p>
      </div>
      <div className="card stack">
        <h2>Backup</h2>
        <p className="muted">A backup contains every certification, imported original file, note, card with review history, question, quiz, mistake and study session, plus your settings. API keys are never included.</p>
        <div className="row">
          <Button
            variant="primary"
            icon="download"
            busy={busy}
            onClick={() =>
              void run(async () => {
                await services.flush();
                const bytes = await createBackup(repo.db, repo.files);
                const name = `studymode-backup-${new Date().toISOString().slice(0, 10)}.zip`;
                const saved = await downloadFile(name, bytes, "application/zip");
                if (saved) toast("Backup saved.", "success");
              })
            }
          >
            Export full backup
          </Button>
          <Button icon="upload" onClick={async () => setRestoreFile((await pickFiles(".zip"))[0] ?? null)}>
            Restore from backup…
          </Button>
        </div>
      </div>
      <div className="card stack">
        <h2>Sample data</h2>
        {hasSample.data ? (
          <>
            <p className="muted">A labelled sample workspace is installed.</p>
            <ConfirmButton
              label="Remove sample data"
              confirmLabel="Remove the sample certification and everything in it"
              onConfirm={() =>
                void run(async () => {
                  services.speech.stop();
                  await repo.removeSampleData();
                  const rest = await repo.listCertifications();
                  await updatePrefs((p) => ({ ...p, currentCertId: rest[0]?.id ?? null }));
                  if (!rest.length) navigate({ view: "onboarding" });
                }, "Sample data removed.")
              }
            />
          </>
        ) : (
          <Button onClick={() => void run(async () => { const c = await createSampleWorkspace(repo); await updatePrefs((p) => ({ ...p, currentCertId: c.id })); }, "Sample workspace added.")}>
            Add a labelled sample workspace
          </Button>
        )}
      </div>
      <Dialog
        open={!!restoreFile}
        onClose={() => setRestoreFile(null)}
        title="Restore from backup?"
        footer={
          <>
            <Button onClick={() => setRestoreFile(null)}>Cancel</Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={() =>
                void run(async () => {
                  const f = restoreFile!;
                  try {
                    services.speech.stop();
                    const summary = await restoreBackup(new Uint8Array(await f.arrayBuffer()), repo.db, repo.files);
                    repo.changed();
                    const prefs = await repo.getSetting("prefs", null);
                    const { mergePrefs } = await import("../state/prefs");
                    const merged = mergePrefs(prefs);
                    const certs = await repo.listCertifications();
                    if (!certs.some((c) => c.id === merged.currentCertId)) merged.currentCertId = certs[0]?.id ?? null;
                    await updatePrefs(() => merged);
                    await services.flush();
                    toast(`Restored ${summary.tables.certifications} certification(s), ${summary.tables.cards} cards and ${summary.files} files.`, "success");
                    navigate({ view: "dashboard" });
                  } catch (e) {
                    toast(e instanceof BackupError ? e.message : `Restore failed: ${(e as Error).message}`, "error");
                  } finally {
                    setRestoreFile(null);
                  }
                })
              }
            >
              Replace my data
            </Button>
          </>
        }
      >
        <p>
          Restoring <strong>{restoreFile?.name}</strong> replaces everything currently in StudyMode. The backup is fully checked first; if anything is wrong, nothing is changed.
        </p>
        <p className="subtle">Tip: export a backup of your current data first.</p>
      </Dialog>
    </div>
  );
}
