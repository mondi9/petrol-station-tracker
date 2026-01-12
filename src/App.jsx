import { useState, useEffect } from 'react';
import './App.css';
import MapComponent from './components/MapContainer';
import StationList from './components/StationList';
import ReportModal from './components/ReportModal';
import ReloadPrompt from './components/ReloadPrompt';
import { subscribeToStations, updateStationStatus, seedInitialData, addStation, recordUserPresence } from './services/stationService';

import { importLagosStationsV3, enrichStationData } from './services/osmService';

import { subscribeToAuth, logout } from './services/authService';
import { grantAdminRole } from './services/userService';
import AuthModal from './components/AuthModal';
import AddStationModal from './components/AddStationModal';
import StationDetailsModal from './components/StationDetailsModal';
import AdminDashboard from './components/AdminDashboard';

// Temporary Initial Data for Seeding
const INITIAL_DATA_SEED = [
  { id: "1", name: "TotalEnergies VI", address: "Adeola Odeku St, Victoria Island", lat: 6.4281, lng: 3.4219, status: "active", lastUpdated: new Date().toISOString() },
  { id: "2", name: "Oando Station", address: "Awolowo Rd, Ikoyi", lat: 6.4468, lng: 3.4172, status: "active", lastUpdated: new Date().toISOString() },
  { id: "3", name: "NNPC Mega Station", address: "Lekki-Epe Expy, Lekki", lat: 6.4323, lng: 3.4682, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "4", name: "Conoil Yaba", address: "Herbert Macaulay Way, Yaba", lat: 6.5095, lng: 3.3711, status: "active", lastUpdated: new Date().toISOString() },
  { id: "5", name: "Mobil Ikeja", address: "Obafemi Awolowo Way, Ikeja", lat: 6.5966, lng: 3.3421, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "6", name: "MRS Festac", address: "22 Rd, Festac Town", lat: 6.4808, lng: 3.2883, status: "active", lastUpdated: new Date().toISOString() },
  { id: "60", name: "Mobil (11PLC)", address: "23 Road, Festac Town", lat: 6.4762, lng: 3.2750, status: "active", lastUpdated: new Date().toISOString() },
  { id: "7", name: "NNPC Filling Station", address: "Plot 88, 21 Road, Festac Town", lat: 6.4664, lng: 3.2835, status: "active", lastUpdated: new Date().toISOString() },
  { id: "8", name: "TotalEnergies", address: "Amuwo/Festac Link Rd", lat: 6.4600, lng: 3.2950, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "9", name: "MRS Station", address: "770 Festac Link Rd", lat: 6.4620, lng: 3.2980, status: "active", lastUpdated: new Date().toISOString() },
  { id: "10", name: "Capital Oil", address: "Ago Palace Link Rd", lat: 6.4800, lng: 3.2900, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "11", name: "AP (Ardova PLC)", address: "21 Road, H Close, Festac Town", lat: 6.4680, lng: 3.2820, status: "active", lastUpdated: new Date().toISOString() }
];

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewingStation, setViewingStation] = useState(null);
  const [reportModalData, setReportModalData] = useState({ isOpen: false, station: null });
  const [isLoading, setIsLoading] = useState(true);

  // Auth State
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // ... existing hooks ...

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  /*
  const handleSeedData = async () => {
    if (confirm("This will upload sample stations to your database. Continue?")) {
      try {
        await seedInitialData(INITIAL_DATA_SEED);
        alert("Data uploaded successfully!");
      } catch (e) {
        console.error(e);
        alert("Error uploading data. Check console.");
      }
    }
  };
  */

  const handleAddStation = async (data) => {
    try {
      await addStation(data);
      alert("Station added successfully!");
    } catch (e) {
      console.error(e);
      alert("Error adding station");
    }
  };

  const handleRestoreMissing = async () => {
    if (confirm("This will restore the 12 manual stations (Festac, Mobil, etc) that OSM might have missed. Continue?")) {
      try {
        await seedInitialData(INITIAL_DATA_SEED);
        alert("Restored 12 manual stations successfully!");
      } catch (e) {
        console.error(e);
        alert(`Error: ${e.message}`);
      }
    }
  };

  const [importStatus, setImportStatus] = useState("");

  const handleImportOSM = async () => {
    if (!confirm("This will import real fuel stations for Lagos from OpenStreetMap. This may take a few seconds using your data. Continue?")) return;

    try {
      setImportStatus("Starting v3...");
      const count = await importLagosStationsV3(setImportStatus);
      alert(`Successfully imported ${count} stations!`);
    } catch (e) {
      console.error(e);
      alert(`Import failed: ${e.message}`);
    } finally {
      setImportStatus(""); // Always clear status so buttons re-enable
    }
  };

  const handleFixAddresses = async () => {
    // Debugging checks
    if (!stations || stations.length === 0) {
      alert("No stations loaded to fix.");
      return;
    }

    // Match the same logic as the service to see if we find candidates
    const candidates = stations.filter(s => {
      if (!s.lat || !s.lng) return false;
      const addr = (s.address || "").toLowerCase().trim();
      return addr === "lagos" || addr === "lagos, nigeria" || addr === "lagos nigeria" || addr.length < 15;
    });

    if (candidates.length === 0) {
      alert("No stations found that need address fixing (according to current criteria).");
      return;
    }

    if (!confirm(`Found ${candidates.length} stations with missing addresses. This will take about ${candidates.length * 1.5} seconds. Continue?`)) return;

    setImportStatus("Enhancing addresses...");
    try {
      const count = await enrichStationData(stations, setImportStatus);
      alert(`Process complete! Enhanced ${count} addresses.`);
    } catch (e) {
      console.error(e);
      alert("Address enhancement stopped due to error: " + e.message);
    }
    setImportStatus("");
  };

  const handleGrantAdmin = async (email) => {
    if (!confirm(`Are you sure you want to promote ${email} to Admin? This gives them full control.`)) return;

    try {
      setImportStatus("Promoting user...");
      const success = await grantAdminRole(email);
      if (success) {
        alert(`Success! ${email} is now an Admin. They may need to relogin.`);
      } else {
        alert(`User with email ${email} not found. Ensure they have signed up first.`);
      }
    } catch (e) {
      console.error(e);
      alert("Error promoting user: " + e.message);
    } finally {
      setImportStatus("");
    }
  };


  useEffect(() => {
    // Subscribe to Firestore updates
    const unsubscribe = subscribeToStations(
      (updatedStations) => {
        setStations(updatedStations);
        setIsLoading(false);

        // Update selected station if it exists in the new list
        if (selectedStation) {
          const updatedSelected = updatedStations.find(s => s.id === selectedStation.id);
          if (updatedSelected) {
            setSelectedStation(updatedSelected);
          }
        }
      },
      (error) => {
        console.error("Firebase subscription error:", error);
        setIsLoading(false);
        // Optional: Show error toast
      }
    );

    return () => unsubscribe();
  }, [selectedStation]); // Dependency on selectedStation to ensure we keep it updated? No, effect should rely on functional updates or ref, but simple find works.
  // Actually, standard pattern is just [] and handle selected update inside callback using prev state or ref, 
  // but rebuilding subscription on selection change is wasteful.
  // Better approach:
  // Use a separate effect or just update it when rendering.
  // But for simple list, the callback closure capturing 'selectedStation' is the issue.
  // Let's stick to the simple 'setStations' and handle selectedStation syncing in a separate effect if needed, 
  // OR just select from 'stations' list when passing to children.

  // Revised approach for simplicity and correctness:
  // Just setStations. Child components receiving 'selectedStationId' + 'stations' list is cleaner,
  // but MapComponent takes 'selectedStation' object. We can update that object reference when 'stations' changes.

  // Let's refine the useEffect:
  /*
  useEffect(() => {
    const unsubscribe = subscribeToStations((data) => {
        setStations(data);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Sync selectedStation reference when stations list updates
  useEffect(() => {
      if (selectedStation) {
          const updated = stations.find(s => s.id === selectedStation.id);
          if (updated && updated !== selectedStation) {
              setSelectedStation(updated);
          }
      }
  }, [stations]);
  */

  // Implementation:

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleViewDetails = (station) => {
    setViewingStation(station);
  };

  const handleReportClick = (station) => {
    setReportModalData({ isOpen: true, station });
  };

  const handleReportSubmit = async (status, queueStatus) => {
    if (!reportModalData.station) return;

    try {
      // Optimistic update (optional) or just wait for Firebase
      await updateStationStatus(reportModalData.station.id, status, queueStatus);
      // Alert? No, real-time listener will update UI.
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Check your connection or API keys.");
    }

    setReportModalData({ isOpen: false, station: null });
  };

  // derived state for selected station to ensure it's always fresh
  const activeSelectedStation = stations.find(s => s.id === selectedStation?.id) || selectedStation;

  // ... existing code ...

  const [userLocation, setUserLocation] = useState(null);

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // ... calculation logic ...
        // (same logic as before)
        const R = 6371;
        let nearest = null;
        let minDist = Infinity;

        // NEW: Prioritize Active Stations
        // Calculate distance for ALL stations
        const stationsWithDist = stations.map(station => {
          if (!station.lat || !station.lng) return { ...station, distance: Infinity };

          const dLat = (station.lat - latitude) * (Math.PI / 180);
          const dLon = (station.lng - longitude) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(latitude * (Math.PI / 180)) * Math.cos(station.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c; // Distance in km
          return { ...station, distance: d };
        });

        // 1. Find the absolute nearest physical station
        const sortedByDist = [...stationsWithDist].sort((a, b) => a.distance - b.distance);
        const absoluteNearest = sortedByDist.length > 0 ? sortedByDist[0] : null;

        // 2. Find nearest ACTIVE station
        const activeStations = sortedByDist.filter(s => s.status === 'active');
        const nearestActive = activeStations.length > 0 ? activeStations[0] : null;

        // Decision Logic
        // Default: Guide to Active
        // Exception: If user is "on site" (>200m) at an inactive station, select it (assume they want to report/update/verify)

        const ONSITE_THRESHOLD_KM = 0.2; // 200 meters

        if (absoluteNearest && absoluteNearest.distance <= ONSITE_THRESHOLD_KM) {
          console.log("User is on-site at:", absoluteNearest.name);
          nearest = absoluteNearest;
          if (nearest.status !== 'active' && nearestActive) {
            // Optional: Alert user they are at an inactive station?
            console.log("Station is inactive, but user is here.");
          }
        } else if (nearestActive) {
          nearest = nearestActive;
        } else {
          nearest = absoluteNearest; // Fallback to closest inactive if no active found
          if (nearest) alert("No active stations found nearby. Showing the closest inactive station.");
        }

        minDist = nearest ? nearest.distance : Infinity;


        setIsLoading(false);
        if (nearest) {
          setSelectedStation(nearest);
          setViewingStation(nearest); // Automatically open details

          // Presence Check: If within 200m (0.2km), record them as "present"
          // Presence Check handled in main logic visually, but let's keep the ping
          if (minDist <= 0.2) {
            // Logic already established nearest is within range if we selected it via OnSite rule, 
            // but if we selected a far Active station, minDist will be large, so this is safe.
            // Actually, wait: if selected is Far Active, we DON'T want to ping presence at the far station.
            // The minDist check here protects us. Good.
            recordUserPresence(nearest.id, user?.uid);
          }
        } else {
          alert("No stations found with coordinates.");
        }
      },
      (error) => {
        console.error("Error getting location", error);
        setIsLoading(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === 1) msg = "Location permission denied. Please allow location access.";
        if (error.code === 2) msg = "Location unavailable. Ensure GPS is on.";
        if (error.code === 3) msg = "Location request timed out.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Dev Mode State
  const [isDevMode, setIsDevMode] = useState(false);

  // Derived User for Dev Mode
  const appUser = isDevMode ? { ...user, email: user?.email || 'dev@admin.local', role: 'admin' } : user;

  return (
    <div className="app-container">
      <StationList
        stations={stations}
        onSelect={handleStationSelect}
        onViewDetails={handleViewDetails}
        selectedStationId={activeSelectedStation?.id}
        onImport={handleImportOSM}
        onFixAddresses={handleFixAddresses}
        onRestore={handleRestoreMissing}
        importStatus={importStatus}
        user={appUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onAddStation={() => setIsAddStationModalOpen(true)}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Dev Mode Toggle */}
      <button
        onClick={() => setIsDevMode(!isDevMode)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: isDevMode ? 'red' : 'rgba(0,0,0,0.5)',
          color: 'white',
          border: 'none',
          fontSize: '10px',
          padding: '5px',
          borderRadius: '4px',
          zIndex: 9999,
          cursor: 'pointer'
        }}
      >
        {isDevMode ? "DEV ADMIN ON" : "Dev Mode"}
      </button>

      <div className="map-container-wrapper">
        {isLoading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', color: 'white'
          }}>
            Loading live data...
          </div>
        )}

        <MapComponent
          stations={stations}
          onStationSelect={handleStationSelect}
          onViewDetails={handleViewDetails}
          selectedStation={activeSelectedStation}
          onReportClick={handleReportClick}
          onFindNearest={handleFindNearest}
        />
      </div>

      {/* Details Modal with Reviews */}
      <StationDetailsModal
        isOpen={!!viewingStation}
        onClose={() => setViewingStation(null)}
        station={viewingStation}
        user={user}
        userLocation={userLocation}
        onLoginRequest={() => setIsAuthModalOpen(true)}
      />

      <ReportModal
        isOpen={reportModalData.isOpen}
        station={reportModalData.station}
        onClose={() => setReportModalData({ isOpen: false, station: null })}
        onSubmit={handleReportSubmit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AddStationModal
        isOpen={isAddStationModalOpen}
        onClose={() => setIsAddStationModalOpen(false)}
        onSubmit={handleAddStation}
      />

      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        onImport={handleImportOSM}
        onFixAddresses={handleFixAddresses}
        onRestore={handleRestoreMissing}
        onAddStation={() => setIsAddStationModalOpen(true)}
        onGrantAdmin={handleGrantAdmin}
        importStatus={importStatus}
        stations={stations}
        user={user}
      />

      <ReloadPrompt />
    </div>
  );
}

export default App;
