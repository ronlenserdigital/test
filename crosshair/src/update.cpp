#include "app.h"
#include <winhttp.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>

static wchar_t g_status[128] = L"";
static wchar_t g_newVer[32]  = L"";
static wchar_t g_newPath[MAX_PATH] = L"";
static wchar_t g_dlUrl[512]  = L"";
static BOOL    g_have = FALSE;
static BOOL    g_busy = FALSE;

const wchar_t* UpdateStatusText(void) { return g_status; }
BOOL UpdateAvailable(void) { return g_have; }

// GET a URL into a heap buffer (caller frees). host+path split, https only.
static char* HttpGet(const wchar_t* host, const wchar_t* path, DWORD* outLen)
{
    char*  buf = NULL;
    DWORD  cap = 0, len = 0;
    HINTERNET s = WinHttpOpen(L"DeadCenter/" APP_VER,
                              WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
                              WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!s) return NULL;
    HINTERNET c = WinHttpConnect(s, host, INTERNET_DEFAULT_HTTPS_PORT, 0);
    if (c) {
        HINTERNET r = WinHttpOpenRequest(c, L"GET", path, NULL, WINHTTP_NO_REFERER,
                                         WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
        if (r) {
            if (WinHttpSendRequest(r, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                                   WINHTTP_NO_REQUEST_DATA, 0, 0, 0) &&
                WinHttpReceiveResponse(r, NULL)) {
                DWORD code = 0, sz = sizeof(code);
                WinHttpQueryHeaders(r, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                                    NULL, &code, &sz, NULL);
                if (code == 200) {
                    cap = 65536;
                    buf = (char*)malloc(cap);
                    DWORD got = 0;
                    while (buf && WinHttpReadData(r, buf + len, cap - len - 1, &got) && got) {
                        len += got;
                        if (len + 4096 >= cap) {
                            if (cap > 64u * 1024 * 1024) break;
                            cap *= 2;
                            char* n = (char*)realloc(buf, cap);
                            if (!n) { free(buf); buf = NULL; break; }
                            buf = n;
                        }
                    }
                    if (buf) buf[len] = 0;
                }
            }
            WinHttpCloseHandle(r);
        }
        WinHttpCloseHandle(c);
    }
    WinHttpCloseHandle(s);
    if (outLen) *outLen = len;
    return buf;
}

// minimal "key":"value" extractor
static BOOL JsonStr(const char* json, const char* key, wchar_t* out, int cch)
{
    char pat[64];
    _snprintf(pat, 64, "\"%s\"", key); pat[63] = 0;
    const char* p = strstr(json, pat);
    if (!p) return FALSE;
    p = strchr(p + strlen(pat), ':');
    if (!p) return FALSE;
    while (*p && *p != '"') p++;
    if (!*p) return FALSE;
    p++;
    const char* e = strchr(p, '"');
    if (!e) return FALSE;
    int n = (int)(e - p);
    if (n >= cch) n = cch - 1;
    MultiByteToWideChar(CP_UTF8, 0, p, n, out, cch);
    out[n] = 0;
    return TRUE;
}

static int VerNum(const wchar_t* v)
{
    int a = 0, b = 0, c = 0;
    swscanf(v, L"%d.%d.%d", &a, &b, &c);
    return a * 10000 + b * 100 + c;
}

// split "https://host/path" -> host, path
static BOOL SplitUrl(const wchar_t* url, wchar_t* host, int hc, wchar_t* path, int pc)
{
    const wchar_t* p = wcsstr(url, L"://");
    if (!p) return FALSE;
    p += 3;
    const wchar_t* slash = wcschr(p, L'/');
    if (!slash) return FALSE;
    int n = (int)(slash - p);
    if (n >= hc) return FALSE;
    wcsncpy(host, p, n); host[n] = 0;
    wcsncpy(path, slash, pc - 1); path[pc - 1] = 0;
    return TRUE;
}

struct Job { HWND notify; BOOL silent; };

static DWORD WINAPI Worker(LPVOID arg)
{
    Job* j = (Job*)arg;
    wcscpy(g_status, L"Checking for updates...");
    if (j->notify) PostMessageW(j->notify, WM_UPDATE, 0, 0);

    DWORD len = 0;
    char* json = HttpGet(UPDATE_HOST, UPDATE_PATH, &len);
    if (!json) {
        wcscpy(g_status, L"Update check failed - no connection.");
    } else {
        wchar_t ver[32] = L"", url[512] = L"";
        if (JsonStr(json, "version", ver, 32) && JsonStr(json, "url", url, 512) &&
            VerNum(ver) > APP_VERNUM) {
            wcsncpy(g_newVer, ver, 31);
            wcsncpy(g_dlUrl, url, 511);
            g_have = TRUE;
            _snwprintf(g_status, 128, L"Version %s is available.", ver);
        } else {
            _snwprintf(g_status, 128, L"You are up to date (v%s).", APP_VER);
        }
        g_status[127] = 0;
        free(json);
    }
    if (j->notify) PostMessageW(j->notify, WM_UPDATE, 0, 0);
    free(j);
    g_busy = FALSE;
    return 0;
}

void UpdateCheckAsync(HWND notify, BOOL silent)
{
    if (g_busy) return;
    g_busy = TRUE;
    Job* j = (Job*)malloc(sizeof(Job));
    if (!j) { g_busy = FALSE; return; }
    j->notify = notify; j->silent = silent;
    HANDLE h = CreateThread(NULL, 0, Worker, j, 0, NULL);
    if (h) CloseHandle(h); else { free(j); g_busy = FALSE; }
}

void UpdateInstall(void)
{
    if (!g_have || !g_dlUrl[0]) return;

    wchar_t host[128], path[512];
    if (!SplitUrl(g_dlUrl, host, 128, path, 512)) { wcscpy(g_status, L"Bad update URL."); return; }

    wcscpy(g_status, L"Downloading...");
    ShellRedraw();

    DWORD len = 0;
    char* data = HttpGet(host, path, &len);
    if (!data || len < 4096) {
        if (data) free(data);
        wcscpy(g_status, L"Download failed.");
        ShellRedraw();
        return;
    }

    wchar_t tmp[MAX_PATH];
    GetTempPathW(MAX_PATH, tmp);
    _snwprintf(g_newPath, MAX_PATH, L"%s%s_%s.exe", tmp, APP_ID, g_newVer);
    g_newPath[MAX_PATH - 1] = 0;

    HANDLE f = CreateFileW(g_newPath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, 0, NULL);
    if (f == INVALID_HANDLE_VALUE) { free(data); wcscpy(g_status, L"Cannot write update."); return; }
    DWORD wrote = 0;
    WriteFile(f, data, len, &wrote, NULL);
    CloseHandle(f);
    free(data);
    if (wrote != len) { wcscpy(g_status, L"Write incomplete."); return; }

    // swap ourselves out after we exit, then relaunch
    wchar_t self[MAX_PATH], script[MAX_PATH], cmd[MAX_PATH * 3];
    GetModuleFileNameW(NULL, self, MAX_PATH);
    _snwprintf(script, MAX_PATH, L"%s%s_update.cmd", tmp, APP_ID);
    script[MAX_PATH - 1] = 0;

    FILE* s = _wfopen(script, L"wt");
    if (!s) { wcscpy(g_status, L"Cannot stage update."); return; }
    fwprintf(s, L"@echo off\r\n");
    fwprintf(s, L"ping -n 3 127.0.0.1 >nul\r\n");
    fwprintf(s, L":retry\r\n");
    fwprintf(s, L"move /y \"%s\" \"%s\" >nul 2>&1\r\n", g_newPath, self);
    fwprintf(s, L"if errorlevel 1 (ping -n 2 127.0.0.1 >nul & goto retry)\r\n");
    fwprintf(s, L"start \"\" \"%s\"\r\n", self);
    fwprintf(s, L"del \"%%~f0\"\r\n");
    fclose(s);

    _snwprintf(cmd, MAX_PATH * 3, L"/c \"%s\"", script);
    ShellExecuteW(NULL, L"open", L"cmd.exe", cmd, NULL, SW_HIDE);
    AppExit();
}
