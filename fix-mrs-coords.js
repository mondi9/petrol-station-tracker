// Script to fix MRS Festac coordinates in Firestore
// Run this once to update the existing station record

import { db } from './src/services/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

const fixMRSCoordinates = async () => {
    try {
        const stationRef = doc(db, 'stations', '6');

        await updateDoc(stationRef, {
            lat: 6.4718,
            lng: 3.2844,
            address: "22 Rd, Festac Town"
        });

        console.log('✅ Successfully updated MRS Festac coordinates!');
        console.log('New coordinates: 6.4718, 3.2844');
    } catch (error) {
        console.error('❌ Error updating coordinates:', error);
    }
};

fixMRSCoordinates();
