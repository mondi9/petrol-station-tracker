import { db } from './src/services/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

const updateStations = async () => {
    try {
        console.log('🔄 Updating AP and Mobil coordinates...');

        const apRef = doc(db, 'stations', 'sync_ap');
        const mobilRef = doc(db, 'stations', 'sync_mobil');

        // MRS is at 6.4675, 3.2836
        // We want AP and Mobil to be the next closest (closer than 0.783 km)
        
        // AP (Ardova PLC) on 21 Road
        await updateDoc(apRef, {
            lat: 6.4680,
            lng: 3.2840,
            address: "21 Road, Festac Town"
        });

        // Mobil at 4th Ave/23 Rd Junction
        await updateDoc(mobilRef, {
            lat: 6.4670,
            lng: 3.2845,
            address: "4th Ave/23 Rd Junction, Festac, Lagos"
        });

        console.log('✅ Successfully updated AP and Mobil coordinates!');
        console.log('Please refresh the app. AP and Mobil should now appear right after MRS.');
    } catch (error) {
        console.error('❌ Error updating coordinates:', error);
    }
};

updateStations();
