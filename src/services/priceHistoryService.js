import { db } from './firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

const STATIONS_COLLECTION = 'stations';

/**
 * Fetch price history for a single station.
 * @param {string} stationId
 * @param {number} limitCount - Max number of entries (latest first)
 */
export const fetchStationPriceHistory = async (stationId, limitCount = 30) => {
    try {
        const historyRef = collection(db, STATIONS_COLLECTION, stationId, 'priceHistory');
        const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to JS Date
                timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
            };
        }).reverse(); // Chronological order for charting
    } catch (error) {
        console.error('Error fetching price history:', error);
        return [];
    }
};

/**
 * Fetch price history for multiple stations and aggregate by date.
 * Returns data formatted for recharts line chart.
 * @param {Array} stations - Array of station objects with id and name
 * @param {string} fuelType - 'petrol' | 'diesel'
 * @param {number} daysBack - How many days of history to show
 */
export const fetchMultiStationPriceHistory = async (stations, fuelType = 'petrol', daysBack = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    // Fetch history for all stations in parallel
    const results = await Promise.all(
        stations.slice(0, 5).map(async (station) => { // Limit to 5 stations to avoid query overload
            const entries = await fetchStationPriceHistory(station.id, 50);
            return {
                stationId: station.id,
                stationName: station.name,
                entries: entries.filter(e =>
                    e.fuelType === fuelType &&
                    e.timestamp >= cutoff
                )
            };
        })
    );

    // Build a unified date-keyed map for the chart
    // Each data point: { date: "Feb 15", "MRS Festac": 935, "TotalEnergies": 960, ... }
    const dateMap = {};

    results.forEach(({ stationName, entries }) => {
        entries.forEach(entry => {
            const dateKey = entry.timestamp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            if (!dateMap[dateKey]) dateMap[dateKey] = { date: dateKey };
            dateMap[dateKey][stationName] = entry.price;
        });
    });

    const chartData = Object.values(dateMap).sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });

    return {
        chartData,
        stationNames: results.map(r => r.stationName).filter(n => n)
    };
};
