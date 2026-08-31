using System.Reflection;

namespace GamePrio;

/// <summary>
/// Frame timing is the one number this tool cannot synthesise, and asking a user to go
/// and find a second executable is a bad first run. PresentMon (Intel, MIT) is embedded
/// and unpacked on demand, with its licence written alongside it.
/// </summary>
public static class PresentMonTool
{
    private const string ExeResource = "GamePrio.Tools.PresentMon.exe";
    private const string LicenceResource = "GamePrio.Tools.PresentMon-LICENSE.txt";

    public static string ToolDirectory => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "STRYKR", "tools");

    /// <summary>
    /// Returns a usable PresentMon path: whatever the user configured or already has,
    /// otherwise the bundled copy, unpacked once.
    /// </summary>
    public static string EnsureAvailable(string configured)
    {
        string found = FindExisting(configured);
        if (found != null) return found;

        try
        {
            Directory.CreateDirectory(ToolDirectory);
            string target = Path.Combine(ToolDirectory, "PresentMon.exe");

            long embedded = ResourceLength(ExeResource);
            var existing = new FileInfo(target);
            if (!existing.Exists || (embedded > 0 && existing.Length != embedded))
            {
                Extract(ExeResource, target);
                Extract(LicenceResource, Path.Combine(ToolDirectory, "PresentMon-LICENSE.txt"));
                Log.Dim($"unpacked the bundled PresentMon to {target}");
            }

            return File.Exists(target) ? target : configured;
        }
        catch (Exception ex)
        {
            Log.Warn($"could not unpack the bundled PresentMon: {ex.Message}");
            return configured;
        }
    }

    /// <summary>Anything the user already has wins over the copy we ship.</summary>
    private static string FindExisting(string configured)
    {
        var candidates = new List<string>();

        // An explicit path in the profile only counts if it actually points at a file;
        // the default is the bare name "PresentMon.exe", which must not win here.
        if (!string.IsNullOrWhiteSpace(configured) &&
            (configured.Contains(Path.DirectorySeparatorChar) || configured.Contains('/')))
            candidates.Add(configured);

        foreach (var dir in new[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory(), ToolDirectory })
            if (!string.IsNullOrEmpty(dir))
                candidates.Add(Path.Combine(dir, "PresentMon.exe"));

        foreach (var root in new[]
                 {
                     Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                     Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86)
                 })
        {
            if (string.IsNullOrEmpty(root)) continue;
            candidates.Add(Path.Combine(root, "Intel", "PresentMon", "PresentMon.exe"));
            candidates.Add(Path.Combine(root, "PresentMon", "PresentMon.exe"));
        }

        foreach (var candidate in candidates)
        {
            try { if (File.Exists(candidate)) return candidate; } catch { }
        }
        return null;
    }

    private static long ResourceLength(string name)
    {
        using var stream = typeof(PresentMonTool).Assembly.GetManifestResourceStream(name);
        return stream?.Length ?? 0;
    }

    private static void Extract(string name, string target)
    {
        using var stream = typeof(PresentMonTool).Assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException($"embedded resource missing: {name}");

        // Write to a temp name then move, so a half-written exe is never left behind.
        string temp = target + ".tmp";
        using (var file = File.Create(temp)) stream.CopyTo(file);
        File.Move(temp, target, overwrite: true);
    }

    /// <summary>True when this build actually carries the tool.</summary>
    public static bool IsBundled => ResourceLength(ExeResource) > 0;
}
