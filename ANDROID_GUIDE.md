# Hacking the Planet: Your Android Build Guide

You are now the proud owner of a hybrid Android application project. This guide will help you take the code generated in the `android/` folder and turn it into a real `.apk` that you can install on your phone.

## Prerequisites

- **Android Studio**: You MUST have this installed. It includes the Android SDK and build tools. [Download here](https://developer.android.com/studio).
- **Physical Device**: Recommended for testing GPS and maps properly. Connect it to your PC via USB and enable "USB Debugging" in Developer Options.
- **OR Android Emulator**: Built into Android Studio.

## Steps to Build & Run

### 1. Open in Android Studio
The easiest way to open the project is to run this command in your terminal:

```bash
npx cap open android
```

Alternatively, open Android Studio, select **Open**, and navigate to:
`c:\Users\USER\.gemini\antigravity\scratch\petrol-station-tracker\android`

### 2. Wait for Gradle Sync
When you first open the project, Android Studio will start "syncing" Gradle files. This downloads all the native dependencies. **Wait for the progress bar in the bottom right to finish.**

### 3. Run the App
- **Connect your phone** or create a virtual device (AVD).
- Select your device in the toolbar dropdown at the top.
- Click the green **Play** (▶) button.
- The app will build, install, and launch on your device!

### 4. Build a Release APK (for sharing)
To create an APK file you can send to friends:
1. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Wait for the build to finish.
3. A popup will appear saying "APK(s) generated successfully". Click **locate** to find the file (usually in `android/app/build/outputs/apk/debug/`).

## Updating the App
If you make changes to your React code (e.g., in `src/App.jsx`), you need to update the Android version:

1. **Rebuild the web app**:
   ```bash
   npm run build
   ```
2. **Sync changes to Android**:
   ```bash
   npx cap sync
   ```
3. **Re-run** from Android Studio (or just hit the Play button again if it's open).

## Troubleshooting
- **"SDK location not found"**: Make sure you have the Android SDK installed via Android Studio.
- **"Grade sync failed"**: Often due to internet issues or missing SDK tools. Check the error log in Android Studio and click the "Install missing..." links if they appear.
