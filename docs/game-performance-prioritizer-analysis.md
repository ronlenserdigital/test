# Game Performance Prioritizer — Feasibility & Competitive Analysis

**Date:** 2026-08-31
**Scope:** Analysis of a proposed desktop app that (1) lets a user select a game, (2) automatically de-prioritizes/suspends unrelated processes when that game launches, (3) shows performance + network analytics, and (4) prioritizes a selected network connection to improve ping.

---

## 1. Verdict up front

Every one of the four features already exists, shipping, mostly free. The category is crowded and has a credibility problem: independent testing repeatedly finds average-FPS gains inside measurement noise on healthy systems. **The idea is buildable, but "we close background apps to give you more FPS" is not a viable product thesis in 2026.**

There is a defensible product here, but it is a narrower one:

- Optimize **frame-time consistency (1% / 0.1% lows, stutter)** rather than average FPS. This is where background-process contention actually shows up, and it's what players feel.
- Win on **hybrid-CPU scheduling** (pinning the game to P-cores, exiling Chrome/Discord/OBS to E-cores). This is a real, measurable effect that Windows' own scheduler still gets wrong often enough to matter.
- Win on **honest measurement**: prove your own gains with a built-in A/B harness instead of asking users to trust a "Boost" button. Nobody in this category does this, and it is the single strongest differentiator available.
- Treat networking as **diagnosis and local contention control**, not magic ping reduction — unless you are prepared to fund a global proxy network, which is what the ping products actually sell.

The two largest existential risks are **anti-cheat false positives** (a ban wave attributed to your app kills the company) and **advertising-claim substantiation** (FPS/ping numbers you cannot defend).

---

## 2. Decomposing the app into four subsystems

### A. Game detection and profile activation

**What it needs to do:** know that "the selected game" just started, apply a profile, and reliably restore state when it exits — including on crash, on your app crashing, and on hard power-off.

**How to do it:**
- Subscribe to process start/stop via ETW (`Microsoft-Windows-Kernel-Process`) or WMI `Win32_ProcessStartTrace`. Polling `EnumProcesses` is the lazy fallback and adds its own overhead.
- Match on executable path + signature, not just filename (`launcher.exe` is not a unique key, and matching by name alone is trivially spoofable).
- Better signal: detect which process owns the fullscreen/foreground swap chain. Intel's PresentMon service already exposes present events per-process — you can consume it rather than reinvent it.
- **Restoration is the hard part.** Persist a journal of every change to disk before applying it, and reconcile on startup. If a user reboots mid-session and their antivirus is still pinned to idle priority forever, you have shipped a support nightmare.

**Difficulty:** Low-medium. This is table stakes.

### B. De-prioritizing / "deactivating" other processes

This is the feature with the widest gap between what users imagine and what is safe.

**Escalating levels of aggression, safest first:**

| Technique | API | Notes |
|---|---|---|
| Lower priority class | `SetPriorityClass` (`IDLE_`/`BELOW_NORMAL_PRIORITY_CLASS`) | Documented, reversible, low risk. The core of what Razer Cortex and Process Lasso actually do. |
| Efficiency mode / EcoQoS | `SetProcessInformation` + `PROCESS_POWER_THROTTLING_STATE` | Documented. Signals the scheduler to prefer E-cores and lower frequency for that process. Microsoft's own guidance: use it for work that is *not* contributing to the foreground experience — exactly this case. |
| CPU affinity | `SetProcessAffinityMask` / `SetThreadSelectedCpuSets` | Pin background work to E-cores, keep P-cores for the game. Biggest real win on Intel 12th-gen+ and AMD dual-CCD parts. |
| CPU rate limiting | Job objects, `JOBOBJECT_CPU_RATE_CONTROL_INFORMATION` | Documented and reversible; a hard cap without freezing the process. Underused by competitors. |
| Full suspension | `NtSuspendProcess` (undocumented) | **Recommend against as a default.** Frozen processes miss network keepalives and watchdog timers; Teams/Discord/AV/backup agents can wedge or reconnect badly on resume. |
| Stopping services | SCM APIs, requires admin | High blast radius. Stopping the wrong service (Windows Update, AV, audio) is how these apps earn their reputation. |

**Important correction to a common design assumption:** `PROCESS_MODE_BACKGROUND_BEGIN` (which also lowers I/O and memory priority — the thing you actually want) can only be applied by a process to *itself*. You cannot apply it to a third-party process. Use priority class + power throttling + affinity + job-object rate control instead.

**Also skip:** "RAM cleaning" via `EmptyWorkingSet`/`SetProcessWorkingSetSize`. It makes the Task Manager number go down and then forces the OS to page everything back in. It is theater, and it is the main reason this category is dismissed by informed users.

**Never touch:** the game process itself beyond priority/affinity, and never inject a DLL into it. See §5.

**Difficulty:** Medium. The APIs are easy; the *policy* (which processes are safe to touch, on an unknown user's machine) is the hard, ongoing, liability-carrying part. You need a curated, versioned, server-updated allow/deny list — never a blanket "suspend everything not on a whitelist."

### C. Performance and network analytics

**Do not build the capture layer.** Use:
- **Intel PresentMon SDK** — frame times, GPU busy, latency breakdown; open source, already the backing engine for CapFrameX, NVIDIA FrameView, and GPUOpen OCAT. Recent versions removed the admin-rights requirement, which matters for your installer story.
- **GPU telemetry:** NVML (NVIDIA), ADLX (AMD), IGCL (Intel).
- **CPU/RAM/disk:** PDH performance counters or ETW.
- **Network:** IP Helper (`GetIfTable2`) for interface counters, ICMP/UDP probes to the game server for RTT, ETW `Microsoft-Windows-TCPIP` for per-process socket attribution.

**Overlay warning:** an in-game overlay means hooking or injecting into the game process. That is precisely what anti-cheat looks for. Prefer a second-monitor / windowed dashboard, or an out-of-process overlay, and make the overlay optional and off by default for anti-cheat-protected titles.

**Difficulty:** Low-medium if you integrate PresentMon; high if you write your own frame capture.

### D. Network prioritization for better ping

This is the feature most likely to be over-promised. The honest engineering picture:

**What a Windows host genuinely controls:**
- **Which interface traffic uses.** Adjusting interface metrics / routing so the game uses Ethernet instead of Wi-Fi, or a specific NIC on a multi-WAN box. This is real and is probably what "prioritize a selected network" should mean. Per-*application* interface binding needs a WFP callout driver — a kernel driver, with everything that implies (EV signing, WHQL attestation, anti-cheat scrutiny).
- **Your own machine's upload contention.** Rate-limiting a Steam download or a cloud-backup upload during a match measurably cuts jitter caused by bufferbloat on your uplink. This is the single most effective networking feature you can ship without a driver or a server fleet.
- **DSCP marking** via policy-based QoS (`New-NetQosPolicy` / Group Policy). Two caveats worth putting on the box: Windows overwrites DSCP values set directly by applications, so it must be done as a policy; and DSCP is typically stripped or ignored once traffic leaves your ISP's edge. It helps on your own LAN/Wi-Fi (if the AP honors WMM) and essentially nowhere else.

**What a Windows host does *not* control:** the route across the public internet, the game server's tick rate, distance-based latency, or your neighbor's downstream congestion. Downstream shaping fundamentally has to happen at the router; a host can only ask nicely after the packets have already queued.

**What the ping products actually sell:** ExitLag, GearUP, NoPing, WTFast and similar re-route game traffic through their own server infrastructure to bypass poor ISP paths. ExitLag additionally sends duplicate packets over several routes and takes whichever arrives first — a genuine technique that trades bandwidth for loss-resilience. These help *only when ISP routing is the bottleneck*, and they require a global POP network — a capital and ops commitment on a completely different scale from a desktop utility.

**Hardware precedent:** Intel's Killer (ex-Rivet Networks) Prioritization Engine does traffic classification and local prioritization at the NIC level with "Advanced Stream Detect." Worth studying — and worth noting that it needs to control the NIC to do what it does.

**Difficulty:** Interface selection — low. Local upload shaping — medium. Per-app routing — high (kernel driver). Route optimization — very high (infrastructure business, not an app feature).

---

## 3. Does any of this actually work? The evidence

Be clear-eyed here, because your marketing claims will be measured against it.

- gHacks tested game boosters back in 2015 and found the improvements minor and inconsistent, concluding they act largely as placebo relative to a real hardware upgrade.
- A 2026 round-up testing seven popular FPS-booster apps on identical hardware across five games reported a **median gain of ~2.4 FPS**, generally inside run-to-run variance on well-configured systems. *(Source caveat: this is a vendor-adjacent blog, not a peer-reviewed or lab-controlled test. Treat the direction as credible, the precise number as indicative only.)*
- Consistent finding across sources: gains concentrate on **low-end, cluttered, RAM-constrained systems**, and vanish on healthy mid-to-high-end machines.

**The strategic reading:** average FPS is the wrong metric and a losing battle. Background contention shows up as *stutter* — a 30 ms frame in an otherwise 8 ms stream. Measure and market **1% and 0.1% lows, frame-time variance, and stutter events per minute**. That is both more honest and more likely to show a real delta, especially on hybrid CPUs and on machines with Chrome, Discord, OBS and a launcher all running.

---

## 4. Competitive landscape

### Process/system optimizers
| Product | What it does | Position |
|---|---|---|
| **Razer Cortex Game Booster** | Auto-detects game launch, suspends non-essential apps/services, frees RAM, restores on exit | Free, huge brand, direct head-on competitor |
| **Process Lasso** (Bitsum) | ProBalance dynamic priority throttling, persistent affinity/priority rules, gaming mode, P-core/E-core pinning | The serious-user incumbent; strongest technical competitor |
| **Hone.gg** | Modern freemium "one-click optimize" for FPS and Wi-Fi | Closest to the proposed positioning; validates that a modern-UX entrant can find an audience |
| **Wise Game Booster / Game Fire / IObit Game Booster** | Same pattern, bundled with cleanup utilities | Low-cost, low-trust tier |
| **Windows Game Mode + MMCSS** | Built into Windows; MMCSS gives registered multimedia threads prioritized CPU/disk access | The free baseline you must beat |
| **Feral Interactive GameMode** (Linux) | Open-source daemon: CPU governor, niceness, GPU perf level, applied on request | Excellent architectural reference — a small privileged daemon + unprivileged client |

### Analytics / telemetry
**Intel PresentMon** (frame times, GPU busy, latency; SDK others build on), **CapFrameX**, **NVIDIA FrameView / NVIDIA App**, **MSI Afterburner + RivaTuner**, **AMD Adrenalin** metrics overlay, **Xbox Game Bar** performance widget. All free. Analytics alone is not a wedge.

### Network / ping
**ExitLag**, **GearUP Booster**, **NoPing**, **WTFast**, **Outfox**, **Mudfish** (route optimization via proxy networks); **cFosSpeed**, **NetLimiter**, **GlassWire** (local shaping/monitoring); **Intel Killer Prioritization Engine** (NIC-level classification and prioritization).

**Read of the map:** the process-optimizer half is commoditized and mostly free; the ping half is subscription-monetized but requires infrastructure. Nobody credibly and honestly occupies the middle — *measured, per-game, contention-aware tuning with proof* — which is where your opening is.

---

## 5. Risks

1. **Anti-cheat false positives — the big one.** EAC and BattlEye inspect running processes, memory, drivers and network traffic. Documented false-positive triggers include overlays that hook the game, DLL injection, unsigned or unusual drivers, and anomalous network patterns; there have been ban waves attributed to something as innocuous as RGB control software touching the memory bus. Suspending game-adjacent processes, injecting an overlay, or filtering game packets through a driver all sit in the danger zone.
   **Mitigations:** never inject into a protected game process; no overlay by default on protected titles; a hard deny-list of anti-cheat services/processes that your app will never touch; test against EAC/BattlEye/Vanguard/Ricochet titles before every release; publish your behavior and, ideally, open a channel with the anti-cheat vendors early. Assume you will need a public "we do not touch the game process" page.
2. **Breaking the user's machine.** Stopping the wrong service or freezing a security agent produces crashes, failed backups and data loss. Requires a curated, versioned, remotely-updatable deny-list and a guaranteed restore path.
3. **Privilege and trust.** Priority/affinity on other users' processes, service control, and any network filtering need admin or a service; a driver needs EV code signing plus attestation. Budget for signing certificates, SmartScreen reputation build-up, and AV false-positive whitelisting with every vendor.
4. **Claim substantiation.** "+30 FPS" and "-50 ms ping" are advertising claims. In the US these need competent and reliable substantiation; app stores and payment processors also act on chargeback patterns. Publish methodology, or state gains as ranges with conditions.
5. **Commoditization.** Razer Cortex is free and Windows Game Mode is built in. Paid pricing needs to attach to something they don't do — measurement, per-game hybrid-CPU profiles, network diagnosis.
6. **Perception as cheating.** Any tool marketed as giving a competitive edge attracts scrutiny from both anti-cheat vendors and tournament rules. Keep the language on "your PC runs better," never on "advantage over other players."

---

## 6. Recommended MVP

**Platform:** Windows 11/10 x64 only. (Console is closed; macOS lacks the game library and the process-control surface; Linux already has Feral GameMode.)

**Architecture:** split-privilege, following the GameMode model —
- **Agent** — a Windows service holding the privileged operations (priority, affinity, EcoQoS, job objects, QoS policy, interface metrics), with a small, strictly-validated IPC surface.
- **UI** — unprivileged desktop app. .NET 8 + WinUI/WPF is the pragmatic pick (best Win32 interop story); Rust + Tauri if you want a smaller footprint and are willing to write the P/Invoke layer.
- **Telemetry** — PresentMon SDK + PDH counters + vendor GPU SDKs, in-process to the UI.
- **No kernel driver in v1.** Defer per-app routing until the product is proven.

**Feature cut for v1:**
1. Per-game profiles with automatic detection and guaranteed restore (including crash recovery).
2. Background contention control: priority class + EcoQoS + E-core affinity + job-object CPU caps. No suspension, no service stopping, no RAM cleaning.
3. Live dashboard: FPS, frame time, 1% lows, stutter events, CPU/GPU utilization and clocks, RAM, per-interface throughput, RTT and jitter to the game server.
4. **The A/B proof harness** — run N minutes with the profile off, N minutes on, same scene, and report the delta with confidence intervals. Show a *negative* result honestly when there isn't one. This is the feature nobody else has, it is cheap to build, and it converts skeptics.
5. Network: interface selection/priority, plus pausing or rate-limiting known bulk uploaders (Steam/Epic/OneDrive/backup agents) during a session. Diagnose the path (`traceroute`, per-hop jitter) and tell the user honestly whether their problem is Wi-Fi, uplink saturation, ISP route, or distance to the server.

**Deliberately out of scope for v1:** in-game overlay, route optimization/proxy network, per-app routing driver, registry "tweaks," RAM cleaning, service stopping.

**Monetization:** free tier with detection + analytics + basic profile; paid tier for the A/B harness history, per-game tuned profiles, network diagnosis, and multi-machine sync. Ping-routing, if ever, is a separate subscription with real infrastructure behind it.

---

## 7. Open questions

1. **Target user:** low-end/cluttered PCs (where the gains are real but the willingness to pay is low), or enthusiasts on hybrid CPUs (where willingness to pay is high but they already own Process Lasso)?
2. **Are you willing to ship a kernel driver?** That single decision splits the roadmap — per-app routing and true local traffic control sit on the far side of it.
3. **Networking ambition:** local contention + diagnosis (an app), or route optimization (an infrastructure business)?
4. **Anti-cheat posture:** proactive relationships with EAC/BattlEye/Riot, or strictly stay-out-of-the-way? The former is slow but is the moat.
5. **What is the honest claim** you're prepared to defend publicly with your own data?

---

## Sources

**Optimizers**
- [Razer Cortex: Game Booster](https://www.razer.com/cortex/booster)
- [What Is Razer Cortex and Does It Actually Work? — MakeUseOf](https://www.makeuseof.com/what-is-razer-cortex-does-it-work/)
- [Process Lasso Pro review — gHacks](https://www.ghacks.net/2010/05/21/process-lasso-pro-review/)
- [Process Lasso for Gaming: P-Cores and Affinity](https://whysogeek.com/process-lasso-cpu-affinity-gaming-2026/)
- [Hone.gg reviews — Trustpilot](https://www.trustpilot.com/review/hone.gg)
- [Feral Interactive GameMode (Linux)](https://github.com/FeralInteractive/gamemode)

**Effectiveness evidence**
- [Game Booster: Do gaming performance boosters actually work? — gHacks (2015)](https://www.ghacks.net/2015/05/23/do-game-boosters-improve-pc-gaming-performance/)
- [Do FPS Boosters Actually Work? We Tested 7 Popular Apps — betterfps (vendor-adjacent)](https://betterfps.com/blog/do-fps-boosters-actually-work-tested)
- [Do game boosters really work? — Tom's Hardware forums](https://forums.tomshardware.com/threads/do-game-boosters-really-work.2897047/)

**Windows APIs**
- [SetPriorityClass — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setpriorityclass)
- [SetProcessInformation (PROCESS_POWER_THROTTLING_STATE) — Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setprocessinformation)
- [Introducing EcoQoS — Microsoft Performance and Diagnostics blog](https://devblogs.microsoft.com/performance-diagnostics/introducing-ecoqos/)
- [Thread Priorities in Windows — Pavel Yosifovich](https://scorpiosoftware.net/2023/07/14/thread-priorities-in-windows/)
- [Multimedia Class Scheduler Service (MMCSS)](https://en.wikipedia.org/wiki/Multimedia_Class_Scheduler_Service)

**Telemetry**
- [Intel PresentMon](https://game.intel.com/us/intel-presentmon/)
- [PresentMon capture application — GitHub (GameTechDev)](https://github.com/GameTechDev/PresentMon/blob/main/README-CaptureApplication.md)
- [How to Use Intel PresentMon for Benchmarking — TechSpot](https://www.techspot.com/article/2723-intel-presentmon/)
- [CapFrameX — GitHub](https://github.com/CXWorld/CapFrameX)

**Networking**
- [Quality of Service (QoS) Policy — Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/networking/technologies/qos/qos-policy-top)
- [Manage QoS Policy — Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/networking/technologies/qos/qos-policy-manage)
- [QoS Policy Scenarios — Microsoft Learn](https://learn.microsoft.com/en-us/windows-server/networking/technologies/qos/qos-policy-scenarios)
- [ExitLag review — does it really reduce ping?](https://gamescatalogue.blog/exitlag-review/)
- [GearUP vs ExitLag comparison](https://criticnest.com/gearup-vs-exitlag/)
- [Top 3 network boosters: ExitLag vs NoPing vs GearUP](https://rykogaming.com/top-3-network-boosters-exitlag-vs-noping-vs-gearup-booster-which-will-conquer-your-lag/)
- [Killer E3100 product brief (Rivet Networks / Intel)](https://cdrdv2-public.intel.com/753108/E3100-ProductBrief.pdf)
- [Intel acquires Rivet Networks — PCWorld](https://www.pcworld.com/article/399176/intel-buys-rivet-networks-and-its-killer-networking-brand-to-beef-up-its-wi-fi-tech.html)

**Anti-cheat risk**
- [BattlEye and Easy Anti-Cheat: RGB control software causes bans — Igor's Lab](https://www.igorslab.de/en/battleye-and-easy-anti-cheat-rgb-control-software-causes-anew-bans-and-accounts-blocks-that-make-games-worthless/)
- [Anti-cheat flagging software as "unauthorized modification" — Razer Insider](https://insider.razer.com/general-discussion-6/anti-cheat-flagging-software-as-unauthorized-modification-or-software-41919)
- [False positive bans and what triggers them — Unbanster](https://unbanster.com/false-positive-bans/)
