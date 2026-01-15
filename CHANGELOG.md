# Changelog

All notable changes to the "Lagos Petrol Pulse" project will be documented in this file.

## [0.6.0] - 2026-01-14
### Added
- **Smart Navigation**: Added "Near Me" button to center map on user location.
- **External Maps**: Added deep links to open Station location in **Google Maps** or **Waze**.
- **Admin Roles**: Implemented strict RBAC. Created `users` collection to store roles.
- **Admin Tools**: Feature to promote other users to admin status.

### Changed
- **Removed**: "Wait Time" reporting feature (removed in favor of smart navigation).
- **Navigation**: Improved "Find Nearest Station" logic.

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
- **Initial Release**: Basic "Petrol Station Status Tracker" app.
- **Core Features**: Map view (Leaflet), Station List, Filter by Status (Active/Inactive).
- **Mock Data**: Initial set of Lagos petrol stations.
