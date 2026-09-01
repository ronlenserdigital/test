using Avalonia;
using Avalonia.Controls;
using Avalonia.Headless;
using GamePrio.App;

namespace GamePrio.UiCheck;

internal static class Program
{
    private static int _failed;

    private static void Check(string name, bool ok, string detail = "")
    {
        Console.WriteLine($"  [{(ok ? "PASS" : "FAIL")}] {name}{(detail == "" ? "" : "  -> " + detail)}");
        if (!ok) _failed++;
    }

    private static int Main()
    {
        Console.WriteLine("Application");
        try
        {
            AppBuilder.Configure<GameprioApp>()
                .UseHeadless(new AvaloniaHeadlessPlatformOptions())
                .SetupWithoutStarting();
            Check("App.axaml loads (theme, palette, styles)", true);
        }
        catch (Exception ex)
        {
            Check("App.axaml loads", false, $"{ex.GetType().Name}: {Flatten(ex)}");
            return 1;
        }

        Console.WriteLine("\nMainWindow");
        MainWindow window = null;
        try
        {
            window = new MainWindow();
            Check("MainWindow.axaml loads and constructs", true);
        }
        catch (Exception ex)
        {
            Check("MainWindow.axaml loads and constructs", false, $"{ex.GetType().Name}: {Flatten(ex)}");
            return 1;
        }

        // Win32 steps cannot work on this platform; anything else failing is a real bug.
        var platform = new[] { "read status", "read power plan", "enable privileges", "load profile",
                               "recover stale journal" };
        foreach (var failure in window.StartupFailures)
        {
            bool expected = platform.Any(p => failure.StartsWith(p, StringComparison.Ordinal));
            Check($"startup step: {failure[..Math.Min(40, failure.Length)]}", expected,
                  expected ? "expected off-Windows" : "UNEXPECTED -> " + failure);
        }
        if (window.StartupFailures.Count == 0) Check("no startup step failed", true);

        Console.WriteLine("\nControls the code drives by name");
        string[] required =
        {
            "GameList", "SearchBox", "CustomExeBox", "SelectedCount", "ExecCount",
            "TabControlBtn", "TabSettingsBtn", "TabActivityBtn",
            "PanelControl", "PanelSettings", "PanelPerf", "PanelAudit", "PanelActivity",
            "TabAuditBtn", "AuditButton", "AuditSummary", "AuditList", "TabPerfBtn",
            "PerfButton", "PerfState", "PerfFps", "PerfLow", "PerfFrameTime", "PerfStutter", "PerfFpsNote",
            "PerfPing", "PerfJitter", "PerfLoss", "PerfTarget", "PerfPingGraph",
            "PerfCpuBar", "PerfCpuText", "PerfGpuBar", "PerfGpuText", "PerfRamBar", "PerfRamText",
            "PerfNet", "PerfAdapter", "RingGraph", "AddGameNote", "AddGameButton",
            "GovernanceCard", "GovernanceHeadline", "GovernanceDetail", "GovernanceTop",
            "HeroGameName", "HeroStatus", "HeroDot", "HeroProgress", "WatchButton",
            "AntiCheatBanner", "AntiCheatText", "SafeMode",
            "StatusState", "StatusGame", "StatusCpu", "StatusTimer", "StatusJournal", "StatusPower",
            "RingText", "StatePill", "StateText", "StateGlyph",
            "ApplyButton", "RestoreButton", "ViewActivityButton", "VerifyButton",
            "BenchSeconds", "BenchRuns", "BenchButton", "HudButton",
            "ModeSimpleBtn", "ModeAdvancedBtn", "SimplePanel", "AdvancedPanel",
            "SimpleQuiet", "SimpleFullSpeed", "SimpleNoRecording", "SimpleNetwork", "SimpleFreeze", "SimpleSafe",
            "PresetLight", "PresetBalanced", "PresetMax", "PresetSummary",
            "GamePriority", "GamePCore", "GameNoThrottle", "GameIgnoreTimer", "RealtimeWarning",
            "BackgroundPriority", "BgEco", "BgECore", "BgSuspend", "BgCpuCap",
            "SysPower", "SysParking", "SysTimer", "SysMmcss", "SysGameDvr",
            "NetAdapter", "NetDscp", "NetThrottle",
            "LogBox", "LogPathText", "LibraryPanel", "LibraryToggle", "LibraryToggleText", "AutoDetect",
            "FooterProfile", "FooterCpuSet", "FooterCpus", "FooterTimer", "FooterPower", "ExportButton"
        };
        var missing = required.Where(n => window.FindControl<Control>(n) == null).ToList();
        Check($"all {required.Length} named controls resolve", missing.Count == 0,
              missing.Count == 0 ? "" : "missing: " + string.Join(", ", missing));

        Console.WriteLine("\nGame library");
        var list = window.FindControl<StackPanel>("GameList");
        int rows = list?.Children.Count ?? 0;
        Check("library populated", rows >= GameCatalog.All.Length,
              $"{rows} rows for {GameCatalog.All.Length} games plus headers");

        Console.WriteLine("\nInteraction (handlers actually fire)");
        void Click(string name) =>
            window.FindControl<Button>(name)?.RaiseEvent(new Avalonia.Interactivity.RoutedEventArgs(Button.ClickEvent));
        bool Visible(string name) => window.FindControl<Control>(name)?.IsVisible == true;

        try
        {
            Click("TabSettingsBtn");
            Check("SETTINGS tab switches", Visible("PanelSettings") && !Visible("PanelControl"));

            Click("ModeAdvancedBtn");
            Check("Advanced panel shows", Visible("AdvancedPanel") && !Visible("SimplePanel"));

            Click("ModeSimpleBtn");
            Check("Simple panel shows", Visible("SimplePanel") && !Visible("AdvancedPanel"));

            Click("TabPerfBtn");
            Check("PC PERFORMANCE tab switches", Visible("PanelPerf") && !Visible("PanelSettings"));

            Click("TabAuditBtn");
            Check("AUDIT tab switches", Visible("PanelAudit") && !Visible("PanelPerf"));

            Click("TabActivityBtn");
            Check("ACTIVITY tab switches", Visible("PanelActivity") && !Visible("PanelAudit"));

            Click("ViewActivityButton");
            Check("View activity reaches the log", Visible("PanelActivity"));

            Click("TabControlBtn");
            Check("CONTROL tab switches back", Visible("PanelControl") && !Visible("PanelActivity"));

            var tab = window.FindControl<Button>("TabControlBtn");
            Check("active tab carries the underline class", tab != null && tab.Classes.Contains("on"));

            Check("library is open on launch", Visible("LibraryPanel"));
            var toggle = window.FindControl<Button>("LibraryToggle");
            Click("LibraryToggle");
            Check("controller button closes the library", !Visible("LibraryPanel"));
            Click("LibraryToggle");
            Check("controller button opens it again", Visible("LibraryPanel"));

            // A name that is not running must be refused, not silently accepted.
            var beforeRows = window.FindControl<StackPanel>("GameList").Children.Count;
            window.FindControl<TextBox>("CustomExeBox").Text = "definitelynotrunning";
            Click("AddGameButton");
            Check("a game that is not running is refused",
                  window.FindControl<StackPanel>("GameList").Children.Count == beforeRows);
            Check("and it says why",
                  (window.FindControl<TextBlock>("AddGameNote")?.Text ?? "").Contains("not running"),
                  window.FindControl<TextBlock>("AddGameNote")?.Text);

            // A preset must not throw even with no engine behind it.
            Click("ModeSimpleBtn");
            var presets = window.FindControl<StackPanel>("SimplePanel");
            Check("simple panel populated", presets != null && presets.Children.Count >= 3);

            // PICK A LEVEL: the presets must actually move the switches under them.
            bool Checked(string n) => window.FindControl<CheckBox>(n)?.IsChecked == true;

            Click("PresetMax");
            Check("Maximum ticks freezing", Checked("SimpleFreeze"),
                  $"quiet={Checked("SimpleQuiet")} power={Checked("SimpleFullSpeed")} net={Checked("SimpleNetwork")} freeze={Checked("SimpleFreeze")}");
            Check("Maximum ticks everything else",
                  Checked("SimpleQuiet") && Checked("SimpleFullSpeed") && Checked("SimpleNetwork"));

            Click("PresetLight");
            Check("Light touch unticks freezing", !Checked("SimpleFreeze"));
            Check("Light touch unticks power and network",
                  !Checked("SimpleFullSpeed") && !Checked("SimpleNetwork"),
                  $"power={Checked("SimpleFullSpeed")} net={Checked("SimpleNetwork")}");
            Check("Light touch keeps background quieting", Checked("SimpleQuiet"));

            Click("PresetBalanced");
            Check("Balanced ticks power and network",
                  Checked("SimpleFullSpeed") && Checked("SimpleNetwork"));
            Check("Balanced leaves freezing off", !Checked("SimpleFreeze"));

            var lightBtn = window.FindControl<Button>("PresetLight");
            var balancedBtn = window.FindControl<Button>("PresetBalanced");
            var maxBtn = window.FindControl<Button>("PresetMax");
            Check("the active preset is visibly marked",
                  balancedBtn != null && balancedBtn.Classes.Contains("danger"));
            Check("the other presets are not marked",
                  lightBtn != null && !lightBtn.Classes.Contains("danger")
                  && maxBtn != null && !maxBtn.Classes.Contains("danger"));

            string summary = window.FindControl<TextBlock>("PresetSummary")?.Text ?? "";
            Check("the click reports what it changed", summary.StartsWith("Balanced:"), summary);

            Click("PresetMax");
            Check("marking follows the newly chosen level",
                  maxBtn.Classes.Contains("danger") && !balancedBtn.Classes.Contains("danger"));
            Check("summary follows too",
                  (window.FindControl<TextBlock>("PresetSummary")?.Text ?? "").Contains("freezing ON"));

            // Flipping a switch by hand should drop the preset marking.
            var freeze = window.FindControl<CheckBox>("SimpleFreeze");
            freeze.IsChecked = false;
            freeze.RaiseEvent(new Avalonia.Interactivity.RoutedEventArgs(Button.ClickEvent));
            Check("hand-editing a switch clears the preset marking",
                  !maxBtn.Classes.Contains("danger"),
                  "otherwise it claims Maximum while no longer being Maximum");
        }
        catch (Exception ex)
        {
            Check("interaction", false, $"{ex.GetType().Name}: {Flatten(ex)}");
        }

        Console.WriteLine("\nHudWindow");
        try
        {
            var hud = new HudWindow(new LiveMonitor());
            Check("HudWindow.axaml loads and constructs", true);
            Check("HUD fields resolve",
                new[] { "FpsText", "FrameTimeText", "LowText", "StutterText", "SystemText", "NoteText" }
                    .All(n => hud.FindControl<Avalonia.Controls.TextBlock>(n) != null));
        }
        catch (Exception ex)
        {
            Check("HudWindow.axaml loads and constructs", false, $"{ex.GetType().Name}: {Flatten(ex)}");
        }

        Console.WriteLine(_failed == 0 ? "\nUI OK" : $"\n{_failed} UI CHECK(S) FAILED");
        return _failed == 0 ? 0 : 1;
    }

    private static string Flatten(Exception ex)
    {
        var parts = new List<string>();
        for (var e = ex; e != null; e = e.InnerException) parts.Add(e.Message);
        return string.Join("  <-  ", parts);
    }
}
