using System.Diagnostics;
using Microsoft.Win32;

namespace GamePrio;

public enum Severity { Good, Info, Warning, Critical }

/// <summary>One audited fact about the machine, with what it is worth if wrong.</summary>
public sealed record Finding(
    string Title,
    Severity Severity,
    string Detail,
    string Gain,
    string FixId = null,
    string FixLabel = null)
{
    public bool Actionable => FixId != null;
}

/// <summary>
/// The part of the tool that pays for itself. Six of the ten changes worth more than 5%
/// live in BIOS or in the game's own options and cannot be flipped from Windows - but
/// every one of them can be READ, and telling someone their RAM is running at 4800
/// instead of 6000 is worth more than every registry key in this program combined.
/// </summary>
public static class Audit
{
    public static List<Finding> Run(Profile profile)
    {
        var findings = new List<Finding>();

        Add(findings, CheckMemoryProfile);
        Add(findings, CheckRefreshRate);
        Add(findings, CheckVbs);
        Add(findings, CheckMemoryAmount);
        Add(findings, CheckPowerPlan);
        Add(findings, CheckCpuClocks);
        Add(findings, CheckGpuDriver);
        Add(findings, CheckWindowsBuild);
        Add(findings, CheckHags);
        Add(findings, CheckGameMode);
        Add(findings, CheckPagefile);
        Add(findings, () => CheckDiskSpace(profile));
        Add(findings, CheckResizableBar);
        Add(findings, CheckMsiMode);
        Add(findings, CheckDefenderExclusions);
        Add(findings, CheckFortniteConfig);
        Add(findings, CheckMpo);

        // Worst first: the point of an audit is the top of the list.
        return findings.OrderByDescending(f => f.Severity).ToList();
    }

    private static void Add(List<Finding> into, Func<Finding> check)
    {
        try
        {
            var finding = check();
            if (finding != null) into.Add(finding);
        }
        catch (Exception ex) { Log.Dim($"audit check failed: {ex.Message}"); }
    }

    // ---------------------------------------------------------------- checks

    /// <summary>The single most common expensive mistake: RAM left at JEDEC speed.</summary>
    private static Finding CheckMemoryProfile()
    {
        var result = Tuners.Ps("(Get-CimInstance Win32_PhysicalMemory | " +
                               "Select-Object -First 1 Speed,ConfiguredClockSpeed | " +
                               "ForEach-Object { \"$($_.Speed)|$($_.ConfiguredClockSpeed)\" })");
        var parts = (result.Output ?? "").Trim().Split('|');
        if (parts.Length < 2 || !int.TryParse(parts[0], out int rated) || !int.TryParse(parts[1], out int actual))
            return null;
        if (rated <= 0 || actual <= 0) return null;

        if (actual >= rated - 50)
            return new Finding("Memory profile (XMP / EXPO)", Severity.Good,
                $"Running at {actual} MT/s, its rated speed.", "already correct");

        return new Finding("Memory profile (XMP / EXPO) is OFF", Severity.Critical,
            $"Your RAM is rated for {rated} MT/s but is running at {actual} MT/s. Windows cannot change " +
            "this - enable XMP (Intel) or EXPO/DOCP (AMD) in your BIOS. This is the most common and most " +
            "expensive misconfiguration in PC gaming.",
            "8-12% in CPU-bound games, up to 29% on 1% lows");
    }

    /// <summary>A 144 Hz panel left at 60 Hz caps everything downstream of it.</summary>
    private static Finding CheckRefreshRate()
    {
        var (current, best) = Display.CurrentAndBestRefreshRate();
        if (current <= 0 || best <= 0) return null;

        if (current >= best - 1)
            return new Finding("Monitor refresh rate", Severity.Good,
                $"Running at {current} Hz, the highest this mode supports.", "already correct");

        return new Finding($"Monitor is running at {current} Hz, not {best} Hz", Severity.Critical,
            $"Your display supports {best} Hz at this resolution but Windows has it set to {current} Hz. " +
            "Every frame above that is being thrown away.",
            $"up to {(double)best / Math.Max(current, 1):0.#}x the frames you can actually see",
            "refresh", $"Set {best} Hz");
    }

    private static Finding CheckVbs()
    {
        bool enabled = ReadDword(Registry.LocalMachine,
            @"SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity",
            "Enabled") == 1;

        if (!enabled)
            return new Finding("Memory Integrity (VBS)", Severity.Good,
                "Already off. Nothing to gain here.", "already applied");

        return new Finding("Memory Integrity (VBS) is on", Severity.Info,
            "Hypervisor-enforced code integrity costs CPU-bound performance. STRYKR will NOT switch this " +
            "off for you: it is what stops unsigned drivers running in kernel memory, and a third-party " +
            "program that silently disables it is behaving exactly like malware - which is also how " +
            "anti-cheat would read it. Do it yourself if you want it: " +
            "Windows Security > Device security > Core isolation > Memory integrity, then reboot.",
            "up to 10% CPU-bound, ~2% at 4K");
    }

    private static Finding CheckMemoryAmount()
    {
        var status = new Native.MEMORYSTATUSEX
        {
            dwLength = (uint)System.Runtime.InteropServices.Marshal.SizeOf<Native.MEMORYSTATUSEX>()
        };
        if (!Native.GlobalMemoryStatusEx(ref status)) return null;

        double gb = status.ullTotalPhys / 1073741824.0;
        if (gb >= 15) return null;

        return new Finding($"Only {gb:0} GB of RAM", Severity.Warning,
            "Modern titles page heavily below 16 GB, which shows up as traversal stutter rather than low " +
            "average FPS. No software setting substitutes for the memory.",
            "hardware-limited");
    }

    private static Finding CheckPowerPlan()
    {
        string output = Tuners.Run("powercfg.exe", "/getactivescheme").Output ?? "";
        string name = output.Contains('(') && output.Contains(')')
            ? output[(output.IndexOf('(') + 1)..output.LastIndexOf(')')]
            : "";

        if (name.Contains("Ultimate", StringComparison.OrdinalIgnoreCase)
            || name.Contains("High performance", StringComparison.OrdinalIgnoreCase))
            return new Finding("Power plan", Severity.Good, $"{name}.", "already correct");

        return new Finding($"Power plan is '{name}'", Severity.Warning,
            "Balanced and power-saving plans park cores and drop clocks mid-match. Start applies Ultimate " +
            "Performance for the session and puts this back afterwards.",
            "0-5% desktop, considerably more on a laptop");
    }

    /// <summary>Sustained clocks far below base is the signature of a thermal or power limit.</summary>
    private static Finding CheckCpuClocks()
    {
        var result = Tuners.Ps("(Get-CimInstance Win32_Processor | Select-Object -First 1 " +
                               "MaxClockSpeed,CurrentClockSpeed | ForEach-Object { \"$($_.MaxClockSpeed)|$($_.CurrentClockSpeed)\" })");
        var parts = (result.Output ?? "").Trim().Split('|');
        if (parts.Length < 2 || !int.TryParse(parts[0], out int max) || !int.TryParse(parts[1], out int current))
            return null;
        if (max <= 0 || current <= 0) return null;

        double ratio = (double)current / max;
        if (ratio >= 0.80)
            return new Finding("CPU clocks", Severity.Good,
                $"{current} MHz against a {max} MHz base - no sign of throttling at idle.", "already correct");

        return new Finding("CPU is running well below its rated clock", Severity.Warning,
            $"{current} MHz against {max} MHz rated. On a laptop this usually means heat or a power limit; " +
            "check cooling, paste and fan curves before touching any software setting. Re-check this under load.",
            "0% if you are not throttling, 10-30% if you are");
    }

    private static Finding CheckGpuDriver()
    {
        var result = Tuners.Ps("(Get-CimInstance Win32_VideoController | Where-Object { $_.AdapterCompatibility } | " +
                               "Select-Object -First 1 Name,DriverVersion,DriverDate | " +
                               "ForEach-Object { \"$($_.Name)|$($_.DriverVersion)\" })");
        var parts = (result.Output ?? "").Trim().Split('|');
        if (parts.Length < 2 || string.IsNullOrWhiteSpace(parts[0])) return null;

        return new Finding("Graphics driver", Severity.Info,
            $"{parts[0].Trim()}, driver {parts[1].Trim()}. If you are chasing stutter rather than low FPS, a " +
            "clean reinstall with DDU resolves about 40% of driver-related stuttering on the first pass.",
            "stutter, not average FPS");
    }

    /// <summary>The known-bad Windows build and driver pairing is worth more than any tweak on this list.</summary>
    private static Finding CheckWindowsBuild()
    {
        string build = ReadString(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "CurrentBuildNumber");
        int ubr = ReadDword(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "UBR");
        string display = ReadString(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion", "DisplayVersion");

        if (string.IsNullOrEmpty(build)) return null;

        bool is24H2OrLater = int.TryParse(build, out int b) && b >= 26100;
        if (!is24H2OrLater)
            return new Finding("Windows build", Severity.Good, $"Build {build}.{ubr} ({display}).", "n/a");

        return new Finding($"Windows {display} (build {build}.{ubr})", Severity.Warning,
            "24H2 and 25H2 cumulative updates around KB5066835 caused large regressions in some titles " +
            "(33-50% in Assassin's Creed Shadows and CS2 in reported testing), recovered by GeForce 581.94 " +
            "and later. If your FPS fell off a cliff after an update, check your driver before anything else.",
            "up to 33-50% in affected titles");
    }

    private static Finding CheckHags()
    {
        int mode = ReadDword(Registry.LocalMachine, @"SYSTEM\CurrentControlSet\Control\GraphicsDrivers", "HwSchMode");
        bool on = mode == 2;

        return new Finding($"Hardware-accelerated GPU scheduling is {(on ? "on" : "off")}", Severity.Info,
            on
                ? "Averages about 0.3% on FPS - inside noise - but it is required for DLSS Frame Generation, " +
                  "which is the actual reason to keep it on."
                : "Averages about 0.3% on FPS either way, but DLSS Frame Generation will not work without it. " +
                  "Turn it on in Settings > Display > Graphics if you use frame generation.",
            "~0%, but gates DLSS Frame Generation");
    }

    private static Finding CheckGameMode()
    {
        int allow = ReadDword(Registry.CurrentUser, @"Software\Microsoft\GameBar", "AllowAutoGameMode");
        if (allow == 1 || allow == -1)
            return new Finding("Windows Game Mode", Severity.Good, "Enabled.", "already correct");

        return new Finding("Windows Game Mode is off", Severity.Warning,
            "Game Mode is the free baseline: it prioritises the foreground game and holds back background " +
            "activity, including Defender scanning intensity. Turn it on in Settings > Gaming.",
            "0-2%, free");
    }

    private static Finding CheckPagefile()
    {
        var result = Tuners.Ps("(Get-CimInstance Win32_PageFileUsage | Measure-Object -Property AllocatedBaseSize -Sum).Sum");
        string value = (result.Output ?? "").Trim();
        bool none = string.IsNullOrEmpty(value) || value == "0";

        if (!none) return null;

        return new Finding("The pagefile is disabled", Severity.Critical,
            "Disabling the pagefile is a booster-guide myth that causes out-of-memory crashes in modern " +
            "titles and does not raise framerate. Set it back to system-managed.",
            "negative - this costs you stability, not frames");
    }

    private static Finding CheckDiskSpace(Profile profile)
    {
        try
        {
            var drive = new DriveInfo(Path.GetPathRoot(AppContext.BaseDirectory) ?? "C:\\");
            if (!drive.IsReady) return null;

            double freeRatio = (double)drive.AvailableFreeSpace / drive.TotalSize;
            double freeGb = drive.AvailableFreeSpace / 1073741824.0;

            if (freeRatio >= 0.15)
                return new Finding("Drive space", Severity.Good,
                    $"{freeGb:0} GB free ({freeRatio:P0}) on {drive.Name}.", "already correct");

            return new Finding($"Only {freeRatio:P0} free on {drive.Name}", Severity.Warning,
                "An SSD above roughly 85% full loses write performance badly, which surfaces as " +
                "texture-streaming stutter rather than lower average FPS.",
                "prevents a 10-40% loss, not a gain");
        }
        catch { return null; }
    }

    /// <summary>Honest about what cannot be read: better than a confident wrong answer.</summary>
    private static Finding CheckResizableBar()
    {
        return new Finding("Resizable BAR / AMD SAM", Severity.Info,
            "Cannot be read reliably from Windows - check your BIOS (often called 'Above 4G Decoding' plus " +
            "'Re-Size BAR Support') or your GPU control panel. Worth checking: it is one of the few settings " +
            "that can be worth double digits. It is also occasionally NEGATIVE - one test lost 69% of its " +
            "0.1% lows in Cyberpunk on an RX 6900 XT - so benchmark it rather than trusting it.",
            "5-15% typical, up to 27%, sometimes negative");
    }

    private static Finding CheckMsiMode()
    {
        string instance = Display.PrimaryGpuInstanceId();
        if (instance == null) return null;

        bool? msi = Display.IsMsiModeEnabled(instance);
        if (msi == null) return null;

        if (msi == true)
            return new Finding("GPU interrupt mode (MSI)", Severity.Good,
                "Message-signalled interrupts are already enabled.", "already correct");

        return new Finding("GPU is using line-based interrupts", Severity.Info,
            "Message-signalled interrupts (MSI) reduce DPC latency and frame-time spikes compared with " +
            "shared interrupt lines. Changes a device registry key; reversible, and needs a reboot.",
            "frame-time consistency, not average FPS",
            "msi", "Enable MSI (reboot)");
    }

    private static Finding CheckDefenderExclusions()
    {
        return new Finding("Defender real-time scanning of game folders", Severity.Info,
            "Excluding your game's install folder is worth 2-8% on 1% lows in streaming-heavy titles. " +
            "STRYKR will NOT write antivirus exclusions for you - a program that adds its own AV " +
            "exclusions is indistinguishable from malware by behaviour. Add it yourself: Windows Security " +
            "> Virus & threat protection > Manage settings > Add or remove exclusions, and point it at the " +
            "game's folder only. Never exclude a whole drive, and never turn Defender off.",
            "2-8% on 1% lows in streaming-heavy games");
    }

    private static Finding CheckMpo()
    {
        int mode = ReadDword(Registry.LocalMachine, @"SOFTWARE\Microsoft\Windows\Dwm", "OverlayTestMode");
        if (mode == 5)
            return new Finding("Multi-plane overlay", Severity.Good,
                "Already disabled.", "already applied");

        return new Finding("Multi-plane overlay is enabled", Severity.Info,
            "MPO causes flicker and stutter on some GPU and display combinations. This is a targeted fix " +
            "for that symptom, not a general speed-up - it does nothing for average FPS, and it stopped " +
            "working reliably on Windows 24H2 and later. Reversible, needs a reboot.",
            "0% FPS; fixes flicker/stutter on affected setups",
            "mpo", "Disable (reboot)");
    }

    private static Finding CheckFortniteConfig()
    {
        if (!GameConfig.FortniteAvailable) return null;

        return new Finding("Fortnite graphics settings", Severity.Info,
            "The two or three expensive settings in a game are worth more than every Windows tweak here " +
            "put together - shadows and post-processing especially. STRYKR can write the competitive " +
            "values into Fortnite's own config and keeps a copy of your original. Only settings the game's " +
            "own menu already exposes are touched.",
            "often 20%+, far more than any registry key",
            "fortnite", "Apply performance settings");
    }

    // --------------------------------------------------------------- helpers

    private static int ReadDword(RegistryKey hive, string key, string name)
    {
        try
        {
            using var k = hive.OpenSubKey(key);
            return k?.GetValue(name) is int v ? v : -1;
        }
        catch { return -1; }
    }

    private static string ReadString(RegistryKey hive, string key, string name)
    {
        try
        {
            using var k = hive.OpenSubKey(key);
            return k?.GetValue(name)?.ToString();
        }
        catch { return null; }
    }
}
