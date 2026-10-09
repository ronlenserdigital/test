# Platform capability matrix

Source of truth: `src/platform/capabilities.ts` (the same data is shown in Settings → Focus & distractions, with the current OS highlighted). Regenerate this table after editing that file.

**Statuses** — *Supported*: implemented in StudyMode. *Permission required*: implemented, needs an OS prompt. *Manual setup*: StudyMode does not automate it; it shows the OS steps. *Unavailable*: not possible or not implemented.
**Verified** means exercised on that platform during development; everything else is implemented but untested there.

StudyMode never claims to block other apps. "Keep window on top" is labelled as a reminder only. StudyMode makes **no** system changes (no hosts-file edits, no notification policy changes), so there is nothing to clean up after a crash; the always-on-top flag belongs to the window and resets when the app restarts.

| Feature | Windows | macOS | Linux | Android | iOS |
|---|---|---|---|---|---|
| In-app focus (hide navigation, mute StudyMode alerts) | **Supported** (unverified)<br>Built into StudyMode. | **Supported** (unverified)<br>Built into StudyMode. | **Supported** (verified)<br>Built into StudyMode. | **Supported** (unverified)<br>Built into StudyMode (mobile build not yet produced). | **Supported** (unverified)<br>Built into StudyMode (mobile build not yet produced). |
| Keep timer window on top (reminder only) | **Supported** (unverified)<br>Tauri window API. Does not prevent other apps from opening. | **Supported** (unverified)<br>Tauri window API. Does not prevent other apps from opening. | **Supported** (unverified)<br>Tauri window API; some Wayland compositors ignore it. | **Unavailable** (unverified)<br>Mobile apps have no floating windows. | **Unavailable** (unverified)<br>Mobile apps have no floating windows. |
| Silence system notifications | **Manual setup** (unverified)<br>Windows has no public API for apps to toggle Do Not Disturb. Use the steps below. | **Manual setup** (unverified)<br>Focus modes cannot be set by third-party apps without Shortcuts. Use the steps below. | **Manual setup** (unverified)<br>Depends on the desktop environment. Use the steps below. | **Unavailable** (unverified)<br>Possible with Notification Policy Access (ACCESS_NOTIFICATION_POLICY); not yet implemented. | **Manual setup** (unverified)<br>iOS does not let apps change Focus. Use the steps below. |
| Restrict other apps | **Unavailable** (unverified)<br>No supported mechanism for a standard desktop app. Use Microsoft Family Safety if you need hard limits. | **Manual setup** (unverified)<br>Use Screen Time → App Limits. | **Unavailable** (unverified)<br>No standard mechanism. | **Manual setup** (unverified)<br>Use Digital Wellbeing → Focus mode. App-level control needs an Accessibility/Device Admin service; not implemented. | **Unavailable** (unverified)<br>Requires Screen Time (FamilyControls) entitlement approved by Apple; not implemented. |
| Block websites | **Manual setup** (unverified)<br>Not implemented. A browser extension (per browser) or the hosts file (system-wide, needs admin) can do this. | **Manual setup** (unverified)<br>Screen Time → Content & Privacy can limit websites in Safari and system web views. | **Manual setup** (unverified)<br>Not implemented. Use a browser extension or the hosts file (needs root). | **Manual setup** (unverified)<br>Digital Wellbeing can limit some sites in Chrome. | **Manual setup** (unverified)<br>Screen Time → Content & Privacy → Content Restrictions → Web Content. |
| Warm tint inside StudyMode | **Supported** (unverified)<br>App-only CSS overlay. | **Supported** (unverified)<br>App-only CSS overlay. | **Supported** (verified)<br>App-only CSS overlay. Verified in the Linux desktop build and in Chromium. | **Supported** (unverified)<br>App-only CSS overlay. | **Supported** (unverified)<br>App-only CSS overlay. |
| Warm the whole screen (system-wide) | **Manual setup** (unverified)<br>Not implemented in StudyMode. Use Windows Night light. | **Manual setup** (unverified)<br>Not implemented in StudyMode. Use Night Shift. | **Manual setup** (unverified)<br>Not implemented. Use GNOME Night Light or KDE Night Color. | **Manual setup** (unverified)<br>Use the system Night Light / Eye comfort setting. | **Manual setup** (unverified)<br>Use Night Shift. |
| Read aloud with on-device voices | **Supported** (unverified)<br>WebView2 exposes installed Windows voices. “Online”/“Natural” voices need a network connection. | **Supported** (unverified)<br>WKWebView exposes system voices. | **Unavailable** (verified)<br>Verified unavailable with Ubuntu 24.04's WebKitGTK 2.52 (built without speech synthesis). Other distributions' builds may include it; StudyMode detects the engine and explains when it is missing. | **Supported** (unverified)<br>Android WebView speech support varies by device; unverified. | **Supported** (unverified)<br>WKWebView speech synthesis; unverified. |
| Secure storage for AI API key | **Supported** (unverified)<br>Windows Credential Manager via the keyring crate. | **Supported** (unverified)<br>Keychain via the keyring crate. | **Supported** (unverified)<br>Secret Service (GNOME Keyring/KWallet) must be running. | **Unavailable** (unverified)<br>Not implemented; AI assistance is disabled. | **Supported** (unverified)<br>Keychain via the keyring crate; unverified. |


## Read aloud: desktop vs mobile

| | Windows (WebView2) | macOS (WKWebView) | Linux (WebKitGTK) | Android WebView | iOS WKWebView |
|---|---|---|---|---|---|
| Engine | Web Speech → Windows SAPI/OneCore voices | Web Speech → system voices | Only if the WebKitGTK build includes speech (missing in Ubuntu 24.04's 2.52) | Device TTS engine, varies | System voices |
| Offline voices | Yes (installed voices); "Online/Natural" voices need network and are labelled | Yes | n/a | Depends on engine | Yes |
| Background playback | Continues while minimised | Continues | n/a | Likely stops when backgrounded/locked | Stops when backgrounded unless audio session configured |
| Pitch | Supported by most voices | Supported | n/a | Varies | Supported |
| Verified | No (CI build only) | No | Yes — unavailable state shown correctly | No | No |

## Mobile status

Android and iOS share the React UI and domain code, but no mobile project has been generated (`npx tauri android init` / `npx tauri ios init` require the Android SDK/NDK and Xcode respectively). Mobile builds are **unverified**. Screen Time (iOS, FamilyControls entitlement) and notification policy access (Android) integrations are not implemented.
