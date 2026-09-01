using System.Diagnostics;

namespace GamePrio;

public sealed record Detection(int Pid, string ProcessName, string Reason, GameEntry Catalog)
{
    public string Display => Catalog?.Name ?? ProcessName;
}

/// <summary>
/// Works out what you are playing without being told. Two tiers, most trustworthy first:
/// a running process from the shipped catalog, then a foreground window that fills a
/// monitor and belongs to something that is plainly not a desktop app.
/// </summary>
public static class GameDetector
{
    /// <summary>Fills this much of the monitor and it is a game, not a window.</summary>
    private const double FullscreenCoverage = 0.90;

    /// <summary>
    /// Things that go fullscreen but are not the game. Launchers sit here too: they are
    /// running whenever the game is, and picking one would target the wrong process.
    /// </summary>
    private static readonly HashSet<string> NotGames = new(StringComparer.OrdinalIgnoreCase)
    {
        "explorer", "strykr", "gameprio", "uicheck", "applicationframehost", "shellexperiencehost",
        "searchhost", "startmenuexperiencehost", "textinputhost", "systemsettings", "taskmgr",
        "chrome", "msedge", "firefox", "brave", "opera", "opera_gx", "vivaldi",
        "discord", "slack", "teams", "zoom", "spotify", "obs64", "obs32",
        "steam", "steamwebhelper", "epicgameslauncher", "battle.net", "galaxyclient",
        "eadesktop", "ubisoftconnect", "upc", "riotclientux", "rockstarservice", "playnite",
        "code", "devenv", "rider64", "idea64", "notepad", "notepad++", "windowsterminal",
        "photoshop", "illustrator", "vlc", "mpc-hc64", "powerpnt", "winword", "excel"
    };

    /// <summary>Catalog hit if there is one, otherwise a fullscreen guess, otherwise null.</summary>
    public static Detection Detect(IEnumerable<string> preferred = null)
    {
        var wanted = new HashSet<string>(
            (preferred ?? Enumerable.Empty<string>()).Select(x => x.ToLowerInvariant()));

        Detection catalogHit = null;

        foreach (var proc in Process.GetProcesses())
        {
            using (proc)
            {
                string key = proc.ProcessName.ToLowerInvariant();

                // Anything the user actually ticked outranks everything else.
                if (wanted.Contains(key))
                    return new Detection(proc.Id, proc.ProcessName, "selected in the library",
                                         GameCatalog.FindByExecutable(key));

                if (catalogHit != null) continue;
                var entry = GameCatalog.FindByExecutable(key);
                if (entry != null)
                    catalogHit = new Detection(proc.Id, proc.ProcessName, "known game", entry);
            }
        }

        return catalogHit ?? DetectFullscreen();
    }

    /// <summary>A foreground window covering its monitor, owned by something that is not a desktop app.</summary>
    private static Detection DetectFullscreen()
    {
        try
        {
            IntPtr window = Native.GetForegroundWindow();
            if (window == IntPtr.Zero) return null;

            Native.GetWindowThreadProcessId(window, out uint pid);
            if (pid == 0) return null;

            if (!Native.GetWindowRect(window, out Native.RECT rect)) return null;

            IntPtr monitor = Native.MonitorFromWindow(window, Native.MONITOR_DEFAULTTONEAREST);
            var info = new Native.MONITORINFO { cbSize = (uint)System.Runtime.InteropServices.Marshal.SizeOf<Native.MONITORINFO>() };
            if (!Native.GetMonitorInfoW(monitor, ref info)) return null;

            double windowArea = (double)(rect.Right - rect.Left) * (rect.Bottom - rect.Top);
            double monitorArea = (double)(info.rcMonitor.Right - info.rcMonitor.Left)
                               * (info.rcMonitor.Bottom - info.rcMonitor.Top);
            if (monitorArea <= 0 || windowArea / monitorArea < FullscreenCoverage) return null;

            using var proc = Process.GetProcessById((int)pid);
            if (proc.Id == Environment.ProcessId) return null;
            if (IsNotAGame(proc.ProcessName)) return null;

            try { if (proc.SessionId == 0) return null; } catch { return null; }

            return new Detection(proc.Id, proc.ProcessName, "fullscreen window", null);
        }
        catch { return null; }
    }

    public static bool IsNotAGame(string processName)
    {
        string key = (processName ?? "").ToLowerInvariant();
        if (key.EndsWith(".exe")) key = key[..^4];
        if (NotGames.Contains(key)) return true;
        return Defaults.CriticalSystem.Contains(key) || Defaults.AntiCheat.Contains(key);
    }
}
