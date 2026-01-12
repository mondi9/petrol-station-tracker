
const stations = [
    { id: "1", name: "Station 1 (Close, Active)", lat: 6.5000, lng: 3.3000, status: "active" },
    { id: "2", name: "Station 2 (Far, Active)", lat: 6.6000, lng: 3.4000, status: "active" },
    { id: "3", name: "Station 3 (Closest, Inactive)", lat: 6.4999, lng: 3.2999, status: "inactive" }, // Very close to user
    { id: "4", name: "Station 4 (Mid, Inactive)", lat: 6.5500, lng: 3.3500, status: "inactive" }
];

const userLocation = { lat: 6.4990, lng: 3.2990 }; // Near station 3 and 1

function findNearest(stations, userLat, userLng) {
    const R = 6371;
    let nearest = null;
    let minDist = Infinity;

    // Logic from App.jsx
    const activeStations = stations.filter(s => s.status === 'active');
    const searchList = activeStations.length > 0 ? activeStations : stations;

    console.log(`Searching in ${searchList.length} stations (Total: ${stations.length})`);

    searchList.forEach(station => {
        if (station.lat && station.lng) {
            const dLat = (station.lat - userLat) * (Math.PI / 180);
            const dLon = (station.lng - userLng) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLat * (Math.PI / 180)) * Math.cos(station.lat * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c;

            // console.log(`Distance to ${station.name}: ${d.toFixed(3)} km`);

            if (d < minDist) {
                minDist = d;
                nearest = station;
            }
        }
    });
    return nearest;
}

// Test 1: Should prefer Active (Station 1) over Closest Inactive (Station 3)
const result1 = findNearest(stations, userLocation.lat, userLocation.lng);
console.log(`Test 1 Result: ${result1.name} (${result1.id})`);
if (result1.id === "1") {
    console.log("PASS: Selected closest ACTIVE station (Station 1) even though Station 3 is closer.");
} else {
    console.log(`FAIL: Expected 1, got ${result1.id}`);
}

// Test 2: If no active stations, should pick closest inactive
const inactiveOnlyStations = stations.filter(s => s.status === 'inactive');
const result2 = findNearest(inactiveOnlyStations, userLocation.lat, userLocation.lng);
console.log(`Test 2 Result: ${result2.name} (${result2.id})`);
if (result2.id === "3") {
    console.log("PASS: Selected closest INACTIVE station when no active ones exist.");
} else {
    console.log(`FAIL: Expected 3, got ${result2.id}`);
}

console.log("ALL TESTS COMPLETED");

