#include "app.h"
#include <shlobj.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>

Crosshair g_ch;
Crosshair g_lib[MAXLIB];
int       g_libUsed[MAXLIB];
Profile   g_prof[MAXPROFILE];
int       g_nprof = 0;
Settings  g_set;
wchar_t   g_lastGame[64] = L"";
wchar_t   g_hotkeyLabel[24] = L"F12";
wchar_t   g_activeLabel[64] = L"Default";
int       g_activeProfile = -1;

static void CfgPath(wchar_t* out, int cch)
{
    wchar_t base[MAX_PATH] = L"";
    if (FAILED(SHGetFolderPathW(NULL, CSIDL_APPDATA, NULL, 0, base)))
        GetTempPathW(MAX_PATH, base);
    wchar_t dir[MAX_PATH];
    _snwprintf(dir, MAX_PATH, L"%ls\\%ls", base, APP_ID); dir[MAX_PATH - 1] = 0;
    CreateDirectoryW(dir, NULL);
    _snwprintf(out, cch, L"%ls\\config.txt", dir); out[cch - 1] = 0;
}

static int Clamp(int v, int a, int b) { return v < a ? a : (v > b ? b : v); }

static void WriteCh(FILE* f, const Crosshair* c)
{
    fwprintf(f, L"name %ls\n", c->name[0] ? c->name : L"Custom");
    fwprintf(f, L"style %d\ncolor %08X\noutlineColor %08X\n",
             c->style, (unsigned)c->color, (unsigned)c->outlineColor);
    fwprintf(f, L"length %d\nthickness %d\ngap %d\ndotSize %d\n",
             c->length, c->thickness, c->gap, c->dotSize);
    fwprintf(f, L"centerDot %d\noutline %d\nopacity %d\nglow %d\noffsetX %d\noffsetY %d\n",
             c->centerDot, c->outline, c->opacity, c->glow, c->offsetX, c->offsetY);
    fwprintf(f, L"gradient %d\ngradColor %08X\nshadow %d\nshadowX %d\nshadowY %d\n",
             c->gradient, (unsigned)c->gradColor, c->shadow, c->shadowX, c->shadowY);
    fwprintf(f, L"gridW %d\ngridH %d\npxScale %d\nimageScale %d\n",
             c->gridW, c->gridH, c->pxScale, c->imageScale);
    if (c->image[0]) fwprintf(f, L"image %ls\n", c->image);
    for (int y = 0; y < c->gridH; y++)
        for (int x = 0; x < c->gridW; x++)
            if (c->px[y * MAXGRID + x] & 0xFF000000)
                fwprintf(f, L"P %d %d %08X\n", x, y, (unsigned)c->px[y * MAXGRID + x]);
}

// returns 1 if the line belonged to a crosshair
static int ReadChLine(Crosshair* c, const wchar_t* line)
{
    int a, b; unsigned u; wchar_t key[64];
    if (swscanf(line, L"P %d %d %x", &a, &b, &u) == 3) {
        if (a >= 0 && a < MAXGRID && b >= 0 && b < MAXGRID) c->px[b * MAXGRID + a] = u;
        return 1;
    }
    if (!wcsncmp(line, L"name ", 5)) {
        wcsncpy(c->name, line + 5, 31); c->name[31] = 0;
        wchar_t* p = wcspbrk(c->name, L"\r\n"); if (p) *p = 0;
        return 1;
    }
    if (!wcsncmp(line, L"image ", 6)) {
        wcsncpy(c->image, line + 6, MAX_PATH - 1); c->image[MAX_PATH - 1] = 0;
        wchar_t* p = wcspbrk(c->image, L"\r\n"); if (p) *p = 0;
        return 1;
    }
    if (swscanf(line, L"%63ls %x", key, &u) == 2 &&
        (!wcscmp(key, L"color") || !wcscmp(key, L"outlineColor") || !wcscmp(key, L"gradColor"))) {
        if (!wcscmp(key, L"color")) c->color = u;
        else if (!wcscmp(key, L"gradColor")) c->gradColor = u;
        else c->outlineColor = u;
        return 1;
    }
    if (swscanf(line, L"%63ls %d", key, &a) != 2) return 0;
    if      (!wcscmp(key, L"style"))      c->style = Clamp(a, 0, ST_COUNT - 1);
    else if (!wcscmp(key, L"length"))     c->length = Clamp(a, 0, 200);
    else if (!wcscmp(key, L"thickness"))  c->thickness = Clamp(a, 1, 20);
    else if (!wcscmp(key, L"gap"))        c->gap = Clamp(a, 0, 100);
    else if (!wcscmp(key, L"dotSize"))    c->dotSize = Clamp(a, 1, 20);
    else if (!wcscmp(key, L"centerDot"))  c->centerDot = !!a;
    else if (!wcscmp(key, L"outline"))    c->outline = !!a;
    else if (!wcscmp(key, L"opacity"))    c->opacity = Clamp(a, 10, 255);
    else if (!wcscmp(key, L"glow"))       c->glow = Clamp(a, 0, 100);
    else if (!wcscmp(key, L"gradient"))   c->gradient = !!a;
    else if (!wcscmp(key, L"shadow"))     c->shadow = Clamp(a, 0, 100);
    else if (!wcscmp(key, L"shadowX"))    c->shadowX = Clamp(a, -8, 8);
    else if (!wcscmp(key, L"shadowY"))    c->shadowY = Clamp(a, -8, 8);
    else if (!wcscmp(key, L"offsetX"))    c->offsetX = Clamp(a, -200, 200);
    else if (!wcscmp(key, L"offsetY"))    c->offsetY = Clamp(a, -200, 200);
    else if (!wcscmp(key, L"gridW"))      c->gridW = Clamp(a, 8, MAXGRID);
    else if (!wcscmp(key, L"gridH"))      c->gridH = Clamp(a, 8, MAXGRID);
    else if (!wcscmp(key, L"pxScale"))    c->pxScale = Clamp(a, 1, 12);
    else if (!wcscmp(key, L"imageScale")) c->imageScale = Clamp(a, 10, 400);
    else return 0;
    return 1;
}

void CfgSave(void)
{
    wchar_t path[MAX_PATH];
    CfgPath(path, MAX_PATH);
    FILE* f = _wfopen(path, L"wt, ccs=UTF-8");
    if (!f) return;

    fwprintf(f, L"[settings]\n");
    fwprintf(f, L"overlayOn %d\nonlyInGame %d\nautoDetect %d\nautoOpen %d\nstartWin %d\n",
             g_set.overlayOn, g_set.onlyInGame, g_set.autoDetect,
             g_set.autoOpenPanel, g_set.startWithWindows);
    fwprintf(f, L"autoUpdate %d\npreviewZoom %d\naccent %d\nwinAlpha2 %d\npreviewEnv %d\n",
             g_set.autoUpdate, g_set.previewZoom, g_set.accent, g_set.winAlpha, g_set.previewEnv);
    if (g_set.previewImage[0]) fwprintf(f, L"previewImage %ls\n", g_set.previewImage);

    fwprintf(f, L"[crosshair]\n");
    WriteCh(f, &g_ch);

    for (int i = 0; i < MAXLIB; i++) {
        if (!g_libUsed[i]) continue;
        fwprintf(f, L"[lib %d]\n", i);
        WriteCh(f, &g_lib[i]);
    }
    for (int i = 0; i < g_nprof; i++) {
        fwprintf(f, L"[profile]\n");
        fwprintf(f, L"exe %ls\n", g_prof[i].exe);
        fwprintf(f, L"label %ls\n", g_prof[i].label);
        fwprintf(f, L"autoLaunch %d\n", g_prof[i].autoLaunch);
        fwprintf(f, L"res %d %d\n", g_prof[i].lastW, g_prof[i].lastH);
        WriteCh(f, &g_prof[i].ch);
    }
    fclose(f);
}

void CfgLoad(void)
{
    ZeroMemory(&g_set, sizeof(g_set));
    g_set.overlayOn = 1; g_set.onlyInGame = 1; g_set.autoDetect = 1;
    g_set.autoUpdate = 1; g_set.previewZoom = 2; g_set.winAlpha = 97; g_set.previewEnv = 0;
    ZeroMemory(g_libUsed, sizeof(g_libUsed));
    g_nprof = 0;
    ChDefault(&g_ch, 0);

    wchar_t path[MAX_PATH];
    CfgPath(path, MAX_PATH);
    FILE* f = _wfopen(path, L"rt, ccs=UTF-8");
    if (!f) {
        for (int i = 0; i < 3; i++) { ChDefault(&g_lib[i], i); g_libUsed[i] = 1; }
        return;
    }

    Crosshair* target = NULL;
    Profile*   pcur   = NULL;
    wchar_t line[2200];

    while (fgetws(line, 2200, f)) {
        if (line[0] == L'[') {
            int idx = 0;
            if (!wcsncmp(line, L"[settings]", 10)) { target = NULL; pcur = NULL; }
            else if (!wcsncmp(line, L"[crosshair]", 11)) { ChDefault(&g_ch, 0); ZeroMemory(g_ch.px, sizeof(g_ch.px)); target = &g_ch; pcur = NULL; }
            else if (swscanf(line, L"[lib %d]", &idx) == 1 && idx >= 0 && idx < MAXLIB) {
                ChDefault(&g_lib[idx], 0); ZeroMemory(g_lib[idx].px, sizeof(g_lib[idx].px));
                g_libUsed[idx] = 1; target = &g_lib[idx]; pcur = NULL;
            }
            else if (!wcsncmp(line, L"[profile]", 9) && g_nprof < MAXPROFILE) {
                pcur = &g_prof[g_nprof++];
                ZeroMemory(pcur, sizeof(*pcur));
                ChDefault(&pcur->ch, 0);
                ZeroMemory(pcur->ch.px, sizeof(pcur->ch.px));
                target = &pcur->ch;
            }
            continue;
        }

        if (pcur) {
            if (!wcsncmp(line, L"exe ", 4)) {
                wcsncpy(pcur->exe, line + 4, 63); pcur->exe[63] = 0;
                wchar_t* p = wcspbrk(pcur->exe, L"\r\n"); if (p) *p = 0;
                continue;
            }
            if (!wcsncmp(line, L"label ", 6)) {
                wcsncpy(pcur->label, line + 6, 39); pcur->label[39] = 0;
                wchar_t* p = wcspbrk(pcur->label, L"\r\n"); if (p) *p = 0;
                continue;
            }
            int a = 0, b = 0;
            if (swscanf(line, L"autoLaunch %d", &a) == 1) { pcur->autoLaunch = !!a; continue; }
            if (swscanf(line, L"res %d %d", &a, &b) == 2) { pcur->lastW = a; pcur->lastH = b; continue; }
        }

        if (!wcsncmp(line, L"previewImage ", 13)) {
            wcsncpy(g_set.previewImage, line + 13, MAX_PATH - 1);
            g_set.previewImage[MAX_PATH - 1] = 0;
            wchar_t* q = wcspbrk(g_set.previewImage, L"\r\n"); if (q) *q = 0;
            continue;
        }

        if (target && ReadChLine(target, line)) continue;

        wchar_t key[64]; int v;
        if (swscanf(line, L"%63ls %d", key, &v) == 2) {
            if      (!wcscmp(key, L"overlayOn"))  g_set.overlayOn = !!v;
            else if (!wcscmp(key, L"onlyInGame")) g_set.onlyInGame = !!v;
            else if (!wcscmp(key, L"autoDetect")) g_set.autoDetect = !!v;
            else if (!wcscmp(key, L"autoOpen"))   g_set.autoOpenPanel = !!v;
            else if (!wcscmp(key, L"startWin"))   g_set.startWithWindows = !!v;
            else if (!wcscmp(key, L"autoUpdate")) g_set.autoUpdate = !!v;
            else if (!wcscmp(key, L"accent"))     g_set.accent = Clamp(v, 0, 5);
            else if (!wcscmp(key, L"winAlpha2"))  g_set.winAlpha = Clamp(v, 70, 100);
            else if (!wcscmp(key, L"previewEnv")) g_set.previewEnv = Clamp(v, 0, 4);
            else if (!wcscmp(key, L"previewZoom")) g_set.previewZoom = Clamp(v, 1, 8);
        }
    }
    fclose(f);
}

void SetStartWithWindows(int on)
{
    HKEY k;
    if (RegOpenKeyExW(HKEY_CURRENT_USER,
        L"Software\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_SET_VALUE, &k) != ERROR_SUCCESS)
        return;
    if (on) {
        wchar_t exe[MAX_PATH], q[MAX_PATH + 8];
        GetModuleFileNameW(NULL, exe, MAX_PATH);
        _snwprintf(q, MAX_PATH + 8, L"\"%ls\" /tray", exe);
        RegSetValueExW(k, APP_ID, 0, REG_SZ, (const BYTE*)q,
                       (DWORD)((wcslen(q) + 1) * sizeof(wchar_t)));
    } else {
        RegDeleteValueW(k, APP_ID);
    }
    RegCloseKey(k);
}

int ProfileFind(const wchar_t* exe)
{
    if (!exe || !exe[0]) return -1;
    for (int i = 0; i < g_nprof; i++)
        if (!_wcsicmp(g_prof[i].exe, exe)) return i;
    return -1;
}

int ProfileAdd(const wchar_t* exe)
{
    int i = ProfileFind(exe);
    if (i >= 0) return i;
    if (g_nprof >= MAXPROFILE || !exe || !exe[0]) return -1;
    Profile* p = &g_prof[g_nprof];
    ZeroMemory(p, sizeof(*p));
    wcsncpy(p->exe, exe, 63); p->exe[63] = 0;

    wcsncpy(p->label, PrettyGameName(exe), 39);
    p->label[39] = 0;

    p->autoLaunch = 1;
    memcpy(&p->ch, &g_ch, sizeof(Crosshair));
    return g_nprof++;
}
