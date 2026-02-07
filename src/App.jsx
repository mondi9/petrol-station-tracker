import React, { useState, useEffect } from 'react';
import './App.css';
import { Map, List } from 'lucide-react'; // Import icons for FAB
import MapComponent from './components/MapContainer';
import StationList from './components/StationList';
import ReportModal from './components/ReportModal';
import ReloadPrompt from './components/ReloadPrompt';
import { subscribeToStations, updateStationStatus, addStation, recordUserPresence, calculateDistance, formatDistance, calculateTravelTime } from './services/stationService';

import { subscribeToAuth, logout } from './services/authService';
import { db } from './services/firebase';
import { importLagosStationsV3, enrichStationData } from './services/osmService';
import { grantAdminRole } from './services/userService';
import { seedInitialData } from './services/stationService';
import { getUserStats } from './services/statsService';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import MobileBottomNav from './components/MobileBottomNav';
import StationBottomSheet from './components/StationBottomSheet.jsx';
import AddStationModal from './components/AddStationModal';
import StationDetailsModal from './components/StationDetailsModal';
import AdminDashboard from './components/AdminDashboard';
import FleetDashboard from './components/FleetDashboard';
import FilterBar from './components/FilterBar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Temporary Initial Data for Seeding
const INITIAL_DATA_SEED = [
  { id: "1", name: "TotalEnergies VI", address: "Adeola Odeku St, Victoria Island", lat: 6.4281, lng: 3.4219, status: "active", queueStatus: "short", prices: { petrol: 950, diesel: 1100, gas: 800 }, lastUpdated: new Date().toISOString() },
  { id: "2", name: "Oando Station", address: "Awolowo Rd, Ikoyi", lat: 6.4468, lng: 3.4172, status: "active", queueStatus: "medium", prices: { petrol: 945, diesel: 1120 }, lastUpdated: new Date().toISOString() },
  { id: "3", name: "NNPC Mega Station", address: "Lekki-Epe Expy, Lekki", lat: 6.4323, lng: 3.4682, status: "inactive", prices: { petrol: 850, diesel: 1050 }, lastUpdated: new Date().toISOString() },
  { id: "4", name: "Conoil Yaba", address: "Herbert Macaulay Way, Yaba", lat: 6.5095, lng: 3.3711, status: "active", queueStatus: "long", prices: { petrol: 960, diesel: 1150 }, lastUpdated: new Date().toISOString() },
  { id: "5", name: "Mobil Ikeja", address: "Obafemi Awolowo Way, Ikeja", lat: 6.5966, lng: 3.3421, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "6", name: "MRS Festac", address: "21/22 Rd Junction, Festac Town", lat: 6.4698, lng: 3.2815, status: "active", queueStatus: "short", prices: { petrol: 930 }, lastUpdated: new Date().toISOString() },
  { id: "60", name: "Mobil (11PLC)", address: "23 Road, Festac Town", lat: 6.4762, lng: 3.2750, status: "active", queueStatus: "medium", prices: { petrol: 940, gas: 750 }, lastUpdated: new Date().toISOString() },
  { id: "7", name: "NNPC Filling Station", address: "Plot 88, 21 Road, Festac Town", lat: 6.4664, lng: 3.2835, status: "active", queueStatus: "long", prices: { petrol: 890 }, lastUpdated: new Date().toISOString() },
  { id: "8", name: "TotalEnergies", address: "Amuwo/Festac Link Rd", lat: 6.4600, lng: 3.2950, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "9", name: "MRS Station", address: "770 Festac Link Rd", lat: 6.4620, lng: 3.2980, status: "active", prices: { petrol: 935 }, lastUpdated: new Date().toISOString() },
  { id: "10", name: "Capital Oil", address: "Ago Palace Link Rd", lat: 6.4800, lng: 3.2900, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "11", name: "AP (Ardova PLC)", address: "21 Road, H Close, Festac Town", lat: 6.4650, lng: 3.2840, status: "active", prices: { petrol: 955 }, lastUpdated: new Date().toISOString() }
];

import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [viewingStation, setViewingStation] = useState(null);
  const [reportModalData, setReportModalData] = useState({ isOpen: false, station: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isFleetDashboardOpen, setIsFleetDashboardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [userStats, setUserStats] = useState({ contributions: 0, reviews: 0 });

  // Mobile View State
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  // Filter State
  const [filters, setFilters] = useState({
    status: 'all',
    fuelType: 'all',
    searchQuery: '',
    queueLength: 'all'
  });

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      // Fetch user stats when user logs in
      if (currentUser) {
        getUserStats(currentUser.uid).then(setUserStats);
      } else {
        setUserStats({ contributions: 0, reviews: 0 });
      }
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

  const handleAddStation = async (data) => {
    try {
      await addStation(data);
      alert("Station added successfully!");
    } catch (e) {
      console.error(e);
      alert("Error adding station");
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
  }, [selectedStation]);

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    // On mobile, we want to see details immediately, not just the map popup
    // BUT we want to keep map view active to see the bottom sheet
    if (isMobile) {
      // setViewMode('map'); // Ensure we stay on map
    }
  };

  const handleViewDetails = (station) => {
    setViewingStation(station);
  };

  const handleReportClick = (station) => {
    setReportModalData({ isOpen: true, station });
  };

  const handleReportSubmit = async (reportData) => {
    if (!reportModalData.station) return;

    try {
      // reportData = { fuelType, availability, queueLength, price, reporterName }
      await updateStationStatus(reportModalData.station.id, reportData, user?.uid, reportModalData.station.name);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status. Check your connection or API keys.");
    }

    setReportModalData({ isOpen: false, station: null });
  };

  const handleNavigate = (station) => {
    if (!station) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, '_blank');
  };

  // Filter Logic
  const filteredStations = React.useMemo(() => {
    let result = stations.filter(station => {
      // 1. Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const name = (station.name || '').toLowerCase();
        const address = (station.address || '').toLowerCase();
        if (!name.includes(query) && !address.includes(query)) return false;
      }

      // 2. Status Filter
      if (filters.status !== 'all') {
        if (station.status !== filters.status) return false;
      }

      // 3. Fuel Type Filter
      if (filters.fuelType !== 'all') {
        const price = station.prices?.[filters.fuelType];
        // Assume if price is listed, it's available. Or maybe just strictly check existence.
        if (!price) return false;
      }

      // 4. Queue Length Filter
      if (filters.queueLength !== 'all') {
        if (station.status !== 'active') return false; // Only active stations have queues
        if (station.queueStatus !== filters.queueLength) return false;
      }

      return true;
    });

    // Add distance to each station if user location is available
    if (userLocation) {
      result = result.map(station => ({
        ...station,
        distance: calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng)
      }));
    }

    return result;
  }, [stations, filters, userLocation]);

  // derived state for selected station to ensure it's always fresh
  const activeSelectedStation = stations.find(s => s.id === selectedStation?.id) || selectedStation;

  const handleUpdateMRSCoords = async () => {
    try {
      setImportStatus("Syncing Festac Stations...");
      const { doc, writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // Update MRS Festac (The Junction)
      batch.update(doc(db, 'stations', '6'), {
        lat: 6.4698,
        lng: 3.2815,
        address: "21/22 Rd Junction, Festac Town"
      });

      // Update AP (Ardova PLC) - Moved further away
      batch.update(doc(db, 'stations', '11'), {
        lat: 6.4650,
        lng: 3.2840,
        address: "21 Road, H Close, Festac Town"
      });

      await batch.commit();
      setImportStatus("✅ Festac station cluster repaired!");
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      console.error("Update failed", error);
      setImportStatus("❌ Update failed: " + error.message);
    }
  };

  const handleImport = async () => {
    try {
      await importLagosStationsV3((status) => setImportStatus(status));
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      setImportStatus("❌ Import failed: " + error.message);
    }
  };

  const handleFixAddresses = async () => {
    try {
      await enrichStationData(stations, (status) => setImportStatus(status));
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      setImportStatus("❌ Fix failed: " + error.message);
    }
  };

  const handleRestoreManual = async () => {
    try {
      setImportStatus("Restoring manual stations...");
      await seedInitialData(INITIAL_DATA_SEED);
      setImportStatus("✅ Manual stations restored!");
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      setImportStatus("❌ Restore failed: " + error.message);
    }
  };

  const handleGrantAdmin = async (email) => {
    try {
      setImportStatus(`Granting admin to ${email}...`);
      const success = await grantAdminRole(email);
      if (success) {
        setImportStatus(`✅ Granted admin to ${email}`);
      } else {
        setImportStatus(`❌ User not found: ${email}`);
      }
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      setImportStatus("❌ Grant failed: " + error.message);
    }
  };

  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        // Find nearest ACTIVE station using proper distance calculation
        if (stations.length > 0) {
          let nearest = null;
          let minDistance = Infinity;

          // Filter for active stations only
          const activeStations = stations.filter(s => s.status === 'active');

          // Debug: Log all distances
          console.log('=== Finding Nearest Station ===');
          console.log('Your location:', { lat: latitude, lng: longitude });
          console.log(`Total stations: ${stations.length}, Active stations: ${activeStations.length}`);

          activeStations.forEach(station => {
            const dist = calculateDistance(latitude, longitude, station.lat, station.lng);
            console.log(`${station.name} (${station.status}): ${dist?.toFixed(2)}km`, { lat: station.lat, lng: station.lng });

            if (dist !== null && dist < minDistance) {
              minDistance = dist;
              nearest = station;
            }
          });

          console.log('Nearest station selected:', nearest?.name, minDistance.toFixed(2) + 'km');

          if (nearest) {
            setSelectedStation(nearest);

            // Diagnostic Info: Top 3 closest stations
            const top3 = activeStations
              .map(s => ({ name: s.name, d: calculateDistance(latitude, longitude, s.lat, s.lng), lat: s.lat, lng: s.lng }))
              .sort((a, b) => a.d - b.d)
              .slice(0, 3);

            const diagHtml = top3.map((s, idx) => `
                <div style="font-size: 0.8rem; margin-top: 4px; display: flex; justify-content: space-between; padding: 6px; background: rgba(255,255,255,0.05); borderRadius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${idx + 1}. ${s.name}</span>
                  <strong style="color: ${idx === 0 ? '#10b981' : 'white'}">${formatDistance(s.d)}</strong>
                </div>
              `).join('');

            // Create toast notification
            const toast = document.createElement('div');
            toast.style.cssText = `
                            position: fixed;
                            top: 80px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: linear-gradient(135deg, #1f2937, #111827);
                            color: white;
                            padding: 24px;
                            border-radius: 20px;
                            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                            z-index: 10000;
                            max-width: 90%;
                            width: 340px;
                            border: 1px solid rgba(255,255,255,0.1);
                            animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        `;
            toast.innerHTML = `
                            <div style="text-align: center; margin-bottom: 16px;">
                                <div style="font-size: 1.3rem; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">📍 Results Found</div>
                                <div style="font-size: 0.8rem; opacity: 0.6;">Relative to pinned location</div>
                            </div>
                            
                            <div style="margin-bottom: 20px;">
                                <div style="font-size: 0.75rem; opacity: 0.5; font-weight: bold; margin-bottom: 8px; text-transform: uppercase;">Closest Stations:</div>
                                ${diagHtml}
                            </div>

                            <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                                    <span style="opacity: 0.6;">GPS Accuracy</span>
                                    <span style="font-weight: bold; color: ${position.coords.accuracy < 30 ? '#10b981' : '#f59e0b'}">±${Math.round(position.coords.accuracy)}m</span>
                                </div>
                                <div style="font-size: 0.7rem; opacity: 0.4; font-family: monospace;">
                                    ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                                </div>
                                ${position.coords.accuracy > 50 ? `<div style="margin-top: 8px; font-size: 0.7rem; color: #f59e0b; font-style: italic;">⚠️ Accuracy is low. You can click on the map to pin your exact home location.</div>` : ''}
                            </div>
                            
                            <div style="display: flex; gap: 8px;">
                                <button id="retry-gps" style="flex: 1; padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: white; cursor: pointer; font-weight: 600;">Retry GPS</button>
                                <button id="close-toast" style="flex: 1; padding: 12px; border-radius: 10px; border: none; background: #10b981; color: black; cursor: pointer; font-weight: 700;">OK</button>
                            </div>

                            <style>
                                @keyframes slideInDown {
                                    from { transform: translate(-50%, -100%); opacity: 0; }
                                    to { transform: translate(-50%, 0); opacity: 1; }
                                }
                            </style>
                        `;
            document.body.appendChild(toast);

            toast.querySelector('#retry-gps').onclick = () => {
              toast.remove();
              handleFindNearest();
            };

            toast.querySelector('#close-toast').onclick = () => {
              toast.remove();
            };

            // Remove toast after 15 seconds
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 15000);

            if (isMobile) setViewMode('map');
          }
        }
      },
      (error) => {
        console.error("Error getting location", error);
        alert("Unable to retrieve your location. Please ensure GPS is enabled and you've granted permission.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app-container">
          <div className="main-content" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

            {/* Sidebar / List View */}
            <div className="sidebar" style={{
              width: isMobile ? '100%' : '400px',
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--glass-border)',
              display: viewMode === 'map' && isMobile ? 'none' : 'flex',
              flexDirection: 'column',
              zIndex: 20,
              flexShrink: 0
            }}>
              <StationList
                stations={filteredStations}
                onSelect={handleStationSelect}
                filters={filters}
                onFilterChange={setFilters}
                onViewDetails={handleViewDetails}
                selectedStationId={selectedStation?.id}
                user={user}
                onLogin={() => setIsAuthModalOpen(true)}
                onLogout={handleLogout}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onOpenFleetDashboard={() => setIsFleetDashboardOpen(true)}
                onAddStation={() => setIsAddStationModalOpen(true)}
                userLocation={userLocation}
              />
            </div>

            {/* Map Container */}
            <div className="map-wrapper" style={{
              flex: 1,
              position: 'relative',
              display: viewMode === 'list' && isMobile ? 'none' : 'block'
            }}>
              <MapComponent
                stations={filteredStations}
                selectedStation={activeSelectedStation}
                onStationSelect={handleStationSelect}
                onViewDetails={handleViewDetails}
                onReportClick={handleReportClick}
                onFindNearest={handleFindNearest}
                userLocation={userLocation}
                isLocating={isLocating}
                onMapClick={(latlng) => {
                  console.log("Map: Manual location set to", latlng);
                  setUserLocation({ lat: latlng.lat, lng: latlng.lng });
                  // Small temporary confirmation
                  const toast = document.createElement('div');
                  toast.style.cssText = `
                position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.8); color: white; padding: 8px 16px; 
                border-radius: 20px; font-size: 0.8rem; z-index: 2000;
              `;
                  toast.innerText = "📍 Location pinned on map";
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 2000);
                }}
              />
            </div>
          </div>

          {/* Mobile Elements */}
          <div className="mobile-overlays" style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 1001 }}>
            <div style={{ pointerEvents: 'auto', position: 'absolute', top: 0, left: 0, right: 0, padding: '10px' }} className="mobile-filters">
              {/* Mobile only filter bar handled by CSS media queries usually, but for now rendering simple wrapper */}
              {isMobile && viewMode === 'map' && (
                <FilterBar filters={filters} onFilterChange={setFilters} />
              )}
            </div>

            {/* Mobile Bottom Sheet */}
            <div className="mobile-sheet-container" style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}>
              {activeSelectedStation && isMobile && viewMode === 'map' && (
                <div style={{ pointerEvents: 'auto' }}>
                  <StationBottomSheet
                    station={activeSelectedStation}
                    onClose={() => setSelectedStation(null)}
                    onNavigate={handleNavigate}
                  />
                </div>
              )}
            </div>

          </div>

          <MobileBottomNav
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenFleet={() => setIsFleetDashboardOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />

          {/* Floating Action Buttons */}
          <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 1000 }}>
            {user && (
              <button className="btn btn-primary" style={{ borderRadius: '50%', width: '56px', height: '56px', padding: 0, justifyContent: 'center', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)' }}
                onClick={() => setIsAddStationModalOpen(true)} title="Add Station">
                <span style={{ fontSize: '24px' }}>+</span>
              </button>
            )}

            {user && user.role === 'admin' && (
              <button className="glass" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, justifyContent: 'center', cursor: 'pointer', background: 'var(--color-active)', color: 'black', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }}
                onClick={() => setIsAdminDashboardOpen(true)} title="Admin Dashboard">
                <span style={{ fontSize: '20px' }}>⚙️</span>
              </button>
            )}

            <button className="glass" style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => user ? setIsProfileModalOpen(true) : setIsAuthModalOpen(true)} title={user ? "Profile" : "Login"}>
              {user ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-active)', fontWeight: 'bold' }}>
                  {user.email[0].toUpperCase()}
                </div>
              ) : (
                <span style={{ fontSize: '20px' }}>👤</span>
              )}
            </button>
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
            user={user}
            onClose={() => setReportModalData({ isOpen: false, station: null })}
            onSubmit={handleReportSubmit}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />

          <UserProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            stats={userStats}
            stations={stations}
          />

          <AddStationModal
            isOpen={isAddStationModalOpen}
            onClose={() => setIsAddStationModalOpen(false)}
            onSubmit={handleAddStation}
          />

          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
            onImport={handleImport}
            onFixAddresses={handleFixAddresses}
            onRestore={handleRestoreManual}
            onAddStation={() => setIsAddStationModalOpen(true)}
            onGrantAdmin={handleGrantAdmin}
            onUpdateMRS={handleUpdateMRSCoords}
            importStatus={importStatus}
            stations={stations}
            user={user}
          />

          {isFleetDashboardOpen && (
            <FleetDashboard
              stations={stations}
              onClose={() => setIsFleetDashboardOpen(false)}
            />
          )}

          <ReloadPrompt />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
