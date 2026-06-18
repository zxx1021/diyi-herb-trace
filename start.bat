@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 地宜本草溯源系统

:: ── 自动获取本机局域网IP ──
set LAN_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    set IP=!IP: =!
    if not "!IP!"=="127.0.0.1" (
        if not defined LAN_IP set LAN_IP=!IP!
    )
)
if not defined LAN_IP set LAN_IP=localhost

echo ========================================
echo   地宜本草溯源系统 - 山西道地药材
echo   一药一码溯源系统
echo   本机IP: !LAN_IP!
echo ========================================
echo.

:: ── 设置QR码URL ──
set TRACE_BASE_URL=http://!LAN_IP!:5173/trace/

echo [1/2] 启动后端服务 ^(端口3001^)...
start "地宜本草-后端" cmd /c "set TRACE_BASE_URL=!TRACE_BASE_URL! && cd /d %~dp0server && node index.js"

:: 等后端初始化(QR码生成需要时间)
timeout /t 4 /nobreak >nul

echo [2/2] 启动前端服务 ^(端口5173^)...
start "地宜本草-前端" cmd /c "cd /d %~dp0client && npx vite --host 0.0.0.0"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   电脑访问: http://localhost:5173
echo   手机扫码: QR码内置 http://!LAN_IP!:5173/trace/
echo ========================================
echo.
echo 关闭此窗口不会影响服务运行
pause
