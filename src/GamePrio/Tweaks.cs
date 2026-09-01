using Microsoft.Win32;

namespace GamePrio;

/// <summary>
/// The audit's Fix buttons. Every one is journalled before it is made, and several need a
/// reboot - which is stated rather than hidden, because a tweak that silently does nothing
/// until next Tuesday is worse than no tweak.
///
/// Two findings are deliberately NOT actionable from here: turning off Memory Integrity
/// (VBS) and adding Defender exclusions. Both are reasonable choices on your own machine,
/// but an unsigned third-party binary that weakens kernel code integrity and writes
/// antivirus exclusions is indistinguishable from malware by behaviour - which is also how
/// it would look to anti-cheat. The audit explains both and points at the Windows UI
/// instead; the user makes the change, not this program.
/// </summary>
internal static class Tweaks
{
    public sealed record Result(bool Applied, string Message, bool NeedsReboot = false);

    public static Result Apply(string fixId, Profile profile)
    {
        var journal = Journal.Load() ?? new Journal { Profile = profile.Name, StartedUtc = DateTime.UtcNow };

        var result = fixId switch
        {
            "refresh" => SetRefreshRate(),
            "msi" => EnableMsi(journal),
            "mpo" => DisableMpo(journal),
            "netthrottle" => UnthrottleNetwork(journal),
            "gamemode" => EnableGameMode(journal),
            "fortnite" => ApplyFortnite(),
            _ => new Result(false, $"no such fix: {fixId}")
        };

        journal.Save();
        if (result.Applied) Log.Good(result.Message);
        else Log.Warn(result.Message);
        return result;
    }

    private static Result SetRefreshRate()
    {
        var (before, best) = Display.CurrentAndBestRefreshRate();
        if (best <= before) return new Result(false, $"already at the highest rate this mode offers ({before} Hz)");

        int now = Display.SetHighestRefreshRate();
        return now > before
            ? new Result(true, $"refresh rate {before} Hz -> {now} Hz")
            : new Result(false, $"Windows refused the mode change; still at {before} Hz");
    }

    private static Result EnableMsi(Journal journal)
    {
        string instance = Display.PrimaryGpuInstanceId();
        if (instance == null) return new Result(false, "could not identify the display adapter");

        return Display.EnableMsiMode(instance, journal)
            ? new Result(true, "message-signalled interrupts enabled for the GPU - REBOOT to take effect", true)
            : new Result(false, "could not write the interrupt key");
    }

    private static Result DisableMpo(Journal journal) =>
        SetDword(journal, @"SOFTWARE\Microsoft\Windows\Dwm", "OverlayTestMode", 5, reboot: true)
            ? new Result(true, "multi-plane overlay disabled - REBOOT to take effect. " +
                               "Undocumented, and unreliable on 24H2 and later; if it changes nothing, restore it.", true)
            : new Result(false, "could not write the DWM key");

    private static Result UnthrottleNetwork(Journal journal) =>
        SetDword(journal, @"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile",
                 "NetworkThrottlingIndex", unchecked((int)0xFFFFFFFF), reboot: true)
            ? new Result(true, "network throttling index removed - REBOOT to take effect. Marginal, and honest about it.", true)
            : new Result(false, "could not write the multimedia profile key");

    private static Result EnableGameMode(Journal journal) =>
        SetDword(journal, @"Software\Microsoft\GameBar", "AllowAutoGameMode", 1, reboot: false, hkcu: true)
            ? new Result(true, "Windows Game Mode enabled")
            : new Result(false, "could not write the Game Bar key");

    private static Result ApplyFortnite()
    {
        var (applied, message) = GameConfig.ApplyFortnitePerformance();
        return new Result(applied, message);
    }

    private static bool SetDword(Journal journal, string key, string name, int value, bool reboot, bool hkcu = false)
    {
        try
        {
            RegistryKey hive = hkcu ? Registry.CurrentUser : Registry.LocalMachine;
            using var k = hive.CreateSubKey(key, writable: true);
            if (k == null) return false;

            object existing = k.GetValue(name);
            journal.Registry.Add(new Journal.RegEntry
            {
                Hive = hkcu ? "HKCU" : "HKLM",
                Key = key,
                Name = name,
                Existed = existing != null,
                Kind = "DWord",
                PreviousValue = existing?.ToString(),
                NeedsReboot = reboot
            });
            journal.Save();

            k.SetValue(name, value, RegistryValueKind.DWord);
            return true;
        }
        catch (Exception ex) { Log.Warn($"{key}\\{name}: {ex.Message}"); return false; }
    }
}
