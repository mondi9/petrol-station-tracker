# Petrol Station Tracker - Project Overview & Changelog

## ⚠️ Problems Addressed
This application was created to solve several critical pain points in the Nigerian fuel retail landscape:
*   **Data Opacity**: Official prices are often different from pump prices, and availability changes by the hour.
*   **Time Waste**: Drivers often queue for hours at stations that run out of fuel mid-way through their wait.
*   **"Ghost" Stations**: Many stations are listed on maps (Google/Apple) but are permanently closed or used only for storage.
*   **GPS Imprecision**: Traditional mapping apps often fail at "last-mile" navigation for local stations in high-density areas.

## 🎯 Core Objectives
1.  **Democratize Information**: Give power to the community to report real-time availability and prices.
2.  **Optimize Logistics**: Help individual drivers and fleet managers save fuel and time by navigating only to stations with verified stock and short queues.
3.  **Real-time Transparency**: Create a living map that reflects the actual state of the city's fuel supply at any given minute.
4.  **High-Precision Navigation**: Ensure that even in areas with weak GPS, users can pinpoint exact station locations for others to find.

---

## 🏗️ Project Architecture
This application is a real-time fuel station crowdsourcing platform built with **React**, **Firebase**, and **Leaflet**. It focuses on solving the "last mile" navigation problem by providing accurate, community-verified data on fuel availability and queue lengths.

---

## 🚛 Feature Spotlight: Fleet Command (Fleet Dashboard)
The **Fleet Dashboard** is an enterprise-grade extension designed for business logistics and fleet managers.

### Core Objectives:
*   **Depot-Centric Logistics**: Unlike the main map (which follows the user), the Fleet view calculates all distances relative to fixed **Depots** (e.g., Apapa, Ikeja).
*   **Operational Control**: High-density table view allows managers to sweep the entire Lagos area for the shortest queues and lowest prices.
*   **Strategic Analytics**: Features a "Fleet Analytics" tab with pie charts for network-wide availability and bar charts for price trends.
*   **Data Portability**: Includes a "Green Export" tool to download all current station status data into CSV format for accounting and fuel expense reports.

---

## 📝 Recent Improvements & Bug Fixes

### 📍 High Precision Location System (NEW)
*   **Meter-Level Accuracy**: Distances under 1km now display in meters (e.g., "15m", "212m") instead of rounded kilometers.
*   **Manual Pinning**: Users can now **Click on the Map** to override imprecise GPS. This is essential for users in weak signal areas (accuracy labels now show ±m).
*   **Diagnostic Nearest Panel**: The "Find Nearest" button now provides a "Top 3" diagnostic list with GPS accuracy telemetry, ensuring users can see proximity results transparently.

### ⚙️ Admin & Database Repairs
*   **Festac Cluster Correction**: Resolved a major data discrepancy where **MRS Festac** and **AP (Ardova)** coordinates were swapped or misaligned.
*   **Sync Tool**: Implemented a "Repair Festac Cluster Coords" button in the Admin Dashboard to instantly fix neighborhood-wide data errors using validated coordinates.
*   **Dashboard Stability**: Fixed a crash caused by missing props (`onUpdateMRS`) and undefined state labels.

### 🎨 UI & UX Polish
*   **Currency Localization**: Removed all legacy `$` icons and replaced them with `₦` symbols and localized financial icons (Banknote) to ensure the app feels native to the Nigerian market.
*   **Queue Intensity Mapping**: Station markers now feature real-time status icons (✅ Short, ⏳ Medium, 🚨 Long) directly on the map.
*   **Map Legend**: A persistent helper panel on the map clarifies the color-coding and icon system for new users.
*   **Navigation Cleanup**: Removed redundant "Nearest" sorting options from the sidebar to focus on the map-based navigation.
*   **Status Indicators**: Standardized queue status colors (Green = Short, Yellow = Medium, Red = Long).
*   **Real-time Subscriptions**: Robust Firebase listeners ensure prices and queue lengths update live without manual refreshing.

---

## 🚀 Future Roadmap
The following features are planned for future development to enhance the platform's utility and accuracy:

### 1. 🥇 Trust & Verification
*   **Trust Scores**: Implement a "verified reporter" system where consistent data contributors gain higher credibility.
*   **Photo Evidence**: Support for uploading real-time photos of station price boards and queue lengths.
*   **Freshness Decay**: Automatic reporting score degradation to encourage frequent updates during peak hours.

### 2. 🗺️ Advanced Logistics & Routing
*   **Traffic Integration**: Combine drive-time traffic data with queue-length reports for a true "Total Time to Fuel" metric.
*   **Savings Calculator**: An ROI engine to determine if driving to a cheaper station further away is mathematically beneficial.
*   **National Price Index**: A macro view of fuel trends across different Nigerian states and cities.

### 3. 💼 Enterprise & Fleet Tools
*   **Fleet Dispatch**: Tools for fleet managers to push recommended stations directly to driver mobile devices.
*   **Fuel Expense Logging**: Digital logs for liters purchased and costs, with exportable monthly accounting reports.
*   **Voucher Integration**: Collaboration with retail partners for in-app digital fuel voucher redemption.

### 4. 📱 Connectivity & Offline Access
*   **Offline Neighborhoods**: Pre-downloaded map tiles for common neighborhoods (e.g., Festac, Amuwo) for use in low-data areas.
*   **SMS Bridge**: Support for station updates via offline SMS gateways for users without active data plans.
*   **Full PWA Support**: Conversion to a Progressive Web App for home-screen installation without an app store.

---

## 🛠️ Tech Stack
*   **Frontend**: React (Vite), Lucide-React Icons
*   **Mapping**: Leaflet + React-Leaflet, OpenStreetMap/CARTO tiles
*   **Backend**: Firebase Firestore (Real-time DB), Firebase Auth
*   **Service Layer**: Custom OSM import system (osmService) and Geo-calculation utilities.
