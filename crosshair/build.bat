@echo off
REM Build DeadCenter.exe with MSVC (open a "x64 Native Tools Command Prompt")
if not exist build mkdir build
cl /nologo /W3 /O1 /Os /GS- /MT /EHsc /DUNICODE /D_UNICODE ^
   src\main.cpp src\ui.cpp src\render.cpp src\overlay.cpp src\config.cpp src\update.cpp src\capture.cpp ^
   /Fe:build\DeadCenter.exe /Fo:build\ ^
   /link /SUBSYSTEM:WINDOWS /ENTRY:wWinMainCRTStartup ^
   gdi32.lib user32.lib shell32.lib comdlg32.lib gdiplus.lib ole32.lib advapi32.lib winhttp.lib
echo.
dir build\DeadCenter.exe
