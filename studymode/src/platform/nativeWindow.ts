/** Optional native window integrations (desktop only). */
import { isNative } from "./env";

async function win() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export const nativeWindow = {
  supported(): boolean {
    return isNative();
  },
  /** Keeps the StudyMode window above others. This is a reminder only: it does not stop other apps from opening. */
  async setAlwaysOnTop(on: boolean): Promise<void> {
    if (!isNative()) throw new Error("Only available in the desktop app.");
    await (await win()).setAlwaysOnTop(on);
  },
  async setFullscreen(on: boolean): Promise<void> {
    if (isNative()) {
      await (await win()).setFullscreen(on);
      return;
    }
    if (on && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else if (!on && document.fullscreenElement) await document.exitFullscreen();
  },
};
