#include "icons.h"

// Every glyph is authored on a -8..+8 grid and scaled by r/8.
static int   G_cx, G_cy, G_r;
static HDC   G_dc;

static inline int X(int v) { return G_cx + v * G_r / 8; }
static inline int Y(int v) { return G_cy + v * G_r / 8; }

static void L(int x1, int y1, int x2, int y2)
{
    MoveToEx(G_dc, X(x1), Y(y1), NULL);
    LineTo(G_dc, X(x2), Y(y2));
}

static void Box(int x1, int y1, int x2, int y2)
{
    Rectangle(G_dc, X(x1), Y(y1), X(x2), Y(y2));
}

static void Circ(int x, int y, int rad)
{
    Ellipse(G_dc, X(x - rad), Y(y - rad), X(x + rad), Y(y + rad));
}

static void FillCirc(int x, int y, int rad, COLORREF c)
{
    HBRUSH b = CreateSolidBrush(c);
    HGDIOBJ ob = SelectObject(G_dc, b);
    Ellipse(G_dc, X(x - rad), Y(y - rad), X(x + rad), Y(y + rad));
    SelectObject(G_dc, ob);
    DeleteObject(b);
}

void Icon(HDC dc, int id, int cx, int cy, int r, COLORREF col)
{
    if (id <= IC_NONE || id >= IC_COUNT) return;
    G_dc = dc; G_cx = cx; G_cy = cy; G_r = r;

    int width = r >= 9 ? 2 : 1;
    HPEN pen = CreatePen(PS_SOLID, width, col);
    HGDIOBJ op = SelectObject(dc, pen);
    HGDIOBJ ob = SelectObject(dc, GetStockObject(NULL_BRUSH));

    switch (id) {
    case IC_HOME:
        L(-7, 0, 0, -7); L(0, -7, 7, 0);
        L(-5, -1, -5, 7); L(5, -1, 5, 7); L(-5, 7, 5, 7);
        L(-2, 7, -2, 2); L(2, 7, 2, 2); L(-2, 2, 2, 2);
        break;
    case IC_STUDIO:                       // pen over a grid
        L(-7, 7, -3, 6); L(-3, 6, 5, -6); L(5, -6, 7, -4); L(7, -4, -1, 8);
        L(-7, 7, -1, 8);
        break;
    case IC_PRESETS:                      // 2x2 tiles
        Box(-7, -7, -1, -1); Box(1, -7, 7, -1);
        Box(-7, 1, -1, 7);   Box(1, 1, 7, 7);
        break;
    case IC_GAMEPAD:
        L(-5, -3, 5, -3);
        L(-5, -3, -7, 4); L(5, -3, 7, 4);
        L(-7, 4, -4, 6); L(7, 4, 4, 6); L(-4, 6, 4, 6);
        L(-5, 0, -1, 0); L(-3, -2, -3, 2);
        FillCirc(3, -1, 1, col); FillCirc(5, 1, 1, col);
        break;
    case IC_THEME:                        // palette
        Circ(0, 0, 7);
        FillCirc(-3, -3, 1, col); FillCirc(3, -3, 1, col);
        FillCirc(-4, 2, 1, col);  FillCirc(2, 4, 1, col);
        break;
    case IC_GEAR:
        Circ(0, 0, 3);
        L(0, -8, 0, -5); L(0, 5, 0, 8); L(-8, 0, -5, 0); L(5, 0, 8, 0);
        L(-6, -6, -4, -4); L(4, 4, 6, 6); L(6, -6, 4, -4); L(-4, 4, -6, 6);
        break;

    case IC_SLIDERS:
        L(-7, -4, 7, -4); L(-7, 1, 7, 1); L(-7, 6, 7, 6);
        FillCirc(-2, -4, 2, col); FillCirc(3, 1, 2, col); FillCirc(-4, 6, 2, col);
        break;
    case IC_SHAPE:
        Circ(0, 0, 6); L(0, -8, 0, -3); L(0, 3, 0, 8); L(-8, 0, -3, 0); L(3, 0, 8, 0);
        break;
    case IC_SPARK:
        L(-1, -8, -1, 8); L(-8, 0, 6, 0);
        L(4, -7, 4, -3); L(2, -5, 6, -5);
        break;
    case IC_WRENCH:
        L(-6, 6, 2, -2);
        Circ(4, -4, 3);
        L(-7, 5, -5, 7);
        break;

    case IC_SHIELD:
        L(0, -7, 6, -4); L(6, -4, 6, 1); L(6, 1, 0, 7);
        L(0, -7, -6, -4); L(-6, -4, -6, 1); L(-6, 1, 0, 7);
        L(-3, 0, -1, 3); L(-1, 3, 3, -3);
        break;
    case IC_MONITOR:
        Box(-8, -6, 8, 4); L(-4, 7, 4, 7); L(0, 4, 0, 7);
        break;
    case IC_KEY:
        Box(-8, -5, 8, 5);
        L(-5, -2, -5, -2); L(-2, -2, -2, -2); L(1, -2, 1, -2);
        L(-4, 2, 4, 2);
        break;

    case IC_MIN:   L(-6, 0, 6, 0); break;
    case IC_MAX:   Box(-6, -6, 6, 6); break;
    case IC_CLOSE: L(-6, -6, 6, 6); L(6, -6, -6, 6); break;

    case IC_DROP:
        L(0, -7, 5, 1); L(5, 1, 0, 7); L(0, 7, -5, 1); L(-5, 1, 0, -7);
        break;
    case IC_THICK:
        L(-7, -5, 7, -5);
        L(-7, 0, 7, 0); L(-7, 1, 7, 1);
        L(-7, 5, 7, 5); L(-7, 6, 7, 6); L(-7, 7, 7, 7);
        break;
    case IC_LENGTH:
        L(-8, 0, 8, 0); L(-8, -4, -8, 4); L(8, -4, 8, 4);
        break;
    case IC_GAP:
        L(-8, 0, -3, 0); L(3, 0, 8, 0);
        L(-3, -4, -3, 4); L(3, -4, 3, 4);
        break;
    case IC_DOT:
        Circ(0, 0, 7); FillCirc(0, 0, 2, col);
        break;
    case IC_GLOW:
        Circ(0, 0, 3);
        L(0, -8, 0, -6); L(0, 6, 0, 8); L(-8, 0, -6, 0); L(6, 0, 8, 0);
        L(-6, -6, -4, -4); L(4, 4, 6, 6); L(6, -6, 4, -4); L(-4, 4, -6, 6);
        break;
    case IC_OUTLINE:
        Box(-7, -7, 7, 7); Box(-3, -3, 3, 3);
        break;
    case IC_ARROWX:
        L(-8, 0, 8, 0); L(-8, 0, -4, -3); L(-8, 0, -4, 3);
        L(8, 0, 4, -3); L(8, 0, 4, 3);
        break;
    case IC_ARROWY:
        L(0, -8, 0, 8); L(0, -8, -3, -4); L(0, -8, 3, -4);
        L(0, 8, -3, 4); L(0, 8, 3, 4);
        break;
    case IC_PALETTE:
        Circ(0, 0, 7);
        FillCirc(-3, -3, 1, col); FillCirc(3, -3, 1, col); FillCirc(0, 4, 1, col);
        break;
    case IC_IMAGE:
        Box(-8, -6, 8, 6);
        L(-8, 4, -2, -2); L(-2, -2, 2, 2); L(2, 2, 5, -1); L(5, -1, 8, 3);
        FillCirc(3, -3, 1, col);
        break;
    case IC_GRID:
        Box(-7, -7, 7, 7);
        L(-2, -7, -2, 7); L(3, -7, 3, 7);
        L(-7, -2, 7, -2); L(-7, 3, 7, 3);
        break;
    case IC_CROSSHAIR:
        Circ(0, 0, 6);
        L(0, -8, 0, -4); L(0, 4, 0, 8); L(-8, 0, -4, 0); L(4, 0, 8, 0);
        FillCirc(0, 0, 1, col);
        break;

    case IC_PLUS:  L(0, -6, 0, 6); L(-6, 0, 6, 0); break;
    case IC_TRASH:
        L(-6, -4, 6, -4); L(-3, -4, -3, -7); L(-3, -7, 3, -7); L(3, -7, 3, -4);
        L(-5, -4, -4, 7); L(5, -4, 4, 7); L(-4, 7, 4, 7);
        L(-1, -1, -1, 4); L(1, -1, 1, 4);
        break;
    case IC_UNDO:
        L(-7, -1, -2, -6); L(-7, -1, -2, 4);
        L(-7, -1, 3, -1); L(3, -1, 6, 2); L(6, 2, 4, 6);
        break;
    case IC_SAVE:
        Box(-7, -7, 7, 7);
        L(-4, -7, -4, -1); L(4, -7, 4, -1); L(-4, -1, 4, -1);
        Box(-3, 2, 3, 7);
        break;
    case IC_CHECK:
        L(-6, 0, -2, 5); L(-2, 5, 7, -5);
        break;
    case IC_UPLOAD:
        L(0, 6, 0, -6); L(0, -6, -4, -2); L(0, -6, 4, -2);
        L(-7, 7, 7, 7);
        break;
    case IC_DOWNLOAD:
        L(0, -6, 0, 6); L(0, 6, -4, 2); L(0, 6, 4, 2);
        L(-7, 8, 7, 8);
        break;
    case IC_REFRESH:
        L(-6, -2, -2, -6); L(-6, -2, -2, 2);
        L(-6, -2, 4, -2); L(4, -2, 6, 1);
        L(6, 5, 2, 2); L(6, 5, 2, 8);
        L(6, 5, -4, 5); L(-4, 5, -6, 2);
        break;
    case IC_POWER:
        L(0, -8, 0, -2);
        Circ(0, 1, 6);
        break;
    case IC_EYE:
        L(-8, 0, -3, -4); L(-3, -4, 3, -4); L(3, -4, 8, 0);
        L(-8, 0, -3, 4); L(-3, 4, 3, 4); L(3, 4, 8, 0);
        FillCirc(0, 0, 2, col);
        break;
    case IC_STAR:
        L(0, -8, 2, -2); L(2, -2, 8, -2); L(8, -2, 3, 2);
        L(3, 2, 5, 8); L(5, 8, 0, 4); L(0, 4, -5, 8);
        L(-5, 8, -3, 2); L(-3, 2, -8, -2); L(-8, -2, -2, -2); L(-2, -2, 0, -8);
        break;

    case IC_PEN:
        L(-7, 7, -4, 6); L(-4, 6, 5, -5); L(5, -5, 7, -3); L(7, -3, -2, 8);
        L(-7, 7, -2, 8);
        break;
    case IC_ERASER:
        L(-7, 4, 1, -5); L(1, -5, 7, 1); L(7, 1, 0, 8); L(0, 8, -7, 4);
        L(-7, 8, 7, 8);
        break;
    case IC_FILL:
        L(-5, -2, 1, -8); L(1, -8, 7, -2); L(7, -2, 1, 4); L(1, 4, -5, -2);
        L(-2, -5, -2, -8);
        FillCirc(6, 4, 2, col);
        break;
    case IC_LINE:
        L(-6, 6, 6, -6);
        FillCirc(-6, 6, 2, col); FillCirc(6, -6, 2, col);
        break;
    case IC_RECT:
        Box(-7, -5, 7, 5);
        break;
    case IC_RING:
        Circ(0, 0, 7);
        break;
    case IC_MIRX:
        L(0, -8, 0, 8);
        L(-2, -4, -6, 0); L(-6, 0, -2, 4);
        L(2, -4, 6, 0);  L(6, 0, 2, 4);
        break;
    case IC_MIRY:
        L(-8, 0, 8, 0);
        L(-4, -2, 0, -6); L(0, -6, 4, -2);
        L(-4, 2, 0, 6);   L(0, 6, 4, 2);
        break;
    default: break;
    }

    SelectObject(dc, op);
    SelectObject(dc, ob);
    DeleteObject(pen);
}
