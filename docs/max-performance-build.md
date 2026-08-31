# gameprio — maximum-privilege personal test build

A Windows console app that takes a selected game, gives it everything the OS will
hand over, pushes everything else out of the way, and then **measures whether that
actually did anything**.

Built for a single machine you own and are testing on. It is deliberately aggressive.
It is also fully journalled, so every change can be put back exactly.

---

## Build and run

```
cd src\GamePrio
dotnet build -c Release
cd bin\Release\net8.0-windows
copy profile.example.json profile.json      :: then edit it
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

Not built or run here: this repo's container is Linux and the .NET installer host is
blocked by the network policy, so **the first `dotnet build` on your machine is the
first compile this code has ever had.** Expect to fix a thing or two.

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
