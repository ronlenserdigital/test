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
    public string DetectedGame { get; private set; }

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

    public void StartWatching()
    {
        if (IsWatching) return;
        if (Profile.Game.Executables.Count == 0)
        {
            Log.Error("no games selected - tick at least one in the library");
            return;
        }

        _watchCts = new CancellationTokenSource();
        var token = _watchCts.Token;
        Log.Info($"watching for {string.Join(", ", Profile.Game.Executables)}");
        Raise();

        Task.Run(() =>
        {
            while (!token.IsCancellationRequested)
            {
                try { Tick(); }
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

    private void Tick()
    {
        if (!IsApplied)
        {
            var game = FindGame();
            if (game == null) return;

            DetectedGame = $"{game.ProcessName} (pid {game.Id})";
            Log.Good($"{game.ProcessName} started - applying '{Profile.Name}'");
            lock (_gate)
            {
                _game = game;
                _applied = _governor.Apply(game);
            }
            Raise();
        }
        else
        {
            bool exited;
            try { exited = _game == null || _game.HasExited; } catch { exited = true; }
            if (!exited) return;

            Log.Info("game exited - restoring");
            RestoreNow();
        }
    }

    public void ApplyNow()
    {
        if (IsApplied) { Log.Warn("already applied"); return; }

        var game = FindGame();
        if (game == null) { Log.Error("none of the selected games are running"); return; }

        DetectedGame = $"{game.ProcessName} (pid {game.Id})";
        lock (_gate)
        {
            _game = game;
            _applied = _governor.Apply(game);
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
        Raise();
    }

    private Process FindGame()
    {
        foreach (var proc in Process.GetProcesses())
        {
            if (Profile.Game.Executables.Contains(proc.ProcessName.ToLowerInvariant())) return proc;
            proc.Dispose();
        }
        return null;
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
