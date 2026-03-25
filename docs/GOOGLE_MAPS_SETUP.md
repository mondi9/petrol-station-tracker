# Google Maps API Setup Guide (Lagos Fuel Tracker)

Follow these steps to enable traffic-aware routing in your application while staying 100% within the free usage tier.

## 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown in the top left and select **"New Project"**.
3.  Name it `Fuel-Tracker-Lagos` and click **Create**.

## 2. Enable Required APIs (The "Pro" Tier)
1.  Navigate to **APIs & Services > Library**.
2.  Search for and enable the following:
    *   **Distance Matrix API** (provides traffic-aware drive times)
    *   **Geocoding API** (provides precise coordinate lookups)
    *   **Places API** (provides high-quality search/autocomplete)

## 3. Create and Restrict Your API Key
1.  Go to **APIs & Services > Credentials**.
2.  Click **+ Create Credentials > API Key**.
3.  Copy the key, but click **"Edit Key"** immediately to secure it.
4.  Under **Set an application restriction**, select **"Websites"**.
5.  Add your Netlify domain (e.g., `https://your-app.netlify.app/*`) and `http://localhost:*` for development.
6.  Under **API restrictions**, select **"Restrict key"** and check the three APIs mentioned in Step 2. This prevents the key from being used for other expensive services.

## 4. Set "Never-Pay" Quotas (VERY IMPORTANT)
This ensures you stay within the 2025 free tier limits.
1.  Go to **APIs & Services > Enabled APIs & Services**.
2.  Click on **Distance Matrix API**.
3.  Click the **Quotas** tab.
4.  Find **Requests per day** and click the pencil icon to edit.
5.  Set it to a safe number like **150 requests per day** (which is roughly 4,500 elements/month—well under the 5,000 free element limit).

## 5. Add the Key to Your App
1.  In your project root, create a file named `.env.local` (it is already in `.gitignore`).
2.  Add your key:
    ```bash
    VITE_GOOGLE_MAPS_API_KEY=your_copied_key_here
    ```
3.  Restart your development server (`npm run dev`).

## 6. How to Verify
1.  Open your app and click **"Find Nearest"**.
2.  The toast notification should now say **"⚡ Traffic-aware road routing"** instead of the fallback message.
3.  Check the browser console (F12) to ensure no "API Key restricted" errors appear.

## 7. ⚠️ Technical Note: CORS
If you call the Google Maps API directly from a browser, it may fail due to **CORS (Cross-Origin Resource Sharing)**. 

**Fix 1: Proxy (Recommended)**
Call the API through a Netlify Function or a backend proxy. This also keeps your API key secure.

**Fix 2: Official SDK**
Use the `@googlemaps/js-api-loader` package to load the Maps JavaScript API, which handles some cross-origin communication for you.
