#include "app.h"
#include <shlobj.h>
#include <stdio.h>
#include <wchar.h>

Config g_cfg;

static void CfgDir(wchar_t* out, int cch)
{
    wchar_t appdata[MAX_PATH] = L"";
    if (FAILED(SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, appdata)))
        GetTempPathW(MAX_PATH, appdata);
    _snwprintf(out, cch, L"%s\\%s", appdata, APP_NAME);
    out[cch - 1] = 0;
    CreateDirectoryW(out, NULL);
}

static void CfgPath(wchar_t* out, int cch)
{
    wchar_t dir[MAX_PATH];
    CfgDir(dir, MAX_PATH);
    _snwprintf(out, cch, L"%s\\config.txt", dir);
    out[cch - 1] = 0;
}

void CfgDefaults(Config* c)
{
    ZeroMemory(c, sizeof(*c));
    c->gridW = 32; c->gridH = 32;
    c->scale = 2;
    c->opacity = 255;
    c->imageScale = 100;
    c->overlayOn = 1;
    c->autoDetect = 1;
    c->onlyInGame = 1;
    c->autoOpenPanel = 0;
    c->startWithWindows = 0;

    // default: 1px dot + thin cross gap
    const uint32_t col = 0xFF00FF6A;
    int cx = c->gridW / 2, cy = c->gridH / 2;
    for (int i = 3; i <= 8; i++) {
        c->px[cy * MAXGRID + (cx + i)] = col;
        c->px[cy * MAXGRID + (cx - i)] = col;
        c->px[(cy + i) * MAXGRID + cx] = col;
        c->px[(cy - i) * MAXGRID + cx] = col;
    }
    c->px[cy * MAXGRID + cx] = col;
}

static int ClampI(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }

void CfgLoad(Config* c)
{
    CfgDefaults(c);

    wchar_t path[MAX_PATH];
    CfgPath(path, MAX_PATH);
    FILE* f = _wfopen(path, L"rt, ccs=UTF-8");
    if (!f) return;

    // a saved file fully replaces the default art
    ZeroMemory(c->px, sizeof(c->px));

    wchar_t line[2200];
    while (fgetws(line, 2200, f)) {
        wchar_t key[64]; int a, b; unsigned int u;
        if (swscanf(line, L"P %d %d %x", &a, &b, &u) == 3) {
            if (a >= 0 && a < MAXGRID && b >= 0 && b < MAXGRID)
                c->px[b * MAXGRID + a] = (uint32_t)u;
            continue;
        }
        if (swscanf(line, L"%63s %d", key, &a) == 2) {
            if      (!wcscmp(key, L"gridW"))      c->gridW = ClampI(a, 8, MAXGRID);
            else if (!wcscmp(key, L"gridH"))      c->gridH = ClampI(a, 8, MAXGRID);
            else if (!wcscmp(key, L"scale"))      c->scale = ClampI(a, 1, 12);
            else if (!wcscmp(key, L"opacity"))    c->opacity = ClampI(a, 10, 255);
            else if (!wcscmp(key, L"offsetX"))    c->offsetX = ClampI(a, -200, 200);
            else if (!wcscmp(key, L"offsetY"))    c->offsetY = ClampI(a, -200, 200);
            else if (!wcscmp(key, L"useImage"))   c->useImage = !!a;
            else if (!wcscmp(key, L"imageScale")) c->imageScale = ClampI(a, 10, 400);
            else if (!wcscmp(key, L"overlayOn"))  c->overlayOn = !!a;
            else if (!wcscmp(key, L"autoDetect")) c->autoDetect = !!a;
            else if (!wcscmp(key, L"onlyInGame")) c->onlyInGame = !!a;
            else if (!wcscmp(key, L"autoOpen"))   c->autoOpenPanel = !!a;
            else if (!wcscmp(key, L"startWin"))   c->startWithWindows = !!a;
            continue;
        }
        if (!wcsncmp(line, L"image ", 6)) {
            wcsncpy(c->imagePath, line + 6, MAX_PATH - 1);
            c->imagePath[MAX_PATH - 1] = 0;
            wchar_t* p = wcspbrk(c->imagePath, L"\r\n"); if (p) *p = 0;
            continue;
        }
        if (!wcsncmp(line, L"games ", 6)) {
            wcsncpy(c->games, line + 6, 2047);
            c->games[2047] = 0;
            wchar_t* p = wcspbrk(c->games, L"\r\n"); if (p) *p = 0;
        }
    }
    fclose(f);
}

void CfgSave(const Config* c)
{
    wchar_t path[MAX_PATH];
    CfgPath(path, MAX_PATH);
    FILE* f = _wfopen(path, L"wt, ccs=UTF-8");
    if (!f) return;

    fwprintf(f, L"gridW %d\ngridH %d\nscale %d\nopacity %d\n",
             c->gridW, c->gridH, c->scale, c->opacity);
    fwprintf(f, L"offsetX %d\noffsetY %d\nuseImage %d\nimageScale %d\n",
             c->offsetX, c->offsetY, c->useImage, c->imageScale);
    fwprintf(f, L"overlayOn %d\nautoDetect %d\nonlyInGame %d\nautoOpen %d\nstartWin %d\n",
             c->overlayOn, c->autoDetect, c->onlyInGame, c->autoOpenPanel, c->startWithWindows);
    if (c->imagePath[0]) fwprintf(f, L"image %s\n", c->imagePath);
    if (c->games[0])     fwprintf(f, L"games %s\n", c->games);

    for (int y = 0; y < c->gridH; y++)
        for (int x = 0; x < c->gridW; x++)
            if (c->px[y * MAXGRID + x] & 0xFF000000)
                fwprintf(f, L"P %d %d %08X\n", x, y, (unsigned)c->px[y * MAXGRID + x]);
    fclose(f);
}

void SetStartWithWindows(int on)
{
    HKEY k;
    if (RegOpenKeyExW(HKEY_CURRENT_USER,
        L"Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &k) != ERROR_SUCCESS)
        return;
    if (on) {
        wchar_t exe[MAX_PATH], quoted[MAX_PATH + 8];
        GetModuleFileNameW(NULL, exe, MAX_PATH);
        _snwprintf(quoted, MAX_PATH + 8, L"\"%s\" /tray", exe);
        RegSetValueExW(k, APP_NAME, 0, REG_SZ, (const BYTE*)quoted,
                       (DWORD)((wcslen(quoted) + 1) * sizeof(wchar_t)));
    } else {
        RegDeleteValueW(k, APP_NAME);
    }
    RegCloseKey(k);
}

int GameListHas(const wchar_t* exe)
{
    if (!exe || !exe[0] || !g_cfg.games[0]) return 0;
    const wchar_t* p = g_cfg.games;
    while (*p) {
        const wchar_t* e = wcschr(p, L';');
        size_t n = e ? (size_t)(e - p) : wcslen(p);
        if (n && n == wcslen(exe) && _wcsnicmp(p, exe, n) == 0) return 1;
        if (!e) break;
        p = e + 1;
    }
    return 0;
}

void GameListAdd(const wchar_t* exe)
{
    if (!exe || !exe[0] || GameListHas(exe)) return;
    size_t len = wcslen(g_cfg.games);
    if (len + wcslen(exe) + 2 >= 2048) return;
    if (len) wcscat(g_cfg.games, L";");
    wcscat(g_cfg.games, exe);
}
