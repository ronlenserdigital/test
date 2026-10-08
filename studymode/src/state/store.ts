import { create } from "zustand";
import type { Services } from "./services";
import { DEFAULT_PREFS, type Prefs } from "./prefs";
import type { TimerState } from "../domain/timer";

export type Route =
  | { view: "onboarding" }
  | { view: "dashboard" }
  | { view: "workspace" }
  | { view: "library" }
  | { view: "reader"; materialId: string; sectionIdx?: number; offset?: number }
  | { view: "cards" }
  | { view: "review" }
  | { view: "questions" }
  | { view: "quiz"; attemptId?: string }
  | { view: "results"; attemptId: string }
  | { view: "mistakes" }
  | { view: "focus" }
  | { view: "analytics" }
  | { view: "settings"; section?: string };

export interface Toast {
  id: number;
  kind: "info" | "success" | "error";
  text: string;
  /** Essential toasts show even during in-app focus. */
  essential?: boolean;
}

interface AppState {
  services: Services | null;
  prefs: Prefs;
  route: Route;
  timer: TimerState | null;
  toasts: Toast[];
  setServices(s: Services): void;
  setPrefs(p: Prefs): void;
  navigate(r: Route): void;
  setTimer(t: TimerState | null): void;
  toast(text: string, kind?: Toast["kind"], essential?: boolean): void;
  dismissToast(id: number): void;
}

let toastId = 0;

export const useApp = create<AppState>((set, get) => ({
  services: null,
  prefs: DEFAULT_PREFS,
  route: { view: "dashboard" },
  timer: null,
  toasts: [],
  setServices: (services) => set({ services }),
  setPrefs: (prefs) => set({ prefs }),
  navigate: (route) => {
    set({ route });
    const hash = routeToHash(route);
    if (location.hash !== hash) history.pushState(null, "", hash);
  },
  setTimer: (timer) => set({ timer }),
  toast: (text, kind = "info", essential = false) => {
    const { prefs, timer } = get();
    // In-app focus suppresses StudyMode's own non-essential alerts.
    if (timer && prefs.focus.muteAlerts && !essential && kind !== "error") return;
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, text, essential }] }));
    setTimeout(() => get().dismissToast(id), kind === "error" ? 8000 : 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function routeToHash(r: Route): string {
  switch (r.view) {
    case "reader":
      return `#/reader/${r.materialId}${r.sectionIdx != null ? `/${r.sectionIdx}` : ""}`;
    case "quiz":
      return r.attemptId ? `#/quiz/${r.attemptId}` : "#/quiz";
    case "results":
      return `#/results/${r.attemptId}`;
    case "settings":
      return r.section ? `#/settings/${r.section}` : "#/settings";
    default:
      return `#/${r.view}`;
  }
}

export function hashToRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [v, a, b] = parts;
  switch (v) {
    case "reader":
      return a ? { view: "reader", materialId: a, sectionIdx: b != null ? Number(b) : undefined } : { view: "library" };
    case "quiz":
      return { view: "quiz", attemptId: a };
    case "results":
      return a ? { view: "results", attemptId: a } : { view: "quiz" };
    case "settings":
      return { view: "settings", section: a };
    case "onboarding":
    case "dashboard":
    case "workspace":
    case "library":
    case "cards":
    case "review":
    case "questions":
    case "mistakes":
    case "focus":
    case "analytics":
      return { view: v } as Route;
    default:
      return { view: "dashboard" };
  }
}

/** Persist preferences (debounced by caller as needed). */
export async function savePrefs(next: Prefs) {
  const { services, setPrefs } = useApp.getState();
  setPrefs(next);
  await services?.repo.setSetting("prefs", next, false);
}

export function updatePrefs(fn: (p: Prefs) => Prefs) {
  return savePrefs(fn(useApp.getState().prefs));
}
