using System.Diagnostics;
using System.Security.Principal;
using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Layout;
using Avalonia.Markup.Xaml;
using Avalonia.Media;
using Avalonia.Threading;

namespace GamePrio.App;

public partial class MainWindow : Window
{
    private readonly Dictionary<GameEntry, CheckBox> _gameChecks = new();
    private readonly List<(string Exe, CheckBox Box)> _customChecks = new();
    private Engine _engine;
    private string _profilePath;
    private bool _loading;

    public MainWindow()
    {
        AvaloniaXamlLoader.Load(this);

        _profilePath = ResolveProfilePath();
        var profile = LoadOrCreateProfile(_profilePath);
        _engine = new Engine(profile);
        _engine.Changed += () => Dispatcher.UIThread.Post(RefreshStatus);

        Log.Emitted += (level, message) => Dispatcher.UIThread.Post(() => AppendLog(level, message));

        BuildGameList();
        LoadProfileIntoControls(profile);
        RefreshStatus();

        // SeDebugPrivilege is requested by Governor.Apply only when safe mode is off.
        Native.EnablePrivilege("SeIncreaseBasePriorityPrivilege");
        Native.EnablePrivilege("SeIncreaseQuotaPrivilege");

        var logPath = this.FindControl<TextBlock>("LogPathText");
        if (logPath != null)
            logPath.Text = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "GamePrio");

        Log.Info("gameprio ready");
        if (!IsElevated())
            Log.Error("not elevated - relaunch as administrator or nothing here can touch another process");

        Task.Run(() => _engine.RecoverStaleState());

        Closing += OnClosing;
    }

    // ------------------------------------------------------------- game list

    private void BuildGameList()
    {
        var list = this.FindControl<StackPanel>("GameList");
        if (list == null) return;
        list.Children.Clear();
        _gameChecks.Clear();

        foreach (var group in GameCatalog.All.GroupBy(g => g.AntiCheat).OrderByDescending(g => g.Key))
        {
            list.Children.Add(new TextBlock
            {
                Text = group.Key switch
                {
                    AntiCheat.Kernel => "KERNEL ANTI-CHEAT",
                    AntiCheat.UserMode => "USER-MODE ANTI-CHEAT",
                    _ => "NO ANTI-CHEAT"
                },
                FontSize = 10,
                FontWeight = FontWeight.Bold,
                Foreground = new SolidColorBrush(group.Key switch
                {
                    AntiCheat.Kernel => Color.Parse("#E58A80"),
                    AntiCheat.UserMode => Color.Parse("#D9B45C"),
                    _ => Color.Parse("#62C295")
                }),
                Margin = new Avalonia.Thickness(0, 12, 0, 4)
            });

            foreach (var game in group.OrderBy(g => g.Name))
            {
                var box = new CheckBox
                {
                    Content = game.Name,
                    Tag = game,
                    FontSize = 13
                };
                box.IsCheckedChanged += OnGameToggled;
                ToolTip.SetTip(box, $"{game.Primary}.exe   -   anti-cheat: {game.AntiCheatName}");

                _gameChecks[game] = box;
                list.Children.Add(box);
            }
        }
    }

    private void OnSearchChanged(object sender, TextChangedEventArgs e)
    {
        string query = (this.FindControl<TextBox>("SearchBox")?.Text ?? "").Trim().ToLowerInvariant();
        foreach (var (game, box) in _gameChecks)
        {
            box.IsVisible = query.Length == 0
                            || game.Name.ToLowerInvariant().Contains(query)
                            || game.Executables.Any(x => x.ToLowerInvariant().Contains(query));
        }
    }

    private void OnGameToggled(object sender, RoutedEventArgs e)
    {
        if (_loading) return;
        RefreshSelection();
    }

    private void OnAddCustom(object sender, RoutedEventArgs e)
    {
        var input = this.FindControl<TextBox>("CustomExeBox");
        string exe = (input?.Text ?? "").Trim();
        if (exe.Length == 0) return;
        if (exe.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) exe = exe[..^4];

        AddCustomRow(exe, true);
        if (input != null) input.Text = "";
        RefreshSelection();
    }

    private void AddCustomRow(string exe, bool isChecked)
    {
        if (_customChecks.Any(c => string.Equals(c.Exe, exe, StringComparison.OrdinalIgnoreCase))) return;
        if (GameCatalog.FindByExecutable(exe) != null) return;

        var list = this.FindControl<StackPanel>("GameList");
        if (list == null) return;

        var box = new CheckBox
        {
            Content = exe + ".exe  (custom)",
            IsChecked = isChecked,
            FontSize = 13
        };
        box.IsCheckedChanged += OnGameToggled;
        list.Children.Insert(0, box);
        _customChecks.Add((exe, box));
    }

    /// <summary>Every ticked executable, catalog and custom alike.</summary>
    private List<string> SelectedExecutables()
    {
        var result = new List<string>();
        foreach (var (game, box) in _gameChecks)
            if (box.IsChecked == true) result.AddRange(game.Executables.Select(x => x.ToLowerInvariant()));
        foreach (var (exe, box) in _customChecks)
            if (box.IsChecked == true) result.Add(exe.ToLowerInvariant());
        return result.Distinct().ToList();
    }

    private void RefreshSelection()
    {
        var selected = _gameChecks.Where(kv => kv.Value.IsChecked == true).Select(kv => kv.Key).ToList();
        int total = SelectedExecutables().Count;

        var count = this.FindControl<TextBlock>("SelectedCount");
        if (count != null)
            count.Text = $"{selected.Count + _customChecks.Count(c => c.Box.IsChecked == true)} selected, " +
                         $"{total} executables watched";

        // Kernel anti-cheat changes what is safe to do, so say which titles and what changes.
        var kernel = selected.Where(g => g.AntiCheat == AntiCheat.Kernel).ToList();
        var banner = this.FindControl<Border>("AntiCheatBanner");
        var text = this.FindControl<TextBlock>("AntiCheatText");
        if (banner != null && text != null)
        {
            banner.IsVisible = kernel.Count > 0;
            if (kernel.Count > 0)
            {
                string titles = string.Join(", ", kernel.Select(g => $"{g.Name} ({g.AntiCheatName})"));
                text.Text = Check("SafeMode")
                    ? $"{titles}. Safe mode is ON: while one of these is running, the game process is never " +
                      "opened, nothing is suspended or CPU-capped, and SeDebugPrivilege is never requested. " +
                      "Background de-prioritisation, power/timer/MMCSS tuning and network QoS still apply - " +
                      "which is where most of the benefit lives anyway."
                    : $"{titles}. Safe mode is OFF: the full profile will be applied, including opening the game " +
                      "process and suspending background processes, while a kernel anti-cheat driver watches. " +
                      "No tool can promise this is safe. Prove the profile on a single-player title first.";
            }
        }

        ApplyControlsToProfile();
    }

    // ------------------------------------------------------------- profile

    private static string ResolveProfilePath()
    {
        foreach (var dir in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            if (string.IsNullOrEmpty(dir)) continue;
            string candidate = Path.Combine(dir, "profile.json");
            if (File.Exists(candidate)) return candidate;
        }
        return Path.Combine(AppContext.BaseDirectory, "profile.json");
    }

    private static Profile LoadOrCreateProfile(string path)
    {
        try { if (File.Exists(path)) return Profile.Load(path); }
        catch (Exception ex) { Log.Warn($"could not read {path}: {ex.Message} - starting from defaults"); }
        return new Profile { Name = "max" };
    }

    private void LoadProfileIntoControls(Profile p)
    {
        _loading = true;
        try
        {
            foreach (var (game, box) in _gameChecks)
                box.IsChecked = game.Executables.Any(x => p.Game.Executables.Contains(x.ToLowerInvariant()));

            foreach (var exe in p.Game.Executables)
                if (GameCatalog.FindByExecutable(exe) == null) AddCustomRow(exe, true);

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

            var path = this.FindControl<TextBlock>("ProfilePathText");
            if (path != null) path.Text = _profilePath;
        }
        finally { _loading = false; }

        RefreshSelection();
    }

    /// <summary>Pushes every control back into the live profile the engine uses.</summary>
    private void ApplyControlsToProfile()
    {
        if (_loading) return;
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

        var warn = this.FindControl<TextBlock>("RealtimeWarning");
        if (warn != null) warn.IsVisible = string.Equals(p.Game.Priority, "RealTime", StringComparison.OrdinalIgnoreCase);
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

    private void OnSafeModeToggled(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        RefreshSelection();
        if (!Check("SafeMode"))
            Log.Warn("safe mode OFF - kernel-anti-cheat titles will get the full profile, game process included");
    }

    private void OnSuspendToggled(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        if (Check("BgSuspend"))
            Log.Warn("suspension armed - freezes the named list outright. Anti-cheat and system processes are still never touched.");
    }

    // ------------------------------------------------------------- actions

    private void OnWatchClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        if (_engine.IsWatching) _engine.StopWatching();
        else _engine.StartWatching();
        RefreshStatus();
    }

    private void OnApplyClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        Task.Run(() => _engine.ApplyNow());
    }

    private void OnRestoreClick(object sender, RoutedEventArgs e) => Task.Run(() => _engine.RestoreNow());

    private void OnBenchClick(object sender, RoutedEventArgs e)
    {
        ApplyControlsToProfile();
        int seconds = ParseInt("BenchSeconds", 90);
        int runs = ParseInt("BenchRuns", 2);

        var button = this.FindControl<Button>("BenchButton");
        if (button != null) button.IsEnabled = false;

        Log.Info("benchmark starting - watch the Activity tab");

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

    private void OnClearLog(object sender, RoutedEventArgs e)
    {
        var box = this.FindControl<TextBox>("LogBox");
        if (box != null) box.Text = "";
    }

    private void OnClosing(object sender, WindowClosingEventArgs e)
    {
        // Never leave the machine in a governed state because a window was closed.
        try { _engine.Dispose(); } catch { }
    }

    // ------------------------------------------------------------- status

    private void RefreshStatus()
    {
        var (hybrid, pCores, eCores, timerMs) = _engine.Topology();

        SetTextBlock("TopologyText",
            hybrid
                ? $"{Environment.ProcessorCount} logical CPUs  -  {pCores} P  /  {eCores} E"
                : $"{Environment.ProcessorCount} logical CPUs  -  uniform");
        SetTextBlock("StatusCpu", hybrid ? $"hybrid: {pCores} P-core threads, {eCores} E-core threads"
                                         : "uniform (no P/E split detected)");
        SetTextBlock("StatusTimer", $"{timerMs:0.###} ms");
        SetTextBlock("StatusGame", _engine.DetectedGame ?? "none");
        SetTextBlock("StatusJournal", File.Exists(Journal.Path) ? "OPEN - changes are live" : "clean");

        string state = _engine.IsApplied ? "APPLIED" : _engine.IsWatching ? "WATCHING" : "IDLE";
        SetTextBlock("StateText", state);
        SetTextBlock("StatusState", state.ToLowerInvariant());

        var pill = this.FindControl<Border>("StatePill");
        if (pill != null)
            pill.Background = new SolidColorBrush(Color.Parse(
                state == "APPLIED" ? "#332516" : state == "WATCHING" ? "#16291f" : "#1C212B"));
        var stateText = this.FindControl<TextBlock>("StateText");
        if (stateText != null)
            stateText.Foreground = new SolidColorBrush(Color.Parse(
                state == "APPLIED" ? "#E8A057" : state == "WATCHING" ? "#62C295" : "#868F9F"));

        var watchButton = this.FindControl<Button>("WatchButton");
        if (watchButton != null) watchButton.Content = _engine.IsWatching ? "Stop watching" : "Start watching";

        bool elevated = IsElevated();
        SetTextBlock("ElevationText", elevated ? "ELEVATED" : "NOT ELEVATED");
        var elevationText = this.FindControl<TextBlock>("ElevationText");
        if (elevationText != null)
            elevationText.Foreground = new SolidColorBrush(Color.Parse(elevated ? "#62C295" : "#E58A80"));
        var elevationPill = this.FindControl<Border>("ElevationPill");
        if (elevationPill != null)
            elevationPill.Background = new SolidColorBrush(Color.Parse(elevated ? "#16291F" : "#2E1A18"));
    }

    private void AppendLog(string level, string message)
    {
        var box = this.FindControl<TextBox>("LogBox");
        if (box == null) return;

        string text = box.Text + $"{DateTime.Now:HH:mm:ss}  {level,-4}  {message}{Environment.NewLine}";
        if (text.Length > 120_000) text = text[^100_000..];   // keep the pane bounded
        box.Text = text;
        box.CaretIndex = box.Text.Length;
    }

    // ------------------------------------------------------------- helpers

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

    private bool Check(string name) => this.FindControl<CheckBox>(name)?.IsChecked == true;
    private void SetCheck(string name, bool value)
    {
        var box = this.FindControl<CheckBox>(name);
        if (box != null) box.IsChecked = value;
    }

    private string Text(string name) => this.FindControl<TextBox>(name)?.Text?.Trim();
    private void SetText(string name, string value)
    {
        var box = this.FindControl<TextBox>(name);
        if (box != null) box.Text = value;
    }

    private void SetTextBlock(string name, string value)
    {
        var block = this.FindControl<TextBlock>(name);
        if (block != null) block.Text = value;
    }

    private int ParseInt(string name, int fallback) =>
        int.TryParse(Text(name), out int value) ? value : fallback;

    private string ComboText(string name)
    {
        var combo = this.FindControl<ComboBox>(name);
        return (combo?.SelectedItem as ComboBoxItem)?.Content?.ToString();
    }

    private void SetCombo(string name, string value)
    {
        var combo = this.FindControl<ComboBox>(name);
        if (combo == null) return;
        for (int i = 0; i < combo.ItemCount; i++)
        {
            if (combo.Items[i] is ComboBoxItem item &&
                string.Equals(item.Content?.ToString(), value, StringComparison.OrdinalIgnoreCase))
            {
                combo.SelectedIndex = i;
                return;
            }
        }
    }
}
