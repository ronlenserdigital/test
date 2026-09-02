# DEADCENTER

**Precision. Your way.**

A ~200 KB native Windows crosshair overlay. No installer, no runtime, no Electron.
One `.exe`, one text config. It detects your game, pins a crosshair to the exact
centre pixel of the monitor that game is on, and gets out of the way.

## Why it is tiny

Pure Win32 + GDI, statically linked, no framework.

| App type            | On disk     |
|---------------------|-------------|
| Electron crosshair  | ~200 MB     |
| .NET crosshair      | ~70 MB      |
| **DEADCENTER**      | **~0.2 MB** |

## What it does

**Home** — a large preview showing the crosshair and nothing else, at 100% /
200% / 400%, on a flat neutral field. Every control on the right applies to the
live overlay as you move it.

Every tab, nav item, toggle, slider and button carries a vector icon drawn by
the app itself — no icon font, no image assets, nothing added to the binary
beyond the geometry.

**Design** — three modes so the complexity is opt-in:
- **Basic**: colour, opacity, thickness, outline, length, centre dot, gap,
  bloom/glow and X/Y offset. Every change applies to the overlay instantly.
- **Shape**: cross / dot / T / circle / chevron plus their geometry.
- **Effects**: bloom, outline colour, opacity.
- **Advanced**: custom image upload (PNG/BMP/JPG/GIF, alpha preserved, 10–400%)
  and the pixel-art layer.

**Studio** is the pixel editor — 16–48px canvas with pen, eraser, flood fill,
line, rect, ellipse, X/Y mirror and undo — one layer deep, where it belongs.

Eight presets sit under the canvas, and **Themes** swaps the app accent.

**Game Profiles** — every game remembers its own crosshair and resolution, and
DEADCENTER switches automatically the moment that game takes focus.

**Settings** — overlay rules, auto-detect, start with Windows, and automatic
update checks.

## Controls

- The overlay hides the **instant** you alt-tab out of the game — foreground
  changes come from a `SetWinEventHook`, not a poll — and comes straight back
  when you tab in. Turn that rule off with **Only in game** (in the sidebar card
  and in Settings) to keep the crosshair on the desktop too.
- **F12** anywhere hides or brings back the window.
- **HIDE** removes the window *and* the tray icon — the app vanishes completely.
- **MIN** / **×**, tray icon with right-click menu, Esc to hide.
- The overlay is layered, click-through and no-activate: it never steals a click
  or focus from the game.

## Automatic updates

On launch DEADCENTER reads `crosshair/latest.json` from this repo. If the version
there is newer than the running build it offers a one-click download and swap
(Settings → Download & Install). Cutting a `v*` tag builds the exe and attaches it
to a GitHub release, which is what `latest.json` points at — so shipping an update
is: bump `latest.json`, tag, push.

## Build

**Windows (MSVC)** — *x64 Native Tools Command Prompt* in this folder:

```
build.bat
```

**Cross-compile from Linux:**

```
sudo apt install g++-mingw-w64-x86-64
./build.sh
```

Output: `build/DeadCenter.exe`.

## Use

1. Run `DeadCenter.exe`. The window opens and a tray icon appears.
2. Design → pick a preset, set your colour, tune it against a preview environment.
3. Launch your game **in borderless windowed** — exclusive fullscreen hides every
   overlay on Windows, not just this one.
4. Not detected? Alt-tab out, F12, Game Profiles → **ADD**. It is remembered and
   auto-switches from then on.

Settings live in `%APPDATA%\DeadCenter\config.txt`.

## Anti-cheat note

DEADCENTER does not touch the game process — no injection, no hooks, no memory
reads. It is a normal transparent window drawn by Windows on top, the same
technique streaming and monitor overlays use. Even so, some competitive titles
ban third-party crosshairs by policy. Check the rules for your game before using
it online.
