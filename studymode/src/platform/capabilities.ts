/**
 * Platform capability matrix for focus, display and speech features.
 * Status meanings:
 *  - supported: implemented in StudyMode and works without extra setup
 *  - permission: implemented, requires an OS permission prompt
 *  - manual: not automated by StudyMode; we show setup steps for the OS feature
 *  - unavailable: not possible or not implemented on this platform
 * "verified" records whether the row has been exercised on that platform.
 */
import type { OsId } from "./env";

export type CapStatus = "supported" | "permission" | "manual" | "unavailable";

export interface CapabilityCell {
  status: CapStatus;
  note: string;
  verified: boolean;
}

export interface Capability {
  id: string;
  label: string;
  cells: Record<Exclude<OsId, "unknown">, CapabilityCell>;
  manualSteps?: Partial<Record<Exclude<OsId, "unknown">, string[]>>;
}

const c = (status: CapStatus, note: string, verified = false): CapabilityCell => ({ status, note, verified });

export const CAPABILITIES: Capability[] = [
  {
    id: "inapp-focus",
    label: "In-app focus (hide navigation, mute StudyMode alerts)",
    cells: {
      windows: c("supported", "Built into StudyMode."),
      macos: c("supported", "Built into StudyMode."),
      linux: c("supported", "Built into StudyMode.", true),
      android: c("supported", "Built into StudyMode (mobile build not yet produced)."),
      ios: c("supported", "Built into StudyMode (mobile build not yet produced)."),
    },
  },
  {
    id: "on-top",
    label: "Keep timer window on top (reminder only)",
    cells: {
      windows: c("supported", "Tauri window API. Does not prevent other apps from opening."),
      macos: c("supported", "Tauri window API. Does not prevent other apps from opening."),
      linux: c("supported", "Tauri window API; some Wayland compositors ignore it."),
      android: c("unavailable", "Mobile apps have no floating windows."),
      ios: c("unavailable", "Mobile apps have no floating windows."),
    },
  },
  {
    id: "notifications",
    label: "Silence system notifications",
    cells: {
      windows: c("manual", "Windows has no public API for apps to toggle Do Not Disturb. Use the steps below."),
      macos: c("manual", "Focus modes cannot be set by third-party apps without Shortcuts. Use the steps below."),
      linux: c("manual", "Depends on the desktop environment. Use the steps below."),
      android: c("unavailable", "Possible with Notification Policy Access (ACCESS_NOTIFICATION_POLICY); not yet implemented."),
      ios: c("manual", "iOS does not let apps change Focus. Use the steps below."),
    },
    manualSteps: {
      windows: ["Open Settings → System → Notifications.", "Turn on “Do not disturb” (Windows 11) or Focus assist (Windows 10).", "Optionally schedule it or turn it on from the notification centre."],
      macos: ["Open Control Centre → Focus.", "Choose “Do Not Disturb” or create a “Study” Focus in System Settings → Focus."],
      linux: ["GNOME: open the notification list and turn on “Do Not Disturb”.", "KDE Plasma: System Tray → Notifications → “Do not disturb”."],
      ios: ["Open Control Centre → Focus → Do Not Disturb, or create a Study Focus in Settings → Focus."],
    },
  },
  {
    id: "app-restrictions",
    label: "Restrict other apps",
    cells: {
      windows: c("unavailable", "No supported mechanism for a standard desktop app. Use Microsoft Family Safety if you need hard limits."),
      macos: c("manual", "Use Screen Time → App Limits."),
      linux: c("unavailable", "No standard mechanism."),
      android: c("manual", "Use Digital Wellbeing → Focus mode. App-level control needs an Accessibility/Device Admin service; not implemented."),
      ios: c("unavailable", "Requires Screen Time (FamilyControls) entitlement approved by Apple; not implemented."),
    },
    manualSteps: {
      macos: ["System Settings → Screen Time → App Limits → Add Limit."],
      android: ["Settings → Digital Wellbeing & parental controls → Focus mode → choose distracting apps → Turn on now."],
    },
  },
  {
    id: "website-blocking",
    label: "Block websites",
    cells: {
      windows: c("manual", "Not implemented. A browser extension (per browser) or the hosts file (system-wide, needs admin) can do this."),
      macos: c("manual", "Screen Time → Content & Privacy can limit websites in Safari and system web views."),
      linux: c("manual", "Not implemented. Use a browser extension or the hosts file (needs root)."),
      android: c("manual", "Digital Wellbeing can limit some sites in Chrome."),
      ios: c("manual", "Screen Time → Content & Privacy → Content Restrictions → Web Content."),
    },
    manualSteps: {
      windows: ["Install a site-blocking extension in each browser you use (scope: that browser only).", "Or, as an administrator, add lines like “127.0.0.1 example.com” to C:\\Windows\\System32\\drivers\\etc\\hosts (scope: system-wide; remember to remove them)."],
      macos: ["System Settings → Screen Time → Content & Privacy → App Store, Media, Web & Games → Access to Web Content → Limit Adult Websites / Only Approved Websites, then add sites."],
      linux: ["Install a site-blocking extension in your browser (scope: that browser only).", "Or as root add “127.0.0.1 example.com” lines to /etc/hosts (scope: system-wide)."],
      android: ["Settings → Digital Wellbeing → Dashboard → Chrome → Show sites → set a timer for a site."],
      ios: ["Settings → Screen Time → Content & Privacy Restrictions → App Store, Media, Web & Games → Web Content → Limit Adult Websites → add under “Never Allow”."],
    },
  },
  {
    id: "warm-app",
    label: "Warm tint inside StudyMode",
    cells: {
      windows: c("supported", "App-only CSS overlay."),
      macos: c("supported", "App-only CSS overlay."),
      linux: c("supported", "App-only CSS overlay.", true),
      android: c("supported", "App-only CSS overlay."),
      ios: c("supported", "App-only CSS overlay."),
    },
  },
  {
    id: "warm-system",
    label: "Warm the whole screen (system-wide)",
    cells: {
      windows: c("manual", "Not implemented in StudyMode. Use Windows Night light."),
      macos: c("manual", "Not implemented in StudyMode. Use Night Shift."),
      linux: c("manual", "Not implemented. Use GNOME Night Light or KDE Night Color."),
      android: c("manual", "Use the system Night Light / Eye comfort setting."),
      ios: c("manual", "Use Night Shift."),
    },
    manualSteps: {
      windows: ["Settings → System → Display → Night light → Turn on now, or schedule it."],
      macos: ["System Settings → Displays → Night Shift → Schedule or Turn on until tomorrow."],
      linux: ["GNOME: Settings → Displays → Night Light.", "KDE: System Settings → Display and Monitor → Night Color."],
      android: ["Settings → Display → Night Light (name varies by manufacturer)."],
      ios: ["Settings → Display & Brightness → Night Shift."],
    },
  },
  {
    id: "tts",
    label: "Read aloud with on-device voices",
    cells: {
      windows: c("supported", "WebView2 exposes installed Windows voices. “Online”/“Natural” voices need a network connection."),
      macos: c("supported", "WKWebView exposes system voices."),
      linux: c("supported", "Only if your WebKitGTK build includes speech synthesis (2.44+ with Flite or libspiel). StudyMode detects a missing engine and explains it."),
      android: c("supported", "Android WebView speech support varies by device; unverified."),
      ios: c("supported", "WKWebView speech synthesis; unverified."),
    },
    manualSteps: {
      windows: ["Add voices: Settings → Time & language → Speech → Manage voices → Add voices."],
      macos: ["Add voices: System Settings → Accessibility → Spoken Content → System voice → Manage Voices."],
      linux: ["Speech in the desktop app depends on your WebKitGTK build. The browser version (npm run dev in Chromium) uses speech-dispatcher voices if installed."],
    },
  },
  {
    id: "secure-keys",
    label: "Secure storage for AI API key",
    cells: {
      windows: c("supported", "Windows Credential Manager via the keyring crate."),
      macos: c("supported", "Keychain via the keyring crate."),
      linux: c("supported", "Secret Service (GNOME Keyring/KWallet) must be running."),
      android: c("unavailable", "Not implemented; AI assistance is disabled."),
      ios: c("supported", "Keychain via the keyring crate; unverified."),
    },
  },
];

export const STATUS_LABEL: Record<CapStatus, string> = {
  supported: "Supported",
  permission: "Permission required",
  manual: "Manual setup",
  unavailable: "Unavailable",
};
