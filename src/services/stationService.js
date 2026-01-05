import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, addDoc } from 'firebase/firestore';

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
export const updateStationStatus = async (stationId, status) => {
    const stationRef = doc(db, COLLECTION_NAME, stationId);
    await updateDoc(stationRef, {
        status: status,
        lastUpdated: new Date().toISOString()
    });
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
