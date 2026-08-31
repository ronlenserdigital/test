using Avalonia;

namespace GamePrio.App;

internal static class Program
{
    [STAThread]
    public static void Main(string[] args) =>
        BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);

    public static AppBuilder BuildAvaloniaApp() =>
        AppBuilder.Configure<GameprioApp>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}
