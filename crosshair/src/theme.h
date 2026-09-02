// DEADCENTER design tokens - the whole app reads its colour from here.
#pragma once
#include <windows.h>
#include <stdint.h>

// ---- brand ---------------------------------------------------------------
#define DC_CYAN_R        0
#define DC_CYAN_G      252
#define DC_CYAN_B      253
#define DC_CYAN        RGB(0, 252, 253)      // #00FCFD
#define DC_CYAN_BRIGHT RGB(143, 255, 255)    // #8FFFFF
#define DC_CYAN_2      RGB(0, 200, 216)      // #00C8D8
#define DC_CYAN_DEEP   RGB(0, 107, 122)      // #006B7A

// ---- surfaces ------------------------------------------------------------
#define DC_BG          RGB(0, 8, 16)         // #000810
#define DC_PANEL       RGB(1, 25, 33)        // #011921
#define DC_RAISED      RGB(5, 35, 45)        // #05232D
#define DC_HOVER       RGB(9, 48, 60)
#define DC_BORDER      RGB(14, 54, 66)       // cyan @ 0.18 over panel
#define DC_BORDER_SOFT RGB(9, 40, 50)

// ---- ink -----------------------------------------------------------------
#define DC_INK         RGB(244, 255, 255)    // #F4FFFF
#define DC_INK_2       RGB(138, 169, 176)    // #8AA9B0
#define DC_INK_MUTE   RGB(85, 115, 122)     // #55737A
#define DC_DANGER      RGB(214, 78, 96)

// ---- glass (alpha applied by the layered-window mask) --------------------
#define DC_A_WINDOW    140                   // rgba(0,8,16,0.55)
#define DC_A_PANEL     186                   // rgba(1,25,33,0.73)
#define DC_A_CARD      164                   // rgba(5,35,45,0.64)
#define DC_A_SOLID     252

// ---- geometry ------------------------------------------------------------
#define DC_R_WINDOW    12
#define DC_R_PANEL      9
#define DC_R_BTN        7

static inline COLORREF DcMix(COLORREF a, COLORREF b, int t)   // t = 0..255
{
    int ia = 255 - t;
    return RGB((GetRValue(a) * ia + GetRValue(b) * t) / 255,
               (GetGValue(a) * ia + GetGValue(b) * t) / 255,
               (GetBValue(a) * ia + GetBValue(b) * t) / 255);
}

// cyan laid over a surface at `pct` percent - used for borders and tints
static inline COLORREF DcTint(COLORREF base, COLORREF over, int pct)
{
    return DcMix(base, over, pct * 255 / 100);
}
