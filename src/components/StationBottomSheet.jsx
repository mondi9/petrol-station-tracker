import React from 'react';
import { X, Navigation, Fuel, Clock, MapPin } from 'lucide-react';
import { formatTimeAgo, formatPrice, calculateTravelTime } from '../services/stationService';

const StationBottomSheet = ({ station, onClose, onNavigate }) => {
    if (!station) return null;

    const queueColor =
        station.queueStatus === 'short' ? '#22c55e' :
            station.queueStatus === 'mild' ? '#eab308' :
                station.queueStatus === 'long' ? '#ef4444' : '#64748b';

    const queueText =
        station.queueStatus === 'short' ? 'Short Queue' :
            station.queueStatus === 'mild' ? 'Mild Queue' :
                station.queueStatus === 'long' ? 'Long Queue' :
                    (station.status === 'active' ? 'Unknown Queue' : 'No Queue (Empty)');

    return (
        <div style={{
            position: 'fixed',
            bottom: '70px', // Above bottom nav
            left: '10px',
            right: '10px',
            background: 'var(--glass-panel)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            padding: '16px',
            zIndex: 2000,
            boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{station.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7, fontSize: '0.8rem', marginTop: '4px' }}>
                        <MapPin size={12} />
                        <span>{station.address}</span>
                    </div>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', padding: '4px' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Status Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                    flex: 1,
                    background: `rgba(${queueColor === '#22c55e' ? '34, 197, 94' : queueColor === '#eab308' ? '234, 179, 8' : '239, 68, 68'}, 0.2)`,
                    border: `1px solid ${queueColor}`,
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: queueColor }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: queueColor }}>{queueText}</span>
                </div>

                {station.distance && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{station.distance.toFixed(1)}km</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>~{calculateTravelTime(station.distance)} min</span>
                    </div>
                )}
            </div>

            {/* Prices */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
                {station.prices?.petrol && (
                    <div className="fuel-badge petrol" style={{ flex: 1, padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>PMS (Petrol)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₦{formatPrice(station.prices.petrol)}</div>
                    </div>
                )}
                {station.prices?.diesel && (
                    <div className="fuel-badge diesel" style={{ flex: 1, padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>AGO (Diesel)</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>₦{formatPrice(station.prices.diesel)}</div>
                    </div>
                )}
                {!station.prices?.petrol && !station.prices?.diesel && (
                    <div style={{ padding: '12px', opacity: 0.5, fontStyle: 'italic', fontSize: '0.9rem' }}>
                        No price data available.
                    </div>
                )}
            </div>

            {/* Navigate Button */}
            <button
                onClick={() => onNavigate(station)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <Navigation size={18} style={{ marginRight: '8px' }} />
                Navigate Here
            </button>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default StationBottomSheet;
