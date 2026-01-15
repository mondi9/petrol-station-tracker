import { useState, useEffect } from 'react';
import './App.css';
import { Map, List } from 'lucide-react'; // Import icons for FAB
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
  { id: "1", name: "TotalEnergies VI", address: "Adeola Odeku St, Victoria Island", lat: 6.4281, lng: 3.4219, status: "active", queueStatus: "short", prices: { petrol: 950, diesel: 1100, gas: 800 }, lastUpdated: new Date().toISOString() },
  { id: "2", name: "Oando Station", address: "Awolowo Rd, Ikoyi", lat: 6.4468, lng: 3.4172, status: "active", queueStatus: "medium", prices: { petrol: 945, diesel: 1120 }, lastUpdated: new Date().toISOString() },
  { id: "3", name: "NNPC Mega Station", address: "Lekki-Epe Expy, Lekki", lat: 6.4323, lng: 3.4682, status: "inactive", prices: { petrol: 850, diesel: 1050 }, lastUpdated: new Date().toISOString() },
  { id: "4", name: "Conoil Yaba", address: "Herbert Macaulay Way, Yaba", lat: 6.5095, lng: 3.3711, status: "active", queueStatus: "long", prices: { petrol: 960, diesel: 1150 }, lastUpdated: new Date().toISOString() },
  { id: "5", name: "Mobil Ikeja", address: "Obafemi Awolowo Way, Ikeja", lat: 6.5966, lng: 3.3421, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "6", name: "MRS Festac", address: "22 Rd, Festac Town", lat: 6.4808, lng: 3.2883, status: "active", queueStatus: "short", prices: { petrol: 930 }, lastUpdated: new Date().toISOString() },
  { id: "60", name: "Mobil (11PLC)", address: "23 Road, Festac Town", lat: 6.4762, lng: 3.2750, status: "active", queueStatus: "medium", prices: { petrol: 940, gas: 750 }, lastUpdated: new Date().toISOString() },
  { id: "7", name: "NNPC Filling Station", address: "Plot 88, 21 Road, Festac Town", lat: 6.4664, lng: 3.2835, status: "active", queueStatus: "long", prices: { petrol: 890 }, lastUpdated: new Date().toISOString() },
  { id: "8", name: "TotalEnergies", address: "Amuwo/Festac Link Rd", lat: 6.4600, lng: 3.2950, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "9", name: "MRS Station", address: "770 Festac Link Rd", lat: 6.4620, lng: 3.2980, status: "active", prices: { petrol: 935 }, lastUpdated: new Date().toISOString() },
  { id: "10", name: "Capital Oil", address: "Ago Palace Link Rd", lat: 6.4800, lng: 3.2900, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "11", name: "AP (Ardova PLC)", address: "21 Road, H Close, Festac Town", lat: 6.4680, lng: 3.2820, status: "active", prices: { petrol: 955 }, lastUpdated: new Date().toISOString() }
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

  // Mobile View State
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  // ... existing hooks ...

  // Filter State
  const [filters, setFilters] = useState({
    status: 'all',
    fuelType: 'all',
    searchQuery: ''
  });

  // Filter Logic
  const filteredStations = stations.filter(station => {
    // 1. Status Filter
    if (filters.status !== 'all' && station.status !== filters.status) return false;

    // 2. Fuel Type Filter
    if (filters.fuelType !== 'all') {
      if (!station.prices || !station.prices[filters.fuelType]) return false;
    }

    // 3. Search Query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const name = (station.name || '').toLowerCase();
      const address = (station.address || '').toLowerCase();
      if (!name.includes(query) && !address.includes(query)) return false;
    }

    return true;
  });

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
    // On mobile, switch to map view when selecting from list
    if (window.innerWidth <= 768) {
      setViewMode('map');
    }
  };

  const handleViewDetails = (station) => {
    setViewingStation(station);
  };

  const handleReportClick = (station) => {
    setReportModalData({ isOpen: true, station });
  };

  const handleReportSubmit = async (status, queueStatus, prices) => {
    if (!reportModalData.station) return;

    try {
      // Optimistic update (optional) or just wait for Firebase
      await updateStationStatus(reportModalData.station.id, status, queueStatus, prices);
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

  // Auto-fetch location on startup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          // Auto-route only if we have stations loaded
          if (stations.length > 0) {
            findAndSelectNearest(loc, stations);
          }
        },
        (error) => {
          console.log("Auto-location failed, using default for demo:", error);
          setUserLocation({ lat: 6.5244, lng: 3.3792 });
        }
      );
    } else {
      setUserLocation({ lat: 6.5244, lng: 3.3792 });
    }
  }, [stations.length]); // Dependency on stations.length ensures we run this once stations load if we have location

  const findAndSelectNearest = (currentLocation, currentStations) => {
    if (!currentLocation || !currentStations || currentStations.length === 0) return;

    setIsLoading(true);
    const { lat, lng } = currentLocation;
    const R = 6371;
    let nearest = null;

    // Filter by global filters first if needed? 
    // No, "Nearest" should probably be "Nearest Active" regardless of view filters, 
    // BUT if the user applied filters, maybe they want nearest *matching* filter?
    // Let's stick to "Nearest Active" priority for now as per previous logic.

    const stationsWithDist = currentStations.map(station => {
      if (!station.lat || !station.lng) return { ...station, distance: Infinity };

      const dLat = (station.lat - lat) * (Math.PI / 180);
      const dLon = (station.lng - lng) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(station.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return { ...station, distance: d };
    });

    const sortedByDist = [...stationsWithDist].sort((a, b) => a.distance - b.distance);
    const absoluteNearest = sortedByDist.length > 0 ? sortedByDist[0] : null;
    const activeStations = sortedByDist.filter(s => s.status === 'active');
    const nearestActive = activeStations.length > 0 ? activeStations[0] : null;

    const ONSITE_THRESHOLD_KM = 0.2;

    if (absoluteNearest && absoluteNearest.distance <= ONSITE_THRESHOLD_KM) {
      nearest = absoluteNearest;
    } else if (nearestActive) {
      nearest = nearestActive;
    } else {
      nearest = absoluteNearest;
    }

    setIsLoading(false);
    if (nearest) {
      setSelectedStation(nearest);
      // Removed setViewingStation(nearest) to avoid popping modal automatically

      if (nearest.distance <= 0.2) {
        recordUserPresence(nearest.id, user?.uid);
      }
    }
  };

  const handleFindNearest = () => {
    if (!userLocation) {
      if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          findAndSelectNearest(loc, stations);
        },
        (err) => alert("Location access denied")
      );
    } else {
      findAndSelectNearest(userLocation, stations);
    }
  };

  // Dev Mode State
  const [isDevMode, setIsDevMode] = useState(false);

  // Derived User for Dev Mode
  const appUser = isDevMode ? { ...user, email: user?.email || 'dev@admin.local', role: 'admin' } : user;

  return (
    <div className="app-container">
      {/* Sidebar (List View) */}
      <div className={`sidebar ${viewMode === 'list' ? 'visible' : ''}`}>
        <StationList
          stations={filteredStations}
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

          // Filter Props
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>

      {/* Mobile Toggle FAB */}
      <button
        className="mobile-toggle-btn"
        onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
        style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 900,
          display: 'none', // Hidden on desktop via CSS 
          alignItems: 'center', gap: '8px',
          padding: '12px 24px', borderRadius: '30px',
          background: 'var(--color-active)', color: 'black',
          border: 'none', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }}
      >
        {viewMode === 'map' ? <><List size={18} /> List</> : <><Map size={18} /> Map</>}
      </button>

      {/* Map Container */}
      <div className={`map-container-wrapper ${viewMode === 'list' ? 'mobile-hidden' : ''}`}>
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

        {isLoading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 1000, background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '10px', color: 'white'
          }}>
            Loading live data...
          </div>
        )}

        <MapComponent
          stations={filteredStations}
          onStationSelect={handleStationSelect}
          onViewDetails={handleViewDetails}
          selectedStation={activeSelectedStation}
          onReportClick={handleReportClick}
          onFindNearest={handleFindNearest}
          userLocation={userLocation}
        />
      </div>

      {/* Modals & Overlays */}
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
