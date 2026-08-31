using System.Diagnostics;
using System.Security.Principal;

namespace GamePrio;

internal static class GameWatcher
{
    /// <summary>First running process matching any executable in the profile.</summary>
    public static Process FindGame(Profile profile)
    {
        foreach (var proc in Process.GetProcesses())
        {
            if (profile.Game.Executables.Contains(proc.ProcessName.ToLowerInvariant()))
                return proc;
            proc.Dispose();
        }
        return null;
    }
}

internal static class Program
{
    private static int Main(string[] args)
    {
        // Double-clicked from Explorer? Nothing else owns this console, so there is no
        // command line to read and the window would vanish the instant we returned.
        bool fromExplorer = LaunchedFromExplorer();
        if (fromExplorer && args.Length == 0) return Menu();

        int exitCode;
        try { exitCode = Run(args); }
        catch (Exception ex) { Log.Error(ex.ToString()); exitCode = 1; }

        if (fromExplorer)
        {
            Console.WriteLine();
            Console.Write("Press any key to close . . . ");
            try { Console.ReadKey(true); } catch { Thread.Sleep(20_000); }
        }

        return exitCode;
    }

    /// <summary>What you get when you double-click the exe: pick a command, keep the window.</summary>
    private static int Menu()
    {
        while (true)
        {
            Console.WriteLine();
            Console.WriteLine($"  gameprio {Version}   elevated: {IsElevated()}   profile: {FindProfilePath() ?? "NOT FOUND"}");
            Console.WriteLine();
            Console.WriteLine("   1   doctor    what this machine looks like, and what is armed");
            Console.WriteLine("   2   watch     wait for the game, apply on launch, restore on exit");
            Console.WriteLine("   3   bench     interleaved A/B capture, with a confidence interval");
            Console.WriteLine("   4   apply     apply now to an already-running game");
            Console.WriteLine("   5   restore   undo everything from the journal");
            Console.WriteLine("   6   verify    read back what is actually in effect right now");
            Console.WriteLine("   7   list      every process with its current priority");
            Console.WriteLine("   q   quit");
            Console.WriteLine();
            Console.Write("  > ");

            string choice = (Console.ReadLine() ?? "q").Trim().ToLowerInvariant();
            Console.WriteLine();

            string[] next = choice switch
            {
                "1" or "doctor" => new[] { "doctor" },
                "2" or "watch" => new[] { "watch" },
                "3" or "bench" => new[] { "bench" },
                "4" or "apply" => new[] { "apply" },
                "5" or "restore" => new[] { "restore" },
                "6" or "verify" => new[] { "verify" },
                "7" or "list" => new[] { "list" },
                "q" or "quit" or "exit" or "" => null,
                _ => Array.Empty<string>()
            };

            if (next == null) return 0;
            if (next.Length == 0) { Log.Warn("  pick a number from the list, or q to quit"); continue; }

            try { Run(next); }
            catch (Exception ex) { Log.Error(ex.ToString()); }

            Console.WriteLine();
            Console.Write("Press any key to return to the menu . . . ");
            try { Console.ReadKey(true); } catch { Thread.Sleep(10_000); }
            Console.WriteLine();
        }
    }

    private static int Run(string[] args)
    {
        try { Console.OutputEncoding = System.Text.Encoding.UTF8; } catch { }
        _args = args;
        string command = args.Length > 0 ? args[0].ToLowerInvariant() : "help";

        Log.Dim($"gameprio {Version}  |  command: {command}  |  elevated: {IsElevated()}  |  " +
                $"{Environment.OSVersion.VersionString}");

        if (!IsElevated() && command is not ("help" or "list" or "version"))
        {
            Log.Error("gameprio needs an elevated console.");
            Log.Info("  Right-click Windows Terminal or cmd -> 'Run as administrator', then run it from there.");
            Log.Info("  (Double-clicking the exe also works - accept the UAC prompt.)");
            return 2;
        }

        EnablePrivileges();

        try
        {
            switch (command)
            {
                case "doctor": return Doctor(LoadProfileOrDefault(args));
                case "watch": return Watch(LoadProfile(args));
                case "apply": return ApplyOnce(LoadProfile(args));
                case "restore": return RestoreOnly();
                case "bench": return RunBench(LoadProfile(args));
                case "verify": return RunVerify(LoadProfile(args));
                case "list": return ListProcesses();
                case "version": Console.WriteLine(Version); return 0;
                default: PrintHelp(); return 0;
            }
        }
        catch (FileNotFoundException ex) { Log.Error(ex.Message); return 3; }
        catch (Exception ex) { Log.Error(ex.ToString()); return 1; }
    }

    private const string Version = "0.1.0";

    private static bool LaunchedFromExplorer()
    {
        try
        {
            var buffer = new uint[4];
            return Native.GetConsoleProcessList(buffer, (uint)buffer.Length) <= 1;
        }
        catch { return false; }
    }

    // ------------------------------------------------------------ commands

    private static int Doctor(Profile profile)
    {
        var governor = new Governor(profile);

        Log.Info($"elevated                : {IsElevated()}");
        Log.Info($"logical CPUs            : {Environment.ProcessorCount}");
        Log.Info($"hybrid CPU              : {governor.IsHybrid}");
        Log.Info($"P-core mask             : 0x{governor.PCoreMask:X} ({System.Numerics.BitOperations.PopCount(governor.PCoreMask)} threads)");
        Log.Info($"E-core mask             : 0x{governor.ECoreMask:X} ({System.Numerics.BitOperations.PopCount(governor.ECoreMask)} threads)");

        Native.NtQueryTimerResolution(out uint min, out uint max, out uint current);
        Log.Info($"timer resolution        : {current / 10_000.0:0.###} ms now, {max / 10_000.0:0.###} ms achievable");

        var scheme = Tuners.Run("powercfg.exe", "/getactivescheme");
        Log.Info($"active power plan       : {scheme.Output.Trim()}");

        if (profile != null)
        {
            var game = GameWatcher.FindGame(profile);
            Log.Info($"profile                 : {profile.Name} ({string.Join(", ", profile.Game.Executables)})");
            Log.Info($"game running            : {(game != null ? game.ProcessName + " pid " + game.Id : "no")}");
            game?.Dispose();

            var pm = Tuners.Run(profile.Bench.PresentMonPath, "--help");
            Log.Info($"PresentMon              : {(pm.ExitCode >= 0 ? "found" : "NOT found at " + profile.Bench.PresentMonPath)}");
        }

        var stale = Journal.Load();
        if (stale != null)
            Log.Warn($"a journal from {stale.StartedUtc:u} is still open - run 'gameprio restore'");

        return 0;
    }

    // Held statically so the Ctrl+C and ProcessExit handlers can unwind the machine
    // without capturing locals by reference.
    private static Governor _governor;
    private static Journal _active;

    private static int Watch(Profile profile)
    {
        _governor = new Governor(profile);
        ReplayStaleJournal(_governor);

        Process game = null;

        Console.CancelKeyPress += (_, e) => { e.Cancel = true; Shutdown(); Environment.Exit(0); };
        AppDomain.CurrentDomain.ProcessExit += (_, _) => Shutdown();

        Log.Info($"watching for {string.Join(", ", profile.Game.Executables)} - Ctrl+C to stop and restore");

        while (true)
        {
            if (_active == null)
            {
                game = GameWatcher.FindGame(profile);
                if (game != null)
                {
                    Log.Good($"{game.ProcessName} (pid {game.Id}) started - applying '{profile.Name}'");
                    _active = _governor.Apply(game);
                }
            }
            else if (game == null || game.HasExited)
            {
                Log.Info("game exited - restoring");
                Shutdown();
                game?.Dispose();
                game = null;
            }

            Thread.Sleep(1000);
        }
    }

    private static int ApplyOnce(Profile profile)
    {
        var governor = new Governor(profile);
        ReplayStaleJournal(governor);

        var game = GameWatcher.FindGame(profile);
        if (game == null) { Log.Error("no game from the profile is running"); return 4; }

        using (game)
        {
            governor.Apply(game);
            Log.Warn("state is applied and journalled. Run 'gameprio restore' when you are done.");
        }
        return 0;
    }

    private static int RestoreOnly()
    {
        var journal = Journal.Load();
        if (journal == null) { Log.Info("no journal - nothing to restore"); return 0; }

        // Restoring never needs the profile: the journal holds everything.
        new Governor(new Profile()).Restore(journal);
        return 0;
    }

    private static int RunBench(Profile profile)
    {
        int seconds = ArgInt("--seconds", 90);
        int runs = ArgInt("--runs", 2);
        Bench.Run(profile, new Governor(profile), seconds, runs);
        return 0;
    }

    private static int RunVerify(Profile profile)
    {
        Verify.Run(profile, new Governor(profile));
        return 0;
    }

    private static int ListProcesses()
    {
        Console.WriteLine($"{"pid",7}  {"priority",-12} {"session",7}  name");
        foreach (var p in Process.GetProcesses().OrderBy(p => p.ProcessName, StringComparer.OrdinalIgnoreCase))
        {
            using (p)
            {
                string priority;
                try { priority = p.PriorityClass.ToString(); } catch { priority = "-"; }
                int session;
                try { session = p.SessionId; } catch { session = -1; }
                Console.WriteLine($"{p.Id,7}  {priority,-12} {session,7}  {p.ProcessName}");
            }
        }
        return 0;
    }

    // ------------------------------------------------------------- plumbing

    private static void Shutdown()
    {
        if (_active == null || _governor == null) return;
        var journal = _active;
        _active = null;                  // so a second signal cannot restore twice
        _governor.Restore(journal);
        _governor.CloseJobHandles();
    }

    private static void ReplayStaleJournal(Governor governor)
    {
        var stale = Journal.Load();
        if (stale == null) return;
        Log.Warn($"a previous session from {stale.StartedUtc:u} did not shut down cleanly - restoring it first");
        governor.Restore(stale);
    }

    private static void EnablePrivileges()
    {
        // SeDebugPrivilege is deliberately NOT here: it is what lets us touch processes we
        // do not own, and it is part of what anti-cheat looks for. Governor.Apply requests
        // it only when safe mode is off, i.e. only when it is actually needed.
        foreach (var privilege in new[] { "SeIncreaseBasePriorityPrivilege",
                                          "SeIncreaseQuotaPrivilege", "SeCreateGlobalPrivilege" })
        {
            if (!Native.EnablePrivilege(privilege)) Log.Dim($"privilege not granted: {privilege}");
        }
    }

    private static bool IsElevated()
    {
        try
        {
            using var identity = WindowsIdentity.GetCurrent();
            return new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
        }
        catch { return false; }
    }

    private static string[] _args = Array.Empty<string>();

    private static Profile LoadProfile(string[] args)
    {
        string path = ArgString("--profile", null) ?? FindProfilePath();

        if (path == null || !File.Exists(path))
            throw new FileNotFoundException(
                "no profile found. Put profile.json next to gameprio.exe " +
                $"(looked in {Directory.GetCurrentDirectory()} and {AppContext.BaseDirectory}), " +
                "or pass --profile <file>.");

        var profile = Profile.Load(path);
        Log.Dim($"profile: {path} ({profile.Name})");
        return profile;
    }

    /// <summary>Working directory first, then the exe's own folder - double-clicking sets neither reliably.</summary>
    private static string FindProfilePath()
    {
        foreach (var dir in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            if (string.IsNullOrEmpty(dir)) continue;
            foreach (var name in new[] { "profile.json", "profile.example.json" })
            {
                string candidate = Path.Combine(dir, name);
                if (File.Exists(candidate)) return candidate;
            }
        }
        return null;
    }

    private static Profile LoadProfileOrDefault(string[] args)
    {
        try { return LoadProfile(args); }
        catch (FileNotFoundException) { return null; }
    }

    private static string ArgString(string name, string fallback)
    {
        int i = Array.FindIndex(_args, a => string.Equals(a, name, StringComparison.OrdinalIgnoreCase));
        return i >= 0 && i + 1 < _args.Length ? _args[i + 1] : fallback;
    }

    private static int ArgInt(string name, int fallback) =>
        int.TryParse(ArgString(name, null), out int v) ? v : fallback;

    private static void PrintHelp()
    {
        Console.WriteLine(@"
gameprio - per-game process and system prioritisation for Windows (personal test build)

  gameprio doctor  [--profile p.json]   what this machine looks like, and what is armed
  gameprio watch   [--profile p.json]   wait for the game, apply on launch, restore on exit
  gameprio apply    --profile p.json    apply now to an already-running game
  gameprio restore                      undo everything from the journal
  gameprio bench    --profile p.json [--seconds 90] [--runs 2]
                                        interleaved A/B capture, with a confidence interval
  gameprio verify   [--profile p.json]   read back what is actually in effect right now
  gameprio list                         every process with its current priority

Run from an elevated console. Every change is journalled to
%ProgramData%\GamePrio\journal.json before it is applied, and replayed
in reverse on restore - including after a crash or a reboot.
");
    }
}
