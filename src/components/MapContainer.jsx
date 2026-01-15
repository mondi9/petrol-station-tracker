import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStatusColor, formatTimeAgo } from '../services/stationService';
import { Fuel, Navigation, Clock } from 'lucide-react';

// Fix for default Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom marker generator (Traffic Dot Style)
const createCustomIcon = (status, queueStatus) => {
    let color = '#64748b'; // Default Grey (Inactive)
    let glowColor = 'rgba(100, 116, 139, 0.4)';
    let size = 24; // Increased size for visibility
    let pulseClass = '';
    let label = '';
    let textColor = 'white';

    if (status === 'active') {
        if (!queueStatus || queueStatus === 'short') {
            color = '#22c55e'; // Green
            glowColor = 'rgba(34, 197, 94, 0.5)';
            label = 'S';
        } else if (queueStatus === 'medium') {
            color = '#eab308'; // Yellow
            glowColor = 'rgba(234, 179, 8, 0.5)';
            label = 'M';
            textColor = 'black';
        } else if (queueStatus === 'long') {
            color = '#ef4444'; // Red
            glowColor = 'rgba(239, 68, 68, 0.6)';
            size = 28; // Slightly larger
            pulseClass = 'pulse-animation';
            label = 'L';
        } else {
            label = 'A'; // Just Active
        }
    } else {
        size = 18; // Smaller for inactive
    }

    // Traffic Dot: Circle with Glow + Label
    const htmlContent = `
        <div style="
             width: ${size}px;
             height: ${size}px;
             background-color: ${color};
             border-radius: 50%;
             border: 2px solid white;
             box-shadow: 0 0 10px ${glowColor}, 0 0 20px ${glowColor};
             position: relative;
             display: flex;
             align-items: center;
             justify-content: center;
             color: ${textColor};
             font-weight: 800;
             font-size: ${size * 0.5}px;
             font-family: sans-serif;
        " class="${pulseClass}">
            ${label}
        </div>
    `;

    return L.divIcon({
        className: 'custom-traffic-marker',
        html: htmlContent,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2], // Center anchor
        popupAnchor: [0, -size / 2]
    });
};

const RoutingController = ({ selectedStation, userLocation }) => {
    const map = useMap();
    const [route, setRoute] = React.useState(null);

    // Debug active props
    useEffect(() => {
        console.log("RoutingController Update:", { selectedStation, userLocation });
    }, [selectedStation, userLocation]);

    useEffect(() => {
        if (!selectedStation || !userLocation) {
            console.log("Routing: Missing selectedStation or userLocation");
            setRoute(null);
            return;
        }

        const fetchRoute = async () => {
            console.log("Routing: Fetching route...");
            try {
                // OSRM: lon,lat;lon,lat
                const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${selectedStation.lng},${selectedStation.lat}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    // OSRM is Lon,Lat. Leaflet is Lat,Lon. Swap 'em.
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    setRoute(coords);
                    console.log("Routing: Route found and set", coords);

                    // Fit bounds to show route
                    const bounds = L.latLngBounds(coords);
                    map.fitBounds(bounds, { padding: [50, 50] });
                } else {
                    console.log("Routing: No routes found in response", data);
                }
            } catch (e) {
                console.error("Routing failed", e);
                // Fallback: fly to station
                map.flyTo([selectedStation.lat, selectedStation.lng], 15);
            }
        };

        fetchRoute();

    }, [selectedStation, userLocation, map]);

    // Determine Route Color based on Queue Status
    let routeColor = '#3b82f6'; // Default Blue
    if (selectedStation) {
        if (selectedStation.status === 'active') {
            if (selectedStation.queueStatus === 'short') routeColor = '#22c55e'; // Green
            else if (selectedStation.queueStatus === 'medium') routeColor = '#eab308'; // Yellow
            else if (selectedStation.queueStatus === 'long') routeColor = '#ef4444'; // Red
        } else {
            routeColor = '#64748b'; // Inactive/Grey
        }
    }

    console.log("Routing: Rendering Polyline?", !!route, "Color:", routeColor);

    return route ? (
        <Polyline
            positions={route}
            color={routeColor}
            weight={6}
            opacity={0.8}
            dashArray={null}
        />
    ) : null;
};

const MapComponent = ({ stations, onStationSelect, onViewDetails, selectedStation, onReportClick, onFindNearest, userLocation }) => {
    const position = [6.5244, 3.3792]; // Default Lagos center

    return (
        <div className="map-wrapper" style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
            {/* Overlay gradient for aesthetics */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '100px',
                background: 'linear-gradient(to bottom, var(--bg-primary) 0%, transparent 100%)',
                zIndex: 400,
                pointerEvents: 'none'
            }}></div>

            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%', background: '#1e1e1e' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <RoutingController selectedStation={selectedStation} userLocation={userLocation} />

                <LocationButton onFindNearest={onFindNearest} />

                {stations.map(station => (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lng]}
                        icon={createCustomIcon(station.status, station.queueStatus)}
                        eventHandlers={{
                            click: () => onStationSelect(station),
                        }}
                    >
                        <Popup className="custom-popup">
                            <div style={{ padding: '4px' }}>
                                <h3 style={{ marginBottom: '4px', fontSize: '1rem' }}>{station.name}</h3>
                                <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '8px' }}>{station.address}</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <span className={`status-badge status-${station.status}`}>
                                        {station.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {formatTimeAgo(station.lastUpdated)}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: '1fr 1fr' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '8px', fontSize: '0.75rem', justifyContent: 'center' }}
                                        onClick={() => onReportClick(station)}
                                    >
                                        Report Status
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ width: '100%', padding: '8px', fontSize: '0.75rem', justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDetails(station);
                                        }}
                                    >
                                        Reviews & Info
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

const LocationButton = ({ onFindNearest }) => {
    const map = useMap();

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 14, { duration: 1.5 });
            },
            () => {
                alert("Unable to retrieve your location");
            }
        );
    };

    return (
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
                onClick={onFindNearest}
                className="glass-panel"
                style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--color-active)', color: 'black', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}
                title="Find Nearest Station"
            >
                <Navigation size={24} fill="black" />
            </button>
        </div>
    );
};

export default MapComponent;
