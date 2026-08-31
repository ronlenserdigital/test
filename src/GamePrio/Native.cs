using System.Runtime.InteropServices;

namespace GamePrio;

/// <summary>
/// Every Win32 / NT call the governor makes, plus the token privileges that let it
/// touch processes it does not own. Single processor group (64 logical CPUs or fewer) only.
/// </summary>
internal static class Native
{
    // ---- process access rights ----
    public const uint PROCESS_TERMINATE = 0x0001;
    public const uint PROCESS_SET_QUOTA = 0x0100;
    public const uint PROCESS_SET_INFORMATION = 0x0200;
    public const uint PROCESS_QUERY_INFORMATION = 0x0400;
    public const uint PROCESS_SUSPEND_RESUME = 0x0800;
    public const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

    /// Everything the governor ever needs on a target process.
    public const uint GOVERNOR_ACCESS =
        PROCESS_SET_INFORMATION | PROCESS_QUERY_INFORMATION |
        PROCESS_SUSPEND_RESUME | PROCESS_SET_QUOTA | PROCESS_TERMINATE;

    /// Fallback when the full set is denied (protected / PPL processes).
    public const uint GOVERNOR_ACCESS_FALLBACK =
        PROCESS_SET_INFORMATION | PROCESS_QUERY_LIMITED_INFORMATION;

    // ---- priority classes ----
    public const uint IDLE_PRIORITY_CLASS = 0x00000040;
    public const uint BELOW_NORMAL_PRIORITY_CLASS = 0x00004000;
    public const uint NORMAL_PRIORITY_CLASS = 0x00000020;
    public const uint ABOVE_NORMAL_PRIORITY_CLASS = 0x00008000;
    public const uint HIGH_PRIORITY_CLASS = 0x00000080;
    public const uint REALTIME_PRIORITY_CLASS = 0x00000100;

    // ---- power throttling (EcoQoS) ----
    public const int ProcessPowerThrottling = 4;
    public const uint PROCESS_POWER_THROTTLING_CURRENT_VERSION = 1;
    public const uint PROCESS_POWER_THROTTLING_EXECUTION_SPEED = 0x1;
    public const uint PROCESS_POWER_THROTTLING_IGNORE_TIMER_RESOLUTION = 0x4;

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_POWER_THROTTLING_STATE
    {
        public uint Version;
        public uint ControlMask;
        public uint StateMask;
    }

    // ---- job object CPU rate control ----
    public const int JobObjectCpuRateControlInformation = 15;
    public const uint JOB_OBJECT_CPU_RATE_CONTROL_ENABLE = 0x1;
    public const uint JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP = 0x4;

    [StructLayout(LayoutKind.Sequential)]
    public struct JOBOBJECT_CPU_RATE_CONTROL_INFORMATION
    {
        public uint ControlFlags;
        /// When ENABLE|HARD_CAP: portion of CPU cycles in 1/100 of a percent (1..10000).
        public uint CpuRate;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(uint desiredAccess, bool inheritHandle, int processId);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool CloseHandle(IntPtr handle);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GetCurrentProcess();

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetPriorityClass(IntPtr handle, uint priorityClass);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint GetPriorityClass(IntPtr handle);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetProcessAffinityMask(IntPtr handle, UIntPtr mask);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetProcessAffinityMask(IntPtr handle, out UIntPtr processMask, out UIntPtr systemMask);

    /// <summary>Reads back what SetProcessInformation did - used by verify, not by apply.</summary>
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool GetProcessInformation(
        IntPtr handle, int informationClass, ref PROCESS_POWER_THROTTLING_STATE info, uint size);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetProcessInformation(
        IntPtr handle, int informationClass, ref PROCESS_POWER_THROTTLING_STATE info, uint size);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    public static extern IntPtr CreateJobObjectW(IntPtr securityAttributes, string name);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint length);

    // ---- suspend / resume (undocumented, stable since NT 4) ----
    [DllImport("ntdll.dll")]
    public static extern int NtSuspendProcess(IntPtr handle);

    [DllImport("ntdll.dll")]
    public static extern int NtResumeProcess(IntPtr handle);

    // ---- global timer resolution ----
    [DllImport("ntdll.dll")]
    public static extern int NtQueryTimerResolution(out uint minimum, out uint maximum, out uint current);

    [DllImport("ntdll.dll")]
    public static extern int NtSetTimerResolution(uint desired, bool setResolution, out uint actual);

    /// <summary>How many processes share this console. 1 == launched by double-click.</summary>
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint GetConsoleProcessList(uint[] processList, uint count);

    // ---- token privileges ----
    private const uint TOKEN_ADJUST_PRIVILEGES = 0x0020;
    private const uint TOKEN_QUERY = 0x0008;
    private const uint SE_PRIVILEGE_ENABLED = 0x0002;

    [StructLayout(LayoutKind.Sequential)]
    private struct LUID { public uint LowPart; public int HighPart; }

    [StructLayout(LayoutKind.Sequential)]
    private struct TOKEN_PRIVILEGES
    {
        public uint PrivilegeCount;
        public LUID Luid;
        public uint Attributes;
    }

    [DllImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenProcessToken(IntPtr process, uint desiredAccess, out IntPtr tokenHandle);

    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool LookupPrivilegeValueW(string systemName, string name, out LUID luid);

    [DllImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool AdjustTokenPrivileges(
        IntPtr token, bool disableAll, ref TOKEN_PRIVILEGES newState,
        uint bufferLength, IntPtr previousState, IntPtr returnLength);

    /// <summary>Turns on a privilege already present in this process's token.</summary>
    public static bool EnablePrivilege(string privilegeName)
    {
        if (!OpenProcessToken(GetCurrentProcess(), TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY, out IntPtr token))
            return false;
        try
        {
            if (!LookupPrivilegeValueW(null, privilegeName, out LUID luid)) return false;

            var tp = new TOKEN_PRIVILEGES
            {
                PrivilegeCount = 1,
                Luid = luid,
                Attributes = SE_PRIVILEGE_ENABLED
            };

            if (!AdjustTokenPrivileges(token, false, ref tp, 0, IntPtr.Zero, IntPtr.Zero)) return false;
            // AdjustTokenPrivileges returns true even when it only partly succeeded.
            return Marshal.GetLastWin32Error() == 0;
        }
        finally { CloseHandle(token); }
    }

    // ---- CPU topology: which logical CPUs are P-cores ----
    private const int RelationProcessorCore = 0;

    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetLogicalProcessorInformationEx(
        int relationshipType, IntPtr buffer, ref uint returnedLength);

    /// <summary>
    /// Returns (performanceMask, efficiencyMask) over processor group 0.
    /// On a uniform CPU every core lands in performanceMask and efficiencyMask is 0.
    /// </summary>
    public static (ulong Performance, ulong Efficiency) GetCoreMasks()
    {
        uint len = 0;
        GetLogicalProcessorInformationEx(RelationProcessorCore, IntPtr.Zero, ref len);
        if (len == 0) return (0, 0);

        IntPtr buffer = Marshal.AllocHGlobal((int)len);
        try
        {
            if (!GetLogicalProcessorInformationEx(RelationProcessorCore, buffer, ref len))
                return (0, 0);

            // Walk the variable-length SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX records.
            var cores = new List<(byte Efficiency, ulong Mask)>();
            int offset = 0;
            while (offset + 8 <= (int)len)
            {
                IntPtr rec = IntPtr.Add(buffer, offset);
                int relationship = Marshal.ReadInt32(rec, 0);
                int size = Marshal.ReadInt32(rec, 4);
                if (size <= 0) break;

                if (relationship == RelationProcessorCore)
                {
                    // PROCESSOR_RELATIONSHIP: Flags(1) EfficiencyClass(1) Reserved[20]
                    //                         GroupCount(2) GROUP_AFFINITY GroupMask[]
                    byte efficiencyClass = Marshal.ReadByte(rec, 9);
                    short groupCount = Marshal.ReadInt16(rec, 30);
                    ulong mask = 0;
                    for (int g = 0; g < groupCount; g++)
                    {
                        // GROUP_AFFINITY is 8-byte aligned at offset 32; 16 bytes each.
                        int ga = 32 + (g * 16);
                        if (ga + 10 > size) break;
                        ushort group = (ushort)Marshal.ReadInt16(rec, ga + 8);
                        if (group != 0) continue;                 // group 0 only
                        mask |= (ulong)Marshal.ReadInt64(rec, ga);
                    }
                    if (mask != 0) cores.Add((efficiencyClass, mask));
                }

                offset += size;
            }

            if (cores.Count == 0) return (0, 0);

            byte top = cores.Max(c => c.Efficiency);
            ulong perf = 0, eff = 0;
            foreach (var c in cores)
            {
                if (c.Efficiency == top) perf |= c.Mask;
                else eff |= c.Mask;
            }
            return (perf, eff);
        }
        finally { Marshal.FreeHGlobal(buffer); }
    }
}
