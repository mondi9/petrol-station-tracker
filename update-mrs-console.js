// Direct script to update MRS Festac coordinates in Firestore
// Run this in the browser console while on the app page

// This will update station ID "6" (MRS Festac) with correct coordinates
const updateMRSCoordinates = async () => {
    try {
        // Get Firestore from the window (it's already loaded in the app)
        const { db } = await import('./src/services/firebase.js');
        const { doc, updateDoc } = await import('firebase/firestore');

        const stationRef = doc(db, 'stations', '6');

        await updateDoc(stationRef, {
            lat: 6.4665,
            lng: 3.2838,
            address: "22 Rd, opposite 21 Rd junction, Festac Town"
        });

        console.log('✅ Successfully updated MRS Festac coordinates!');
        console.log('New coordinates: lat: 6.4665, lng: 3.2838');
        console.log('Please refresh the page to see the changes.');
    } catch (error) {
        console.error('❌ Error updating coordinates:', error);
    }
};

// Run the update
updateMRSCoordinates();
