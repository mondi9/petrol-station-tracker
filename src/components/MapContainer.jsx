import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatTimeAgo, formatDistance, calculateDistance } from '../services/stationService';
import { Navigation, Clock, MapPin } from 'lucide-react';

// Fix for default Leaflet icon issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom marker generator (Price Bubble + Queue Status + Distance)
const createCustomIcon = (station, userLocation) => {
    const status = station.status;
    const queueStatus = station.queueStatus;
    const price = station.prices?.petrol;
    const distance = station.distance;

    let color = '#64748b'; // Default Grey (Inactive)
    let borderColor = 'white';
    let textColor = 'white';
    let label = price ? `₦${price}` : '⛽';

    // Add distance to label if available
    if (distance !== undefined && distance !== null && distance < 10) {
        if (distance < 1) {
            label = `${Math.round(distance * 1000)}m`;
        } else {
            label = `${distance.toFixed(1)}km`;
        }
    } else if (price) {
        label = `₦${price}`;
    }

    // Add queue status emoji to label
    if (status === 'active' && queueStatus) {
        const queueEmoji = queueStatus === 'short' ? '⚡' :
            queueStatus === 'medium' ? '⏳' : '🚨';
        label = `${queueEmoji} ${label}`;
    }

    // Determine color based on queue status (no icons)
    if (status === 'active') {
        if (!queueStatus || queueStatus === 'short') {
            color = '#16a34a'; // Green
        } else if (queueStatus === 'medium') {
            color = '#ca8a04'; // Dark Yellow
        } else if (queueStatus === 'long') {
            color = '#dc2626'; // Red
        } else {
            color = '#16a34a'; // Assume green if active but unknown queue
        }
    } else {
        label = 'Inactive';
    }

    // CSS for the marker
    const htmlContent = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
        ">
            <div style="
                background: ${color};
                color: ${textColor};
                padding: 6px 10px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 13px;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 3px;
                min-width: 50px;
                justify-content: center;
            ">
                ${label}
            </div>
            <div style="
                width: 0; 
                height: 0; 
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${color};
                margin-top: -1px;
                filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
            "></div>
        </div>
    `;

    return L.divIcon({
        className: 'custom-price-marker',
        html: htmlContent,
        iconSize: [60, 45], // Increased from [40, 30]
        iconAnchor: [30, 45], // Anchor at bottom tip (half of width, full height)
        popupAnchor: [0, -45]
    });
};

const MapLegend = () => {
    return (
        <div className="map-legend" style={{
            position: 'absolute',
            bottom: '150px',
            right: '24px',
            left: 'auto',
            zIndex: 1000,
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(31, 41, 55, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '0.75rem',
            width: '140px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
            animation: 'slideInRight 0.5s ease-out'
        }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', opacity: 0.9, fontWeight: 700 }}>Map Legend</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#16a34a', border: '1px solid white' }}></div>
                    <span>Short Queue ✅</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ca8a04', border: '1px solid white' }}></div>
                    <span>Medium Queue ⏳</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626', border: '1px solid white' }}></div>
                    <span>Long Queue 🚨</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b', border: '1px solid white' }}></div>
                    <span>Inactive ⚪</span>
                </div>
            </div>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// Create user location marker (blue pulsing dot)
const createUserLocationIcon = () => {
    // ... same as before ...
    const htmlContent = `
        <div style="
             display: flex;
             flex-direction: column;
             align-items: center;
             transform: translateY(-50%);
        ">
            <div style="
                 width: 20px;
                 height: 20px;
                 background-color: #3b82f6;
                 border-radius: 50%;
                 border: 3px solid white;
                 box-shadow: 0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.4);
                 animation: pulse-location 2s infinite;
            "></div>
        </div>
        <style>
            @keyframes pulse-location {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.8; }
            }
        </style>
    `;

    return L.divIcon({
        className: 'user-location-marker',
        html: htmlContent,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
    });
};

const MapEvents = ({ onMapClick }) => {
    const map = useMapEvents({
        click: (e) => {
            if (onMapClick) onMapClick(e.latlng);
        },
    });
    return null;
};

const MapViewUpdater = ({ selectedStation, userLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedStation) {
            console.log("Map: Flying to selected station", selectedStation.name);
            map.flyTo([selectedStation.lat, selectedStation.lng], 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [selectedStation, map]);

    // Initial center on user location once it's found
    useEffect(() => {
        if (userLocation && !selectedStation) {
            console.log("Map: Centering on user location");
            map.setView([userLocation.lat, userLocation.lng], 15);
        }
    }, [userLocation, map, !!selectedStation]);

    return null;
};

const RoutingController = ({ selectedStation, userLocation }) => {
    const map = useMap();
    const [route, setRoute] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const hasFitBounds = React.useRef(false); // Track if we've already fit bounds

    useEffect(() => {
        if (!selectedStation || !userLocation) {
            setRoute(null);
            setIsLoading(false);
            setError(null);
            hasFitBounds.current = false; // Reset when station changes
            return;
        }

        const fetchRoute = async () => {
            setIsLoading(true);
            setError(null);
            hasFitBounds.current = false; // Reset for new route

            try {
                // OSRM: lon,lat;lon,lat
                const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${selectedStation.lng},${selectedStation.lat}?overview=full&geometries=geojson`;

                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    // OSRM is Lon,Lat. Leaflet is Lat,Lon. Swap 'em.
                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    setRoute(coords);
                    setIsLoading(false);

                    // Only fit bounds ONCE when route is first loaded
                    if (!hasFitBounds.current) {
                        const bounds = L.latLngBounds(coords);
                        map.fitBounds(bounds, {
                            padding: [50, 50],
                            maxZoom: 15,
                            animate: true,
                            duration: 0.5 // Smooth animation
                        });
                        hasFitBounds.current = true;
                    }
                } else {
                    console.warn("Routing: No routes found in response");
                    setError("No route found");
                    setIsLoading(false);
                    // Fallback: just center on station
                    if (!hasFitBounds.current) {
                        map.flyTo([selectedStation.lat, selectedStation.lng], 14, { duration: 0.5 });
                        hasFitBounds.current = true;
                    }
                }
            } catch (e) {
                console.error("Routing failed:", e);
                setError(e.name === 'AbortError' ? 'Route request timeout' : 'Route unavailable');
                setIsLoading(false);
                // Fallback: fly to station
                if (!hasFitBounds.current) {
                    map.flyTo([selectedStation.lat, selectedStation.lng], 14, { duration: 0.5 });
                    hasFitBounds.current = true;
                }
            }
        };

        fetchRoute();

    }, [selectedStation, userLocation, map]);

    // Removed aggressive ResizeObserver that was causing vibration
    // Map will handle its own size invalidation

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

const MapComponent = ({ stations, onStationSelect, onViewDetails, selectedStation, onReportClick, onFindNearest, userLocation, isLocating, onMapClick }) => {
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
                <MapEvents onMapClick={onMapClick} />
                <MapViewUpdater selectedStation={selectedStation} userLocation={userLocation} />
                <RoutingController selectedStation={selectedStation} userLocation={userLocation} />

                {/* User Location Marker */}
                {userLocation && (
                    <>
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={createUserLocationIcon()}
                            zIndexOffset={1000}
                        >
                            <Popup className="custom-popup">
                                <div style={{ padding: '4px', textAlign: 'center' }}>
                                    <h3 style={{ marginBottom: '4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <MapPin size={16} />
                                        Your Location
                                    </h3>
                                    <p style={{ opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>You are here</p>
                                </div>
                            </Popup>
                        </Marker>
                        {/* Accuracy circle */}
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={50}
                            pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.1,
                                weight: 1
                            }}
                        />
                    </>
                )}

                {stations.map((station, index) => {
                    // Calculate z-index: active stations on top, then by queue status
                    let zOffset = 0;
                    if (station.status === 'active') {
                        zOffset = 100;
                        if (station.queueStatus === 'short') zOffset += 30;
                        else if (station.queueStatus === 'medium') zOffset += 20;
                        else if (station.queueStatus === 'long') zOffset += 10;
                    }

                    return (
                        <Marker
                            key={station.id}
                            position={[station.lat, station.lng]}
                            icon={createCustomIcon(station, userLocation)}
                            zIndexOffset={zOffset}
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

                                    {/* Detailed Status & Reporter Info */}
                                    <div style={{ marginBottom: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span>Queue:</span>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: station.queueStatus === 'short' ? '#4ade80' : station.queueStatus === 'medium' ? '#facc15' : station.queueStatus === 'long' ? '#f87171' : 'inherit'
                                            }}>
                                                {station.queueStatus ? (station.queueStatus.charAt(0).toUpperCase() + station.queueStatus.slice(1)) : 'Unknown'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Updated by:</span>
                                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                {station.lastReporter || 'Anonymous'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Fuel Availability Badges (Enhanced) */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                                        {['petrol', 'diesel', 'premium'].map(type => {
                                            const price = station.prices?.[type];
                                            const status = station.availability?.[type]; // 'available', 'low', 'empty'

                                            if (!price && !status && station.status !== 'active') return null;

                                            let colorClass = 'unknown';

                                            if (type === 'petrol') colorClass = 'petrol';
                                            if (type === 'diesel') colorClass = 'diesel';
                                            if (type === 'premium') colorClass = 'gas';

                                            const label = type === 'petrol' ? 'PMS' : type === 'diesel' ? 'AGO' : 'PREM';

                                            return (
                                                <div key={type} className={`fuel-badge ${colorClass}`} style={{ flex: '1 0 40%' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <span className="fuel-label">{label}</span>
                                                        {price && <span className="fuel-price" style={{ fontWeight: 'bold' }}>₦{price}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {(!station.prices || Object.keys(station.prices).length === 0) && (
                                            <div className="fuel-badge unknown" style={{ width: '100%', justifyContent: 'center' }}>
                                                <span className="fuel-label">No Price Data</span>
                                            </div>
                                        )}
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
                    );
                })}
            </MapContainer>

            <LocationButton onFindNearest={onFindNearest} isLocating={isLocating} />

        </div>
    );
};

const LocationButton = ({ onFindNearest, isLocating }) => {
    return (
        <div style={{ position: 'absolute', bottom: '220px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocating) onFindNearest();
                }}
                className="glass-panel"
                style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: isLocating ? 'var(--bg-secondary)' : 'var(--color-active)',
                    color: isLocating ? 'var(--text-secondary)' : 'black',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isLocating ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s ease',
                    animation: isLocating ? 'spin 1s linear infinite' : 'pulse-attention 1.5s infinite'
                }}
                title="Find Nearest Station"
                disabled={isLocating}
            >
                {isLocating ? (
                    <div className="spinner" style={{
                        width: '18px', height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                ) : (
                    <Navigation size={22} fill="currentColor" />
                )}
            </button>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse-attention {
                    0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                    50% { transform: scale(1.15); box-shadow: 0 0 25px var(--color-active-glow); }
                    100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                }
            `}</style>
        </div>
    );
};

export default MapComponent;
