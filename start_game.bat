@echo off
echo =============================
echo CRYPTO ZOO START
echo =============================

start cmd /k "cd backend && node index.js"

timeout /t 3

start cmd /k "cd backend && node bot.js"

timeout /t 3

start cmd /k "ngrok http 3000"

echo =============================
echo SERVER STARTED
echo =============================
pause