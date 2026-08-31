using System.Diagnostics;
using Microsoft.Win32;

namespace GamePrio;

/// <summary>Machine-wide levers: power plan, timer resolution, MMCSS/registry, services, network.</summary>
internal static class Tuners
{
    private const string UltimatePerformanceGuid = "e9a42b02-d5df-448d-aa00-03f14749eb61";

    // ------------------------------------------------------------ system

    public static void ApplySystem(Profile p, Journal journal)
    {
        var s = p.System;

        if (s.UltimatePerformancePowerPlan) ApplyPowerPlan(journal);
        if (s.MinProcessorStatePercent > 0) SetProcessorFloor(s.MinProcessorStatePercent);
        if (s.DisableCoreParking) DisableCoreParking();
        if (s.TimerResolutionMs > 0) RaiseTimerResolution(s.TimerResolutionMs, journal);
        if (s.MmcssGamesTuning) ApplyMmcss(journal);
        if (s.Win32PrioritySeparation.HasValue) ApplyPrioritySeparation(s.Win32PrioritySeparation.Value, journal);
        if (s.DisableGameDvr) DisableGameDvr(journal);

        foreach (var svc in s.StopServices ?? new List<string>())
        {
            if (string.IsNullOrWhiteSpace(svc)) continue;
            var r = Run("sc.exe", $"stop \"{svc}\"");
            if (r.ExitCode == 0)
            {
                journal.ServicesStopped.Add(svc);
                Log.Good($"service stopped: {svc}");
            }
            else Log.Warn($"service {svc} not stopped ({r.Output.Trim()})");
        }

        journal.Save();
    }

    public static void RestoreSystem(Journal journal)
    {
        foreach (var svc in journal.ServicesStopped ?? new List<string>())
            Run("sc.exe", $"start \"{svc}\"");

        // Registry entries come back exactly as they were - including "was not there".
        foreach (var r in (journal.Registry ?? new List<Journal.RegEntry>()).AsEnumerable().Reverse())
            RestoreRegistry(r);

        if (!string.IsNullOrEmpty(journal.PreviousPowerScheme))
        {
            Run("powercfg.exe", $"/setactive {journal.PreviousPowerScheme}");
            Log.Good("power plan restored");
        }

        if (journal.Registry != null && journal.Registry.Any(x => x.NeedsReboot))
            Log.Warn("one or more restored keys only take effect after a reboot");
    }

    private static void ApplyPowerPlan(Journal journal)
    {
        var active = Run("powercfg.exe", "/getactivescheme");
        string previous = ExtractGuid(active.Output);
        if (!string.IsNullOrEmpty(previous)) journal.PreviousPowerScheme = previous;

        // Ultimate Performance is hidden until it is duplicated into the scheme list -
        // but duplicating on every run would litter the list, so reuse an existing copy.
        string target = FindUltimatePerformanceScheme();
        if (string.IsNullOrEmpty(target))
        {
            var dup = Run("powercfg.exe", $"-duplicatescheme {UltimatePerformanceGuid}");
            target = ExtractGuid(dup.Output) ?? UltimatePerformanceGuid;
        }

        var set = Run("powercfg.exe", $"/setactive {target}");
        if (set.ExitCode == 0) Log.Good("power plan -> Ultimate Performance");
        else Log.Warn($"power plan unchanged ({set.Output.Trim()})");
    }

    private static string FindUltimatePerformanceScheme()
    {
        var list = Run("powercfg.exe", "/list");
        foreach (var line in (list.Output ?? "").Split('\n'))
        {
            if (line.Contains("Ultimate Performance", StringComparison.OrdinalIgnoreCase))
                return ExtractGuid(line);
        }
        return null;
    }

    private static void SetProcessorFloor(int percent)
    {
        percent = Math.Clamp(percent, 0, 100);
        Run("powercfg.exe", $"/setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN {percent}");
        Run("powercfg.exe", $"/setdcvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN {percent}");
        Run("powercfg.exe", "/setactive SCHEME_CURRENT");
        Log.Good($"minimum processor state -> {percent}%");
    }

    private static void DisableCoreParking()
    {
        Run("powercfg.exe", "/setacvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100");
        Run("powercfg.exe", "/setdcvalueindex SCHEME_CURRENT SUB_PROCESSOR CPMINCORES 100");
        Run("powercfg.exe", "/setactive SCHEME_CURRENT");
        Log.Good("core parking disabled");
    }

    private static void RaiseTimerResolution(double ms, Journal journal)
    {
        Native.NtQueryTimerResolution(out uint min, out uint max, out uint current);
        uint desired = (uint)Math.Max(max, ms * 10_000);   // 100ns units; max == finest supported
        if (Native.NtSetTimerResolution(desired, true, out uint actual) == 0)
        {
            journal.TimerResolutionRaised = true;
            Log.Good($"timer resolution {current / 10_000.0:0.###} ms -> {actual / 10_000.0:0.###} ms " +
                     "(held while gameprio runs)");
        }
        else Log.Warn("timer resolution unchanged");
    }

    private static void ApplyMmcss(Journal journal)
    {
        const string sysProfile = @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
        const string games = sysProfile + @"\Tasks\Games";

        SetHklm(journal, sysProfile, "SystemResponsiveness", RegistryValueKind.DWord, 0);
        SetHklm(journal, games, "GPU Priority", RegistryValueKind.DWord, 8);
        SetHklm(journal, games, "Priority", RegistryValueKind.DWord, 6);
        SetHklm(journal, games, "Scheduling Category", RegistryValueKind.String, "High");
        SetHklm(journal, games, "SFIO Priority", RegistryValueKind.String, "High");
        Log.Good("MMCSS tuned for the Games task class");
    }

    private static void ApplyPrioritySeparation(int value, Journal journal)
    {
        SetHklm(journal, @"SYSTEM\CurrentControlSet\Control\PriorityControl",
            "Win32PrioritySeparation", RegistryValueKind.DWord, value);
        Log.Good($"Win32PrioritySeparation -> 0x{value:X} (quantum tuning; effect is workload-specific)");
    }

    private static void DisableGameDvr(Journal journal)
    {
        SetHkcu(journal, @"System\GameConfigStore", "GameDVR_Enabled", RegistryValueKind.DWord, 0);
        SetHklm(journal, @"SOFTWARE\Policies\Microsoft\Windows\GameDVR",
            "AllowGameDVR", RegistryValueKind.DWord, 0);
        Log.Good("Game DVR / background recording disabled");
    }

    // --------------------------------------------------------- registry

    private static void SetHklm(Journal j, string key, string name, RegistryValueKind kind, object value, bool reboot = false)
        => SetValue(j, "HKLM", Registry.LocalMachine, key, name, kind, value, reboot);

    private static void SetHkcu(Journal j, string key, string name, RegistryValueKind kind, object value, bool reboot = false)
        => SetValue(j, "HKCU", Registry.CurrentUser, key, name, kind, value, reboot);

    private static void SetValue(Journal journal, string hiveName, RegistryKey hive, string keyPath,
                                 string name, RegistryValueKind kind, object value, bool needsReboot)
    {
        try
        {
            using var key = hive.CreateSubKey(keyPath, writable: true);
            if (key == null) { Log.Warn($"{hiveName}\\{keyPath} could not be opened"); return; }

            object existing = key.GetValue(name);
            journal.Registry.Add(new Journal.RegEntry
            {
                Hive = hiveName,
                Key = keyPath,
                Name = name,
                Existed = existing != null,
                Kind = kind.ToString(),
                PreviousValue = existing?.ToString(),
                NeedsReboot = needsReboot
            });
            journal.Save();     // recorded before the write, never after

            key.SetValue(name, value, kind);
        }
        catch (Exception ex) { Log.Warn($"{hiveName}\\{keyPath}\\{name}: {ex.Message}"); }
    }

    private static void RestoreRegistry(Journal.RegEntry r)
    {
        try
        {
            RegistryKey hive = r.Hive == "HKCU" ? Registry.CurrentUser : Registry.LocalMachine;
            using var key = hive.OpenSubKey(r.Key, writable: true);
            if (key == null) return;

            if (!r.Existed) { key.DeleteValue(r.Name, throwOnMissingValue: false); return; }

            if (r.Kind == nameof(RegistryValueKind.DWord) && int.TryParse(r.PreviousValue, out int dw))
                key.SetValue(r.Name, dw, RegistryValueKind.DWord);
            else
                key.SetValue(r.Name, r.PreviousValue ?? "", RegistryValueKind.String);
        }
        catch (Exception ex) { Log.Warn($"restore {r.Hive}\\{r.Key}\\{r.Name}: {ex.Message}"); }
    }

    // ---------------------------------------------------------- network

    public static void ApplyNetwork(Profile p, string gameExecutable, Journal journal)
    {
        var n = p.Network;

        if (!string.IsNullOrWhiteSpace(n.PreferredInterfaceAlias))
            PreferInterface(n.PreferredInterfaceAlias, journal);

        if (n.Dscp > 0 && !string.IsNullOrWhiteSpace(gameExecutable))
        {
            string exe = gameExecutable + ".exe";
            string policy = "GamePrio-game-" + gameExecutable;
            if (AddQosPolicy(journal, policy,
                    $"-AppPathNameMatchCondition '{exe}' -DSCPAction {Math.Clamp(n.Dscp, 0, 63)} -NetworkProfile All"))
                Log.Good($"QoS policy marks {exe} with DSCP {n.Dscp} " +
                         "(honoured on your LAN if the AP does WMM; usually stripped past the ISP edge)");
        }

        // The one networking lever with a reliable effect: stop your own uploads
        // from filling the uplink queue while you are playing.
        if (n.ThrottleBulkUploaders && n.BulkUploaderThrottleKbps > 0)
        {
            long bps = (long)n.BulkUploaderThrottleKbps * 1000;
            int throttled = 0;
            foreach (var app in n.BulkUploaders ?? new List<string>())
            {
                string policy = "GamePrio-cap-" + app;
                if (AddQosPolicy(journal, policy,
                        $"-AppPathNameMatchCondition '{app}.exe' -ThrottleRateActionBitsPerSecond {bps} -NetworkProfile All"))
                    throttled++;
            }
            if (throttled > 0)
                Log.Good($"{throttled} bulk uploaders capped at {n.BulkUploaderThrottleKbps} kbit/s for the session");
        }

        journal.Save();
    }

    /// <summary>Creates a NetQosPolicy, recording it in the journal first so restore always finds it.</summary>
    private static bool AddQosPolicy(Journal journal, string name, string arguments)
    {
        journal.Network ??= new Journal.NetEntry();
        journal.Network.QosPolicies.Add(name);
        journal.Save();

        var r = Ps($"Remove-NetQosPolicy -Name '{name}' -Confirm:$false -ErrorAction SilentlyContinue; " +
                   $"New-NetQosPolicy -Name '{name}' {arguments}");
        if (r.ExitCode != 0)
        {
            journal.Network.QosPolicies.Remove(name);
            Log.Warn($"QoS policy '{name}' not created ({r.Output.Trim()})");
            return false;
        }
        return true;
    }

    private static void PreferInterface(string alias, Journal journal)
    {
        var q = Ps($"$i = Get-NetIPInterface -InterfaceAlias '{alias}' -AddressFamily IPv4 -ErrorAction Stop | " +
                   "Select-Object -First 1; \"$($i.ifIndex)|$($i.InterfaceMetric)|$($i.AutomaticMetric)\"");
        if (q.ExitCode != 0) { Log.Warn($"interface '{alias}' not found"); return; }

        var parts = q.Output.Trim().Split('|');
        if (parts.Length < 3) { Log.Warn($"could not read metric for '{alias}'"); return; }

        journal.Network ??= new Journal.NetEntry();
        journal.Network.InterfaceAlias = alias;
        int.TryParse(parts[0], out int ifIndex);
        journal.Network.InterfaceIndex = ifIndex;
        uint.TryParse(parts[1], out uint metric);
        journal.Network.PreviousMetric = metric;
        journal.Network.PreviousMetricWasAutomatic = parts[2].Contains("Enabled", StringComparison.OrdinalIgnoreCase);
        journal.Save();

        var r = Ps($"Set-NetIPInterface -InterfaceAlias '{alias}' -AddressFamily IPv4 -InterfaceMetric 1");
        if (r.ExitCode == 0) Log.Good($"'{alias}' is now the preferred route (metric 1, was {metric})");
        else Log.Warn($"metric unchanged ({r.Output.Trim()})");
    }

    public static void RestoreNetwork(Journal journal)
    {
        var n = journal.Network;
        if (n == null) return;

        foreach (var policy in n.QosPolicies ?? new List<string>())
            Ps($"Remove-NetQosPolicy -Name '{policy}' -Confirm:$false -ErrorAction SilentlyContinue");
        if (n.QosPolicies is { Count: > 0 }) Log.Good($"{n.QosPolicies.Count} QoS policies removed");

        if (!string.IsNullOrEmpty(n.InterfaceAlias))
        {
            if (n.PreviousMetricWasAutomatic)
                Ps($"Set-NetIPInterface -InterfaceAlias '{n.InterfaceAlias}' -AddressFamily IPv4 -AutomaticMetric Enabled");
            else
                Ps($"Set-NetIPInterface -InterfaceAlias '{n.InterfaceAlias}' -AddressFamily IPv4 -InterfaceMetric {n.PreviousMetric}");
            Log.Good("interface metric restored");
        }
    }

    // ----------------------------------------------------------- shelling

    public sealed record ShellResult(int ExitCode, string Output);

    public static ShellResult Ps(string command) =>
        Run("powershell.exe", $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command \"{command.Replace("\"", "\\\"")}\"");

    public static ShellResult Run(string exe, string args)
    {
        try
        {
            var psi = new ProcessStartInfo(exe, args)
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var p = Process.Start(psi);
            if (p == null) return new ShellResult(-1, "could not start " + exe);
            string output = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
            p.WaitForExit(30_000);
            return new ShellResult(p.HasExited ? p.ExitCode : -1, output);
        }
        catch (Exception ex) { return new ShellResult(-1, ex.Message); }
    }

    private static string ExtractGuid(string text)
    {
        var m = System.Text.RegularExpressions.Regex.Match(
            text ?? "", @"[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}");
        return m.Success ? m.Value : null;
    }
}
