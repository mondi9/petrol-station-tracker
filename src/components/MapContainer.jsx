import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Custom marker generator
const createCustomIcon = (status) => {
    const color = getStatusColor(status);

    // SVG Pin with "Fuel" context
    // Outer pin, Inner white circle
    const svgContent = `
        <div style="color: ${color}; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: translateY(-5px);">
            <svg width="32" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C7.58172 0 4 3.58172 4 8C4 13.25 11.25 21.625 11.6641 22.0938C11.8477 22.3047 12.1523 22.3047 12.3359 22.0938C12.75 21.625 20 13.25 20 8C20 3.58172 16.4183 0 12 0Z" fill="currentColor"/>
                <circle cx="12" cy="8" r="3.5" fill="white"/>
            </svg>
        </div>
    `;

    return L.divIcon({
        className: 'custom-marker-pin',
        html: svgContent,
        iconSize: [32, 42],
        iconAnchor: [16, 42], // Tip at bottom center
        popupAnchor: [0, -38]
    });
};

const MapController = ({ selectedStation }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedStation) {
            map.flyTo([selectedStation.lat, selectedStation.lng], 15, {
                duration: 1.5
            });
        }
    }, [selectedStation, map]);

    return null;
};

const MapComponent = ({ stations, onStationSelect, onViewDetails, selectedStation, onReportClick }) => {
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
                <MapController selectedStation={selectedStation} />

                {stations.map(station => (
                    <Marker
                        key={station.id}
                        position={[station.lat, station.lng]}
                        icon={createCustomIcon(station.status)}
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

export default MapComponent;
