using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Markup.Xaml;
using Avalonia.Threading;

namespace GamePrio.App;

/// <summary>
/// A separate always-on-top window, not an in-game overlay. Nothing is injected into
/// the game, so it costs nothing in anti-cheat exposure - the trade is that it shows
/// over borderless and windowed games, but not over exclusive fullscreen.
/// </summary>
public partial class HudWindow : Window
{
    private readonly LiveMonitor _monitor;

    public HudWindow(LiveMonitor monitor)
    {
        AvaloniaXamlLoader.Load(this);
        _monitor = monitor;
        _monitor.Updated += OnStats;

        // No title bar, so the whole panel drags, and a click on the corner closes it.
        PointerPressed += (_, e) =>
        {
            var point = e.GetCurrentPoint(this);
            if (point.Position.X > Width - 22 && point.Position.Y < 22) { Close(); return; }
            if (point.Properties.IsLeftButtonPressed) BeginMoveDrag(e);
        };

        Closed += (_, _) => _monitor.Updated -= OnStats;
    }

    private void OnStats(LiveStats stats) => Dispatcher.UIThread.Post(() =>
    {
        Set("FpsText", stats.HasFrameData ? stats.Fps.ToString("0") : "--");
        Set("FrameTimeText", stats.HasFrameData ? $"{stats.FrameTimeMs:0.0} ms" : "--");
        Set("LowText", stats.OnePercentLowFps > 0 ? $"{stats.OnePercentLowFps:0} fps" : "collecting...");
        Set("StutterText", stats.OnePercentLowFps > 0 ? stats.StuttersLastMinute.ToString() : "--");
        Set("SystemText", $"{stats.CpuPercent:0}%  /  {stats.RamPercent:0}%");
        Set("NoteText", stats.Note);

        var note = this.FindControl<TextBlock>("NoteText");
        if (note != null) note.IsVisible = !string.IsNullOrEmpty(stats.Note);
    });

    private void Set(string name, string value)
    {
        var block = this.FindControl<TextBlock>(name);
        if (block != null) block.Text = value;
    }
}
