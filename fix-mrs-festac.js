// Script to update MRS Festac coordinates to the correct location
// This fixes the "Find Nearest Station" issue where AP was showing instead of MRS

import { db } from './src/services/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

const updateMRSFestac = async () => {
    try {
        console.log('🔄 Updating MRS Festac coordinates...');

        const stationRef = doc(db, 'stations', '6');

        // Correct coordinates for MRS Festac (22 Rd, Festac Town)
        // These are closer to the actual Festac location
        await updateDoc(stationRef, {
            lat: 6.4652,
            lng: 3.2803,
            address: "22 Rd, Festac Town, Lagos"
        });

        console.log('✅ Successfully updated MRS Festac coordinates!');
        console.log('New coordinates:');
        console.log('  Latitude: 6.4652');
        console.log('  Longitude: 3.2803');
        console.log('');
        console.log('Please refresh the page to see the changes.');
        console.log('MRS Festac should now appear as the nearest station when in Festac area.');
    } catch (error) {
        console.error('❌ Error updating coordinates:', error);
        console.error('Make sure you are logged in and have admin privileges.');
    }
};

// Run the update
updateMRSFestac();
