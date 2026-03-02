# Google Play Store Submission Guide 🚀

Putting your app on the Play Store is a multi-step process. Here is your roadmap to going from a local project to a global app.

## 1. Prerequisites
*   **Google Play Console Account**: You need to register at [play.google.com/console](https://play.google.com/console). There is a **$25 one-time registration fee**.
*   **Privacy Policy URL**: Google requires a public URL for your Privacy Policy. (We can host this on your Netlify site).
*   **Digital Assets**:
    *   **App Icon**: 512x512px (PNG/WEBP).
    *   **Feature Graphic**: 1024x500px (PNG/WEBP).
    *   **Screenshots**: At least 4 screenshots of the app in action.

---

## 2. Generate a Signed Release Bundle (.aab)
Google no longer accepts `.apk` files for new apps; you must use the **Android App Bundle (.aab)** format.

1.  In Android Studio, go to **Build > Generate Signed Bundle / APK...**
2.  Select **Android App Bundle** and click Next.
3.  **Key store path**: Click "Create new" if you don't have one. 
    > [!IMPORTANT]
    > **Save your KeyStore file and passwords!** If you lose them, you can NEVER update your app again. Backup this file in a safe place (not just on your computer).
4.  Fill in the KeyStore details (Alias, Password, Validity) and click Next.
5.  Select **release** as the Build Variant.
6.  Click **Finish**. Your `.aab` file will be generated in `android/app/release/`.

---

## 3. Play Store Setup
1.  Log into your **Play Console**.
2.  Click **Create app** and fill in the basic details (Name, Default language, App or Game, Free or Paid).
3.  Complete the **"Set up your app"** tasks (App access, Ads, Content rating, Target audience, etc.).

---

## 4. Upload & Testing
1.  Go to **Production** (or **Internal testing** for a quick trial).
2.  Create a new release.
3.  Upload the `.aab` file you generated in Step 2.
4.  Review and rollout!

---

## 5. Helpful Tips for "FuelPulse"
*   **Location Permission**: Since your app uses GPS, you must provide a "Prominent Disclosure" and a "Location Rationale" video or explanation to Google during the review.
*   **Testing**: Use the **Internal Testing** track first. You can invite up to 100 people to test the app via a private link before it goes public.
*   **Store Listing**: Use keywords like "Lagos Petrol", "Price Tracker", and "Fuel Scarcity" in your description to help users find the app.

---

**Need help with any specific step?** I can help you draft the Privacy Policy or the Store Description!
