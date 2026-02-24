---
description: Steps to publish Lagos Petrol Pulse to the Google Play Store
---

### 1. The Legal & Admin Part
To put an app on the Play Store, you need:
- **Google Play Console Account**: A one-time $25 fee to Google.
- **Privacy Policy**: A simple webpage or document stating how you handle user data.

### 2. The Technical Part
Instead of the APK we mentioned earlier, Google now requires an **Android App Bundle (.aab)**.
1. In Android Studio: **Build** > **Generate Signed Bundle / APK** > **Android App Bundle**.
2. Keep your **Keystore file** safe! If you lose it, you can never update the app again.

### 3. Store Listing Assets
You will need to provide:
- **App Icon**: 512x512px.
- **Feature Graphic**: 1024x500px.
- **Screenshots**: At least 2-4 screenshots of the app in action (the ones you took in Android Studio are perfect).
- **Description**: A short and long description of what "Lagos Petrol Pulse" does.

### 4. Submission & Review
1. Upload the `.aab` file to the Play Console.
2. Fill out the content rating and target audience forms.
3. Submit for review.
   - **Note**: It usually takes **3 to 7 days** for Google to review and approve the first version.

### 5. "Is it live?"
- **Right now**: No, it is only "Internal" (running on your emulator/phone).
- **Web Version**: If you have deployed the code to a URL (like Netlify), that URL is live, but the Android App itself is not public until you finish the steps above.
