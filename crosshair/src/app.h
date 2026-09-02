// PixelCross - tiny native Win32 crosshair overlay
#pragma once
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <stdint.h>

#define APP_NAME    L"PixelCross"
#define APP_CLASS   L"PixelCrossPanel"
#define OV_CLASS    L"PixelCrossOverlay"
#define MAXGRID     64
#define HOTKEY_ID   1
#define WM_TRAY     (WM_APP + 1)

struct Config {
    int      gridW, gridH;
    uint32_t px[MAXGRID * MAXGRID];   // 0xAARRGGBB straight alpha
    int      scale;                   // screen pixels per cell (1..12)
    int      opacity;                 // 0..255 master alpha
    int      offsetX, offsetY;        // fine nudge from exact center
    int      useImage;                // draw uploaded image instead of grid
    wchar_t  imagePath[MAX_PATH];
    int      imageScale;              // percent, 10..400
    int      overlayOn;
    int      autoDetect;              // treat any fullscreen app as a game
    int      onlyInGame;              // hide overlay on the desktop
    int      autoOpenPanel;           // pop the panel when a game starts
    int      startWithWindows;
    wchar_t  games[2048];             // ';' separated exe names
};

extern Config    g_cfg;
extern HINSTANCE g_inst;
extern wchar_t   g_lastGame[64];

// ---- config.cpp
void CfgDefaults(Config* c);
void CfgLoad(Config* c);
void CfgSave(const Config* c);
void SetStartWithWindows(int on);
int  GameListHas(const wchar_t* exe);
void GameListAdd(const wchar_t* exe);

// ---- overlay.cpp
BOOL OverlayCreate(void);
void OverlayRefresh(void);              // re-render bitmap + recenter
void OverlaySetMonitorFrom(HWND fg);    // follow the monitor the game is on
void OverlaySetVisible(BOOL show);
void OverlayDropImage(void);            // force image reload on next render

// ---- ui.cpp
BOOL PanelCreate(void);
void PanelShow(BOOL show);
BOOL PanelIsVisible(void);
void PanelToggle(void);
void PanelStatus(const wchar_t* s);
void PanelRedraw(void);

// ---- main.cpp
void TrayShow(BOOL show);
void AppExit(void);
