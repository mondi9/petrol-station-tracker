/**
 * Script to add sample queue data to Firebase stations
 * This will add queue times to demonstrate the color-coded queue status feature
 * 
 * Run with: node scripts/add-sample-queue-data.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration (same as your app)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate random queue time based on distribution
 * 40% short (5-15 min)
 * 40% medium (16-30 min)
 * 20% long (31-60 min)
 */
function generateQueueTime() {
    const rand = Math.random();
    if (rand < 0.4) {
        // Short queue: 5-15 minutes
        return Math.floor(Math.random() * 11) + 5;
    } else if (rand < 0.8) {
        // Medium queue: 16-30 minutes
        return Math.floor(Math.random() * 15) + 16;
    } else {
        // Long queue: 31-60 minutes
        return Math.floor(Math.random() * 30) + 31;
    }
}

/**
 * Add sample queue data to all stations
 */
async function addSampleQueueData() {
    try {
        console.log('🔄 Fetching stations from Firebase...');
        const stationsRef = collection(db, 'stations');
        const snapshot = await getDocs(stationsRef);

        console.log(`📊 Found ${snapshot.size} stations`);

        let updated = 0;
        const updates = [];

        for (const docSnapshot of snapshot.docs) {
            const stationData = docSnapshot.data();
            const stationId = docSnapshot.id;

            // Generate queue times for different fuel types
            const queue = {};

            // Add queue time for petrol if station has it
            if (stationData.prices?.petrol || stationData.availability?.petrol) {
                queue.petrol = generateQueueTime();
            }

            // Add queue time for diesel if station has it
            if (stationData.prices?.diesel || stationData.availability?.diesel) {
                queue.diesel = generateQueueTime();
            }

            // Add queue time for gas if station has it
            if (stationData.prices?.gas || stationData.availability?.gas) {
                queue.gas = generateQueueTime();
            }

            // If no fuel types found, default to petrol
            if (Object.keys(queue).length === 0) {
                queue.petrol = generateQueueTime();
            }

            // Update the station with queue data
            const updateData = {
                queue,
                lastQueueUpdate: new Date().toISOString()
            };

            updates.push(
                updateDoc(doc(db, 'stations', stationId), updateData)
                    .then(() => {
                        const maxQueue = Math.max(...Object.values(queue));
                        const status = maxQueue <= 15 ? '🟢 SHORT' : maxQueue <= 30 ? '🟡 MEDIUM' : '🔴 LONG';
                        console.log(`✅ ${stationData.name}: ${status} (${maxQueue} min)`);
                        updated++;
                    })
            );
        }

        await Promise.all(updates);

        console.log(`\n🎉 Successfully updated ${updated} stations with sample queue data!`);
        console.log('\n📍 Queue Status Distribution:');
        console.log('   🟢 Short (≤15 min) - Green markers');
        console.log('   🟡 Medium (16-30 min) - Yellow markers');
        console.log('   🔴 Long (>30 min) - Red markers');
        console.log('\n💡 Refresh your browser to see the colored markers!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding queue data:', error);
        process.exit(1);
    }
}

// Run the script
addSampleQueueData();
