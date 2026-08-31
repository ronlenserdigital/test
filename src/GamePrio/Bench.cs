using System.Diagnostics;
using System.Globalization;

namespace GamePrio;

/// <summary>
/// The point of the whole tool: prove whether the profile did anything.
/// Alternates baseline and profiled captures (A B A B ...) so thermal drift and
/// driver warm-up hit both arms equally, then reports the difference with a
/// bootstrap confidence interval. A CI that straddles zero means "no effect measured".
/// </summary>
internal static class Bench
{
    public sealed record Capture(string Label, double[] FrameTimesMs)
    {
        public double AvgFps => 1000.0 / Stats.Mean(FrameTimesMs);
        public double OnePercentLowFps => 1000.0 / Stats.MeanOfWorst(FrameTimesMs, 0.01);
        public double PointOnePercentLowFps => 1000.0 / Stats.MeanOfWorst(FrameTimesMs, 0.001);
        public double StuttersPerMinute
        {
            get
            {
                if (FrameTimesMs.Length == 0) return 0;
                double median = Stats.Percentile(FrameTimesMs, 50);
                int spikes = FrameTimesMs.Count(f => f > median * 2.0);
                double minutes = FrameTimesMs.Sum() / 60_000.0;
                return minutes > 0 ? spikes / minutes : 0;
            }
        }
    }

    public static void Run(Profile profile, Governor governor, int seconds, int runs)
    {
        var game = GameWatcher.FindGame(profile);
        if (game == null)
        {
            Log.Error("no game from the profile is running - start it, load a repeatable scene, then re-run");
            return;
        }

        string exe = game.ProcessName + ".exe";
        Log.Info($"benchmarking {exe}: {runs} x {seconds}s per arm, interleaved");
        Log.Warn("park the game somewhere repeatable (a menu, a benchmark loop, a quiet corner) and do not touch it");

        var baseline = new List<Capture>();
        var profiled = new List<Capture>();

        for (int i = 0; i < runs; i++)
        {
            // --- A: baseline, nothing applied
            RestoreAny(governor);
            Countdown("baseline", 5);
            var a = CaptureOnce(profile, exe, seconds, "baseline");
            if (a != null) baseline.Add(a);

            // --- B: profile applied
            var journal = governor.Apply(game);
            Countdown("profiled", 5);
            var b = CaptureOnce(profile, exe, seconds, "profiled");
            if (b != null) profiled.Add(b);
            governor.Restore(journal);
        }

        if (baseline.Count == 0 || profiled.Count == 0)
        {
            Log.Error("no usable captures - check the PresentMon path and argument template in the profile");
            return;
        }

        Report(
            new Capture("baseline", baseline.SelectMany(c => c.FrameTimesMs).ToArray()),
            new Capture("profiled", profiled.SelectMany(c => c.FrameTimesMs).ToArray()));
    }

    private static void RestoreAny(Governor governor)
    {
        var stale = Journal.Load();
        if (stale != null) governor.Restore(stale);
    }

    private static void Countdown(string label, int seconds)
    {
        Log.Info($"  {label} capture starts in {seconds}s - hands off the game");
        Thread.Sleep(seconds * 1000);
    }

    private static Capture CaptureOnce(Profile profile, string exe, int seconds, string label)
    {
        string csv = Path.Combine(Path.GetTempPath(), $"gameprio_{label}_{DateTime.Now:HHmmss}.csv");

        string args = profile.Bench.PresentMonArgs
            .Replace("{process}", exe)
            .Replace("{out}", $"\"{csv}\"")
            .Replace("{seconds}", seconds.ToString());

        Log.Dim($"  {profile.Bench.PresentMonPath} {args}");
        var result = Tuners.Run(profile.Bench.PresentMonPath, args);

        if (!File.Exists(csv))
        {
            Log.Warn($"  no capture file produced ({result.Output.Trim()})");
            return null;
        }

        double[] frames = ParseFrameTimes(csv);
        try { File.Delete(csv); } catch { }

        if (frames.Length < 100)
        {
            Log.Warn($"  only {frames.Length} frames captured - too few to say anything");
            return null;
        }

        var capture = new Capture(label, frames);
        Log.Info($"  {label}: {capture.AvgFps:0.0} fps avg, {capture.OnePercentLowFps:0.0} fps 1% low, " +
                 $"{frames.Length} frames");
        return capture;
    }

    internal static double[] ParseFrameTimes(string csvPath)
    {
        string[] candidates = { "msbetweenpresents", "msbetweendisplaychange", "framtime", "frametime" };
        var values = new List<double>();

        using var reader = new StreamReader(csvPath);
        string header = reader.ReadLine();
        if (header == null) return Array.Empty<double>();

        var columns = header.Split(',').Select(c => c.Trim().Trim('"').ToLowerInvariant()).ToArray();
        int index = -1;
        foreach (var candidate in candidates)
        {
            index = Array.IndexOf(columns, candidate);
            if (index >= 0) break;
        }
        if (index < 0)
        {
            Log.Warn($"  no frame-time column in {Path.GetFileName(csvPath)} (saw: {string.Join(", ", columns.Take(12))})");
            return Array.Empty<double>();
        }

        string line;
        while ((line = reader.ReadLine()) != null)
        {
            var cells = line.Split(',');
            if (cells.Length <= index) continue;
            if (double.TryParse(cells[index].Trim().Trim('"'), NumberStyles.Float, CultureInfo.InvariantCulture, out double ms)
                && ms > 0 && ms < 10_000)
                values.Add(ms);
        }
        return values.ToArray();
    }

    private static void Report(Capture a, Capture b)
    {
        Log.Info("");
        Log.Info("  metric                baseline    profiled      delta");
        Log.Info("  ......................................................");
        Row("average fps", a.AvgFps, b.AvgFps);
        Row("1% low fps", a.OnePercentLowFps, b.OnePercentLowFps);
        Row("0.1% low fps", a.PointOnePercentLowFps, b.PointOnePercentLowFps);
        Row("stutters / min", a.StuttersPerMinute, b.StuttersPerMinute, lowerIsBetter: true);
        Log.Info("");

        var (lo, hi) = Stats.BootstrapMeanFpsDifferenceCI(a.FrameTimesMs, b.FrameTimesMs);
        Log.Info($"  95% CI on the average-fps difference: {lo:+0.00;-0.00} .. {hi:+0.00;-0.00} fps");

        if (lo <= 0 && hi >= 0)
            Log.Warn("  the interval contains zero: this run did NOT measure a real average-fps effect.");
        else if (lo > 0)
            Log.Good("  the interval is entirely above zero: a real average-fps gain on this scene.");
        else
            Log.Error("  the interval is entirely below zero: the profile made average fps WORSE here.");

        Log.Info("  (1% lows are the number to watch - contention shows up as stutter, not as average fps.)");
    }

    private static void Row(string name, double a, double b, bool lowerIsBetter = false)
    {
        double delta = b - a;
        bool better = lowerIsBetter ? delta < 0 : delta > 0;
        string line = $"  {name,-20} {a,9:0.00} {b,11:0.00}   {delta,8:+0.00;-0.00}";

        if (Math.Abs(delta) < 0.005) Log.Dim(line);
        else if (better) Log.Good(line);
        else Log.Error(line);
    }
}

internal static class Stats
{
    public static double Mean(double[] xs) => xs.Length == 0 ? 0 : xs.Sum() / xs.Length;

    public static double Percentile(double[] xs, double p)
    {
        if (xs.Length == 0) return 0;
        var sorted = (double[])xs.Clone();
        Array.Sort(sorted);
        double rank = (p / 100.0) * (sorted.Length - 1);
        int lo = (int)Math.Floor(rank), hi = (int)Math.Ceiling(rank);
        return lo == hi ? sorted[lo] : sorted[lo] + (rank - lo) * (sorted[hi] - sorted[lo]);
    }

    /// <summary>Mean of the slowest <paramref name="fraction"/> of frames - the usual "1% low" convention.</summary>
    public static double MeanOfWorst(double[] frameTimes, double fraction)
    {
        if (frameTimes.Length == 0) return 0;
        var sorted = (double[])frameTimes.Clone();
        Array.Sort(sorted);
        int take = Math.Max(1, (int)(sorted.Length * fraction));
        double sum = 0;
        for (int i = sorted.Length - take; i < sorted.Length; i++) sum += sorted[i];
        return sum / take;
    }

    /// <summary>Percentile bootstrap CI on mean-fps(b) - mean-fps(a). 2000 resamples.</summary>
    public static (double Low, double High) BootstrapMeanFpsDifferenceCI(double[] a, double[] b, int iterations = 2000)
    {
        if (a.Length == 0 || b.Length == 0) return (0, 0);
        var rng = new Random(20260831);
        var diffs = new double[iterations];

        for (int i = 0; i < iterations; i++)
        {
            double fpsA = 1000.0 / ResampleMean(a, rng);
            double fpsB = 1000.0 / ResampleMean(b, rng);
            diffs[i] = fpsB - fpsA;
        }

        Array.Sort(diffs);
        return (diffs[(int)(iterations * 0.025)], diffs[(int)(iterations * 0.975)]);
    }

    private static double ResampleMean(double[] xs, Random rng)
    {
        double sum = 0;
        for (int i = 0; i < xs.Length; i++) sum += xs[rng.Next(xs.Length)];
        return sum / xs.Length;
    }
}
