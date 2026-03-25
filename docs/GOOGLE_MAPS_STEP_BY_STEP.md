# Google Maps API Setup - Complete Step-by-Step Guide

This document captures the exact steps discussed to set up a secure, free-tier Google Maps API integration for your web application.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown near the top-left logo and select **New Project**.
3. Name it (e.g., `Fuel Tracker Lagos`) and click **Create**.

## 2. Enable the Required APIs
1. On the left-hand menu, click the 3 horizontal lines (hamburger menu).
2. Go to **APIs & Services > Library**.
3. Search for and click **Enable** for each of these three APIs:
   * **Distance Matrix API**
   * **Geocoding API**
   * **Places API**

## 3. Create and Secure Your API Key
1. From the left menu, go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **API Key**.
3. Copy the generated key, and immediately click the **Edit Key** option on it.
4. Set **Application restrictions** to **Websites**.
5. Click **+ Add** under Website restrictions and enter:
   * `http://localhost:*` (for your local development)
   * `https://petrol-station-tracker.netlify.app/*` (for your live website)
   * *(Note: Always remember to add the `*` at the end!)*
6. Scroll down to **API restrictions** and select **Restrict key**.
7. Check the boxes for the 3 APIs you enabled in Step 2.
8. Click **Save**.

## 4. Setting Up Billing (Required Verification)
*Google requires a billing account for identity verification to use the Maps platform, even on the free tier.*
1. If prompted (or by going to the **Billing** menu), click to create a **New Billing Account**.
2. Fill out your Organization, Country, and Payment Method.
3. If Google requests a $10 temporary prepayment, this is a standard authorization hold to verify international cards. It will sit as a positive credit balance on your account.
4. Click **Submit and enable billing**.

## 5. Lock Down Your Quotas (Stay 100% Free)
*Because you receive $200 free credit every month, setting a quota guarantees you never get a surprise bill.*
1. Go to **APIs & Services > Enabled APIs & Services**.
2. Scroll to the bottom and click on the **Distance Matrix API** in the table.
3. Click the **Quotas & System limits** tab on that specific API page.
4. Find the row for **Requests per day**, click the pencil icon, and set it to a safe number like **150**. Click Save.
5. Repeat this process for the **Places API** and **Geocoding API** (you can set those to **500** requests per day).

## 6. How to Use the Key in Your App
1. In your code project folder, open (or create) your `.env.local` file.
2. Add the key you created in Step 3 like this:
   `VITE_GOOGLE_MAPS_API_KEY=your_copied_key_here`
3. Restart your local server, and your app will now use the live maps routing!
