#include "app.h"
#include <objidl.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <algorithm>
using std::min;
using std::max;
#include <gdiplus.h>

static uint32_t* g_img = NULL;
static int       g_imgW = 0, g_imgH = 0;
static wchar_t   g_imgSrc[MAX_PATH] = L"";
static ULONG_PTR g_gdip = 0;

void ChDropImage(void)
{
    if (g_img) { free(g_img); g_img = NULL; }
    g_imgW = g_imgH = 0;
    g_imgSrc[0] = 0;
}

static BOOL LoadImage32(const wchar_t* path)
{
    if (!path || !path[0]) return FALSE;
    if (g_img && !wcscmp(g_imgSrc, path)) return TRUE;
    ChDropImage();
    if (!g_gdip) { Gdiplus::GdiplusStartupInput in; Gdiplus::GdiplusStartup(&g_gdip, &in, NULL); }

    Gdiplus::Bitmap bmp(path, FALSE);
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
        wcsncpy(g_imgSrc, path, MAX_PATH - 1);
    }
    bmp.UnlockBits(&bd);
    return g_img != NULL;
}

// ------------------------------------------------------------ raster helpers
static int   S_W = 0, S_H = 0;
static uint32_t* S_P = NULL;

static inline void Px(int x, int y, uint32_t c)
{
    if (x < 0 || y < 0 || x >= S_W || y >= S_H) return;
    S_P[y * S_W + x] = c;
}

static void Bar(int x0, int y0, int x1, int y1, uint32_t c)
{
    for (int y = y0; y <= y1; y++)
        for (int x = x0; x <= x1; x++) Px(x, y, c);
}

// 1px outline around everything already drawn
static void Outline(uint32_t oc)
{
    uint32_t* copy = (uint32_t*)malloc((size_t)S_W * S_H * 4);
    if (!copy) return;
    memcpy(copy, S_P, (size_t)S_W * S_H * 4);
    for (int y = 0; y < S_H; y++)
        for (int x = 0; x < S_W; x++) {
            if (copy[y * S_W + x] & 0xFF000000) continue;
            int hit = 0;
            for (int dy = -1; dy <= 1 && !hit; dy++)
                for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= S_W || ny >= S_H) continue;
                    if (copy[ny * S_W + nx] & 0xFF000000) { hit = 1; break; }
                }
            if (hit) S_P[y * S_W + x] = oc;
        }
    free(copy);
}

static void ApplyOpacity(int op)
{
    if (op >= 255) return;
    for (int i = 0; i < S_W * S_H; i++) {
        uint32_t c = S_P[i];
        int a = (int)((c >> 24) & 0xFF) * op / 255;
        S_P[i] = (c & 0x00FFFFFF) | ((uint32_t)a << 24);
    }
}

// ------------------------------------------------------------ presets
struct Pre { const wchar_t* name; int style, len, thick, gap, dot, dotSize, outline; };
static const Pre kPre[] = {
    { L"Classic",   ST_CROSS,   8, 2, 4, 0, 2, 1 },
    { L"Micro Dot", ST_DOT,     0, 1, 0, 1, 3, 1 },
    { L"Precision", ST_CROSS,  12, 1, 6, 1, 1, 1 },
    { L"Tight",     ST_CROSS,   5, 2, 2, 1, 2, 1 },
    { L"T-Frame",   ST_TSHAPE, 10, 2, 5, 1, 2, 1 },
    { L"Ring",      ST_CIRCLE,  6, 2, 4, 1, 2, 1 },
    { L"Chevron",   ST_CHEVRON, 8, 2, 3, 1, 2, 1 },
    { L"Sniper",    ST_CROSS,  20, 1, 8, 1, 1, 1 },
};
int ChPresetCount(void) { return (int)(sizeof(kPre) / sizeof(kPre[0])); }
const wchar_t* ChPresetName(int i) { return kPre[i % ChPresetCount()].name; }

void ChDefault(Crosshair* c, int preset)
{
    const Pre* p = &kPre[preset % ChPresetCount()];
    int keepGrid = (c->gridW >= 8);
    uint32_t keepPx[MAXGRID * MAXGRID];
    if (keepGrid) memcpy(keepPx, c->px, sizeof(keepPx));

    ZeroMemory(c, sizeof(*c));
    wcsncpy(c->name, p->name, 31);
    c->style        = p->style;
    c->color        = 0xFF00F5A0;
    c->outlineColor = 0xE6000000;
    c->length       = p->len;
    c->thickness    = p->thick;
    c->gap          = p->gap;
    c->dotSize      = p->dotSize;
    c->centerDot    = p->dot;
    c->outline      = p->outline;
    c->opacity      = 255;
    c->gridW = c->gridH = 32;
    c->pxScale = 2;
    c->imageScale = 100;
    if (keepGrid) memcpy(c->px, keepPx, sizeof(keepPx));
}

// ------------------------------------------------------------ build
BOOL ChBuild(const Crosshair* c, ChBitmap* out)
{
    ZeroMemory(out, sizeof(*out));

    if (c->style == ST_IMAGE) {
        if (!LoadImage32(c->image)) return FALSE;
        int w = max(1, g_imgW * c->imageScale / 100);
        int h = max(1, g_imgH * c->imageScale / 100);
        if (w > 4096 || h > 4096) return FALSE;
        uint32_t* buf = (uint32_t*)malloc((size_t)w * h * 4);
        if (!buf) return FALSE;
        for (int y = 0; y < h; y++) {
            const uint32_t* srow = g_img + (size_t)((int64_t)y * g_imgH / h) * g_imgW;
            uint32_t* drow = buf + (size_t)y * w;
            for (int x = 0; x < w; x++) drow[x] = srow[(int)((int64_t)x * g_imgW / w)];
        }
        S_P = buf; S_W = w; S_H = h;
        ApplyOpacity(c->opacity);
        out->px = buf; out->w = w; out->h = h; out->ax = w / 2; out->ay = h / 2;
        S_P = NULL;
        return TRUE;
    }

    if (c->style == ST_PIXEL) {
        int s = c->pxScale < 1 ? 1 : c->pxScale;
        int w = c->gridW * s, h = c->gridH * s;
        uint32_t* buf = (uint32_t*)calloc((size_t)w * h, 4);
        if (!buf) return FALSE;
        S_P = buf; S_W = w; S_H = h;
        for (int cy = 0; cy < c->gridH; cy++)
            for (int cx = 0; cx < c->gridW; cx++) {
                uint32_t v = c->px[cy * MAXGRID + cx];
                if (!(v & 0xFF000000)) continue;
                Bar(cx * s, cy * s, cx * s + s - 1, cy * s + s - 1, v);
            }
        if (c->outline) Outline(c->outlineColor);
        ApplyOpacity(c->opacity);
        out->px = buf; out->w = w; out->h = h;
        out->ax = (c->gridW / 2) * s + s / 2;
        out->ay = (c->gridH / 2) * s + s / 2;
        S_P = NULL;
        return TRUE;
    }

    // parametric styles: odd-sized canvas so there is one true centre pixel
    int t   = max(1, c->thickness);
    int len = max(0, c->length);
    int gap = max(0, c->gap);
    int dot = max(1, c->dotSize);
    int half = gap + len + t + dot + 3;
    if (half > 400) half = 400;
    int n = half * 2 + 1;

    uint32_t* buf = (uint32_t*)calloc((size_t)n * n, 4);
    if (!buf) return FALSE;
    S_P = buf; S_W = S_H = n;

    uint32_t col = c->color | 0xFF000000;
    int a0 = half - (t / 2), a1 = a0 + t - 1;      // arm band around centre

    switch (c->style) {
    case ST_CROSS:
    case ST_TSHAPE:
        if (len > 0) {
            Bar(half + gap + 1, a0, half + gap + len, a1, col);          // right
            Bar(half - gap - len, a0, half - gap - 1, a1, col);          // left
            Bar(a0, half + gap + 1, a1, half + gap + len, col);          // down
            if (c->style == ST_CROSS)
                Bar(a0, half - gap - len, a1, half - gap - 1, col);      // up
        }
        break;
    case ST_CIRCLE: {
        double r = gap + len;
        double inner = r - t / 2.0, outer = r + t / 2.0;
        for (int y = -half; y <= half; y++)
            for (int x = -half; x <= half; x++) {
                double d = sqrt((double)x * x + (double)y * y);
                if (d >= inner - 0.5 && d <= outer + 0.5) Px(half + x, half + y, col);
            }
        break;
    }
    case ST_CHEVRON:
        for (int i = 0; i <= len; i++)
            for (int k = 0; k < t; k++) {
                Px(half - i, half + gap + i + k, col);
                Px(half + i, half + gap + i + k, col);
            }
        break;
    default: break;
    }

    if (c->centerDot || c->style == ST_DOT) {
        int d0 = half - (dot / 2), d1 = d0 + dot - 1;
        Bar(d0, d0, d1, d1, col);
    }
    if (c->outline) Outline(c->outlineColor);
    ApplyOpacity(c->opacity);

    out->px = buf; out->w = n; out->h = n; out->ax = half; out->ay = half;
    S_P = NULL;
    return TRUE;
}

void ChFree(ChBitmap* b)
{
    if (b && b->px) { free(b->px); b->px = NULL; }
}
