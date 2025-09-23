@echo off
echo Installing React Native Firebase...

npm install @react-native-firebase/app
npm install @react-native-firebase/auth  
npm install @react-native-firebase/firestore

echo Firebase packages installed!
echo.
echo Next steps:
echo 1. Add google-services.json to project root
echo 2. Add GoogleService-Info.plist to project root  
echo 3. Run: npx expo prebuild
echo 4. Run: npx expo run:android or npx expo run:ios

pause