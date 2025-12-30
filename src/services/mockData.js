export const INITIAL_STATIONS = [
    {
        id: 1,
        name: "TotalEnergies VI",
        address: "Adeola Odeku St, Victoria Island",
        lat: 6.4281,
        lng: 3.4219,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    },
    {
        id: 2,
        name: "Oando Station",
        address: "Awolowo Rd, Ikoyi",
        lat: 6.4468,
        lng: 3.4172,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    {
        id: 3,
        name: "NNPC Mega Station",
        address: "Lekki-Epe Expy, Lekki",
        lat: 6.4323,
        lng: 3.4682,
        status: "inactive",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
    },
    {
        id: 4,
        name: "Conoil Yaba",
        address: "Herbert Macaulay Way, Yaba",
        lat: 6.5095,
        lng: 3.3711,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    {
        id: 5,
        name: "Mobil Ikeja",
        address: "Obafemi Awolowo Way, Ikeja",
        lat: 6.5966,
        lng: 3.3421,
        status: "inactive",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    },
    {
        id: 6,
        name: "MRS Festac",
        address: "21 Rd, Festac Town",
        lat: 6.4670,
        lng: 3.2830,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    },
    {
        id: 6,
        name: "Mobil (11PLC)",
        address: "23 Road, Festac Town",
        lat: 6.4762,
        lng: 3.2750,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    },
    {
        id: 7,
        name: "NNPC Filling Station",
        address: "Plot 88, 21 Road, Festac Town",
        lat: 6.4664,
        lng: 3.2835,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    },
    {
        id: 8,
        name: "TotalEnergies",
        address: "Amuwo/Festac Link Rd",
        lat: 6.4600,
        lng: 3.2950,
        status: "inactive",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    {
        id: 9,
        name: "MRS Station",
        address: "770 Festac Link Rd",
        lat: 6.4620,
        lng: 3.2980,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    },
    {
        id: 10,
        name: "Capital Oil",
        address: "Ago Palace Link Rd",
        lat: 6.4800,
        lng: 3.2900,
        status: "inactive",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
        id: 11,
        name: "AP (Ardova PLC)",
        address: "21 Road, H Close, Festac Town",
        lat: 6.4680,
        lng: 3.2820,
        status: "active",
        lastUpdated: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
    }
];

export const getStatusColor = (status) => {
    return status === 'active' ? 'var(--color-active)' : 'var(--color-inactive)';
};

export const formatTimeAgo = (isoString) => {
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
