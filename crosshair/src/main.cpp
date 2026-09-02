#include "app.h"
#include <shellapi.h>
#include <psapi.h>
#include <stdio.h>
#include <wchar.h>

HINSTANCE g_inst = NULL;

static HWND            g_msg = NULL;
static NOTIFYICONDATAW g_nid;
static BOOL            g_trayOn = FALSE;
static BOOL            g_inGame = FALSE;
static wchar_t         g_selfExe[64] = L"";

#define TIMER_SCAN 1

static const wchar_t* kIgnore[] = {
    L"explorer.exe", L"searchhost.exe", L"searchui.exe", L"shellexperiencehost.exe",
    L"applicationframehost.exe", L"startmenuexperiencehost.exe", L"taskmgr.exe",
    L"lockapp.exe", L"textinputhost.exe", L"dwm.exe", NULL
};

static BOOL Ignored(const wchar_t* exe)
{
    if (!_wcsicmp(exe, g_selfExe)) return TRUE;
    for (int i = 0; kIgnore[i]; i++) if (!_wcsicmp(exe, kIgnore[i])) return TRUE;
    return FALSE;
}

static BOOL ForegroundExe(HWND fg, wchar_t* out, int cch)
{
    DWORD pid = 0;
    GetWindowThreadProcessId(fg, &pid);
    if (!pid) return FALSE;
    HANDLE h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
    if (!h) return FALSE;
    wchar_t path[MAX_PATH] = L"";
    DWORD n = MAX_PATH;
    BOOL ok = QueryFullProcessImageNameW(h, 0, path, &n);
    CloseHandle(h);
    if (!ok) return FALSE;
    const wchar_t* b = wcsrchr(path, L'\\');
    wcsncpy(out, b ? b + 1 : path, cch - 1);
    out[cch - 1] = 0;
    return TRUE;
}

static BOOL IsFullscreen(HWND fg)
{
    if (!fg || fg == GetDesktopWindow() || fg == GetShellWindow()) return FALSE;
    RECT wr;
    if (!GetWindowRect(fg, &wr)) return FALSE;
    HMONITOR hm = MonitorFromWindow(fg, MONITOR_DEFAULTTONEAREST);
    MONITORINFO mi; mi.cbSize = sizeof(mi);
    if (!GetMonitorInfoW(hm, &mi)) return FALSE;
    RECT m = mi.rcMonitor;
    return wr.left <= m.left + 2 && wr.top <= m.top + 2 &&
           wr.right >= m.right - 2 && wr.bottom >= m.bottom - 2;
}

static void Scan(void)
{
    HWND fg = GetForegroundWindow();
    wchar_t exe[64] = L"";
    BOOL game = FALSE;
    int prof = -1;

    if (fg && ForegroundExe(fg, exe, 64) && !Ignored(exe)) {
        prof = ProfileFind(exe);
        if (prof >= 0) game = TRUE;
        else if (g_set.autoDetect && IsFullscreen(fg)) game = TRUE;
        if (game) wcsncpy(g_lastGame, exe, 63);
    }

    if (game) OverlaySetMonitorFrom(fg);

    // auto-switch to the profile that owns this game
    if (game && prof >= 0 && g_prof[prof].autoLaunch && prof != g_activeProfile) {
        g_activeProfile = prof;
        memcpy(&g_ch, &g_prof[prof].ch, sizeof(Crosshair));
        wcsncpy(g_activeLabel, g_prof[prof].label, 63);
        g_activeLabel[63] = 0;
        OverlayResolution(&g_prof[prof].lastW, &g_prof[prof].lastH);
        OverlayRefresh();
        ShellRedraw();
    }

    OverlaySetVisible(g_set.overlayOn && (game || !g_set.onlyInGame));

    if (game != g_inGame) {
        g_inGame = game;
        wchar_t s[160];
        if (game) {
            _snwprintf(s, 160, L"%s detected \x2014 overlay active", g_lastGame);
            if (g_set.autoOpenPanel) { TrayShow(TRUE); ShellShow(TRUE); }
        } else {
            wcscpy(s, g_set.onlyInGame ? L"Waiting for a game..." : L"Overlay always on.");
        }
        s[159] = 0;
        ShellStatus(s);
    }
}

static HICON MakeIcon(void)
{
    const int N = 32;
    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth = N; bi.bmiHeader.biHeight = -N;
    bi.bmiHeader.biPlanes = 1; bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB;

    void* bits = NULL;
    HDC dc = GetDC(NULL);
    HBITMAP color = CreateDIBSection(dc, &bi, DIB_RGB_COLORS, &bits, NULL, 0);
    ReleaseDC(NULL, dc);
    if (!color) return LoadIcon(NULL, IDI_APPLICATION);

    unsigned* p = (unsigned*)bits;
    memset(p, 0, N * N * 4);
    for (int i = 2; i < N - 2; i++) {
        if (i > 12 && i < 19) continue;
        p[15 * N + i] = 0xFF00F5A0; p[16 * N + i] = 0xFF00F5A0;
        p[i * N + 15] = 0xFF00F5A0; p[i * N + 16] = 0xFF00F5A0;
    }
    p[15 * N + 15] = p[15 * N + 16] = p[16 * N + 15] = p[16 * N + 16] = 0xFFFFFFFF;

    HBITMAP mask = CreateBitmap(N, N, 1, 1, NULL);
    ICONINFO ii;
    ii.fIcon = TRUE; ii.xHotspot = ii.yHotspot = 0;
    ii.hbmMask = mask; ii.hbmColor = color;
    HICON ic = CreateIconIndirect(&ii);
    DeleteObject(mask); DeleteObject(color);
    return ic ? ic : LoadIcon(NULL, IDI_APPLICATION);
}

void TrayShow(BOOL show)
{
    if (show == g_trayOn) return;
    if (show) {
        ZeroMemory(&g_nid, sizeof(g_nid));
        g_nid.cbSize = sizeof(g_nid);
        g_nid.hWnd = g_msg;
        g_nid.uID = 1;
        g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
        g_nid.uCallbackMessage = WM_TRAY;
        g_nid.hIcon = MakeIcon();
        wcscpy(g_nid.szTip, APP_NAME L" - F12 to show/hide");
        Shell_NotifyIconW(NIM_ADD, &g_nid);
    } else {
        Shell_NotifyIconW(NIM_DELETE, &g_nid);
    }
    g_trayOn = show;
}

void AppExit(void)
{
    CfgSave();
    TrayShow(FALSE);
    OverlaySetVisible(FALSE);
    PostQuitMessage(0);
}

static void TrayMenu(void)
{
    POINT pt; GetCursorPos(&pt);
    HMENU m = CreatePopupMenu();
    AppendMenuW(m, MF_STRING, 1, L"Open DEADCENTER (F12)");
    AppendMenuW(m, MF_STRING | (g_set.overlayOn ? MF_CHECKED : 0), 2, L"Overlay enabled");
    AppendMenuW(m, MF_SEPARATOR, 0, NULL);
    AppendMenuW(m, MF_STRING, 3, L"Exit");
    SetForegroundWindow(g_msg);
    int c = TrackPopupMenu(m, TPM_RETURNCMD | TPM_RIGHTBUTTON, pt.x, pt.y, 0, g_msg, NULL);
    DestroyMenu(m);
    if (c == 1) ShellShow(TRUE);
    else if (c == 2) {
        g_set.overlayOn = !g_set.overlayOn;
        CfgSave();
        OverlaySetVisible(g_set.overlayOn && g_inGame);
        ShellRedraw();
    } else if (c == 3) AppExit();
}

static LRESULT CALLBACK MsgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    switch (m) {
    case WM_TIMER:  if (w == TIMER_SCAN) Scan(); return 0;
    case WM_HOTKEY: if (w == HOTKEY_ID) ShellToggle(); return 0;
    case WM_TRAY:
        if (l == WM_LBUTTONUP || l == WM_LBUTTONDBLCLK) ShellShow(TRUE);
        else if (l == WM_RBUTTONUP) TrayMenu();
        return 0;
    case WM_DESTROY: PostQuitMessage(0); return 0;
    }
    return DefWindowProcW(h, m, w, l);
}

int WINAPI wWinMain(HINSTANCE inst, HINSTANCE prev, LPWSTR cmd, int show)
{
    (void)prev; (void)show;
    g_inst = inst;

    {   // pixel-exact placement on scaled / multi-monitor setups
        typedef BOOL (WINAPI *PFN)(HANDLE);
        HMODULE u = GetModuleHandleW(L"user32.dll");
        PFN f = u ? (PFN)(void*)GetProcAddress(u, "SetProcessDpiAwarenessContext") : NULL;
        if (!f || !f((HANDLE)-4)) SetProcessDPIAware();
    }

    HANDLE mtx = CreateMutexW(NULL, TRUE, L"DeadCenter_SingleInstance");
    if (mtx && GetLastError() == ERROR_ALREADY_EXISTS) {
        HWND other = FindWindowW(APP_CLASS, NULL);
        if (other) { ShowWindow(other, SW_SHOW); SetForegroundWindow(other); }
        return 0;
    }

    {
        wchar_t self[MAX_PATH];
        GetModuleFileNameW(NULL, self, MAX_PATH);
        const wchar_t* b = wcsrchr(self, L'\\');
        wcsncpy(g_selfExe, b ? b + 1 : self, 63);
        g_selfExe[63] = 0;
    }

    CfgLoad();

    WNDCLASSEXW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = MsgProc;
    wc.hInstance = inst;
    wc.lpszClassName = MSG_CLASS;
    RegisterClassExW(&wc);
    g_msg = CreateWindowExW(0, MSG_CLASS, L"", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, inst, NULL);

    if (!OverlayCreate() || !ShellCreate()) return 1;

    if (!RegisterHotKey(g_msg, HOTKEY_ID, 0, VK_F12))
        ShellStatus(L"F12 is taken - use the tray icon.");

    BOOL silent = (cmd && wcsstr(cmd, L"/tray") != NULL);
    TrayShow(TRUE);
    if (!silent) ShellShow(TRUE);

    SetTimer(g_msg, TIMER_SCAN, 400, NULL);
    Scan();
    if (g_set.autoUpdate) UpdateCheckAsync(ShellHwnd(), TRUE);

    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    KillTimer(g_msg, TIMER_SCAN);
    UnregisterHotKey(g_msg, HOTKEY_ID);
    TrayShow(FALSE);
    CfgSave();
    return 0;
}
