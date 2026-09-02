#include "app.h"
#include <commdlg.h>
#include <windowsx.h>
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include <wchar.h>

#define WINW 980
#define WINH 600
#define TITLEH 38
#define CANX 14
#define CANY 54
#define CANBOX 420
#define COL2 452
#define COL3 718
#define COLW 250

// ---------------------------------------------------------------- palette
#define C_BG     RGB(15,17,21)
#define C_PANEL  RGB(24,27,34)
#define C_PANEL2 RGB(33,37,47)
#define C_LINE   RGB(50,56,70)
#define C_TXT    RGB(228,232,240)
#define C_DIM    RGB(128,138,157)
#define C_ACC    RGB(0,224,138)
#define C_ACCD   RGB(0,90,58)

enum { WK_BTN, WK_TOGGLE, WK_SLIDER, WK_SWATCH, WK_HEADER, WK_TEXT, WK_COLORBOX };

struct W {
    int      id, kind;
    RECT     r;
    wchar_t  text[64];
    int*     val;
    int      mn, mx;
    uint32_t col;
    int      active;
};

// widget ids
enum {
    ID_TOOL = 1000, ID_SWATCH = 1100, ID_PRESET = 1200, ID_GRID = 1300,
    ID_CUSTOMCOL = 2000, ID_ALPHA, ID_SCALE, ID_OPACITY, ID_OFFX, ID_OFFY,
    ID_LOADIMG, ID_CLEARIMG, ID_USEIMG, ID_IMGSCALE,
    ID_OVERLAY, ID_AUTODET, ID_INGAME, ID_AUTOOPEN, ID_STARTWIN,
    ID_ADDGAME, ID_CLEARGAMES, ID_CLEARCANVAS, ID_UNDO, ID_CENTER,
    ID_HIDE = 3000, ID_MIN, ID_CLOSE
};
enum { T_PEN, T_ERASE, T_FILL, T_LINE, T_RECT, T_CIRC, T_MIRX, T_MIRY };

static const wchar_t* kToolName[8] =
    { L"PEN", L"ERASE", L"FILL", L"LINE", L"RECT", L"CIRC", L"MIR X", L"MIR Y" };

static const uint32_t kPalette[16] = {
    0xFF00FF6A, 0xFF00E5FF, 0xFFFF2D55, 0xFFFFD60A,
    0xFFFF6B00, 0xFFB14DFF, 0xFFFFFFFF, 0xFF000000,
    0xFF32D74B, 0xFF0A84FF, 0xFFFF375F, 0xFFFFF07C,
    0xFF8E8E93, 0xFF1DE9B6, 0xFFFF00E5, 0xFF7CFF00
};

static HWND    g_panel = NULL;
static float   g_ds = 1.0f;      // DPI scale for the panel UI
static W       g_w[240];
static int     g_nw = 0;
static HFONT   g_f, g_fb, g_ft, g_fs;
static int     g_tool = T_PEN;
static uint32_t g_color = 0xFF00FF6A;
static int     g_alpha = 255;
static int     g_mirX = 0, g_mirY = 0;
static int     g_hover = -1, g_dragSlider = -1;
static int     g_drawing = 0, g_shape = 0, g_erase = 0;
static int     g_lx = -1, g_ly = -1, g_sx = -1, g_sy = -1, g_cx = -1, g_cy = -1;
static wchar_t g_status[160] = L"Waiting for a game...";
static COLORREF g_custom[16];

// undo ring
#define UNDON 24
static uint32_t g_undo[UNDON][MAXGRID * MAXGRID];
static int      g_undoTop = 0, g_undoCount = 0;

// ---------------------------------------------------------------- helpers
static int Clamp(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }

static void Fill(HDC dc, RECT r, COLORREF c)
{
    HBRUSH b = CreateSolidBrush(c);
    FillRect(dc, &r, b);
    DeleteObject(b);
}

static void Round(HDC dc, RECT r, COLORREF fill, COLORREF border, int rad)
{
    HBRUSH b = CreateSolidBrush(fill);
    HPEN   p = CreatePen(PS_SOLID, 1, border);
    HGDIOBJ ob = SelectObject(dc, b), op = SelectObject(dc, p);
    RoundRect(dc, r.left, r.top, r.right, r.bottom, rad, rad);
    SelectObject(dc, ob); SelectObject(dc, op);
    DeleteObject(b); DeleteObject(p);
}

static void Txt(HDC dc, RECT r, const wchar_t* s, COLORREF c, HFONT f, UINT fmt)
{
    HGDIOBJ of = SelectObject(dc, f);
    SetTextColor(dc, c);
    SetBkMode(dc, TRANSPARENT);
    DrawTextW(dc, s, -1, &r, fmt | DT_SINGLELINE);
    SelectObject(dc, of);
}

static COLORREF ToRef(uint32_t argb)
{
    return RGB((argb >> 16) & 0xFF, (argb >> 8) & 0xFF, argb & 0xFF);
}

static void PushUndo(void)
{
    memcpy(g_undo[g_undoTop], g_cfg.px, sizeof(g_cfg.px));
    g_undoTop = (g_undoTop + 1) % UNDON;
    if (g_undoCount < UNDON) g_undoCount++;
}

static void PopUndo(void)
{
    if (!g_undoCount) return;
    g_undoTop = (g_undoTop + UNDON - 1) % UNDON;
    g_undoCount--;
    memcpy(g_cfg.px, g_undo[g_undoTop], sizeof(g_cfg.px));
}

static int CellSize(void) { int c = CANBOX / g_cfg.gridW; return c < 1 ? 1 : c; }
static int CanvasPx(void) { return CellSize() * g_cfg.gridW; }
static int CanvasPy(void) { return CellSize() * g_cfg.gridH; }
static int CanvasX(void)  { return CANX + (CANBOX - CanvasPx()) / 2; }
static int CanvasY(void)  { return CANY + (CANBOX - CanvasPy()) / 2; }

// ---------------------------------------------------------------- layout
static W* Add(int id, int kind, int x, int y, int w, int h, const wchar_t* t)
{
    if (g_nw >= 240) return &g_w[239];
    W* p = &g_w[g_nw++];
    ZeroMemory(p, sizeof(*p));
    p->id = id; p->kind = kind;
    SetRect(&p->r, x, y, x + w, y + h);
    if (t) { wcsncpy(p->text, t, 63); p->text[63] = 0; }
    return p;
}

static void Header(int x, int* y, const wchar_t* t)
{
    Add(0, WK_HEADER, x, *y, COLW, 18, t);
    *y += 24;
}

static void Toggle(int id, int x, int* y, const wchar_t* t, int* v)
{
    W* p = Add(id, WK_TOGGLE, x, *y, COLW, 24, t);
    p->val = v;
    *y += 28;
}

static void Slider(int id, int x, int* y, const wchar_t* t, int* v, int mn, int mx)
{
    W* p = Add(id, WK_SLIDER, x, *y, COLW, 38, t);
    p->val = v; p->mn = mn; p->mx = mx;
    *y += 44;
}

static void Layout(void)
{
    g_nw = 0;

    // title bar buttons
    Add(ID_HIDE,  WK_BTN, WINW - 132, 8, 36, 22, L"HIDE");
    Add(ID_MIN,   WK_BTN, WINW -  92, 8, 36, 22, L"MIN");
    Add(ID_CLOSE, WK_BTN, WINW -  52, 8, 36, 22, L"CLOSE");

    // tools under the canvas
    int tx = CANX, ty = CANY + CANBOX + 12;
    for (int i = 0; i < 8; i++) {
        W* p = Add(ID_TOOL + i, WK_BTN, tx + i * 53, ty, 49, 28, kToolName[i]);
        p->active = (i == T_MIRX) ? g_mirX : (i == T_MIRY) ? g_mirY : (g_tool == i);
    }
    ty += 34;
    static const wchar_t* pn[5] = { L"DOT", L"CROSS", L"T", L"CIRCLE", L"CHEVRON" };
    for (int i = 0; i < 5; i++) Add(ID_PRESET + i, WK_BTN, tx + i * 53, ty, 49, 28, pn[i]);
    Add(ID_UNDO,        WK_BTN, tx + 5 * 53, ty, 49, 28, L"UNDO");
    Add(ID_CLEARCANVAS, WK_BTN, tx + 6 * 53, ty, 49, 28, L"CLEAR");
    Add(ID_CENTER,      WK_BTN, tx + 7 * 53, ty, 49, 28, L"1PX");

    // ---- column 2
    int y = CANY;
    Header(COL2, &y, L"COLOR");
    for (int i = 0; i < 16; i++) {
        W* p = Add(ID_SWATCH + i, WK_SWATCH, COL2 + (i % 8) * 31, y + (i / 8) * 31, 27, 27, NULL);
        p->col = kPalette[i];
        p->active = ((g_color & 0x00FFFFFF) == (kPalette[i] & 0x00FFFFFF));
    }
    y += 68;
    W* cb = Add(0, WK_COLORBOX, COL2, y, 74, 28, NULL); cb->col = g_color;
    Add(ID_CUSTOMCOL, WK_BTN, COL2 + 82, y, 168, 28, L"CUSTOM COLOR");
    y += 36;
    Slider(ID_ALPHA, COL2, &y, L"COLOR ALPHA", &g_alpha, 0, 255);

    Header(COL2, &y, L"CROSSHAIR");
    Slider(ID_SCALE,   COL2, &y, L"PIXEL SIZE",  &g_cfg.scale,   1, 12);
    Slider(ID_OPACITY, COL2, &y, L"OPACITY",     &g_cfg.opacity, 10, 255);
    Slider(ID_OFFX,    COL2, &y, L"OFFSET X",    &g_cfg.offsetX, -50, 50);
    Slider(ID_OFFY,    COL2, &y, L"OFFSET Y",    &g_cfg.offsetY, -50, 50);

    Header(COL2, &y, L"CANVAS SIZE");
    static const int gs[5] = { 16, 24, 32, 48, 64 };
    for (int i = 0; i < 5; i++) {
        wchar_t t[16]; _snwprintf(t, 16, L"%dx%d", gs[i], gs[i]); t[15] = 0;
        W* p = Add(ID_GRID + i, WK_BTN, COL2 + i * 51, y, 47, 28, t);
        p->active = (g_cfg.gridW == gs[i]);
    }

    // ---- column 3
    y = CANY;
    Header(COL3, &y, L"IMAGE CROSSHAIR");
    Add(ID_LOADIMG,  WK_BTN, COL3,       y, 160, 28, L"UPLOAD IMAGE");
    Add(ID_CLEARIMG, WK_BTN, COL3 + 168, y,  82, 28, L"REMOVE");
    y += 34;
    Toggle(ID_USEIMG, COL3, &y, L"Use image instead of pixels", &g_cfg.useImage);
    Slider(ID_IMGSCALE, COL3, &y, L"IMAGE SIZE %", &g_cfg.imageScale, 10, 400);
    {
        const wchar_t* nm = g_cfg.imagePath[0] ? wcsrchr(g_cfg.imagePath, L'\\') : NULL;
        wchar_t t[64];
        _snwprintf(t, 64, L"file: %s", g_cfg.imagePath[0] ? (nm ? nm + 1 : g_cfg.imagePath) : L"none");
        t[63] = 0;
        Add(0, WK_TEXT, COL3, y, COLW, 18, t);
        y += 26;
    }

    Header(COL3, &y, L"OVERLAY / GAME DETECTION");
    Toggle(ID_OVERLAY,  COL3, &y, L"Overlay enabled",              &g_cfg.overlayOn);
    Toggle(ID_INGAME,   COL3, &y, L"Only show while in a game",    &g_cfg.onlyInGame);
    Toggle(ID_AUTODET,  COL3, &y, L"Auto-detect fullscreen games", &g_cfg.autoDetect);
    Toggle(ID_AUTOOPEN, COL3, &y, L"Open panel when game starts",  &g_cfg.autoOpenPanel);
    Toggle(ID_STARTWIN, COL3, &y, L"Start with Windows",           &g_cfg.startWithWindows);
    y += 4;
    Add(ID_ADDGAME,    WK_BTN, COL3,       y, 160, 28, L"ADD DETECTED GAME");
    Add(ID_CLEARGAMES, WK_BTN, COL3 + 168, y,  82, 28, L"CLEAR");
    y += 34;
    Add(0, WK_TEXT, COL3, y, COLW, 18, g_status);
}

// ---------------------------------------------------------------- painting
static void PaintCanvas(HDC dc)
{
    int cs = CellSize(), x0 = CanvasX(), y0 = CanvasY();
    RECT box; SetRect(&box, CANX - 2, CANY - 2, CANX + CANBOX + 2, CANY + CANBOX + 2);
    Round(dc, box, C_PANEL, C_LINE, 8);

    // transparency checkerboard
    for (int cy = 0; cy < g_cfg.gridH; cy++)
        for (int cx = 0; cx < g_cfg.gridW; cx++) {
            RECT r; SetRect(&r, x0 + cx * cs, y0 + cy * cs, x0 + (cx + 1) * cs, y0 + (cy + 1) * cs);
            Fill(dc, r, ((cx ^ cy) & 1) ? RGB(38,42,52) : RGB(30,34,42));
            uint32_t c = g_cfg.px[cy * MAXGRID + cx];
            if (c & 0xFF000000) Fill(dc, r, ToRef(c));
        }

    // aim cell = the pixel that lands dead centre on screen
    int ax = g_cfg.gridW / 2, ay = g_cfg.gridH / 2;
    HPEN pen = CreatePen(PS_SOLID, 1, RGB(70,78,95));
    HGDIOBJ op = SelectObject(dc, pen);
    if (cs >= 8) {
        for (int i = 0; i <= g_cfg.gridW; i++) { MoveToEx(dc, x0 + i * cs, y0, NULL); LineTo(dc, x0 + i * cs, y0 + CanvasPy()); }
        for (int i = 0; i <= g_cfg.gridH; i++) { MoveToEx(dc, x0, y0 + i * cs, NULL); LineTo(dc, x0 + CanvasPx(), y0 + i * cs); }
    }
    SelectObject(dc, op); DeleteObject(pen);

    pen = CreatePen(PS_SOLID, 1, RGB(255,60,90));
    op = SelectObject(dc, pen);
    MoveToEx(dc, x0 + ax * cs + cs / 2, y0, NULL);              LineTo(dc, x0 + ax * cs + cs / 2, y0 + CanvasPy());
    MoveToEx(dc, x0, y0 + ay * cs + cs / 2, NULL);              LineTo(dc, x0 + CanvasPx(), y0 + ay * cs + cs / 2);
    SelectObject(dc, op); DeleteObject(pen);

    // shape preview
    if (g_drawing && g_shape && g_sx >= 0 && g_cx >= 0) {
        HPEN sp = CreatePen(PS_DOT, 1, C_ACC);
        HGDIOBJ o2 = SelectObject(dc, sp);
        HGDIOBJ ob = SelectObject(dc, GetStockObject(NULL_BRUSH));
        int l = (g_sx < g_cx ? g_sx : g_cx), t = (g_sy < g_cy ? g_sy : g_cy);
        int r = (g_sx > g_cx ? g_sx : g_cx), b = (g_sy > g_cy ? g_sy : g_cy);
        if (g_tool == T_LINE) {
            MoveToEx(dc, x0 + g_sx * cs + cs / 2, y0 + g_sy * cs + cs / 2, NULL);
            LineTo(dc, x0 + g_cx * cs + cs / 2, y0 + g_cy * cs + cs / 2);
        } else if (g_tool == T_RECT) {
            Rectangle(dc, x0 + l * cs, y0 + t * cs, x0 + (r + 1) * cs, y0 + (b + 1) * cs);
        } else {
            Ellipse(dc, x0 + l * cs, y0 + t * cs, x0 + (r + 1) * cs, y0 + (b + 1) * cs);
        }
        SelectObject(dc, o2); SelectObject(dc, ob); DeleteObject(sp);
    }
}

static void PaintWidget(HDC dc, W* p, int hover)
{
    switch (p->kind) {
    case WK_HEADER: {
        RECT r = p->r;
        Txt(dc, r, p->text, C_ACC, g_fb, DT_LEFT | DT_VCENTER);
        RECT ln; SetRect(&ln, r.left, r.bottom, r.right, r.bottom + 1);
        Fill(dc, ln, C_LINE);
        break;
    }
    case WK_TEXT:
        Txt(dc, p->r, p->text, C_DIM, g_fs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
        break;

    case WK_COLORBOX: {
        Round(dc, p->r, ToRef(p->col), C_LINE, 6);
        break;
    }
    case WK_SWATCH: {
        Round(dc, p->r, ToRef(p->col), p->active ? C_ACC : C_LINE, 5);
        break;
    }
    case WK_BTN: {
        COLORREF fill = p->active ? C_ACCD : (hover ? C_PANEL2 : C_PANEL);
        Round(dc, p->r, fill, p->active ? C_ACC : C_LINE, 6);
        Txt(dc, p->r, p->text, p->active ? C_ACC : C_TXT, g_fs, DT_CENTER | DT_VCENTER);
        break;
    }
    case WK_TOGGLE: {
        RECT b; SetRect(&b, p->r.left, p->r.top + 3, p->r.left + 18, p->r.top + 21);
        int on = p->val && *p->val;
        Round(dc, b, on ? C_ACC : C_PANEL, on ? C_ACC : C_LINE, 4);
        if (on) {
            RECT t; SetRect(&t, b.left, b.top, b.right, b.bottom);
            Txt(dc, t, L"\x2713", RGB(10,12,15), g_fb, DT_CENTER | DT_VCENTER);
        }
        RECT t; SetRect(&t, p->r.left + 26, p->r.top, p->r.right, p->r.bottom);
        Txt(dc, t, p->text, on ? C_TXT : C_DIM, g_f, DT_LEFT | DT_VCENTER);
        break;
    }
    case WK_SLIDER: {
        int v = p->val ? *p->val : 0;
        RECT lab; SetRect(&lab, p->r.left, p->r.top, p->r.right, p->r.top + 16);
        Txt(dc, lab, p->text, C_DIM, g_fs, DT_LEFT | DT_VCENTER);
        wchar_t num[16]; _snwprintf(num, 16, L"%d", v); num[15] = 0;
        Txt(dc, lab, num, C_TXT, g_fb, DT_RIGHT | DT_VCENTER);

        int ty = p->r.top + 24, w = p->r.right - p->r.left;
        RECT tr; SetRect(&tr, p->r.left, ty, p->r.right, ty + 6);
        Round(dc, tr, C_PANEL, C_LINE, 3);
        int span = (p->mx - p->mn); if (span < 1) span = 1;
        int fx = (v - p->mn) * (w - 12) / span;
        RECT fr; SetRect(&fr, p->r.left, ty, p->r.left + fx + 6, ty + 6);
        Round(dc, fr, C_ACCD, C_ACC, 3);
        RECT kn; SetRect(&kn, p->r.left + fx, ty - 5, p->r.left + fx + 12, ty + 11);
        Round(dc, kn, C_ACC, C_ACC, 4);
        break;
    }
    }
}

static void PaintPanel(HWND h, HDC target)
{
    RECT client; GetClientRect(h, &client);
    HDC dc = CreateCompatibleDC(target);
    HBITMAP bm = CreateCompatibleBitmap(target, client.right, client.bottom);
    HGDIOBJ ob = SelectObject(dc, bm);

    if (g_ds != 1.0f) {
        XFORM xf = { g_ds, 0.0f, 0.0f, g_ds, 0.0f, 0.0f };
        SetGraphicsMode(dc, GM_ADVANCED);
        SetWorldTransform(dc, &xf);
    }
    RECT rc; SetRect(&rc, 0, 0, WINW, WINH);
    Fill(dc, rc, C_BG);

    RECT tb; SetRect(&tb, 0, 0, rc.right, TITLEH);
    Fill(dc, tb, C_PANEL);
    RECT ln; SetRect(&ln, 0, TITLEH, rc.right, TITLEH + 1);
    Fill(dc, ln, C_LINE);

    RECT t1; SetRect(&t1, 14, 0, 300, TITLEH);
    Txt(dc, t1, L"PIXELCROSS", C_ACC, g_ft, DT_LEFT | DT_VCENTER);

    RECT hint; SetRect(&hint, 150, 8, 430, TITLEH - 8);
    Round(dc, hint, C_PANEL2, C_LINE, 11);
    Txt(dc, hint, L"F12  \x2022  hide / bring back the app", C_DIM, g_fs, DT_CENTER | DT_VCENTER);

    PaintCanvas(dc);
    Layout();
    for (int i = 0; i < g_nw; i++) PaintWidget(dc, &g_w[i], i == g_hover);

    ModifyWorldTransform(dc, NULL, MWT_IDENTITY);
    SetGraphicsMode(dc, GM_COMPATIBLE);
    BitBlt(target, 0, 0, client.right, client.bottom, dc, 0, 0, SRCCOPY);
    SelectObject(dc, ob);
    DeleteObject(bm);
    DeleteDC(dc);
}

// ---------------------------------------------------------------- edits
static void Put(int x, int y, uint32_t c)
{
    if (x < 0 || y < 0 || x >= g_cfg.gridW || y >= g_cfg.gridH) return;
    g_cfg.px[y * MAXGRID + x] = c;
    if (g_mirX) { int mx = g_cfg.gridW - 1 - x; g_cfg.px[y * MAXGRID + mx] = c; }
    if (g_mirY) { int my = g_cfg.gridH - 1 - y; g_cfg.px[my * MAXGRID + x] = c; }
    if (g_mirX && g_mirY) {
        int mx = g_cfg.gridW - 1 - x, my = g_cfg.gridH - 1 - y;
        g_cfg.px[my * MAXGRID + mx] = c;
    }
}

static void LineTo2(int x0, int y0, int x1, int y1, uint32_t c)
{
    int dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    int dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    int err = dx + dy;
    for (;;) {
        Put(x0, y0, c);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

static void RectFill(int x0, int y0, int x1, int y1, uint32_t c)
{
    int l = x0 < x1 ? x0 : x1, r = x0 > x1 ? x0 : x1;
    int t = y0 < y1 ? y0 : y1, b = y0 > y1 ? y0 : y1;
    for (int x = l; x <= r; x++) { Put(x, t, c); Put(x, b, c); }
    for (int y = t; y <= b; y++) { Put(l, y, c); Put(r, y, c); }
}

static void Circle(int x0, int y0, int x1, int y1, uint32_t c)
{
    int l = x0 < x1 ? x0 : x1, r = x0 > x1 ? x0 : x1;
    int t = y0 < y1 ? y0 : y1, b = y0 > y1 ? y0 : y1;
    double cx = (l + r) / 2.0, cy = (t + b) / 2.0;
    double rx = (r - l) / 2.0, ry = (b - t) / 2.0;
    if (rx < 0.5) rx = 0.5;
    if (ry < 0.5) ry = 0.5;
    for (int a = 0; a < 720; a++) {
        double rad = a * 3.14159265358979 / 360.0;
        Put((int)(cx + rx * cos(rad) + 0.5), (int)(cy + ry * sin(rad) + 0.5), c);
    }
}

static void Flood(int x, int y, uint32_t c)
{
    if (x < 0 || y < 0 || x >= g_cfg.gridW || y >= g_cfg.gridH) return;
    uint32_t from = g_cfg.px[y * MAXGRID + x];
    if (from == c) return;
    static int st[MAXGRID * MAXGRID * 2];
    int sp = 0;
    st[sp++] = x; st[sp++] = y;
    while (sp) {
        int py = st[--sp], px = st[--sp];
        if (px < 0 || py < 0 || px >= g_cfg.gridW || py >= g_cfg.gridH) continue;
        if (g_cfg.px[py * MAXGRID + px] != from) continue;
        g_cfg.px[py * MAXGRID + px] = c;
        if (sp + 8 > MAXGRID * MAXGRID * 2) continue;
        st[sp++] = px + 1; st[sp++] = py;
        st[sp++] = px - 1; st[sp++] = py;
        st[sp++] = px;     st[sp++] = py + 1;
        st[sp++] = px;     st[sp++] = py - 1;
    }
}

static void Preset(int n)
{
    PushUndo();
    ZeroMemory(g_cfg.px, sizeof(g_cfg.px));
    int cx = g_cfg.gridW / 2, cy = g_cfg.gridH / 2;
    uint32_t c = (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
    switch (n) {
    case 0:                                     // dot
        Put(cx, cy, c);
        break;
    case 1:                                     // cross with gap
        for (int i = 3; i <= 9; i++) { Put(cx + i, cy, c); Put(cx - i, cy, c); Put(cx, cy + i, c); Put(cx, cy - i, c); }
        Put(cx, cy, c);
        break;
    case 2:                                     // T
        for (int i = 3; i <= 9; i++) { Put(cx + i, cy, c); Put(cx - i, cy, c); Put(cx, cy + i, c); }
        Put(cx, cy, c);
        break;
    case 3:                                     // circle + dot
        Circle(cx - 7, cy - 7, cx + 7, cy + 7, c);
        Put(cx, cy, c);
        break;
    default:                                    // chevron
        for (int i = 1; i <= 7; i++) { Put(cx - i, cy - i, c); Put(cx + i, cy - i, c); }
        Put(cx, cy, c);
        break;
    }
}

static void CommitLive(void)          // cheap: repaint + re-render overlay
{
    OverlayRefresh();
    InvalidateRect(g_panel, NULL, FALSE);
}

static void Commit(void)              // also persist to disk
{
    CfgSave(&g_cfg);
    CommitLive();
}

// ---------------------------------------------------------------- input
static int HitWidget(int x, int y)
{
    Layout();
    POINT p = { x, y };
    for (int i = g_nw - 1; i >= 0; i--) {
        if (g_w[i].kind == WK_HEADER || g_w[i].kind == WK_TEXT || g_w[i].kind == WK_COLORBOX) continue;
        if (PtInRect(&g_w[i].r, p)) return i;
    }
    return -1;
}

static int CanvasCell(int x, int y, int* cx, int* cy)
{
    int cs = CellSize(), x0 = CanvasX(), y0 = CanvasY();
    if (x < x0 || y < y0 || x >= x0 + CanvasPx() || y >= y0 + CanvasPy()) return 0;
    *cx = (x - x0) / cs;
    *cy = (y - y0) / cs;
    return 1;
}

static void SliderDrag(W* p, int x)
{
    int w = p->r.right - p->r.left;
    int rel = Clamp(x - p->r.left - 6, 0, w - 12);
    *p->val = p->mn + rel * (p->mx - p->mn) / (w - 12);
    if (p->id == ID_ALPHA) g_color = (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
    CommitLive();
}

static void PickCustomColor(void)
{
    CHOOSECOLORW cc;
    ZeroMemory(&cc, sizeof(cc));
    cc.lStructSize  = sizeof(cc);
    cc.hwndOwner    = g_panel;
    cc.lpCustColors = g_custom;
    cc.rgbResult    = ToRef(g_color);
    cc.Flags        = CC_FULLOPEN | CC_RGBINIT;
    if (ChooseColorW(&cc)) {
        g_color = ((uint32_t)g_alpha << 24) |
                  ((uint32_t)GetRValue(cc.rgbResult) << 16) |
                  ((uint32_t)GetGValue(cc.rgbResult) << 8) |
                  (uint32_t)GetBValue(cc.rgbResult);
    }
}

static void PickImage(void)
{
    wchar_t file[MAX_PATH] = L"";
    OPENFILENAMEW ofn;
    ZeroMemory(&ofn, sizeof(ofn));
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner   = g_panel;
    ofn.lpstrFilter = L"Images (png, bmp, jpg, gif)\0*.png;*.bmp;*.jpg;*.jpeg;*.gif\0All files\0*.*\0";
    ofn.lpstrFile   = file;
    ofn.nMaxFile    = MAX_PATH;
    ofn.Flags       = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR;
    if (GetOpenFileNameW(&ofn)) {
        wcsncpy(g_cfg.imagePath, file, MAX_PATH - 1);
        g_cfg.imagePath[MAX_PATH - 1] = 0;
        g_cfg.useImage = 1;
        OverlayDropImage();
    }
}

static void Command(int id)
{
    if (id >= ID_TOOL && id < ID_TOOL + 8) {
        int t = id - ID_TOOL;
        if (t == T_MIRX)      g_mirX = !g_mirX;
        else if (t == T_MIRY) g_mirY = !g_mirY;
        else                  g_tool = t;
        InvalidateRect(g_panel, NULL, FALSE);
        return;
    }
    if (id >= ID_SWATCH && id < ID_SWATCH + 16) {
        g_color = (kPalette[id - ID_SWATCH] & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
        InvalidateRect(g_panel, NULL, FALSE);
        return;
    }
    if (id >= ID_PRESET && id < ID_PRESET + 5) { Preset(id - ID_PRESET); Commit(); return; }
    if (id >= ID_GRID && id < ID_GRID + 5) {
        static const int gs[5] = { 16, 24, 32, 48, 64 };
        int n = gs[id - ID_GRID];
        if (n != g_cfg.gridW) {
            PushUndo();
            // re-centre existing art on the new canvas
            uint32_t tmp[MAXGRID * MAXGRID];
            memcpy(tmp, g_cfg.px, sizeof(tmp));
            int ox = g_cfg.gridW / 2, oy = g_cfg.gridH / 2;
            ZeroMemory(g_cfg.px, sizeof(g_cfg.px));
            int nx = n / 2, ny = n / 2;
            for (int y = 0; y < g_cfg.gridH; y++)
                for (int x = 0; x < g_cfg.gridW; x++) {
                    int dx = x - ox + nx, dy = y - oy + ny;
                    if (dx >= 0 && dy >= 0 && dx < n && dy < n)
                        g_cfg.px[dy * MAXGRID + dx] = tmp[y * MAXGRID + x];
                }
            g_cfg.gridW = g_cfg.gridH = n;
        }
        Commit();
        return;
    }

    switch (id) {
    case ID_CUSTOMCOL:   PickCustomColor(); InvalidateRect(g_panel, NULL, FALSE); break;
    case ID_UNDO:        PopUndo(); Commit(); break;
    case ID_CLEARCANVAS: PushUndo(); ZeroMemory(g_cfg.px, sizeof(g_cfg.px)); Commit(); break;
    case ID_CENTER:      PushUndo(); ZeroMemory(g_cfg.px, sizeof(g_cfg.px));
                         g_cfg.px[(g_cfg.gridH / 2) * MAXGRID + g_cfg.gridW / 2] =
                             (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
                         Commit(); break;
    case ID_LOADIMG:     PickImage(); Commit(); break;
    case ID_CLEARIMG:    g_cfg.imagePath[0] = 0; g_cfg.useImage = 0; OverlayDropImage(); Commit(); break;
    case ID_USEIMG:      g_cfg.useImage = !g_cfg.useImage; Commit(); break;
    case ID_OVERLAY:     g_cfg.overlayOn = !g_cfg.overlayOn;
                         if (!g_cfg.overlayOn) OverlaySetVisible(FALSE);
                         Commit(); break;
    case ID_AUTODET:     g_cfg.autoDetect = !g_cfg.autoDetect; Commit(); break;
    case ID_INGAME:      g_cfg.onlyInGame = !g_cfg.onlyInGame; Commit(); break;
    case ID_AUTOOPEN:    g_cfg.autoOpenPanel = !g_cfg.autoOpenPanel; Commit(); break;
    case ID_STARTWIN:    g_cfg.startWithWindows = !g_cfg.startWithWindows;
                         SetStartWithWindows(g_cfg.startWithWindows); Commit(); break;
    case ID_ADDGAME:     if (g_lastGame[0]) { GameListAdd(g_lastGame); PanelStatus(L"Game added to the list."); }
                         Commit(); break;
    case ID_CLEARGAMES:  g_cfg.games[0] = 0; Commit(); break;
    case ID_HIDE:        PanelShow(FALSE); TrayShow(FALSE); break;
    case ID_MIN:         ShowWindow(g_panel, SW_MINIMIZE); break;
    case ID_CLOSE:       AppExit(); break;
    }
}

// ---------------------------------------------------------------- wndproc
static LRESULT CALLBACK PanelProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    switch (m) {
    case WM_ERASEBKGND: return 1;

    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC dc = BeginPaint(h, &ps);
        PaintPanel(h, dc);
        EndPaint(h, &ps);
        return 0;
    }

    case WM_LBUTTONDOWN:
    case WM_RBUTTONDOWN: {
        int x = (int)(GET_X_LPARAM(l) / g_ds), y = (int)(GET_Y_LPARAM(l) / g_ds);
        int cx, cy;
        if (CanvasCell(x, y, &cx, &cy)) {
            uint32_t c = (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
            g_erase = (m == WM_RBUTTONDOWN) || (g_tool == T_ERASE);
            if (g_erase) c = 0;
            PushUndo();
            SetCapture(h);
            g_drawing = 1;
            g_sx = g_cx = cx; g_sy = g_cy = cy;
            g_shape = (!g_erase && (g_tool == T_LINE || g_tool == T_RECT || g_tool == T_CIRC));
            if (g_shape) { /* preview only */ }
            else if (!g_erase && g_tool == T_FILL) { Flood(cx, cy, c); g_drawing = 0; ReleaseCapture(); Commit(); }
            else { Put(cx, cy, c); g_lx = cx; g_ly = cy; CommitLive(); }
            return 0;
        }
        if (m == WM_LBUTTONDOWN) {
            int i = HitWidget(x, y);
            if (i >= 0) {
                if (g_w[i].kind == WK_SLIDER) {
                    g_dragSlider = g_w[i].id;
                    SetCapture(h);
                    SliderDrag(&g_w[i], x);
                } else {
                    Command(g_w[i].id);
                }
                return 0;
            }
            if (y < TITLEH) {                       // drag the window
                ReleaseCapture();
                SendMessageW(h, WM_NCLBUTTONDOWN, HTCAPTION, 0);
                return 0;
            }
        }
        return 0;
    }

    case WM_MOUSEMOVE: {
        int x = (int)(GET_X_LPARAM(l) / g_ds), y = (int)(GET_Y_LPARAM(l) / g_ds);
        if (g_dragSlider >= 0) {
            Layout();
            for (int i = 0; i < g_nw; i++)
                if (g_w[i].id == g_dragSlider && g_w[i].kind == WK_SLIDER) { SliderDrag(&g_w[i], x); break; }
            return 0;
        }
        if (g_drawing) {
            int cx, cy;
            if (CanvasCell(x, y, &cx, &cy)) {
                if (g_shape) { g_cx = cx; g_cy = cy; InvalidateRect(h, NULL, FALSE); }
                else {
                    uint32_t c = g_erase ? 0 : ((g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24));
                    LineTo2(g_lx, g_ly, cx, cy, c);
                    g_lx = cx; g_ly = cy;
                    CommitLive();
                }
            }
            return 0;
        }
        int i = HitWidget(x, y);
        if (i != g_hover) { g_hover = i; InvalidateRect(h, NULL, FALSE); }
        return 0;
    }

    case WM_LBUTTONUP:
    case WM_RBUTTONUP: {
        if (g_dragSlider >= 0) { g_dragSlider = -1; ReleaseCapture(); CfgSave(&g_cfg); return 0; }
        if (g_drawing) {
            if (g_shape && g_cx >= 0) {
                uint32_t c = (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
                if (g_tool == T_LINE)      LineTo2(g_sx, g_sy, g_cx, g_cy, c);
                else if (g_tool == T_RECT) RectFill(g_sx, g_sy, g_cx, g_cy, c);
                else                       Circle(g_sx, g_sy, g_cx, g_cy, c);
            }
            g_drawing = g_shape = 0;
            ReleaseCapture();
            Commit();
        }
        return 0;
    }

    case WM_KEYDOWN:
        if (w == 'Z' && (GetKeyState(VK_CONTROL) & 0x8000)) { PopUndo(); Commit(); }
        if (w == VK_ESCAPE) { PanelShow(FALSE); }
        return 0;

    case WM_CLOSE:
        AppExit();
        return 0;
    }
    return DefWindowProcW(h, m, w, l);
}

// ---------------------------------------------------------------- api
BOOL PanelCreate(void)
{
    WNDCLASSEXW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize        = sizeof(wc);
    wc.style         = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc   = PanelProc;
    wc.hInstance     = g_inst;
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.lpszClassName = APP_CLASS;
    RegisterClassExW(&wc);

    {
        HDC sdc = GetDC(NULL);
        int dpi = GetDeviceCaps(sdc, LOGPIXELSX);
        ReleaseDC(NULL, sdc);
        if (dpi > 96) g_ds = (float)dpi / 96.0f;
        if (g_ds > 2.0f) g_ds = 2.0f;
    }
    int pw = (int)(WINW * g_ds), ph = (int)(WINH * g_ds);
    int sw = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
    if (ph > sh - 40) { g_ds = (float)(sh - 40) / WINH; pw = (int)(WINW * g_ds); ph = (int)(WINH * g_ds); }

    g_panel = CreateWindowExW(WS_EX_APPWINDOW, APP_CLASS, APP_NAME,
        WS_POPUP | WS_MINIMIZEBOX, (sw - pw) / 2, (sh - ph) / 2, pw, ph,
        NULL, NULL, g_inst, NULL);
    if (!g_panel) return FALSE;

    SetWindowRgn(g_panel, CreateRoundRectRgn(0, 0, pw + 1, ph + 1, 14, 14), TRUE);

    g_f  = CreateFontW(15, 0, 0, 0, FW_NORMAL, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fb = CreateFontW(15, 0, 0, 0, FW_BOLD,   0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_ft = CreateFontW(19, 0, 0, 0, FW_BOLD,   0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fs = CreateFontW(13, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");

    g_color = (g_color & 0x00FFFFFF) | ((uint32_t)g_alpha << 24);
    return TRUE;
}

void PanelShow(BOOL show)
{
    if (!g_panel) return;
    if (show) {
        ShowWindow(g_panel, SW_SHOW);
        SetForegroundWindow(g_panel);
        InvalidateRect(g_panel, NULL, FALSE);
    } else {
        ShowWindow(g_panel, SW_HIDE);
    }
}

BOOL PanelIsVisible(void) { return g_panel && IsWindowVisible(g_panel); }

void PanelToggle(void)
{
    if (PanelIsVisible() && !IsIconic(g_panel)) { PanelShow(FALSE); TrayShow(FALSE); }
    else { TrayShow(TRUE); PanelShow(TRUE); }
}

void PanelStatus(const wchar_t* s)
{
    wcsncpy(g_status, s, 159);
    g_status[159] = 0;
    if (PanelIsVisible()) InvalidateRect(g_panel, NULL, FALSE);
}

void PanelRedraw(void) { if (g_panel) InvalidateRect(g_panel, NULL, FALSE); }
