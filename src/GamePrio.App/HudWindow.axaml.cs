using System.Runtime.InteropServices;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using Avalonia.Threading;

namespace GamePrio.App;

/// <summary>
/// A separate always-on-top window, not an in-game overlay: nothing is injected into the
/// game, so it costs nothing in anti-cheat exposure. It parks in the top-left corner,
/// paints no background, and is click-through - the mouse passes straight to the game, so
/// it can never eat a shot. Close it from the main window's FPS counter button.
/// </summary>
public partial class HudWindow : Window
{
    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_TRANSPARENT = 0x20;      // mouse passes through
    private const int WS_EX_NOACTIVATE = 0x8000000;  // never steals focus from the game
    private const int WS_EX_TOOLWINDOW = 0x80;       // stays out of alt-tab

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowLong(IntPtr hWnd, int index);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int SetWindowLong(IntPtr hWnd, int index, int newStyle);

    private readonly LiveMonitor _monitor;

    public HudWindow(LiveMonitor monitor)
    {
        AvaloniaXamlLoader.Load(this);
        _monitor = monitor;
        _monitor.Updated += OnStats;

        Opened += (_, _) =>
        {
            ParkTopLeft();
            MakeClickThrough();
        };
        Closed += (_, _) => _monitor.Updated -= OnStats;
    }

    /// <summary>Top-left of the working area, inset enough to clear a game's own HUD edge.</summary>
    private void ParkTopLeft()
    {
        try
        {
            var screen = Screens.Primary ?? Screens.All.FirstOrDefault();
            if (screen == null) { Position = new PixelPoint(24, 24); return; }

            var area = screen.WorkingArea;
            Position = new PixelPoint(area.X + 24, area.Y + 24);
        }
        catch { Position = new PixelPoint(24, 24); }
    }

    private void MakeClickThrough()
    {
        try
        {
            var handle = TryGetPlatformHandle()?.Handle ?? IntPtr.Zero;
            if (handle == IntPtr.Zero) return;

            int style = GetWindowLong(handle, GWL_EXSTYLE);
            SetWindowLong(handle, GWL_EXSTYLE, style | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW);
        }
        catch { /* a non-click-through overlay still beats no overlay */ }
    }

    private void OnStats(LiveStats stats) => Dispatcher.UIThread.Post(() =>
    {
        Set("FpsText", stats.HasFrameData ? stats.Fps.ToString("0") : "--");
        Set("FrameTimeText", stats.HasFrameData ? $"{stats.FrameTimeMs:0.0} ms" : "--");
        Set("LowText", stats.OnePercentLowFps > 0 ? $"{stats.OnePercentLowFps:0}" : "--");
        Set("StutterText", stats.OnePercentLowFps > 0 ? $"{stats.StuttersLastMinute}/min" : "--");
        Set("SystemText", $"{stats.CpuPercent:0}%  {stats.RamPercent:0}%");
        Set("NoteText", stats.Note);

        if (this.FindControl<Control>("NoteText") is TextBlock note)
            note.IsVisible = !string.IsNullOrEmpty(stats.Note);
    });

    private void Set(string name, string value)
    {
        // FindControl<T> throws on a type mismatch rather than returning null.
        if (this.FindControl<Control>(name) is TextBlock block) block.Text = value;
    }
}
