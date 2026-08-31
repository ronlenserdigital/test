namespace GamePrio;

internal static class Log
{
    private static readonly object Gate = new();
    private static readonly string LogFile = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
        "GamePrio", "gameprio.log");

    public static void Info(string m) => Write(m, null, "INFO");
    public static void Good(string m) => Write(m, ConsoleColor.Green, "OK  ");
    public static void Warn(string m) => Write(m, ConsoleColor.Yellow, "WARN");
    public static void Error(string m) => Write(m, ConsoleColor.Red, "FAIL");
    public static void Dim(string m) => Write(m, ConsoleColor.DarkGray, "----");

    private static void Write(string message, ConsoleColor? color, string level)
    {
        lock (Gate)
        {
            var prev = Console.ForegroundColor;
            if (color.HasValue) Console.ForegroundColor = color.Value;
            Console.WriteLine(message);
            Console.ForegroundColor = prev;

            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(LogFile)!);
                File.AppendAllText(LogFile, $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} {level} {message}{Environment.NewLine}");
            }
            catch { /* logging must never take the tool down */ }
        }
    }
}
