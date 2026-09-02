#include "app.h"
#include <shellapi.h>
#include <psapi.h>
#include <stdio.h>
#include <wchar.h>

HINSTANCE g_inst = NULL;
wchar_t   g_lastGame[64] = L"";

static HWND           g_msgWnd = NULL;
static NOTIFYICONDATAW g_nid;
static BOOL           g_trayOn = FALSE;
static BOOL           g_inGame = FALSE;
static wchar_t        g_selfExe[64] = L"";

#define TIMER_SCAN 1

// windows that are fullscreen but are not games
static const wchar_t* kIgnore[] = {
    L"explorer.exe", L"searchhost.exe", L"searchui.exe", L"shellexperiencehost.exe",
    L"applicationframehost.exe", L"startmenuexperiencehost.exe", L"taskmgr.exe",
    L"lockapp.exe", L"textinputhost.exe", L"dwm.exe", NULL
};

static BOOL Ignored(const wchar_t* exe)
{
    if (!_wcsicmp(exe, g_selfExe)) return TRUE;
    for (int i = 0; kIgnore[i]; i++)
        if (!_wcsicmp(exe, kIgnore[i])) return TRUE;
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
    const wchar_t* base = wcsrchr(path, L'\\');
    wcsncpy(out, base ? base + 1 : path, cch - 1);
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
    // allow a couple of pixels of slop for borderless windows
    return wr.left <= m.left + 2 && wr.top <= m.top + 2 &&
           wr.right >= m.right - 2 && wr.bottom >= m.bottom - 2;
}

static void Scan(void)
{
    HWND fg = GetForegroundWindow();
    wchar_t exe[64] = L"";
    BOOL game = FALSE;

    if (fg && ForegroundExe(fg, exe, 64) && !Ignored(exe)) {
        if (GameListHas(exe))                            game = TRUE;
        else if (g_cfg.autoDetect && IsFullscreen(fg))    game = TRUE;
        if (game) wcsncpy(g_lastGame, exe, 63);
    }

    if (game) OverlaySetMonitorFrom(fg);

    BOOL want = g_cfg.overlayOn && (game || !g_cfg.onlyInGame);
    OverlaySetVisible(want);

    if (game != g_inGame) {
        g_inGame = game;
        wchar_t s[160];
        if (game) {
            _snwprintf(s, 160, L"Game detected: %s  \x2014  overlay ACTIVE", g_lastGame);
            if (g_cfg.autoOpenPanel) { TrayShow(TRUE); PanelShow(TRUE); }
        } else {
            wcscpy(s, g_cfg.onlyInGame ? L"No game in focus - overlay hidden."
                                       : L"No game in focus - overlay always on.");
        }
        s[159] = 0;
        PanelStatus(s);
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
    for (int i = 0; i < N; i++) {
        if (i > 12 && i < 19) continue;                 // centre gap
        p[15 * N + i] = 0xFF00E08A; p[16 * N + i] = 0xFF00E08A;
        p[i * N + 15] = 0xFF00E08A; p[i * N + 16] = 0xFF00E08A;
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
        g_nid.hWnd   = g_msgWnd;
        g_nid.uID    = 1;
        g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
        g_nid.uCallbackMessage = WM_TRAY;
        g_nid.hIcon  = MakeIcon();
        wcscpy(g_nid.szTip, APP_NAME L" - F12 to show/hide");
        Shell_NotifyIconW(NIM_ADD, &g_nid);
    } else {
        Shell_NotifyIconW(NIM_DELETE, &g_nid);
    }
    g_trayOn = show;
}

void AppExit(void)
{
    CfgSave(&g_cfg);
    TrayShow(FALSE);
    OverlaySetVisible(FALSE);
    PostQuitMessage(0);
}

static void TrayMenu(void)
{
    POINT pt; GetCursorPos(&pt);
    HMENU m = CreatePopupMenu();
    AppendMenuW(m, MF_STRING, 1, L"Show panel (F12)");
    AppendMenuW(m, MF_STRING | (g_cfg.overlayOn ? MF_CHECKED : 0), 2, L"Overlay enabled");
    AppendMenuW(m, MF_SEPARATOR, 0, NULL);
    AppendMenuW(m, MF_STRING, 3, L"Exit");
    SetForegroundWindow(g_msgWnd);
    int c = TrackPopupMenu(m, TPM_RETURNCMD | TPM_RIGHTBUTTON, pt.x, pt.y, 0, g_msgWnd, NULL);
    DestroyMenu(m);
    if (c == 1) PanelShow(TRUE);
    else if (c == 2) { g_cfg.overlayOn = !g_cfg.overlayOn; CfgSave(&g_cfg); OverlaySetVisible(g_cfg.overlayOn && g_inGame); PanelRedraw(); }
    else if (c == 3) AppExit();
}

static LRESULT CALLBACK MsgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    switch (m) {
    case WM_TIMER:
        if (w == TIMER_SCAN) Scan();
        return 0;
    case WM_HOTKEY:
        if (w == HOTKEY_ID) PanelToggle();
        return 0;
    case WM_TRAY:
        if (l == WM_LBUTTONUP || l == WM_LBUTTONDBLCLK) PanelShow(TRUE);
        else if (l == WM_RBUTTONUP) TrayMenu();
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;
    }
    return DefWindowProcW(h, m, w, l);
}

int WINAPI wWinMain(HINSTANCE inst, HINSTANCE prev, LPWSTR cmd, int show)
{
    (void)prev; (void)show;
    g_inst = inst;

    // pixel-exact overlay placement on scaled / multi-monitor setups
    {
        typedef BOOL (WINAPI *PFN_CTX)(HANDLE);
        HMODULE u = GetModuleHandleW(L"user32.dll");
        PFN_CTX setCtx = u ? (PFN_CTX)(void*)GetProcAddress(u, "SetProcessDpiAwarenessContext") : NULL;
        if (!setCtx || !setCtx((HANDLE)-4))   // PER_MONITOR_AWARE_V2
            SetProcessDPIAware();
    }

    HANDLE mtx = CreateMutexW(NULL, TRUE, L"PixelCross_SingleInstance");
    if (mtx && GetLastError() == ERROR_ALREADY_EXISTS) {
        HWND other = FindWindowW(APP_CLASS, NULL);
        if (other) { ShowWindow(other, SW_SHOW); SetForegroundWindow(other); }
        return 0;
    }

    {   // our own exe name, so auto-detect never targets us
        wchar_t self[MAX_PATH];
        GetModuleFileNameW(NULL, self, MAX_PATH);
        const wchar_t* b = wcsrchr(self, L'\\');
        wcsncpy(g_selfExe, b ? b + 1 : self, 63);
        g_selfExe[63] = 0;
    }

    CfgLoad(&g_cfg);

    WNDCLASSEXW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = MsgProc;
    wc.hInstance = inst;
    wc.lpszClassName = L"PixelCrossMsg";
    RegisterClassExW(&wc);
    g_msgWnd = CreateWindowExW(0, L"PixelCrossMsg", L"", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, inst, NULL);

    if (!OverlayCreate() || !PanelCreate()) return 1;

    if (!RegisterHotKey(g_msgWnd, HOTKEY_ID, 0, VK_F12))
        PanelStatus(L"F12 is taken by another app - use the tray icon.");

    BOOL silent = (cmd && wcsstr(cmd, L"/tray") != NULL);
    TrayShow(TRUE);
    if (!silent) PanelShow(TRUE);

    SetTimer(g_msgWnd, TIMER_SCAN, 400, NULL);
    Scan();

    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    KillTimer(g_msgWnd, TIMER_SCAN);
    UnregisterHotKey(g_msgWnd, HOTKEY_ID);
    TrayShow(FALSE);
    CfgSave(&g_cfg);
    return 0;
}
