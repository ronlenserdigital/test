#include "app.h"
#include <stdlib.h>

static HWND g_ov = NULL;
static RECT g_mon = { 0, 0, 0, 0 };
static BOOL g_visible = FALSE;

void OverlayResolution(int* w, int* h)
{
    if (g_mon.right == g_mon.left) OverlaySetMonitorFrom(NULL);
    if (w) *w = g_mon.right - g_mon.left;
    if (h) *h = g_mon.bottom - g_mon.top;
}

static inline uint32_t Pre(uint32_t argb)
{
    int a = (int)((argb >> 24) & 0xFF);
    if (!a) return 0;
    int r = ((argb >> 16) & 0xFF) * a / 255;
    int g = ((argb >>  8) & 0xFF) * a / 255;
    int b = ( argb        & 0xFF) * a / 255;
    return ((uint32_t)a << 24) | ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b;
}

void OverlaySetMonitorFrom(HWND fg)
{
    HMONITOR hm = MonitorFromWindow(fg ? fg : GetDesktopWindow(), MONITOR_DEFAULTTOPRIMARY);
    MONITORINFO mi; mi.cbSize = sizeof(mi);
    if (!GetMonitorInfoW(hm, &mi)) return;
    if (memcmp(&mi.rcMonitor, &g_mon, sizeof(RECT)) == 0) return;
    g_mon = mi.rcMonitor;
    OverlayRefresh();
}

void OverlayRefresh(void)
{
    if (!g_ov) return;
    if (g_mon.right == g_mon.left) { OverlaySetMonitorFrom(NULL); return; }

    ChBitmap b;
    if (!ChBuild(&g_ch, &b)) { ShowWindow(g_ov, SW_HIDE); g_visible = FALSE; return; }
    if (b.w < 1 || b.h < 1 || b.w > 8192 || b.h > 8192) { ChFree(&b); return; }

    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize        = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth       = b.w;
    bi.bmiHeader.biHeight      = -b.h;
    bi.bmiHeader.biPlanes      = 1;
    bi.bmiHeader.biBitCount    = 32;
    bi.bmiHeader.biCompression = BI_RGB;

    void* bits = NULL;
    HDC screen = GetDC(NULL);
    HBITMAP dib = CreateDIBSection(screen, &bi, DIB_RGB_COLORS, &bits, NULL, 0);
    if (!dib) { ReleaseDC(NULL, screen); ChFree(&b); return; }
    HDC mem = CreateCompatibleDC(screen);
    HGDIOBJ old = SelectObject(mem, dib);

    uint32_t* out = (uint32_t*)bits;
    for (int i = 0; i < b.w * b.h; i++) out[i] = Pre(b.px[i]);

    int cx = g_mon.left + (g_mon.right - g_mon.left) / 2 + g_ch.offsetX;
    int cy = g_mon.top  + (g_mon.bottom - g_mon.top) / 2 + g_ch.offsetY;
    POINT pos = { cx - b.ax, cy - b.ay };
    SIZE  sz  = { b.w, b.h };
    POINT src = { 0, 0 };
    BLENDFUNCTION bf = { AC_SRC_OVER, 0, 255, AC_SRC_ALPHA };
    UpdateLayeredWindow(g_ov, screen, &pos, &sz, mem, &src, 0, &bf, ULW_ALPHA);

    SelectObject(mem, old);
    DeleteDC(mem);
    DeleteObject(dib);
    ReleaseDC(NULL, screen);
    ChFree(&b);
}

void OverlaySetVisible(BOOL show)
{
    if (!g_ov) return;
    show = show && g_set.overlayOn;
    if (show == g_visible) return;
    g_visible = show;
    if (show) {
        OverlayRefresh();
        SetWindowPos(g_ov, HWND_TOPMOST, 0, 0, 0, 0,
                     SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW);
    } else {
        ShowWindow(g_ov, SW_HIDE);
    }
}

static LRESULT CALLBACK OvProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    if (m == WM_DISPLAYCHANGE) { g_mon.right = g_mon.left; OverlaySetMonitorFrom(NULL); }
    return DefWindowProcW(h, m, w, l);
}

BOOL OverlayCreate(void)
{
    WNDCLASSEXW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = OvProc;
    wc.hInstance = g_inst;
    wc.lpszClassName = OV_CLASS;
    RegisterClassExW(&wc);

    g_ov = CreateWindowExW(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
        OV_CLASS, L"", WS_POPUP, 0, 0, 16, 16, NULL, NULL, g_inst, NULL);
    if (!g_ov) return FALSE;
    OverlaySetMonitorFrom(NULL);
    return TRUE;
}
