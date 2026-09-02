# PixelCross

A ~105 KB native Windows crosshair overlay. No installer, no runtime, no Electron.
One `.exe`, one text config file. Draw your own crosshair pixel by pixel or upload
an image — either one is centred exactly on the monitor the game is running on,
at whatever resolution it is running at.

## Why it is tiny

Pure Win32 + GDI, statically linked, no framework. Most crosshair apps ship an
Electron or .NET runtime (100–300 MB). This is a single file:

| App type            | On disk   |
|---------------------|-----------|
| Electron crosshair  | ~200 MB   |
| .NET crosshair      | ~70 MB    |
| **PixelCross**      | **~0.1 MB** |

Runtime memory is a few MB, and the overlay bitmap is only as large as the
crosshair itself — not the screen.

## Features

- **Auto game detection.** Polls the foreground window 2.5x/sec. Any process in
  your game list, or (optionally) any app running true fullscreen/borderless,
  turns the overlay on. Everything else turns it off.
- **Exact centering.** The overlay follows the monitor the game is on, reads that
  monitor's real resolution, and pins the crosshair's aim pixel to the screen's
  centre pixel. Per-monitor DPI aware, so scaled displays stay pixel-exact.
- **Pixel editor.** 16x16 up to 64x64 canvas. Pen, eraser, flood fill, line,
  rectangle, ellipse, X/Y mirror, undo (Ctrl+Z), 16-colour palette plus a full
  colour picker, per-colour alpha. Presets: dot, cross, T, circle, chevron.
- **Image crosshairs.** Upload PNG/BMP/JPG/GIF (alpha preserved), scale 10–400%,
  centred the same way.
- **Live tuning.** Pixel size, master opacity, X/Y nudge — all applied instantly.
- **Window controls.** `HIDE` makes the app vanish completely (window + tray icon).
  `F12` brings it back — the hint is printed in the title bar. Also `MIN` and
  `CLOSE`, plus a tray icon and Esc to hide.
- **Click-through.** The overlay is layered + transparent + no-activate, so it
  never steals a click or focus from the game.
- **Start with Windows** toggle — launches silently to the tray.

## Build

**Windows (MSVC).** Open *x64 Native Tools Command Prompt* in this folder:

```
build.bat
```

**Cross-compile from Linux:**

```
sudo apt install g++-mingw-w64-x86-64
./build.sh
```

Output: `build/PixelCross.exe`. GitHub Actions builds it on every push and
uploads the exe as an artifact.

## Use

1. Run `PixelCross.exe`. The panel opens and a tray icon appears.
2. Draw a crosshair, or click **UPLOAD IMAGE**.
3. Launch your game. The overlay appears by itself.
4. Not detected? Alt-tab out, press **F12**, click **ADD DETECTED GAME** — it is
   remembered from then on.
5. Press **HIDE** to make the app disappear. **F12** brings it back.

Settings live in `%APPDATA%\PixelCross\config.txt` (a few KB of plain text).

## Anti-cheat note

PixelCross does not touch the game process — no injection, no hooks, no memory
reads. It is a normal transparent window drawn by Windows on top. That is the
same technique monitor-bezel and streaming overlays use. Even so, some
competitive titles ban third-party crosshairs by policy, and exclusive-fullscreen
mode hides all overlays: run the game in **borderless windowed** if you want the
overlay visible. Check the rules for your game before using it online.
