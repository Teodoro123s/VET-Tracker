@echo off
echo Building VetClinic with SDK 54 compatibility...

echo.
echo Cleaning previous builds...
call npx expo install --fix
call npx expo prebuild --clean

echo.
echo Building for Android (SDK 54)...
call npx expo run:android

echo.
echo Building for Web...
call npx expo export:web

echo.
echo Build completed! SDK 54 is now active with web compatibility maintained.
pause