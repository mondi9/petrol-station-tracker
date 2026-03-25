import React from 'react';
import { X, Navigation, Fuel, Clock, MapPin } from 'lucide-react';
import { formatTimeAgo, formatPrice, calculateTravelTime } from '../services/stationService';
import mapsService from '../services/mapsService';

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
                        <span className={`status-badge status-${station.status}`}>
                            {station.status === 'active'
                                ? (station.trustLevel === 'uncertain' ? 'Mixing Reports ⚠️' : 'Active')
                                : 'Inactive'}
                        </span>
                        {station.trustLevel === 'verified-fresh' && (
                            <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 'bold' }}>✨ Verified Fresh</span>
                        )}
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Updated {formatTimeAgo(station.lastUpdated)}</span>
                    </div>
                )}
            </div>

            {station.lastComment && (
                <div style={{
                    marginBottom: '16px',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)'
                }}>
                    <p style={{ fontSize: '0.8rem', color: 'white', fontStyle: 'italic', margin: 0 }}>
                        "{station.lastComment}"
                    </p>
                    <div style={{ marginTop: '4px', fontSize: '0.65rem', opacity: 0.5 }}>
                        Reported by {station.lastReporter || 'Anonymous'} {station.trustLevel === 'verified-fresh' && '🛡️'}
                    </div>
                </div>
            )}

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

            {/* Navigate Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => onNavigate(station, 'google')}
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}
                >
                    <Navigation size={18} style={{ marginRight: '6px' }} />
                    Maps
                </button>
                <button
                    onClick={() => onNavigate(station, 'waze')}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        background: '#33b1ff',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <img src="https://assets.website-files.com/5f6b26583546aa1d641ae404/5f6b26583546aa50081ae42f_waze-icon.svg" width="18" height="18" style={{ marginRight: '6px' }} alt="Waze" />
                    Waze
                </button>
            </div>

            {/* Travel Time Breakdown */}
            {station.distance && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} style={{ opacity: 0.6 }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-active)' }}>Time to Fuel</span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '900' }}>
                            {(() => {
                                const driveTime = calculateTravelTime(station.distance);
                                const queueMins = station.queueStatus === 'short' ? 5 : (station.queueStatus === 'mild' ? 15 : (station.queueStatus === 'long' ? 45 : 0));
                                return mapsService.formatDuration(driveTime + queueMins);
                            })()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.7rem', opacity: 0.6 }}>
                        <span>🚗 Drive: {mapsService.formatDuration(calculateTravelTime(station.distance))}</span>
                        <span>•</span>
                        <span>⏳ Queue: {station.queueStatus === 'short' ? '5' : (station.queueStatus === 'mild' ? '15' : (station.queueStatus === 'long' ? '45' : '0'))}m</span>
                    </div>

                    {station.distance > 1000 && (
                        <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.7rem', color: '#fca5a5', textAlign: 'center' }}>
                            ⚠️ Result seems high? Check your GPS settings (currently {Math.round(station.distance)}km away).
                        </div>
                    )}
                </div>
            )}

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
