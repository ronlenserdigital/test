#include "app.h"
#include <objidl.h>
#include <stdlib.h>
#include <algorithm>
using std::min;
using std::max;
#include <gdiplus.h>

static HWND      g_ov      = NULL;
static RECT      g_mon     = { 0, 0, 0, 0 };
static BOOL      g_visible = FALSE;

// decoded upload, straight ARGB
static uint32_t* g_img     = NULL;
static int       g_imgW    = 0, g_imgH = 0;
static wchar_t   g_imgSrc[MAX_PATH] = L"";
static ULONG_PTR g_gdip    = 0;

static void GdipInit(void)
{
    if (g_gdip) return;
    Gdiplus::GdiplusStartupInput in;
    Gdiplus::GdiplusStartup(&g_gdip, &in, NULL);
}

void OverlayDropImage(void)
{
    if (g_img) { free(g_img); g_img = NULL; }
    g_imgW = g_imgH = 0;
    g_imgSrc[0] = 0;
}

static BOOL LoadUpload(void)
{
    if (!g_cfg.imagePath[0]) return FALSE;
    if (g_img && !wcscmp(g_imgSrc, g_cfg.imagePath)) return TRUE;
    OverlayDropImage();
    GdipInit();

    Gdiplus::Bitmap bmp(g_cfg.imagePath, FALSE);
    if (bmp.GetLastStatus() != Gdiplus::Ok) return FALSE;

    int w = (int)bmp.GetWidth(), h = (int)bmp.GetHeight();
    if (w <= 0 || h <= 0 || w > 4096 || h > 4096) return FALSE;

    Gdiplus::Rect rc(0, 0, w, h);
    Gdiplus::BitmapData bd;
    if (bmp.LockBits(&rc, Gdiplus::ImageLockModeRead, PixelFormat32bppARGB, &bd) != Gdiplus::Ok)
        return FALSE;

    g_img = (uint32_t*)malloc((size_t)w * h * 4);
    if (g_img) {
        for (int y = 0; y < h; y++)
            memcpy(g_img + (size_t)y * w, (BYTE*)bd.Scan0 + (size_t)y * bd.Stride, (size_t)w * 4);
        g_imgW = w; g_imgH = h;
        wcsncpy(g_imgSrc, g_cfg.imagePath, MAX_PATH - 1);
    }
    bmp.UnlockBits(&bd);
    return g_img != NULL;
}

// premultiply + master opacity
static inline uint32_t Pre(uint32_t argb, int master)
{
    int a = (int)((argb >> 24) & 0xFF) * master / 255;
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
    g_mon = mi.rcMonitor;                 // full monitor, taskbar included
    OverlayRefresh();
}

void OverlayRefresh(void)
{
    if (!g_ov) return;
    if (g_mon.right == g_mon.left) OverlaySetMonitorFrom(NULL);

    int w = 0, h = 0, anchorX = 0, anchorY = 0;   // anchor = aim point inside bitmap
    BOOL img = g_cfg.useImage && LoadUpload();

    if (img) {
        w = max(1, g_imgW * g_cfg.imageScale / 100);
        h = max(1, g_imgH * g_cfg.imageScale / 100);
        anchorX = w / 2; anchorY = h / 2;
    } else {
        int s = g_cfg.scale;
        w = g_cfg.gridW * s;
        h = g_cfg.gridH * s;
        anchorX = (g_cfg.gridW / 2) * s + s / 2;   // centre of the aim cell
        anchorY = (g_cfg.gridH / 2) * s + s / 2;
    }
    if (w < 1 || h < 1 || w > 8192 || h > 8192) return;

    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize        = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth       = w;
    bi.bmiHeader.biHeight      = -h;             // top-down
    bi.bmiHeader.biPlanes      = 1;
    bi.bmiHeader.biBitCount    = 32;
    bi.bmiHeader.biCompression = BI_RGB;

    void* bits = NULL;
    HDC screen = GetDC(NULL);
    HBITMAP dib = CreateDIBSection(screen, &bi, DIB_RGB_COLORS, &bits, NULL, 0);
    if (!dib) { ReleaseDC(NULL, screen); return; }
    HDC mem = CreateCompatibleDC(screen);
    HGDIOBJ old = SelectObject(mem, dib);

    uint32_t* out = (uint32_t*)bits;
    memset(out, 0, (size_t)w * h * 4);

    if (img) {
        for (int y = 0; y < h; y++) {
            int sy = (int)((int64_t)y * g_imgH / h);
            const uint32_t* srow = g_img + (size_t)sy * g_imgW;
            uint32_t* drow = out + (size_t)y * w;
            for (int x = 0; x < w; x++)
                drow[x] = Pre(srow[(int)((int64_t)x * g_imgW / w)], g_cfg.opacity);
        }
    } else {
        int s = g_cfg.scale;
        for (int cy = 0; cy < g_cfg.gridH; cy++) {
            for (int cx = 0; cx < g_cfg.gridW; cx++) {
                uint32_t c = g_cfg.px[cy * MAXGRID + cx];
                if (!(c & 0xFF000000)) continue;
                uint32_t p = Pre(c, g_cfg.opacity);
                for (int y = 0; y < s; y++) {
                    uint32_t* row = out + (size_t)(cy * s + y) * w + cx * s;
                    for (int x = 0; x < s; x++) row[x] = p;
                }
            }
        }
    }

    int cxs = g_mon.left + (g_mon.right - g_mon.left) / 2 + g_cfg.offsetX;
    int cys = g_mon.top  + (g_mon.bottom - g_mon.top) / 2 + g_cfg.offsetY;
    POINT pos = { cxs - anchorX, cys - anchorY };
    SIZE  sz  = { w, h };
    POINT src = { 0, 0 };
    BLENDFUNCTION bf = { AC_SRC_OVER, 0, 255, AC_SRC_ALPHA };

    UpdateLayeredWindow(g_ov, screen, &pos, &sz, mem, &src, 0, &bf, ULW_ALPHA);

    SelectObject(mem, old);
    DeleteDC(mem);
    DeleteObject(dib);
    ReleaseDC(NULL, screen);
}

void OverlaySetVisible(BOOL show)
{
    if (!g_ov) return;
    show = show && g_cfg.overlayOn;
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
    wc.cbSize        = sizeof(wc);
    wc.lpfnWndProc   = OvProc;
    wc.hInstance     = g_inst;
    wc.lpszClassName = OV_CLASS;
    RegisterClassExW(&wc);

    g_ov = CreateWindowExW(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
        OV_CLASS, L"", WS_POPUP, 0, 0, 16, 16, NULL, NULL, g_inst, NULL);
    if (!g_ov) return FALSE;

    OverlaySetMonitorFrom(NULL);
    return TRUE;
}
