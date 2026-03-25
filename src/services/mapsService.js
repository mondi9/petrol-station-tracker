/**
 * Google Maps API Service - PetrolPulse Lagos
 * 
 * Central hub for all Google Maps interactions via Netlify Proxy.
 * Includes fallback logic for Lagos-specific traffic patterns when API is offline.
 */

const PROXY_BASE = '/.netlify/functions/traffic-proxy';

/**
 * Fallback travel time calculation when Google Maps API is unavailable
 * Uses Haversine distance and estimated Lagos speeds.
 */
export const getFallbackTravelTime = (origin, destination) => {
  const lat1 = origin.lat;
  const lon1 = origin.lng;
  const lat2 = destination.lat;
  const lon2 = destination.lng;

  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  // Approximate Haversine
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Estimate speed based on distance (Lagos traffic patterns)
  let avgSpeedKmH = distanceKm < 5 ? 20 : (distanceKm < 15 ? 30 : 40);
  const durationMinutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);

  return {
    durationMinutes,
    durationInTrafficMinutes: durationMinutes,
    distanceKm: distanceKm.toFixed(1),
    distanceText: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`,
    text: `${durationMinutes} mins (est)`,
    hasTrafficData: false,
    isFallback: true
  };
};

/**
 * Gets traffic-aware distance and duration using Google Maps via proxy.
 * Falls back to estimated values if the API key or network is missing.
 */
export const getTrafficDistance = async (origin, destination) => {
  try {
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

    const url = `${PROXY_BASE}?type=distance&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]) {
      const element = data.rows[0].elements[0];
      if (element.status === 'OK') {
        return {
          distanceKm: element.distance.value / 1000,
          durationMins: Math.ceil(element.duration_in_traffic?.value / 60 || element.duration.value / 60),
          durationMinutes: Math.ceil(element.duration.value / 60),
          durationInTrafficMinutes: Math.ceil(element.duration_in_traffic?.value / 60 || element.duration.value / 60),
          text: element.duration_in_traffic?.text || element.duration.text,
          trafficModel: !!element.duration_in_traffic,
          hasTrafficData: !!element.duration_in_traffic
        };
      }
    }
    return getFallbackTravelTime(origin, destination);
  } catch (error) {
    console.warn('Traffic API failed, using fallback:', error);
    return getFallbackTravelTime(origin, destination);
  }
};

/**
 * Efficiently computes travel times for multiple destinations.
 */
export const getBatchTravelTimes = async (origin, destinations) => {
  if (!origin || !destinations || destinations.length === 0) return [];
  if (destinations.length > 25) {
    return destinations.map(d => getFallbackTravelTime(origin, d));
  }

  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

    const url = `${PROXY_BASE}?type=distance&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.rows?.[0]) {
      return destinations.map(d => getFallbackTravelTime(origin, d));
    }

    return data.rows[0].elements.map((element, idx) => {
      if (element.status !== 'OK') return getFallbackTravelTime(origin, destinations[idx]);
      return {
        durationMinutes: Math.ceil(element.duration.value / 60),
        durationInTrafficMinutes: Math.ceil(element.duration_in_traffic?.value / 60 || element.duration.value / 60),
        distanceKm: (element.distance.value / 1000).toFixed(1),
        text: element.duration_in_traffic?.text || element.duration.text,
        hasTrafficData: !!element.duration_in_traffic
      };
    });
  } catch (error) {
    console.error('Batch traffic error:', error);
    return destinations.map(d => getFallbackTravelTime(origin, d));
  }
};

/**
 * Geocodes coordinates to address or vice-versa.
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const url = `${PROXY_BASE}?type=geocode&latlng=${lat},${lng}`;
    const response = await fetch(url);
    const data = await response.json();
    return (data.status === 'OK' && data.results?.[0]) ? data.results[0].formatted_address : null;
  } catch (e) { return null; }
};

export const geocodeAddress = async (address) => {
  try {
    const url = `${PROXY_BASE}?type=geocode&address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng, formattedAddress: data.results[0].formatted_address };
    }
  } catch (e) { return null; }
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
};

export default {
  getTrafficDistance,
  getBatchTravelTimes,
  getFallbackTravelTime,
  reverseGeocode,
  geocodeAddress,
  formatDuration
};
