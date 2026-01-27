import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * Validates if a price is within reasonable range for a fuel type
 * @param {number} price - Price in Naira
 * @param {string} fuelType - 'petrol' | 'diesel' | 'premium'
 * @returns {boolean} - True if valid
 */
export const validatePrice = (price, fuelType) => {
    if (!price || price <= 0) return false;

    // Reasonable price ranges in Naira (₦)
    const ranges = {
        petrol: { min: 500, max: 2000 },
        diesel: { min: 600, max: 2500 },
        premium: { min: 700, max: 2500 }
    };

    const range = ranges[fuelType] || ranges.petrol;
    return price >= range.min && price <= range.max;
};

/**
 * Format price with trend indicator
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price (optional)
 * @returns {object} - { formatted, trend, trendIcon }
 */
export const formatPriceWithTrend = (currentPrice, previousPrice = null) => {
    const formatted = currentPrice ? `₦${currentPrice.toLocaleString()}` : 'N/A';

    if (!previousPrice || !currentPrice) {
        return { formatted, trend: 'stable', trendIcon: '→' };
    }

    const diff = currentPrice - previousPrice;
    const percentChange = (diff / previousPrice) * 100;

    if (Math.abs(percentChange) < 2) {
        return { formatted, trend: 'stable', trendIcon: '→', color: '#64748b' };
    } else if (diff > 0) {
        return { formatted, trend: 'rising', trendIcon: '↑', color: '#ef4444' };
    } else {
        return { formatted, trend: 'falling', trendIcon: '↓', color: '#22c55e' };
    }
};

/**
 * Calculate price freshness and return appropriate color
 * @param {string} timestamp - ISO timestamp
 * @returns {object} - { status, color, label }
 */
export const getPriceFreshness = (timestamp) => {
    if (!timestamp) {
        return { status: 'unknown', color: '#64748b', label: 'No data' };
    }

    const now = new Date();
    const updated = new Date(timestamp);
    const hoursAgo = (now - updated) / (1000 * 60 * 60);

    if (hoursAgo < 24) {
        return { status: 'fresh', color: '#22c55e', label: 'Fresh' };
    } else if (hoursAgo < 168) { // 7 days
        const daysAgo = Math.floor(hoursAgo / 24);
        return { status: 'outdated', color: '#eab308', label: `${daysAgo}d ago` };
    } else {
        return { status: 'stale', color: '#ef4444', label: 'Stale' };
    }
};

/**
 * Compare stations by price for a specific fuel type
 * @param {Array} stations - Array of station objects
 * @param {string} fuelType - 'petrol' | 'diesel' | 'premium'
 * @returns {Array} - Sorted stations (cheapest first)
 */
export const comparePrices = (stations, fuelType = 'petrol') => {
    return [...stations]
        .filter(s => s.prices?.[fuelType]) // Only stations with price data
        .sort((a, b) => {
            const priceA = a.prices[fuelType] || Infinity;
            const priceB = b.prices[fuelType] || Infinity;
            return priceA - priceB;
        });
};

/**
 * Find cheapest station within radius
 * @param {Array} stations - Array of station objects
 * @param {object} userLocation - { lat, lng }
 * @param {string} fuelType - 'petrol' | 'diesel' | 'premium'
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {object|null} - Cheapest station or null
 */
export const findCheapestNearby = (stations, userLocation, fuelType = 'petrol', radiusKm = 5) => {
    if (!userLocation?.lat || !userLocation?.lng) return null;

    // Filter stations within radius and with fresh prices
    const nearbyStations = stations.filter(station => {
        if (!station.lat || !station.lng || !station.prices?.[fuelType]) return false;

        // Check price freshness (only include prices < 7 days old)
        const freshness = getPriceFreshness(station.lastPriceUpdate);
        if (freshness.status === 'stale') return false;

        // Calculate distance
        const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            station.lat,
            station.lng
        );

        return distance <= radiusKm;
    });

    // Sort by price and return cheapest
    const sorted = comparePrices(nearbyStations, fuelType);
    return sorted[0] || null;
};

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} - Distance in km
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Get price history for a station
 * @param {string} stationId 
 * @param {string} fuelType 
 * @param {number} limitCount 
 * @returns {Promise<Array>} - Array of price reports
 */
export const getPriceHistory = async (stationId, fuelType = 'petrol', limitCount = 10) => {
    try {
        const reportsRef = collection(db, 'stations', stationId, 'reports');
        const q = query(
            reportsRef,
            where('fuelType', '==', fuelType),
            where('price', '!=', null),
            orderBy('price'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error fetching price history:', error);
        return [];
    }
};

/**
 * Get average price for a fuel type across all stations
 * @param {Array} stations 
 * @param {string} fuelType 
 * @returns {number} - Average price
 */
export const getAveragePrice = (stations, fuelType = 'petrol') => {
    const stationsWithPrice = stations.filter(s => s.prices?.[fuelType]);
    if (stationsWithPrice.length === 0) return 0;

    const total = stationsWithPrice.reduce((sum, s) => sum + s.prices[fuelType], 0);
    return Math.round(total / stationsWithPrice.length);
};
