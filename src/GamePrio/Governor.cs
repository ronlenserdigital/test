using System.Diagnostics;
using System.Runtime.InteropServices;

namespace GamePrio;

/// <summary>
/// Applies a profile to the live process table and puts it all back afterwards.
/// Nothing is changed before it has been written to the journal.
/// </summary>
public sealed class Governor
{
    private enum Tier { Never, ThrottleOnly, Full }

    private readonly Profile _profile;
    private readonly ulong _pCoreMask;
    private readonly ulong _eCoreMask;
    private readonly List<IntPtr> _jobHandles = new();

    public Governor(Profile profile)
    {
        _profile = profile;
        (_pCoreMask, _eCoreMask) = Native.GetCoreMasks();
    }

    public ulong PCoreMask => _pCoreMask;
    public ulong ECoreMask => _eCoreMask;
    public bool IsHybrid => _eCoreMask != 0;

    // ---------------------------------------------------------------- apply

    public Journal Apply(Process game)
    {
        var journal = new Journal { Profile = _profile.Name, StartedUtc = DateTime.UtcNow };
        journal.Save();   // an empty journal first, so even a crash mid-apply is recoverable

        ApplyToGame(game, journal);
        ApplyToBackground(game, journal);
        Tuners.ApplySystem(_profile, journal);
        Tuners.ApplyNetwork(_profile, game, journal);

        journal.Save();
        return journal;
    }

    private void ApplyToGame(Process game, Journal journal)
    {
        IntPtr h = OpenTarget(game.Id, out _);
        if (h == IntPtr.Zero)
        {
            Log.Error($"cannot open the game process (pid {game.Id}) - is gameprio elevated?");
            return;
        }

        try
        {
            var entry = Snapshot(game, h);
            journal.Processes.Add(entry);
            journal.Save();

            uint priority = Profile.PriorityClassFor(_profile.Game.Priority);
            if (priority == Native.REALTIME_PRIORITY_CLASS)
                Log.Warn("RealTime priority can starve input, audio and the GPU driver - " +
                         "it usually costs frame-time consistency rather than buying it");

            if (Native.SetPriorityClass(h, priority))
                Log.Good($"game {game.ProcessName} -> priority {Profile.PriorityName(priority)}");
            else
                Log.Warn($"game priority not set ({Err()})");

            if (_profile.Game.PCoreOnly && IsHybrid && _pCoreMask != 0)
            {
                if (Native.SetProcessAffinityMask(h, (UIntPtr)_pCoreMask))
                    Log.Good($"game -> P-cores only (mask 0x{_pCoreMask:X})");
                else
                    Log.Warn($"game affinity not set ({Err()})");
            }

            uint control = 0, state = 0;
            if (_profile.Game.DisablePowerThrottling)
                control |= Native.PROCESS_POWER_THROTTLING_EXECUTION_SPEED;   // state bit stays 0 = never EcoQoS
            if (_profile.Game.IgnoreTimerResolution)
            {
                control |= Native.PROCESS_POWER_THROTTLING_IGNORE_TIMER_RESOLUTION;
                state |= Native.PROCESS_POWER_THROTTLING_IGNORE_TIMER_RESOLUTION;
            }
            if (control != 0 && SetPowerThrottling(h, control, state))
            {
                entry.PowerThrottlingChanged = true;
                Log.Good("game -> power throttling off, exempt from timer-resolution throttling");
            }
        }
        finally { Native.CloseHandle(h); }
    }

    private void ApplyToBackground(Process game, Journal journal)
    {
        uint priority = Profile.PriorityClassFor(_profile.Background.Priority);
        int touched = 0, suspended = 0, capped = 0;

        foreach (var proc in Process.GetProcesses())
        {
            using (proc)
            {
                if (proc.Id == game.Id || proc.Id == Environment.ProcessId || proc.Id <= 4) continue;

                Tier tier = Classify(proc);
                if (tier == Tier.Never) continue;

                IntPtr h = OpenTarget(proc.Id, out bool limited);
                if (h == IntPtr.Zero) continue;

                try
                {
                    var entry = Snapshot(proc, h);

                    bool changed = Native.SetPriorityClass(h, priority);

                    if (_profile.Background.ECoreOnly && IsHybrid && _eCoreMask != 0 && !limited)
                        changed |= Native.SetProcessAffinityMask(h, (UIntPtr)_eCoreMask);

                    if (_profile.Background.EcoQoS &&
                        SetPowerThrottling(h,
                            Native.PROCESS_POWER_THROTTLING_EXECUTION_SPEED,
                            Native.PROCESS_POWER_THROTTLING_EXECUTION_SPEED))
                    {
                        entry.PowerThrottlingChanged = true;
                        changed = true;
                    }

                    if (tier == Tier.Full && _profile.Background.CpuCapPercent is > 0 and < 100)
                    {
                        entry.JobName = $"GamePrio_cap_{proc.Id}";
                        if (ApplyCpuCap(h, entry.JobName, _profile.Background.CpuCapPercent))
                        {
                            entry.CpuCapped = true;
                            capped++;
                            changed = true;
                        }
                    }

                    // Suspension goes last: once frozen we can no longer talk to it.
                    if (tier == Tier.Full && _profile.Background.Suspend &&
                        _profile.Background.SuspendList.Contains(Key(proc.ProcessName)))
                    {
                        if (Native.NtSuspendProcess(h) == 0)
                        {
                            entry.Suspended = true;
                            suspended++;
                            changed = true;
                        }
                    }

                    if (changed)
                    {
                        journal.Processes.Add(entry);
                        touched++;
                    }
                }
                catch (Exception ex) { Log.Dim($"{proc.ProcessName}: {ex.Message}"); }
                finally { Native.CloseHandle(h); }
            }
        }

        journal.Save();
        Log.Good($"background: {touched} processes re-prioritised" +
                 (capped > 0 ? $", {capped} CPU-capped" : "") +
                 (suspended > 0 ? $", {suspended} suspended" : ""));
    }

    private Tier Classify(Process proc)
    {
        string key = Key(proc.ProcessName);

        if (_profile.Safety.NeverTouch.Contains(key)) return Tier.Never;
        if (_profile.Safety.ThrottleOnly.Contains(key)) return Tier.ThrottleOnly;

        // Anything hosting a service or running outside our session is service-side work.
        if (_profile.Background.SkipSystemProcesses)
        {
            try { if (proc.SessionId == 0) return Tier.Never; }
            catch { return Tier.Never; }
        }

        return Tier.Full;
    }

    // -------------------------------------------------------------- restore

    public void Restore(Journal journal)
    {
        if (journal == null) { Log.Info("nothing to restore"); return; }

        int resumed = 0, restored = 0;

        // Resume before anything else - a frozen process cannot be re-prioritised.
        foreach (var e in journal.Processes.Where(p => p.Suspended))
        {
            IntPtr h = Native.OpenProcess(Native.PROCESS_SUSPEND_RESUME, false, e.Pid);
            if (h == IntPtr.Zero) continue;
            try { if (Native.NtResumeProcess(h) == 0) resumed++; }
            finally { Native.CloseHandle(h); }
        }

        foreach (var e in journal.Processes)
        {
            if (e.CpuCapped && !string.IsNullOrEmpty(e.JobName)) ReleaseCpuCap(e.JobName);

            if (!StillTheSameProcess(e)) continue;

            IntPtr h = OpenTarget(e.Pid, out _);
            if (h == IntPtr.Zero) continue;
            try
            {
                if (e.PreviousPriority != 0) Native.SetPriorityClass(h, e.PreviousPriority);
                if (e.PreviousAffinity != 0) Native.SetProcessAffinityMask(h, (UIntPtr)e.PreviousAffinity);
                if (e.PowerThrottlingChanged) SetPowerThrottling(h, 0, 0);   // back to system-managed
                restored++;
            }
            finally { Native.CloseHandle(h); }
        }

        Tuners.RestoreNetwork(journal);
        Tuners.RestoreSystem(journal);

        Log.Good($"restored {restored} processes" + (resumed > 0 ? $", resumed {resumed}" : ""));
        Journal.Clear();
    }

    /// <summary>Guards against PID reuse: same pid AND same start time, or we leave it alone.</summary>
    private static bool StillTheSameProcess(Journal.ProcEntry e)
    {
        try
        {
            using var p = Process.GetProcessById(e.Pid);
            if (e.StartTicks == 0) return true;
            return p.StartTime.Ticks == e.StartTicks;
        }
        catch { return false; }
    }

    // --------------------------------------------------------------- helpers

    private static string Key(string processName) => (processName ?? "").ToLowerInvariant();

    private static IntPtr OpenTarget(int pid, out bool limited)
    {
        limited = false;
        IntPtr h = Native.OpenProcess(Native.GOVERNOR_ACCESS, false, pid);
        if (h != IntPtr.Zero) return h;

        h = Native.OpenProcess(Native.GOVERNOR_ACCESS_FALLBACK, false, pid);
        limited = h != IntPtr.Zero;
        return h;
    }

    private static Journal.ProcEntry Snapshot(Process proc, IntPtr handle)
    {
        var entry = new Journal.ProcEntry
        {
            Pid = proc.Id,
            Name = proc.ProcessName,
            PreviousPriority = Native.GetPriorityClass(handle)
        };

        try { entry.StartTicks = proc.StartTime.Ticks; } catch { entry.StartTicks = 0; }

        if (Native.GetProcessAffinityMask(handle, out UIntPtr procMask, out _))
            entry.PreviousAffinity = (ulong)procMask;

        return entry;
    }

    private static bool SetPowerThrottling(IntPtr handle, uint controlMask, uint stateMask)
    {
        var s = new Native.PROCESS_POWER_THROTTLING_STATE
        {
            Version = Native.PROCESS_POWER_THROTTLING_CURRENT_VERSION,
            ControlMask = controlMask,
            StateMask = stateMask
        };
        return Native.SetProcessInformation(
            handle, Native.ProcessPowerThrottling, ref s, (uint)Marshal.SizeOf<Native.PROCESS_POWER_THROTTLING_STATE>());
    }

    private bool ApplyCpuCap(IntPtr processHandle, string jobName, int percent)
    {
        IntPtr job = Native.CreateJobObjectW(IntPtr.Zero, jobName);
        if (job == IntPtr.Zero) return false;
        _jobHandles.Add(job);

        if (!Native.AssignProcessToJobObject(job, processHandle)) return false;

        var info = new Native.JOBOBJECT_CPU_RATE_CONTROL_INFORMATION
        {
            ControlFlags = Native.JOB_OBJECT_CPU_RATE_CONTROL_ENABLE | Native.JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP,
            CpuRate = (uint)Math.Clamp(percent * 100, 1, 10000)   // 1/100th of a percent
        };
        return WriteJobInfo(job, info);
    }

    /// <summary>Reopens the named job (by name - survives our own crash) and lifts the cap.</summary>
    private static void ReleaseCpuCap(string jobName)
    {
        IntPtr job = Native.CreateJobObjectW(IntPtr.Zero, jobName);
        if (job == IntPtr.Zero) return;
        try { WriteJobInfo(job, default); }
        finally { Native.CloseHandle(job); }
    }

    private static bool WriteJobInfo(IntPtr job, Native.JOBOBJECT_CPU_RATE_CONTROL_INFORMATION info)
    {
        int size = Marshal.SizeOf<Native.JOBOBJECT_CPU_RATE_CONTROL_INFORMATION>();
        IntPtr buf = Marshal.AllocHGlobal(size);
        try
        {
            Marshal.StructureToPtr(info, buf, false);
            return Native.SetInformationJobObject(job, Native.JobObjectCpuRateControlInformation, buf, (uint)size);
        }
        finally { Marshal.FreeHGlobal(buf); }
    }

    public void CloseJobHandles()
    {
        foreach (var h in _jobHandles) Native.CloseHandle(h);
        _jobHandles.Clear();
    }

    private static string Err() => new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error()).Message;
}
