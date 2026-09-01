using System.Net.NetworkInformation;
using System.Runtime.InteropServices;

namespace GamePrio;

public readonly record struct SystemStats(
    double CpuPercent,
    double RamPercent,
    double RamUsedGb,
    double RamTotalGb,
    double GpuPercent,
    double DownMbps,
    double UpMbps,
    string Adapter,
    double PingMs,
    double JitterMs,
    double LossPercent,
    string PingTarget,
    IReadOnlyList<double> PingHistory);

/// <summary>
/// Live machine and connection telemetry for the PERFORMANCE tab. Everything here is read
/// from Windows directly - no vendor SDKs, no injected agents, nothing that needs the game.
/// </summary>
public sealed class SystemMonitor : IDisposable
{
    private const int PingHistoryLength = 60;

    private readonly object _gate = new();
    private readonly Queue<double> _pings = new();
    private readonly Queue<bool> _pingResults = new();

    private System.Threading.Timer _timer;
    private long _prevIdle, _prevKernel, _prevUser;
    private long _prevBytesDown, _prevBytesUp;
    private DateTime _prevSample = DateTime.MinValue;
    private string _adapter = "-";
    private Ping _ping;
    private string _target = "1.1.1.1";
    private int _pingInFlight;

    public event Action<SystemStats> Updated;

    public void Start(string pingTarget)
    {
        Stop();
        if (!string.IsNullOrWhiteSpace(pingTarget)) _target = pingTarget.Trim();

        _ping = new Ping();
        Gpu.Open();
        _timer = new System.Threading.Timer(_ => Tick(), null, 300, 1000);
    }

    private void Tick()
    {
        try
        {
            var (down, up, adapter) = ReadNetwork();
            SendPing();

            double[] history;
            double avg = 0, jitter = 0, loss = 0;
            lock (_gate)
            {
                history = _pings.ToArray();
                if (history.Length > 0)
                {
                    avg = history.Average();
                    // Mean absolute deviation between consecutive samples - what jitter is.
                    if (history.Length > 1)
                    {
                        double sum = 0;
                        for (int i = 1; i < history.Length; i++) sum += Math.Abs(history[i] - history[i - 1]);
                        jitter = sum / (history.Length - 1);
                    }
                }
                if (_pingResults.Count > 0)
                    loss = 100.0 * _pingResults.Count(r => !r) / _pingResults.Count;
            }

            var memory = ReadMemory();

            Updated?.Invoke(new SystemStats(
                ReadCpuPercent(), memory.Percent, memory.UsedGb, memory.TotalGb,
                Gpu.Read(), down, up, adapter,
                avg, jitter, loss, _target, history));
        }
        catch (Exception ex) { Log.Dim($"monitor tick: {ex.Message}"); }
    }

    // --------------------------------------------------------------- sources

    private double ReadCpuPercent()
    {
        if (!Native.GetSystemTimes(out long idle, out long kernel, out long user)) return 0;

        long idleDelta = idle - _prevIdle;
        long totalDelta = (kernel - _prevKernel) + (user - _prevUser);
        _prevIdle = idle; _prevKernel = kernel; _prevUser = user;

        if (totalDelta <= 0) return 0;
        return Math.Clamp(100.0 * (totalDelta - idleDelta) / totalDelta, 0, 100);
    }

    private static (double Percent, double UsedGb, double TotalGb) ReadMemory()
    {
        var status = new Native.MEMORYSTATUSEX { dwLength = (uint)Marshal.SizeOf<Native.MEMORYSTATUSEX>() };
        if (!Native.GlobalMemoryStatusEx(ref status)) return (0, 0, 0);

        double total = status.ullTotalPhys / 1073741824.0;
        double used = (status.ullTotalPhys - status.ullAvailPhys) / 1073741824.0;
        return (status.dwMemoryLoad, used, total);
    }

    /// <summary>Throughput on the busiest live adapter, which is the one carrying the game.</summary>
    private (double Down, double Up, string Adapter) ReadNetwork()
    {
        long down = 0, up = 0;
        string name = _adapter;
        long best = -1;

        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;
            if (nic.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel) continue;

            var stats = nic.GetIPStatistics();
            long total = stats.BytesReceived + stats.BytesSent;
            if (total <= best) continue;

            best = total;
            down = stats.BytesReceived;
            up = stats.BytesSent;
            name = nic.Name;
        }

        var now = DateTime.UtcNow;
        double seconds = _prevSample == DateTime.MinValue ? 0 : (now - _prevSample).TotalSeconds;

        double downMbps = 0, upMbps = 0;
        if (seconds > 0 && name == _adapter && down >= _prevBytesDown && up >= _prevBytesUp)
        {
            downMbps = (down - _prevBytesDown) * 8.0 / seconds / 1_000_000.0;
            upMbps = (up - _prevBytesUp) * 8.0 / seconds / 1_000_000.0;
        }

        _prevBytesDown = down; _prevBytesUp = up; _prevSample = now; _adapter = name;
        return (downMbps, upMbps, name);
    }

    /// <summary>One outstanding probe at a time, so a stalled reply cannot pile up.</summary>
    private void SendPing()
    {
        if (Interlocked.Exchange(ref _pingInFlight, 1) == 1) return;

        Task.Run(async () =>
        {
            try
            {
                var reply = await _ping.SendPingAsync(_target, 1000);
                lock (_gate)
                {
                    bool ok = reply.Status == IPStatus.Success;
                    if (ok)
                    {
                        _pings.Enqueue(reply.RoundtripTime);
                        while (_pings.Count > PingHistoryLength) _pings.Dequeue();
                    }
                    _pingResults.Enqueue(ok);
                    while (_pingResults.Count > PingHistoryLength) _pingResults.Dequeue();
                }
            }
            catch
            {
                lock (_gate)
                {
                    _pingResults.Enqueue(false);
                    while (_pingResults.Count > PingHistoryLength) _pingResults.Dequeue();
                }
            }
            finally { Interlocked.Exchange(ref _pingInFlight, 0); }
        });
    }

    public void Stop()
    {
        _timer?.Dispose();
        _timer = null;
        _ping?.Dispose();
        _ping = null;
        Gpu.Close();
        lock (_gate) { _pings.Clear(); _pingResults.Clear(); }
        _prevSample = DateTime.MinValue;
    }

    public void Dispose() => Stop();

    // ------------------------------------------------------------------ GPU

    /// <summary>
    /// GPU utilisation from the performance counters Windows already publishes, read
    /// through PDH rather than by spawning PowerShell every second.
    /// </summary>
    private static class Gpu
    {
        private const uint PDH_FMT_DOUBLE = 0x00000200;
        private static IntPtr _query, _counter;
        private static bool _primed;

        [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
        private static extern uint PdhOpenQueryW(string dataSource, IntPtr userData, out IntPtr query);

        [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
        private static extern uint PdhAddEnglishCounterW(IntPtr query, string path, IntPtr userData, out IntPtr counter);

        [DllImport("pdh.dll")]
        private static extern uint PdhCollectQueryData(IntPtr query);

        [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
        private static extern uint PdhGetFormattedCounterArrayW(
            IntPtr counter, uint format, ref uint bufferSize, out uint itemCount, IntPtr buffer);

        [DllImport("pdh.dll")]
        private static extern uint PdhCloseQuery(IntPtr query);

        [StructLayout(LayoutKind.Sequential)]
        private struct PDH_FMT_COUNTERVALUE_ITEM
        {
            public IntPtr szName;
            public uint CStatus;
            private readonly uint _padding;
            public double doubleValue;
        }

        public static void Open()
        {
            try
            {
                if (_query != IntPtr.Zero) return;
                if (PdhOpenQueryW(null, IntPtr.Zero, out _query) != 0) { _query = IntPtr.Zero; return; }

                // 3D engine only: summing every engine type double-counts copy and video work.
                if (PdhAddEnglishCounterW(_query, @"\GPU Engine(*engtype_3D)\Utilization Percentage",
                        IntPtr.Zero, out _counter) != 0)
                {
                    Close();
                    return;
                }

                PdhCollectQueryData(_query);   // first collect only establishes a baseline
                _primed = true;
            }
            catch { Close(); }
        }

        public static double Read()
        {
            if (_query == IntPtr.Zero || !_primed) return -1;

            try
            {
                if (PdhCollectQueryData(_query) != 0) return -1;

                uint size = 0, count = 0;
                PdhGetFormattedCounterArrayW(_counter, PDH_FMT_DOUBLE, ref size, out count, IntPtr.Zero);
                if (size == 0) return -1;

                IntPtr buffer = Marshal.AllocHGlobal((int)size);
                try
                {
                    if (PdhGetFormattedCounterArrayW(_counter, PDH_FMT_DOUBLE, ref size, out count, buffer) != 0)
                        return -1;

                    double total = 0;
                    int stride = Marshal.SizeOf<PDH_FMT_COUNTERVALUE_ITEM>();
                    for (int i = 0; i < count; i++)
                    {
                        var item = Marshal.PtrToStructure<PDH_FMT_COUNTERVALUE_ITEM>(IntPtr.Add(buffer, i * stride));
                        if (item.CStatus == 0 && item.doubleValue > 0) total += item.doubleValue;
                    }
                    return Math.Clamp(total, 0, 100);
                }
                finally { Marshal.FreeHGlobal(buffer); }
            }
            catch { return -1; }
        }

        public static void Close()
        {
            try { if (_query != IntPtr.Zero) PdhCloseQuery(_query); } catch { }
            _query = IntPtr.Zero;
            _counter = IntPtr.Zero;
            _primed = false;
        }
    }
}
