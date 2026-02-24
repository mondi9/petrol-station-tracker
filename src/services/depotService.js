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
            const encodedAddr = encodeURIComponent(`${address}, Lagos, Nigeria`);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'PetrolPulse/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lng = parseFloat(data[0].lon);
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
