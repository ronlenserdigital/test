using System.Diagnostics;
using Avalonia.Media.Imaging;

namespace GamePrio.App;

/// <summary>
/// A game's real logo is the icon inside its own executable. Shipping publishers' artwork
/// is not ours to do; reading the icon off the copy already installed on this machine is,
/// and it is more accurate anyway - it is literally the icon the game ships with.
///
/// Once seen, an icon is cached to disk, so a game keeps its logo after it closes.
/// </summary>
internal static class GameIcons
{
    private static readonly Dictionary<string, Bitmap> Cache = new(StringComparer.OrdinalIgnoreCase);

    private static string CacheDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "STRYKR", "icons");

    /// <summary>Icon for an executable name, or null if this machine has never seen it run.</summary>
    public static Bitmap For(string executable)
    {
        string key = (executable ?? "").ToLowerInvariant();
        if (key.Length == 0) return null;
        if (Cache.TryGetValue(key, out var cached)) return cached;

        var bitmap = LoadFromDisk(key) ?? ExtractFromRunningProcess(key);
        if (bitmap != null) Cache[key] = bitmap;
        return bitmap;
    }

    /// <summary>Called when a game is detected, so its icon is captured while it is running.</summary>
    public static void Capture(string executable)
    {
        try { For(executable); } catch { }
    }

    private static Bitmap LoadFromDisk(string key)
    {
        try
        {
            string path = Path.Combine(CacheDirectory, key + ".png");
            return File.Exists(path) ? new Bitmap(path) : null;
        }
        catch { return null; }
    }

    private static Bitmap ExtractFromRunningProcess(string key)
    {
        if (!OperatingSystem.IsWindows()) return null;

        foreach (var proc in Process.GetProcesses())
        {
            using (proc)
            {
                if (!string.Equals(proc.ProcessName, key, StringComparison.OrdinalIgnoreCase)) continue;

                try
                {
                    string file = proc.MainModule?.FileName;
                    if (string.IsNullOrEmpty(file)) continue;
                    return ExtractAndCache(key, file);
                }
                catch { /* a protected process will not hand over its module list */ }
            }
        }
        return null;
    }

    private static Bitmap ExtractAndCache(string key, string executablePath)
    {
        try
        {
#pragma warning disable CA1416 // guarded by OperatingSystem.IsWindows above
            using var icon = System.Drawing.Icon.ExtractAssociatedIcon(executablePath);
            if (icon == null) return null;

            Directory.CreateDirectory(CacheDirectory);
            string target = Path.Combine(CacheDirectory, key + ".png");

            using (var bitmap = icon.ToBitmap())
            using (var file = File.Create(target))
                bitmap.Save(file, System.Drawing.Imaging.ImageFormat.Png);
#pragma warning restore CA1416

            return new Bitmap(target);
        }
        catch { return null; }
    }
}
