import { db } from './firebase';
import { collection, doc, updateDoc, addDoc, getDocs, query, onSnapshot, deleteDoc, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'depots';

// Subscribe to real-time updates for depots
export const subscribeToDepots = (onUpdate, onError) => {
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(q, (snapshot) => {
        const depots = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(depots);
    }, (error) => {
        console.error("Error fetching depots:", error);
        if (onError) onError(error);
    });
};

// Add a new depot with geocoding
export const addDepot = async (depotData) => {
    let { name, address, lat, lng } = depotData;

    // Geocode if coordinates are missing
    if ((!lat || !lng) && address) {
        try {
            // Use our new Google Geocoding Proxy
            const proxyUrl = `/.netlify/functions/traffic-proxy?type=geocode&address=${encodeURIComponent(address + ', Lagos, Nigeria')}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                lat = location.lat;
                lng = location.lng;
            } else {
                // Fallback to OSM if Google fails
                const encodedAddr = encodeURIComponent(`${address}, Lagos, Nigeria`);
                const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`;
                const osmResponse = await fetch(osmUrl, {
                    headers: { 'User-Agent': 'PetrolPulse/1.0' }
                });
                const osmData = await osmResponse.json();
                if (osmData && osmData.length > 0) {
                    lat = parseFloat(osmData[0].lat);
                    lng = parseFloat(osmData[0].lon);
                }
            }
        } catch (e) {
            console.warn("Geocoding failed for new depot", e);
        }
    }

    const newDepot = {
        name,
        address,
        lat: lat || null,
        lng: lng || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newDepot);
    return { id: docRef.id, ...newDepot };
};

// Update an existing depot
export const updateDepot = async (depotId, updateData) => {
    const depotRef = doc(db, COLLECTION_NAME, depotId);
    const data = {
        ...updateData,
        updatedAt: serverTimestamp()
    };
    await updateDoc(depotRef, data);
};

// Delete a depot
export const deleteDepot = async (depotId) => {
    const depotRef = doc(db, COLLECTION_NAME, depotId);
    await deleteDoc(depotRef);
};
