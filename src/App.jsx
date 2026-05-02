import React, { useState, useEffect } from 'react';
import './App.css';
import { Map, List } from 'lucide-react'; // Import icons for FAB
import MapComponent from './components/MapContainer';
import StationList from './components/StationList';
import ReportModal from './components/ReportModal';
import ReloadPrompt from './components/ReloadPrompt';
import { subscribeToStations, updateStationStatus, addStation, recordUserPresence, calculateDistance, formatDistance, calculateTravelTime, formatTravelTime } from './services/stationService';

import { subscribeToAuth, logout } from './services/authService';
import { db } from './services/firebase';
import { importLagosStationsV3, enrichStationData } from './services/osmService';
import { grantAdminRole } from './services/userService';
import { seedInitialData } from './services/stationService';
import { getUserStats } from './services/statsService';
import { logAppVisit } from './services/activityService';
import mapsService from './services/mapsService';
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
import LocationDisclosure from './components/LocationDisclosure';
import LagosOnlyModal from './components/LagosOnlyModal';
import OnboardingFlow from './components/OnboardingFlow';

const LAGOS_BOUNDS = {
  latMin: 6.30,
  latMax: 6.75,
  lngMin: 3.10,
  lngMax: 3.65
};

// Temporary Initial Data for Seeding
const INITIAL_DATA_SEED = [
  { id: "1", name: "TotalEnergies VI", address: "Adeola Odeku St, Victoria Island", lat: 6.4281, lng: 3.4219, status: "active", queueStatus: "short", prices: { petrol: 1150, diesel: 1300, gas: 900 }, lastUpdated: new Date().toISOString() },
  { id: "2", name: "Oando Station", address: "Awolowo Rd, Ikoyi", lat: 6.4468, lng: 3.4172, status: "active", queueStatus: "mild", prices: { petrol: 1045, diesel: 1320 }, lastUpdated: new Date().toISOString() },
  { id: "3", name: "NNPC Mega Station (Lekki)", address: "Lekki-Epe Expy, Lekki", lat: 6.4323, lng: 3.4682, status: "inactive", prices: { petrol: 1050, diesel: 1250 }, lastUpdated: new Date().toISOString() },
  { id: "4", name: "Conoil Yaba", address: "Herbert Macaulay Way, Yaba", lat: 6.5095, lng: 3.3711, status: "active", queueStatus: "long", prices: { petrol: 1060, diesel: 1350 }, lastUpdated: new Date().toISOString() },
  { id: "5", name: "Mobil Ikeja", address: "Obafemi Awolowo Way, Ikeja", lat: 6.5966, lng: 3.3421, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "6", name: "MRS Festac", address: "21/22 Rd Junction, Festac Town", lat: 6.4675, lng: 3.2836, status: "active", queueStatus: "short", prices: { petrol: 1030 }, lastUpdated: new Date().toISOString() },
  { id: "60", name: "Mobil (11PLC)", address: "23 Road, Festac Town", lat: 6.4607, lng: 3.2995, status: "active", queueStatus: "mild", prices: { petrol: 1040, gas: 850 }, lastUpdated: new Date().toISOString() },
  { id: "7", name: "NNPC Filling Station", address: "2nd Avenue, Festac Town", lat: 6.4605, lng: 3.2844, status: "active", queueStatus: "long", prices: { petrol: 1025 }, lastUpdated: new Date().toISOString() },
  { id: "8", name: "TotalEnergies", address: "Amuwo/Festac Link Rd", lat: 6.4600, lng: 3.2950, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "9", name: "MRS Station", address: "770 Festac Link Rd", lat: 6.4620, lng: 3.2980, status: "active", prices: { petrol: 1035 }, lastUpdated: new Date().toISOString() },
  { id: "10", name: "Capital Oil", address: "Ago Palace Link Rd", lat: 6.4800, lng: 3.2900, status: "inactive", lastUpdated: new Date().toISOString() },
  { id: "11", name: "AP (Ardova PLC)", address: "21 Road, Festac Town", lat: 6.4686, lng: 3.2932, status: "active", prices: { petrol: 1055 }, lastUpdated: new Date().toISOString() }
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
  const [nearbyStations, setNearbyStations] = useState([]);
  const [travelStats, setTravelStats] = useState({}); // { stationId: { durationMinutes, hasTrafficData, etc } }

  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isFleetDashboardOpen, setIsFleetDashboardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [userStats, setUserStats] = useState({ contributions: 0, reviews: 0 });
  const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);
  const [showLagosOnlyModal, setShowLagosOnlyModal] = useState(false);
  const [hasLocationConsent, setHasLocationConsent] = useState(localStorage.getItem('locationConsent') === 'true');
  const [showOnboarding, setShowOnboarding] = useState(localStorage.getItem('hasSeenOnboarding') !== 'true');

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

  // Log Visit on initial load
  useEffect(() => {
    logAppVisit(user?.uid, user?.email);
  }, [user?.uid]); // Log when user state changes (e.g. login) to associate the session

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

  const handleNavigate = (station, app = 'google') => {
    if (!station) return;

    let url;
    if (app === 'waze') {
      url = `https://waze.com/ul?ll=${station.lat},${station.lng}&navigate=yes`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    }

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
  const activeSelectedStation = React.useMemo(() => {
    const base = stations.find(s => s.id === selectedStation?.id) || selectedStation;
    if (!base) return null;
    return { ...base, travel: travelStats[base.id] };
  }, [stations, selectedStation, travelStats]);

  const handleUpdateMRSCoords = async () => {
    try {
      setImportStatus("Syncing Festac Stations...");
      const { doc, writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      // Define target clusters with more robust matching keywords (GPS Verified)
      const clusters = [
        { id: "sync_mrs", name: "MRS Festac", keywords: ["mrs festac", "mrs.*festac", "^mrs$"], lat: 6.4675, lng: 3.2836, q: "short", qTime: 5, addr: "21/22 Rd Junction, Festac Town", p: 1030 },
        { id: "sync_mobil", name: "Mobil", keywords: ["mobil festac", "11plc festac"], lat: 6.4670, lng: 3.2840, q: "short", qTime: 5, addr: "4th Ave/23 Rd Junction, Festac, Lagos", p: 1040 },
        { id: "sync_ap", name: "AP (Ardova PLC)", keywords: ["\\bap\\b.*festac", "ardova.*festac", "^ap$"], lat: 6.4665, lng: 3.2845, q: "short", qTime: 5, addr: "21 Road, Festac Town", p: 1055 },
        { id: "sync_nnpc", name: "NNPC Filling Station", keywords: ["nnpc.*festac", "nnpc mega.*festac"], lat: 6.4605, lng: 3.2844, q: "long", qTime: 45, addr: "2nd Avenue, Festac Town", p: 1025 },
        { id: "sync_capital", name: "Capital Oil", keywords: ["capital oil.*ago", "capital.*palace"], lat: 6.4800, lng: 3.2900, q: "long", qTime: 45, addr: "Ago Palace Link Rd", p: 1060 }
      ];

      let totalUpdated = 0;
      let totalCreated = 0;
      const now = new Date().toISOString();
      const matchedClusters = new Set();

      // Update ALL stations that match keywords to clean up duplicates
      stations.forEach(station => {
        const lowerName = station.name.toLowerCase();
        const cluster = clusters.find(c => c.keywords.some(k => new RegExp(k).test(lowerName)));

        if (cluster) {
          batch.update(doc(db, 'stations', station.id), {
            lat: cluster.lat,
            lng: cluster.lng,
            queueStatus: cluster.q,
            queue: { petrol: cluster.qTime },
            address: cluster.addr,
            status: 'active',
            prices: { ...station.prices, petrol: cluster.p },
            lastUpdated: now,
            lastPriceUpdate: now
          });
          matchedClusters.add(cluster.id);
          totalUpdated++;
        } else if (
          // Explicit cleanup: Delete any station that was permanently corrupted with AP's 
          // or MRS's exact synced coordinates by the previous regex bug ("ap" matching "Capital", "Dapsey", "Be Happy").
          // We exclude the actual intended 'sync_' IDs we just created/updated.
          (station.lat === 6.4686 && station.lng === 3.2932 && !station.id.startsWith("sync_")) ||
          (station.lat === 6.4675 && station.lng === 3.2836 && !station.id.startsWith("sync_")) ||
          (station.lat === 6.4607 && station.lng === 3.2995 && !station.id.startsWith("sync_")) ||
          lowerName.includes("dapsey") ||
          lowerName.includes("be happy") ||
          lowerName.includes("capital")
        ) {
          batch.delete(doc(db, 'stations', station.id));
        }
      });

      // Create strictly missing stations
      clusters.forEach(cluster => {
        if (!matchedClusters.has(cluster.id)) {
          // Use set with a predictable ID so it doesn't duplicate on re-runs
          batch.set(doc(db, 'stations', cluster.id), {
            name: cluster.name,
            lat: cluster.lat,
            lng: cluster.lng,
            queueStatus: cluster.q,
            queue: { petrol: cluster.qTime },
            address: cluster.addr,
            status: 'active',
            prices: { petrol: cluster.p },
            lastUpdated: now,
            lastPriceUpdate: now
          });
          totalCreated++;
        }
      });

      if (totalUpdated > 0 || totalCreated > 0) {
        await batch.commit();
        setImportStatus(`✅ Synced ${totalUpdated} & created ${totalCreated} stations!`);
      } else {
        setImportStatus("⚠️ No matching stations found to sync.");
      }

      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      console.error("Update failed", error);
      setImportStatus("❌ Update failed: " + error.message);
    }
  };

  const handleGlobalPriceUpdate = async () => {
    try {
      const amount = parseInt(prompt("Enter price increase amount (e.g. 150):", "150"));
      if (isNaN(amount)) return;

      setImportStatus(`Applying +₦${amount} to all petrol prices...`);
      const { doc, writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);

      let count = 0;
      stations.forEach(station => {
        if (station.prices?.petrol) {
          batch.update(doc(db, 'stations', station.id), {
            'prices.petrol': station.prices.petrol + amount,
            lastPriceUpdate: new Date().toISOString()
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        setImportStatus(`✅ Updated prices for ${count} stations!`);
      } else {
        setImportStatus("⚠️ No stations with petrol prices found.");
      }
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      console.error("Global update failed", error);
      setImportStatus("❌ Global update failed: " + error.message);
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
  
  const handleCleanupDuplicates = async () => {
    try {
      setImportStatus("Identifying and merging duplicates...");
      const { doc, deleteDoc, updateDoc } = await import('firebase/firestore');
      
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
          if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
          const R = 6371;
          const dLat = (lat2 - lat1) * (Math.PI / 180);
          const dLon = (lon2 - lon1) * (Math.PI / 180);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
      };

      const normalizeName = (name) => {
          if (!name) return "";
          return name.toLowerCase()
              .replace(/station/g, "").replace(/petrol/g, "").replace(/fuel/g, "")
              .replace(/oil/g, "").replace(/limited/g, "").replace(/ltd/g, "")
              .replace(/[^a-z0-9]/g, "").trim();
      };

      const dupProcessed = new Set();
      let delCount = 0;
      let mergCount = 0;

      for (let i = 0; i < stations.length; i++) {
          const s1 = stations[i];
          if (dupProcessed.has(s1.id)) continue;
          const group = [s1];
          for (let j = i + 1; j < stations.length; j++) {
              const s2 = stations[j];
              if (dupProcessed.has(s2.id)) continue;
              const dist = calculateDistance(s1.lat, s1.lng, s2.lat, s2.lng);
              const namesSimilar = normalizeName(s1.name) && normalizeName(s1.name).includes(normalizeName(s2.name)) || normalizeName(s2.name).includes(normalizeName(s1.name));
              if ((dist < 0.1 && namesSimilar) || dist < 0.05) {
                  group.push(s2);
                  dupProcessed.add(s2.id);
              }
          }

          if (group.length > 1) {
              group.sort((a, b) => {
                  const aHasPrice = a.prices && Object.keys(a.prices).length > 0;
                  const bHasPrice = b.prices && Object.keys(b.prices).length > 0;
                  if (aHasPrice && !bHasPrice) return -1;
                  if (!aHasPrice && bHasPrice) return 1;
                  if (a.source === 'user_manual' && b.source !== 'user_manual') return -1;
                  const aIsSync = a.id.startsWith('sync_') || a.id.startsWith('osm_');
                  const bIsSync = b.id.startsWith('sync_') || b.id.startsWith('osm_');
                  if (!aIsSync && bIsSync) return -1;
                  return (b.confirmations?.length || 0) - (a.confirmations?.length || 0);
              });

              const master = group[0];
              for (let k = 1; k < group.length; k++) {
                  const dup = group[k];
                  if (dup.prices && (!master.prices || Object.keys(dup.prices).some(pk => !master.prices[pk]))) {
                      await updateDoc(doc(db, 'stations', master.id), {
                          prices: { ...master.prices, ...dup.prices },
                          lastPriceUpdate: dup.lastPriceUpdate || master.lastPriceUpdate || new Date().toISOString(),
                          lastUpdated: new Date().toISOString()
                      });
                      mergCount++;
                  }
                  await deleteDoc(doc(db, 'stations', dup.id));
                  delCount++;
              }
          }
      }

      setImportStatus(`✅ Cleanup Done! Merged: ${mergCount}, Deleted: ${delCount}`);
      setTimeout(() => setImportStatus(""), 5000);
    } catch (e) {
      console.error(e);
      setImportStatus("❌ Cleanup failed: " + e.message);
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
    // 1. Check if we have prominent disclosure consent (Play Store Requirement)
    if (!hasLocationConsent) {
      setShowLocationDisclosure(true);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let { latitude, longitude } = position.coords;

        // EMULATOR FALLBACK: If we detect the default Google HQ location (California), 
        // redirect to Lagos for better testing experience.
        const isGoogleHQ = Math.abs(latitude - 37.422) < 0.01 && Math.abs(longitude - (-122.084)) < 0.01;
        if (isGoogleHQ) {
          console.warn("📍 Emulator detected in California. Teleporting to Lagos NNPC Mega Station...");
          latitude = 6.4323;
          longitude = 3.4682;
        }

        // Check if within Lagos bounds
        const isOutsideLagos = latitude < LAGOS_BOUNDS.latMin || latitude > LAGOS_BOUNDS.latMax ||
          longitude < LAGOS_BOUNDS.lngMin || longitude > LAGOS_BOUNDS.lngMax;

        if (isOutsideLagos && !isGoogleHQ) { // Don't block the emulator teleport
          setShowLagosOnlyModal(true);
        }

        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);

        // Find nearest station using proper distance calculation
        // We now use filteredStations to respect user search/filters.
        if (filteredStations.length > 0) {
          // 1. Get Top 10 geographic candidates (to account for road detour reality)
          const candidates = filteredStations
            .map(s => ({
              ...s,
              d: calculateDistance(latitude, longitude, s.lat, s.lng)
            }))
            .filter(s => s.d !== null)
            .sort((a, b) => a.d - b.d)
            .slice(0, 10);

          if (candidates.length > 0) {
            // 2. Fetch real-time (or traffic-fallback) travel times for the Top 10
            mapsService.getBatchTravelTimes({ lat: latitude, lng: longitude }, candidates)
              .then(travelResults => {
                // 3. Combine travel results with candidate data
                const augmentedCandidates = candidates.map((s, idx) => ({
                  ...s,
                  travel: travelResults[idx],
                  // Calculate sorting score: Drive Time + Queue Penalty
                  queueMin: s.queueStatus === 'short' ? 5 : (s.queueStatus === 'mild' ? 15 : (s.queueStatus === 'long' ? 45 : 30)),
                  driveMin: travelResults[idx]?.durationInTrafficMinutes || travelResults[idx]?.durationMinutes || (s.d / 30 * 60)
                }));

                // 4. Re-sort by Total Time (Drive + Queue), prioritizing ACTIVE stations
                const uniqueBrands = new Set();
                const top3Data = augmentedCandidates
                  .sort((a, b) => {
                    // Priority 1: Active stations first
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;

                    // Priority 2: Total Time
                    let aTotal = a.driveMin + a.queueMin;
                    let bTotal = b.driveMin + b.queueMin;

                    return aTotal - bTotal;
                  })
                  .slice(0, 3);

                if (top3Data.length > 0) {
                  // NEW: Update global travel stats so sidebar/markers can show 'Live Traffic'
                  const newStats = { ...travelStats };
                  augmentedCandidates.forEach(s => {
                    if (s.travel) newStats[s.id] = s.travel;
                  });
                  setTravelStats(newStats);

                  setSelectedStation(top3Data[0]);
                  setNearbyStations(top3Data.map(s => s.id));

                  // Generate Toast HTML for the refined top 3
                  const diagHtml = top3Data.map((s, idx) => {
                    const totalTime = s.driveMin + s.queueMin;
                    const isDry = s.status === 'inactive';

                    let qBadge = '';
                    if (isDry) qBadge = '<span style="color: #f87171; font-weight: bold;">⚪ Pumps Dry</span>';
                    else if (!s.queueStatus) qBadge = '<span style="color: #94a3b8;">⚪ Queue: Unknown</span>';
                    else if (s.queueStatus === 'short') qBadge = '<span style="color: #10b981; font-weight: bold;">⚡ Short Queue</span>';
                    else if (s.queueStatus === 'mild') qBadge = '<span style="color: #fbbf24; font-weight: bold;">⏳ Mild Queue</span>';
                    else if (s.queueStatus === 'long') qBadge = '<span style="color: #ef4444; font-weight: bold;">🚨 Long Queue</span>';

                    return `
                      <div style="font-size: 0.8rem; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.2); borderRadius: 12px; border: 1px solid ${isDry ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)'};">
                        <div style="display: flex; flex-direction: column; overflow: hidden; gap: 2px;">
                          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px; font-weight: 600;">${idx + 1}. ${s.name}</span>
                          <div style="font-size: 0.7rem; opacity: 0.9;">${qBadge}</div>
                        </div>
                        <div style="text-align: right; line-height: 1.2;">
                          <strong style="color: ${idx === 0 && !isDry ? '#10b981' : 'white'}; display: block;">${mapsService.formatDuration(s.driveMin + s.queueMin)} total</strong>
                          <span style="font-size: 0.7rem; opacity: 0.6; display: block;">${mapsService.formatDuration(s.driveMin)} drive</span>
                        </div>
                      </div>
                    `;
                  }).join('');

                  // Create toast notification
                  const toast = document.createElement('div');
                  toast.style.cssText = `
                    position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
                    background: linear-gradient(135deg, #1f2937, #111827); color: white;
                    padding: 24px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
                    z-index: 10000; max-width: 90%; width: 360px; border: 1px solid rgba(255,255,255,0.1);
                    animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                  `;
                  toast.innerHTML = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 1.4rem; font-weight: 900; color: #10b981; letter-spacing: -0.5px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                          <span>📍</span> Smart Nearby Results
                        </div>
                        <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 4px;">
                            ${top3Data[0].d > 50
                        ? '<span style="color: #fbbf24;">⚠️ GPS may be set to another region!</span>'
                        : (top3Data[0].travel?.hasTrafficData ? '⚡ Traffic-aware road routing' : 'Top results by drive & queue time')}
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">${diagHtml}</div>
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                            <span style="opacity: 0.6;">GPS Accuracy</span>
                            <span style="font-weight: bold; color: ${position.coords.accuracy < 30 ? '#10b981' : '#fbbf24'}">±${Math.round(position.coords.accuracy)}m</span>
                        </div>
                        <div style="font-size: 0.7rem; opacity: 0.4; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px;">
                            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="retry-gps" style="flex: 1; padding: 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; cursor: pointer; font-weight: 700; font-size: 0.9rem; transition: all 0.2s;">Retry</button>
                        <button id="close-toast" style="flex: 1; padding: 14px; border-radius: 14px; border: none; background: #10b981; color: #064e3b; cursor: pointer; font-weight: 800; font-size: 0.9rem; transition: all 0.2s;">Got it!</button>
                    </div>
                    <style>
                        @keyframes slideInDown { from { transform: translate(-50%, -30px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
                        #retry-gps:hover { background: rgba(255,255,255,0.1); }
                        #close-toast:hover { background: #34d399; transform: translateY(-1px); }
                    </style>
                  `;
                  document.body.appendChild(toast);
                  toast.querySelector('#retry-gps').onclick = () => { toast.remove(); handleFindNearest(); };
                  toast.querySelector('#close-toast').onclick = () => { toast.remove(); };
                  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 20000);

                  // Announce the closest station using Web Speech API
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel(); // Cancel any ongoing speech
                    const text = `Found ${top3Data.length} nearby stations. The closest is ${top3Data[0].name}, ${mapsService.formatDuration(top3Data[0].driveMin + top3Data[0].queueMin)} away.`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utterance);
                  }
                }

                if (isMobile) setViewMode('map');
              });
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

  const handleAcceptLocation = () => {
    localStorage.setItem('locationConsent', 'true');
    setHasLocationConsent(true);
    setShowLocationDisclosure(false);
    // Trigger location immediately after consent
    setTimeout(() => handleFindNearest(), 100);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };


  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-heart">⛽</div>
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '900',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-active)',
          textShadow: '0 0 10px var(--color-active-glow)'
        }}>
          FuelPulse
        </div>
        <div style={{
          marginTop: '10px',
          fontSize: '0.8rem',
          opacity: 0.6,
          letterSpacing: '0.05em'
        }}>
          Syncing with the street...
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app-container">
          {/* Location Rationale Helper */}
          {(!userLocation || isLocating) && !filters.searchQuery && !selectedStation && (
            <div style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: '90%',
              maxWidth: '320px',
              pointerEvents: 'none'
            }}>
              <div className="glass" style={{
                padding: '12px 16px',
                borderRadius: '16px',
                border: '1px solid var(--color-active)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(0,0,0,0.8)',
                pointerEvents: 'auto'
              }}>
                <div style={{ fontSize: '1.2rem', animation: 'pulse-badge 1s infinite' }}>📍</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>
                    {isLocating ? 'Pinpointing you...' : 'Enter your area'}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, lineHeight: 1.3 }}>
                    {isLocating
                      ? 'Establishing high-accuracy GPS for Lagos neighborhoods.'
                      : 'Search for a station or tap the map to find fuel near you.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="main-content" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>

            {/* Sidebar / List View */}
            <div className={`sidebar ${viewMode === 'list' && isMobile ? 'visible' : ''}`} style={{
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
                travelStats={travelStats}
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
                nearbyStations={nearbyStations}
                onStationSelect={handleStationSelect}
                onViewDetails={handleViewDetails}
                onReportClick={handleReportClick}
                onFindNearest={handleFindNearest}
                userLocation={userLocation}
                isLocating={isLocating}
                travelStats={travelStats}
                onMapClick={(latlng) => {
                  console.log("Map: Manual location set to", latlng);
                  setUserLocation({ lat: latlng.lat, lng: latlng.lng });

                  // Recalculate top 3 for manual pin
                  const activeStations = stations.filter(s => s.status === 'active');
                  const top3 = activeStations
                    .map(s => ({ id: s.id, d: calculateDistance(latlng.lat, latlng.lng, s.lat, s.lng) }))
                    .sort((a, b) => a.d - b.d)
                    .slice(0, 3);
                  setNearbyStations(top3.map(s => s.id));

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

          {/* Floating Action Buttons - Hidden when Fleet/Admin dashboards are open */}
          {!isFleetDashboardOpen && !isAdminDashboardOpen && (
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
          )}

          {/* Modals & Overlays */}
          <StationDetailsModal
            isOpen={!!viewingStation}
            onClose={() => setViewingStation(null)}
            station={viewingStation}
            user={user}
            userLocation={userLocation}
            onLoginRequest={() => {
              setViewingStation(null);
              setIsAuthModalOpen(true);
            }}
            onNavigate={handleNavigate}
          />

          <ReportModal
            isOpen={reportModalData.isOpen}
            station={reportModalData.station}
            user={user}
            userLocation={userLocation}
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
                onGlobalPriceUpdate={handleGlobalPriceUpdate}
                onCleanupDuplicates={handleCleanupDuplicates}
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

          {showLocationDisclosure && (
            <LocationDisclosure
              onAccept={handleAcceptLocation}
              onDecline={() => setShowLocationDisclosure(false)}
            />
          )}

          <LagosOnlyModal
            isOpen={showLagosOnlyModal}
            onClose={() => setShowLagosOnlyModal(false)}
            userLocation={userLocation}
          />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
