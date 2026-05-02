# 🚀 Capgo & Play Store: Reference Guide

This document contains everything you need to know about your current **Capgo OTA (Over-The-Air)** setup and the **Google Play Store** release process.

---

## ⚡ Capgo (Live Updates)

Your app is now integrated with Capgo. This means you can update the **Javascript, CSS, and UI** of your app instantly without users needing to download a new version from the Play Store.

### 🛠️ Common Commands

| Task | Command |
| :--- | :--- |
| **Login to Capgo** | `npm run capgo:login` |
| **Push Live Update** | `npm run build` then `npm run capgo:upload` |
| **List All Updates** | `npm run capgo:list` |
| **Delete an Update** | `npm run capgo:delete` |

### 🔍 How to Verify
1. Open the app on your phone.
2. Go to **User Profile**.
3. At the bottom, you will see a **Version ID**. When you push a new Capgo update, this ID will change within a few seconds of opening the app!

---

## 🤖 Android Build Process

Whenever you make a major change that involves a new plugin or a native configuration change (like the Capgo setup we just did), you must sync your project.

### 🔄 The "Sync" Workflow
1. **Build Web App**: `npm run build`
2. **Sync Capacitor**: `npx cap sync android`
3. **Open Android Studio**: `npx cap open android`
4. **Deploy**: Click the **Green Play (▶)** button in Android Studio.

---

## 🏪 Google Play Store (Current Status)

We have started the preparation for the official store release. 

### 📍 Current Progress:
- [x] **App ID**: `com.petrolstation.tracker` (Confirmed)
- [x] **Version Code**: `1`
- [x] **Version Name**: `1.0.0`
- [ ] **Create Developer Account**: (User Action - $25 at [Play Console](https://play.google.com/apps/publish))
- [ ] **Generate Release Keystore**: (Next Step - Pending password choice)
- [ ] **Build App Bundle (.aab)**: (Pending signing setup)

### ⚠️ Critical Step: Generating the Keystore & App Bundle

This is the process to create your production-ready Android package.

1. Open Android Studio via terminal: `npx cap open android`
2. Wait for background indexing to finish (bottom loading bars disappear).
3. In the top-left menu, go to **Build** -> **Generate Signed Bundle / APK...**
4. Select **Android App Bundle** and click **Next**.
5. Under **Key store path**, click **Create new...**.
6. Fill out the New Key Store form carefully:
   * **Key store path**: Click the folder icon, navigate to `android/app`, and name the file `release.keystore`.
   * **Password**: Create a very strong password. *(You must write this down!)*
   * **Alias**: `petrolpulse`
   * **Key Password**: Use the same password.
   * **Certificate Info**: Fill in your First/Last Name and City.
7. Click **OK**, then click **Next**.
8. Select the **release** filter, and click **Create**.

> [!CAUTION]
> **Keep your `release.keystore` file and password completely safe.** If you ever lose this file, you will permanently lose the ability to push updates for this app on the Google Play Store.

---

## 💰 Costs & Pricing

| Service | Cost | NGN Estimate* | Type |
| :--- | :--- | :--- | :--- |
| **Google Play Developer Account** | $25 USD | ~₦34,500 | One-time, lifetime access |
| **Capgo (Live updates)** | $0 to start | ₦0 | Free up to 1,000 monthly active devices |

*(Note: NGN estimates based on ~₦1,380 parallel market rate; banks may charge slightly more).*

---

## ⏱️ Google Verification Timelines

Google has strict review processes for new developers.

### 1. Developer Account Verification
* **Time:** 24 to 48 hours.
* **Requirement:** Must upload a valid Government ID (International Passport, Driver's License, or NIN card).

### 2. App Review Time
* **Time:** Up to 7 days for the very first app release.

> [!WARNING]
> **The 20-Tester Rule (For New Personal Accounts)**
> If you create a "Personal" developer account, Google requires you to run a **Closed Test** before going public.
> You must get **20 people** to opt-in and keep your app installed for **14 consecutive days**. You can only apply for production access after this period.
> *(If you register as a Company/Organization account, this rule is waived).*

---

**Last Updated**: April 9, 2026
**Current Phase**: Capgo Integration Complete / Play Store Signing Pending
