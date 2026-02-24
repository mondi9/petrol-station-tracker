# Android Asset Generation Guide

To ensure your app has a professional icon and splash screen on the Play Store, follow these steps to replace the default Capacitor branding with your custom logo.

## 1. Prepare your Source Logo
- Create a high-quality logo file named `logo.png` (at least 1024x1024 pixels).
- Place it in a new folder at `assets/logo.png`.

## 2. Use `capacitor-assets`
Capacitor has a dedicated tool to generate all the different sizes for Android automatically.

### Installation
Run this in your terminal:
```powershell
npm install @capacitor/assets --save-dev
```

### Generation Command
Run this command to sweep through your Android project and update all icons/splash screens:
```powershell
npx capacitor-assets generate --android
```

## 3. Manual Update (If tool is not used)
If you prefer to do it manually, you must replace the files in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (App Icon)
- `android/app/src/main/res/drawable/splash.png` (Splash Screen)

## 4. Verify in Android Studio
1. Open Android Studio via `npx cap open android`.
2. Clean the project: **Build > Clean Project**.
3. Run the app on your device to see the new icon.
