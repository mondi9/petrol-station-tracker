# Lagos Petrol Pulse

A modern, real-time web application to track the operational status of petrol stations in Lagos. Built with React, Leaflet, and Firebase.

## 🌐 Live Demo

**[🚀 Open App](https://petrol-station-tracker.netlify.app/)** | [![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_SITE_ID/deploy-status)](https://app.netlify.com/sites/petrol-station-tracker/deploys)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

## ✨ Features

- **Real-Time Map**: Interactive map showing all petrol stations with status indicators (Green = Active, Red = Inactive).
- **Live Status Updates**: Crowd-sourced status reporting that updates instantly across all devices.
- **Smart Navigation**: 
   - "Near Me" button to quickly find the closest station.
   - Deep links to **Google Maps** and **Waze** for one-click navigation.
- **User Reviews**: Rate stations (1-5 stars) and leave comments.
- **User Authentication**: Sign Up/Login to contribute reviews and reliable data.
- **Admin Dashboard**: Special tools for admins to add stations, import data, and manage content.
- **Responsive Design**: Glassmorphism UI that works perfectly on Desktop and Mobile.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- A Firebase Project (with Firestore and Auth enabled)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/petrol-station-tracker.git
   cd petrol-station-tracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a `firebaseConfig.js` file in `src/` (or check existing `src/firebase.js`).
   - Add your Firebase API keys.

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🛠 Tech Stack

- **Frontend Framework**: React (Vite)
- **Styling**: Vanilla CSS (Custom Design System, Glassmorphism)
- **Map Engine**: Leaflet (React-Leaflet)
- **Backend / Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Icons**: Lucide React

## 📄 Documentation

- [Architecture & Data Model](./ARCHITECTURE.md) - Details on Firestore schema and security rules.
- [Changelog](./CHANGELOG.md) - History of changes and updates.
- [Android Guide](./ANDROID_GUIDE.md) - Information on TWA / Mobile deployment.

## 🤝 Contributing

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

Distributed under the MIT License.
