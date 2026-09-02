#include "app.h"
#include <objidl.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>
#include <algorithm>
using std::min;
using std::max;
#include <gdiplus.h>

static uint32_t* g_img = NULL;
static int       g_imgW = 0, g_imgH = 0;
static wchar_t   g_imgSrc[MAX_PATH] = L"";
static ULONG_PTR g_gdip = 0;

static uint32_t* g_bd = NULL;
static int       g_bdW = 0, g_bdH = 0;
static wchar_t   g_bdSrc[MAX_PATH] = L"";

void ChDropBackdrop(void)
{
    if (g_bd) { free(g_bd); g_bd = NULL; }
    g_bdW = g_bdH = 0;
    g_bdSrc[0] = 0;
}

void ChDropImage(void)
{
    if (g_img) { free(g_img); g_img = NULL; }
    g_imgW = g_imgH = 0;
    g_imgSrc[0] = 0;
}

static BOOL LoadInto(const wchar_t* path, uint32_t** dst, int* dw, int* dh)
{
    if (!path || !path[0]) return FALSE;
    if (!g_gdip) { Gdiplus::GdiplusStartupInput in; Gdiplus::GdiplusStartup(&g_gdip, &in, NULL); }

    Gdiplus::Bitmap bmp(path, FALSE);
    if (bmp.GetLastStatus() != Gdiplus::Ok) return FALSE;
    int w = (int)bmp.GetWidth(), h = (int)bmp.GetHeight();
    if (w <= 0 || h <= 0 || w > 8192 || h > 8192) return FALSE;

    Gdiplus::Rect rc(0, 0, w, h);
    Gdiplus::BitmapData bd;
    if (bmp.LockBits(&rc, Gdiplus::ImageLockModeRead, PixelFormat32bppARGB, &bd) != Gdiplus::Ok)
        return FALSE;
    uint32_t* buf = (uint32_t*)malloc((size_t)w * h * 4);
    if (buf) {
        for (int y = 0; y < h; y++)
            memcpy(buf + (size_t)y * w, (BYTE*)bd.Scan0 + (size_t)y * bd.Stride, (size_t)w * 4);
        *dst = buf; *dw = w; *dh = h;
    }
    bmp.UnlockBits(&bd);
    return buf != NULL;
}

static BOOL LoadImage32(const wchar_t* path)
{
    if (!path || !path[0]) return FALSE;
    if (g_img && !wcscmp(g_imgSrc, path)) return TRUE;
    ChDropImage();
    if (!LoadInto(path, &g_img, &g_imgW, &g_imgH)) return FALSE;
    wcsncpy(g_imgSrc, path, MAX_PATH - 1);
    g_imgSrc[MAX_PATH - 1] = 0;
    return TRUE;
}

BOOL ChBackdrop(const wchar_t* path, const uint32_t** px, int* w, int* h)
{
    if (!path || !path[0]) return FALSE;
    if (!g_bd || wcscmp(g_bdSrc, path)) {
        ChDropBackdrop();
        if (!LoadInto(path, &g_bd, &g_bdW, &g_bdH)) return FALSE;
        wcsncpy(g_bdSrc, path, MAX_PATH - 1);
        g_bdSrc[MAX_PATH - 1] = 0;
    }
    *px = g_bd; *w = g_bdW; *h = g_bdH;
    return TRUE;
}

// ---- friendly names for the games we recognise ---------------------------
struct GameId { const wchar_t* exe; const wchar_t* name; uint32_t brand; };
static const GameId kGames[] = {
    { L"FortniteClient-Win64-Shipping.exe", L"Fortnite",           0xFF2AA8F2 },
    { L"VALORANT-Win64-Shipping.exe",       L"VALORANT",           0xFFFF4655 },
    { L"cs2.exe",                           L"Counter-Strike 2",   0xFFF0A02A },
    { L"csgo.exe",                          L"CS:GO",              0xFFF0A02A },
    { L"r5apex.exe",                        L"Apex Legends",       0xFFDA292A },
    { L"Overwatch.exe",                     L"Overwatch 2",        0xFFF89A22 },
    { L"RainbowSix.exe",                    L"Rainbow Six Siege",  0xFF3A7BD5 },
    { L"ModernWarfare.exe",                 L"Call of Duty",       0xFF6EA832 },
    { L"destiny2.exe",                      L"Destiny 2",          0xFF4A7FB5 },
    { L"MarvelRivals.exe",                  L"Marvel Rivals",      0xFFE8443A },
    { L"TheFinals.exe",                     L"THE FINALS",         0xFFD01F3C },
    { L"deadlock.exe",                      L"Deadlock",           0xFFC48A3A },
    { L"PUBG.exe",                          L"PUBG",               0xFFF2A900 },
    { L"RustClient.exe",                    L"Rust",               0xFFCD412B },
    { NULL, NULL, 0 }
};

const wchar_t* PrettyGameName(const wchar_t* exe)
{
    static wchar_t out[64];
    if (!exe || !exe[0]) return L"";
    for (int i = 0; kGames[i].exe; i++)
        if (!_wcsicmp(exe, kGames[i].exe)) return kGames[i].name;

    wcsncpy(out, exe, 63); out[63] = 0;
    wchar_t* d = wcsrchr(out, L'.');
    if (d) *d = 0;
    static const wchar_t* cut[] = { L"Client-Win64-Shipping", L"-Win64-Shipping",
                                    L"Client-Win64", L"-Win64", L"-Shipping", L"_BE", NULL };
    for (int i = 0; cut[i]; i++) {
        wchar_t* c = wcsstr(out, cut[i]);
        if (c) *c = 0;
    }
    size_t n = wcslen(out);
    while (n && (out[n - 1] == L'-' || out[n - 1] == L'_' || out[n - 1] == L' ')) out[--n] = 0;
    if (!out[0]) { wcsncpy(out, exe, 63); out[63] = 0; }
    if (out[0] >= L'a' && out[0] <= L'z') out[0] = (wchar_t)(out[0] - 32);
    return out;
}

uint32_t GameBrandColor(const wchar_t* exe)
{
    if (exe && exe[0])
        for (int i = 0; kGames[i].exe; i++)
            if (!_wcsicmp(exe, kGames[i].exe)) return kGames[i].brand;
    return 0xFF00FCFD;
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

// soft bloom: blurred alpha halo of the crosshair, drawn behind it
static void Glow(uint32_t col, int amount)
{
    if (amount <= 0) return;
    int n = S_W * S_H;
    uint8_t* a = (uint8_t*)calloc(n, 1);
    uint8_t* b = (uint8_t*)calloc(n, 1);
    if (!a || !b) { free(a); free(b); return; }
    for (int i = 0; i < n; i++) a[i] = (uint8_t)((S_P[i] >> 24) & 0xFF);

    for (int pass = 0; pass < 2; pass++) {
        for (int y = 0; y < S_H; y++)
            for (int x = 0; x < S_W; x++) {
                int sum = 0, cnt = 0;
                for (int k = -2; k <= 2; k++) {
                    int nx = x + k;
                    if (nx < 0 || nx >= S_W) continue;
                    sum += a[y * S_W + nx]; cnt++;
                }
                b[y * S_W + x] = (uint8_t)(cnt ? sum / cnt : 0);
            }
        for (int y = 0; y < S_H; y++)
            for (int x = 0; x < S_W; x++) {
                int sum = 0, cnt = 0;
                for (int k = -2; k <= 2; k++) {
                    int ny = y + k;
                    if (ny < 0 || ny >= S_H) continue;
                    sum += b[ny * S_W + x]; cnt++;
                }
                a[y * S_W + x] = (uint8_t)(cnt ? sum / cnt : 0);
            }
    }

    for (int i = 0; i < n; i++) {
        if (S_P[i] & 0xFF000000) continue;
        int ga = a[i] * amount / 100;
        if (ga <= 0) continue;
        if (ga > 200) ga = 200;
        S_P[i] = ((uint32_t)ga << 24) | (col & 0x00FFFFFF);
    }
    free(a); free(b);
}

// vertical two-colour blend across the drawn glyph
static void Gradient(uint32_t from, uint32_t to)
{
    int top = -1, bot = -1;
    for (int y = 0; y < S_H && top < 0; y++)
        for (int x = 0; x < S_W; x++) if (S_P[y * S_W + x] & 0xFF000000) { top = y; break; }
    for (int y = S_H - 1; y >= 0 && bot < 0; y--)
        for (int x = 0; x < S_W; x++) if (S_P[y * S_W + x] & 0xFF000000) { bot = y; break; }
    if (top < 0 || bot <= top) return;

    int fr = (from >> 16) & 0xFF, fg = (from >> 8) & 0xFF, fb = from & 0xFF;
    int tr = (to >> 16) & 0xFF,  tg = (to >> 8) & 0xFF,  tb = to & 0xFF;
    for (int y = top; y <= bot; y++) {
        int t = (y - top) * 255 / (bot - top);
        uint32_t c = ((uint32_t)(fr + (tr - fr) * t / 255) << 16) |
                     ((uint32_t)(fg + (tg - fg) * t / 255) << 8) |
                      (uint32_t)(fb + (tb - fb) * t / 255);
        for (int x = 0; x < S_W; x++) {
            uint32_t p = S_P[y * S_W + x];
            if (p & 0xFF000000) S_P[y * S_W + x] = (p & 0xFF000000) | c;
        }
    }
}

// soft dark copy offset behind the glyph
static void Shadow(int amount, int ox, int oy)
{
    if (amount <= 0) return;
    int n = S_W * S_H;
    uint32_t* src = (uint32_t*)malloc((size_t)n * 4);
    if (!src) return;
    memcpy(src, S_P, (size_t)n * 4);
    for (int y = 0; y < S_H; y++)
        for (int x = 0; x < S_W; x++) {
            int sx = x - ox, sy = y - oy;
            if (sx < 0 || sy < 0 || sx >= S_W || sy >= S_H) continue;
            int sa = (src[sy * S_W + sx] >> 24) & 0xFF;
            if (!sa) continue;
            if (S_P[y * S_W + x] & 0xFF000000) continue;
            int a = sa * amount / 100;
            if (a > 220) a = 220;
            S_P[y * S_W + x] = (uint32_t)a << 24;      // black, alpha only
        }
    free(src);
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
    c->color        = 0xFF00FCFD;
    c->outlineColor = 0xE6000000;
    c->length       = p->len;
    c->thickness    = p->thick;
    c->gap          = p->gap;
    c->dotSize      = p->dotSize;
    c->centerDot    = p->dot;
    c->outline      = p->outline;
    c->opacity      = 255;
    c->glow         = 0;
    c->gradColor    = 0xFF00C8D8;
    c->shadowX      = 1;
    c->shadowY      = 1;
    c->gridW = c->gridH = 32;
    c->pxScale = 2;
    c->imageScale = 100;
    if (keepGrid) memcpy(c->px, keepPx, sizeof(keepPx));
}

// ------------------------------------------------------------ build
BOOL ChBuild(const Crosshair* c, ChBitmap* out)
{
    ZeroMemory(out, sizeof(*out));

    if (c->style == ST_IMAGE && c->image[0] && LoadImage32(c->image)) {
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
        if (c->gradient) Gradient(c->color, c->gradColor);
        if (c->outline) Outline(c->outlineColor);
        Shadow(c->shadow, c->shadowX, c->shadowY);
        Glow(c->color, c->glow);
        ApplyOpacity(c->opacity);
        out->px = buf; out->w = w; out->h = h;
        out->ax = (c->gridW / 2) * s + s / 2;
        out->ay = (c->gridH / 2) * s + s / 2;
        S_P = NULL;
        return TRUE;
    }

    // parametric styles: odd-sized canvas so there is one true centre pixel
    int style = c->style;
    if (style == ST_IMAGE || style == ST_PIXEL) style = ST_CROSS;   // no source -> draw a cross
    int t   = max(1, c->thickness);
    int len = max(0, c->length);
    int gap = max(0, c->gap);
    int dot = max(1, c->dotSize);
    int sh = c->shadow > 0 ? (abs(c->shadowX) > abs(c->shadowY) ? abs(c->shadowX) : abs(c->shadowY)) : 0;
    int half = gap + len + t + dot + 3 + (c->glow > 0 ? 6 : 0) + sh;
    if (half > 400) half = 400;
    int n = half * 2 + 1;

    uint32_t* buf = (uint32_t*)calloc((size_t)n * n, 4);
    if (!buf) return FALSE;
    S_P = buf; S_W = S_H = n;

    uint32_t col = c->color | 0xFF000000;
    int a0 = half - (t / 2), a1 = a0 + t - 1;      // arm band around centre

    switch (style) {
    case ST_CROSS:
    case ST_TSHAPE:
        if (len > 0) {
            Bar(half + gap + 1, a0, half + gap + len, a1, col);          // right
            Bar(half - gap - len, a0, half - gap - 1, a1, col);          // left
            Bar(a0, half + gap + 1, a1, half + gap + len, col);          // down
            if (style == ST_CROSS)
                Bar(a0, half - gap - len, a1, half - gap - 1, col);      // up
        }
        break;
    case ST_CIRCLE: {
        double r = gap + len;
        if (r < 1.0) r = 1.0;
        double inner = r - t / 2.0, outer = inner + t;
        for (int y = -half; y <= half; y++)
            for (int x = -half; x <= half; x++) {
                double d = sqrt((double)x * x + (double)y * y);
                if (d >= inner && d < outer) Px(half + x, half + y, col);
            }
        break;
    }
    case ST_CHEVRON: {
        // arms open downward from an apex `gap` under the aim point, then the
        // whole glyph is lifted so its centre of mass sits on the anchor
        int lift = (len + t) / 2;
        for (int i = 0; i <= len; i++)
            for (int k = 0; k < t; k++) {
                Px(half - i, half - lift + gap + i + k, col);
                Px(half + i, half - lift + gap + i + k, col);
            }
        break;
    }
    default: break;
    }

    if (c->centerDot || style == ST_DOT) {
        int d0 = half - (dot / 2), d1 = d0 + dot - 1;
        Bar(d0, d0, d1, d1, col);
    }
    if (c->gradient) Gradient(c->color, c->gradColor);
    if (c->outline) Outline(c->outlineColor);
    Shadow(c->shadow, c->shadowX, c->shadowY);
    Glow(c->color, c->glow);
    ApplyOpacity(c->opacity);

    out->px = buf; out->w = n; out->h = n; out->ax = half; out->ay = half;
    S_P = NULL;
    return TRUE;
}

void ChFree(ChBitmap* b)
{
    if (b && b->px) { free(b->px); b->px = NULL; }
}
