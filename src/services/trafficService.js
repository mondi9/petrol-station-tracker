import { calculateDistance } from './stationService';

// Google Maps API Key (will be set via environment variable)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * Get real-time travel time with traffic from origin to destination
 * Uses Google Maps Distance Matrix API
 * 
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Promise<Object>} - { durationMinutes, durationInTrafficMinutes, distanceKm, distanceText }
 */
export const getTravelTime = async (origin, destination) => {
    if (!origin || !destination) {
        return null;
    }

    // If no API key, fall back to estimated time based on distance
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn('Google Maps API key not configured, using fallback calculation');
        return getFallbackTravelTime(origin, destination);
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.append('origins', `${origin.lat},${origin.lng}`);
        url.searchParams.append('destinations', `${destination.lat},${destination.lng}`);
        url.searchParams.append('departure_time', 'now'); // Get current traffic
        url.searchParams.append('traffic_model', 'best_guess');
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

        // Note: This will fail from browser due to CORS
        // You need to proxy this through your backend or use the JavaScript API
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
            console.error('Distance Matrix API error:', data.status, data.error_message);
            return getFallbackTravelTime(origin, destination);
        }

        const element = data.rows[0].elements[0];

        if (element.status !== 'OK') {
            console.error('Route not found:', element.status);
            return getFallbackTravelTime(origin, destination);
        }

        return {
            durationMinutes: Math.ceil(element.duration.value / 60),
            durationInTrafficMinutes: element.duration_in_traffic
                ? Math.ceil(element.duration_in_traffic.value / 60)
                : Math.ceil(element.duration.value / 60),
            distanceKm: (element.distance.value / 1000).toFixed(1),
            distanceText: element.distance.text,
            durationText: element.duration.text,
            durationInTrafficText: element.duration_in_traffic?.text || element.duration.text,
            hasTrafficData: !!element.duration_in_traffic
        };
    } catch (error) {
        console.error('Error fetching travel time:', error);
        return getFallbackTravelTime(origin, destination);
    }
};

/**
 * Fallback travel time calculation when Google Maps API is unavailable
 * Uses Haversine distance and estimated speed
 * 
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @returns {Object} - { durationMinutes, distanceKm }
 */
export const getFallbackTravelTime = (origin, destination) => {
    const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    if (!distanceKm) return null;

    // Estimate speed based on distance (Lagos traffic patterns)
    let avgSpeedKmH;
    if (distanceKm < 2) {
        avgSpeedKmH = 20; // Very slow in city center
    } else if (distanceKm < 5) {
        avgSpeedKmH = 25; // Moderate traffic
    } else if (distanceKm < 10) {
        avgSpeedKmH = 30; // Mixed traffic
    } else {
        avgSpeedKmH = 35; // Highway sections
    }

    const durationMinutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);

    return {
        durationMinutes,
        durationInTrafficMinutes: durationMinutes,
        distanceKm: distanceKm.toFixed(1),
        distanceText: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`,
        durationText: formatDuration(durationMinutes),
        durationInTrafficText: formatDuration(durationMinutes),
        hasTrafficData: false,
        isFallback: true
    };
};

/**
 * Calculate total time to fuel (drive time + queue time)
 * 
 * @param {Object} travelData - Result from getTravelTime
 * @param {number} queueMinutes - Queue wait time in minutes
 * @returns {Object} - { totalMinutes, driveMinutes, queueMinutes, savings }
 */
export const calculateTotalTimeToFuel = (travelData, queueMinutes = 0) => {
    if (!travelData) return null;

    const driveMinutes = travelData.durationInTrafficMinutes || travelData.durationMinutes;
    const totalMinutes = driveMinutes + queueMinutes;

    return {
        totalMinutes,
        driveMinutes,
        queueMinutes,
        totalText: formatDuration(totalMinutes),
        driveText: formatDuration(driveMinutes),
        queueText: formatDuration(queueMinutes),
        hasTrafficData: travelData.hasTrafficData
    };
};

/**
 * Format duration in minutes to human-readable text
 * 
 * @param {number} minutes 
 * @returns {string}
 */
export const formatDuration = (minutes) => {
    if (!minutes || minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
};

/**
 * Compare two stations by total time to fuel
 * Helps users decide which station is faster overall
 * 
 * @param {Object} station1 - { travelData, queueMinutes, price }
 * @param {Object} station2 - { travelData, queueMinutes, price }
 * @returns {Object} - Comparison result with recommendation
 */
export const compareStations = (station1, station2) => {
    const total1 = calculateTotalTimeToFuel(station1.travelData, station1.queueMinutes);
    const total2 = calculateTotalTimeToFuel(station2.travelData, station2.queueMinutes);

    if (!total1 || !total2) return null;

    const timeDiff = total1.totalMinutes - total2.totalMinutes;
    const priceDiff = (station1.price || 0) - (station2.price || 0);

    return {
        fasterStation: timeDiff < 0 ? 1 : 2,
        timeSavings: Math.abs(timeDiff),
        cheaperStation: priceDiff < 0 ? 1 : 2,
        priceSavings: Math.abs(priceDiff),
        recommendation: timeDiff < -10 ? 1 : (timeDiff > 10 ? 2 : (priceDiff < 0 ? 1 : 2))
    };
};

/**
 * Check if Google Maps API is configured
 * 
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
    return !!GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0;
};

/**
 * Get batch travel times for multiple destinations
 * More efficient than calling getTravelTime multiple times
 * 
 * @param {Object} origin - { lat, lng }
 * @param {Array} destinations - [{ lat, lng }, ...]
 * @returns {Promise<Array>} - Array of travel time results
 */
export const getBatchTravelTimes = async (origin, destinations) => {
    if (!origin || !destinations || destinations.length === 0) {
        return [];
    }

    // If no API key or too many destinations, use fallback
    if (!GOOGLE_MAPS_API_KEY || destinations.length > 25) {
        return destinations.map(dest => getFallbackTravelTime(origin, dest));
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.append('origins', `${origin.lat},${origin.lng}`);

        const destString = destinations.map(d => `${d.lat},${d.lng}`).join('|');
        url.searchParams.append('destinations', destString);
        url.searchParams.append('departure_time', 'now');
        url.searchParams.append('traffic_model', 'best_guess');
        url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
            // Fallback to individual calculations
            return destinations.map(dest => getFallbackTravelTime(origin, dest));
        }

        return data.rows[0].elements.map((element, index) => {
            if (element.status !== 'OK') {
                return getFallbackTravelTime(origin, destinations[index]);
            }

            return {
                durationMinutes: Math.ceil(element.duration.value / 60),
                durationInTrafficMinutes: element.duration_in_traffic
                    ? Math.ceil(element.duration_in_traffic.value / 60)
                    : Math.ceil(element.duration.value / 60),
                distanceKm: (element.distance.value / 1000).toFixed(1),
                distanceText: element.distance.text,
                durationText: element.duration.text,
                durationInTrafficText: element.duration_in_traffic?.text || element.duration.text,
                hasTrafficData: !!element.duration_in_traffic
            };
        });
    } catch (error) {
        console.error('Error fetching batch travel times:', error);
        return destinations.map(dest => getFallbackTravelTime(origin, dest));
    }
};
