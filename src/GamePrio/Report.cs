using System.Text;

namespace GamePrio;

/// <summary>
/// Everything a session did, in one file you can keep or post: the machine, the profile,
/// and a full verify pass read back out of Windows.
/// </summary>
internal static class Report
{
    public static string Export(Profile profile, Governor governor, string directory = null)
    {
        directory ??= Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
        if (string.IsNullOrEmpty(directory)) directory = AppContext.BaseDirectory;

        string path = Path.Combine(directory, $"strykr-report-{DateTime.Now:yyyyMMdd-HHmmss}.txt");

        var captured = new List<string>();
        void Sink(string level, string message) => captured.Add($"{level,-4}  {message}");

        Log.Emitted += Sink;
        try { Verify.Run(profile, governor); }
        catch (Exception ex) { captured.Add($"FAIL  verify threw: {ex.Message}"); }
        finally { Log.Emitted -= Sink; }

        var sb = new StringBuilder();
        sb.AppendLine("STRYKR report");
        sb.AppendLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
        sb.AppendLine();

        sb.AppendLine("MACHINE");
        sb.AppendLine($"  os                 {Environment.OSVersion.VersionString}");
        sb.AppendLine($"  logical cpus       {Environment.ProcessorCount}");
        sb.AppendLine($"  hybrid             {governor.IsHybrid}");
        sb.AppendLine($"  p-core mask        0x{governor.PCoreMask:X}");
        sb.AppendLine($"  e-core mask        0x{governor.ECoreMask:X}");
        sb.AppendLine();

        sb.AppendLine("PROFILE");
        sb.AppendLine($"  name               {profile.Name}");
        sb.AppendLine($"  games              {string.Join(", ", profile.Game.Executables)}");
        sb.AppendLine($"  game priority      {profile.Game.Priority}");
        sb.AppendLine($"  game p-core only   {profile.Game.PCoreOnly}");
        sb.AppendLine($"  background         {profile.Background.Priority}, " +
                      $"ecoqos {profile.Background.EcoQoS}, e-core {profile.Background.ECoreOnly}, " +
                      $"suspend {profile.Background.Suspend}, cap {profile.Background.CpuCapPercent}%");
        sb.AppendLine($"  power plan         {profile.System.UltimatePerformancePowerPlan}");
        sb.AppendLine($"  timer resolution   {profile.System.TimerResolutionMs} ms");
        sb.AppendLine($"  mmcss / gamedvr    {profile.System.MmcssGamesTuning} / {profile.System.DisableGameDvr}");
        sb.AppendLine($"  network            adapter '{profile.Network.PreferredInterfaceAlias}', " +
                      $"dscp {profile.Network.Dscp}, uploader cap {profile.Network.ThrottleBulkUploaders}");
        sb.AppendLine($"  anti-cheat safe    {profile.Safety.AntiCheatSafeMode}");
        sb.AppendLine();

        sb.AppendLine("VERIFY (read back from Windows, not from the journal)");
        foreach (var line in captured) sb.AppendLine("  " + line);
        sb.AppendLine();

        sb.AppendLine("NOTE");
        sb.AppendLine("  Verify proves the settings landed. It does not prove they bought you frames -");
        sb.AppendLine("  only the A/B benchmark can say that, and on a healthy machine it often reports");
        sb.AppendLine("  no measurable change to average FPS. Watch the 1% lows.");

        File.WriteAllText(path, sb.ToString());
        Log.Good($"report written to {path}");
        return path;
    }
}
