#!/bin/sh
# Cross-compile DeadCenter.exe from Linux (needs g++-mingw-w64-x86-64)
set -e
CXX=${CXX:-x86_64-w64-mingw32-g++}
mkdir -p build
$CXX -municode -mwindows -Os -s -fno-rtti -static -static-libgcc -static-libstdc++ \
    -o build/DeadCenter.exe src/main.cpp src/ui.cpp src/render.cpp src/overlay.cpp \
       src/config.cpp src/update.cpp src/icons.cpp \
    -lgdi32 -luser32 -lshell32 -lcomdlg32 -lgdiplus -lole32 -ladvapi32 -lpsapi -lwinhttp
ls -l build/DeadCenter.exe
