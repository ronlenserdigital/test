import { DEFAULT_AMBIENT, type AmbientPrefs } from "../platform/ambient";
import { DEFAULT_SPEECH, type SpeechPrefs } from "../platform/speech";
import { POMODORO, type TimerSettings } from "../domain/timer";

export interface ReaderPrefs {
  font: "sans" | "serif" | "mono";
  size: number; // px
  lineHeight: number;
  width: "narrow" | "medium" | "wide";
}

export interface WarmPrefs {
  enabled: boolean;
  intensity: number; // 0–100
  schedule: "off" | "manual" | "sunset";
  start: string; // HH:MM
  end: string;
  lat: number | null;
  lon: number | null;
  locationLabel: string;
  scheduledIntensity: number;
}

export interface FocusPrefs {
  mode: "pomodoro" | "custom";
  custom: TimerSettings;
  hideNav: boolean;
  muteAlerts: boolean;
  keepOnTop: boolean;
  chime: boolean;
}

export interface AiPrefs {
  enabled: boolean;
  consented: boolean;
  model: string;
}

export interface Prefs {
  theme: "system" | "light" | "dark";
  motion: "system" | "reduce";
  reader: ReaderPrefs;
  speech: SpeechPrefs;
  warm: WarmPrefs;
  ambient: AmbientPrefs;
  focus: FocusPrefs;
  ai: AiPrefs;
  onboarded: boolean;
  currentCertId: string | null;
}

export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  motion: "system",
  reader: { font: "serif", size: 19, lineHeight: 1.7, width: "medium" },
  speech: DEFAULT_SPEECH,
  warm: { enabled: false, intensity: 40, schedule: "off", start: "20:00", end: "07:00", lat: null, lon: null, locationLabel: "", scheduledIntensity: 50 },
  ambient: DEFAULT_AMBIENT,
  focus: { mode: "pomodoro", custom: { ...POMODORO, focusMin: 50, breakMin: 10 }, hideNav: true, muteAlerts: true, keepOnTop: false, chime: true },
  ai: { enabled: false, consented: false, model: "claude-opus-5-5" },
  onboarded: false,
  currentCertId: null,
};

/** Deep-merge stored prefs over defaults so new fields get defaults. */
export function mergePrefs(stored: unknown): Prefs {
  const s = (stored ?? {}) as Partial<Prefs>;
  return {
    ...DEFAULT_PREFS,
    ...s,
    reader: { ...DEFAULT_PREFS.reader, ...s.reader },
    speech: { ...DEFAULT_PREFS.speech, ...s.speech },
    warm: { ...DEFAULT_PREFS.warm, ...s.warm },
    ambient: {
      ...DEFAULT_PREFS.ambient,
      ...s.ambient,
      volumes: { ...DEFAULT_PREFS.ambient.volumes, ...s.ambient?.volumes },
      enabled: { ...DEFAULT_PREFS.ambient.enabled, ...s.ambient?.enabled },
    },
    focus: { ...DEFAULT_PREFS.focus, ...s.focus, custom: { ...DEFAULT_PREFS.focus.custom, ...s.focus?.custom } },
    ai: { ...DEFAULT_PREFS.ai, ...s.ai },
  };
}
