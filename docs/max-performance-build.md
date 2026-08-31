# gameprio — maximum-privilege personal test build

A Windows console app that takes a selected game, gives it everything the OS will
hand over, pushes everything else out of the way, and then **measures whether that
actually did anything**.

Built for a single machine you own and are testing on. It is deliberately aggressive.
It is also fully journalled, so every change can be put back exactly.

---

## STRYKR

The UI is branded STRYKR and publishes as `strykr.exe`. The engine, the console tool and
the profile format are unchanged - only the front end was redesigned.

Dark shell, red accent (#E01F2D), Bahnschrift for display type with Inter for body -
both ship with Windows, so no font has to be downloaded or embedded. The window uses
extended client area with the system caption buttons, so minimize / maximize / close are
the real ones and behave normally; the strip beside them drags the window.

Layout: a game library rail on the left (search, filter-to-ticked, the catalog grouped by
anti-cheat class with per-game colour tiles, selected counts, add-a-game); CONTROL /
SETTINGS / ACTIVITY tabs on the right; and a footer strip carrying profile, CPU set,
logical CPUs, timer resolution and power plan, plus **Export report**.

Nothing was dropped in the redesign. Every feature is reachable:

| Feature | Where |
|---|---|
| Game selection, search, filter, add custom | Left rail |
| Anti-cheat banner and safe-mode switch | CONTROL, above STATUS |
| Watch / stop | CONTROL, hero card |
| Apply now, Restore everything, View activity | CONTROL card |
| Verify | STATUS card header |
| Benchmark, live FPS counter | BENCHMARK card |
| Simple presets and switches | SETTINGS, Simple |
| Every knob with its API detail | SETTINGS, Advanced |
| Save / reload profile | SETTINGS, top right |
| Log | ACTIVITY |
| Export report | Footer |
| Elevation warning | State pill, top right |

`Export report` writes a timestamped file to your Desktop: machine, full profile, and a
complete verify pass read back out of Windows.

## Checking the UI without Windows

`src/GamePrio.UiCheck` constructs the **real** windows - the same compiled XAML that runs
on Windows - on Avalonia's headless platform, so it runs on any OS:

```
cd src\GamePrio.UiCheck
dotnet run -c Release
```

It verifies that App.axaml, MainWindow.axaml and HudWindow.axaml load and construct, that
all 73 controls the code drives by name resolve, that the library populates, and that the
tab and mode handlers actually fire and toggle the right panels. Win32 startup steps fail
on non-Windows and are reported as expected; anything else failing is a real bug.

This exists because of a real one. Avalonia's `FindControl<T>` **throws** when the named
control exists but is a different type - it does not return null. A `SetText` helper that
tried `FindControl<TextBox>` first and fell back to `TextBlock` therefore threw on every
TextBlock in the window. Thrown from the constructor of a `WinExe`, that produces no
window, no console and no error - the process simply exits. Every lookup now goes through
one helper that finds the control as `Control` and casts softly.

`Program.Main` also installs a last-resort handler: any unhandled exception is appended to
`%ProgramData%\GamePrio\crash.log` and shown in a message box, and each startup step is
individually guarded so one failure costs that step rather than the whole window.

## Two front ends

`strykr.exe` is the window: a game library you tick, every setting as a control,
live status and the full activity log. `gameprio.exe` is the same engine on the command
line, useful for scripting and for the menu you get by double-clicking it. They share
one `profile.json` and one journal, so you can drive it either way.

The UI is Avalonia rather than WPF, purely so it could be built and verified in the
Linux container this was written in; it is a normal Windows window with normal
minimize / maximize / close.

### The game library

Ships with ~34 titles grouped by what anti-cheat they run, because that is the fact
that decides what is safe to do:

- **Kernel anti-cheat** - Fortnite (EAC + BattlEye), Call of Duty (Ricochet), Rainbow
  Six Siege (BattlEye), Valorant (Vanguard), Apex, PUBG, Tarkov, Destiny 2, Rust,
  The Finals, Marvel Rivals, Delta Force, BF2042, Helldivers 2, League.
- **User-mode** - CS2, Dota 2, Overwatch 2, Halo Infinite, GTA Online, Elden Ring,
  Roblox, Rocket League, Star Citizen, Warframe.
- **None** - Cyberpunk 2077, BG3, Starfield, Hogwarts Legacy, Witcher 3, RDR2,
  Palworld, Minecraft.

Tick a kernel-anti-cheat title and the Control tab shows a banner naming it, plus the
safe-mode switch described below. Anything not in the list can be added by executable name.

### Anti-cheat safe mode (on by default)

The risk in this tool is not spread evenly. Ranked, worst first:

| What | Exposure |
|---|---|
| Suspending background processes | Highest - the most aggressive thing it does |
| Opening a handle to the game process | High - EAC/BattlEye protect that handle |
| `SeDebugPrivilege` | Moderate - cheats use it, so it is part of the signature |
| Idle priority / EcoQoS on other processes | Low - Windows and Process Lasso do this routinely |
| Power plan, timer resolution, MMCSS, Game DVR | Effectively none - no process interaction |
| DSCP marking, upload throttling | Effectively none - Windows QoS policy, never touches the game |

When the running game is one of the kernel-anti-cheat titles and `safety.antiCheatSafeMode`
is true, the governor drops the top three rows entirely:

- the game process is **never opened** - no priority, no affinity, no throttling flags
- **nothing is suspended**, whatever the profile says
- **nothing is CPU-capped**
- **`SeDebugPrivilege` is never requested** - it is only enabled when safe mode is off

Everything else still runs: background processes drop to Idle + EcoQoS + E-cores, the
power plan, timer resolution, MMCSS and Game DVR settings apply, and the network policies
apply. That is not a stripped-down mode so much as the Process Lasso approach - you win
the cores by lowering everything else rather than by raising the game, so the game process
never needs to be touched at all.

`profile.fortnite.json` ships this configuration ready to use.

Safe mode reduces exposure; it does not eliminate it. Anything running on the machine
during a protected session carries some risk, and EAC and BattlEye have produced ban
waves over software as innocuous as RGB control. The only zero-risk option is not running
it alongside those titles.

## Build and run

```
:: the window
cd src\GamePrio.App
dotnet publish -c Release -r win-x64 --self-contained false ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o publish

:: the console tool
cd ..\GamePrio
dotnet publish -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true -o publish
copy profile.example.json publish\profile.json      :: then edit it, or just use the UI
```

Both need the .NET 8 runtime (`winget install Microsoft.DotNet.Runtime.8`). For a build
with no runtime dependency at all, add `--self-contained true -p:SelfContained=true`;
that lands around 35 MB.

`publish` is the one to use: only the `win-x64` publish produces a `gameprio.exe`
with the `requireAdministrator` manifest embedded, which is what makes UAC prompt.
A plain `dotnet build` on a non-Windows box gives you `gameprio.dll` and no manifest.

Run the logic tests any time (they need no Windows, no game, no admin):

```
cd src\GamePrio.Tests
dotnet run -c Release
```

Run from an **elevated** console (the manifest requests admin; UAC will prompt):

```
gameprio doctor                 :: what your CPU, timer, power plan and profile look like
gameprio watch                  :: wait for the game, apply on launch, restore on exit
gameprio apply                  :: apply now to an already-running game
gameprio restore                :: undo everything
gameprio bench --seconds 90     :: interleaved A/B, with a confidence interval
gameprio list                   :: every process and its current priority
```

`watch` is the normal mode. Start it, launch the game, play, exit the game — it
applies and unwinds on its own. Ctrl+C also unwinds.

**Build state:** compiles clean on .NET 8 (0 warnings, 0 errors) and publishes to a
`win-x64` `gameprio.exe` with the admin manifest embedded. The 30 logic checks in
`src/GamePrio.Tests` all pass. What has *not* run anywhere is the Win32 layer -
priority, affinity, EcoQoS, suspension, power plan, registry, QoS - because that
needs a real Windows machine. Your first elevated `gameprio doctor` is its first
contact with the API surface it is built around.

---

## What it actually does

### To the game
| Lever | API | Why |
|---|---|---|
| `High` priority class | `SetPriorityClass` | Above every background thread, below the kernel's own work |
| P-core-only affinity | `GetLogicalProcessorInformationEx` → `SetProcessAffinityMask` | On hybrid CPUs, keeps render/sim threads off the E-cores |
| Power throttling forced off | `SetProcessInformation` / `PROCESS_POWER_THROTTLING_STATE` | The game can never be classified EcoQoS |
| Exempt from timer-resolution throttling | same, `IGNORE_TIMER_RESOLUTION` | Win11 22H2+ made timer resolution per-process; this opts the game out |

**`RealTime` is available in the profile and is a trap.** It outranks input, audio and
parts of the GPU driver path. It usually costs frame-time consistency rather than
buying it. The app warns if you set it; it's your machine.

### To everything else
`Idle` priority + EcoQoS + E-core-only affinity, optionally a hard job-object CPU cap,
optionally full suspension (`NtSuspendProcess`) for a named list. Suspension is **on**
in the example profile because you asked for maximum — the list is browsers, cloud
sync, Office, Adobe and chat, which are exactly the processes that eat cores while you
play and are safe to freeze.

### To the machine
- Ultimate Performance power plan (reusing an existing copy rather than duplicating on every run)
- Minimum processor state 100%, core parking off
- Global timer resolution to 0.5 ms, held for as long as `gameprio` runs
- MMCSS: `SystemResponsiveness = 0`, and the `Tasks\Games` class set to GPU Priority 8 / Priority 6 / Scheduling Category High / SFIO High
- Game DVR and background recording off
- `Win32PrioritySeparation` available but `null` by default — set it to `38` (0x26) if you want to try short fixed foreground-biased quantums, and then *measure it*, because the effect is workload-specific and the internet's confidence about this value far exceeds the evidence
- `stopServices` is empty by default. Populate it only with services you have personally checked.

### To the network
- Forces the chosen interface's metric to 1, so the game routes over Ethernet rather than Wi-Fi
- A policy-based QoS rule marking the game's packets DSCP 46. Honest expectation: this
  helps on your own LAN if your AP honors WMM, and is usually stripped the moment traffic
  leaves your ISP's edge. It is not a ping reducer.
- **The one that actually works:** a `ThrottleRateActionBitsPerSecond` QoS policy capping
  Steam, Epic, OneDrive, Dropbox and Backblaze to 1 Mbit/s for the session. Filling your
  own uplink queue is the most common self-inflicted cause of in-game jitter, and this
  removes it.

---

## What it refuses to touch, and why

Three tiers, defined in the `safety` block:

- **Never touched** — `csrss`, `wininit`, `lsass`, `services`, `dwm`, `audiodg`, Defender,
  session-0 service hosts, and **every anti-cheat process** (EAC, BattlEye, Vanguard/vgc,
  ACE, GameGuard, FACEIT). Freezing or starving these buys zero frames and can cost you an
  OS, an audio stack, or an account.
- **Throttle-only** — Steam, Epic, Battle.net, EA, Discord, NVIDIA/AMD containers, RTSS,
  OBS. De-prioritized, never frozen: the game talks to some of them, and others hold your
  capture or input path.
- **Everything else** — full aggression.

`allowTouchingAntiCheat: true` exists in the config. One line on it, then it's your call:
suspending an anti-cheat service while its game is running is the single most reliable way
to get a hardware ban, EAC and BattlEye both inspect process state and have produced ban
waves over things as innocuous as RGB software, and a ban is not reversible by uninstalling
the tool. Leaving it `false` costs you no measurable performance, because those processes
are near-idle. There is no upside to flipping it.

Separately: if the machine you're testing on plays anti-cheat-protected multiplayer, do
the first few sessions on a single-player title. The profile behaves identically; the
downside if something is wrong doesn't.

---

## Restore safety

Every change is written to `%ProgramData%\GamePrio\journal.json` **before** it is applied:
prior priority class, prior affinity mask, whether power throttling was changed, whether
the process was suspended, the exact prior registry value (including "this value did not
exist"), the prior power scheme GUID, the prior interface metric, and every QoS policy
created.

- Normal exit, game exit, Ctrl+C → restored and the journal is deleted.
- Crash, BSOD, power cut → the journal survives; the next `gameprio` run replays it before
  doing anything else. `gameprio restore` does it on demand, and needs no profile.
- PID reuse is guarded by comparing process start time, so a recycled PID is left alone.
- CPU-cap job objects are *named*, so a later run can reopen and lift a cap it did not set.

Timer resolution is the one thing that unwinds by itself: it is held by the running
process and released when `gameprio` exits.

---

## Simple mode and Advanced mode

The header carries an **Advanced** switch. The two panels drive the same profile and are
kept in sync, so nothing is hidden - only described differently.

**Simple** offers three presets (Light touch / Balanced / Maximum) and six plain-language
switches: quiet down background apps, keep the PC at full speed, turn off background
recording, put the game first on your internet, freeze apps you are not using, stay safe
in anti-cheat games. Each carries one line explaining what actually happens. It also
carries a panel saying what the tool will not do, because that is part of an honest UI.

**Advanced** replaces every label with the mechanism: `SetPriorityClass`,
`SetProcessAffinityMask` against the max-`EfficiencyClass` mask from
`GetLogicalProcessorInformationEx`, `PROCESS_POWER_THROTTLING_EXECUTION_SPEED` control
and state masks, `JOBOBJECT_CPU_RATE_CONTROL_INFORMATION` in hundredths of a percent,
the power scheme GUID, `NtSetTimerResolution` and its per-process behaviour since 22H2,
the MMCSS registry values, `New-NetQosPolicy` and why DSCP has to be a policy rather
than set by the application - plus the three safety tiers and what is in each.

One implementation note that matters: `ApplyControlsToProfile` dispatches on the active
panel. The hidden panel holds stale values, and reading it would silently undo the other.

## The live FPS counter

The **Live FPS counter** button opens a readout in the **top-left corner** of the primary
screen. It has no panel or plate behind it - every glyph carries a hard black halo instead,
so it stays legible over snow, over a night map, over anything. FPS is the large number;
**1% LOW** sits directly beneath it in red, because that is the figure worth watching.

It is **click-through**: `WS_EX_TRANSPARENT` plus `WS_EX_NOACTIVATE` mean the mouse passes
straight to the game and the overlay can never eat a click or steal focus mid-fight. It is
also kept out of alt-tab. Close it from the same button in the main window.

It is **not an in-game overlay**. A real overlay means injecting into the game process,
which is exactly what safe mode exists to avoid and what anti-cheat hunts for. This is a
separate always-on-top window fed by PresentMon's ETW stream - nothing injected, no handle
on the game. The trade-off is honest: it draws over borderless and windowed games, and not
over exclusive fullscreen. Almost every modern title defaults to borderless.

### PresentMon is bundled

Frame timing is the one number this cannot synthesise, and sending a user off to find a
second executable is a bad first run, so **PresentMon ships inside STRYKR**.

- Intel PresentMon **2.4.0**, x64 console build, Authenticode-signed
- Taken from the official GitHub release over TLS
- SHA-256 `efe55aa91d381f425e686c87696965dd6b148e130e34985ef03733980a7480c4`
- MIT licensed (Copyright Intel Corporation); the licence is embedded and written out
  beside the tool
- Vendored at `src/GamePrio/tools/` and embedded as a resource, so the build is
  reproducible without network access

On first use it is unpacked to `%LOCALAPPDATA%\STRYKR\tools\PresentMon.exe` and only
rewritten if it is missing or the wrong size. **A copy you already have wins**: an explicit
path in the profile, one next to the executable, one in the working directory, or an Intel
install under Program Files is used in preference to the bundled build, so you can point
STRYKR at a newer PresentMon without touching the code.

## Knowing whether it worked

Two separate questions, and they need different answers.

### 1. Did the changes actually land?

`gameprio verify` (or the **Verify** button, results in the Activity tab). It reads the
state back out of Windows and deliberately ignores our own journal - the journal is what
we intended, verify is what actually happened:

```
VERIFY - read back from Windows, not from our own journal

  power plan               Ultimate Performance
  min processor state      100%
  timer resolution         0.5 ms (finest available 0.5 ms)
  MMCSS responsiveness     0
  MMCSS Games GPU prio     8
  Game DVR                 disabled
  QoS policies             GamePrio-game-Fortnite..., GamePrio-cap-steam
  metric: Ethernet         1
  game process             FortniteClient-Win64-Shipping: Normal - safe mode, we never opened it
  background priority      38 of 51 at Idle
  background EcoQoS        34 of 51 in efficiency mode
    still at their own priority: SteamService, nvcontainer, ...
```

Green lines are what the profile asked for; amber lines are not. In safe mode the game
line reading **Normal / untouched** is the pass condition, not a failure - it is the
evidence that the game process was never opened.

Cross-check it independently in **Task Manager -> Details**, right-click the column
headers, add **Base priority** and **Efficiency**: your background apps should read
`Low` with a green leaf. That is Windows telling you, with gameprio not involved.

### 2. Did it make any difference?

That is what the benchmark is for, and the answer is frequently "no measurable change" -
which is worth knowing before you build a habit around it.

## Testing it properly

This is the part that makes the tool worth having.

```
gameprio bench --seconds 90 --runs 2
```

It captures **baseline, profiled, baseline, profiled** — interleaved, so driver warm-up
and thermal drift hit both arms equally — using PresentMon, then reports:

```
  metric                baseline    profiled      delta
  ------------------------------------------------------
  average fps             142.31      144.02       +1.71
  1% low fps               88.40       97.65       +9.25
  0.1% low fps             61.02       74.88      +13.86
  stutters / min            7.20        2.10       -5.10

  95% CI on the average-fps difference: -0.42 .. +3.88 fps
```

Read it like this: a confidence interval that **straddles zero means you measured
nothing** on average FPS, and the tool says so in plain language. That's the expected
result on a healthy machine — published tests of seven commercial boosters found a median
gain around 2.4 FPS, inside run-to-run noise.

**The 1% and 0.1% low rows are the ones to watch.** Background contention shows up as one
30 ms frame in an 8 ms stream, not as a lower average. If this tool earns its keep, that's
where it will show.

Requirements and caveats:
- Install [Intel PresentMon](https://game.intel.com/us/intel-presentmon/) and put
  `PresentMon.exe` on PATH, or set `bench.presentMonPath`.
- The CLI flags differ between PresentMon 1.x and 2.x, so `bench.presentMonArgs` is a
  template in the profile — check it against your version once; the tool tells you if no
  frame-time column came back.
- Park the game somewhere repeatable: a menu, a built-in benchmark loop, or a quiet corner
  of a level. A different fight in each arm measures the fight, not the profile.
- 90 s × 2 runs per arm is a reasonable floor. Shorter runs mostly measure noise.

---

## What is verified, and what is not

`src/GamePrio.Tests` compiles the whole app into one assembly with a test entry point,
so the platform-independent half runs anywhere:

- percentile, mean-of-worst and the 1% / 0.1% low maths
- frame-time metrics (10 ms frames must read as exactly 100 fps; a flat trace must report zero stutters)
- **the bootstrap confidence interval** - two identical distributions must produce an
  interval that straddles zero, a real +20 fps difference must produce one entirely
  above zero, and the reverse must land entirely below. This is the claim the whole
  tool rests on, so it is the one most worth a test.
- PresentMon CSV parsing against both the 1.x lowercase header and the 2.x quoted
  header, with garbage rows, negative frame times, truncated lines, a missing
  frame-time column and an empty file
- profile normalisation, including that `allowTouchingAntiCheat: true` drops the
  anti-cheat fence but **never** the critical-system fence

Not verified anywhere: every Win32 call. Those need your machine.

## Known limits

- **Single processor group.** Machines above 64 logical CPUs need `SetThreadGroupAffinity`
  and group-aware masks; the topology parser reads group 0 only.
- **Polling, not ETW.** The watcher polls the process table once a second. An ETW
  `Microsoft-Windows-Kernel-Process` subscription would be tidier and catch a launch a
  second sooner.
- **Game detection is by executable name.** Fine for a personal rig, insufficient for
  anything shipped.
- **No overlay.** By design — an in-game overlay means injecting into the game process,
  which is what anti-cheat hunts for. Use a second monitor.
- **HAGS is not touched.** It needs a reboot to change, so it doesn't belong in a
  per-session tool. Set it once in Windows settings and benchmark it separately.
- **Not signed.** SmartScreen and some AV products will flag an unsigned binary that
  enables `SeDebugPrivilege` and suspends processes. That is the correct reaction to what
  this program does. Whitelist your own build; don't distribute it.
