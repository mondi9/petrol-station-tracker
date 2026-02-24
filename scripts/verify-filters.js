
const stations = [
    { id: "1", name: "Valid Station", address: "123 Main St, Lagos", status: "active", lat: 6.5, lng: 3.3 },
    { id: "2", name: "Unknown Station", address: "123 Main St, Lagos", status: "active", lat: 6.5, lng: 3.3 },
    { id: "3", name: "Valid Station 2", address: "Lagos, Nigeria", status: "active", lat: 6.5, lng: 3.3 },
    { id: "4", name: "Valid Station 3", address: "", status: "active", lat: 6.5, lng: 3.3 },
    { id: "5", name: "Valid Station 4", address: "Ajao Estate, Lagos", status: "unknown", lat: 6.5, lng: 3.3 },
    { id: "6", name: "Valid Station 5", address: "Ikeja, Lagos", status: "active", lat: 7.5, lng: 3.3 } // Outside Lagos
];

function filterStations(stations) {
    return stations.filter(s => {
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
}

const filtered = filterStations(stations);
console.log("Filtered Stations:");
filtered.forEach(s => console.log(`- ${s.id}: ${s.name} (${s.address}) [${s.status}] @ ${s.lat},${s.lng}`));

const expectedIds = ["1"];
const actualIds = filtered.map(s => s.id);

const passed = JSON.stringify(expectedIds.sort()) === JSON.stringify(actualIds.sort());

if (passed) {
    console.log("\nPASS: Filtering logic works as expected.");
} else {
    console.log(`\nFAIL: Expected [${expectedIds}], but got [${actualIds}]`);
    process.exit(1);
}
