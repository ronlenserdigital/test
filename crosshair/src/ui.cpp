#include "app.h"
#include <commdlg.h>
#include <windowsx.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>
#include <wchar.h>
#include <algorithm>
using std::min;
using std::max;

// ------------------------------------------------------------------ metrics
#define WINW    1120
#define WINH    700
#define TITLEH  46
#define SIDEW   200
#define PAD     18
#define RPW     300
#define RPX     (WINW - RPW - PAD)
#define CVX     (SIDEW + PAD)
#define CVW     (RPX - PAD - CVX)

// ------------------------------------------------------------------ palette
#define C_BG      RGB(0x09,0x0B,0x0F)
#define C_PANEL   RGB(0x10,0x13,0x19)
#define C_RAISED  RGB(0x17,0x1B,0x22)
#define C_BORDER  RGB(0x24,0x2A,0x34)
#define C_TXT     RGB(0xF5,0xF7,0xFA)
#define C_TXT2    RGB(0x8C,0x96,0xA5)
#define C_ACC     RGB(0x00,0xF5,0xA0)
#define C_ACC2    RGB(0x20,0xC8,0xFF)
#define C_DANGER  RGB(0xFF,0x4D,0x67)
#define C_ACCDIM  RGB(0x06,0x3A,0x2A)

enum { SC_HOME, SC_DESIGN, SC_PROFILES, SC_SETTINGS };
enum { TAB_BASIC, TAB_ADV, TAB_PIXEL };
enum { WK_BTN, WK_TOGGLE, WK_SLIDER, WK_SWATCH, WK_NAV, WK_TAB, WK_TEXT,
       WK_HEAD, WK_CARD, WK_ROW };
enum { V_GHOST, V_ACCENT, V_CHIP, V_DANGER };

enum {
    ID_NAV = 100, ID_TAB = 110, ID_STYLE = 120,
    ID_SWATCH = 200, ID_CUSTOMCOL = 220, ID_OUTLINECOL,
    ID_LEN = 230, ID_THICK, ID_GAP, ID_OPACITY, ID_DOTSIZE, ID_OFFX, ID_OFFY,
    ID_IMGSCALE, ID_PXSCALE,
    ID_CENTERDOT = 250, ID_OUTLINE,
    ID_IMGLOAD = 260, ID_IMGCLEAR, ID_IMGUSE,
    ID_TOOL = 270, ID_GRIDSZ = 290, ID_PXCLEAR = 295, ID_PXUNDO, ID_PXUSE,
    ID_PRESET = 300,
    ID_LIB = 320, ID_LIBSAVE = 330,
    ID_PROF = 350, ID_PROFAUTO = 380, ID_PROFDEL = 400, ID_PROFADD = 420,
    ID_SET = 450, ID_UPDCHECK = 460, ID_UPDINSTALL,
    ID_ENV = 470, ID_ZOOM = 480,
    ID_MIN = 500, ID_HIDE, ID_CLOSE, ID_EDIT, ID_TOGGLEOVL
};
enum { T_PEN, T_ERASE, T_FILL, T_LINE, T_RECT, T_CIRC, T_MIRX, T_MIRY };

struct W {
    int      id, kind, variant, active;
    RECT     r;
    wchar_t  text[72];
    wchar_t  sub[72];
    int*     val;
    int      mn, mx;
    uint32_t col;
};

static const wchar_t* kStyleName[5] = { L"Cross", L"Dot", L"T", L"Circle", L"Chevron" };
static const wchar_t* kToolName[8]  = { L"Pen", L"Erase", L"Fill", L"Line", L"Rect", L"Ring", L"Mir X", L"Mir Y" };
static const wchar_t* kEnvName[5]   = { L"Dark", L"Light", L"Grass", L"Sky", L"Concrete" };

static const uint32_t kPalette[16] = {
    0xFF00F5A0, 0xFF20C8FF, 0xFFFFFFFF, 0xFFFF4D67,
    0xFFFFD60A, 0xFFFF6B00, 0xFFB14DFF, 0xFF00FF00,
    0xFFFF00E5, 0xFF1DE9B6, 0xFF7CFF00, 0xFF0A84FF,
    0xFFFF375F, 0xFF8E8E93, 0xFF000000, 0xFFF5F7FA
};

static HWND    g_hwnd = NULL;
static float   g_ds = 1.0f;
static W       g_w[320];
static int     g_nw = 0;
static int     g_screen = SC_HOME;
static int     g_tab = TAB_BASIC;
static int     g_hover = -1, g_dragSlider = -1;
static HFONT   g_f, g_fb, g_fh, g_fs, g_fxl;
static wchar_t g_status[160] = L"Ready.";
static COLORREF g_custom[16];
static int     g_editOutlineCol = 0;

// pixel editor state
static int g_tool = T_PEN, g_mirX = 0, g_mirY = 0;
static int g_drawing = 0, g_shape = 0, g_erase = 0;
static int g_lx = -1, g_ly = -1, g_sx = -1, g_sy = -1, g_cx = -1, g_cy = -1;
#define UNDON 20
static uint32_t g_undo[UNDON][MAXGRID * MAXGRID];
static int g_undoTop = 0, g_undoCount = 0;

// ------------------------------------------------------------------ gdi util
static int Clamp(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }
static COLORREF ToRef(uint32_t c) { return RGB((c >> 16) & 0xFF, (c >> 8) & 0xFF, c & 0xFF); }

static void Fill(HDC dc, RECT r, COLORREF c)
{
    HBRUSH b = CreateSolidBrush(c);
    FillRect(dc, &r, b);
    DeleteObject(b);
}

static void Card(HDC dc, RECT r, COLORREF fill, COLORREF border, int rad)
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

static void TxtAt(HDC dc, int x, int y, int w, int h, const wchar_t* s, COLORREF c, HFONT f, UINT fmt)
{
    RECT r; SetRect(&r, x, y, x + w, y + h);
    Txt(dc, r, s, c, f, fmt);
}

// ------------------------------------------------------------------ widgets
static W* Add(int id, int kind, int x, int y, int w, int h, const wchar_t* t)
{
    if (g_nw >= 320) return &g_w[319];
    W* p = &g_w[g_nw++];
    ZeroMemory(p, sizeof(*p));
    p->id = id; p->kind = kind;
    SetRect(&p->r, x, y, x + w, y + h);
    if (t) { wcsncpy(p->text, t, 71); p->text[71] = 0; }
    return p;
}

static void Head(int x, int* y, int w, const wchar_t* t)
{
    Add(0, WK_HEAD, x, *y, w, 16, t);
    *y += 26;
}

static W* Slider(int id, int x, int* y, int w, const wchar_t* t, int* v, int mn, int mx)
{
    W* p = Add(id, WK_SLIDER, x, *y, w, 34, t);
    p->val = v; p->mn = mn; p->mx = mx;
    *y += 40;
    return p;
}

static W* Toggle(int id, int x, int* y, int w, const wchar_t* t, int* v)
{
    W* p = Add(id, WK_TOGGLE, x, *y, w, 30, t);
    p->val = v;
    *y += 34;
    return p;
}

// ------------------------------------------------------------------ actions
static void PushUndo(void)
{
    memcpy(g_undo[g_undoTop], g_ch.px, sizeof(g_ch.px));
    g_undoTop = (g_undoTop + 1) % UNDON;
    if (g_undoCount < UNDON) g_undoCount++;
}

static void PopUndo(void)
{
    if (!g_undoCount) return;
    g_undoTop = (g_undoTop + UNDON - 1) % UNDON;
    g_undoCount--;
    memcpy(g_ch.px, g_undo[g_undoTop], sizeof(g_ch.px));
}

void ShellApply(void)
{
    if (g_activeProfile >= 0 && g_activeProfile < g_nprof)
        memcpy(&g_prof[g_activeProfile].ch, &g_ch, sizeof(Crosshair));
    OverlayRefresh();
    if (g_hwnd) InvalidateRect(g_hwnd, NULL, FALSE);
}

static void ApplyAndSave(void) { ShellApply(); CfgSave(); }

static void SetColor(uint32_t c)
{
    g_ch.color = c | 0xFF000000;
    // monochrome recolour so the change is visible instantly in every mode
    for (int i = 0; i < MAXGRID * MAXGRID; i++)
        if (g_ch.px[i] & 0xFF000000)
            g_ch.px[i] = (g_ch.px[i] & 0xFF000000) | (c & 0x00FFFFFF);
    ApplyAndSave();
}

// ------------------------------------------------------------------ layout
static int PxCell(void) { return (CVW - 40) / g_ch.gridW; }
static int PxOX(void)   { return CVX + (CVW - PxCell() * g_ch.gridW) / 2; }
static int PxOY(void)   { return TITLEH + PAD + 44 + (CVW - 60 - PxCell() * g_ch.gridH) / 2; }

static void LayoutTitle(void)
{
    Add(ID_HIDE,  WK_BTN, WINW - 138, 12, 44, 22, L"HIDE")->variant = V_CHIP;
    Add(ID_MIN,   WK_BTN, WINW -  88, 12, 30, 22, L"\x2013")->variant = V_CHIP;
    Add(ID_CLOSE, WK_BTN, WINW -  52, 12, 30, 22, L"\x00D7")->variant = V_CHIP;
}

static void LayoutNav(void)
{
    static const wchar_t* nm[4] = { L"Home", L"Design", L"Game Profiles", L"Settings" };
    int y = TITLEH + 22;
    for (int i = 0; i < 4; i++) {
        W* p = Add(ID_NAV + i, WK_NAV, 12, y, SIDEW - 24, 40, nm[i]);
        p->active = (g_screen == i);
        y += 46;
    }
    W* t = Add(ID_TOGGLEOVL, WK_BTN, 12, WINH - 62, SIDEW - 24, 38,
               g_set.overlayOn ? L"OVERLAY ON" : L"OVERLAY OFF");
    t->variant = g_set.overlayOn ? V_ACCENT : V_GHOST;
}

static void LayoutBasic(int* y)
{
    Head(RPX, y, RPW, L"STYLE");
    for (int i = 0; i < 5; i++) {
        W* p = Add(ID_STYLE + i, WK_BTN, RPX + (i % 3) * 100, *y + (i / 3) * 36, 92, 30, kStyleName[i]);
        p->variant = V_CHIP;
        p->active = (g_ch.style == i);
    }
    *y += 80;

    Head(RPX, y, RPW, L"COLOR");
    for (int i = 0; i < 16; i++) {
        W* p = Add(ID_SWATCH + i, WK_SWATCH, RPX + (i % 8) * 33, *y + (i / 8) * 33, 28, 28, NULL);
        p->col = kPalette[i];
        p->active = ((g_ch.color & 0x00FFFFFF) == (kPalette[i] & 0x00FFFFFF));
    }
    *y += 72;
    Add(ID_CUSTOMCOL, WK_BTN, RPX, *y, RPW, 32, L"CUSTOM COLOR")->variant = V_GHOST;
    *y += 42;

    Head(RPX, y, RPW, L"SHAPE");
    if (g_ch.style != ST_DOT) {
        Slider(ID_LEN,   RPX, y, RPW, L"Length", &g_ch.length, 0, 60);
        Slider(ID_THICK, RPX, y, RPW, L"Thickness", &g_ch.thickness, 1, 12);
        Slider(ID_GAP,   RPX, y, RPW, L"Gap", &g_ch.gap, 0, 40);
    }
    Slider(ID_OPACITY, RPX, y, RPW, L"Opacity", &g_ch.opacity, 10, 255);
    *y += 6;
    Toggle(ID_CENTERDOT, RPX, y, RPW, L"Center dot", &g_ch.centerDot);
    Toggle(ID_OUTLINE,   RPX, y, RPW, L"Outline",    &g_ch.outline);
}

static void LayoutAdvanced(int* y)
{
    Head(RPX, y, RPW, L"FINE TUNING");
    Slider(ID_DOTSIZE, RPX, y, RPW, L"Center dot size", &g_ch.dotSize, 1, 12);
    Slider(ID_OFFX,    RPX, y, RPW, L"Offset X", &g_ch.offsetX, -60, 60);
    Slider(ID_OFFY,    RPX, y, RPW, L"Offset Y", &g_ch.offsetY, -60, 60);
    Add(ID_OUTLINECOL, WK_BTN, RPX, *y, RPW, 32, L"OUTLINE COLOR")->variant = V_GHOST;
    *y += 44;

    Head(RPX, y, RPW, L"CUSTOM IMAGE");
    Add(ID_IMGLOAD,  WK_BTN, RPX, *y, RPW - 96, 32, L"UPLOAD IMAGE")->variant = V_GHOST;
    Add(ID_IMGCLEAR, WK_BTN, RPX + RPW - 88, *y, 88, 32, L"REMOVE")->variant = V_GHOST;
    *y += 40;
    {
        const wchar_t* n = g_ch.image[0] ? wcsrchr(g_ch.image, L'\\') : NULL;
        wchar_t t[72];
        _snwprintf(t, 72, L"%s", g_ch.image[0] ? (n ? n + 1 : g_ch.image) : L"No image loaded");
        t[71] = 0;
        Add(0, WK_TEXT, RPX, *y, RPW, 18, t);
        *y += 24;
    }
    W* u = Add(ID_IMGUSE, WK_BTN, RPX, *y, RPW, 32, L"USE IMAGE AS CROSSHAIR");
    u->variant = (g_ch.style == ST_IMAGE) ? V_ACCENT : V_GHOST;
    u->active = (g_ch.style == ST_IMAGE);
    *y += 40;
    Slider(ID_IMGSCALE, RPX, y, RPW, L"Image size %", &g_ch.imageScale, 10, 400);
}

static void LayoutPixel(int* y)
{
    Head(RPX, y, RPW, L"TOOLS");
    for (int i = 0; i < 8; i++) {
        W* p = Add(ID_TOOL + i, WK_BTN, RPX + (i % 4) * 76, *y + (i / 4) * 36, 68, 30, kToolName[i]);
        p->variant = V_CHIP;
        p->active = (i == T_MIRX) ? g_mirX : (i == T_MIRY) ? g_mirY : (g_tool == i);
    }
    *y += 80;

    Head(RPX, y, RPW, L"COLOR");
    for (int i = 0; i < 16; i++) {
        W* p = Add(ID_SWATCH + i, WK_SWATCH, RPX + (i % 8) * 33, *y + (i / 8) * 33, 28, 28, NULL);
        p->col = kPalette[i];
        p->active = ((g_ch.color & 0x00FFFFFF) == (kPalette[i] & 0x00FFFFFF));
    }
    *y += 74;

    Head(RPX, y, RPW, L"CANVAS");
    static const int gs[4] = { 16, 24, 32, 48 };
    for (int i = 0; i < 4; i++) {
        wchar_t t[16]; _snwprintf(t, 16, L"%d\x00D7%d", gs[i], gs[i]); t[15] = 0;
        W* p = Add(ID_GRIDSZ + i, WK_BTN, RPX + i * 76, *y, 68, 30, t);
        p->variant = V_CHIP;
        p->active = (g_ch.gridW == gs[i]);
    }
    *y += 40;
    Slider(ID_PXSCALE, RPX, y, RPW, L"Pixel size", &g_ch.pxScale, 1, 10);
    Add(ID_PXUNDO,  WK_BTN, RPX, *y, 140, 32, L"UNDO")->variant = V_GHOST;
    Add(ID_PXCLEAR, WK_BTN, RPX + 150, *y, 150, 32, L"CLEAR")->variant = V_GHOST;
    *y += 42;
    W* u = Add(ID_PXUSE, WK_BTN, RPX, *y, RPW, 34, L"USE PIXEL ART AS CROSSHAIR");
    u->variant = (g_ch.style == ST_PIXEL) ? V_ACCENT : V_GHOST;
    u->active = (g_ch.style == ST_PIXEL);
    *y += 42;
}

static void LayoutDesign(void)
{
    static const wchar_t* tabs[3] = { L"BASIC", L"ADVANCED", L"PIXEL EDITOR" };
    for (int i = 0; i < 3; i++) {
        W* p = Add(ID_TAB + i, WK_TAB, RPX + i * 100, TITLEH + PAD, 96, 30, tabs[i]);
        p->active = (g_tab == i);
    }
    int y = TITLEH + PAD + 46;
    if      (g_tab == TAB_BASIC) LayoutBasic(&y);
    else if (g_tab == TAB_ADV)   LayoutAdvanced(&y);
    else                         LayoutPixel(&y);

    // preview environment + zoom, above the canvas
    if (g_tab != TAB_PIXEL) {
        int ex = CVX;
        for (int i = 0; i < 5; i++) {
            W* p = Add(ID_ENV + i, WK_BTN, ex + i * 74, TITLEH + PAD, 68, 26, kEnvName[i]);
            p->variant = V_CHIP;
            p->active = (g_set.previewEnv == i);
        }
        static const wchar_t* zn[3] = { L"1\x00D7", L"2\x00D7", L"4\x00D7" };
        static const int zv[3] = { 1, 2, 4 };
        for (int i = 0; i < 3; i++) {
            W* p = Add(ID_ZOOM + i, WK_BTN, CVX + CVW - 44 - (2 - i) * 46, TITLEH + PAD, 42, 26, zn[i]);
            p->variant = V_CHIP;
            p->active = (g_set.previewZoom == zv[i]);
        }
    }

    // presets strip
    int py = WINH - 96;
    Add(0, WK_HEAD, CVX, py - 22, 300, 16, L"PRESETS");
    int n = ChPresetCount();
    for (int i = 0; i < n && i < 8; i++) {
        W* p = Add(ID_PRESET + i, WK_CARD, CVX + i * 70, py, 64, 64, ChPresetName(i));
        p->variant = V_CHIP;
    }
    Add(ID_LIBSAVE, WK_BTN, RPX, py + 32, RPW, 32, L"SAVE TO LIBRARY")->variant = V_GHOST;
}

static void LayoutHome(void)
{
    int cx = SIDEW + PAD;
    int w = WINW - cx - PAD;

    Add(ID_EDIT, WK_BTN, cx + w / 2 - 160, WINH - 210, 150, 40, L"EDIT CROSSHAIR")->variant = V_ACCENT;
    W* d = Add(ID_TOGGLEOVL, WK_BTN, cx + w / 2 + 10, WINH - 210, 150, 40,
               g_set.overlayOn ? L"DISABLE" : L"ENABLE");
    d->variant = g_set.overlayOn ? V_GHOST : V_ACCENT;

    Add(0, WK_HEAD, cx, WINH - 152, 300, 16, L"LIBRARY");
    for (int i = 0; i < MAXLIB; i++) {
        if (!g_libUsed[i]) continue;
        Add(ID_LIB + i, WK_CARD, cx + i * 108, WINH - 130, 100, 100, g_lib[i].name);
    }
}

static void LayoutProfiles(void)
{
    int x = SIDEW + PAD, w = WINW - x - PAD;
    Add(0, WK_HEAD, x, TITLEH + PAD, 400, 16, L"GAME PROFILES");
    Add(0, WK_TEXT, x, TITLEH + PAD + 22, w, 18,
        L"Each game remembers its own crosshair. It switches automatically when the game starts.");

    int y = TITLEH + PAD + 58;
    for (int i = 0; i < g_nprof; i++) {
        W* row = Add(ID_PROF + i, WK_ROW, x, y, w, 74, g_prof[i].label);
        wchar_t s[72];
        _snwprintf(s, 72, L"%s  \x2022  %s  \x2022  %d\x00D7%d", g_prof[i].exe,
                   g_prof[i].ch.name[0] ? g_prof[i].ch.name : L"Custom",
                   g_prof[i].lastW, g_prof[i].lastH);
        s[71] = 0;
        wcsncpy(row->sub, s, 71);
        row->active = (i == g_activeProfile);
        W* t = Add(ID_PROFAUTO + i, WK_TOGGLE, x + w - 240, y + 22, 150, 30, L"Auto-switch");
        t->val = &g_prof[i].autoLaunch;
        Add(ID_PROFDEL + i, WK_BTN, x + w - 80, y + 22, 64, 30, L"DELETE")->variant = V_DANGER;
        y += 82;
    }
    if (g_nprof < MAXPROFILE) {
        wchar_t t[72];
        _snwprintf(t, 72, g_lastGame[0] ? L"ADD %s" : L"NO GAME DETECTED YET", g_lastGame);
        t[71] = 0;
        W* b = Add(ID_PROFADD, WK_BTN, x, y + 8, 320, 38, t);
        b->variant = g_lastGame[0] ? V_ACCENT : V_GHOST;
    }
}

static void LayoutSettings(void)
{
    int x = SIDEW + PAD, w = 420;
    int y = TITLEH + PAD;
    Head(x, &y, w, L"OVERLAY");
    Toggle(ID_SET + 0, x, &y, w, L"Overlay enabled", &g_set.overlayOn);
    Toggle(ID_SET + 1, x, &y, w, L"Only show while a game is running", &g_set.onlyInGame);
    Toggle(ID_SET + 2, x, &y, w, L"Auto-detect fullscreen games", &g_set.autoDetect);
    Toggle(ID_SET + 3, x, &y, w, L"Open this window when a game starts", &g_set.autoOpenPanel);
    y += 10;
    Head(x, &y, w, L"SYSTEM");
    Toggle(ID_SET + 4, x, &y, w, L"Start with Windows", &g_set.startWithWindows);
    Toggle(ID_SET + 5, x, &y, w, L"Check for updates automatically", &g_set.autoUpdate);
    y += 6;
    Add(ID_UPDCHECK, WK_BTN, x, y, 200, 34, L"CHECK FOR UPDATES")->variant = V_GHOST;
    if (UpdateAvailable())
        Add(ID_UPDINSTALL, WK_BTN, x + 212, y, 208, 34, L"DOWNLOAD & INSTALL")->variant = V_ACCENT;
    y += 44;
    Add(0, WK_TEXT, x, y, w, 18, UpdateStatusText());
    y += 30;
    wchar_t v[64]; _snwprintf(v, 64, L"%s  v%s", APP_NAME, APP_VER); v[63] = 0;
    Add(0, WK_TEXT, x, y, w, 18, v);
    Add(0, WK_TEXT, x, y + 20, w, 18, L"Press F12 anywhere to hide or bring back this window.");
}

static void Layout(void)
{
    g_nw = 0;
    LayoutTitle();
    LayoutNav();
    switch (g_screen) {
    case SC_HOME:     LayoutHome(); break;
    case SC_DESIGN:   LayoutDesign(); break;
    case SC_PROFILES: LayoutProfiles(); break;
    default:          LayoutSettings(); break;
    }
}

// ------------------------------------------------------------------ preview
static void EnvFill(uint32_t* b, int w, int h, int env)
{
    for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
            int r, g, bl;
            double t = (double)y / (h ? h : 1);
            switch (env) {
            case 1: r = 232 - (int)(t * 22); g = 236 - (int)(t * 22); bl = 242 - (int)(t * 20); break;
            case 2: r = 42 + (int)(t * 26);  g = 92 + (int)(t * 40);  bl = 38 + (int)(t * 18); break;
            case 3: r = 92 - (int)(t * 40);  g = 158 - (int)(t * 50); bl = 224 - (int)(t * 40); break;
            case 4: r = 118 - (int)(t * 40); g = 120 - (int)(t * 40); bl = 124 - (int)(t * 42); break;
            default: r = 11 + (int)(t * 6);  g = 13 + (int)(t * 7);   bl = 17 + (int)(t * 9);  break;
            }
            if (env == 2 || env == 4) {                       // cheap deterministic grain
                int n = ((x * 73856093) ^ (y * 19349663)) & 31;
                r += n - 16; g += n - 16; bl += n - 16;
            }
            b[y * w + x] = 0xFF000000 | ((uint32_t)Clamp(r, 0, 255) << 16) |
                           ((uint32_t)Clamp(g, 0, 255) << 8) | (uint32_t)Clamp(bl, 0, 255);
        }
    }
}

static void Blend(uint32_t* dst, uint32_t src)
{
    int a = (src >> 24) & 0xFF;
    if (!a) return;
    uint32_t d = *dst;
    int r = (((src >> 16) & 0xFF) * a + ((d >> 16) & 0xFF) * (255 - a)) / 255;
    int g = (((src >>  8) & 0xFF) * a + ((d >>  8) & 0xFF) * (255 - a)) / 255;
    int b = (( src        & 0xFF) * a + ( d        & 0xFF) * (255 - a)) / 255;
    *dst = 0xFF000000 | ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b;
}

// draws the preview straight into device pixels of `dev`
static void PaintPreview(HDC dc, RECT dev)
{
    int w = dev.right - dev.left, h = dev.bottom - dev.top;
    if (w < 8 || h < 8) return;
    uint32_t* buf = (uint32_t*)malloc((size_t)w * h * 4);
    if (!buf) return;
    EnvFill(buf, w, h, g_set.previewEnv);

    int mcx = w / 2, mcy = h / 2;
    uint32_t guide = (g_set.previewEnv == 1) ? 0x22000000 : 0x18FFFFFF;
    for (int x = 0; x < w; x++) Blend(&buf[mcy * w + x], guide);
    for (int y = 0; y < h; y++) Blend(&buf[y * w + mcx], guide);

    ChBitmap cb;
    if (ChBuild(&g_ch, &cb)) {
        int z = g_set.previewZoom < 1 ? 1 : g_set.previewZoom;
        for (int y = 0; y < cb.h * z; y++) {
            int dy = mcy - cb.ay * z + y;
            if (dy < 0 || dy >= h) continue;
            const uint32_t* srow = cb.px + (size_t)(y / z) * cb.w;
            for (int x = 0; x < cb.w * z; x++) {
                int dx = mcx - cb.ax * z + x;
                if (dx < 0 || dx >= w) continue;
                Blend(&buf[dy * w + dx], srow[x / z]);
            }
        }
        ChFree(&cb);
    }

    BITMAPINFO bi;
    ZeroMemory(&bi, sizeof(bi));
    bi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bi.bmiHeader.biWidth = w; bi.bmiHeader.biHeight = -h;
    bi.bmiHeader.biPlanes = 1; bi.bmiHeader.biBitCount = 32;
    bi.bmiHeader.biCompression = BI_RGB;
    SetDIBitsToDevice(dc, dev.left, dev.top, w, h, 0, 0, 0, h, buf, &bi, DIB_RGB_COLORS);
    free(buf);
}

// small crosshair thumbnail inside a card (logical coords, world transform active)
static void PaintThumb(HDC dc, RECT r, const Crosshair* c)
{
    ChBitmap cb;
    Crosshair t = *c;
    if (!ChBuild(&t, &cb)) return;
    int box = (r.right - r.left) - 16;
    int scale = 1;
    while ((cb.w * (scale + 1)) <= box && scale < 3) scale++;
    int cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    for (int y = 0; y < cb.h; y++)
        for (int x = 0; x < cb.w; x++) {
            uint32_t p = cb.px[y * cb.w + x];
            if (((p >> 24) & 0xFF) < 40) continue;
            int dx = cx + (x - cb.ax) * scale, dy = cy + (y - cb.ay) * scale;
            if (dx < r.left + 4 || dx > r.right - 4 - scale || dy < r.top + 4 || dy > r.bottom - 4 - scale) continue;
            RECT q; SetRect(&q, dx, dy, dx + scale, dy + scale);
            Fill(dc, q, ToRef(p));
        }
    ChFree(&cb);
}

// ------------------------------------------------------------------ chrome
static void PaintWidget(HDC dc, W* p, int hover)
{
    switch (p->kind) {
    case WK_HEAD:
        Txt(dc, p->r, p->text, C_TXT2, g_fs, DT_LEFT | DT_VCENTER);
        break;
    case WK_TEXT:
        Txt(dc, p->r, p->text, C_TXT2, g_f, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
        break;

    case WK_NAV: {
        if (p->active) {
            Card(dc, p->r, C_RAISED, C_BORDER, 10);
            RECT bar; SetRect(&bar, p->r.left, p->r.top + 10, p->r.left + 3, p->r.bottom - 10);
            Fill(dc, bar, C_ACC);
        } else if (hover) {
            Card(dc, p->r, C_PANEL, C_PANEL, 10);
        }
        RECT t = p->r; t.left += 18;
        Txt(dc, t, p->text, p->active ? C_TXT : C_TXT2, p->active ? g_fb : g_f, DT_LEFT | DT_VCENTER);
        break;
    }

    case WK_TAB: {
        RECT t = p->r;
        Txt(dc, t, p->text, p->active ? C_TXT : C_TXT2, p->active ? g_fb : g_f, DT_CENTER | DT_VCENTER);
        RECT u; SetRect(&u, t.left + 6, t.bottom - 2, t.right - 6, t.bottom);
        Fill(dc, u, p->active ? C_ACC : C_PANEL);
        break;
    }

    case WK_BTN: {
        COLORREF fill = C_RAISED, bd = C_BORDER, tc = C_TXT;
        if (p->variant == V_ACCENT)      { fill = C_ACC;    bd = C_ACC;    tc = RGB(4, 12, 9); }
        else if (p->variant == V_DANGER) { fill = C_PANEL;  bd = C_DANGER; tc = C_DANGER; }
        else if (p->active)              { fill = C_ACCDIM; bd = C_ACC;    tc = C_ACC; }
        else if (hover)                  { fill = RGB(0x1E,0x23,0x2C); }
        Card(dc, p->r, fill, bd, 8);
        Txt(dc, p->r, p->text, tc, (p->variant == V_ACCENT) ? g_fb : g_fs, DT_CENTER | DT_VCENTER);
        break;
    }

    case WK_SWATCH: {
        Card(dc, p->r, ToRef(p->col), p->active ? C_ACC : C_BORDER, 7);
        if (p->active) {
            RECT o = p->r; InflateRect(&o, 2, 2);
            HPEN pen = CreatePen(PS_SOLID, 2, C_ACC);
            HGDIOBJ op = SelectObject(dc, pen), ob = SelectObject(dc, GetStockObject(NULL_BRUSH));
            RoundRect(dc, o.left, o.top, o.right, o.bottom, 9, 9);
            SelectObject(dc, op); SelectObject(dc, ob);
            DeleteObject(pen);
        }
        break;
    }

    case WK_TOGGLE: {
        int on = p->val && *p->val;
        RECT t = p->r; t.right -= 52;
        Txt(dc, t, p->text, on ? C_TXT : C_TXT2, g_f, DT_LEFT | DT_VCENTER);
        RECT sw; SetRect(&sw, p->r.right - 44, p->r.top + 5, p->r.right, p->r.top + 25);
        Card(dc, sw, on ? C_ACC : C_RAISED, on ? C_ACC : C_BORDER, 10);
        RECT kn;
        int kx = on ? sw.right - 18 : sw.left + 2;
        SetRect(&kn, kx, sw.top + 2, kx + 16, sw.bottom - 2);
        Card(dc, kn, on ? RGB(6, 20, 15) : C_TXT2, on ? RGB(6, 20, 15) : C_TXT2, 8);
        break;
    }

    case WK_SLIDER: {
        int v = p->val ? *p->val : 0, w = p->r.right - p->r.left;
        RECT lab; SetRect(&lab, p->r.left, p->r.top, p->r.right, p->r.top + 16);
        Txt(dc, lab, p->text, C_TXT2, g_f, DT_LEFT | DT_VCENTER);
        wchar_t num[16]; _snwprintf(num, 16, L"%d", v); num[15] = 0;
        Txt(dc, lab, num, C_TXT, g_fb, DT_RIGHT | DT_VCENTER);
        int ty = p->r.top + 23;
        RECT tr; SetRect(&tr, p->r.left, ty, p->r.right, ty + 5);
        Card(dc, tr, C_RAISED, C_BORDER, 3);
        int span = p->mx - p->mn; if (span < 1) span = 1;
        int fx = (v - p->mn) * (w - 14) / span;
        RECT fr; SetRect(&fr, p->r.left, ty, p->r.left + fx + 7, ty + 5);
        Card(dc, fr, C_ACC, C_ACC, 3);
        RECT kn; SetRect(&kn, p->r.left + fx, ty - 5, p->r.left + fx + 14, ty + 10);
        Card(dc, kn, C_TXT, C_ACC, 7);
        break;
    }

    case WK_CARD: {
        Card(dc, p->r, hover ? RGB(0x1E,0x23,0x2C) : C_PANEL, p->active ? C_ACC : C_BORDER, 10);
        RECT lab; SetRect(&lab, p->r.left, p->r.bottom - 20, p->r.right, p->r.bottom - 4);
        Txt(dc, lab, p->text, C_TXT2, g_fs, DT_CENTER | DT_VCENTER);
        break;
    }

    case WK_ROW: {
        Card(dc, p->r, p->active ? C_RAISED : C_PANEL, p->active ? C_ACC : C_BORDER, 10);
        RECT t; SetRect(&t, p->r.left + 18, p->r.top + 14, p->r.right - 260, p->r.top + 36);
        Txt(dc, t, p->text, C_TXT, g_fb, DT_LEFT | DT_VCENTER);
        SetRect(&t, p->r.left + 18, p->r.top + 38, p->r.right - 260, p->r.top + 58);
        Txt(dc, t, p->sub, C_TXT2, g_fs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
        break;
    }
    }
}

// ------------------------------------------------------------------ screens
static XFORM g_xf;

static RECT StageRect(void)
{
    RECT r; SetRect(&r, CVX, TITLEH + PAD + 38, CVX + CVW, WINH - 120);
    return r;
}

static int PxCellFor(RECT r)
{
    int a = (r.right - r.left - 24) / g_ch.gridW;
    int b = (r.bottom - r.top - 24) / g_ch.gridH;
    int c = a < b ? a : b;
    return c < 2 ? 2 : c;
}

static RECT ToDev(RECT r)
{
    RECT d;
    d.left = (int)(r.left * g_ds); d.top = (int)(r.top * g_ds);
    d.right = (int)(r.right * g_ds); d.bottom = (int)(r.bottom * g_ds);
    return d;
}

static void StageBlit(HDC dc, RECT logical)
{
    ModifyWorldTransform(dc, NULL, MWT_IDENTITY);
    SetGraphicsMode(dc, GM_COMPATIBLE);
    PaintPreview(dc, ToDev(logical));
    if (g_ds != 1.0f) { SetGraphicsMode(dc, GM_ADVANCED); SetWorldTransform(dc, &g_xf); }
}

static void PaintPixelCanvas(HDC dc, RECT box)
{
    Card(dc, box, C_PANEL, C_BORDER, 12);
    int cs = PxCellFor(box);
    int x0 = box.left + (box.right - box.left - cs * g_ch.gridW) / 2;
    int y0 = box.top + (box.bottom - box.top - cs * g_ch.gridH) / 2;

    for (int cy = 0; cy < g_ch.gridH; cy++)
        for (int cx = 0; cx < g_ch.gridW; cx++) {
            RECT r; SetRect(&r, x0 + cx * cs, y0 + cy * cs, x0 + (cx + 1) * cs, y0 + (cy + 1) * cs);
            Fill(dc, r, ((cx ^ cy) & 1) ? RGB(0x1B,0x1F,0x27) : RGB(0x15,0x18,0x1F));
            uint32_t c = g_ch.px[cy * MAXGRID + cx];
            if (c & 0xFF000000) Fill(dc, r, ToRef(c));
        }

    HPEN pen = CreatePen(PS_SOLID, 1, RGB(0x24,0x2A,0x34));
    HGDIOBJ op = SelectObject(dc, pen);
    if (cs >= 9) {
        for (int i = 0; i <= g_ch.gridW; i++) { MoveToEx(dc, x0 + i * cs, y0, NULL); LineTo(dc, x0 + i * cs, y0 + cs * g_ch.gridH); }
        for (int i = 0; i <= g_ch.gridH; i++) { MoveToEx(dc, x0, y0 + i * cs, NULL); LineTo(dc, x0 + cs * g_ch.gridW, y0 + i * cs); }
    }
    SelectObject(dc, op); DeleteObject(pen);

    int ax = g_ch.gridW / 2, ay = g_ch.gridH / 2;
    pen = CreatePen(PS_SOLID, 1, C_DANGER);
    op = SelectObject(dc, pen);
    MoveToEx(dc, x0 + ax * cs + cs / 2, y0, NULL); LineTo(dc, x0 + ax * cs + cs / 2, y0 + cs * g_ch.gridH);
    MoveToEx(dc, x0, y0 + ay * cs + cs / 2, NULL); LineTo(dc, x0 + cs * g_ch.gridW, y0 + ay * cs + cs / 2);
    SelectObject(dc, op); DeleteObject(pen);

    if (g_drawing && g_shape && g_sx >= 0 && g_cx >= 0) {
        HPEN sp = CreatePen(PS_DOT, 1, C_ACC);
        HGDIOBJ o2 = SelectObject(dc, sp), ob = SelectObject(dc, GetStockObject(NULL_BRUSH));
        int l = min(g_sx, g_cx), t = min(g_sy, g_cy), r = max(g_sx, g_cx), b = max(g_sy, g_cy);
        if (g_tool == T_LINE) {
            MoveToEx(dc, x0 + g_sx * cs + cs / 2, y0 + g_sy * cs + cs / 2, NULL);
            LineTo(dc, x0 + g_cx * cs + cs / 2, y0 + g_cy * cs + cs / 2);
        } else if (g_tool == T_RECT) Rectangle(dc, x0 + l * cs, y0 + t * cs, x0 + (r + 1) * cs, y0 + (b + 1) * cs);
        else Ellipse(dc, x0 + l * cs, y0 + t * cs, x0 + (r + 1) * cs, y0 + (b + 1) * cs);
        SelectObject(dc, o2); SelectObject(dc, ob); DeleteObject(sp);
    }
}

static void PaintHome(HDC dc)
{
    int x = CVX, w = WINW - CVX - PAD;
    SYSTEMTIME st; GetLocalTime(&st);
    const wchar_t* greet = st.wHour < 12 ? L"Good morning." :
                           st.wHour < 18 ? L"Good afternoon." : L"Good evening.";
    TxtAt(dc, x, TITLEH + 18, w, 34, greet, C_TXT, g_fxl, DT_LEFT | DT_VCENTER);
    TxtAt(dc, x, TITLEH + 52, w, 18, L"ACTIVE CROSSHAIR", C_TXT2, g_fs, DT_LEFT | DT_VCENTER);

    RECT stage; SetRect(&stage, x, TITLEH + 78, x + w, WINH - 276);
    Card(dc, stage, C_PANEL, C_BORDER, 14);
    RECT inner = stage; InflateRect(&inner, -1, -1);
    StageBlit(dc, inner);

    wchar_t n[64];
    _snwprintf(n, 64, L"%s", g_ch.name[0] ? g_ch.name : L"Custom"); n[63] = 0;
    TxtAt(dc, x, WINH - 268, w, 26, n, C_TXT, g_fh, DT_CENTER | DT_VCENTER);

    wchar_t sub[96];
    int rw = 0, rh = 0; OverlayResolution(&rw, &rh);
    _snwprintf(sub, 96, L"%s profile  \x2022  %d \x00D7 %d  \x2022  %s", g_activeLabel, rw, rh,
               g_set.overlayOn ? L"overlay on" : L"overlay off"); sub[95] = 0;
    TxtAt(dc, x, WINH - 242, w, 20, sub, C_TXT2, g_f, DT_CENTER | DT_VCENTER);

    Layout();
    for (int i = 0; i < g_nw; i++)
        if (g_w[i].kind == WK_CARD && g_w[i].id >= ID_LIB && g_w[i].id < ID_LIB + MAXLIB)
            PaintThumb(dc, g_w[i].r, &g_lib[g_w[i].id - ID_LIB]);
}

static void PaintShell(HWND h, HDC target)
{
    RECT client; GetClientRect(h, &client);
    HDC dc = CreateCompatibleDC(target);
    HBITMAP bm = CreateCompatibleBitmap(target, client.right, client.bottom);
    HGDIOBJ ob = SelectObject(dc, bm);

    if (g_ds != 1.0f) { SetGraphicsMode(dc, GM_ADVANCED); SetWorldTransform(dc, &g_xf); }

    RECT full; SetRect(&full, 0, 0, WINW, WINH);
    Fill(dc, full, C_BG);

    RECT side; SetRect(&side, 0, TITLEH, SIDEW, WINH);
    Fill(dc, side, C_PANEL);
    RECT sl; SetRect(&sl, SIDEW - 1, TITLEH, SIDEW, WINH);
    Fill(dc, sl, C_BORDER);

    RECT tb; SetRect(&tb, 0, 0, WINW, TITLEH);
    Fill(dc, tb, C_PANEL);
    RECT tl; SetRect(&tl, 0, TITLEH - 1, WINW, TITLEH);
    Fill(dc, tl, C_BORDER);

    // logo
    HBRUSH ab = CreateSolidBrush(C_ACC);
    HGDIOBJ oab = SelectObject(dc, ab);
    HPEN np = CreatePen(PS_SOLID, 1, C_ACC);
    HGDIOBJ onp = SelectObject(dc, np);
    Ellipse(dc, 20, TITLEH / 2 - 6, 32, TITLEH / 2 + 6);
    SelectObject(dc, oab); SelectObject(dc, onp);
    DeleteObject(ab); DeleteObject(np);
    HBRUSH bb = CreateSolidBrush(C_PANEL);
    HGDIOBJ obb = SelectObject(dc, bb);
    HPEN bp = CreatePen(PS_SOLID, 1, C_PANEL);
    HGDIOBJ obp = SelectObject(dc, bp);
    Ellipse(dc, 24, TITLEH / 2 - 2, 28, TITLEH / 2 + 2);
    SelectObject(dc, obb); SelectObject(dc, obp);
    DeleteObject(bb); DeleteObject(bp);

    TxtAt(dc, 42, 0, 220, TITLEH, APP_NAME, C_TXT, g_fh, DT_LEFT | DT_VCENTER);

    {   // centre: what is active right now
        wchar_t c[128];
        int rw = 0, rh = 0; OverlayResolution(&rw, &rh);
        _snwprintf(c, 128, L"%s   \x2022   %d \x00D7 %d", g_activeLabel, rw, rh); c[127] = 0;
        TxtAt(dc, WINW / 2 - 200, 0, 400, TITLEH, c, C_TXT2, g_f, DT_CENTER | DT_VCENTER);
    }

    RECT pill; SetRect(&pill, WINW - 292, 12, WINW - 152, 34);
    Card(dc, pill, C_RAISED, C_BORDER, 11);
    Txt(dc, pill, L"F12  hide / show", C_TXT2, g_fs, DT_CENTER | DT_VCENTER);

    TxtAt(dc, 20, WINH - 100, SIDEW - 32, 16, L"STATUS", C_TXT2, g_fs, DT_LEFT | DT_VCENTER);
    TxtAt(dc, 20, WINH - 84, SIDEW - 32, 16, g_status, C_TXT2, g_fs, DT_LEFT | DT_VCENTER);

    if (g_screen == SC_HOME) {
        PaintHome(dc);
    } else if (g_screen == SC_DESIGN) {
        RECT stage = StageRect();
        if (g_tab == TAB_PIXEL) {
            PaintPixelCanvas(dc, stage);
        } else {
            Card(dc, stage, C_PANEL, C_BORDER, 12);
            RECT inner = stage; InflateRect(&inner, -1, -1);
            StageBlit(dc, inner);
        }
        Layout();
        for (int i = 0; i < g_nw; i++)
            if (g_w[i].kind == WK_CARD && g_w[i].id >= ID_PRESET && g_w[i].id < ID_PRESET + 16) {
                Crosshair t; memcpy(&t, &g_ch, sizeof(t));
                ChDefault(&t, g_w[i].id - ID_PRESET);
                t.color = g_ch.color;
                PaintThumb(dc, g_w[i].r, &t);
            }
    } else if (g_screen == SC_PROFILES && g_nprof == 0) {
        TxtAt(dc, CVX, TITLEH + 120, 600, 24,
              L"No profiles yet. Launch a game, then come back and add it.", C_TXT2, g_f, DT_LEFT | DT_VCENTER);
    }

    Layout();
    for (int i = 0; i < g_nw; i++) PaintWidget(dc, &g_w[i], i == g_hover);

    ModifyWorldTransform(dc, NULL, MWT_IDENTITY);
    SetGraphicsMode(dc, GM_COMPATIBLE);
    BitBlt(target, 0, 0, client.right, client.bottom, dc, 0, 0, SRCCOPY);
    SelectObject(dc, ob);
    DeleteObject(bm);
    DeleteDC(dc);
}

// ------------------------------------------------------------------ pixel ops
static void Put(int x, int y, uint32_t c)
{
    if (x < 0 || y < 0 || x >= g_ch.gridW || y >= g_ch.gridH) return;
    g_ch.px[y * MAXGRID + x] = c;
    if (g_mirX) g_ch.px[y * MAXGRID + (g_ch.gridW - 1 - x)] = c;
    if (g_mirY) g_ch.px[(g_ch.gridH - 1 - y) * MAXGRID + x] = c;
    if (g_mirX && g_mirY) g_ch.px[(g_ch.gridH - 1 - y) * MAXGRID + (g_ch.gridW - 1 - x)] = c;
}

static void PLine(int x0, int y0, int x1, int y1, uint32_t c)
{
    int dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    int dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
        Put(x0, y0, c);
        if (x0 == x1 && y0 == y1) break;
        int e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

static void PRect(int x0, int y0, int x1, int y1, uint32_t c)
{
    int l = min(x0, x1), r = max(x0, x1), t = min(y0, y1), b = max(y0, y1);
    for (int x = l; x <= r; x++) { Put(x, t, c); Put(x, b, c); }
    for (int y = t; y <= b; y++) { Put(l, y, c); Put(r, y, c); }
}

static void PEllipse(int x0, int y0, int x1, int y1, uint32_t c)
{
    int l = min(x0, x1), r = max(x0, x1), t = min(y0, y1), b = max(y0, y1);
    double cx = (l + r) / 2.0, cy = (t + b) / 2.0;
    double rx = max(0.5, (r - l) / 2.0), ry = max(0.5, (b - t) / 2.0);
    for (int a = 0; a < 720; a++) {
        double rad = a * 3.14159265358979 / 360.0;
        Put((int)(cx + rx * cos(rad) + 0.5), (int)(cy + ry * sin(rad) + 0.5), c);
    }
}

static void PFlood(int x, int y, uint32_t c)
{
    if (x < 0 || y < 0 || x >= g_ch.gridW || y >= g_ch.gridH) return;
    uint32_t from = g_ch.px[y * MAXGRID + x];
    if (from == c) return;
    static int st[MAXGRID * MAXGRID * 2];
    int sp = 0; st[sp++] = x; st[sp++] = y;
    while (sp) {
        int py = st[--sp], px = st[--sp];
        if (px < 0 || py < 0 || px >= g_ch.gridW || py >= g_ch.gridH) continue;
        if (g_ch.px[py * MAXGRID + px] != from) continue;
        g_ch.px[py * MAXGRID + px] = c;
        if (sp + 8 > MAXGRID * MAXGRID * 2) continue;
        st[sp++] = px + 1; st[sp++] = py;
        st[sp++] = px - 1; st[sp++] = py;
        st[sp++] = px; st[sp++] = py + 1;
        st[sp++] = px; st[sp++] = py - 1;
    }
}

// ------------------------------------------------------------------ dialogs
static void PickColor(int outlineTarget)
{
    CHOOSECOLORW cc;
    ZeroMemory(&cc, sizeof(cc));
    cc.lStructSize = sizeof(cc);
    cc.hwndOwner = g_hwnd;
    cc.lpCustColors = g_custom;
    cc.rgbResult = ToRef(outlineTarget ? g_ch.outlineColor : g_ch.color);
    cc.Flags = CC_FULLOPEN | CC_RGBINIT;
    if (!ChooseColorW(&cc)) return;
    uint32_t c = ((uint32_t)GetRValue(cc.rgbResult) << 16) |
                 ((uint32_t)GetGValue(cc.rgbResult) << 8) | (uint32_t)GetBValue(cc.rgbResult);
    if (outlineTarget) { g_ch.outlineColor = 0xE6000000 | c; ApplyAndSave(); }
    else SetColor(c);
}

static void PickImage(void)
{
    wchar_t file[MAX_PATH] = L"";
    OPENFILENAMEW ofn;
    ZeroMemory(&ofn, sizeof(ofn));
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner = g_hwnd;
    ofn.lpstrFilter = L"Images (png, bmp, jpg, gif)\0*.png;*.bmp;*.jpg;*.jpeg;*.gif\0All files\0*.*\0";
    ofn.lpstrFile = file;
    ofn.nMaxFile = MAX_PATH;
    ofn.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR;
    if (!GetOpenFileNameW(&ofn)) return;
    wcsncpy(g_ch.image, file, MAX_PATH - 1);
    g_ch.image[MAX_PATH - 1] = 0;
    ChDropImage();
    g_ch.style = ST_IMAGE;
    wcsncpy(g_ch.name, L"Custom Image", 31);
    ApplyAndSave();
}

static void LibSave(void)
{
    int slot = -1;
    for (int i = 0; i < MAXLIB; i++) if (!g_libUsed[i]) { slot = i; break; }
    if (slot < 0) { slot = MAXLIB - 1; for (int i = 0; i < MAXLIB - 1; i++) { memcpy(&g_lib[i], &g_lib[i + 1], sizeof(Crosshair)); } }
    memcpy(&g_lib[slot], &g_ch, sizeof(Crosshair));
    g_libUsed[slot] = 1;
    ShellStatus(L"Saved to library.");
    CfgSave();
}

// ------------------------------------------------------------------ commands
static void Command(int id)
{
    if (id >= ID_NAV && id < ID_NAV + 4) { g_screen = id - ID_NAV; g_hover = -1; ShellRedraw(); return; }
    if (id >= ID_TAB && id < ID_TAB + 3)  { g_tab = id - ID_TAB; g_hover = -1; ShellRedraw(); return; }
    if (id >= ID_STYLE && id < ID_STYLE + 5) {
        g_ch.style = id - ID_STYLE;
        wcsncpy(g_ch.name, kStyleName[id - ID_STYLE], 31);
        ApplyAndSave(); return;
    }
    if (id >= ID_SWATCH && id < ID_SWATCH + 16) { SetColor(kPalette[id - ID_SWATCH]); return; }
    if (id >= ID_TOOL && id < ID_TOOL + 8) {
        int t = id - ID_TOOL;
        if (t == T_MIRX) g_mirX = !g_mirX;
        else if (t == T_MIRY) g_mirY = !g_mirY;
        else g_tool = t;
        ShellRedraw(); return;
    }
    if (id >= ID_GRIDSZ && id < ID_GRIDSZ + 4) {
        static const int gs[4] = { 16, 24, 32, 48 };
        int n = gs[id - ID_GRIDSZ];
        if (n != g_ch.gridW) {
            PushUndo();
            uint32_t tmp[MAXGRID * MAXGRID];
            memcpy(tmp, g_ch.px, sizeof(tmp));
            int ox = g_ch.gridW / 2, oy = g_ch.gridH / 2, nc = n / 2;
            ZeroMemory(g_ch.px, sizeof(g_ch.px));
            for (int y = 0; y < g_ch.gridH; y++)
                for (int x = 0; x < g_ch.gridW; x++) {
                    int dx = x - ox + nc, dy = y - oy + nc;
                    if (dx >= 0 && dy >= 0 && dx < n && dy < n) g_ch.px[dy * MAXGRID + dx] = tmp[y * MAXGRID + x];
                }
            g_ch.gridW = g_ch.gridH = n;
        }
        ApplyAndSave(); return;
    }
    if (id >= ID_PRESET && id < ID_PRESET + 16) {
        int ox = g_ch.offsetX, oy = g_ch.offsetY;
        uint32_t col = g_ch.color;
        ChDefault(&g_ch, id - ID_PRESET);
        g_ch.offsetX = ox; g_ch.offsetY = oy; g_ch.color = col;
        ApplyAndSave(); return;
    }
    if (id >= ID_LIB && id < ID_LIB + MAXLIB) {
        int i = id - ID_LIB;
        if (g_libUsed[i]) { memcpy(&g_ch, &g_lib[i], sizeof(Crosshair)); ApplyAndSave(); }
        return;
    }
    if (id >= ID_PROF && id < ID_PROF + MAXPROFILE) {
        int i = id - ID_PROF;
        if (i < g_nprof) {
            g_activeProfile = i;
            memcpy(&g_ch, &g_prof[i].ch, sizeof(Crosshair));
            wcsncpy(g_activeLabel, g_prof[i].label, 63);
            ApplyAndSave();
        }
        return;
    }
    if (id >= ID_PROFAUTO && id < ID_PROFAUTO + MAXPROFILE) {
        int i = id - ID_PROFAUTO;
        if (i < g_nprof) { g_prof[i].autoLaunch = !g_prof[i].autoLaunch; CfgSave(); ShellRedraw(); }
        return;
    }
    if (id >= ID_PROFDEL && id < ID_PROFDEL + MAXPROFILE) {
        int i = id - ID_PROFDEL;
        if (i < g_nprof) {
            for (int k = i; k < g_nprof - 1; k++) memcpy(&g_prof[k], &g_prof[k + 1], sizeof(Profile));
            g_nprof--;
            if (g_activeProfile == i) { g_activeProfile = -1; wcscpy(g_activeLabel, L"Default"); }
            else if (g_activeProfile > i) g_activeProfile--;
            CfgSave(); ShellRedraw();
        }
        return;
    }
    if (id >= ID_ENV && id < ID_ENV + 5)  { g_set.previewEnv = id - ID_ENV; CfgSave(); ShellRedraw(); return; }
    if (id >= ID_ZOOM && id < ID_ZOOM + 3) {
        static const int zv[3] = { 1, 2, 4 };
        g_set.previewZoom = zv[id - ID_ZOOM]; CfgSave(); ShellRedraw(); return;
    }
    if (id >= ID_SET && id < ID_SET + 6) {
        int* f[6] = { &g_set.overlayOn, &g_set.onlyInGame, &g_set.autoDetect,
                      &g_set.autoOpenPanel, &g_set.startWithWindows, &g_set.autoUpdate };
        int n = id - ID_SET;
        *f[n] = !*f[n];
        if (n == 4) SetStartWithWindows(g_set.startWithWindows);
        if (n == 0 && !g_set.overlayOn) OverlaySetVisible(FALSE);
        CfgSave(); ShellRedraw();
        return;
    }

    switch (id) {
    case ID_CUSTOMCOL:  PickColor(0); break;
    case ID_OUTLINECOL: PickColor(1); break;
    case ID_CENTERDOT:  g_ch.centerDot = !g_ch.centerDot; ApplyAndSave(); break;
    case ID_OUTLINE:    g_ch.outline = !g_ch.outline; ApplyAndSave(); break;
    case ID_IMGLOAD:    PickImage(); break;
    case ID_IMGCLEAR:   g_ch.image[0] = 0; ChDropImage();
                        if (g_ch.style == ST_IMAGE) g_ch.style = ST_CROSS;
                        ApplyAndSave(); break;
    case ID_IMGUSE:     if (g_ch.image[0]) { g_ch.style = ST_IMAGE; ApplyAndSave(); }
                        else ShellStatus(L"Upload an image first.");
                        break;
    case ID_PXUSE:      g_ch.style = ST_PIXEL; wcsncpy(g_ch.name, L"Pixel Art", 31); ApplyAndSave(); break;
    case ID_PXUNDO:     PopUndo(); ApplyAndSave(); break;
    case ID_PXCLEAR:    PushUndo(); ZeroMemory(g_ch.px, sizeof(g_ch.px)); ApplyAndSave(); break;
    case ID_LIBSAVE:    LibSave(); break;
    case ID_PROFADD:
        if (g_lastGame[0]) {
            int i = ProfileAdd(g_lastGame);
            if (i >= 0) {
                OverlayResolution(&g_prof[i].lastW, &g_prof[i].lastH);
                g_activeProfile = i;
                wcsncpy(g_activeLabel, g_prof[i].label, 63);
                CfgSave(); ShellStatus(L"Profile created.");
            }
        } else ShellStatus(L"Launch a game first.");
        ShellRedraw();
        break;
    case ID_UPDCHECK:   UpdateCheckAsync(g_hwnd, FALSE); break;
    case ID_UPDINSTALL: UpdateInstall(); break;
    case ID_EDIT:       g_screen = SC_DESIGN; g_tab = TAB_BASIC; ShellRedraw(); break;
    case ID_TOGGLEOVL:  g_set.overlayOn = !g_set.overlayOn;
                        if (!g_set.overlayOn) OverlaySetVisible(FALSE);
                        CfgSave(); ShellRedraw(); break;
    case ID_HIDE:       ShellShow(FALSE); TrayShow(FALSE); break;
    case ID_MIN:        ShowWindow(g_hwnd, SW_MINIMIZE); break;
    case ID_CLOSE:      AppExit(); break;
    }
}

// ------------------------------------------------------------------ input
static int HitWidget(int x, int y)
{
    Layout();
    POINT p = { x, y };
    for (int i = g_nw - 1; i >= 0; i--) {
        int k = g_w[i].kind;
        if (k == WK_HEAD || k == WK_TEXT) continue;
        if (PtInRect(&g_w[i].r, p)) return i;
    }
    return -1;
}

static int PixelCell(int x, int y, int* cx, int* cy)
{
    if (g_screen != SC_DESIGN || g_tab != TAB_PIXEL) return 0;
    RECT box = StageRect();
    int cs = PxCellFor(box);
    int x0 = box.left + (box.right - box.left - cs * g_ch.gridW) / 2;
    int y0 = box.top + (box.bottom - box.top - cs * g_ch.gridH) / 2;
    if (x < x0 || y < y0 || x >= x0 + cs * g_ch.gridW || y >= y0 + cs * g_ch.gridH) return 0;
    *cx = (x - x0) / cs;
    *cy = (y - y0) / cs;
    return 1;
}

static void SliderDrag(W* p, int x)
{
    int w = p->r.right - p->r.left;
    int rel = Clamp(x - p->r.left - 7, 0, w - 14);
    *p->val = p->mn + rel * (p->mx - p->mn) / (w - 14);
    ShellApply();
}

static LRESULT CALLBACK ShellProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    switch (m) {
    case WM_ERASEBKGND: return 1;

    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC dc = BeginPaint(h, &ps);
        PaintShell(h, dc);
        EndPaint(h, &ps);
        return 0;
    }

    case WM_UPDATE:
        InvalidateRect(h, NULL, FALSE);
        return 0;

    case WM_LBUTTONDOWN:
    case WM_RBUTTONDOWN: {
        int x = (int)(GET_X_LPARAM(l) / g_ds), y = (int)(GET_Y_LPARAM(l) / g_ds);
        int cx, cy;
        if (PixelCell(x, y, &cx, &cy)) {
            uint32_t c = g_ch.color | 0xFF000000;
            g_erase = (m == WM_RBUTTONDOWN) || (g_tool == T_ERASE);
            if (g_erase) c = 0;
            PushUndo();
            SetCapture(h);
            g_drawing = 1;
            g_sx = g_cx = cx; g_sy = g_cy = cy;
            g_shape = (!g_erase && (g_tool == T_LINE || g_tool == T_RECT || g_tool == T_CIRC));
            if (!g_shape) {
                if (!g_erase && g_tool == T_FILL) { PFlood(cx, cy, c); g_drawing = 0; ReleaseCapture(); ApplyAndSave(); }
                else { Put(cx, cy, c); g_lx = cx; g_ly = cy; ShellApply(); }
            }
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
            if (y < TITLEH) { ReleaseCapture(); SendMessageW(h, WM_NCLBUTTONDOWN, HTCAPTION, 0); return 0; }
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
            if (PixelCell(x, y, &cx, &cy)) {
                if (g_shape) { g_cx = cx; g_cy = cy; InvalidateRect(h, NULL, FALSE); }
                else {
                    uint32_t c = g_erase ? 0 : (g_ch.color | 0xFF000000);
                    PLine(g_lx, g_ly, cx, cy, c);
                    g_lx = cx; g_ly = cy;
                    ShellApply();
                }
            }
            return 0;
        }
        int i = HitWidget(x, y);
        if (i != g_hover) { g_hover = i; InvalidateRect(h, NULL, FALSE); }
        return 0;
    }

    case WM_LBUTTONUP:
    case WM_RBUTTONUP:
        if (g_dragSlider >= 0) { g_dragSlider = -1; ReleaseCapture(); CfgSave(); return 0; }
        if (g_drawing) {
            if (g_shape && g_cx >= 0) {
                uint32_t c = g_ch.color | 0xFF000000;
                if (g_tool == T_LINE) PLine(g_sx, g_sy, g_cx, g_cy, c);
                else if (g_tool == T_RECT) PRect(g_sx, g_sy, g_cx, g_cy, c);
                else PEllipse(g_sx, g_sy, g_cx, g_cy, c);
            }
            g_drawing = g_shape = 0;
            ReleaseCapture();
            ApplyAndSave();
        }
        return 0;

    case WM_KEYDOWN:
        if (w == 'Z' && (GetKeyState(VK_CONTROL) & 0x8000)) { PopUndo(); ApplyAndSave(); }
        else if (w == VK_ESCAPE) ShellShow(FALSE);
        return 0;

    case WM_CLOSE:
        AppExit();
        return 0;
    }
    return DefWindowProcW(h, m, w, l);
}

// ------------------------------------------------------------------ api
BOOL ShellCreate(void)
{
    WNDCLASSEXW wc;
    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = ShellProc;
    wc.hInstance = g_inst;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.lpszClassName = APP_CLASS;
    RegisterClassExW(&wc);

    int sw = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
    {
        HDC sdc = GetDC(NULL);
        int dpi = GetDeviceCaps(sdc, LOGPIXELSX);
        ReleaseDC(NULL, sdc);
        if (dpi > 96) g_ds = (float)dpi / 96.0f;
        if (g_ds > 2.0f) g_ds = 2.0f;
    }
    int pw = (int)(WINW * g_ds), ph = (int)(WINH * g_ds);
    if (ph > sh - 60 || pw > sw - 40) {
        float fy = (float)(sh - 60) / WINH, fx = (float)(sw - 40) / WINW;
        g_ds = fx < fy ? fx : fy;
        pw = (int)(WINW * g_ds); ph = (int)(WINH * g_ds);
    }
    g_xf.eM11 = g_ds; g_xf.eM12 = 0.0f; g_xf.eM21 = 0.0f;
    g_xf.eM22 = g_ds; g_xf.eDx = 0.0f;  g_xf.eDy = 0.0f;

    g_hwnd = CreateWindowExW(WS_EX_APPWINDOW, APP_CLASS, APP_NAME,
        WS_POPUP | WS_MINIMIZEBOX, (sw - pw) / 2, (sh - ph) / 2, pw, ph,
        NULL, NULL, g_inst, NULL);
    if (!g_hwnd) return FALSE;
    SetWindowRgn(g_hwnd, CreateRoundRectRgn(0, 0, pw + 1, ph + 1, 16, 16), TRUE);

    g_f   = CreateFontW(15, 0, 0, 0, FW_NORMAL,   0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fb  = CreateFontW(15, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fs  = CreateFontW(13, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fh  = CreateFontW(19, 0, 0, 0, FW_BOLD,     0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fxl = CreateFontW(28, 0, 0, 0, FW_LIGHT,    0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    return TRUE;
}

void ShellShow(BOOL show)
{
    if (!g_hwnd) return;
    if (show) {
        ShowWindow(g_hwnd, SW_SHOW);
        SetForegroundWindow(g_hwnd);
        InvalidateRect(g_hwnd, NULL, FALSE);
    } else ShowWindow(g_hwnd, SW_HIDE);
}

BOOL ShellVisible(void) { return g_hwnd && IsWindowVisible(g_hwnd); }

void ShellToggle(void)
{
    if (ShellVisible() && !IsIconic(g_hwnd)) { ShellShow(FALSE); TrayShow(FALSE); }
    else { TrayShow(TRUE); ShellShow(TRUE); }
}

void ShellStatus(const wchar_t* s)
{
    wcsncpy(g_status, s, 159);
    g_status[159] = 0;
    if (ShellVisible()) InvalidateRect(g_hwnd, NULL, FALSE);
}

void ShellRedraw(void) { if (g_hwnd) InvalidateRect(g_hwnd, NULL, FALSE); }

HWND ShellHwnd(void) { return g_hwnd; }
