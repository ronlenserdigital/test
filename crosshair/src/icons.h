#pragma once
#include <windows.h>

enum {
    IC_NONE = 0,
    // navigation
    IC_HOME, IC_STUDIO, IC_PRESETS, IC_GAMEPAD, IC_THEME, IC_GEAR,
    // tabs
    IC_SLIDERS, IC_SHAPE, IC_SPARK, IC_WRENCH,
    // header
    IC_SHIELD, IC_MONITOR, IC_KEY,
    // window
    IC_MIN, IC_MAX, IC_CLOSE,
    // controls
    IC_DROP, IC_THICK, IC_LENGTH, IC_GAP, IC_DOT, IC_GLOW, IC_OUTLINE,
    IC_ARROWX, IC_ARROWY, IC_PALETTE, IC_IMAGE, IC_GRID, IC_CROSSHAIR,
    // actions
    IC_PLUS, IC_TRASH, IC_UNDO, IC_SAVE, IC_CHECK, IC_UPLOAD, IC_REFRESH,
    IC_POWER, IC_EYE, IC_DOWNLOAD, IC_STAR,
    // studio tools
    IC_PEN, IC_ERASER, IC_FILL, IC_LINE, IC_RECT, IC_RING, IC_MIRX, IC_MIRY,
    IC_COUNT
};

// draws icon `id` centred on (cx,cy); r is the half-size in pixels (8 = 16px icon)
void Icon(HDC dc, int id, int cx, int cy, int r, COLORREF col);

// The DEADCENTER mark, drawn as vector art on a -100..100 grid.
// cx,cy = centre, r = radius in pixels. `dark` is the plate colour behind
// the neon; pass the surface colour it sits on.
void BrandMark(HDC dc, int cx, int cy, int r, COLORREF neon, COLORREF dark);
