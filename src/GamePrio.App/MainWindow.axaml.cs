using System.Security.Principal;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Shapes;
using Path = Avalonia.Controls.Shapes.Path;
using IOPath = System.IO.Path;
using Avalonia.Input;
using Avalonia.Interactivity;
using Avalonia.Layout;
using Avalonia.Markup.Xaml;
using Avalonia.Media;
using Avalonia.Threading;
using Avalonia.VisualTree;

namespace GamePrio.App;

public partial class MainWindow : Window
{
    private readonly Dictionary<GameEntry, CheckBox> _gameChecks = new();
    private readonly Dictionary<GameEntry, Border> _gameRows = new();
    private readonly List<(string Exe, CheckBox Box, Border Row)> _customRows = new();
    private readonly List<TextBlock> _groupHeaders = new();

    private Engine _engine;
    private LiveMonitor _monitor;
    private SystemMonitor _system;
    private LiveStats _lastFrameStats;
    private readonly List<double> _ringHistory = new();
    private HudWindow _hud;
    private string _profilePath;
    private string _powerPlan = "-";
    private bool _loading;
    private bool _onlySelected;

    public MainWindow()
    {
        // The XAML has to load; if it cannot, there is no window to report anything in
        // and Program.Main's handler turns it into a message box instead of silence.
        AvaloniaXamlLoader.Load(this);

        // Everything past this point is guarded individually. One failing step - a Win32
        // call, an unreadable profile, a denied privilege - must never cost the whole
        // window, because a WinExe that throws in its constructor just vanishes.
        Step("build game list", BuildGameList);

        Step("load profile", () =>
        {
            _profilePath = ResolveProfilePath();
            var profile = LoadOrCreateProfile(_profilePath);
            _engine = new Engine(profile);
            _engine.Changed += () => Dispatcher.UIThread.Post(RefreshStatus);
            _engine.UnknownGameDetected += found => Dispatcher.UIThread.Post(() => OnAutoDetected(found));
            LoadProfileIntoControls(profile);
        });

        Step("attach log", () =>
        {
            Log.Emitted += (level, message) => Dispatcher.UIThread.Post(() => AppendLog(level, message));
            SetText("LogPathText", IOPath.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "GamePrio"));
        });

        // SeDebugPrivilege is requested by Governor.Apply only when safe mode is off.
        Step("enable privileges", () =>
        {
            Native.EnablePrivilege("SeIncreaseBasePriorityPrivilege");
            Native.EnablePrivilege("SeIncreaseQuotaPrivilege");
        });

        Step("read status", RefreshStatus);
        Step("start telemetry", StartSystemMonitor);
        Step("read power plan", RefreshPowerPlanAsync);

        Log.Info("STRYKR ready");
        if (!IsElevated())
            Log.Error("not elevated - relaunch as administrator or nothing here can touch another process");

        Step("recover stale journal", () => Task.Run(() => _engine?.RecoverStaleState()));
        Closing += OnClosing;
    }

    /// <summary>Runs one startup step; a failure is reported in the window, not fatal to it.</summary>
    private void Step(string what, Action action)
    {
        try { action(); }
        catch (Exception ex)
        {
            _startupFailures.Add($"{what}: {ex.GetType().Name} {ex.Message}");
            try { Log.Error($"startup step failed - {what}: {ex.Message}"); } catch { }
        }
    }

    private readonly List<string> _startupFailures = new();

    /// <summary>Startup problems, for the smoke test and for support.</summary>
    public IReadOnlyList<string> StartupFailures => _startupFailures;

    // ------------------------------------------------------------ chrome

    private void OnTitleBarPressed(object sender, PointerPressedEventArgs e)
    {
        // The strip carries the library button and the wordmark; a press on a button must
        // press it, not start dragging the window.
        if (e.Source is Visual visual && visual.GetSelfAndVisualAncestors().OfType<Button>().Any()) return;
        if (e.GetCurrentPoint(this).Properties.IsLeftButtonPressed) BeginMoveDrag(e);
    }

    /// <summary>The library is closed by default: with auto-detect on, most sessions never need it.</summary>
    private void OnLibraryToggle(object sender, RoutedEventArgs e)
    {
        var panel = Ctl<Border>("LibraryPanel");
        if (panel == null) return;

        panel.IsVisible = !panel.IsVisible;
        Style("LibraryToggle", panel.IsVisible ? "primary" : "icon");
        UpdateLibraryBadge();
    }

    private void UpdateLibraryBadge()
    {
        int titles = _gameChecks.Count(kv => kv.Value.IsChecked == true)
                     + _customRows.Count(c => c.Box.IsChecked == true);
        SetText("LibraryToggleText", titles == 0 ? "AUTO" : titles.ToString());

        var text = Ctl<TextBlock>("LibraryToggleText");
        if (text != null)
            text.Foreground = new SolidColorBrush(Color.Parse(titles == 0 ? "#7E7F8A" : "#E01F2D"));
    }

    // ------------------------------------------------------------- tabs

    private void OnTabControl(object sender, RoutedEventArgs e) => SetTab(0);
    private void OnTabSettings(object sender, RoutedEventArgs e) => SetTab(1);
    private void OnTabPerf(object sender, RoutedEventArgs e) => SetTab(2);
    private void OnTabAudit(object sender, RoutedEventArgs e) => SetTab(3);
    private void OnTabActivity(object sender, RoutedEventArgs e) => SetTab(4);

    private void SetTab(int index)
    {
        SetVisible("PanelControl", index == 0);
        SetVisible("PanelSettings", index == 1);
        SetVisible("PanelPerf", index == 2);
        SetVisible("PanelAudit", index == 3);
        SetVisible("PanelActivity", index == 4);

        SetTabState("TabControlBtn", index == 0);
        SetTabState("TabSettingsBtn", index == 1);
        SetTabState("TabPerfBtn", index == 2);
        SetTabState("TabAuditBtn", index == 3);
        SetTabState("TabActivityBtn", index == 4);
    }

    private void SetTabState(string name, bool on)
    {
        var button = Ctl<Button>(name);
        if (button == null) return;
        if (on) { if (!button.Classes.Contains("on")) button.Classes.Add("on"); }
        else button.Classes.Remove("on");
    }

    // -------------------------------------------------------- game list

    private void BuildGameList()
    {
        var list = Ctl<StackPanel>("GameList");
        if (list == null) return;
        list.Children.Clear();
        _gameChecks.Clear();
        _gameRows.Clear();
        _groupHeaders.Clear();

        foreach (var group in GameCatalog.All.GroupBy(g => g.AntiCheat).OrderByDescending(g => g.Key))
        {
            var header = new TextBlock
            {
                Text = group.Key switch
                {
                    AntiCheat.Kernel => "KERNEL ANTI-CHEAT",
                    AntiCheat.UserMode => "USER-MODE ANTI-CHEAT",
                    _ => "NO ANTI-CHEAT"
                },
                FontSize = 10,
                FontWeight = FontWeight.Bold,
                LetterSpacing = 1.2,
                Foreground = new SolidColorBrush(group.Key switch
                {
                    AntiCheat.Kernel => Color.Parse("#FF4A54"),
                    AntiCheat.UserMode => Color.Parse("#D9B45C"),
                    _ => Color.Parse("#5FBF8F")
                }),
                Margin = new Thickness(4, 14, 0, 6)
            };
            _groupHeaders.Add(header);
            list.Children.Add(header);

            foreach (var game in group.OrderBy(g => g.Name))
            {
                var box = new CheckBox { Tag = game, VerticalAlignment = VerticalAlignment.Center };
                box.IsCheckedChanged += OnGameToggled;

                var row = BuildRow(box, Initials(game.Name), TileColour(game.Name), game.Name, game.Primary);
                ToolTip.SetTip(row, $"{game.Primary}.exe   -   anti-cheat: {game.AntiCheatName}");

                _gameChecks[game] = box;
                _gameRows[game] = row;
                list.Children.Add(row);
            }
        }
    }

    private Border BuildRow(CheckBox box, string initials, Color colour, string label, string executable = null)
    {
        // A game's true logo is the icon in its own executable - read from the copy already
        // installed here rather than shipping publishers' artwork, and cached once seen.
        var icon = executable == null ? null : GameIcons.For(executable);

        var tile = new Border
        {
            Width = 24,
            Height = 24,
            CornerRadius = new CornerRadius(5),
            Background = icon != null ? Brushes.Transparent : new SolidColorBrush(colour, 0.22),
            BorderBrush = icon != null ? Brushes.Transparent : new SolidColorBrush(colour, 0.55),
            BorderThickness = new Thickness(1),
            Child = icon != null
                ? new Image { Source = icon, Width = 22, Height = 22 }
                : new TextBlock
                {
                    Text = initials,
                    FontSize = 9,
                    FontWeight = FontWeight.Bold,
                    Foreground = new SolidColorBrush(colour),
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center
                }
        };

        var content = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 12 };
        content.Children.Add(box);
        content.Children.Add(tile);
        content.Children.Add(new TextBlock
        {
            Text = label,
            FontSize = 12.5,
            Foreground = new SolidColorBrush(Color.Parse("#C9CAD2")),
            VerticalAlignment = VerticalAlignment.Center
        });

        var row = new Border
        {
            Padding = new Thickness(10, 7),
            CornerRadius = new CornerRadius(8),
            Background = Brushes.Transparent,
            BorderThickness = new Thickness(2, 0, 0, 0),
            BorderBrush = Brushes.Transparent,
            Child = content
        };

        // Clicking anywhere on the row toggles it, not just the 14px checkbox.
        row.PointerPressed += (_, e) =>
        {
            if (e.Source is CheckBox) return;
            box.IsChecked = box.IsChecked != true;
        };
        return row;
    }

    private void PaintRow(Border row, bool selected)
    {
        row.Background = selected
            ? new SolidColorBrush(Color.Parse("#E01F2D"), 0.10)
            : Brushes.Transparent;
        row.BorderBrush = selected
            ? new SolidColorBrush(Color.Parse("#E01F2D"))
            : Brushes.Transparent;
    }

    private static string Initials(string name)
    {
        var words = name.Split(new[] { ' ', ':', '/', '-' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "?";
        if (words.Length == 1) return words[0][..Math.Min(2, words[0].Length)].ToUpperInvariant();
        return (words[0][0].ToString() + words[1][0]).ToUpperInvariant();
    }

    /// <summary>Stable per-game colour so the library reads as a list of distinct things.</summary>
    private static Color TileColour(string name)
    {
        int hash = 17;
        foreach (char c in name) hash = hash * 31 + c;
        double hue = Math.Abs(hash) % 360;
        return FromHsl(hue, 0.62, 0.60);
    }

    private static Color FromHsl(double h, double s, double l)
    {
        double c = (1 - Math.Abs(2 * l - 1)) * s;
        double x = c * (1 - Math.Abs((h / 60.0) % 2 - 1));
        double m = l - c / 2;
        (double r, double g, double b) = h switch
        {
            < 60 => (c, x, 0.0),
            < 120 => (x, c, 0.0),
            < 180 => (0.0, c, x),
            < 240 => (0.0, x, c),
            < 300 => (x, 0.0, c),
            _ => (c, 0.0, x)
        };
        return Color.FromRgb((byte)((r + m) * 255), (byte)((g + m) * 255), (byte)((b + m) * 255));
    }

    private void OnSearchChanged(object sender, TextChangedEventArgs e) => ApplyFilter();

    private void OnFilterClick(object sender, RoutedEventArgs e)
    {
        _onlySelected = !_onlySelected;
        Log.Dim(_onlySelected ? "library filtered to ticked games" : "library filter cleared");
        ApplyFilter();
    }

    private void ApplyFilter()
    {
        string query = (Text("SearchBox") ?? "").ToLowerInvariant();

        foreach (var (game, row) in _gameRows)
        {
            bool matches = query.Length == 0
                           || game.Name.ToLowerInvariant().Contains(query)
                           || game.Executables.Any(x => x.ToLowerInvariant().Contains(query));
            if (_onlySelected && _gameChecks[game].IsChecked != true) matches = false;
            row.IsVisible = matches;
        }

        foreach (var (exe, box, row) in _customRows)
        {
            bool matches = query.Length == 0 || exe.ToLowerInvariant().Contains(query);
            if (_onlySelected && box.IsChecked != true) matches = false;
            row.IsVisible = matches;
        }

        // Hide a group heading whose games are all filtered out.
        foreach (var header in _groupHeaders)
        {
            var owned = _gameRows.Where(kv => HeaderFor(kv.Key) == header.Text).Select(kv => kv.Value);
            header.IsVisible = owned.Any(r => r.IsVisible);
        }
    }

    private static string HeaderFor(GameEntry game) => game.AntiCheat switch
    {
        AntiCheat.Kernel => "KERNEL ANTI-CHEAT",
        AntiCheat.UserMode => "USER-MODE ANTI-CHEAT",
        _ => "NO ANTI-CHEAT"
    };

    private void OnGameToggled(object sender, RoutedEventArgs e)
    {
        if (sender is CheckBox box && box.Tag is GameEntry game && _gameRows.TryGetValue(game, out var row))
            PaintRow(row, box.IsChecked == true);

        foreach (var (_, custom, customRow) in _customRows) PaintRow(customRow, custom.IsChecked == true);

        if (_loading) return;
        RefreshSelection();
        RefreshStatus();
    }

    private void OnAddCustom(object sender, RoutedEventArgs e)
    {
        string exe = (Text("CustomExeBox") ?? "").Trim();
        if (exe.Length == 0) return;
        if (exe.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) exe = exe[..^4];

        // Typing a name that is not running would add a row that can never match anything,
        // and would silently never trigger. Refuse it and say why.
        var running = System.Diagnostics.Process.GetProcessesByName(exe);
        foreach (var p in running) p.Dispose();

        if (running.Length == 0)
        {
            SetText("AddGameNote", $"'{exe}.exe' is not running. Start the game, then add it - " +
                                   "that way STRYKR can confirm the name and read its icon.");
            Tint("AddGameNote", "#FF6069");
            Log.Warn($"not added: no running process named {exe}.exe");
            return;
        }

        GameIcons.Capture(exe);
        AddCustomRow(exe, true);
        SetText("CustomExeBox", "");
        SetText("AddGameNote", $"Added {exe}.exe - found running, icon captured.");
        Tint("AddGameNote", "#5FBF8F");
        RefreshSelection();
        RefreshStatus();
    }

    private void AddCustomRow(string exe, bool isChecked)
    {
        if (_customRows.Any(c => string.Equals(c.Exe, exe, StringComparison.OrdinalIgnoreCase))) return;
        if (GameCatalog.FindByExecutable(exe) != null) return;

        var list = Ctl<StackPanel>("GameList");
        if (list == null) return;

        var box = new CheckBox { IsChecked = isChecked, VerticalAlignment = VerticalAlignment.Center };
        box.IsCheckedChanged += OnGameToggled;

        var row = BuildRow(box, Initials(exe), TileColour(exe), exe + ".exe", exe);
        PaintRow(row, isChecked);
        list.Children.Insert(0, row);
        _customRows.Add((exe, box, row));
    }

    private List<string> SelectedExecutables()
    {
        var result = new List<string>();
        foreach (var (game, box) in _gameChecks)
            if (box.IsChecked == true) result.AddRange(game.Executables.Select(x => x.ToLowerInvariant()));
        foreach (var (exe, box, _) in _customRows)
            if (box.IsChecked == true) result.Add(exe.ToLowerInvariant());
        return result.Distinct().ToList();
    }

    private void RefreshSelection()
    {
        if (_engine == null) return;

        var selected = _gameChecks.Where(kv => kv.Value.IsChecked == true).Select(kv => kv.Key).ToList();
        int titles = selected.Count + _customRows.Count(c => c.Box.IsChecked == true);
        var executables = SelectedExecutables();

        SetText("SelectedCount", $"{titles} selected");
        UpdateLibraryBadge();
        SetText("ExecCount", executables.Count == 1 ? "1 executable" : $"{executables.Count} executables");

        var kernel = selected.Where(g => g.AntiCheat == AntiCheat.Kernel).ToList();
        var banner = Ctl<Border>("AntiCheatBanner");
        if (banner != null) banner.IsVisible = kernel.Count > 0;
        if (kernel.Count > 0)
        {
            string names = string.Join(", ", kernel.Select(g => $"{g.Name} ({g.AntiCheatName})"));
            SetText("AntiCheatText", Check("SafeMode")
                ? $"{names}. Safe mode is ON: while one of these is running, the game process is never opened, " +
                  "nothing is suspended or CPU-capped, and SeDebugPrivilege is never requested. Background " +
                  "de-prioritisation, power/timer/MMCSS tuning and network QoS still apply - which is where most " +
                  "of the benefit lives anyway."
                : $"{names}. Safe mode is OFF: the full profile will be applied, including opening the game process " +
                  "and suspending background processes, while a kernel anti-cheat driver watches. No tool can " +
                  "promise this is safe. Prove the profile on a single-player title first.");
        }

        // Only the executable list belongs to the library; the rest of the profile is owned
        // by whichever settings panel is active and is read on demand.
        _engine.Profile.Game.Executables = executables;

        var first = selected.FirstOrDefault();
        SetText("HeroGameName", first?.Name.ToUpperInvariant()
                                ?? (_customRows.FirstOrDefault(c => c.Box.IsChecked == true).Exe?.ToUpperInvariant()
                                    ?? "NO GAME SELECTED"));
        ApplyFilter();
    }

    // ------------------------------------------------------------ actions

    private void OnWatchClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        if (_engine.IsWatching) _engine.StopWatching(); else _engine.StartWatching();
        RefreshStatus();
    }

    private void OnApplyClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        Task.Run(() => { _engine.ApplyNow(); RefreshPowerPlanAsync(); });
    }

    private void OnRestoreClick(object sender, RoutedEventArgs e) =>
        Task.Run(() => { _engine.RestoreNow(); RefreshPowerPlanAsync(); });

    private void OnVerifyClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        SetTab(4);
        Task.Run(() =>
        {
            try { Verify.Run(_engine.Profile, _engine.Governor); }
            catch (Exception ex) { Log.Error(ex.Message); }
        });
    }

    private void OnBenchClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        int seconds = ParseInt("BenchSeconds", 90);
        int runs = ParseInt("BenchRuns", 2);

        var button = Ctl<Button>("BenchButton");
        if (button != null) button.IsEnabled = false;
        SetTab(4);
        Log.Info("benchmark starting");

        Task.Run(() =>
        {
            try { Bench.Run(_engine.Profile, _engine.Governor, seconds, runs); }
            catch (Exception ex) { Log.Error(ex.Message); }
            finally
            {
                Dispatcher.UIThread.Post(() =>
                {
                    if (button != null) button.IsEnabled = true;
                    RefreshStatus();
                });
            }
        });
    }

    private void OnHudClick(object sender, RoutedEventArgs e)
    {
        if (_hud != null) { _hud.Close(); return; }

        ApplyControlsToProfile();
        string target = _engine.Profile.Game.Executables.FirstOrDefault();
        if (target == null) { Log.Error("tick a game first - the counter follows the selected game"); return; }

        _monitor ??= new LiveMonitor();
        _monitor.Start(_engine.Profile, target);

        _hud = new HudWindow(_monitor);
        _hud.Closed += (_, _) => { _hud = null; _monitor?.Stop(); Dispatcher.UIThread.Post(UpdateHudButton); };
        _hud.Show();

        string presentMon = LiveMonitor.FindPresentMon(_engine.Profile.Bench.PresentMonPath);
        if (!File.Exists(presentMon))
            Log.Warn("PresentMon not found - the counter will show CPU and RAM but no FPS. " +
                     "Put PresentMon.exe next to strykr.exe and reopen it.");
        else
            Log.Dim($"  frame data from {presentMon}");

        Log.Info($"live counter following {target}.exe - top-left corner, click-through, close it with this button");
        Log.Dim("  separate always-on-top window, not an in-game overlay: nothing is injected into the game,");
        Log.Dim("  and the mouse passes straight through it so it can never eat a click.");
        UpdateHudButton();
    }

    private void UpdateHudButton() =>
        SetContent("HudButton", _hud != null ? "Hide FPS counter" : "Live FPS counter");

    private void OnExportClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        SetTab(4);
        Task.Run(() =>
        {
            try { Report.Export(_engine.Profile, _engine.Governor); }
            catch (Exception ex) { Log.Error($"could not write report: {ex.Message}"); }
        });
    }

    private void OnAuditClick(object sender, RoutedEventArgs e)
    {
        if (_engine == null) return;

        var button = Ctl<Button>("AuditButton");
        if (button != null) { button.IsEnabled = false; button.Content = "Auditing..."; }
        SetText("AuditSummary", "Reading the machine...");

        Task.Run(() =>
        {
            List<Finding> findings;
            try { findings = Audit.Run(_engine.Profile); }
            catch (Exception ex) { Log.Error($"audit failed: {ex.Message}"); findings = new List<Finding>(); }

            Dispatcher.UIThread.Post(() =>
            {
                RenderAudit(findings);
                if (button != null) { button.IsEnabled = true; button.Content = "Re-run audit"; }
            });
        });
    }

    private void RenderAudit(List<Finding> findings)
    {
        var list = Ctl<StackPanel>("AuditList");
        if (list == null) return;
        list.Children.Clear();

        int critical = findings.Count(f => f.Severity == Severity.Critical);
        int warning = findings.Count(f => f.Severity == Severity.Warning);
        SetText("AuditSummary", findings.Count == 0
            ? "Nothing could be read - are you elevated?"
            : $"{findings.Count} checks · {critical} critical · {warning} worth attention · " +
              $"{findings.Count(f => f.Severity == Severity.Good)} already correct");

        foreach (var finding in findings) list.Children.Add(BuildFindingCard(finding));
    }

    private Border BuildFindingCard(Finding finding)
    {
        (string label, string colour, string wash) = finding.Severity switch
        {
            Severity.Critical => ("CRITICAL", "#FF4A54", "#1C0C0F"),
            Severity.Warning => ("ATTENTION", "#E0A45C", "#1C160C"),
            Severity.Good => ("OK", "#5FBF8F", "#0C1A13"),
            _ => ("NOTE", "#8FA8D0", "#0C1119")
        };

        var head = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 12 };
        head.Children.Add(new Border
        {
            Background = new SolidColorBrush(Color.Parse(wash)),
            BorderBrush = new SolidColorBrush(Color.Parse(colour)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(3),
            Padding = new Thickness(7, 3),
            VerticalAlignment = VerticalAlignment.Center,
            Child = new TextBlock
            {
                Text = label,
                FontSize = 10,
                FontWeight = FontWeight.Bold,
                LetterSpacing = 1,
                Foreground = new SolidColorBrush(Color.Parse(colour))
            }
        });
        head.Children.Add(new TextBlock
        {
            Text = finding.Title,
            FontSize = 15,
            FontWeight = FontWeight.SemiBold,
            Foreground = new SolidColorBrush(Color.Parse("#EDEDF2")),
            VerticalAlignment = VerticalAlignment.Center,
            TextWrapping = TextWrapping.Wrap
        });

        var body = new StackPanel { Spacing = 10 };
        body.Children.Add(head);
        body.Children.Add(new TextBlock
        {
            Text = finding.Detail,
            FontSize = 12.5,
            LineHeight = 19,
            TextWrapping = TextWrapping.Wrap,
            MaxWidth = 820,
            Foreground = new SolidColorBrush(Color.Parse("#93949E"))
        });

        var footer = new StackPanel { Orientation = Orientation.Horizontal, Spacing = 14 };
        footer.Children.Add(new TextBlock
        {
            Text = "WORTH:  " + finding.Gain,
            FontFamily = new FontFamily("Bahnschrift, Consolas, monospace"),
            FontSize = 11.5,
            FontWeight = FontWeight.Bold,
            LetterSpacing = 0.6,
            Foreground = new SolidColorBrush(Color.Parse(finding.Severity == Severity.Good ? "#5FBF8F" : "#E01F2D")),
            VerticalAlignment = VerticalAlignment.Center
        });

        if (finding.Actionable)
        {
            var fix = new Button { Content = finding.FixLabel, Padding = new Thickness(16, 8), FontSize = 12 };
            fix.Classes.Add("danger");
            fix.Click += (_, _) => RunFix(finding, fix);
            footer.Children.Add(fix);
        }
        body.Children.Add(footer);

        return new Border
        {
            Background = new SolidColorBrush(Color.Parse("#0F1014")),
            BorderBrush = new SolidColorBrush(Color.Parse(finding.Severity == Severity.Critical ? "#4A161C" : "#1E1F26")),
            BorderThickness = new Thickness(1, 1, 1, 1),
            CornerRadius = new CornerRadius(10),
            Padding = new Thickness(22, 18),
            Child = body
        };
    }

    private void RunFix(Finding finding, Button button)
    {
        button.IsEnabled = false;
        button.Content = "Working...";

        Task.Run(() =>
        {
            Tweaks.Result result;
            try { result = Tweaks.Apply(finding.FixId, _engine.Profile); }
            catch (Exception ex) { result = new Tweaks.Result(false, ex.Message); }

            Dispatcher.UIThread.Post(() =>
            {
                button.IsEnabled = !result.Applied;
                button.Content = result.Applied
                    ? (result.NeedsReboot ? "Done - reboot needed" : "Done")
                    : finding.FixLabel;
                if (!result.Applied) SetTab(4);
            });
        });
    }

    // ------------------------------------------------------- PC performance

    private void StartSystemMonitor()
    {
        if (_system != null) return;
        _system = new SystemMonitor();
        _system.Updated += stats => Dispatcher.UIThread.Post(() => RenderSystem(stats));
        _system.Start(_engine?.Profile.Network.PingTarget ?? "1.1.1.1");
    }

    private void OnPerfToggle(object sender, RoutedEventArgs e)
    {
        if (_monitor is { IsRunning: true } && _hud == null) { StopPerf(); return; }

        ApplyControlsToProfile();
        StartSystemMonitor();

        // Frame data rides on the same PresentMon stream the overlay uses.
        string target = _engine?.Profile.Game.Executables.FirstOrDefault();
        if (target != null)
        {
            _monitor ??= new LiveMonitor();
            if (!_monitor.IsRunning)
            {
                _monitor.Updated += OnFrameStats;
                _monitor.Start(_engine.Profile, target);
            }
        }

        SetContent("PerfButton", "Stop frame capture");
        SetText("PerfState", target == null
            ? "Monitoring the machine and the connection. Tick a game for frame rate too."
            : $"Monitoring. Frame data follows {target}.exe once it is running.");
    }

    private void StopPerf()
    {
        // The system trace keeps running - it feeds the ring on the CONTROL tab.
        // Leave the frame stream alone if the overlay is still using it.
        if (_hud == null && _monitor != null)
        {
            _monitor.Updated -= OnFrameStats;
            _monitor.Stop();
        }

        SetContent("PerfButton", "Start frame capture");
        SetText("PerfState", "System and connection live. Frame capture stopped.");
    }

    private void OnFrameStats(LiveStats stats)
    {
        _lastFrameStats = stats;
        Dispatcher.UIThread.Post(RenderFrames);
    }

    private void RenderFrames()
    {
        var stats = _lastFrameStats;
        SetText("PerfFps", stats.HasFrameData ? stats.Fps.ToString("0") : "--");
        SetText("PerfFrameTime", stats.HasFrameData ? $"{stats.FrameTimeMs:0.0} ms" : "--");
        SetText("PerfLow", stats.OnePercentLowFps > 0 ? $"{stats.OnePercentLowFps:0} fps" : "collecting...");
        SetText("PerfStutter", stats.OnePercentLowFps > 0 ? $"{stats.StuttersLastMinute}/min" : "--");
        if (!string.IsNullOrEmpty(stats.Note)) SetText("PerfFpsNote", stats.Note);
    }

    private void RenderSystem(SystemStats stats)
    {
        Meter("PerfCpuBar", "PerfCpuText", stats.CpuPercent, $"{stats.CpuPercent:0}%");
        Meter("PerfGpuBar", "PerfGpuText", stats.GpuPercent < 0 ? 0 : stats.GpuPercent,
              stats.GpuPercent < 0 ? "unavailable" : $"{stats.GpuPercent:0}%");
        Meter("PerfRamBar", "PerfRamText", stats.RamPercent,
              $"{stats.RamUsedGb:0.0} / {stats.RamTotalGb:0} GB");

        SetText("PerfNet", $"{stats.DownMbps:0.0} Mbps down     {stats.UpMbps:0.0} Mbps up");
        SetText("PerfAdapter", stats.Adapter);

        bool havePing = stats.PingHistory.Count > 0;
        SetText("PerfPing", havePing ? stats.PingMs.ToString("0") : "--");
        SetText("PerfJitter", havePing ? $"{stats.JitterMs:0.0} ms" : "--");
        SetText("PerfLoss", havePing || stats.LossPercent > 0 ? $"{stats.LossPercent:0.#}%" : "--");
        SetText("PerfTarget", stats.PingTarget);

        // Status colour always travels with the number, never instead of it.
        Tint("PerfPing", stats.PingMs <= 0 ? "#EDEDF2" : stats.PingMs < 40 ? "#5FBF8F"
                        : stats.PingMs < 90 ? "#E0A45C" : "#FF4A54");
        Tint("PerfLoss", stats.LossPercent < 1 ? "#EDEDF2" : stats.LossPercent < 5 ? "#E0A45C" : "#FF4A54");
        Tint("PerfJitter", stats.JitterMs < 5 ? "#EDEDF2" : stats.JitterMs < 15 ? "#E0A45C" : "#FF4A54");

        DrawPingGraph(stats.PingHistory);

        // Frame rate is the better trace when we have it; CPU load otherwise.
        PushRing(_lastFrameStats.HasFrameData ? _lastFrameStats.Fps : stats.CpuPercent);
        SetText("RingText", _lastFrameStats.HasFrameData ? "FRAME RATE" : "CPU LOAD");

        if (_monitor == null || !_monitor.IsRunning) RenderFrames();
    }

    private void Meter(string barName, string textName, double percent, string label)
    {
        var bar = Ctl<Border>(barName);
        if (bar?.Parent is Border track && track.Bounds.Width > 0)
            bar.Width = Math.Clamp(percent, 0, 100) / 100.0 * track.Bounds.Width;

        SetText(textName, label);
        Tint(textName, percent < 70 ? "#EDEDF2" : percent < 90 ? "#E0A45C" : "#FF4A54");
    }

    /// <summary>One series, so no legend: a thin recessive trace of the last minute of RTT.</summary>
    private void DrawPingGraph(IReadOnlyList<double> history)
    {
        var canvas = Ctl<Canvas>("PerfPingGraph");
        if (canvas == null) return;

        canvas.Children.Clear();
        if (history.Count < 2 || canvas.Bounds.Width <= 0) return;

        double max = Math.Max(history.Max(), 1);
        double width = canvas.Bounds.Width;
        double height = canvas.Bounds.Height;

        var points = new Avalonia.Points();
        for (int i = 0; i < history.Count; i++)
        {
            double x = width * i / Math.Max(history.Count - 1, 1);
            double y = height - history[i] / max * (height - 4) - 2;
            points.Add(new Avalonia.Point(x, y));
        }

        canvas.Children.Add(new Polyline
        {
            Points = points,
            Stroke = new SolidColorBrush(Color.Parse("#E01F2D")),
            StrokeThickness = 2,
            StrokeJoin = PenLineJoin.Round
        });
    }

    /// <summary>
    /// The ring is a real trace, not a decorative pulse: frame rate when a game is being
    /// measured, otherwise CPU load. A dial that draws the same squiggle whatever the
    /// machine is doing is a lie told in pixels.
    /// </summary>
    private void PushRing(double value)
    {
        _ringHistory.Add(value);
        while (_ringHistory.Count > 48) _ringHistory.RemoveAt(0);

        var canvas = Ctl<Canvas>("RingGraph");
        if (canvas == null) return;

        canvas.Children.Clear();
        if (_ringHistory.Count < 2) return;

        double max = Math.Max(_ringHistory.Max(), 1);
        double min = Math.Min(_ringHistory.Min(), 0);
        double span = Math.Max(max - min, 1);
        double width = canvas.Width, height = canvas.Height;

        var points = new Avalonia.Points();
        for (int i = 0; i < _ringHistory.Count; i++)
        {
            double x = width * i / Math.Max(_ringHistory.Count - 1, 1);
            double y = height - (_ringHistory[i] - min) / span * (height - 6) - 3;
            points.Add(new Avalonia.Point(x, y));
        }

        canvas.Children.Add(new Polyline
        {
            Points = points,
            Stroke = new SolidColorBrush(Color.Parse("#FF3B47")),
            StrokeThickness = 2,
            StrokeJoin = PenLineJoin.Round
        });
    }

    private void Tint(string name, string colour)
    {
        var block = Ctl<TextBlock>(name);
        if (block != null) block.Foreground = new SolidColorBrush(Color.Parse(colour));
    }

    private void OnClearLog(object sender, RoutedEventArgs e) => SetText("LogBox", "");

    private void OnClosing(object sender, WindowClosingEventArgs e)
    {
        // Never leave the machine governed because a window was closed.
        try { _hud?.Close(); } catch { }
        try { _system?.Dispose(); } catch { }
        try { _monitor?.Dispose(); } catch { }
        try { _engine.Dispose(); } catch { }
    }

    // ----------------------------------------------------- simple/advanced

    private void OnModeSimple(object sender, RoutedEventArgs e) => SetMode(false);
    private void OnModeAdvanced(object sender, RoutedEventArgs e) => SetMode(true);

    private void SetMode(bool advanced)
    {
        SetVisible("SimplePanel", !advanced);
        SetVisible("AdvancedPanel", advanced);
        Style("ModeSimpleBtn", advanced ? "ghost" : "primary");
        Style("ModeAdvancedBtn", advanced ? "primary" : "ghost");

        if (advanced) RefreshAdvancedFromProfile(); else RefreshSimpleFromProfile();
    }

    private bool IsAdvanced() => Ctl<StackPanel>("AdvancedPanel")?.IsVisible == true;

    private void Style(string name, string cls)
    {
        var button = Ctl<Button>(name);
        if (button == null) return;
        button.Classes.Remove("primary");
        button.Classes.Remove("ghost");
        button.Classes.Remove("icon");
        button.Classes.Remove("danger");
        if (!string.IsNullOrEmpty(cls)) button.Classes.Add(cls);
    }

    private void OnSimpleChanged(object sender, RoutedEventArgs e)
    {
        if (_loading) return;
        ApplySimpleToProfile();
        SyncPresetFromSwitches();
        ReapplyIfLive("setting changed");
    }

    private void OnPresetLight(object sender, RoutedEventArgs e) => ApplyPreset(true, false, true, false, false);
    private void OnPresetBalanced(object sender, RoutedEventArgs e) => ApplyPreset(true, true, true, true, false);
    private void OnPresetMax(object sender, RoutedEventArgs e) => ApplyPreset(true, true, true, true, true);

    private void ApplyPreset(bool quiet, bool fullSpeed, bool noRecording, bool network, bool freeze)
    {
        _loading = true;
        try
        {
            SetCheck("SimpleQuiet", quiet);
            SetCheck("SimpleFullSpeed", fullSpeed);
            SetCheck("SimpleNoRecording", noRecording);
            SetCheck("SimpleNetwork", network);
            SetCheck("SimpleFreeze", freeze);
        }
        finally { _loading = false; }

        ApplySimpleToProfile();

        string name = freeze ? "Maximum" : fullSpeed && network ? "Balanced" : "Light touch";
        SetText("FooterProfile", name);
        MarkActivePreset(name);

        // The switches a preset moves live in the card below it, so without this the click
        // looks like it did nothing at all.
        string summary = $"{name}: background {(quiet ? "quieted" : "left alone")}, " +
                         $"CPU {(fullSpeed ? "held at full speed" : "left on your power plan")}, " +
                         $"recording {(noRecording ? "off" : "untouched")}, " +
                         $"network {(network ? "game first" : "untouched")}, " +
                         $"freezing {(freeze ? "ON" : "off")}. Switches updated below.";
        SetText("PresetSummary", summary);
        Log.Info("preset applied - " + summary);
        ReapplyIfLive($"level set to {name}");
    }

    /// <summary>
    /// A profile change while a session is running has to reach the machine now. Otherwise
    /// picking Maximum leaves the power plan on whatever the last level set, which reads -
    /// correctly - as the button not working.
    /// </summary>
    private void ReapplyIfLive(string reason)
    {
        if (_engine == null || !_engine.IsApplied) return;

        Log.Info($"{reason} - re-applying to the running session");
        Task.Run(() =>
        {
            _engine.RestoreNow();
            _engine.ApplyNow();
            RefreshPowerPlanAsync();
        });
    }

    /// <summary>Only the chosen level is filled in, so it is obvious which one is live.</summary>
    private void MarkActivePreset(string name)
    {
        Style("PresetLight", name == "Light touch" ? "danger" : "ghost");
        Style("PresetBalanced", name == "Balanced" ? "danger" : "ghost");
        Style("PresetMax", name == "Maximum" ? "danger" : "ghost");
    }

    /// <summary>Works out which level the current switch positions correspond to, if any.</summary>
    private void SyncPresetFromSwitches()
    {
        bool quiet = Check("SimpleQuiet"), fullSpeed = Check("SimpleFullSpeed");
        bool network = Check("SimpleNetwork"), freeze = Check("SimpleFreeze");
        bool noRecording = Check("SimpleNoRecording");

        string name =
            quiet && fullSpeed && noRecording && network && freeze ? "Maximum"
            : quiet && fullSpeed && noRecording && network && !freeze ? "Balanced"
            : quiet && !fullSpeed && noRecording && !network && !freeze ? "Light touch"
            : null;

        MarkActivePreset(name ?? "");
        if (name != null) SetText("FooterProfile", name);
        else SetText("FooterProfile", "Custom");
    }

    private void ApplySimpleToProfile()
    {
        if (_engine == null) return;
        var p = _engine.Profile;

        p.Game.Executables = SelectedExecutables();
        p.Game.Priority = "High";
        p.Game.PCoreOnly = true;
        p.Game.DisablePowerThrottling = true;
        p.Game.IgnoreTimerResolution = true;

        bool quiet = Check("SimpleQuiet");
        p.Background.Priority = quiet ? "Idle" : "Normal";
        p.Background.EcoQoS = quiet;
        p.Background.ECoreOnly = quiet;
        p.Background.Suspend = Check("SimpleFreeze");
        p.Background.CpuCapPercent = 0;

        bool fullSpeed = Check("SimpleFullSpeed");
        p.System.UltimatePerformancePowerPlan = fullSpeed;
        p.System.DisableCoreParking = fullSpeed;
        p.System.MinProcessorStatePercent = fullSpeed ? 100 : 0;
        p.System.TimerResolutionMs = fullSpeed ? 0.5 : 0;

        bool noRecording = Check("SimpleNoRecording");
        p.System.DisableGameDvr = noRecording;
        p.System.MmcssGamesTuning = noRecording;

        bool network = Check("SimpleNetwork");
        p.Network.Dscp = network ? 46 : 0;
        p.Network.ThrottleBulkUploaders = network;

        p.Safety.AntiCheatSafeMode = Check("SimpleSafe");
        p.Game.AutoDetect = Check("AutoDetect");
        SetCheck("SafeMode", p.Safety.AntiCheatSafeMode);
        RefreshSelection();
    }

    private void RefreshSimpleFromProfile()
    {
        if (_engine == null) return;
        var p = _engine.Profile;
        _loading = true;
        try
        {
            SetCheck("SimpleQuiet", !string.Equals(p.Background.Priority, "Normal", StringComparison.OrdinalIgnoreCase)
                                    || p.Background.EcoQoS);
            SetCheck("SimpleFullSpeed", p.System.UltimatePerformancePowerPlan || p.System.TimerResolutionMs > 0);
            SetCheck("SimpleNoRecording", p.System.DisableGameDvr);
            SetCheck("SimpleNetwork", p.Network.Dscp > 0 || p.Network.ThrottleBulkUploaders);
            SetCheck("SimpleFreeze", p.Background.Suspend);
            SetCheck("SimpleSafe", p.Safety.AntiCheatSafeMode);
        }
        finally { _loading = false; }

        SyncPresetFromSwitches();
    }

    /// <summary>A game found by detection joins the library, ticked, so it is visible and editable.</summary>
    private void OnAutoDetected(Detection found)
    {
        var known = GameCatalog.FindByExecutable(found.ProcessName);
        if (known != null && _gameChecks.TryGetValue(known, out var box))
        {
            box.IsChecked = true;
        }
        else
        {
            AddCustomRow(found.ProcessName, true);
        }

        RefreshSelection();
        RefreshStatus();
    }

    private void OnAutoDetectToggled(object sender, RoutedEventArgs e)
    {
        if (_engine == null) return;
        _engine.Profile.Game.AutoDetect = Check("AutoDetect");
        Log.Info(Check("AutoDetect")
            ? "auto-detect on - any catalog title, or a window filling the screen, will be picked up"
            : "auto-detect off - only ticked games are watched");
    }

    private void OnSafeModeToggled(object sender, RoutedEventArgs e)
    {
        _engine.Profile.Safety.AntiCheatSafeMode = Check("SafeMode");
        SetCheck("SimpleSafe", Check("SafeMode"));
        RefreshSelection();
        if (!Check("SafeMode"))
            Log.Warn("safe mode OFF - kernel-anti-cheat titles will get the full profile, game process included");
    }

    private void OnSuspendToggled(object sender, RoutedEventArgs e)
    {
        if (Check("BgSuspend"))
            Log.Warn("suspension armed - freezes the named list outright. Anti-cheat and system processes are still never touched.");
    }

    // -------------------------------------------------------------- profile

    private static string ResolveProfilePath()
    {
        foreach (var dir in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            if (string.IsNullOrEmpty(dir)) continue;
            string candidate = IOPath.Combine(dir, "profile.json");
            if (File.Exists(candidate)) return candidate;
        }
        return IOPath.Combine(AppContext.BaseDirectory, "profile.json");
    }

    private static Profile LoadOrCreateProfile(string path)
    {
        try { if (File.Exists(path)) return Profile.Load(path); }
        catch (Exception ex) { Log.Warn($"could not read {path}: {ex.Message} - starting from defaults"); }
        return new Profile { Name = "balanced" };
    }

    private void LoadProfileIntoControls(Profile p)
    {
        _loading = true;
        try
        {
            foreach (var (game, box) in _gameChecks)
            {
                box.IsChecked = game.Executables.Any(x => p.Game.Executables.Contains(x.ToLowerInvariant()));
                if (_gameRows.TryGetValue(game, out var row)) PaintRow(row, box.IsChecked == true);
            }

            foreach (var exe in p.Game.Executables)
                if (GameCatalog.FindByExecutable(exe) == null) AddCustomRow(exe, true);

            RefreshAdvancedFromProfileCore(p);
        }
        finally { _loading = false; }

        RefreshSimpleFromProfile();
        RefreshSelection();
    }

    private void RefreshAdvancedFromProfile()
    {
        if (_engine == null) return;
        _loading = true;
        try { RefreshAdvancedFromProfileCore(_engine.Profile); }
        finally { _loading = false; }
    }

    private void RefreshAdvancedFromProfileCore(Profile p)
    {
        SetCombo("GamePriority", p.Game.Priority);
        SetCheck("GamePCore", p.Game.PCoreOnly);
        SetCheck("GameNoThrottle", p.Game.DisablePowerThrottling);
        SetCheck("GameIgnoreTimer", p.Game.IgnoreTimerResolution);

        SetCombo("BackgroundPriority", p.Background.Priority);
        SetCheck("BgEco", p.Background.EcoQoS);
        SetCheck("BgECore", p.Background.ECoreOnly);
        SetCheck("BgSuspend", p.Background.Suspend);
        SetText("BgCpuCap", p.Background.CpuCapPercent.ToString());

        SetCheck("SysPower", p.System.UltimatePerformancePowerPlan);
        SetCheck("SysParking", p.System.DisableCoreParking);
        SetCheck("SysTimer", p.System.TimerResolutionMs > 0);
        SetCheck("SysMmcss", p.System.MmcssGamesTuning);
        SetCheck("SysGameDvr", p.System.DisableGameDvr);

        SetText("NetAdapter", p.Network.PreferredInterfaceAlias ?? "");
        SetText("NetDscp", p.Network.Dscp.ToString());
        SetCheck("NetThrottle", p.Network.ThrottleBulkUploaders);
        SetCheck("SafeMode", p.Safety.AntiCheatSafeMode);
    }

    /// <summary>
    /// Pushes the ACTIVE settings panel back into the live profile. Dispatching matters:
    /// the hidden panel holds stale values and reading it would undo the other one.
    /// </summary>
    private void ApplyControlsToProfile()
    {
        if (_loading) return;
        if (IsAdvanced()) ApplyAdvancedToProfile(); else ApplySimpleToProfile();
    }

    private void ApplyAdvancedToProfile()
    {
        if (_engine == null) return;
        var p = _engine.Profile;

        p.Game.Executables = SelectedExecutables();
        p.Game.Priority = ComboText("GamePriority") ?? "High";
        p.Game.PCoreOnly = Check("GamePCore");
        p.Game.DisablePowerThrottling = Check("GameNoThrottle");
        p.Game.IgnoreTimerResolution = Check("GameIgnoreTimer");

        p.Background.Priority = ComboText("BackgroundPriority") ?? "Idle";
        p.Background.EcoQoS = Check("BgEco");
        p.Background.ECoreOnly = Check("BgECore");
        p.Background.Suspend = Check("BgSuspend");
        p.Background.CpuCapPercent = ParseInt("BgCpuCap", 0);

        p.System.UltimatePerformancePowerPlan = Check("SysPower");
        p.System.DisableCoreParking = Check("SysParking");
        p.System.MinProcessorStatePercent = Check("SysParking") ? 100 : 0;
        p.System.TimerResolutionMs = Check("SysTimer") ? 0.5 : 0;
        p.System.MmcssGamesTuning = Check("SysMmcss");
        p.System.DisableGameDvr = Check("SysGameDvr");

        p.Network.PreferredInterfaceAlias = Text("NetAdapter");
        p.Network.Dscp = ParseInt("NetDscp", 0);
        p.Network.ThrottleBulkUploaders = Check("NetThrottle");
        p.Safety.AntiCheatSafeMode = Check("SafeMode");
        p.Game.AutoDetect = Check("AutoDetect");

        SetVisible("RealtimeWarning",
            string.Equals(p.Game.Priority, "RealTime", StringComparison.OrdinalIgnoreCase));
        SetText("FooterProfile", "Custom");
    }

    private void OnSaveProfile(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        try
        {
            _engine.Profile.Save(_profilePath);
            Log.Good($"profile saved to {_profilePath}");
        }
        catch (Exception ex) { Log.Error($"could not save: {ex.Message}"); }
    }

    private void OnReloadProfile(object sender, RoutedEventArgs e)
    {
        var profile = LoadOrCreateProfile(_profilePath);
        _engine.SetProfile(profile);
        LoadProfileIntoControls(profile);
        Log.Info("profile reloaded");
    }

    // --------------------------------------------------------------- status

    private void RefreshStatus()
    {
        if (_engine == null) return;
        var (hybrid, pCores, eCores, timerMs) = _engine.Topology();
        bool elevated = IsElevated();

        SetText("StatusCpu", hybrid
            ? $"hybrid ({pCores} P / {eCores} E of {Environment.ProcessorCount} logical CPUs)"
            : $"uniform ({Environment.ProcessorCount} logical CPUs)");
        SetText("StatusTimer", $"{timerMs:0.###} ms");
        var detection = _engine.LastDetection;
        SetText("StatusGame", _engine.DetectedGame == null
            ? (Check("AutoDetect") ? "none - auto-detect watching" : "none")
            : detection == null ? _engine.DetectedGame
            : $"{_engine.DetectedGame}  ·  {detection.Reason}");
        SetText("StatusJournal", File.Exists(Journal.Path) ? "open - changes are live" : "clean");
        SetText("StatusPower", _powerPlan);

        SetText("FooterCpuSet", hybrid ? $"{pCores}P / {eCores}E" : "Uniform");
        SetText("FooterCpus", Environment.ProcessorCount.ToString());
        SetText("FooterTimer", $"{timerMs:0.###} ms");
        SetText("FooterPower", _powerPlan);

        string state = _engine.GameAttached ? "APPLIED" : _engine.IsApplied ? "MAX PERF" : "IDLE";
        SetText("StatusState", state.ToLowerInvariant());
        SetText("StateText", elevated ? state : "NOT ELEVATED");
        SetText("RingText", _engine.GameAttached ? "OPTIMAL" : _engine.IsApplied ? "MAX" : "STANDBY");

        SetContent("WatchButton", _engine.IsWatching ? "Stop  ·  restore" : "START  ·  MAX PERFORMANCE");
        SetText("HeroStatus",
            !_engine.IsApplied ? "Idle - press start to go to max performance"
            : _engine.GameAttached ? "Max performance applied, game attached"
            : "Max performance applied - waiting for the game to launch");

        var progress = Ctl<ProgressBar>("HeroProgress");
        if (progress != null)
        {
            progress.IsIndeterminate = _engine.IsApplied && !_engine.GameAttached;
            progress.Value = _engine.GameAttached ? 100 : 0;
        }

        var dot = Ctl<Ellipse>("HeroDot");
        if (dot != null)
            dot.Fill = new SolidColorBrush(Color.Parse(
                _engine.GameAttached ? "#E01F2D" : _engine.IsApplied ? "#FF8A3C" : "#4A4B54"));

        var colour = Color.Parse(!elevated ? "#FF9A3C" : _engine.IsApplied ? "#FF4A54" : "#7E7F8A");
        var stateText = Ctl<TextBlock>("StateText");
        if (stateText != null) stateText.Foreground = new SolidColorBrush(colour);
        var glyph = Ctl<Path>("StateGlyph");
        if (glyph != null) glyph.Stroke = new SolidColorBrush(colour);
        var pill = Ctl<Border>("StatePill");
        if (pill != null) pill.BorderBrush = new SolidColorBrush(colour);
    }

    private void RefreshPowerPlanAsync() => Task.Run(() =>
    {
        string output = Tuners.Run("powercfg.exe", "/getactivescheme").Output ?? "";
        string name = output.Contains('(') && output.Contains(')')
            ? output[(output.IndexOf('(') + 1)..output.LastIndexOf(')')]
            : "-";
        _powerPlan = string.IsNullOrWhiteSpace(name) ? "-" : name;
        Dispatcher.UIThread.Post(RefreshStatus);
    });

    private void AppendLog(string level, string message)
    {
        var box = Ctl<TextBox>("LogBox");
        if (box == null) return;

        string text = box.Text + $"{DateTime.Now:HH:mm:ss}  {level,-4}  {message}{Environment.NewLine}";
        if (text.Length > 120_000) text = text[^100_000..];   // keep the pane bounded
        box.Text = text;
        box.CaretIndex = box.Text.Length;
    }

    // -------------------------------------------------------------- helpers

    private static bool IsElevated()
    {
        try
        {
            if (!OperatingSystem.IsWindows()) return false;
            using var identity = WindowsIdentity.GetCurrent();
            return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
        }
        catch { return false; }
    }

    /// <summary>
    /// FindControl&lt;T&gt; THROWS when the named control exists but is another type - it does
    /// not return null. Every lookup goes through here, which finds the control as a
    /// Control and casts softly, so a type mismatch is a no-op instead of an exception
    /// that takes the whole window down.
    /// </summary>
    private T Ctl<T>(string name) where T : class => this.FindControl<Control>(name) as T;

    private bool Check(string name) => Ctl<CheckBox>(name)?.IsChecked == true;

    private void SetCheck(string name, bool value)
    {
        var box = Ctl<CheckBox>(name);
        if (box != null) box.IsChecked = value;
    }

    private string Text(string name) => Ctl<TextBox>(name)?.Text?.Trim() ?? Ctl<TextBlock>(name)?.Text;

    private void SetText(string name, string value)
    {
        if (Ctl<TextBox>(name) is { } box) { box.Text = value; return; }
        if (Ctl<TextBlock>(name) is { } block) block.Text = value;
    }

    private void SetContent(string name, string value)
    {
        var button = Ctl<Button>(name);
        if (button != null) button.Content = value;
    }

    private void SetVisible(string name, bool visible)
    {
        if (Ctl<Control>(name) is { } control) control.IsVisible = visible;
    }

    private int ParseInt(string name, int fallback) =>
        int.TryParse(Text(name), out int value) ? value : fallback;

    private string ComboText(string name) =>
        (Ctl<ComboBox>(name)?.SelectedItem as ComboBoxItem)?.Content?.ToString();

    private void SetCombo(string name, string value)
    {
        var combo = Ctl<ComboBox>(name);
        if (combo == null) return;
        for (int i = 0; i < combo.ItemCount; i++)
            if (combo.Items[i] is ComboBoxItem item &&
                string.Equals(item.Content?.ToString(), value, StringComparison.OrdinalIgnoreCase))
            { combo.SelectedIndex = i; return; }
    }
}
