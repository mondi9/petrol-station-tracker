import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCzSH3Hr6Lj4yFSVhh-An4NfDUfdn-laTk",
    authDomain: "petrol-station-tracker.firebaseapp.com",
    projectId: "petrol-station-tracker",
    storageBucket: "petrol-station-tracker.firebasestorage.app",
    messagingSenderId: "179799011744",
    appId: "1:179799011744:web:946861612075377720f4c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/station/g, "")
        .replace(/petrol/g, "")
        .replace(/fuel/g, "")
        .replace(/oil/g, "")
        .replace(/limited/g, "")
        .replace(/ltd/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

console.log("Fetching stations...");
const snapshot = await getDocs(collection(db, 'stations'));
const stations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
console.log(`Found ${stations.length} stations.`);

const duplicates = [];
const checked = new Set();

for (let i = 0; i < stations.length; i++) {
    const s1 = stations[i];
    if (checked.has(s1.id)) continue;

    for (let j = i + 1; j < stations.length; j++) {
        const s2 = stations[j];
        if (checked.has(s2.id)) continue;

        const distance = calculateDistance(s1.lat, s1.lng, s2.lat, s2.lng);
        const name1 = normalizeName(s1.name);
        const name2 = normalizeName(s2.name);

        // Within 100 meters AND names are similar OR names are identical
        const isClose = distance < 0.1; // 100 meters
        const namesSimilar = name1 && name2 && (name1.includes(name2) || name2.includes(name1) || name1 === name2);
        
        if (isClose && namesSimilar) {
            duplicates.push({ s1, s2, distance, reason: "Close proximity and similar name" });
        } else if (isClose && (!name1 || !name2)) {
            duplicates.push({ s1, s2, distance, reason: "Close proximity (one or both missing name)" });
        } else if (distance < 0.05) { // 50 meters, even if names aren't similar
             duplicates.push({ s1, s2, distance, reason: "Extreme proximity" });
        }
    }
}

if (duplicates.length === 0) {
    console.log("No obvious duplicates found.");
} else {
    console.log(`Found ${duplicates.length} potential duplicate pairs:\n`);
    duplicates.forEach((pair, idx) => {
        console.log(`Pair ${idx + 1} (${pair.reason}, distance: ${Math.round(pair.distance * 1000)}m):`);
        console.log(`  - 1: ${pair.s1.name} (${pair.s1.address}) [ID: ${pair.s1.id}] Source: ${pair.s1.source || 'unknown'}`);
        console.log(`  - 2: ${pair.s2.name} (${pair.s2.address}) [ID: ${pair.s2.id}] Source: ${pair.s2.source || 'unknown'}`);
        console.log("");
    });
}

process.exit(0);
