// DEADCENTER - Precision. Your way.
#pragma once
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <stdint.h>

#define APP_NAME    L"DEADCENTER"
#define APP_ID      L"DeadCenter"
#define APP_VER     L"1.0.0"
#define APP_VERNUM  10000
#define APP_CLASS   L"DeadCenterShell"
#define OV_CLASS    L"DeadCenterOverlay"
#define MSG_CLASS   L"DeadCenterMsg"

#define UPDATE_HOST L"raw.githubusercontent.com"
#define UPDATE_PATH L"/ronlenserdigital/test/main/crosshair/latest.json"

#define MAXGRID     64
#define MAXPROFILE  12
#define MAXLIB      8
#define HOTKEY_ID   1
#define WM_TRAY     (WM_APP + 1)
#define WM_UPDATE   (WM_APP + 2)

enum { ST_CROSS, ST_DOT, ST_TSHAPE, ST_CIRCLE, ST_CHEVRON, ST_PIXEL, ST_IMAGE, ST_COUNT };

struct Crosshair {
    wchar_t  name[32];
    int      style;
    uint32_t color;
    uint32_t outlineColor;
    int      length, thickness, gap, dotSize;
    int      centerDot, outline;
    int      opacity;                 // 0..255
    int      offsetX, offsetY;
    int      gridW, gridH, pxScale;   // pixel-editor layer
    uint32_t px[MAXGRID * MAXGRID];
    wchar_t  image[MAX_PATH];
    int      imageScale;              // percent
};

struct Profile {
    wchar_t   exe[64];
    wchar_t   label[40];
    int       autoLaunch;
    int       lastW, lastH;
    Crosshair ch;
};

struct Settings {
    int overlayOn, onlyInGame, autoDetect, autoOpenPanel, startWithWindows;
    int autoUpdate;
    int previewEnv;       // 0 dark 1 light 2 grass 3 sky 4 concrete
    int previewZoom;      // 1,2,4
};

extern Crosshair g_ch;                    // crosshair being edited / shown
extern Crosshair g_lib[MAXLIB];
extern int       g_libUsed[MAXLIB];
extern Profile   g_prof[MAXPROFILE];
extern int       g_nprof;
extern Settings  g_set;
extern HINSTANCE g_inst;
extern wchar_t   g_lastGame[64];
extern wchar_t   g_activeLabel[64];
extern int       g_activeProfile;         // -1 = default crosshair

// ---- render.cpp
struct ChBitmap { uint32_t* px; int w, h, ax, ay; };   // straight ARGB, ax/ay = aim point
BOOL ChBuild(const Crosshair* c, ChBitmap* out);
void ChFree(ChBitmap* b);
void ChDropImage(void);
void ChDefault(Crosshair* c, int preset);
int  ChPresetCount(void);
const wchar_t* ChPresetName(int i);

// ---- config.cpp
void CfgLoad(void);
void CfgSave(void);
void SetStartWithWindows(int on);
int  ProfileFind(const wchar_t* exe);
int  ProfileAdd(const wchar_t* exe);

// ---- overlay.cpp
BOOL OverlayCreate(void);
void OverlayRefresh(void);
void OverlaySetMonitorFrom(HWND fg);
void OverlaySetVisible(BOOL show);
void OverlayResolution(int* w, int* h);

// ---- update.cpp
void UpdateCheckAsync(HWND notify, BOOL silent);
const wchar_t* UpdateStatusText(void);
BOOL UpdateAvailable(void);
void UpdateInstall(void);

// ---- ui.cpp
BOOL ShellCreate(void);
void ShellShow(BOOL show);
BOOL ShellVisible(void);
void ShellToggle(void);
void ShellStatus(const wchar_t* s);
void ShellRedraw(void);
void ShellApply(void);
HWND ShellHwnd(void);                     // crosshair changed -> overlay + save

// ---- main.cpp
void TrayShow(BOOL show);
void AppExit(void);
