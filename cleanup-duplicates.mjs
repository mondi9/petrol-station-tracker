import admin from 'firebase-admin';

// Initialize Firebase Admin with Project ID
// This assumes environment has access (e.g. gcloud auth application-default login)
// or is running in a Firebase-managed environment.
admin.initializeApp({
  projectId: 'petrol-station-tracker'
});

const db = admin.firestore();

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

async function cleanup() {
    console.log("Fetching stations (using Firebase Admin)...");
    try {
        const snapshot = await db.collection('stations').get();
        const stations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${stations.length} stations.`);

        const duplicatesProcessed = new Set();
        let deletedCount = 0;
        let mergedCount = 0;

        for (let i = 0; i < stations.length; i++) {
            const s1 = stations[i];
            if (duplicatesProcessed.has(s1.id)) continue;

            const group = [s1];

            for (let j = i + 1; j < stations.length; j++) {
                const s2 = stations[j];
                if (duplicatesProcessed.has(s2.id)) continue;

                const distance = calculateDistance(s1.lat, s1.lng, s2.lat, s2.lng);
                const name1 = normalizeName(s1.name);
                const name2 = normalizeName(s2.name);

                const isClose = distance < 0.1; // 100 meters
                const namesSimilar = name1 && name2 && (name1.includes(name2) || name2.includes(name1));
                
                if ((isClose && namesSimilar) || distance < 0.05) {
                    group.push(s2);
                    duplicatesProcessed.add(s2.id);
                }
            }

            if (group.length > 1) {
                console.log(`Merging group of ${group.length} stations:`);
                
                group.sort((a, b) => {
                    const aHasPrice = a.prices && Object.keys(a.prices).length > 0;
                    const bHasPrice = b.prices && Object.keys(b.prices).length > 0;
                    if (aHasPrice && !bHasPrice) return -1;
                    if (!aHasPrice && bHasPrice) return 1;

                    if (a.source === 'user_manual' && b.source !== 'user_manual') return -1;
                    if (a.source !== 'user_manual' && b.source === 'user_manual') return 1;

                    const aIsSync = a.id.startsWith('sync_') || a.id.startsWith('osm_');
                    const bIsSync = b.id.startsWith('sync_') || b.id.startsWith('osm_');
                    if (!aIsSync && bIsSync) return -1;
                    if (aIsSync && !bIsSync) return 1;

                    return (b.confirmations?.length || 0) - (a.confirmations?.length || 0);
                });

                const master = group[0];
                console.log(`  Master Selected: ${master.name} [ID: ${master.id}]`);

                for (let k = 1; k < group.length; k++) {
                    const dup = group[k];
                    console.log(`  Deleting Duplicate: ${dup.name} [ID: ${dup.id}]`);

                    try {
                        if (dup.prices && (!master.prices || Object.keys(dup.prices).some(k => !master.prices[k]))) {
                            console.log(`    Merging prices from ${dup.id} to ${master.id}`);
                            await db.collection('stations').doc(master.id).update({
                                prices: { ...master.prices, ...dup.prices },
                                lastPriceUpdate: dup.lastPriceUpdate || master.lastPriceUpdate || new Date().toISOString(),
                                lastUpdated: new Date().toISOString()
                            });
                            mergedCount++;
                        }

                        await db.collection('stations').doc(dup.id).delete();
                        deletedCount++;
                    } catch (err) {
                        console.error(`    FAILED to process duplicate ${dup.id}:`, err.message);
                    }
                }
            }
        }

        console.log(`\nCleanup complete!`);
        console.log(`- Stations merged: ${mergedCount}`);
        console.log(`- Stations deleted: ${deletedCount}`);

    } catch (error) {
        console.error("Cleanup failed:", error);
        if (error.message.includes("Credential")) {
            console.log("\nTIP: You may need to run 'gcloud auth application-default login' or provide a service account key.");
        }
    }
}

cleanup();
