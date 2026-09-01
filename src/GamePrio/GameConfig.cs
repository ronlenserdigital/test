namespace GamePrio;

/// <summary>
/// Game-side settings, which is where the largest single gains actually live: dropping the
/// two or three expensive settings in a title is worth more than every Windows tweak in
/// this program put together.
///
/// Strictly limited to values the game's own options menu already exposes. Epic banned
/// client modification in 2017 and only GameUserSettings.ini is meant to be edited; an FPS
/// gain is not worth an anti-cheat ban.
/// </summary>
internal static class GameConfig
{
    public sealed record Tweak(string Key, string Value, string Effect);

    private static string FortniteConfig => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "FortniteGame", "Saved", "Config", "WindowsClient", "GameUserSettings.ini");

    /// <summary>Every one of these is a setting you could pick by hand in Fortnite's own menu.</summary>
    private static readonly Tweak[] FortnitePerformance =
    {
        new("FrameRateLimit", "0.000000", "uncapped frame rate"),
        new("bMotionBlur", "False", "motion blur off"),
        new("sg.ResolutionQuality", "100.000000", "native render resolution"),
        new("sg.ViewDistanceQuality", "1", "reduced view distance"),
        new("sg.ShadowQuality", "0", "shadows off - one of the most expensive settings in any engine"),
        new("sg.PostProcessQuality", "0", "post-processing off"),
        new("sg.TextureQuality", "1", "lower textures"),
        new("sg.EffectsQuality", "0", "effects off"),
        new("sg.FoliageQuality", "0", "minimum foliage"),
        new("sg.ShadingQuality", "0", "minimum shading")
    };

    public static bool FortniteAvailable => File.Exists(FortniteConfig);

    /// <summary>
    /// Writes the competitive-performance values into Fortnite's own config, keeping a
    /// timestamped copy of the original beside it first.
    /// </summary>
    public static (bool Applied, string Message) ApplyFortnitePerformance()
    {
        string path = FortniteConfig;
        if (!File.Exists(path))
            return (false, "Fortnite config not found - run the game once so it writes GameUserSettings.ini");

        try
        {
            string backup = path + $".strykr-backup-{DateTime.Now:yyyyMMdd-HHmmss}";
            File.Copy(path, backup, overwrite: false);

            var lines = File.ReadAllLines(path).ToList();
            int changed = 0;

            foreach (var tweak in FortnitePerformance)
            {
                string line = $"{tweak.Key}={tweak.Value}";
                int index = lines.FindIndex(l =>
                    l.TrimStart().StartsWith(tweak.Key + "=", StringComparison.OrdinalIgnoreCase));

                if (index >= 0)
                {
                    if (lines[index].Trim() == line) continue;
                    lines[index] = line;
                }
                else
                {
                    int section = lines.FindIndex(l =>
                        l.Trim().StartsWith("[/Script/FortniteGame.FortGameUserSettings]", StringComparison.OrdinalIgnoreCase));
                    if (section < 0) lines.Add(line);
                    else lines.Insert(section + 1, line);
                }
                changed++;
            }

            File.WriteAllLines(path, lines);

            return (true, $"{changed} Fortnite setting(s) written; the original is beside it as " +
                          $"{Path.GetFileName(backup)}. Fortnite rewrites this file on exit, so re-apply " +
                          "if it reverts - and check the in-game menu reflects what you expect.");
        }
        catch (Exception ex) { return (false, $"could not write the Fortnite config: {ex.Message}"); }
    }

    public static string Describe() =>
        string.Join(Environment.NewLine,
            FortnitePerformance.Select(t => $"  {t.Key,-26} {t.Value,-14} {t.Effect}"));
}
