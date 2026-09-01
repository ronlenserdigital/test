using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace GamePrio;

/// <summary>Display modes and device-level facts the audit needs.</summary>
internal static class Display
{
    private const int ENUM_CURRENT_SETTINGS = -1;
    private const int CDS_UPDATEREGISTRY = 0x01;
    private const int DISP_CHANGE_SUCCESSFUL = 0;
    private const uint DM_DISPLAYFREQUENCY = 0x400000;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct DEVMODE
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
        public ushort dmSpecVersion;
        public ushort dmDriverVersion;
        public ushort dmSize;
        public ushort dmDriverExtra;
        public uint dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public uint dmDisplayOrientation;
        public uint dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
        public ushort dmLogPixels;
        public uint dmBitsPerPel;
        public uint dmPelsWidth;
        public uint dmPelsHeight;
        public uint dmDisplayFlags;
        public uint dmDisplayFrequency;
        public uint dmICMMethod;
        public uint dmICMIntent;
        public uint dmMediaType;
        public uint dmDitherType;
        public uint dmReserved1;
        public uint dmReserved2;
        public uint dmPanningWidth;
        public uint dmPanningHeight;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern bool EnumDisplaySettingsW(string deviceName, int modeNum, ref DEVMODE devMode);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int ChangeDisplaySettingsW(ref DEVMODE devMode, int flags);

    /// <summary>Current refresh rate, and the highest available at the current resolution.</summary>
    public static (int Current, int Best) CurrentAndBestRefreshRate()
    {
        var current = new DEVMODE { dmSize = (ushort)Marshal.SizeOf<DEVMODE>() };
        if (!EnumDisplaySettingsW(null, ENUM_CURRENT_SETTINGS, ref current)) return (0, 0);

        int best = (int)current.dmDisplayFrequency;
        var mode = new DEVMODE { dmSize = (ushort)Marshal.SizeOf<DEVMODE>() };

        for (int i = 0; EnumDisplaySettingsW(null, i, ref mode); i++)
        {
            // Only compare like for like: a higher rate at a lower resolution is not an upgrade.
            if (mode.dmPelsWidth != current.dmPelsWidth || mode.dmPelsHeight != current.dmPelsHeight) continue;
            if (mode.dmBitsPerPel != current.dmBitsPerPel) continue;
            if (mode.dmDisplayFrequency > best) best = (int)mode.dmDisplayFrequency;
        }

        return ((int)current.dmDisplayFrequency, best);
    }

    /// <summary>Raises the refresh rate at the current resolution. Returns the rate actually set.</summary>
    public static int SetHighestRefreshRate()
    {
        var (currentRate, best) = CurrentAndBestRefreshRate();
        if (best <= 0 || best <= currentRate) return currentRate;

        var mode = new DEVMODE { dmSize = (ushort)Marshal.SizeOf<DEVMODE>() };
        if (!EnumDisplaySettingsW(null, ENUM_CURRENT_SETTINGS, ref mode)) return currentRate;

        mode.dmDisplayFrequency = (uint)best;
        mode.dmFields = DM_DISPLAYFREQUENCY;

        int result = ChangeDisplaySettingsW(ref mode, CDS_UPDATEREGISTRY);
        return result == DISP_CHANGE_SUCCESSFUL ? best : currentRate;
    }

    /// <summary>PNP instance id of the primary display adapter, for its device registry keys.</summary>
    public static string PrimaryGpuInstanceId()
    {
        var result = Tuners.Ps("(Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue | " +
                               "Select-Object -First 1 -ExpandProperty InstanceId)");
        string id = (result.Output ?? "").Trim();
        return string.IsNullOrWhiteSpace(id) ? null : id;
    }

    private static string MsiKeyPath(string instanceId) =>
        $@"SYSTEM\CurrentControlSet\Enum\{instanceId}\Device Parameters\Interrupt Management\MessageSignaledInterruptProperties";

    public static bool? IsMsiModeEnabled(string instanceId)
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(MsiKeyPath(instanceId));
            if (key == null) return null;
            return key.GetValue("MSISupported") is int v ? v == 1 : (bool?)null;
        }
        catch { return null; }
    }

    /// <summary>Turns on message-signalled interrupts, journalling the previous value.</summary>
    public static bool EnableMsiMode(string instanceId, Journal journal)
    {
        try
        {
            string path = MsiKeyPath(instanceId);
            using var key = Registry.LocalMachine.CreateSubKey(path, writable: true);
            if (key == null) return false;

            object existing = key.GetValue("MSISupported");
            journal.Registry.Add(new Journal.RegEntry
            {
                Hive = "HKLM",
                Key = path,
                Name = "MSISupported",
                Existed = existing != null,
                Kind = "DWord",
                PreviousValue = existing?.ToString(),
                NeedsReboot = true
            });
            journal.Save();

            key.SetValue("MSISupported", 1, RegistryValueKind.DWord);
            return true;
        }
        catch (Exception ex) { Log.Warn($"MSI mode: {ex.Message}"); return false; }
    }
}
