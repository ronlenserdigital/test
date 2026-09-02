#include "app.h"
#include <stdlib.h>
#include <string.h>

// Live frame of the focused game, grabbed while it still has focus so the
// editor can show the real thing behind the crosshair after you alt-tab out.
#define CAPW 960
#define CAPH 540

static uint32_t* g_frame = NULL;      // 0xFFRRGGBB, CAPW x CAPH
static int       g_fw = 0, g_fh = 0;
static DWORD     g_last = 0;

BOOL CapHasFrame(void) { return g_frame != NULL; }

const uint32_t* CapFrame(int* w, int* h)
{
    if (w) *w = g_fw;
    if (h) *h = g_fh;
    return g_frame;
}

void CapClear(void)
{
    if (g_frame) { free(g_frame); g_frame = NULL; }
    g_fw = g_fh = 0;
}

void CapPoll(HWND gameWnd)
{
    DWORD now = GetTickCount();
    if (now - g_last < 700) return;          // ~1.4 fps is plenty for a backdrop
    g_last = now;
    if (!gameWnd) return;

    HMONITOR hm = MonitorFromWindow(gameWnd, MONITOR_DEFAULTTONEAREST);
    MONITORINFO mi; mi.cbSize = sizeof(mi);
    if (!GetMonitorInfoW(hm, &mi)) return;
    int sw = mi.rcMonitor.right - mi.rcMonitor.left;
    int sh = mi.rcMonitor.bottom - mi.rcMonitor.top;
    if (sw < 16 || sh < 16) return;

    // keep the monitor's aspect so the crosshair sits where it really sits
    int dw = CAPW, dh = (int)((int64_t)CAPW * sh / sw);
    if (dh > CAPH) { dh = CAPH; dw = (int)((int64_t)CAPH * sw / sh); }

    HDC screen = GetDC(NULL);
    if (!screen) return;
    HDC mem = CreateCompatibleDC(screen);

    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth = dw;
    bi.bmiHeader.biHeight = -dh;
    bi.bmiHeader.biPlanes = 1;
    bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB;

    void* bits = NULL;
    HBITMAP dib = CreateDIBSection(screen, &bi, DIB_RGB_COLORS, &bits, NULL, 0);
    if (dib) {
        HGDIOBJ old = SelectObject(mem, dib);
        SetStretchBltMode(mem, HALFTONE);
        SetBrushOrgEx(mem, 0, 0, NULL);
        BOOL ok = StretchBlt(mem, 0, 0, dw, dh, screen,
                             mi.rcMonitor.left, mi.rcMonitor.top, sw, sh,
                             SRCCOPY | CAPTUREBLT);
        if (ok) {
            // a protected / exclusive-fullscreen surface comes back solid black
            const uint32_t* p = (const uint32_t*)bits;
            int lit = 0;
            for (int i = 0; i < dw * dh; i += 97) if (p[i] & 0x00FFFFFF) { lit++; if (lit > 8) break; }
            if (lit > 8) {
                if (!g_frame || g_fw != dw || g_fh != dh) {
                    free(g_frame);
                    g_frame = (uint32_t*)malloc((size_t)dw * dh * 4);
                    g_fw = dw; g_fh = dh;
                }
                if (g_frame) {
                    memcpy(g_frame, bits, (size_t)dw * dh * 4);
                    for (int i = 0; i < dw * dh; i++) g_frame[i] |= 0xFF000000;
                } else { g_fw = g_fh = 0; }
            }
        }
        SelectObject(mem, old);
        DeleteObject(dib);
    }
    DeleteDC(mem);
    ReleaseDC(NULL, screen);
}
