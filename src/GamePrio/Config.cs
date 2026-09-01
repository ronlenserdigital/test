using System.Text.Json;
using System.Text.Json.Serialization;

namespace GamePrio;

public sealed class Profile
{
    public string Name { get; set; } = "default";
    public GameSettings Game { get; set; } = new();
    public BackgroundSettings Background { get; set; } = new();
    public SystemSettings System { get; set; } = new();
    public NetworkSettings Network { get; set; } = new();
    public SafetySettings Safety { get; set; } = new();
    public BenchSettings Bench { get; set; } = new();

    public sealed class GameSettings
    {
        /// Executable names, with or without ".exe". First one found wins.
        public List<string> Executables { get; set; } = new();

        /// <summary>
        /// Find the game without being told: any running title from the shipped catalog,
        /// or a foreground window filling a monitor. Ticked games still take priority.
        /// </summary>
        public bool AutoDetect { get; set; } = true;
        /// Idle | BelowNormal | Normal | AboveNormal | High | RealTime
        public string Priority { get; set; } = "High";
        public bool PCoreOnly { get; set; } = true;
        public bool DisablePowerThrottling { get; set; } = true;
        public bool IgnoreTimerResolution { get; set; } = true;
    }

    public sealed class BackgroundSettings
    {
        public string Priority { get; set; } = "Idle";
        public bool EcoQoS { get; set; } = true;
        public bool ECoreOnly { get; set; } = true;
        /// 0 = no cap. Otherwise a hard job-object cap, in percent of total CPU.
        public int CpuCapPercent { get; set; } = 0;
        /// Freeze processes named here outright. Off by default - see docs.
        public bool Suspend { get; set; } = false;
        public List<string> SuspendList { get; set; } = new();
        /// Skip processes running as SYSTEM / session 0 service hosts.
        public bool SkipSystemProcesses { get; set; } = true;
    }

    public sealed class SystemSettings
    {
        public bool UltimatePerformancePowerPlan { get; set; } = true;
        public int MinProcessorStatePercent { get; set; } = 100;
        public bool DisableCoreParking { get; set; } = true;
        /// Global timer resolution to request, in ms. 0 = leave alone.
        public double TimerResolutionMs { get; set; } = 0.5;
        /// MMCSS SystemResponsiveness + Tasks\Games registry tuning.
        public bool MmcssGamesTuning { get; set; } = true;
        /// null = leave alone. 0x26 (38) is the common "short, fixed, foreground-biased quantum" value.
        public int? Win32PrioritySeparation { get; set; }
        public bool DisableGameDvr { get; set; } = true;
        /// Service names to stop for the session. Empty by default. High blast radius.
        public List<string> StopServices { get; set; } = new();
    }

    public sealed class NetworkSettings
    {
        /// e.g. "Ethernet". Its InterfaceMetric is forced to 1 so the game routes over it.
        public string PreferredInterfaceAlias { get; set; }
        /// DSCP value for a policy-based QoS rule on the game exe. 46 = Expedited Forwarding. 0 = skip.
        public int Dscp { get; set; } = 46;
        /// <summary>Host the PERFORMANCE tab probes for latency, jitter and loss.</summary>
        public string PingTarget { get; set; } = "1.1.1.1";

        public bool ThrottleBulkUploaders { get; set; } = true;
        public List<string> BulkUploaders { get; set; } = new();
        /// Hard upload cap applied to each bulk uploader for the session, in kbit/s.
        public int BulkUploaderThrottleKbps { get; set; } = 1000;
    }

    public sealed class SafetySettings
    {
        /// Never opened, never modified, at any aggression level.
        public List<string> NeverTouch { get; set; } = new();
        /// Priority / EcoQoS only - never suspended, never CPU-capped.
        public List<string> ThrottleOnly { get; set; } = new();
        /// Anti-cheat processes are in NeverTouch for a reason. Flip at your own risk.
        public bool AllowTouchingAntiCheat { get; set; } = false;

        /// <summary>
        /// When the detected game runs kernel-level anti-cheat, drop to the levers that do
        /// not interact with processes anti-cheat cares about: the game itself is never
        /// opened, nothing is suspended, nothing is CPU-capped, and SeDebugPrivilege is
        /// never requested. Background de-prioritisation and machine/network tuning stay on.
        /// </summary>
        public bool AntiCheatSafeMode { get; set; } = true;
    }

    public sealed class BenchSettings
    {
        public string PresentMonPath { get; set; } = "PresentMon.exe";
        /// {process} {out} {seconds} are substituted. Check against your PresentMon version.
        public string PresentMonArgs { get; set; } =
            "-process_name {process} -output_file {out} -timed {seconds} -terminate_after_timed -stop_existing_session -no_top";

        /// Streaming form used by the live HUD. {process} is substituted.
        public string PresentMonLiveArgs { get; set; } =
            "-process_name {process} -output_stdout -stop_existing_session -no_top";
    }

    private static readonly JsonSerializerOptions Opts = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true
    };

    public void Save(string path)
    {
        string dir = Path.GetDirectoryName(Path.GetFullPath(path));
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        File.WriteAllText(path, JsonSerializer.Serialize(this, Opts));
    }

    public static Profile Load(string path)
    {
        var p = JsonSerializer.Deserialize<Profile>(File.ReadAllText(path), Opts);
        if (p == null) throw new InvalidDataException($"{path} did not parse into a profile");
        p.Normalize();
        return p;
    }

    /// <summary>Strips ".exe" and lowercases every name list so matching is one comparison.</summary>
    private void Normalize()
    {
        static List<string> Clean(List<string> xs) =>
            (xs ?? new List<string>())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim().ToLowerInvariant())
                .Select(x => x.EndsWith(".exe") ? x[..^4] : x)
                .Distinct()
                .ToList();

        Game.Executables = Clean(Game.Executables);
        Background.SuspendList = Clean(Background.SuspendList);
        Network.BulkUploaders = Clean(Network.BulkUploaders);
        Safety.NeverTouch = Clean(Safety.NeverTouch);
        Safety.ThrottleOnly = Clean(Safety.ThrottleOnly);

        if (!Safety.AllowTouchingAntiCheat)
            Safety.NeverTouch = Clean(Safety.NeverTouch.Concat(Defaults.AntiCheat).ToList());

        Safety.NeverTouch = Clean(Safety.NeverTouch.Concat(Defaults.CriticalSystem).ToList());
        Safety.ThrottleOnly = Clean(Safety.ThrottleOnly.Concat(Defaults.ThrottleOnly).ToList());
    }

    public static uint PriorityClassFor(string name) => (name ?? "").Trim().ToLowerInvariant() switch
    {
        "idle" => Native.IDLE_PRIORITY_CLASS,
        "belownormal" => Native.BELOW_NORMAL_PRIORITY_CLASS,
        "normal" => Native.NORMAL_PRIORITY_CLASS,
        "abovenormal" => Native.ABOVE_NORMAL_PRIORITY_CLASS,
        "high" => Native.HIGH_PRIORITY_CLASS,
        "realtime" => Native.REALTIME_PRIORITY_CLASS,
        _ => Native.NORMAL_PRIORITY_CLASS
    };

    public static string PriorityName(uint pc) => pc switch
    {
        Native.IDLE_PRIORITY_CLASS => "Idle",
        Native.BELOW_NORMAL_PRIORITY_CLASS => "BelowNormal",
        Native.NORMAL_PRIORITY_CLASS => "Normal",
        Native.ABOVE_NORMAL_PRIORITY_CLASS => "AboveNormal",
        Native.HIGH_PRIORITY_CLASS => "High",
        Native.REALTIME_PRIORITY_CLASS => "RealTime",
        _ => $"0x{pc:X}"
    };
}

internal static class Defaults
{
    /// Touching these buys no frames and can cost you an account.
    public static readonly string[] AntiCheat =
    {
        "easyanticheat", "easyanticheat_eos", "eac_launcher", "eacbase",
        "beservice", "bedaisy", "battleye",
        "vgc", "vgtray", "riotclientservices",
        "ace-base", "ace-guard", "sgguard",
        "faceit", "esea", "anticheatexpert", "gameguard", "gamemon", "npggnt",
        "denuvo", "steamservice", "vanguard"
    };

    /// Freezing or starving these breaks the OS, your audio, or your security posture.
    public static readonly string[] CriticalSystem =
    {
        "system", "registry", "memory compression", "idle",
        "smss", "csrss", "wininit", "winlogon", "services", "lsass", "lsaiso",
        "svchost", "dwm", "audiodg", "fontdrvhost", "sihost", "ctfmon",
        "explorer", "conhost", "wudfhost", "spoolsv", "taskhostw",
        "msmpeng", "nissrv", "securityhealthservice", "windefend",
        "gameprio"
    };

    /// May be de-prioritised, must never be frozen or hard-capped:
    /// the game talks to them, or they hold your input/audio path.
    public static readonly string[] ThrottleOnly =
    {
        "steam", "steamwebhelper", "epicgameslauncher", "battle.net", "galaxyclient",
        "eadesktop", "eabackgroundservice", "ubisoftconnect", "upc",
        "discord", "nvcontainer", "nvdisplay.container", "radeonsoftware",
        "amddvr", "rtss", "msiafterburner", "obs64", "obs32"
    };
}
