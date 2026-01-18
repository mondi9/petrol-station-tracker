import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatTimeAgo } from '../services/stationService';
import { Navigation, Clock } from 'lucide-react';

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

    // Fix: Invalidate size when map becomes visible/resizes
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());

        // Also force checks on mount/updates
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500);

        return () => resizeObserver.disconnect();
    }, [map]);

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

const MapComponent = ({ stations, onStationSelect, onViewDetails, selectedStation, onReportClick, onFindNearest, userLocation, isLocating }) => {
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
                ))}
            </MapContainer>

            <LocationButton onFindNearest={onFindNearest} isLocating={isLocating} />
        </div>
    );
};

const LocationButton = ({ onFindNearest, isLocating }) => {
    return (
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocating) onFindNearest();
                }}
                className="glass-panel"
                style={{
                    width: '48px', height: '48px', borderRadius: '50%',
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
                        width: '20px', height: '20px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                ) : (
                    <Navigation size={24} fill="currentColor" />
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
