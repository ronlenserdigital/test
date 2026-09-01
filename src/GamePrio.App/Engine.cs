using System.Diagnostics;

namespace GamePrio.App;

/// <summary>
/// Owns the governor and the watch loop on behalf of the UI, and guarantees that
/// whatever is applied gets unwound - on stop, on game exit, and on window close.
/// </summary>
public sealed class Engine : IDisposable
{
    private readonly object _gate = new();
    private Governor _governor;
    private Journal _applied;
    private CancellationTokenSource _watchCts;
    private Process _game;

    public Profile Profile { get; private set; }
    public bool IsWatching => _watchCts is { IsCancellationRequested: false };
    public bool IsApplied { get { lock (_gate) return _applied != null; } }
    /// <summary>True once the game itself is running and has been attached.</summary>
    public bool GameAttached { get; private set; }
    public string DetectedGame { get; private set; }
    /// <summary>What was found and why - shown so detection is never a black box.</summary>
    public Detection LastDetection { get; private set; }

    /// <summary>Raised when auto-detect finds a game that was not in the library.</summary>
    public event Action<Detection> UnknownGameDetected;

    /// <summary>Raised whenever watching / applied / detected-game changes.</summary>
    public event Action Changed;

    public Engine(Profile profile) => SetProfile(profile);

    public void SetProfile(Profile profile)
    {
        Profile = profile;
        _governor = new Governor(profile);
    }

    public Governor Governor => _governor;

    /// <summary>Replays a journal left behind by a crash or a previous session.</summary>
    public void RecoverStaleState()
    {
        var stale = Journal.Load();
        if (stale == null) return;
        Log.Warn($"a previous session from {stale.StartedUtc:u} did not shut down cleanly - restoring it first");
        _governor.Restore(stale);
        Raise();
    }

    /// <summary>
    /// Pressing start goes to max performance IMMEDIATELY - power plan, processor floor,
    /// core parking, timer resolution, MMCSS, Game DVR, network policy and the background
    /// sweep all land now, not when a game eventually launches. The watch loop then only
    /// has to attach the game-specific half when the process appears.
    /// </summary>
    public void StartWatching()
    {
        if (IsWatching) return;
        if (Profile.Game.Executables.Count == 0 && !Profile.Game.AutoDetect)
        {
            Log.Error("no games selected - tick one in the library, or turn auto-detect on");
            return;
        }

        lock (_gate)
        {
            _applied = _governor.BeginSession();
            GameAttached = false;
        }
        Raise();

        // If the game is already running, attach in the same breath.
        var running = FindGame();
        if (running != null)
        {
            lock (_gate) { _game = running; }
            _governor.AttachGame(running, _applied);
            DetectedGame = $"{running.ProcessName} (pid {running.Id})";
            GameAttached = true;
            Raise();
        }
        else if (Profile.Game.Executables.Count > 0)
            Log.Info($"waiting for {string.Join(", ", Profile.Game.Executables)}" +
                     (Profile.Game.AutoDetect ? ", or any game auto-detect recognises" : ""));
        else
            Log.Info("waiting for any game - auto-detect is on");

        _watchCts = new CancellationTokenSource();
        var token = _watchCts.Token;

        Task.Run(() =>
        {
            int ticks = 0;
            while (!token.IsCancellationRequested)
            {
                try { Tick(++ticks); }
                catch (Exception ex) { Log.Error(ex.Message); }
                try { Task.Delay(1000, token).Wait(token); }
                catch (OperationCanceledException) { break; }
                catch (AggregateException) { break; }
            }
        }, token);
    }

    public void StopWatching()
    {
        _watchCts?.Cancel();
        _watchCts = null;
        RestoreNow();
        Log.Info("stopped watching");
        Raise();
    }

    private void Tick(int tick)
    {
        Journal journal;
        lock (_gate) journal = _applied;
        if (journal == null) return;

        if (!GameAttached)
        {
            var game = FindGame();
            if (game != null)
            {
                Log.Good($"{game.ProcessName} started - attaching");
                lock (_gate) _game = game;
                _governor.AttachGame(game, journal);
                DetectedGame = $"{game.ProcessName} (pid {game.Id})";
                GameAttached = true;
                Raise();
            }
        }
        else
        {
            bool exited;
            try { exited = _game == null || _game.HasExited; } catch { exited = true; }
            if (exited)
            {
                // The machine stays at max performance; only the game half is released,
                // so a match ending does not undo the whole session.
                Log.Info("game exited - still holding max performance, press stop to release");
                lock (_gate) { _game?.Dispose(); _game = null; }
                GameAttached = false;
                DetectedGame = null;
                Raise();
                return;
            }
        }

        // Anything launched after the session began still gets pushed out of the way.
        if (tick % 15 == 0)
        {
            Process game;
            lock (_gate) game = _game;
            _governor.Resweep(game, journal);
        }
    }

    /// <summary>Max performance now, with or without a game running.</summary>
    public void ApplyNow()
    {
        if (IsApplied) { Log.Warn("already applied"); return; }
        if (Profile.Game.Executables.Count == 0 && !Profile.Game.AutoDetect)
            Log.Warn("no game ticked - applying machine-level settings only");

        lock (_gate) { _applied = _governor.BeginSession(); GameAttached = false; }

        var game = FindGame();
        if (game != null)
        {
            lock (_gate) _game = game;
            _governor.AttachGame(game, _applied);
            DetectedGame = $"{game.ProcessName} (pid {game.Id})";
            GameAttached = true;
        }
        Raise();
    }

    public void RestoreNow()
    {
        Journal journal;
        lock (_gate)
        {
            journal = _applied ?? Journal.Load();
            _applied = null;
            _game?.Dispose();
            _game = null;
        }

        if (journal != null)
        {
            _governor.Restore(journal);
            _governor.CloseJobHandles();
        }

        DetectedGame = null;
        GameAttached = false;
        Raise();
    }

    /// <summary>
    /// A ticked game that is running wins. Failing that, and only with auto-detect on,
    /// the detector gets a say - a catalog title, or a window filling a monitor.
    /// </summary>
    private Process FindGame()
    {
        foreach (var proc in Process.GetProcesses())
        {
            if (Profile.Game.Executables.Contains(proc.ProcessName.ToLowerInvariant()))
            {
                LastDetection = new Detection(proc.Id, proc.ProcessName, "selected in the library",
                                              GameCatalog.FindByExecutable(proc.ProcessName));
                return proc;
            }
            proc.Dispose();
        }

        if (!Profile.Game.AutoDetect) return null;

        var found = GameDetector.Detect(Profile.Game.Executables);
        if (found == null) return null;

        try
        {
            var proc = Process.GetProcessById(found.Pid);
            LastDetection = found;

            // The detected executable joins the profile for this session: it must never be
            // swept as a background process, and the QoS policy and HUD need to target it.
            string key = found.ProcessName.ToLowerInvariant();
            if (!Profile.Game.Executables.Contains(key))
            {
                Profile.Game.Executables.Add(key);
                Log.Good($"auto-detected {found.Display} ({found.ProcessName}.exe) - {found.Reason}");
                try { UnknownGameDetected?.Invoke(found); } catch { }
            }
            return proc;
        }
        catch { return null; }
    }

    /// <summary>Snapshot for the status panel.</summary>
    public (bool Hybrid, int PCores, int ECores, double TimerMs) Topology()
    {
        Native.NtQueryTimerResolution(out _, out _, out uint current);
        return (_governor.IsHybrid,
                System.Numerics.BitOperations.PopCount(_governor.PCoreMask),
                System.Numerics.BitOperations.PopCount(_governor.ECoreMask),
                current / 10_000.0);
    }

    private void Raise()
    {
        try { Changed?.Invoke(); } catch { }
    }

    public void Dispose()
    {
        _watchCts?.Cancel();
        RestoreNow();
    }
}
