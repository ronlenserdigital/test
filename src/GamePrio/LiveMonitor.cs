using System.Diagnostics;
using System.Globalization;

namespace GamePrio;

public readonly record struct LiveStats(
    bool HasFrameData,
    double Fps,
    double FrameTimeMs,
    double OnePercentLowFps,
    int StuttersLastMinute,
    double CpuPercent,
    double RamPercent,
    string Note);

/// <summary>
/// Live frame pacing without going anywhere near the game process: PresentMon streams
/// present events off ETW, we parse its stdout. No injection, no handle, no overlay
/// inside the game - the HUD is a separate always-on-top window.
/// </summary>
public sealed class LiveMonitor : IDisposable
{
    private const int RollingSeconds = 5;
    private const int LowsWindowSeconds = 60;

    private readonly object _gate = new();
    private readonly Queue<(DateTime At, double Ms)> _frames = new();
    private Process _presentMon;
    private System.Threading.Timer _ticker;
    private string _note = "";
    private long _prevIdle, _prevKernel, _prevUser;

    public event Action<LiveStats> Updated;

    public bool IsRunning => _presentMon is { HasExited: false };

    public void Start(Profile profile, string processName)
    {
        Stop();

        string args = profile.Bench.PresentMonLiveArgs.Replace("{process}", processName + ".exe");
        try
        {
            var psi = new ProcessStartInfo(profile.Bench.PresentMonPath, args)
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            _presentMon = Process.Start(psi);

            if (_presentMon == null) _note = "PresentMon did not start";
            else
            {
                _note = "";
                Task.Run(() => Pump(_presentMon));
            }
        }
        catch (Exception ex)
        {
            _presentMon = null;
            _note = "no frame data - " + ex.Message;
        }

        if (_presentMon == null && _note.Length == 0)
            _note = "no frame data - PresentMon not found";

        _ticker = new System.Threading.Timer(_ => Publish(), null, 250, 250);
    }

    /// <summary>Reads PresentMon's CSV stdout a line at a time and keeps the recent frames.</summary>
    private void Pump(Process presentMon)
    {
        int column = -1;
        string[] candidates = { "msbetweenpresents", "msbetweendisplaychange", "frametime" };

        try
        {
            string line;
            while ((line = presentMon.StandardOutput.ReadLine()) != null)
            {
                var cells = line.Split(',');

                if (column < 0)
                {
                    // The first line PresentMon emits is the header.
                    var headers = cells.Select(c => c.Trim().Trim('"').ToLowerInvariant()).ToArray();
                    foreach (var candidate in candidates)
                    {
                        column = Array.IndexOf(headers, candidate);
                        if (column >= 0) break;
                    }
                    if (column < 0) _note = "PresentMon output has no frame-time column";
                    continue;
                }

                if (cells.Length <= column) continue;
                if (!double.TryParse(cells[column].Trim().Trim('"'), NumberStyles.Float,
                        CultureInfo.InvariantCulture, out double ms)) continue;
                if (ms <= 0 || ms > 10_000) continue;

                lock (_gate)
                {
                    var now = DateTime.UtcNow;
                    _frames.Enqueue((now, ms));
                    while (_frames.Count > 0 && (now - _frames.Peek().At).TotalSeconds > LowsWindowSeconds)
                        _frames.Dequeue();
                }
            }
        }
        catch { /* the stream ends when PresentMon exits */ }
    }

    private void Publish()
    {
        (DateTime At, double Ms)[] snapshot;
        lock (_gate) snapshot = _frames.ToArray();

        var now = DateTime.UtcNow;
        var recent = snapshot.Where(f => (now - f.At).TotalSeconds <= RollingSeconds)
                             .Select(f => f.Ms).ToArray();
        var window = snapshot.Select(f => f.Ms).ToArray();

        bool hasData = recent.Length >= 5;
        double frameMs = hasData ? recent.Average() : 0;
        double fps = frameMs > 0 ? 1000.0 / frameMs : 0;
        double low = window.Length >= 100 ? 1000.0 / Stats.MeanOfWorst(window, 0.01) : 0;

        int stutters = 0;
        if (window.Length >= 100)
        {
            double median = Stats.Percentile(window, 50);
            stutters = window.Count(f => f > median * 2.0);
        }

        Updated?.Invoke(new LiveStats(
            hasData, fps, frameMs, low, stutters, ReadCpuPercent(), ReadRamPercent(),
            hasData ? "" : (_note.Length > 0 ? _note : "waiting for frames...")));
    }

    private double ReadCpuPercent()
    {
        if (!Native.GetSystemTimes(out long idle, out long kernel, out long user)) return 0;

        long idleDelta = idle - _prevIdle;
        long totalDelta = (kernel - _prevKernel) + (user - _prevUser);
        _prevIdle = idle; _prevKernel = kernel; _prevUser = user;

        if (totalDelta <= 0) return 0;
        return Math.Clamp(100.0 * (totalDelta - idleDelta) / totalDelta, 0, 100);
    }

    private static double ReadRamPercent()
    {
        var status = new Native.MEMORYSTATUSEX
        {
            dwLength = (uint)System.Runtime.InteropServices.Marshal.SizeOf<Native.MEMORYSTATUSEX>()
        };
        return Native.GlobalMemoryStatusEx(ref status) ? status.dwMemoryLoad : 0;
    }

    public void Stop()
    {
        _ticker?.Dispose();
        _ticker = null;

        try { if (_presentMon is { HasExited: false }) _presentMon.Kill(entireProcessTree: true); }
        catch { }
        _presentMon?.Dispose();
        _presentMon = null;

        lock (_gate) _frames.Clear();
    }

    public void Dispose() => Stop();
}
