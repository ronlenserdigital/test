using System.Diagnostics;
using Microsoft.Win32;

namespace GamePrio;

/// <summary>
/// Reads the live system back and reports what is actually in effect.
/// Deliberately does not consult the journal: the journal is what we intended,
/// this is what Windows says happened.
/// </summary>
internal static class Verify
{
    public static void Run(Profile profile, Governor governor)
    {
        Log.Info("");
        Log.Info("VERIFY - read back from Windows, not from our own journal");
        Log.Info("");

        VerifyPowerPlan();
        VerifyTimerResolution(profile);
        VerifyRegistry();
        VerifyNetwork(profile);
        VerifyGameProcess(profile, governor);
        VerifyBackground(profile);

        Log.Info("");
        Log.Info(File.Exists(Journal.Path)
            ? "  journal is OPEN - a restore is pending, so these changes are live"
            : "  journal is clean - nothing is currently applied");
    }

    private static void Row(string name, string value, bool? ok = null)
    {
        string line = $"  {name,-24} {value}";
        if (ok == true) Log.Good(line);
        else if (ok == false) Log.Warn(line);
        else Log.Info(line);
    }

    private static void VerifyPowerPlan()
    {
        var active = Tuners.Run("powercfg.exe", "/getactivescheme").Output ?? "";
        string name = active.Contains('(') && active.Contains(')')
            ? active[(active.IndexOf('(') + 1)..active.LastIndexOf(')')]
            : active.Trim();
        Row("power plan", name, name.Contains("Ultimate", StringComparison.OrdinalIgnoreCase));

        var floor = Tuners.Run("powercfg.exe", "/query SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN").Output ?? "";
        var acLine = floor.Split('\n').FirstOrDefault(l => l.Contains("Current AC Power Setting Index"));
        if (acLine != null)
        {
            string hex = acLine.Split(':').Last().Trim();
            bool parsed = int.TryParse(hex.Replace("0x", ""),
                System.Globalization.NumberStyles.HexNumber, null, out int percent);
            Row("min processor state", parsed ? percent + "%" : hex, parsed && percent >= 100);
        }
    }

    private static void VerifyTimerResolution(Profile profile)
    {
        Native.NtQueryTimerResolution(out _, out uint max, out uint current);
        double ms = current / 10_000.0;
        Row("timer resolution", $"{ms:0.###} ms (finest available {max / 10_000.0:0.###} ms)",
            profile.System.TimerResolutionMs <= 0 || ms <= profile.System.TimerResolutionMs + 0.01);
    }

    private static void VerifyRegistry()
    {
        Row("MMCSS responsiveness", ReadDword(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
            "SystemResponsiveness", out int responsiveness) ? responsiveness.ToString() : "not set",
            responsiveness == 0);

        Row("MMCSS Games GPU prio", ReadDword(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games",
            "GPU Priority", out int gpu) ? gpu.ToString() : "not set", gpu == 8);

        bool hasDvr = ReadDwordHkcu(@"System\GameConfigStore", "GameDVR_Enabled", out int dvr);
        Row("Game DVR", hasDvr ? (dvr == 0 ? "disabled" : "enabled") : "not set", hasDvr && dvr == 0);
    }

    private static void VerifyNetwork(Profile profile)
    {
        var policies = Tuners.Ps("(Get-NetQosPolicy -ErrorAction SilentlyContinue | " +
                                 "Where-Object { $_.Name -like 'GamePrio-*' }).Name -join ', '");
        string names = (policies.Output ?? "").Trim();
        Row("QoS policies", names.Length > 0 ? names : "none", names.Length > 0);

        if (!string.IsNullOrWhiteSpace(profile.Network.PreferredInterfaceAlias))
        {
            var metric = Tuners.Ps(
                $"(Get-NetIPInterface -InterfaceAlias '{profile.Network.PreferredInterfaceAlias}' " +
                "-AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1).InterfaceMetric");
            string value = (metric.Output ?? "").Trim();
            Row($"metric: {profile.Network.PreferredInterfaceAlias}", value.Length > 0 ? value : "adapter not found",
                value == "1");
        }
    }

    private static void VerifyGameProcess(Profile profile, Governor governor)
    {
        Process game = null;
        foreach (var proc in Process.GetProcesses())
        {
            if (profile.Game.Executables.Contains(proc.ProcessName.ToLowerInvariant())) { game = proc; break; }
            proc.Dispose();
        }

        if (game == null) { Row("game process", "not running"); return; }

        var entry = GameCatalog.FindByExecutable(game.ProcessName);
        bool safeMode = profile.Safety.AntiCheatSafeMode && entry is { AntiCheat: AntiCheat.Kernel };

        IntPtr handle = Native.OpenProcess(Native.PROCESS_QUERY_LIMITED_INFORMATION, false, game.Id);
        if (handle == IntPtr.Zero)
        {
            // In safe mode this is the expected and desired answer.
            Row("game process", $"{game.ProcessName}: handle refused" + (safeMode ? " (safe mode - correct)" : ""), safeMode);
            game.Dispose();
            return;
        }

        try
        {
            uint priority = Native.GetPriorityClass(handle);
            string name = Profile.PriorityName(priority);

            if (safeMode)
            {
                bool untouched = priority == Native.NORMAL_PRIORITY_CLASS;
                Row("game process", $"{game.ProcessName}: {name} - safe mode, we never opened it",
                    untouched);
                if (!untouched)
                    Log.Dim("    (a non-Normal priority here was set by something else, not by gameprio)");
            }
            else
            {
                bool matches = string.Equals(name, profile.Game.Priority, StringComparison.OrdinalIgnoreCase);
                Row("game process", $"{game.ProcessName}: {name} (profile asks for {profile.Game.Priority})", matches);

                if (Native.GetProcessAffinityMask(handle, out UIntPtr mask, out _))
                {
                    ulong affinity = (ulong)mask;
                    bool pinned = !profile.Game.PCoreOnly || !governor.IsHybrid || affinity == governor.PCoreMask;
                    Row("game affinity", $"0x{affinity:X} ({System.Numerics.BitOperations.PopCount(affinity)} threads)", pinned);
                }
            }
        }
        finally { Native.CloseHandle(handle); game.Dispose(); }
    }

    private static void VerifyBackground(Profile profile)
    {
        uint wanted = Profile.PriorityClassFor(profile.Background.Priority);
        int atWanted = 0, eco = 0, considered = 0;
        var stragglers = new List<string>();

        foreach (var proc in Process.GetProcesses())
        {
            using (proc)
            {
                if (proc.Id <= 4 || proc.Id == Environment.ProcessId) continue;
                string key = proc.ProcessName.ToLowerInvariant();
                if (profile.Safety.NeverTouch.Contains(key)) continue;

                int session;
                try { session = proc.SessionId; } catch { continue; }
                if (session == 0) continue;                     // service hosts are never governed

                IntPtr handle = Native.OpenProcess(Native.PROCESS_QUERY_LIMITED_INFORMATION, false, proc.Id);
                if (handle == IntPtr.Zero) continue;

                try
                {
                    considered++;
                    if (Native.GetPriorityClass(handle) == wanted) atWanted++;
                    else if (stragglers.Count < 8) stragglers.Add(proc.ProcessName);

                    var state = new Native.PROCESS_POWER_THROTTLING_STATE
                    {
                        Version = Native.PROCESS_POWER_THROTTLING_CURRENT_VERSION
                    };
                    if (Native.GetProcessInformation(handle, Native.ProcessPowerThrottling, ref state,
                            (uint)System.Runtime.InteropServices.Marshal.SizeOf<Native.PROCESS_POWER_THROTTLING_STATE>())
                        && (state.StateMask & Native.PROCESS_POWER_THROTTLING_EXECUTION_SPEED) != 0)
                        eco++;
                }
                finally { Native.CloseHandle(handle); }
            }
        }

        Row("background priority", $"{atWanted} of {considered} at {profile.Background.Priority}",
            considered > 0 && atWanted > considered / 2);
        Row("background EcoQoS", $"{eco} of {considered} in efficiency mode",
            !profile.Background.EcoQoS || eco > 0);

        if (stragglers.Count > 0)
            Log.Dim($"    still at their own priority: {string.Join(", ", stragglers)}");
    }

    private static bool ReadDword(string key, string name, out int value)
    {
        value = -1;
        try
        {
            using var k = Registry.LocalMachine.OpenSubKey(key);
            if (k?.GetValue(name) is int v) { value = v; return true; }
        }
        catch { }
        return false;
    }

    private static bool ReadDwordHkcu(string key, string name, out int value)
    {
        value = -1;
        try
        {
            using var k = Registry.CurrentUser.OpenSubKey(key);
            if (k?.GetValue(name) is int v) { value = v; return true; }
        }
        catch { }
        return false;
    }
}
