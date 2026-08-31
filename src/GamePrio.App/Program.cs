using System.Runtime.InteropServices;
using Avalonia;

namespace GamePrio.App;

internal static class Program
{
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int MessageBoxW(IntPtr hWnd, string text, string caption, uint type);

    [STAThread]
    public static int Main(string[] args)
    {
        // A WinExe with no console dies silently on an unhandled exception - no window,
        // no message, nothing to report. Everything below exists so that cannot happen.
        AppDomain.CurrentDomain.UnhandledException += (_, e) => Fatal(e.ExceptionObject as Exception, "unhandled");
        TaskScheduler.UnobservedTaskException += (_, e) => { Record(e.Exception, "task"); e.SetObserved(); };

        try
        {
            BuildAvaloniaApp().StartWithClassicDesktopLifetime(args);
            return 0;
        }
        catch (Exception ex)
        {
            Fatal(ex, "startup");
            return 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp() =>
        AppBuilder.Configure<GameprioApp>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();

    private static void Fatal(Exception ex, string phase)
    {
        string path = Record(ex, phase);
        try
        {
            MessageBoxW(IntPtr.Zero,
                $"STRYKR could not start.\n\n{ex?.GetType().Name}: {ex?.Message}\n\n" +
                $"Full details written to:\n{path}",
                "STRYKR", 0x10 /* MB_ICONERROR */);
        }
        catch { }
    }

    private static string Record(Exception ex, string phase)
    {
        try
        {
            string dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "GamePrio");
            Directory.CreateDirectory(dir);
            string path = Path.Combine(dir, "crash.log");
            File.AppendAllText(path,
                $"{DateTime.Now:yyyy-MM-dd HH:mm:ss}  {phase}{Environment.NewLine}{ex}{Environment.NewLine}{Environment.NewLine}");
            return path;
        }
        catch { return "(could not write a crash log)"; }
    }
}
