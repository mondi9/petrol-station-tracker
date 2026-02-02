# System Architecture

## Overview
Lagos Petrol Pulse is a React-based Progressive Web App (PWA) designed to track the operational status of petrol stations in real-time. It uses Firebase for its backend (Authentication, Firestore Database) and Leaflet for map visualizations.

## Technology Stack
- **Frontend**: React (Vite), Vanilla CSS (Glassmorphism design), Leaflet Map
- **Backend Service**: Firebase (Firestore, Auth)
- **Deployment**: Netlify (configured via `netlify.toml`), capable of PWA features.
- **Languages**: JavaScript (ES6+), CSS3

## Data Model (Firestore)

### 1. `stations` Collection
Stores information about each petrol station.

**Document Structure:**
```json
{
  "id": "string (auto-generated or imported ID)",
  "name": "string",
  "address": "string",
  "area": "string",
  "coords": {
    "lat": number,
    "lng": number
  },
  "status": "active" | "inactive",
  "lastUpdated": "timestamp",
  "reports": number, // Count of user reports
  "waitTime": "string" // Legacy field, currently unused
}
```

### 2. `reviews` Sub-collection
Located under `stations/{stationId}/reviews`. Stores user reviews for a specific station.

**Document Structure:**
```json
{
  "id": "string (auto-generated)",
  "userId": "string (uid)",
  "userName": "string (email)",
  "rating": number (1-5),
  "text": "string",
  "timestamp": "timestamp"
}
```

### 3. `users` Collection
Stores user profiles and role information.

**Document Structure:**
```json
{
  "id": "string (uid matching Auth)",
  "email": "string",
  "role": "admin" | "user", // Controls access
  "createdAt": "timestamp"
}
```

## Security & Roles (RBAC)

The application implements Role-Based Access Control (RBAC) using Firestore Security Rules.

### Roles
1.  **Guest (Unauthenticated)**
    *   Read Stations: Yes
    *   Read Reviews: Yes
    *   Write: None

2.  **User (Authenticated)**
    *   Report Status: Yes (Only specific fields: `status`, `lastUpdated`)
    *   Add Review: Yes
    *   Delete Review: Only their own
    *   View Admin UI: No

3.  **Admin**
    *   Create/Delete Stations: Yes
    *   Edit All Station Fields: Yes
    *   Delete Any Review: Yes
    *   Promote Users: Yes (via managing `users` collection)
    *   Access "Import Data" and manual "Add Station" tools.

## Key Components

- **`MapComponent`**: Renders the Leaflet map, handles markers and clustering.
- **`StationList`**: Displays the sidebar list of stations with filters.
- **`AuthModal`**: Handles Sign In / Sign Up flows.
- **`StationService`**: (Data Layer) Abstraction for Firestore operations (subscribeToStations, updateStatus, addReview, etc.).
