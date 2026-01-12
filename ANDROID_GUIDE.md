# Deploying to Google Play Store (TWA)

This guide explains how to package your Petrol Station Tracker as a Trusted Web Activity (TWA) for the Google Play Store.

## Prerequisites

1.  **Deployment**: Your app MUST be deployed to a public HTTPS URL (e.g., via Netlify or Vercel).
    *   Example: `https://my-petrol-tracker.netlify.app`
2.  **Node.js**: Installed on your computer.
3.  **Android Studio** (Optional but recommended for SDKs) OR just the Android Command Line Tools installed.

## Step 1: Install Bubblewrap

Run this command in your terminal to install the Google tool for TWA generation:

```bash
npm i -g @bubblewrap/cli
```

## Step 2: Initialize the Android Project

1.  Create a new folder for the Android project:
    ```bash
    mkdir android-app
    cd android-app
    ```

2.  Run the initialization command:
    ```bash
    bubblewrap init --manifest https://YOUR-APP-URL.netlify.app/manifest.webmanifest
    ```
    *(Replace `YOUR-APP-URL` with your actual live URL)*

3.  **Answer the questions**:
    *   **Domain**: `your-app.netlify.app`
    *   **App Name**: Lagos Petrol Pulse
    *   **Application ID**: `com.petrolpulse.app` (or similar)
    *   **KeyStore**: If you don't have one, Bubblewrap will create one for you. **SAVE THIS FILE!** You need it to update the app later.

## Step 3: Build the App

Once initialized, run:

```bash
bubblewrap build
```

This will generate two files in the folder:
*   `app-release-bundle.aab` (Upload this to Google Play)
*   `app-release-signed.apk` (Install this on your phone to test)

## Step 4: Asset Links (Verification)

To prove you own the website, Bubblewrap will create a file called `assetlinks.json`.

1.  Take this file from the `android-app` folder.
2.  Put it in your web project at: `public/.well-known/assetlinks.json`
3.  Deploy your web app again.
4.  Google Play will now verify your app works.

## Step 5: Upload to Console

1.  Go to [Google Play Console](https://play.google.com/console).
2.  Create App.
3.  Upload the `.aab` file from Step 3.
4.  Fill in store details and screenshots.
