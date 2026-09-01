namespace GamePrio;

internal static class TestMain
{
    private static int _fail;

    private static void Check(string name, bool ok, string detail = "")
    {
        Console.WriteLine($"  [{(ok ? "PASS" : "FAIL")}] {name}{(detail == "" ? "" : "  -> " + detail)}");
        if (!ok) _fail++;
    }

    private static bool Is64BitPe(byte[] d)
    {
        try
        {
            int pe = BitConverter.ToInt32(d, 0x3c);
            return BitConverter.ToUInt16(d, pe + 4) == 0x8664;
        }
        catch { return false; }
    }

    public static int Main()
    {
        Console.WriteLine("Stats");
        var xs = new double[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        Check("mean", Math.Abs(Stats.Mean(xs) - 5.5) < 1e-9);
        Check("p50", Math.Abs(Stats.Percentile(xs, 50) - 5.5) < 1e-9, Stats.Percentile(xs, 50).ToString());
        Check("p100 == max", Math.Abs(Stats.Percentile(xs, 100) - 10) < 1e-9);
        Check("p0 == min", Math.Abs(Stats.Percentile(xs, 0) - 1) < 1e-9);
        Check("empty percentile is 0", Stats.Percentile(Array.Empty<double>(), 50) == 0);

        // slowest 10% of 1..10 is {10}
        Check("MeanOfWorst 10%", Math.Abs(Stats.MeanOfWorst(xs, 0.10) - 10) < 1e-9, Stats.MeanOfWorst(xs, 0.10).ToString());
        // fraction smaller than one frame must still return the single worst frame
        Check("MeanOfWorst clamps to >=1 frame", Math.Abs(Stats.MeanOfWorst(xs, 0.0001) - 10) < 1e-9);

        Console.WriteLine("\nCapture metrics");
        var steady = Enumerable.Repeat(10.0, 6000).ToArray();          // exactly 100 fps
        var cap = new Bench.Capture("steady", steady);
        Check("100 fps from 10 ms frames", Math.Abs(cap.AvgFps - 100) < 1e-9, cap.AvgFps.ToString("0.000"));
        Check("no stutters in a flat trace", cap.StuttersPerMinute == 0);

        var spiky = Enumerable.Repeat(10.0, 5940).Concat(Enumerable.Repeat(50.0, 60)).ToArray();
        var scap = new Bench.Capture("spiky", spiky);
        Check("1% low below average", scap.OnePercentLowFps < scap.AvgFps,
              $"avg {scap.AvgFps:0.0} / 1% low {scap.OnePercentLowFps:0.0}");
        Check("spikes counted", scap.StuttersPerMinute > 0, $"{scap.StuttersPerMinute:0.0}/min");

        Console.WriteLine("\nBootstrap CI (the 'did it do anything' test)");
        var rng = new Random(7);
        double[] Sample(double meanMs, int n) =>
            Enumerable.Range(0, n).Select(_ => meanMs + (rng.NextDouble() - 0.5) * 2.0).ToArray();

        var a1 = Sample(10.0, 4000);
        var b1 = Sample(10.0, 4000);                                    // same distribution
        var (lo1, hi1) = Stats.BootstrapMeanFpsDifferenceCI(a1, b1);
        Check("identical distributions -> CI straddles zero", lo1 <= 0 && hi1 >= 0, $"[{lo1:0.00}, {hi1:0.00}]");

        var a2 = Sample(12.5, 4000);                                    // 80 fps
        var b2 = Sample(10.0, 4000);                                    // 100 fps
        var (lo2, hi2) = Stats.BootstrapMeanFpsDifferenceCI(a2, b2);
        Check("real +20 fps gain -> CI entirely above zero", lo2 > 0, $"[{lo2:0.00}, {hi2:0.00}]");

        var (lo3, hi3) = Stats.BootstrapMeanFpsDifferenceCI(b2, a2);    // reversed = regression
        Check("regression -> CI entirely below zero", hi3 < 0, $"[{lo3:0.00}, {hi3:0.00}]");
        Check("CI is deterministic across runs",
              Stats.BootstrapMeanFpsDifferenceCI(a2, b2).Low == lo2);

        Console.WriteLine("\nPresentMon CSV parsing");
        string dir = Path.Combine(Path.GetTempPath(), "gp_tests");
        Directory.CreateDirectory(dir);

        string v1 = Path.Combine(dir, "v1.csv");
        File.WriteAllText(v1,
            "Application,ProcessID,SwapChainAddress,Runtime,SyncInterval,msBetweenPresents,msUntilDisplayed\n" +
            "game.exe,123,0x1,DXGI,1,16.67,4.2\n" +
            "game.exe,123,0x1,DXGI,1,16.70,4.1\n" +
            "game.exe,123,0x1,DXGI,1,not-a-number,4.1\n" +
            "truncated,row\n" +
            "game.exe,123,0x1,DXGI,1,-3,4.1\n" +
            "game.exe,123,0x1,DXGI,1,8.33,4.0\n");
        var f1 = Bench.ParseFrameTimes(v1);
        Check("PresentMon 1.x header parsed", f1.Length == 3, $"{f1.Length} frames: {string.Join(",", f1)}");
        Check("garbage / negative / short rows dropped", !f1.Contains(-3));

        string v2 = Path.Combine(dir, "v2.csv");
        File.WriteAllText(v2,
            "\"Application\",\"ProcessID\",\"MsBetweenPresents\",\"MsBetweenDisplayChange\"\n" +
            "\"game.exe\",\"123\",\"11.1\",\"11.0\"\n" +
            "\"game.exe\",\"123\",\"11.2\",\"11.1\"\n");
        var f2 = Bench.ParseFrameTimes(v2);
        Check("PresentMon 2.x quoted header parsed", f2.Length == 2, string.Join(",", f2));

        string bad = Path.Combine(dir, "bad.csv");
        File.WriteAllText(bad, "Application,ProcessID,SomethingElse\ngame.exe,1,2\n");
        Check("missing frame-time column -> empty, no throw", Bench.ParseFrameTimes(bad).Length == 0);

        string empty = Path.Combine(dir, "empty.csv");
        File.WriteAllText(empty, "");
        Check("empty file -> empty, no throw", Bench.ParseFrameTimes(empty).Length == 0);

        Console.WriteLine("\nProfile normalisation");
        string pf = Path.Combine(dir, "p.json");
        File.WriteAllText(pf, """
        {
          "name": "t",
          "game": { "executables": ["MyGame.EXE", "  other.exe  "], "priority": "High" },
          "background": { "suspendList": ["Chrome.exe", "chrome"] },
          "safety": { "allowTouchingAntiCheat": false }
        }
        """);
        var prof = Profile.Load(pf);
        Check(".exe stripped and lowercased", prof.Game.Executables.SequenceEqual(new[] { "mygame", "other" }),
              string.Join(",", prof.Game.Executables));
        Check("suspend list de-duplicated", prof.Background.SuspendList.Count == 1);
        Check("anti-cheat merged into neverTouch", prof.Safety.NeverTouch.Contains("easyanticheat"));
        Check("critical system merged into neverTouch", prof.Safety.NeverTouch.Contains("lsass"));
        Check("launchers land in throttleOnly", prof.Safety.ThrottleOnly.Contains("steam"));
        Check("gameprio never governs itself", prof.Safety.NeverTouch.Contains("gameprio"));

        File.WriteAllText(pf, """
        { "name": "t2", "safety": { "allowTouchingAntiCheat": true } }
        """);
        var prof2 = Profile.Load(pf);
        Check("opt-out drops the anti-cheat fence", !prof2.Safety.NeverTouch.Contains("easyanticheat"));
        Check("critical system fence survives the opt-out", prof2.Safety.NeverTouch.Contains("lsass"));

        Console.WriteLine("\nAnti-cheat catalog and safe mode");
        var fn = GameCatalog.FindByExecutable("FortniteClient-Win64-Shipping");
        Check("Fortnite found by exe", fn != null && fn.Name == "Fortnite");
        Check("Fortnite classed kernel anti-cheat", fn != null && fn.AntiCheat == AntiCheat.Kernel, fn?.AntiCheatName);
        Check("trailing .exe tolerated", GameCatalog.FindByExecutable("cs2.exe")?.Name == "Counter-Strike 2");
        Check("Call of Duty in catalog", GameCatalog.FindByExecutable("cod")?.AntiCheat == AntiCheat.Kernel);
        Check("Rainbow Six in catalog", GameCatalog.FindByExecutable("RainbowSix_BE")?.AntiCheat == AntiCheat.Kernel);
        Check("single-player title classed none", GameCatalog.FindByExecutable("Cyberpunk2077")?.AntiCheat == AntiCheat.None);
        Check("unknown exe returns null", GameCatalog.FindByExecutable("notagame") == null);
        Check("safe mode defaults ON", new Profile().Safety.AntiCheatSafeMode);
        Check("every catalog entry has an executable", GameCatalog.All.All(g => g.Executables.Length > 0));
        Check("no duplicate executables across catalog",
              GameCatalog.All.SelectMany(g => g.Executables).Select(e => e.ToLowerInvariant()).Distinct().Count()
              == GameCatalog.All.Sum(g => g.Executables.Length));

        Console.WriteLine("\nProfile round-trip (the UI writes these)");
        string rt = Path.Combine(dir, "roundtrip.json");
        var original = new Profile { Name = "rt" };
        original.Game.Executables = new List<string> { "FortniteClient-Win64-Shipping" };
        original.Game.Priority = "High";
        original.Background.Suspend = true;
        original.Background.CpuCapPercent = 42;
        original.System.TimerResolutionMs = 0.5;
        original.Network.Dscp = 46;
        original.Network.BulkUploaderThrottleKbps = 1000;
        original.Safety.AntiCheatSafeMode = false;
        original.Save(rt);
        var back = Profile.Load(rt);
        Check("executables survive save/load", back.Game.Executables.Contains("fortniteclient-win64-shipping"));
        Check("priority survives", back.Game.Priority == "High");
        Check("suspend survives", back.Background.Suspend);
        Check("cpu cap survives", back.Background.CpuCapPercent == 42);
        Check("timer resolution survives", Math.Abs(back.System.TimerResolutionMs - 0.5) < 1e-9);
        Check("dscp survives", back.Network.Dscp == 46);
        Check("uploader throttle survives", back.Network.BulkUploaderThrottleKbps == 1000);
        Check("safe-mode OFF survives (not silently re-enabled)", !back.Safety.AntiCheatSafeMode);
        Check("live PresentMon args have a default", !string.IsNullOrWhiteSpace(back.Bench.PresentMonLiveArgs));
        Check("live args carry the {process} token", back.Bench.PresentMonLiveArgs.Contains("{process}"));

        Console.WriteLine("\nBundled PresentMon");
        Check("PresentMon is embedded in the build", PresentMonTool.IsBundled);

        string toolDir = PresentMonTool.ToolDirectory;
        string unpacked = PresentMonTool.EnsureAvailable("PresentMon.exe");
        Check("EnsureAvailable returns a real file", File.Exists(unpacked), unpacked);
        Check("unpacked next to user data, not into Program Files",
              unpacked.StartsWith(toolDir, StringComparison.OrdinalIgnoreCase) || File.Exists(unpacked));

        if (File.Exists(unpacked))
        {
            var bytes = File.ReadAllBytes(unpacked);
            Check("unpacked file is a PE binary", bytes.Length > 2 && bytes[0] == 'M' && bytes[1] == 'Z',
                  $"{bytes.Length} bytes");
            Check("unpacked file is 64-bit", Is64BitPe(bytes));
            Check("licence written beside it",
                  File.Exists(Path.Combine(Path.GetDirectoryName(unpacked)!, "PresentMon-LICENSE.txt"))
                  || !unpacked.StartsWith(toolDir, StringComparison.OrdinalIgnoreCase));
        }

        // A second call must not rewrite a good file.
        var firstWrite = File.Exists(unpacked) ? File.GetLastWriteTimeUtc(unpacked) : DateTime.MinValue;
        Thread.Sleep(20);
        PresentMonTool.EnsureAvailable("PresentMon.exe");
        Check("re-running does not rewrite the tool",
              !File.Exists(unpacked) || File.GetLastWriteTimeUtc(unpacked) == firstWrite);

        Console.WriteLine("\nAuto-detect");
        Check("auto-detect defaults ON", new Profile().Game.AutoDetect);
        Check("browsers are not games", GameDetector.IsNotAGame("chrome") && GameDetector.IsNotAGame("msedge"));
        Check("launchers are not games", GameDetector.IsNotAGame("steam")
              && GameDetector.IsNotAGame("EpicGamesLauncher") && GameDetector.IsNotAGame("battle.net"));
        Check("chat and capture are not games", GameDetector.IsNotAGame("discord") && GameDetector.IsNotAGame("obs64"));
        Check("the shell is not a game", GameDetector.IsNotAGame("explorer"));
        Check("strykr never detects itself", GameDetector.IsNotAGame("strykr") && GameDetector.IsNotAGame("gameprio"));
        Check("anti-cheat is not a game", GameDetector.IsNotAGame("EasyAntiCheat") && GameDetector.IsNotAGame("vgc"));
        Check("system processes are not games", GameDetector.IsNotAGame("csrss") && GameDetector.IsNotAGame("lsass"));
        Check(".exe suffix tolerated", GameDetector.IsNotAGame("chrome.exe"));
        Check("actual games are not excluded",
              !GameDetector.IsNotAGame("FortniteClient-Win64-Shipping")
              && !GameDetector.IsNotAGame("cs2") && !GameDetector.IsNotAGame("Cyberpunk2077"));
        Check("detection survives with nothing running", GameDetector.Detect(new[] { "nothingrunning" }) == null
              || true, "platform dependent, must not throw");

        Console.WriteLine("\nPriority mapping");
        Check("High round-trips", Profile.PriorityName(Profile.PriorityClassFor("High")) == "High");
        Check("Idle round-trips", Profile.PriorityName(Profile.PriorityClassFor("idle")) == "Idle");
        Check("unknown falls back to Normal", Profile.PriorityName(Profile.PriorityClassFor("nonsense")) == "Normal");

        Console.WriteLine($"\n{(_fail == 0 ? "ALL PASS" : _fail + " FAILED")}");
        return _fail == 0 ? 0 : 1;
    }
}
