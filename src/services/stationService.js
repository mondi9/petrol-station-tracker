import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, addDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';

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

// Update a station's status
export const updateStationStatus = async (stationId, status, queueStatus = null) => {
    const stationRef = doc(db, COLLECTION_NAME, stationId);
    const updateData = {
        status: status,
        lastUpdated: new Date().toISOString()
    };
    if (queueStatus) {
        updateData.queueStatus = queueStatus;
    } else if (status === 'inactive') {
        // Clear queue status if station is inactive
        updateData.queueStatus = null;
    }

    await updateDoc(stationRef, updateData);
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
        source: 'user_manual'
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
