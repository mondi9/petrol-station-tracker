import { db } from './firebase';
import { collection, doc, updateDoc, addDoc, getDocs, query, where, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { checkPriceAlerts } from './alertService';

const COLLECTION_NAME = 'stations';

// ... existing code ...

// Subscribe to real-time updates
export const subscribeToStations = (onUpdate, onError) => {
    // ... same as before ...
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(q, (snapshot) => {
        const stations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter(s => {
            // Strict Filter: Only show stations in Lagos, Nigeria
            // Lat: 6.2 - 6.8, Lng: 2.5 - 4.5
            if (!s.lat || !s.lng) return true; // Keep manual ones without coords or allow editing later
            return s.lat >= 6.2 && s.lat <= 6.8 && s.lng >= 2.5 && s.lng <= 4.5;
        });
        onUpdate(stations);
    }, (error) => {
        console.error("Error fetching stations:", error);
        if (onError) onError(error);
    });
};

// Update a station's status and log the report
export const updateStationStatus = async (stationId, reportData, userId = null) => {
    const stationRef = doc(db, COLLECTION_NAME, stationId);
    // reportData = { fuelType, availability, queueLength, price, reporterName }

    // 1. Prepare Main Station Update
    // We update the specific availability for the reported fuel type.
    // Logic: If 'availability' is 'empty', we set that fuel to false/empty? 
    // Previous schema was { petrol: true/false }. New schema needs 'available' | 'low' | 'empty'.
    // Let's migrate/adapt the schema on the fly.
    // 'availablity' field in DB will now be { petrol: 'available', diesel: 'low', ... } instead of boolean?
    // Or we keep simple boolean for 'active' filter but add 'statusDetails'?
    // Let's go with a robust nested update.

    // We will use dot notation for nested updates to avoid overwriting other fields
    // e.g. "availability.petrol": "low"

    const updatePayload = {
        lastUpdated: new Date().toISOString(),
        [`availability.${reportData.fuelType}`]: reportData.availability, // 'available' | 'low' | 'empty'
        [`queue.${reportData.fuelType}`]: reportData.queueLength,
        confirmations: userId ? [userId] : [],
        flags: []
    };

    // Update overall station status
    // If ANY fuel is available or low, station is 'active'. If ALL are empty, 'inactive'.
    // Since we don't know the others without reading, we optimistically set to 'active' if this report is 'available'/'low'.
    if (reportData.availability !== 'empty') {
        updatePayload.status = 'active';
    }
    // If report is 'empty', we might flip to inactive if others are known empty? 
    // For now, let's keep it simple: If submitting a positive report, ensure active.

    // Update Price if provided
    if (reportData.price) {
        updatePayload[`prices.${reportData.fuelType}`] = reportData.price;
        updatePayload.lastPriceUpdate = new Date().toISOString();
    }

    // Add Reporter Name to Main Document for easier display
    if (reportData.reporterName) {
        updatePayload.lastReporter = reportData.reporterName;
    }

    // 2. Add to Reports Subcollection (Audit History)
    const historyData = {
        timestamp: serverTimestamp(),
        userId: userId || 'anonymous',
        ...reportData,
        device: 'web'
    };

    // Perform writes
    await Promise.all([
        updateDoc(stationRef, updatePayload),
        addDoc(collection(db, COLLECTION_NAME, stationId, 'reports'), historyData)
    ]);

    // Check if any price alerts should trigger
    if (reportData.price && reportData.fuelType) {
        await checkPriceAlerts(stationId, reportData.fuelType, reportData.price);
    }
};

export const formatPrice = (amount) => {
    if (!amount) return 'N/A';
    return '₦' + amount.toLocaleString();
};

// Format distance for display
export const formatDistance = (km) => {
    if (!km) return 'N/A';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
};


// Add a new station (Manual)
export const addStation = async (stationData) => {
    // 1. Geocode if coordinates are missing but address is present
    if ((!stationData.lat || !stationData.lng) && stationData.address) {
        try {
            const encodedAddr = encodeURIComponent(`${stationData.address}, Lagos, Nigeria`); // bias towards Lagos
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'PetrolPulse/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                stationData.lat = parseFloat(data[0].lat);
                stationData.lng = parseFloat(data[0].lon);
            }
        } catch (e) {
            console.warn("Geocoding failed for new station", e);
            // proceed anyway? Or throw?
            // If we don't have coords, it won't show on map properly unless we handle that.
            // But let's save it.
        }
    }

    // Default fields
    const newStation = {
        name: stationData.name,
        address: stationData.address || "Unknown Address",
        lat: stationData.lat || null,
        lng: stationData.lng || null,
        status: 'active', // Default to active for user-added stations
        lastUpdated: new Date().toISOString(),
        source: 'user_manual',
        prices: stationData.prices || null
    };

    // Add to Firestore (auto-ID)
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newStation);
    return docRef.id;
};


// ... Helpers ...

export const getStatusColor = (status) => {
    return status === 'active' ? 'var(--color-active)' : 'var(--color-inactive)';
};

export const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
};

// Seed function to upload initial data (run once)
export const seedInitialData = async (initialData) => {
    const promises = initialData.map(async (station) => {
        // Use setDoc with the station.id as the document ID
        // This prevents duplicates and allows re-running to update/fix data
        await setDoc(doc(db, COLLECTION_NAME, station.id), station);
    });
    await Promise.all(promises);
    console.log("Seeding complete");
};

// Calculate distance between two points in km (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1)); // Return 1 decimal place
};

// Calculate estimated travel time in minutes
export const calculateTravelTime = (distanceKm, speedKmH = 30) => {
    if (!distanceKm) return null;
    const hours = distanceKm / speedKmH;
    return Math.ceil(hours * 60);
};

/**
 * Records a user's presence at a station (Ping).
 * This allows us to estimate live crowd size.
 * @param {string} stationId
 * @param {string} userId (optional, uses anonymous ID if missing)
 */
export const recordUserPresence = async (stationId, userId = 'anon') => {
    if (!stationId) return;
    // We use a subcollection 'pings' to track active users
    // Doc ID is userId to prevent duplicate counting per user
    const pingRef = doc(db, COLLECTION_NAME, stationId, 'pings', userId);
    try {
        await setDoc(pingRef, {
            timestamp: serverTimestamp(),
            device_type: 'web'
        });
    } catch (e) {
        console.error("Error regarding presence:", e);
    }
};

/**
 * Gets the number of active users (pings in last 15 mins).
 * @param {string} stationId
 * @returns {Promise<number>}
 */
export const getLiveVisitors = async (stationId) => {
    try {
        const pingsRef = collection(db, COLLECTION_NAME, stationId, 'pings');
        // 15 minutes ago
        const timeThreshold = new Date(Date.now() - 15 * 60 * 1000);

        const q = query(pingsRef, where("timestamp", ">", timeThreshold));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (e) {
        console.error("Error active visitors:", e);
        return 0;
    }
};
/**
 * Verifies or flags a station report.
 * @param {string} stationId 
 * @param {'confirm' | 'flag'} type 
 * @param {string} userId 
 */
export const verifyStation = async (stationId, type, userId) => {
    if (!userId) return; // Must be logged in
    const stationRef = doc(db, COLLECTION_NAME, stationId);

    if (type === 'confirm') {
        await updateDoc(stationRef, {
            confirmations: arrayUnion(userId),
            flags: arrayRemove(userId)
        });
    } else {
        await updateDoc(stationRef, {
            flags: arrayUnion(userId),
            confirmations: arrayRemove(userId)
        });
    }
};

/**
 * Exports station data to a CSV blob and triggers download.
 * @param {Array} stations 
 */
export const exportStationsToCSV = (stations) => {
    if (!stations || stations.length === 0) return;

    // Define CSV Headers
    const headers = ['Name', 'Address', 'Status', 'Petrol Price', 'Diesel Price', 'Gas Price', 'Last Updated'];

    // Map data to rows
    const rows = stations.map(s => [
        `"${s.name}"`, // Quote strings to handle commas
        `"${s.address}"`,
        s.status,
        s.prices?.petrol || 'N/A',
        s.prices?.diesel || 'N/A',
        s.prices?.gas || 'N/A',
        new Date(s.lastUpdated).toLocaleString()
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Create Blob and Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `petrol_stations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
