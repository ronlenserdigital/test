#!/bin/sh
# Cross-compile PixelCross.exe from Linux (needs g++-mingw-w64-x86-64)
set -e
CXX=${CXX:-x86_64-w64-mingw32-g++}
mkdir -p build
$CXX -municode -mwindows -O2 -s -fno-exceptions -fno-rtti -static -static-libgcc -static-libstdc++ \
    -o build/PixelCross.exe src/main.cpp src/ui.cpp src/overlay.cpp src/config.cpp \
    -lgdi32 -luser32 -lshell32 -lcomdlg32 -lgdiplus -lole32 -ladvapi32 -lpsapi
ls -l build/PixelCross.exe
