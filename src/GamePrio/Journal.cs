using System.Text.Json;
using System.Text.Json.Serialization;

namespace GamePrio;

/// <summary>
/// Every mutation is written here BEFORE it is applied, so a crash, a reboot or a
/// killed console still leaves an exact recipe for putting the machine back.
/// Replayed automatically on the next start.
/// </summary>
public sealed class Journal
{
    public static string Path =>
        System.IO.Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "GamePrio", "journal.json");

    public string Profile { get; set; } = "";
    public DateTime StartedUtc { get; set; } = DateTime.UtcNow;
    public List<ProcEntry> Processes { get; set; } = new();
    public List<RegEntry> Registry { get; set; } = new();
    public List<string> ServicesStopped { get; set; } = new();
    public string PreviousPowerScheme { get; set; }
    public NetEntry Network { get; set; }
    public bool TimerResolutionRaised { get; set; }

    public sealed class ProcEntry
    {
        public int Pid { get; set; }
        public string Name { get; set; }
        public long StartTicks { get; set; }
        public uint PreviousPriority { get; set; }
        public ulong PreviousAffinity { get; set; }
        public bool Suspended { get; set; }
        public bool PowerThrottlingChanged { get; set; }
        public bool CpuCapped { get; set; }
        public string JobName { get; set; }
    }

    public sealed class RegEntry
    {
        public string Hive { get; set; }        // HKLM | HKCU
        public string Key { get; set; }
        public string Name { get; set; }
        public bool Existed { get; set; }
        public string Kind { get; set; }        // DWord | String
        public string PreviousValue { get; set; }
        public bool NeedsReboot { get; set; }
    }

    public sealed class NetEntry
    {
        public int InterfaceIndex { get; set; }
        public string InterfaceAlias { get; set; }
        public uint PreviousMetric { get; set; }
        public bool PreviousMetricWasAutomatic { get; set; }
        public List<string> QosPolicies { get; set; } = new();
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public void Save()
    {
        Directory.CreateDirectory(System.IO.Path.GetDirectoryName(Path)!);
        // Write-then-rename so a power cut can never leave a half-written journal.
        string tmp = Path + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(this, JsonOpts));
        File.Move(tmp, Path, overwrite: true);
    }

    public static Journal Load()
    {
        try
        {
            if (!File.Exists(Path)) return null;
            return JsonSerializer.Deserialize<Journal>(File.ReadAllText(Path), JsonOpts);
        }
        catch (Exception ex)
        {
            Log.Warn($"journal unreadable ({ex.Message}) - moving it aside");
            try { File.Move(Path, Path + ".corrupt", overwrite: true); } catch { }
            return null;
        }
    }

    public static void Clear()
    {
        try { if (File.Exists(Path)) File.Delete(Path); } catch { }
    }
}
