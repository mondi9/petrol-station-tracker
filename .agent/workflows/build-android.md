---
description: How to build and export a standalone Android APK
---

### 1. Build the Web Application
Ensure your latest changes are compiled:
```bash
npm run build
```

### 2. Sync with Android Project
Copy the web build into the native Android source:
```bash
npx cap sync android
```

### 3. Open in Android Studio
If not already open:
```bash
npx cap open android
```

### 4. Generate the APK/Bundle
In Android Studio:
1. Go to **Build** > **Generate Signed Bundle / APK...**
2. Choose **APK** (for testing) or **App Bundle** (for Play Store).
3. Follow the wizard to create a new keystore (if it's your first time) or use an existing one.
4. Select **release** build variant.
5. Once finished, a popup will appear with a link to the folder containing your `app-release.apk`.

### 5. Install on Device
You can copy the `app-release.apk` to any Android phone and install it directly!
