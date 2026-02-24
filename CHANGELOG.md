# Changelog

All notable changes to the "FuelPulse" project will be documented in this file.

## [0.7.0] - 2026-01-17
### Added
- **Enhanced Map Popups**: Now shows reporter name, color-coded queue status, and clearer price list.
- **Fleet Dashboard**: Fully responsive mobile layout (stackable view).

### Changed
- **Mobile Navigation**: More compact footer with larger touch targets for better responsiveness.
- **UI Polish**: Fixed duplicate filter bars, improved Profile Modal responsiveness.

## [0.6.0] - 2026-01-14
### Added
- **Smart Navigation**: Added "Near Me" button to center map on user location.
- **External Maps**: Added deep links to open Station location in **Google Maps** or **Waze**.
- **Admin Roles**: Implemented strict RBAC. Created `users` collection to store roles.
- **Admin Tools**: Feature to promote other users to admin status.

### Changed
- **Removed**: "Wait Time" reporting feature (removed in favor of smart navigation).
- **Navigation**: Improved "Find Nearest Station" logic.

## [0.9.0] - 2026-02-17
### Added
- **Travel Time Estimates**: Integrated OSM-based travel duration for the top 3 nearest stations.
- **Trust UX System**: Added reliability badges, microcopy for data uncertainty, and report verification UI.
- **AI Price Extraction**: Mock OCR service to automatically detect fuel prices from uploaded photos.
- **Global Price Alerts**: Users can now set alerts for "Any Station" within the general vicinity.
- **Android Sync**: Full synchronization of web code to native Android using Capacitor.

## [0.8.0] - 2026-02-11
### Changed
- **Queue Status Refinement**: Renamed "Medium" queue status to "Mild" for better clarity.
- **Labeling Logic**: Improved status display for "No Queue" and "Unknown" states.

## [0.7.5] - 2026-02-07
### Added
- **Smart Price Alerts**: Initial implementation of target price notifications.
- **Any Station Toggle**: Option to set alerts globally instead of per-station.

## [Unreleased]
- Proposed: Gamification, Admin Dashboard UI Polishing.

## [0.5.0] - 2026-01-05
### Added
- **User Reviews & Ratings**: Users can now rate stations (1-5 stars) and leave text reviews.
- **Mobile responsiveness**: improved layout for mobile devices (touch-friendly, better spacing).
- **ReviewList Component**: Displays recent reviews for each station.
- **AddReviewModal**: Interface for submitting new reviews.

## [0.4.0] - 2026-01-04
### Added
- **User Authentication**: Integrated Firebase Authentication (Email/Password).
- **AuthModal**: Sign Up and Login interface.
- **Protected Routes**: "Import Data", "Fix Addresses", and "Add Station" now require login.
- **User Context**: App now tracks logged-in user state.

## [0.3.0] - 2026-01-03
### Changed
- **Database Migration**: Migrated from local mock data to **Firebase Firestore**.
- **Real-time Updates**: Station status updates now reflect instantly across all devices.
- **Data Service Refactor**: `stationService.js` now communicates with Firestore.

### Fixed
- **Address Handling**: Debugged and improved the "Fix Addresses" functionality.

## [0.2.0] - 2025-12-30
### Added
- **Project Structure**: Initialized React + Vite application.
- **Documentation**: Created `README.md` with setup and deployment instructions.
- **Git Integration**: Initialized Git repository and provided GitHub push instructions.

## [0.1.0] - 2025-12-29
### Added
- **Initial Release**: Basic "FuelPulse" app.
- **Core Features**: Map view (Leaflet), Station List, Filter by Status (Active/Inactive).
- **Mock Data**: Initial set of Lagos petrol stations.
