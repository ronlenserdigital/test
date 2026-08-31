namespace GamePrio.App;

public enum AntiCheat
{
    None,
    UserMode,
    /// <summary>Kernel-level driver. The riskiest environment to run an aggressive profile in.</summary>
    Kernel
}

public sealed record GameEntry(string Name, string[] Executables, AntiCheat AntiCheat, string AntiCheatName)
{
    public string Primary => Executables[0];
}

/// <summary>
/// Ships with the app so the game list is clickable rather than typed. The anti-cheat
/// column is not decoration: it decides whether suspension is offered for that title.
/// </summary>
public static class GameCatalog
{
    public static readonly GameEntry[] All =
    {
        // --- competitive shooters, kernel anti-cheat ---
        new("Fortnite", new[] { "FortniteClient-Win64-Shipping" }, AntiCheat.Kernel, "EAC + BattlEye"),
        new("Call of Duty (BO6 / Warzone)", new[] { "cod", "cod_bo6" }, AntiCheat.Kernel, "Ricochet"),
        new("Call of Duty: MW III", new[] { "cod22-cod" }, AntiCheat.Kernel, "Ricochet"),
        new("Rainbow Six Siege", new[] { "RainbowSix", "RainbowSix_BE", "RainbowSix_Vulkan" }, AntiCheat.Kernel, "BattlEye"),
        new("Valorant", new[] { "VALORANT-Win64-Shipping" }, AntiCheat.Kernel, "Vanguard"),
        new("Apex Legends", new[] { "r5apex", "r5apex_dx12" }, AntiCheat.Kernel, "EAC"),
        new("PUBG: Battlegrounds", new[] { "TslGame" }, AntiCheat.Kernel, "BattlEye"),
        new("Escape from Tarkov", new[] { "EscapeFromTarkov" }, AntiCheat.Kernel, "BattlEye"),
        new("Destiny 2", new[] { "destiny2" }, AntiCheat.Kernel, "BattlEye"),
        new("Rust", new[] { "RustClient" }, AntiCheat.Kernel, "EAC"),
        new("The Finals", new[] { "Discovery" }, AntiCheat.Kernel, "EAC"),
        new("Marvel Rivals", new[] { "Marvel-Win64-Shipping" }, AntiCheat.Kernel, "NetEase AC"),
        new("Delta Force", new[] { "DeltaForceClient-Win64-Shipping" }, AntiCheat.Kernel, "ACE"),
        new("Battlefield 2042", new[] { "BF2042" }, AntiCheat.Kernel, "EA Javelin"),
        new("Helldivers 2", new[] { "helldivers2" }, AntiCheat.Kernel, "GameGuard"),
        new("League of Legends", new[] { "League of Legends" }, AntiCheat.Kernel, "Vanguard"),

        // --- user-mode or server-side anti-cheat ---
        new("Counter-Strike 2", new[] { "cs2" }, AntiCheat.UserMode, "VAC"),
        new("Dota 2", new[] { "dota2" }, AntiCheat.UserMode, "VAC"),
        new("Overwatch 2", new[] { "Overwatch" }, AntiCheat.UserMode, "Warden"),
        new("Halo Infinite", new[] { "HaloInfinite" }, AntiCheat.UserMode, "EAC"),
        new("Warframe", new[] { "Warframe.x64" }, AntiCheat.UserMode, "EAC"),
        new("Roblox", new[] { "RobloxPlayerBeta" }, AntiCheat.UserMode, "Hyperion"),
        new("GTA V / Online", new[] { "GTA5", "GTA5_Enhanced" }, AntiCheat.UserMode, "BattlEye (Online)"),
        new("Elden Ring", new[] { "eldenring", "start_protected_game" }, AntiCheat.UserMode, "EAC (online)"),
        new("Star Citizen", new[] { "StarCitizen" }, AntiCheat.UserMode, "EAC"),
        new("Rocket League", new[] { "RocketLeague" }, AntiCheat.UserMode, "Epic"),

        // --- single-player / none: the right place to test an aggressive profile ---
        new("Cyberpunk 2077", new[] { "Cyberpunk2077" }, AntiCheat.None, "none"),
        new("Baldur's Gate 3", new[] { "bg3", "bg3_dx11" }, AntiCheat.None, "none"),
        new("Palworld", new[] { "Palworld-Win64-Shipping" }, AntiCheat.None, "none"),
        new("Starfield", new[] { "Starfield" }, AntiCheat.None, "none"),
        new("Hogwarts Legacy", new[] { "HogwartsLegacy" }, AntiCheat.None, "none"),
        new("The Witcher 3", new[] { "witcher3" }, AntiCheat.None, "none"),
        new("Red Dead Redemption 2", new[] { "RDR2" }, AntiCheat.None, "none"),
        new("Minecraft (Java)", new[] { "javaw" }, AntiCheat.None, "none")
    };

    public static GameEntry FindByExecutable(string exe)
    {
        string key = (exe ?? "").Trim().ToLowerInvariant();
        if (key.EndsWith(".exe")) key = key[..^4];
        return All.FirstOrDefault(g => g.Executables.Any(e => e.ToLowerInvariant() == key));
    }
}
