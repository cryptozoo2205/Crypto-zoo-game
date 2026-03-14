@echo off
echo =============================
echo CRYPTO ZOO START
echo =============================

start "BACKEND" cmd /k "cd /d C:\Users\Admin\crypto-zoo-game\backend && node index.js"

timeout /t 2 >nul

start "BOT" cmd /k "cd /d C:\Users\Admin\crypto-zoo-game\backend && node bot.js"

timeout /t 2 >nul

start "NGROK" cmd /k "cd /d D:\Programy\ngrok && ngrok.exe http 3000"

exit