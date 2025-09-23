@echo off
echo Starting Firebase Admin Server...
cd /d "%~dp0"
node api/update-password.js
pause