@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 竹影c 服务器官网 - 本地预览

echo.
echo   正在启动本地预览服务器 ...
echo   地址： http://127.0.0.1:8910/
echo   关闭本窗口即停止。
echo.

set PORT=8910

where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:%PORT%/
  python -m http.server %PORT%
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:%PORT%/
  py -m http.server %PORT%
  goto :end
)

where npx >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:%PORT%/
  npx --yes http-server -p %PORT%
  goto :end
)

echo   没找到 Python 或 Node，直接用浏览器打开 index.html 也行。
start "" "%~dp0index.html"
pause

:end