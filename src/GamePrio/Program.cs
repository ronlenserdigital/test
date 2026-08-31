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
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        _args = args;
        string command = args.Length > 0 ? args[0].ToLowerInvariant() : "help";

        if (!IsElevated() && command is not ("help" or "list"))
        {
            Log.Error("gameprio needs an elevated console - it changes other processes, the power plan and HKLM.");
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
                case "list": return ListProcesses();
                default: PrintHelp(); return 0;
            }
        }
        catch (FileNotFoundException ex) { Log.Error(ex.Message); return 3; }
        catch (Exception ex) { Log.Error(ex.ToString()); return 1; }
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
        // SeDebug: open processes owned by other users. SeIncreaseBasePriority: raise above Normal.
        foreach (var privilege in new[] { "SeDebugPrivilege", "SeIncreaseBasePriorityPrivilege",
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
        string path = ArgString("--profile", null)
                      ?? (File.Exists("profile.json") ? "profile.json" : "profile.example.json");

        if (!File.Exists(path))
            throw new FileNotFoundException($"profile not found: {path} (pass --profile <file>)");

        var profile = Profile.Load(path);
        Log.Dim($"profile: {path} ({profile.Name})");
        return profile;
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
  gameprio list                         every process with its current priority

Run from an elevated console. Every change is journalled to
%ProgramData%\GamePrio\journal.json before it is applied, and replayed
in reverse on restore - including after a crash or a reboot.
");
    }
}
