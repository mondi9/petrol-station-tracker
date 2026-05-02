function calculateDistance(lat1, lon1, lat2, lon2) {
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
    return d;
}

const userLat = 6.470039;
const userLng = 3.281449;

// New adjusted coordinates
const stations = [
    { name: "MRS Festac", lat: 6.4675, lng: 3.2836 },
    { name: "Mobil", lat: 6.4670, lng: 3.2840 },
    { name: "AP (Ardova)", lat: 6.4665, lng: 3.2845 }
];

stations.forEach(s => {
    s.distance = calculateDistance(userLat, userLng, s.lat, s.lng);
    s.driveMin = s.distance / 30 * 60;
    console.log(`${s.name.padEnd(15)} | Distance: ${s.distance.toFixed(3)} km | Drive: ${s.driveMin.toFixed(2)} min`);
});
