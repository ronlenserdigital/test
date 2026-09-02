#include "app.h"
#include "icons.h"
#include <commdlg.h>
#include <windowsx.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <wchar.h>
#include <wctype.h>
#include <algorithm>
using std::min;
using std::max;

// ------------------------------------------------------------------ metrics
#define WINW   1400
#define WINH    840
#define SIDEW   250
#define HEADH    88
#define PAD      24
#define RPW     420
#define RPX     (WINW - PAD - RPW)
#define PVX     (SIDEW + PAD)
#define PVY     (HEADH + 12)
#define PVW     (RPX - PAD - PVX)
#define PVH     540
#define HALF    ((RPW - 20) / 2)

// ------------------------------------------------------------------ palette
#define C_BG      RGB(0x07,0x09,0x0D)
#define C_PANEL   RGB(0x0D,0x11,0x17)
#define C_RAISED  RGB(0x14,0x19,0x21)
#define C_HOVER   RGB(0x1B,0x21,0x2B)
#define C_BORDER  RGB(0x1F,0x26,0x31)
#define C_TXT     RGB(0xF2,0xF5,0xF9)
#define C_TXT2    RGB(0x7E,0x8A,0x9B)
#define C_DANGER  RGB(0xFF,0x4D,0x67)

static const COLORREF kAccents[6] = {
    RGB(0x00,0xF5,0xA0), RGB(0x20,0xC8,0xFF), RGB(0xB1,0x4D,0xFF),
    RGB(0xFF,0x8A,0x1F), RGB(0xFF,0x4D,0x67), RGB(0xF2,0xF5,0xF9)
};
static const wchar_t* kAccentName[6] = { L"Venom", L"Ice", L"Ultra", L"Ember", L"Blood", L"Bone" };
static COLORREF Acc(void)    { return kAccents[g_set.accent % 6]; }
static COLORREF AccDim(void) { COLORREF a = Acc(); return RGB(GetRValue(a)/6, GetGValue(a)/5, GetBValue(a)/5); }

enum { SC_HOME, SC_STUDIO, SC_PRESETS, SC_PROFILES, SC_THEMES, SC_SETTINGS };
enum { TAB_BASIC, TAB_SHAPE, TAB_FX, TAB_ADV };
enum { WK_BTN, WK_TOGGLE, WK_SLIDER, WK_SWATCH, WK_NAV, WK_TAB, WK_TEXT,
       WK_HEAD, WK_CARD, WK_ROW, WK_CHIP };
enum { V_GHOST, V_ACCENT, V_CHIP, V_DANGER };

enum {
    ID_NAV = 100, ID_TAB = 110, ID_STYLE = 120,
    ID_SWATCH = 200, ID_CUSTOMCOL = 220, ID_OUTLINECOL,
    ID_LEN = 230, ID_THICK, ID_GAP, ID_OPACITY, ID_DOTSIZE, ID_OFFX, ID_OFFY,
    ID_IMGSCALE, ID_PXSCALE, ID_GLOW, ID_OUTW,
    ID_CENTERDOT = 250, ID_OUTLINE, ID_ONLYGAME,
    ID_IMGLOAD = 260, ID_IMGCLEAR, ID_IMGUSE,
    ID_TOOL = 270, ID_GRIDSZ = 290, ID_PXCLEAR = 295, ID_PXUNDO, ID_PXUSE,
    ID_PRESET = 300, ID_LIB = 320, ID_LIBSAVE = 340, ID_APPLY,
    ID_PROF = 350, ID_PROFAUTO = 380, ID_PROFDEL = 400, ID_PROFADD = 420,
    ID_SET = 450, ID_UPDCHECK = 460, ID_UPDINSTALL,
    ID_ZOOM = 480, ID_ACCENT = 490,
    ID_MIN = 500, ID_HIDE, ID_CLOSE, ID_TOGGLEOVL, ID_PROFCHIP, ID_HOTKEYCHIP
};
enum { T_PEN, T_ERASE, T_FILL, T_LINE, T_RECT, T_CIRC, T_MIRX, T_MIRY };

static const wchar_t* kStyleName[5] = { L"Cross", L"Dot", L"T-Shape", L"Circle", L"Chevron" };
static const wchar_t* kToolName[8]  = { L"Pen", L"Erase", L"Fill", L"Line", L"Rect", L"Ring", L"Mir X", L"Mir Y" };
static const wchar_t* kPresetSub[8] = { L"Default", L"Minimal", L"Clean", L"Balanced",
                                        L"Framed", L"Dynamic", L"Aggressive", L"Long range" };

static const uint32_t kPalette[8] = {
    0xFF00F5A0, 0xFF20C8FF, 0xFF3B6BFF, 0xFFB14DFF,
    0xFFFF6B5B, 0xFFFFC93C, 0xFFFFFFFF, 0xFF8A94A3
};

struct W {
    int      id, kind, variant, active, icon;
    RECT     r;
    wchar_t  text[72], sub[72];
    int*     val;
    int      mn, mx;
    uint32_t col;
};

static HWND    g_hwnd = NULL;
static float   g_ds = 1.0f;
static XFORM   g_xf;
static W       g_w[340];
static int     g_nw = 0;
static int     g_screen = SC_HOME, g_tab = TAB_BASIC;
static int     g_hover = -1, g_dragSlider = -1;
static HFONT   g_f, g_fb, g_fh, g_fs, g_fxs, g_fxl;
static wchar_t g_status[120] = L"Waiting for a game";
static COLORREF g_custom[16];

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

static void Dot(HDC dc, int x, int y, int r, COLORREF c)
{
    HBRUSH b = CreateSolidBrush(c);
    HPEN   p = CreatePen(PS_SOLID, 1, c);
    HGDIOBJ ob = SelectObject(dc, b), op = SelectObject(dc, p);
    Ellipse(dc, x - r, y - r, x + r, y + r);
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
    if (g_nw >= 340) return &g_w[339];
    W* p = &g_w[g_nw++];
    ZeroMemory(p, sizeof(*p));
    p->id = id; p->kind = kind;
    SetRect(&p->r, x, y, x + w, y + h);
    if (t) { wcsncpy(p->text, t, 71); p->text[71] = 0; }
    return p;
}

static W* Ic(W* p, int icon) { p->icon = icon; return p; }

static void Head(int x, int* y, int w, const wchar_t* t, int icon)
{
    Add(0, WK_HEAD, x, *y, w, 15, t)->icon = icon;
    *y += 24;
}

static W* Slider(int id, int x, int y, int w, const wchar_t* t, int* v, int mn, int mx,
                 const wchar_t* unit, int icon)
{
    W* p = Add(id, WK_SLIDER, x, y, w, 46, t);
    p->val = v; p->mn = mn; p->mx = mx; p->icon = icon;
    if (unit) { wcsncpy(p->sub, unit, 71); p->sub[71] = 0; }
    return p;
}

static W* Toggle(int id, int x, int* y, int w, const wchar_t* t, int* v, int icon)
{
    W* p = Add(id, WK_TOGGLE, x, *y, w, 30, t);
    p->val = v; p->icon = icon;
    *y += 34;
    return p;
}

// ------------------------------------------------------------------ state ops
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
    for (int i = 0; i < MAXGRID * MAXGRID; i++)
        if (g_ch.px[i] & 0xFF000000)
            g_ch.px[i] = (g_ch.px[i] & 0xFF000000) | (c & 0x00FFFFFF);
    ApplyAndSave();
}

// ------------------------------------------------------------------ layout
static RECT CanvasRect(void)      // the live area inside the preview card
{
    RECT r; SetRect(&r, PVX + 1, PVY + 52, PVX + PVW - 1, PVY + PVH - 52);
    return r;
}

static int PxCellFor(RECT r)
{
    int a = (r.right - r.left - 40) / g_ch.gridW;
    int b = (r.bottom - r.top - 40) / g_ch.gridH;
    int c = a < b ? a : b;
    return c < 2 ? 2 : c;
}

static void LayoutChrome(void)
{
    Ic(Add(ID_MIN,   WK_BTN, WINW - 150, 26, 36, 36, L""), IC_MIN)->variant = V_CHIP;
    Ic(Add(ID_HIDE,  WK_BTN, WINW - 108, 26, 36, 36, L""), IC_MAX)->variant = V_CHIP;
    Ic(Add(ID_CLOSE, WK_BTN, WINW -  66, 26, 36, 36, L""), IC_CLOSE)->variant = V_CHIP;

    W* p = Add(ID_PROFCHIP, WK_CHIP, PVX, 18, 220, 52, L"Current Profile");
    wcsncpy(p->sub, g_activeLabel, 71); p->sub[71] = 0;
    p->icon = IC_SHIELD;

    int rw = 0, rh = 0; OverlayResolution(&rw, &rh);
    wchar_t res[40]; _snwprintf(res, 40, L"%d \x00D7 %d", rw, rh); res[39] = 0;
    W* q = Add(0, WK_CHIP, PVX + 232, 18, 190, 52, L"Resolution");
    wcsncpy(q->sub, res, 71); q->sub[71] = 0;
    q->icon = IC_MONITOR;

    W* k = Add(ID_HOTKEYCHIP, WK_CHIP, PVX + 434, 18, 190, 52, L"Overlay Hotkey");
    wcscpy(k->sub, L"F12");
    k->icon = IC_KEY;

    static const wchar_t* nm[6] = { L"Home", L"Studio", L"Presets", L"Game Profiles", L"Themes", L"Settings" };
    static const int nic[6] = { IC_HOME, IC_STUDIO, IC_PRESETS, IC_GAMEPAD, IC_THEME, IC_GEAR };
    int y = 110;
    for (int i = 0; i < 6; i++) {
        W* n = Add(ID_NAV + i, WK_NAV, 16, y, SIDEW - 32, 48, nm[i]);
        n->active = (g_screen == i);
        n->icon = nic[i];
        y += 54;
    }

    // status card - the overlay switch and the in-game rule live here
    int cy = WINH - 306;
    int ty = cy + 144;
    Toggle(ID_ONLYGAME, 36, &ty, SIDEW - 60, L"Only in game", &g_set.onlyInGame, IC_EYE);
    W* d = Add(ID_TOGGLEOVL, WK_BTN, 40, cy + 214, SIDEW - 80, 40,
               g_set.overlayOn ? L"DISABLE" : L"ENABLE");
    d->variant = g_set.overlayOn ? V_GHOST : V_ACCENT;
    d->icon = IC_POWER;
}

static void LayoutPreviewCard(void)
{
    static const wchar_t* zn[3] = { L"100%", L"200%", L"400%" };
    static const int zv[3] = { 1, 2, 4 };
    for (int i = 0; i < 3; i++) {
        W* p = Add(ID_ZOOM + i, WK_BTN, PVX + PVW - 24 - (3 - i) * 78, PVY + 14, 72, 30, zn[i]);
        p->variant = V_CHIP;
        p->active = (g_set.previewZoom == zv[i]);
    }
}

static void LayoutBasic(int y)
{
    Head(RPX, &y, RPW, L"COLOR", IC_PALETTE);
    for (int i = 0; i < 8; i++) {
        W* p = Add(ID_SWATCH + i, WK_SWATCH, RPX + i * 44, y, 38, 38, NULL);
        p->col = kPalette[i];
        p->active = ((g_ch.color & 0x00FFFFFF) == (kPalette[i] & 0x00FFFFFF));
    }
    Ic(Add(ID_CUSTOMCOL, WK_BTN, RPX + 8 * 44, y, 38, 38, L""), IC_PLUS)->variant = V_CHIP;
    y += 56;

    Slider(ID_OPACITY, RPX, y, RPW, L"OPACITY", &g_ch.opacity, 10, 255, L"", IC_DROP);
    y += 58;

    Slider(ID_THICK, RPX, y, HALF, L"THICKNESS", &g_ch.thickness, 1, 12, L"px", IC_THICK);
    Slider(ID_OUTW,  RPX + HALF + 20, y, HALF, L"OUTLINE", &g_ch.outline, 0, 1, L"", IC_OUTLINE);
    y += 58;
    Slider(ID_LEN,     RPX, y, HALF, L"LENGTH", &g_ch.length, 0, 60, L"px", IC_LENGTH);
    Slider(ID_DOTSIZE, RPX + HALF + 20, y, HALF, L"CENTER DOT", &g_ch.dotSize, 1, 12, L"px", IC_DOT);
    y += 58;
    Slider(ID_GAP,  RPX, y, HALF, L"GAP", &g_ch.gap, 0, 40, L"px", IC_GAP);
    Slider(ID_GLOW, RPX + HALF + 20, y, HALF, L"BLOOM / GLOW", &g_ch.glow, 0, 100, L"%", IC_GLOW);
    y += 66;

    Head(RPX, &y, RPW, L"OFFSET", IC_CROSSHAIR);
    Slider(ID_OFFX, RPX, y, RPW - 130, L"HORIZONTAL", &g_ch.offsetX, -60, 60, L"px", IC_ARROWX);
    y += 56;
    Slider(ID_OFFY, RPX, y, RPW - 130, L"VERTICAL", &g_ch.offsetY, -60, 60, L"px", IC_ARROWY);
}

static void LayoutShape(int y)
{
    static const int sic[5] = { IC_CROSSHAIR, IC_DOT, IC_SHAPE, IC_RING, IC_ARROWY };
    Head(RPX, &y, RPW, L"STYLE", IC_SHAPE);
    for (int i = 0; i < 5; i++) {
        W* p = Add(ID_STYLE + i, WK_BTN, RPX + (i % 3) * 140, y + (i / 3) * 44, 132, 36, kStyleName[i]);
        p->variant = V_CHIP;
        p->active = (g_ch.style == i);
        p->icon = sic[i];
    }
    y += 100;
    Slider(ID_LEN,   RPX, y, HALF, L"LENGTH", &g_ch.length, 0, 60, L"px", IC_LENGTH);
    Slider(ID_THICK, RPX + HALF + 20, y, HALF, L"THICKNESS", &g_ch.thickness, 1, 12, L"px", IC_THICK);
    y += 58;
    Slider(ID_GAP,     RPX, y, HALF, L"GAP", &g_ch.gap, 0, 40, L"px", IC_GAP);
    Slider(ID_DOTSIZE, RPX + HALF + 20, y, HALF, L"DOT SIZE", &g_ch.dotSize, 1, 12, L"px", IC_DOT);
    y += 66;
    Toggle(ID_CENTERDOT, RPX, &y, RPW, L"Center dot", &g_ch.centerDot, IC_DOT);
    Toggle(ID_OUTLINE,   RPX, &y, RPW, L"Outline",    &g_ch.outline, IC_OUTLINE);
}

static void LayoutFx(int y)
{
    Head(RPX, &y, RPW, L"GLOW", IC_SPARK);
    Slider(ID_GLOW, RPX, y, RPW, L"BLOOM / GLOW", &g_ch.glow, 0, 100, L"%", IC_GLOW);
    y += 62;
    Head(RPX, &y, RPW, L"OUTLINE", IC_OUTLINE);
    Toggle(ID_OUTLINE, RPX, &y, RPW, L"Draw outline", &g_ch.outline, IC_OUTLINE);
    Ic(Add(ID_OUTLINECOL, WK_BTN, RPX, y, RPW, 36, L"OUTLINE COLOR"), IC_PALETTE)->variant = V_GHOST;
    y += 52;
    Head(RPX, &y, RPW, L"VISIBILITY", IC_EYE);
    Slider(ID_OPACITY, RPX, y, RPW, L"OPACITY", &g_ch.opacity, 10, 255, L"", IC_DROP);
}

static void LayoutAdv(int y)
{
    Head(RPX, &y, RPW, L"CUSTOM IMAGE", IC_IMAGE);
    Ic(Add(ID_IMGLOAD,  WK_BTN, RPX, y, RPW - 110, 36, L"UPLOAD IMAGE"), IC_UPLOAD)->variant = V_GHOST;
    Ic(Add(ID_IMGCLEAR, WK_BTN, RPX + RPW - 100, y, 100, 36, L"REMOVE"), IC_TRASH)->variant = V_GHOST;
    y += 44;
    {
        const wchar_t* n = g_ch.image[0] ? wcsrchr(g_ch.image, L'\\') : NULL;
        wchar_t t[72];
        _snwprintf(t, 72, L"%s", g_ch.image[0] ? (n ? n + 1 : g_ch.image) : L"No image loaded");
        t[71] = 0;
        Add(0, WK_TEXT, RPX, y, RPW, 18, t);
        y += 26;
    }
    W* u = Add(ID_IMGUSE, WK_BTN, RPX, y, RPW, 36, L"USE IMAGE AS CROSSHAIR");
    u->variant = (g_ch.style == ST_IMAGE) ? V_ACCENT : V_GHOST;
    u->icon = IC_IMAGE;
    y += 44;
    Slider(ID_IMGSCALE, RPX, y, RPW, L"IMAGE SIZE", &g_ch.imageScale, 10, 400, L"%", IC_IMAGE);
    y += 64;
    Head(RPX, &y, RPW, L"PIXEL ART", IC_GRID);
    W* p = Add(ID_PXUSE, WK_BTN, RPX, y, RPW, 36, L"USE PIXEL ART (edit it in Studio)");
    p->variant = (g_ch.style == ST_PIXEL) ? V_ACCENT : V_GHOST;
    p->icon = IC_GRID;
    y += 44;
    Slider(ID_PXSCALE, RPX, y, RPW, L"PIXEL SIZE", &g_ch.pxScale, 1, 10, L"px", IC_GRID);
}

static void LayoutRightPanel(void)
{
    static const wchar_t* tabs[4] = { L"Basic", L"Shape", L"Effects", L"Advanced" };
    static const int tic[4] = { IC_SLIDERS, IC_SHAPE, IC_SPARK, IC_WRENCH };
    for (int i = 0; i < 4; i++) {
        W* p = Add(ID_TAB + i, WK_TAB, RPX + i * 105, PVY, 105, 38, tabs[i]);
        p->active = (g_tab == i);
        p->icon = tic[i];
    }
    int y = PVY + 62;
    if      (g_tab == TAB_BASIC) LayoutBasic(y);
    else if (g_tab == TAB_SHAPE) LayoutShape(y);
    else if (g_tab == TAB_FX)    LayoutFx(y);
    else                         LayoutAdv(y);

    Ic(Add(ID_APPLY,   WK_BTN, RPX, WINH - 78, RPW - 176, 48, L"APPLY CHANGES"), IC_CHECK)->variant = V_ACCENT;
    Ic(Add(ID_LIBSAVE, WK_BTN, RPX + RPW - 166, WINH - 78, 166, 48, L"SAVE PRESET"), IC_SAVE)->variant = V_GHOST;
}

static void LayoutPresetStrip(void)
{
    int n = ChPresetCount();
    for (int i = 0; i < n && i < 6; i++) {
        W* p = Add(ID_PRESET + i, WK_CARD, PVX + 16 + i * 132, PVY + PVH + 62, 122, 120, ChPresetName(i));
        wcsncpy(p->sub, kPresetSub[i], 71); p->sub[71] = 0;
    }
    W* np = Add(ID_LIBSAVE, WK_CARD, PVX + 16 + 6 * 132, PVY + PVH + 62, 122, 120, L"New Preset");
    np->variant = V_CHIP;
}

static void LayoutStudio(void)
{
    int y = PVY + 20;
    static const int tic[8] = { IC_PEN, IC_ERASER, IC_FILL, IC_LINE, IC_RECT, IC_RING, IC_MIRX, IC_MIRY };
    Head(RPX, &y, RPW, L"TOOLS", IC_PEN);
    for (int i = 0; i < 8; i++) {
        W* p = Add(ID_TOOL + i, WK_BTN, RPX + (i % 4) * 106, y + (i / 4) * 44, 98, 36, kToolName[i]);
        p->variant = V_CHIP;
        p->active = (i == T_MIRX) ? g_mirX : (i == T_MIRY) ? g_mirY : (g_tool == i);
        p->icon = tic[i];
    }
    y += 100;
    Head(RPX, &y, RPW, L"COLOR", IC_PALETTE);
    for (int i = 0; i < 8; i++) {
        W* p = Add(ID_SWATCH + i, WK_SWATCH, RPX + i * 44, y, 38, 38, NULL);
        p->col = kPalette[i];
        p->active = ((g_ch.color & 0x00FFFFFF) == (kPalette[i] & 0x00FFFFFF));
    }
    Ic(Add(ID_CUSTOMCOL, WK_BTN, RPX + 8 * 44, y, 38, 38, L""), IC_PLUS)->variant = V_CHIP;
    y += 58;
    Head(RPX, &y, RPW, L"CANVAS", IC_GRID);
    static const int gs[4] = { 16, 24, 32, 48 };
    for (int i = 0; i < 4; i++) {
        wchar_t t[16]; _snwprintf(t, 16, L"%d\x00D7%d", gs[i], gs[i]); t[15] = 0;
        W* p = Add(ID_GRIDSZ + i, WK_BTN, RPX + i * 106, y, 98, 36, t);
        p->variant = V_CHIP;
        p->active = (g_ch.gridW == gs[i]);
    }
    y += 46;
    Slider(ID_PXSCALE, RPX, y, RPW, L"PIXEL SIZE", &g_ch.pxScale, 1, 10, L"px", IC_GRID);
    y += 60;
    Ic(Add(ID_PXUNDO,  WK_BTN, RPX, y, HALF, 36, L"UNDO"), IC_UNDO)->variant = V_GHOST;
    Ic(Add(ID_PXCLEAR, WK_BTN, RPX + HALF + 20, y, HALF, 36, L"CLEAR"), IC_TRASH)->variant = V_GHOST;
    W* u = Add(ID_PXUSE, WK_BTN, RPX, WINH - 78, RPW, 48, L"USE PIXEL ART AS CROSSHAIR");
    u->variant = (g_ch.style == ST_PIXEL) ? V_ACCENT : V_GHOST;
    u->icon = IC_CHECK;
}

static void LayoutPresetsScreen(void)
{
    int n = ChPresetCount();
    for (int i = 0; i < n; i++) {
        W* p = Add(ID_PRESET + i, WK_CARD, PVX + (i % 6) * 152, PVY + 40 + (i / 6) * 170, 140, 150, ChPresetName(i));
        wcsncpy(p->sub, kPresetSub[i], 71); p->sub[71] = 0;
    }
    for (int i = 0; i < MAXLIB; i++) {
        if (!g_libUsed[i]) continue;
        W* p = Add(ID_LIB + i, WK_CARD, PVX + (i % 6) * 152, PVY + 260 + (i / 6) * 170, 140, 150, g_lib[i].name);
        wcscpy(p->sub, L"Saved");
    }
}

static void LayoutProfiles(void)
{
    int x = PVX, w = WINW - x - PAD;
    int y = PVY + 46;
    for (int i = 0; i < g_nprof; i++) {
        W* row = Add(ID_PROF + i, WK_ROW, x, y, w, 78, g_prof[i].label);
        wchar_t s[72];
        _snwprintf(s, 72, L"%s  \x2022  %s  \x2022  %d\x00D7%d", g_prof[i].exe,
                   g_prof[i].ch.name[0] ? g_prof[i].ch.name : L"Custom",
                   g_prof[i].lastW, g_prof[i].lastH);
        s[71] = 0;
        wcsncpy(row->sub, s, 71);
        row->active = (i == g_activeProfile);
        W* t = Add(ID_PROFAUTO + i, WK_TOGGLE, x + w - 260, y + 24, 170, 30, L"Auto-switch");
        t->val = &g_prof[i].autoLaunch;
        t->icon = IC_REFRESH;
        Ic(Add(ID_PROFDEL + i, WK_BTN, x + w - 84, y + 24, 72, 32, L""), IC_TRASH)->variant = V_DANGER;
        y += 86;
    }
    if (g_nprof < MAXPROFILE) {
        wchar_t t[72];
        _snwprintf(t, 72, g_lastGame[0] ? L"ADD %s" : L"NO GAME DETECTED YET", g_lastGame);
        t[71] = 0;
        W* b = Add(ID_PROFADD, WK_BTN, x, y + 10, 360, 44, t);
        b->variant = g_lastGame[0] ? V_ACCENT : V_GHOST;
        b->icon = IC_PLUS;
    }
}

static void LayoutThemes(void)
{
    int y = PVY + 46;
    for (int i = 0; i < 6; i++) {
        W* p = Add(ID_ACCENT + i, WK_CARD, PVX + i * 152, y, 140, 120, kAccentName[i]);
        p->col = 0xFF000000 | ((uint32_t)GetRValue(kAccents[i]) << 16) |
                 ((uint32_t)GetGValue(kAccents[i]) << 8) | GetBValue(kAccents[i]);
        p->active = (g_set.accent == i);
        p->variant = V_CHIP;
    }
}

static void LayoutSettings(void)
{
    int x = PVX, w = 460;
    int y = PVY + 30;
    Head(x, &y, w, L"OVERLAY", IC_CROSSHAIR);
    Toggle(ID_SET + 0, x, &y, w, L"Overlay enabled", &g_set.overlayOn, IC_POWER);
    Toggle(ID_SET + 1, x, &y, w, L"Only show while a game is focused", &g_set.onlyInGame, IC_EYE);
    Toggle(ID_SET + 2, x, &y, w, L"Auto-detect fullscreen games", &g_set.autoDetect, IC_GAMEPAD);
    Toggle(ID_SET + 3, x, &y, w, L"Open this window when a game starts", &g_set.autoOpenPanel, IC_HOME);
    y += 14;
    Head(x, &y, w, L"SYSTEM", IC_GEAR);
    Toggle(ID_SET + 4, x, &y, w, L"Start with Windows", &g_set.startWithWindows, IC_POWER);
    Toggle(ID_SET + 5, x, &y, w, L"Check for updates automatically", &g_set.autoUpdate, IC_REFRESH);
    y += 10;
    Ic(Add(ID_UPDCHECK, WK_BTN, x, y, 210, 38, L"CHECK FOR UPDATES"), IC_REFRESH)->variant = V_GHOST;
    if (UpdateAvailable())
        Ic(Add(ID_UPDINSTALL, WK_BTN, x + 224, y, 236, 38, L"DOWNLOAD & INSTALL"), IC_DOWNLOAD)->variant = V_ACCENT;
    y += 50;
    Add(0, WK_TEXT, x, y, w, 18, UpdateStatusText());
    y += 30;
    wchar_t v[64]; _snwprintf(v, 64, L"%s  v%s", APP_NAME, APP_VER); v[63] = 0;
    Add(0, WK_TEXT, x, y, w, 18, v);
    Add(0, WK_TEXT, x, y + 22, w, 18, L"F12 hides or brings back this window from anywhere.");
}

static void Layout(void)
{
    g_nw = 0;
    LayoutChrome();
    switch (g_screen) {
    case SC_HOME:     LayoutPreviewCard(); LayoutRightPanel(); LayoutPresetStrip(); break;
    case SC_STUDIO:   LayoutStudio(); break;
    case SC_PRESETS:  LayoutPresetsScreen(); break;
    case SC_PROFILES: LayoutProfiles(); break;
    case SC_THEMES:   LayoutThemes(); break;
    default:          LayoutSettings(); break;
    }
}

// ------------------------------------------------------------------ preview
// the preview is the crosshair and nothing else - a flat, neutral field
static void PreviewBg(uint32_t* b, int w, int h)
{
    for (int y = 0; y < h; y++) {
        double t = (double)y / (h ? h : 1);
        uint32_t row = 0xFF000000 |
            ((uint32_t)Clamp(10 + (int)(t * 5), 0, 255) << 16) |
            ((uint32_t)Clamp(13 + (int)(t * 6), 0, 255) << 8) |
             (uint32_t)Clamp(18 + (int)(t * 8), 0, 255);
        for (int x = 0; x < w; x++) b[y * w + x] = row;
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

static void PaintPreviewDev(HDC dc, RECT dev)
{
    int w = dev.right - dev.left, h = dev.bottom - dev.top;
    if (w < 8 || h < 8) return;
    uint32_t* buf = (uint32_t*)malloc((size_t)w * h * 4);
    if (!buf) return;
    PreviewBg(buf, w, h);

    int mcx = w / 2, mcy = h / 2;
    uint32_t guide = 0x22FFFFFF;
    for (int x = 0; x < w; x += 2) Blend(&buf[mcy * w + x], guide);
    for (int y = 0; y < h; y += 2) Blend(&buf[y * w + mcx], guide);

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
    PaintPreviewDev(dc, ToDev(logical));
    if (g_ds != 1.0f) { SetGraphicsMode(dc, GM_ADVANCED); SetWorldTransform(dc, &g_xf); }
}

static void PaintThumb(HDC dc, RECT r, const Crosshair* c, int lift)
{
    ChBitmap cb;
    Crosshair t = *c;
    if (!ChBuild(&t, &cb)) return;
    int box = (r.right - r.left) - 30;
    int scale = 1;
    while (cb.w * (scale + 1) <= box && scale < 3) scale++;
    int cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2 - lift;
    for (int y = 0; y < cb.h; y++)
        for (int x = 0; x < cb.w; x++) {
            uint32_t p = cb.px[y * cb.w + x];
            if (((p >> 24) & 0xFF) < 40) continue;
            int dx = cx + (x - cb.ax) * scale, dy = cy + (y - cb.ay) * scale;
            if (dx < r.left + 8 || dx > r.right - 8 - scale || dy < r.top + 8 || dy > r.bottom - 30) continue;
            RECT q; SetRect(&q, dx, dy, dx + scale, dy + scale);
            Fill(dc, q, ToRef(p));
        }
    ChFree(&cb);
}

// ------------------------------------------------------------------ widgets
static void PaintWidget(HDC dc, W* p, int hover)
{
    switch (p->kind) {
    case WK_HEAD: {
        RECT t = p->r;
        if (p->icon) {
            Icon(dc, p->icon, p->r.left + 7, (p->r.top + p->r.bottom) / 2, 7, C_TXT2);
            t.left += 20;
        }
        Txt(dc, t, p->text, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
        break;
    }
    case WK_TEXT:
        Txt(dc, p->r, p->text, C_TXT2, g_f, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
        break;

    case WK_CHIP: {
        Card(dc, p->r, C_PANEL, hover ? Acc() : C_BORDER, 12);
        int mid = (p->r.top + p->r.bottom) / 2;
        RECT l = p->r; l.left += (p->icon ? 52 : 16); l.top += 8; l.bottom = l.top + 16;
        Txt(dc, l, p->text, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
        RECT v = p->r; v.left = l.left; v.top = p->r.top + 24; v.bottom = v.top + 20;
        Txt(dc, v, p->sub, C_TXT, g_fb, DT_LEFT | DT_VCENTER);
        if (p->icon) {
            Dot(dc, p->r.left + 30, mid, 15, C_RAISED);
            Icon(dc, p->icon, p->r.left + 30, mid, 8, Acc());
        }
        break;
    }

    case WK_NAV: {
        if (p->active) {
            Card(dc, p->r, C_RAISED, C_BORDER, 12);
            RECT bar; SetRect(&bar, p->r.right - 4, p->r.top + 12, p->r.right - 1, p->r.bottom - 12);
            Fill(dc, bar, Acc());
        } else if (hover) Card(dc, p->r, C_PANEL, C_PANEL, 12);
        Icon(dc, p->icon, p->r.left + 24, (p->r.top + p->r.bottom) / 2, 9,
             p->active ? Acc() : C_TXT2);
        RECT t = p->r; t.left += 46;
        Txt(dc, t, p->text, p->active ? C_TXT : C_TXT2, p->active ? g_fb : g_f, DT_LEFT | DT_VCENTER);
        break;
    }

    case WK_TAB: {
        COLORREF c = p->active ? C_TXT : C_TXT2;
        Icon(dc, p->icon, p->r.left + 20, (p->r.top + p->r.bottom) / 2 - 1, 8, p->active ? Acc() : c);
        RECT t = p->r; t.left += 36;
        Txt(dc, t, p->text, c, p->active ? g_fb : g_f, DT_LEFT | DT_VCENTER);
        RECT u; SetRect(&u, p->r.left + 10, p->r.bottom - 2, p->r.right - 10, p->r.bottom);
        Fill(dc, u, p->active ? Acc() : C_BORDER);
        break;
    }

    case WK_BTN: {
        COLORREF fill = C_RAISED, bd = C_BORDER, tc = C_TXT;
        if (p->variant == V_ACCENT)      { fill = Acc();    bd = Acc();    tc = RGB(3, 12, 9); }
        else if (p->variant == V_DANGER) { fill = C_PANEL;  bd = C_DANGER; tc = C_DANGER; }
        else if (p->active)              { fill = AccDim(); bd = Acc();    tc = Acc(); }
        else if (hover)                  { fill = C_HOVER; }
        Card(dc, p->r, fill, bd, 10);
        int mid = (p->r.top + p->r.bottom) / 2;
        if (p->icon && !p->text[0]) {
            Icon(dc, p->icon, (p->r.left + p->r.right) / 2, mid, 7, tc);
        } else if (p->icon) {
            Icon(dc, p->icon, p->r.left + 20, mid, 8, tc);
            RECT t = p->r; t.left += 34;
            Txt(dc, t, p->text, tc, (p->variant == V_ACCENT) ? g_fb : g_fs, DT_LEFT | DT_VCENTER);
        } else {
            Txt(dc, p->r, p->text, tc, (p->variant == V_ACCENT) ? g_fb : g_fs, DT_CENTER | DT_VCENTER);
        }
        break;
    }

    case WK_SWATCH: {
        Card(dc, p->r, ToRef(p->col), p->active ? Acc() : C_BORDER, 9);
        if (p->active) {
            RECT o = p->r; InflateRect(&o, 3, 3);
            HPEN pen = CreatePen(PS_SOLID, 2, Acc());
            HGDIOBJ op = SelectObject(dc, pen), ob = SelectObject(dc, GetStockObject(NULL_BRUSH));
            RoundRect(dc, o.left, o.top, o.right, o.bottom, 12, 12);
            SelectObject(dc, op); SelectObject(dc, ob);
            DeleteObject(pen);
        }
        break;
    }

    case WK_TOGGLE: {
        int on = p->val && *p->val;
        RECT t = p->r; t.right -= 56;
        if (p->icon) {
            Icon(dc, p->icon, p->r.left + 9, (p->r.top + p->r.bottom) / 2, 8, on ? Acc() : C_TXT2);
            t.left += 26;
        }
        Txt(dc, t, p->text, on ? C_TXT : C_TXT2, g_f, DT_LEFT | DT_VCENTER);
        RECT sw; SetRect(&sw, p->r.right - 46, p->r.top + 5, p->r.right, p->r.top + 25);
        Card(dc, sw, on ? Acc() : C_RAISED, on ? Acc() : C_BORDER, 10);
        int kx = on ? sw.right - 18 : sw.left + 2;
        RECT kn; SetRect(&kn, kx, sw.top + 2, kx + 16, sw.bottom - 2);
        Card(dc, kn, on ? RGB(4, 16, 12) : C_TXT2, on ? RGB(4, 16, 12) : C_TXT2, 8);
        break;
    }

    case WK_SLIDER: {
        int v = p->val ? *p->val : 0;
        int boxw = 62, w = (p->r.right - p->r.left) - boxw - 10;
        RECT lab; SetRect(&lab, p->r.left, p->r.top, p->r.right, p->r.top + 15);
        if (p->icon) {
            Icon(dc, p->icon, p->r.left + 6, p->r.top + 7, 6, C_TXT2);
            lab.left += 17;
        }
        Txt(dc, lab, p->text, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);

        int ty = p->r.top + 27;
        RECT tr; SetRect(&tr, p->r.left, ty, p->r.left + w, ty + 5);
        Card(dc, tr, C_RAISED, C_BORDER, 3);
        int span = p->mx - p->mn; if (span < 1) span = 1;
        int fx = (v - p->mn) * (w - 14) / span;
        RECT fr; SetRect(&fr, p->r.left, ty, p->r.left + fx + 7, ty + 5);
        Card(dc, fr, Acc(), Acc(), 3);
        RECT kn; SetRect(&kn, p->r.left + fx, ty - 5, p->r.left + fx + 14, ty + 10);
        Card(dc, kn, C_TXT, Acc(), 7);

        RECT bx; SetRect(&bx, p->r.right - boxw, p->r.top + 16, p->r.right, p->r.top + 42);
        Card(dc, bx, C_PANEL, C_BORDER, 7);
        wchar_t num[24];
        if (p->sub[0] == L'%')      _snwprintf(num, 24, L"%d%%", v * 100 / (p->mx ? p->mx : 100));
        else if (p->id == ID_OPACITY) _snwprintf(num, 24, L"%d%%", v * 100 / 255);
        else                        _snwprintf(num, 24, L"%d %s", v, p->sub);
        num[23] = 0;
        Txt(dc, bx, num, C_TXT, g_fs, DT_CENTER | DT_VCENTER);
        break;
    }

    case WK_CARD: {
        Card(dc, p->r, p->active ? C_RAISED : C_PANEL, p->active ? Acc() : C_BORDER, 12);
        RECT lab; SetRect(&lab, p->r.left, p->r.bottom - 40, p->r.right, p->r.bottom - 22);
        Txt(dc, lab, p->text, C_TXT, g_fs, DT_CENTER | DT_VCENTER);
        if (p->sub[0]) {
            RECT s2; SetRect(&s2, p->r.left, p->r.bottom - 24, p->r.right, p->r.bottom - 8);
            Txt(dc, s2, p->sub, C_TXT2, g_fxs, DT_CENTER | DT_VCENTER);
        }
        break;
    }

    case WK_ROW: {
        Card(dc, p->r, p->active ? C_RAISED : C_PANEL, p->active ? Acc() : C_BORDER, 12);
        RECT t; SetRect(&t, p->r.left + 20, p->r.top + 16, p->r.right - 280, p->r.top + 40);
        Txt(dc, t, p->text, C_TXT, g_fb, DT_LEFT | DT_VCENTER);
        SetRect(&t, p->r.left + 20, p->r.top + 42, p->r.right - 280, p->r.top + 62);
        Txt(dc, t, p->sub, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
        break;
    }
    }
}

// ------------------------------------------------------------------ screens
static void PaintPixelCanvas(HDC dc, RECT box)
{
    Card(dc, box, C_PANEL, C_BORDER, 14);
    int cs = PxCellFor(box);
    int x0 = box.left + (box.right - box.left - cs * g_ch.gridW) / 2;
    int y0 = box.top + (box.bottom - box.top - cs * g_ch.gridH) / 2;

    for (int cy = 0; cy < g_ch.gridH; cy++)
        for (int cx = 0; cx < g_ch.gridW; cx++) {
            RECT r; SetRect(&r, x0 + cx * cs, y0 + cy * cs, x0 + (cx + 1) * cs, y0 + (cy + 1) * cs);
            Fill(dc, r, ((cx ^ cy) & 1) ? RGB(0x18,0x1D,0x25) : RGB(0x12,0x16,0x1D));
            uint32_t c = g_ch.px[cy * MAXGRID + cx];
            if (c & 0xFF000000) Fill(dc, r, ToRef(c));
        }

    HPEN pen = CreatePen(PS_SOLID, 1, C_BORDER);
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
        HPEN sp = CreatePen(PS_DOT, 1, Acc());
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

static void PaintSidebar(HDC dc)
{
    RECT side; SetRect(&side, 0, 0, SIDEW, WINH);
    Fill(dc, side, C_PANEL);
    RECT sl; SetRect(&sl, SIDEW - 1, 0, SIDEW, WINH);
    Fill(dc, sl, C_BORDER);

    Dot(dc, 48, 56, 20, C_RAISED);
    Dot(dc, 48, 56, 19, C_PANEL);
    Icon(dc, IC_CROSSHAIR, 48, 56, 13, Acc());
    TxtAt(dc, 78, 40, 170, 32, APP_NAME, C_TXT, g_fh, DT_LEFT | DT_VCENTER);

    // status card
    int cy = WINH - 306;
    RECT card; SetRect(&card, 16, cy, SIDEW - 16, cy + 264);
    Card(dc, card, C_PANEL, g_set.overlayOn ? Acc() : C_BORDER, 14);

    Dot(dc, 36, cy + 22, 4, g_set.overlayOn ? Acc() : C_TXT2);
    TxtAt(dc, 48, cy + 12, 160, 20,
          g_set.overlayOn ? L"OVERLAY ACTIVE" : L"OVERLAY OFF",
          g_set.overlayOn ? Acc() : C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);

    RECT g; SetRect(&g, 28, cy + 40, SIDEW - 28, cy + 92);
    Card(dc, g, C_RAISED, C_BORDER, 10);
    RECT ic; SetRect(&ic, 38, cy + 50, 70, cy + 82);
    Card(dc, ic, AccDim(), Acc(), 8);
    wchar_t initial[4] = { g_lastGame[0] ? (wchar_t)towupper(g_lastGame[0]) : L'-', 0 };
    Txt(dc, ic, initial, Acc(), g_fb, DT_CENTER | DT_VCENTER);
    TxtAt(dc, 80, cy + 48, SIDEW - 112, 18,
          g_lastGame[0] ? g_lastGame : L"No game", C_TXT, g_fs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
    {
        wchar_t sub[64];
        int rw = 0, rh = 0; OverlayResolution(&rw, &rh);
        _snwprintf(sub, 64, L"%s \x2022 %dp", g_activeLabel, rh); sub[63] = 0;
        TxtAt(dc, 80, cy + 66, SIDEW - 112, 16, sub, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);
    }

    TxtAt(dc, 40, cy + 104, 160, 16, L"Status", C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
    Dot(dc, 44, cy + 130, 4, g_set.overlayOn ? Acc() : C_TXT2);
    TxtAt(dc, 56, cy + 122, SIDEW - 96, 16, g_status, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER | DT_END_ELLIPSIS);

    TxtAt(dc, 40, cy + 182, 120, 18, L"Toggle Hotkey", C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
    RECT hk; SetRect(&hk, SIDEW - 76, cy + 178, SIDEW - 40, cy + 202);
    Card(dc, hk, C_RAISED, C_BORDER, 7);
    Txt(dc, hk, L"F12", C_TXT, g_fs, DT_CENTER | DT_VCENTER);

    wchar_t ver[64];
    _snwprintf(ver, 64, L"v%s   \x2022   %s", APP_VER,
               UpdateAvailable() ? L"Update ready" : L"Up to date"); ver[63] = 0;
    TxtAt(dc, 24, WINH - 32, SIDEW - 40, 18, ver, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
}

static void PaintPreviewCard(HDC dc)
{
    RECT card; SetRect(&card, PVX, PVY, PVX + PVW, PVY + PVH);
    Card(dc, card, C_PANEL, C_BORDER, 16);

    Icon(dc, IC_CROSSHAIR, PVX + 28, PVY + 26, 9, Acc());
    TxtAt(dc, PVX + 44, PVY + 14, 200, 20, L"PREVIEW", C_TXT, g_fs, DT_LEFT | DT_VCENTER);
    TxtAt(dc, PVX + 44, PVY + 32, 300, 16, L"Your crosshair, actual size",
          C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);

    RECT cv = CanvasRect();
    StageBlit(dc, cv);

    int rw = 0, rh = 0; OverlayResolution(&rw, &rh);
    struct { const wchar_t* k; int v; } info[4] = {
        { L"W", rw }, { L"H", rh },
        { L"X", rw / 2 + g_ch.offsetX }, { L"Y", rh / 2 + g_ch.offsetY }
    };
    for (int i = 0; i < 4; i++) {
        RECT b; SetRect(&b, PVX + 24 + i * 96, PVY + PVH - 42, PVX + 24 + i * 96 + 88, PVY + PVH - 14);
        Card(dc, b, C_RAISED, C_BORDER, 8);
        RECT k = b; k.left += 10;
        Txt(dc, k, info[i].k, C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
        wchar_t v[16]; _snwprintf(v, 16, L"%d", info[i].v); v[15] = 0;
        RECT vv = b; vv.right -= 10;
        Txt(dc, vv, v, C_TXT, g_fs, DT_RIGHT | DT_VCENTER);
    }
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
    PaintSidebar(dc);

    Layout();

    if (g_screen == SC_HOME) {
        PaintPreviewCard(dc);
        RECT strip; SetRect(&strip, PVX, PVY + PVH + 22, PVX + PVW, WINH - PAD);
        Card(dc, strip, C_PANEL, C_BORDER, 16);
        TxtAt(dc, PVX + 20, PVY + PVH + 34, 300, 20, L"PRESET LIBRARY", C_TXT, g_fs, DT_LEFT | DT_VCENTER);
        TxtAt(dc, PVX + 20, PVY + PVH + 52, 360, 16, L"Quick select or build your own", C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
        for (int i = 0; i < g_nw; i++)
            if (g_w[i].kind == WK_CARD && g_w[i].id >= ID_PRESET && g_w[i].id < ID_PRESET + 16) {
                Crosshair t; memcpy(&t, &g_ch, sizeof(t));
                ChDefault(&t, g_w[i].id - ID_PRESET);
                t.color = g_ch.color; t.glow = g_ch.glow;
                PaintThumb(dc, g_w[i].r, &t, 14);
            }
    } else if (g_screen == SC_STUDIO) {
        RECT box; SetRect(&box, PVX, PVY, PVX + PVW, WINH - PAD);
        PaintPixelCanvas(dc, box);
    } else if (g_screen == SC_PRESETS) {
        TxtAt(dc, PVX, PVY, 400, 24, L"PRESETS & LIBRARY", C_TXT, g_fh, DT_LEFT | DT_VCENTER);
        for (int i = 0; i < g_nw; i++) {
            if (g_w[i].kind != WK_CARD) continue;
            if (g_w[i].id >= ID_PRESET && g_w[i].id < ID_PRESET + 16) {
                Crosshair t; memcpy(&t, &g_ch, sizeof(t));
                ChDefault(&t, g_w[i].id - ID_PRESET);
                t.color = g_ch.color; t.glow = g_ch.glow;
                PaintThumb(dc, g_w[i].r, &t, 16);
            } else if (g_w[i].id >= ID_LIB && g_w[i].id < ID_LIB + MAXLIB) {
                PaintThumb(dc, g_w[i].r, &g_lib[g_w[i].id - ID_LIB], 16);
            }
        }
    } else if (g_screen == SC_PROFILES) {
        TxtAt(dc, PVX, PVY, 500, 24, L"GAME PROFILES", C_TXT, g_fh, DT_LEFT | DT_VCENTER);
        TxtAt(dc, PVX, PVY + 24, 700, 18,
              L"Each game keeps its own crosshair and switches the moment it takes focus.",
              C_TXT2, g_fxs, DT_LEFT | DT_VCENTER);
        if (g_nprof == 0)
            TxtAt(dc, PVX, PVY + 90, 700, 22, L"No profiles yet - launch a game, then add it here.",
                  C_TXT2, g_f, DT_LEFT | DT_VCENTER);
    } else if (g_screen == SC_THEMES) {
        TxtAt(dc, PVX, PVY, 400, 24, L"ACCENT", C_TXT, g_fh, DT_LEFT | DT_VCENTER);
        for (int i = 0; i < g_nw; i++)
            if (g_w[i].kind == WK_CARD && g_w[i].id >= ID_ACCENT && g_w[i].id < ID_ACCENT + 6) {
                RECT sw = g_w[i].r;
                SetRect(&sw, sw.left + 30, sw.top + 22, sw.right - 30, sw.top + 62);
                Card(dc, sw, ToRef(g_w[i].col), ToRef(g_w[i].col), 10);
            }
    } else {
        TxtAt(dc, PVX, PVY, 400, 24, L"SETTINGS", C_TXT, g_fh, DT_LEFT | DT_VCENTER);
    }

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
    if (slot < 0) {
        slot = MAXLIB - 1;
        for (int i = 0; i < MAXLIB - 1; i++) memcpy(&g_lib[i], &g_lib[i + 1], sizeof(Crosshair));
    }
    memcpy(&g_lib[slot], &g_ch, sizeof(Crosshair));
    g_libUsed[slot] = 1;
    ShellStatus(L"Saved to library");
    CfgSave();
}

// ------------------------------------------------------------------ commands
static void Command(int id)
{
    if (id >= ID_NAV && id < ID_NAV + 6) { g_screen = id - ID_NAV; g_hover = -1; ShellRedraw(); return; }
    if (id >= ID_TAB && id < ID_TAB + 4) { g_tab = id - ID_TAB; g_hover = -1; ShellRedraw(); return; }
    if (id >= ID_STYLE && id < ID_STYLE + 5) {
        g_ch.style = id - ID_STYLE;
        wcsncpy(g_ch.name, kStyleName[id - ID_STYLE], 31);
        ApplyAndSave(); return;
    }
    if (id >= ID_SWATCH && id < ID_SWATCH + 8) { SetColor(kPalette[id - ID_SWATCH]); return; }
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
        int ox = g_ch.offsetX, oy = g_ch.offsetY, glow = g_ch.glow;
        uint32_t col = g_ch.color;
        ChDefault(&g_ch, id - ID_PRESET);
        g_ch.offsetX = ox; g_ch.offsetY = oy; g_ch.color = col; g_ch.glow = glow;
        ApplyAndSave(); return;
    }
    if (id >= ID_LIB && id < ID_LIB + MAXLIB) {
        int i = id - ID_LIB;
        if (g_libUsed[i]) { memcpy(&g_ch, &g_lib[i], sizeof(Crosshair)); ApplyAndSave(); }
        return;
    }
    if (id >= ID_ACCENT && id < ID_ACCENT + 6) { g_set.accent = id - ID_ACCENT; CfgSave(); ShellRedraw(); return; }
    if (id >= ID_PROF && id < ID_PROF + MAXPROFILE) {
        int i = id - ID_PROF;
        if (i < g_nprof) {
            g_activeProfile = i;
            memcpy(&g_ch, &g_prof[i].ch, sizeof(Crosshair));
            wcsncpy(g_activeLabel, g_prof[i].label, 63); g_activeLabel[63] = 0;
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
        CfgSave(); ShellGameChanged(); ShellRedraw();
        return;
    }

    switch (id) {
    case ID_ONLYGAME:   g_set.onlyInGame = !g_set.onlyInGame; CfgSave(); ShellGameChanged(); ShellRedraw(); break;
    case ID_CUSTOMCOL:  PickColor(0); break;
    case ID_OUTLINECOL: PickColor(1); break;
    case ID_CENTERDOT:  g_ch.centerDot = !g_ch.centerDot; ApplyAndSave(); break;
    case ID_OUTLINE:    g_ch.outline = !g_ch.outline; ApplyAndSave(); break;
    case ID_IMGLOAD:    PickImage(); break;
    case ID_IMGCLEAR:   g_ch.image[0] = 0; ChDropImage();
                        if (g_ch.style == ST_IMAGE) g_ch.style = ST_CROSS;
                        ApplyAndSave(); break;
    case ID_IMGUSE:     if (g_ch.image[0]) { g_ch.style = ST_IMAGE; ApplyAndSave(); }
                        else ShellStatus(L"Upload an image first");
                        break;
    case ID_PXUSE:      g_ch.style = ST_PIXEL; wcsncpy(g_ch.name, L"Pixel Art", 31); ApplyAndSave(); break;
    case ID_PXUNDO:     PopUndo(); ApplyAndSave(); break;
    case ID_PXCLEAR:    PushUndo(); ZeroMemory(g_ch.px, sizeof(g_ch.px)); ApplyAndSave(); break;
    case ID_LIBSAVE:    LibSave(); break;
    case ID_APPLY:      ApplyAndSave(); ShellStatus(L"Applied"); break;
    case ID_PROFCHIP:   g_screen = SC_PROFILES; ShellRedraw(); break;
    case ID_HOTKEYCHIP: g_screen = SC_SETTINGS; ShellRedraw(); break;
    case ID_PROFADD:
        if (g_lastGame[0]) {
            int i = ProfileAdd(g_lastGame);
            if (i >= 0) {
                OverlayResolution(&g_prof[i].lastW, &g_prof[i].lastH);
                g_activeProfile = i;
                wcsncpy(g_activeLabel, g_prof[i].label, 63); g_activeLabel[63] = 0;
                CfgSave(); ShellStatus(L"Profile created");
            }
        } else ShellStatus(L"Launch a game first");
        ShellRedraw();
        break;
    case ID_UPDCHECK:   UpdateCheckAsync(g_hwnd, FALSE); break;
    case ID_UPDINSTALL: UpdateInstall(); break;
    case ID_TOGGLEOVL:  g_set.overlayOn = !g_set.overlayOn;
                        if (!g_set.overlayOn) OverlaySetVisible(FALSE);
                        CfgSave(); ShellGameChanged(); ShellRedraw(); break;
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
    if (g_screen != SC_STUDIO) return 0;
    RECT box; SetRect(&box, PVX, PVY, PVX + PVW, WINH - PAD);
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
    int boxw = 62, w = (p->r.right - p->r.left) - boxw - 10;
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
                } else Command(g_w[i].id);
                return 0;
            }
            if (y < HEADH && x > SIDEW) { ReleaseCapture(); SendMessageW(h, WM_NCLBUTTONDOWN, HTCAPTION, 0); return 0; }
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
    SetWindowRgn(g_hwnd, CreateRoundRectRgn(0, 0, pw + 1, ph + 1, 18, 18), TRUE);

    g_f   = CreateFontW(15, 0, 0, 0, FW_NORMAL,   0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fb  = CreateFontW(15, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fs  = CreateFontW(14, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fxs = CreateFontW(12, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fh  = CreateFontW(21, 0, 0, 0, FW_BOLD,     0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    g_fxl = CreateFontW(30, 0, 0, 0, FW_LIGHT,    0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
    (void)g_fxl;
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
    wcsncpy(g_status, s, 119);
    g_status[119] = 0;
    if (ShellVisible()) InvalidateRect(g_hwnd, NULL, FALSE);
}

void ShellRedraw(void) { if (g_hwnd) InvalidateRect(g_hwnd, NULL, FALSE); }
void ShellGameChanged(void) { if (ShellVisible()) InvalidateRect(g_hwnd, NULL, FALSE); }
HWND ShellHwnd(void) { return g_hwnd; }
