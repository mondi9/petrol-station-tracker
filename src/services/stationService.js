import { db } from './firebase';
import { collection, doc, updateDoc, addDoc, getDocs, query, where, serverTimestamp, getDoc, onSnapshot, setDoc, arrayUnion, arrayRemove, orderBy, limit } from 'firebase/firestore';
import { checkPriceAlerts } from './alertService';
import { calculateConsensusValue, CONSENSUS_THRESHOLD, getReportWeight } from './verificationService';
import mapsService from './mapsService';

const COLLECTION_NAME = 'stations';

// ... existing code ...

// Subscribe to real-time updates
export const subscribeToStations = (onUpdate, onError) => {
    // ... same as before ...
    const q = query(collection(db, COLLECTION_NAME));

    return onSnapshot(q, (snapshot) => {
        const stations = snapshot.docs.map(doc => {
            const data = doc.data();

            // Calculate queueStatus from queue object if not present
            let queueStatus = data.queueStatus;
            if (!queueStatus && data.queue) {
                // Get the maximum queue time from all fuel types
                const queueTimes = Object.values(data.queue).filter(v => typeof v === 'number');
                if (queueTimes.length > 0) {
                    const maxQueueTime = Math.max(...queueTimes);
                    queueStatus = calculateQueueStatus(maxQueueTime);
                }
            }

            // Calculate Freshness & Trust Score
            const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
            const hoursOld = lastUpdated ? (new Date() - lastUpdated) / (1000 * 60 * 60) : Infinity;
            const freshnessStatus = hoursOld <= 4 ? 'fresh' : hoursOld <= 12 ? 'stale' : 'unknown';

            // Determine Trust Level (Confidence System)
            let trustLevel = 'unknown';
            const confirmationCount = data.confirmations?.length || 0;
            const flagCount = data.flags?.length || 0;

            if (data.status === 'active') {
                if (freshnessStatus === 'fresh') {
                    // High confidence: Photo or Verified Reporter
                    if (data.hasPhoto || (data.lastReporter && data.lastReporter.includes('🛡️'))) {
                        trustLevel = 'verified-fresh';
                    } else if (confirmationCount >= 3) {
                        // Community sync: 3+ confirmations
                        trustLevel = 'community-sync';
                    } else {
                        // Recently seen: 1+ confirmation or fresh report
                        trustLevel = 'recently-seen';
                    }
                } else if (freshnessStatus === 'stale') {
                    trustLevel = 'outdated';
                }

                // Check for conflict (Mixed Reports)
                if (flagCount > 0 && flagCount < confirmationCount) {
                    trustLevel = 'mixed-reports';
                }
            } else if (data.status === 'inactive') {
                if (flagCount >= 3) {
                    trustLevel = 'confirmed-dry';
                } else {
                    trustLevel = 'inactive';
                }
            }

            // Safety check for mixed reports from availability object
            if (data.availability) {
                const vals = Object.values(data.availability);
                if (vals.includes('available') && vals.includes('empty') && trustLevel !== 'mixed-reports') {
                    trustLevel = 'mixed-reports';
                }
            }

            // APPLY DATA DECAY (TTL) RULES
            // Queue: Soft 2h, Hard 4h
            if (queueStatus && hoursOld > 4) {
                queueStatus = null;
            }

            // Status: Hard 16h (Relaxed as per user request to avoid "Empty" markers)
            let displayStatus = data.status;
            // if (displayStatus !== 'unknown' && hoursOld > 24) {
            //     displayStatus = 'unknown';
            // }

            // Prices: Soft 24h, Hard 48h (Calculate price status)
            const lastPriceUpdate = data.lastPriceUpdate ? new Date(data.lastPriceUpdate) : null;
            const priceHoursOld = lastPriceUpdate ? (new Date() - lastPriceUpdate) / (1000 * 60 * 60) : Infinity;
            let displayPrices = { ...data.prices };
            // Cut-off removed as per user request

            return {
                id: doc.id,
                ...data,
                status: displayStatus,
                prices: displayPrices,
                queueStatus,
                freshnessStatus,
                trustLevel,
                hoursOld,
                priceHoursOld
            };
        }).filter(s => {
            // Filter out unknown stations
            const isUnknown = s.name === 'Unknown Station' ||
                s.status === 'unknown' ||
                !s.address ||
                s.address === 'Lagos, Nigeria';

            if (isUnknown) return false;

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

// Update a station's status and log the report
export const updateStationStatus = async (stationId, reportData, userId = null, stationName = 'Unknown Station') => {
    const stationRef = doc(db, COLLECTION_NAME, stationId);

    // 1. Calculate the weight of this specific report
    const incomingWeight = getReportWeight({ ...reportData, userId });

    // 2. Prepare the standard audit log
    const historyData = {
        timestamp: serverTimestamp(),
        userId: userId || 'anonymous',
        ...reportData,
        device: 'web',
        weight: incomingWeight
    };

    // 3. Evaluate Consensus for display fields
    // We check if this report + recent ones cross the threshold to change the main UI
    const fuelType = reportData.fuelType;

    // Fields we want to validate via consensus
    const priceConsensus = await calculateConsensusValue(stationId, 'price', fuelType);
    const availabilityConsensus = await calculateConsensusValue(stationId, 'availability', fuelType);
    const queueConsensus = await calculateConsensusValue(stationId, 'queueLength', fuelType);

    // Prepare update payload
    const updatePayload = {
        lastUpdated: new Date().toISOString(),
    };

    // PRICE CONSENSUS
    // Update main price ONLY if new consensus is reached or if this report is "verified" (Weight 1.0)
    if (incomingWeight >= 1.0 || (priceConsensus.value && priceConsensus.totalWeight >= CONSENSUS_THRESHOLD)) {
        const targetPrice = incomingWeight >= 1.0 ? reportData.price : priceConsensus.value;
        if (targetPrice) {
            updatePayload[`prices.${fuelType}`] = targetPrice;
            updatePayload.lastPriceUpdate = new Date().toISOString();
        }
    }

    // AVAILABILITY & STATUS CONSENSUS
    if (incomingWeight >= 1.0 || (availabilityConsensus.value && availabilityConsensus.totalWeight >= CONSENSUS_THRESHOLD)) {
        const targetAvailability = incomingWeight >= 1.0 ? reportData.availability : availabilityConsensus.value;
        updatePayload[`availability.${fuelType}`] = targetAvailability;

        // Update overall station status
        if (targetAvailability !== 'empty') {
            updatePayload.status = 'active';
        } else {
            // Check if others are empty (Simplified: stay active if any was available, but here we just follow the consensus of the current fuel)
            // A more complex check would look at diesel/premium too.
            // For now, if petrol is dry, and it's the main thing people check, we might mark inactive or let decay handle it.
        }
    }

    // QUEUE CONSENSUS
    if (incomingWeight >= 1.0 || (queueConsensus.value !== null && queueConsensus.totalWeight >= CONSENSUS_THRESHOLD)) {
        const targetQueue = incomingWeight >= 1.0 ? reportData.queueLength : queueConsensus.value;
        updatePayload[`queue.${fuelType}`] = targetQueue;
    }

    // Metadata updates
    if (reportData.reporterName) updatePayload.lastReporter = reportData.reporterName;
    if (reportData.comment) updatePayload.lastComment = reportData.comment;
    if (reportData.photoUrl) {
        updatePayload.lastPhotoUrl = reportData.photoUrl;
        updatePayload.lastPhotoThumbUrl = reportData.photoThumbUrl;
        updatePayload.hasPhoto = true;
    }
    if (reportData.quality !== undefined) updatePayload.reportQuality = reportData.quality;

    // Price History (always log the raw report price to history)
    const priceHistoryWrites = [];
    if (reportData.price && reportData.fuelType) {
        priceHistoryWrites.push(
            addDoc(collection(db, COLLECTION_NAME, stationId, 'priceHistory'), {
                timestamp: serverTimestamp(),
                fuelType: reportData.fuelType,
                price: reportData.price,
                stationId,
                stationName,
                userId: userId || 'anonymous'
            })
        );
    }

    // Perform writes
    await Promise.all([
        updateDoc(stationRef, updatePayload),
        addDoc(collection(db, COLLECTION_NAME, stationId, 'reports'), historyData),
        ...priceHistoryWrites
    ]);

    // Check if any price alerts should trigger (only on confirmed updates)
    if (updatePayload[`prices.${fuelType}`]) {
        await checkPriceAlerts(stationId, fuelType, updatePayload[`prices.${fuelType}`], stationName);
    }
};

/**
 * Verify a station's price
 * @param {string} stationId
 * @param {string} fuelType
 * @param {string} userId
 */
export const verifyPrice = async (stationId, fuelType, userId) => {
    if (!userId || !stationId) return;
    try {
        // 1. Add verification record
        await addDoc(collection(db, COLLECTION_NAME, stationId, 'price_verifications'), {
            fuelType,
            userId,
            timestamp: serverTimestamp(),
            verified: true
        });

        // 2. Increment verification count on station doc (Optimistic)
        // Note: Real app should use transactions or cloud functions to aggregate this safely.
        // For now, we just increment a counter field.
        const stationRef = doc(db, COLLECTION_NAME, stationId);
        // We need 'increment' from firestore
        const { increment } = await import('firebase/firestore');

        await updateDoc(stationRef, {
            [`verifications.${fuelType}`]: increment(1),
            lastVerified: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error verifying price:", error);
        throw error;
    }
};

export const formatPrice = (amount) => {
    if (!amount) return 'N/A';
    return '₦' + amount.toLocaleString();
};

// Format distance for display
export const formatDistance = (km) => {
    if (km === null || km === undefined) return 'N/A';
    if (km === 0) return '0m';
    if (km < 1) {
        const meters = Math.round(km * 1000);
        return meters < 1 ? '< 1m' : `${meters}m`;
    }
    return `${km.toFixed(1)}km`;
};


// Add a new station (Manual)
export const addStation = async (stationData) => {
    // 1. Geocode if coordinates are missing but address is present
    // 1. Geocode if coordinates are missing but address is present
    if ((!stationData.lat || !stationData.lng) && stationData.address) {
        try {
            // Use our new mapsService (via Google Proxy)
            const result = await mapsService.geocodeAddress(stationData.address + ', Lagos, Nigeria');

            if (result) {
                stationData.lat = result.lat;
                stationData.lng = result.lng;
            } else {
                // Fallback to OSM if Google fails
                const encodedAddr = encodeURIComponent(`${stationData.address}, Lagos, Nigeria`);
                const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`;
                const osmResponse = await fetch(osmUrl, {
                    headers: { 'User-Agent': 'PetrolPulse/1.0' }
                });
                const osmData = await osmResponse.json();
                if (osmData && osmData.length > 0) {
                    stationData.lat = parseFloat(osmData[0].lat);
                    stationData.lng = parseFloat(osmData[0].lon);
                }
            }
        } catch (e) {
            console.warn("Geocoding failed for new station", e);
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
        source: 'user_manual',
        prices: stationData.prices || null
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

// Calculate distance between two points in km (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(3)); // Return 3 decimal places (meter precision)
};

// Calculate estimated travel time in minutes
export const calculateTravelTime = (distanceKm, speedKmH = 30) => {
    if (!distanceKm) return null;
    const hours = distanceKm / speedKmH;
    return Math.ceil(hours * 60);
};

/**
 * Gets traffic-aware distance and duration using Google Maps
 * Falls back to Haversine and static speed if API fails or key is missing
 */
export const getTrafficAwareDistance = async (origin, destination) => {
    // 1. Try Google Maps via proxy
    const trafficData = await mapsService.getTrafficDistance(origin, destination);
    
    if (trafficData) {
        return trafficData;
    }

    // 2. Fallback to Haversine
    const lat1 = typeof origin === 'object' ? origin.lat : null;
    const lon1 = typeof origin === 'object' ? origin.lng : null;
    const lat2 = typeof destination === 'object' ? destination.lat : null;
    const lon2 = typeof destination === 'object' ? destination.lng : null;

    if (lat1 && lon1 && lat2 && lon2) {
        const distKm = calculateDistance(lat1, lon1, lat2, lon2);
        return {
            distanceKm: distKm,
            durationMins: calculateTravelTime(distKm),
            text: `${calculateTravelTime(distKm)} mins (approx)`,
            trafficModel: false
        };
    }

    return null;
};

/**
 * Calculate the potential savings or loss by driving to a specific station
 * compared to a reference price (e.g., the average or highest price).
 * 
 * @param {number} stationPrice - Price per liter at the target station
 * @param {number} referencePrice - The baseline price to compare against
 * @param {number} distanceKm - Distance from depot/start to station
 * @param {number} tankSizeL - Total liters to purchase
 * @param {number} fuelConsumption - Fuel consumption in Liters per km (e.g. 0.1 for 10km/L)
 * @returns {object} { netSavings, travelCost, grossSavings, isProfitable }
 */
export const calculateSavings = (stationPrice, referencePrice, distanceKm, tankSizeL = 50, fuelConsumption = 0.15) => {
    if (!stationPrice || !referencePrice || distanceKm == null) return null;

    // 1. Gross Savings: (RefPrice - StationPrice) * Volume
    const priceDiff = referencePrice - stationPrice;
    const grossSavings = priceDiff * tankSizeL;

    // 2. Travel Cost: Distance * FuelConsumption * RefPrice (Cost of fuel burnt to get there)
    // We assume the fuel burnt effectively costs the reference price (or average market rate)
    // Note: This is one-way distance. Should it be round trip? 
    // Usually fleet logistics is A -> Sales -> B, but let's assume simple detailed diversion cost.
    // Let's use 2x distance for "Round Trip" cost if they have to come back, 
    // but for Fleet (Depot -> Station -> Route), 1x distance is diversion cost. 
    // Let's stick to 1x for "Distance from Depot" as the metric.
    const fuelConsumed = distanceKm * fuelConsumption;
    const travelCost = fuelConsumed * referencePrice;

    // 3. Net Benefit
    const netSavings = grossSavings - travelCost;

    return {
        grossSavings,
        travelCost,
        netSavings,
        isProfitable: netSavings > 0
    };
};

// Format travel time into a readable string
export const formatTravelTime = (minutes) => {
    if (minutes === null || minutes === undefined) return '';
    if (minutes < 60) return `${minutes} mins`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Records a user's presence at a station (Ping).
 * This allows us to estimate live crowd size.
 * @param {string} stationId
 * @param {string} userId (optional, uses anonymous ID if missing)
 */
export const recordUserPresence = async (stationId, userId = 'anon') => {
    if (!stationId) return;
    // We use a subcollection 'pings' to track active users
    // Doc ID is userId to prevent duplicate counting per user
    const pingRef = doc(db, COLLECTION_NAME, stationId, 'pings', userId);
    try {
        await setDoc(pingRef, {
            timestamp: serverTimestamp(),
            device_type: 'web'
        });
    } catch (e) {
        console.error("Error regarding presence:", e);
    }
};

/**
 * Gets the number of active users (pings in last 15 mins).
 * @param {string} stationId
 * @returns {Promise<number>}
 */
export const getLiveVisitors = async (stationId) => {
    try {
        const pingsRef = collection(db, COLLECTION_NAME, stationId, 'pings');
        // 15 minutes ago
        const timeThreshold = new Date(Date.now() - 15 * 60 * 1000);

        const q = query(pingsRef, where("timestamp", ">", timeThreshold));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (e) {
        console.error("Error active visitors:", e);
        return 0;
    }
};
/**
 * Verifies or flags a station report.
 * @param {string} stationId 
 * @param {'confirm' | 'flag'} type 
 * @param {string} userId 
 */
export const verifyStation = async (stationId, type, userId) => {
    if (!userId) return; // Must be logged in
    const stationRef = doc(db, COLLECTION_NAME, stationId);

    if (type === 'confirm') {
        await updateDoc(stationRef, {
            confirmations: arrayUnion(userId),
            flags: arrayRemove(userId)
        });
    } else {
        await updateDoc(stationRef, {
            flags: arrayUnion(userId),
            confirmations: arrayRemove(userId)
        });
    }
};

/**
 * Exports station data to a CSV blob and triggers download.
 * @param {Array} stations 
 */
export const exportStationsToCSV = (stations) => {
    if (!stations || stations.length === 0) return;

    // Define CSV Headers
    const headers = ['Name', 'Address', 'Status', 'Petrol Price', 'Diesel Price', 'Gas Price', 'Last Updated'];

    // Map data to rows
    const rows = stations.map(s => [
        `"${s.name}"`, // Quote strings to handle commas
        `"${s.address}"`,
        s.status,
        s.prices?.petrol || 'N/A',
        s.prices?.diesel || 'N/A',
        s.prices?.gas || 'N/A',
        new Date(s.lastUpdated).toLocaleString()
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Create Blob and Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `petrol_stations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Calculate queue status from queue length in minutes
 * @param {number} queueMinutes - Queue wait time in minutes
 * @returns {'short' | 'medium' | 'long'}
 */
export const calculateQueueStatus = (queueMinutes) => {
    if (queueMinutes === null || queueMinutes === undefined) return null;
    if (queueMinutes <= 15) return 'short';
    if (queueMinutes <= 30) return 'mild';
    return 'long';
};

/**
 * Get freshness indicator for queue report
 * @param {string} timestamp - ISO timestamp of last queue update
 * @returns {object} - { level: 'fresh'|'moderate'|'stale', color: string, icon: string, text: string }
 */
export const getQueueFreshness = (timestamp) => {
    if (!timestamp) return { level: 'unknown', color: '#64748b', icon: '⚪', text: 'No data' };

    const now = new Date();
    const reportTime = new Date(timestamp);
    const minutesAgo = Math.floor((now - reportTime) / (1000 * 60));

    if (minutesAgo < 30) {
        return { level: 'fresh', color: '#22c55e', icon: '🟢', text: `${minutesAgo}m ago`, minutesAgo };
    } else if (minutesAgo < 60) {
        return { level: 'moderate', color: '#eab308', icon: '🟡', text: `${minutesAgo}m ago`, minutesAgo };
    } else if (minutesAgo < 120) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        return { level: 'stale', color: '#ef4444', icon: '🔴', text: `${hoursAgo}h ago`, minutesAgo };
    } else {
        return { level: 'stale', color: '#64748b', icon: '⚪', text: 'Outdated', minutesAgo };
    }
};

/**
 * Subscribe to recent reports with photos for a station
 * @param {string} stationId
 * @param {function} onUpdate
 */
export const subscribeToStationPhotos = (stationId, onUpdate) => {
    if (!stationId) return () => { };

    const reportsRef = collection(db, COLLECTION_NAME, stationId, 'reports');
    // Note: This query may require a composite index (hasPhoto + timestamp)
    const q = query(
        reportsRef,
        where('hasPhoto', '==', true),
        orderBy('timestamp', 'desc'),
        limit(10)
    );

    return onSnapshot(q, (snapshot) => {
        const photos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                url: data.photoUrl,
                thumbUrl: data.photoThumbUrl,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
                isVerified: data.isVerifiedEvidence,
                reporterName: data.reporterName
            };
        });
        onUpdate(photos);
    }, (error) => {
        console.error("Error fetching station photos", error);
        // Fallback: If index is missing, try a simpler query or empty list
        onUpdate([]);
    });
};
