import React from 'react';
import { MapPin, Fuel, Clock, Info } from 'lucide-react';
import { formatTimeAgo, formatPrice, calculateTravelTime, formatDistance, getQueueFreshness, formatTravelTime } from '../services/stationService';
import FilterBar from './FilterBar';
import PriceDisplay from './PriceDisplay';

const StationList = ({ stations, onSelect, onViewDetails, selectedStationId, onAddStation, onOpenFleetDashboard, onOpenProfile, user, onLogin, onLogout, filters, onFilterChange, userLocation }) => {
    // ... matching existing code ...
    // Local State for sorting only
    const [sortBy, setSortBy] = React.useState('price'); // 'price', 'queue'

    // Sort the incoming filtered stations
    const sortedStations = [...stations].sort((a, b) => {
        // Priority 1: Freshness (Active & Fresh first)
        const aFresh = a.freshnessStatus === 'fresh' && a.status === 'active';
        const bFresh = b.freshnessStatus === 'fresh' && b.status === 'active';
        if (aFresh && !bFresh) return -1;
        if (!aFresh && bFresh) return 1;

        if (sortBy === 'distance') {
            // If distance is missing (Infinity), push to bottom.
            const distA = (a.distance !== undefined && a.distance !== null) ? a.distance : Infinity;
            const distB = (b.distance !== undefined && b.distance !== null) ? b.distance : Infinity;
            return distA - distB;
        }
        if (sortBy === 'price') {
            // Sort by Petrol Price ascending
            // If price missing, push to bottom
            const priceA = a.prices?.petrol || Infinity;
            const priceB = b.prices?.petrol || Infinity;
            return priceA - priceB;
        }
        if (sortBy === 'queue') {
            // Priority: Short (1) < Medium (2) < Long (3) < Null/Inactive (4)
            const getRank = (s) => {
                if (s.status !== 'active') return 4;
                if (s.queueStatus === 'short') return 1;
                if (s.queueStatus === 'mild') return 2;
                if (s.queueStatus === 'long') return 3;
                return 4; // active but no queue info
            };
            return getRank(a) - getRank(b);
        }
        return 0;
    });

    return (
        <div className="station-list-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* ... Header and List sections remain roughly same, only Footer changes ... */}

            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        background: 'var(--color-active)',
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Fuel size={20} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Lagos Petrol Pulse
                        <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', opacity: 0.5 }}>v2.1</span>
                    </h1>
                </div>
                <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                    Real-time crowd-sourced fuel availability.
                </p>

                <input
                    type="text"
                    placeholder="Search stations or addresses..."
                    value={filters.searchQuery}
                    onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginTop: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'white',
                        outline: 'none'
                    }}
                />

                <div style={{ display: 'flex', gap: '8px', marginTop: '-4px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {/* Sort Controls */}
                    {[
                        { id: 'price', label: '💰 Cheapest' },
                        { id: 'distance', label: '📍 Nearest' },
                        { id: 'queue', label: '⏱️ Fastest' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setSortBy(opt.id)}
                            aria-label={`Sort by ${opt.label}`}
                            style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                borderRadius: '20px',
                                border: sortBy === opt.id ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                background: sortBy === opt.id ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                color: sortBy === opt.id ? 'var(--color-active)' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '8px' }}>
                    <FilterBar filters={filters} onFilterChange={onFilterChange} />
                </div>
            </div>

            {/* List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px', flexShrink: 0 }}>
                    {filters.status === 'all' ? 'Nearby Stations' : filters.status === 'active' ? 'Active Stations' : 'Inactive Stations'}
                </h2>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingBottom: '20px'
                }}>
                    {sortedStations.length > 0 ? (
                        sortedStations.map((station, index) => (
                            <div
                                key={station.id}
                                onClick={() => onSelect(station)}
                                className="glass"
                                style={{
                                    padding: '10px',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    border: selectedStationId === station.id ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                    background: selectedStationId === station.id ? 'rgba(34, 197, 94, 0.05)' : 'var(--glass-panel)',
                                    boxShadow: 'none',
                                    flexShrink: 0,
                                    minHeight: 'fit-content',
                                    opacity: station.hoursOld > 16 ? 0.6 : station.hoursOld > 4 ? 0.85 : 1
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                                    <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>{station.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span className={`status-badge status-${station.status}`}>
                                            {station.status === 'active'
                                                ? (station.trustLevel === 'mixed-reports' ? 'Mixed Reports ⚠️' : 'Active')
                                                : (station.status === 'inactive' ? (station.trustLevel === 'confirmed-dry' ? 'Confirmed Dry ⚪' : 'Confirmed Empty ⚪') : 'Inactive')}
                                        </span>

                                        {/* Queue Status Badge */}
                                        <span
                                            title={!station.queueStatus ? "No current reports on wait times." :
                                                station.queueStatus === 'short' ? "Movement is fast. Expect to be out in under 15 mins." :
                                                    station.queueStatus === 'mild' ? "Steady progress. Estimated wait: 15–30 mins." :
                                                        "Major backlog. Expect a wait of 30+ mins."}
                                            className={`queue-badge ${!station.queueStatus ? 'queue-unknown' : `queue-${station.queueStatus}`}`}
                                            style={{
                                                opacity: station.hoursOld > 4 ? 0.7 : 1
                                            }}
                                        >
                                            {!station.queueStatus ?
                                                (station.status === 'active' ? '⚪ Queue: Unknown' : '⚪ No Queue (Empty)') :
                                                (station.queueStatus === 'short' ? '⚡ Queue: Quick (<15 mins)' :
                                                    station.queueStatus === 'mild' ? '⏳ Queue: Steady (~30 mins)' :
                                                        '🚨 Queue: Long (30+ mins)')}
                                        </span>

                                        {station.freshnessStatus === 'fresh' && (
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '700',
                                                background: 'rgba(34, 197, 94, 0.1)',
                                                color: '#4ade80',
                                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                animation: 'pulse-badge 2s infinite'
                                            }}>
                                                ✨ FRESH
                                            </span>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewDetails(station);
                                            }}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: 'white'
                                            }}
                                            title="View Details"
                                        >
                                            <Info size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, fontSize: '0.85rem', marginBottom: '8px', color: station.trustLevel === 'uncertain' ? '#facc15' : 'inherit' }}>
                                    <MapPin size={14} />
                                    {station.address}
                                    {station.distance !== undefined && station.distance !== null && (
                                        <span style={{ color: 'var(--color-active)', fontWeight: '600' }}>
                                            • {station.distance.toFixed(1)}km
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '4px', fontWeight: 'normal' }}>
                                                (~{formatTravelTime(calculateTravelTime(station.distance))})
                                            </span>
                                        </span>
                                    )}
                                </div>

                                {/* Trust-Based Summary Microcopy */}
                                <div style={{
                                    fontSize: '0.8rem',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: station.status === 'active' ? '#4ade80' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {station.status === 'active' && station.trustLevel === 'verified-fresh' && <span>✨ Verified Fresh</span>}
                                    {station.status === 'active' && station.trustLevel === 'community-sync' && <span>👥 Community Sync</span>}
                                    {station.status === 'active' && station.trustLevel === 'recently-seen' && <span>👤 Recently Seen</span>}
                                    {station.status === 'active' && station.trustLevel === 'mixed-reports' && <span>⚠️ Conflicting data. Help verify.</span>}
                                    {station.status === 'active' && station.trustLevel === 'outdated' && <span>⏳ Eyes Needed</span>}
                                    {station.status === 'inactive' && station.trustLevel === 'confirmed-dry' && <span>⚪ Confirmed Dry</span>}
                                    {station.status === 'inactive' && station.trustLevel !== 'confirmed-dry' && <span>⚪ Pumps dry today</span>}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <PriceDisplay
                                                prices={station.prices}
                                                lastPriceUpdate={station.lastPriceUpdate}
                                                compact={true}
                                            />
                                        </div>

                                        {station.hasPhoto && (
                                            <div style={{
                                                fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                color: '#60a5fa',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                📸 Verified
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, fontSize: '0.75rem' }}>
                                        <Clock size={12} />
                                        {formatTimeAgo(station.lastUpdated)}
                                        {station.lastReporter && (
                                            <span style={{ opacity: 0.6 }}>by {station.lastReporter} {station.trustLevel === 'verified-fresh' && '🛡️'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            opacity: 0.7,
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px dashed var(--glass-border)',
                            marginTop: '20px'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>No stations match your search</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '20px' }}>Try clearing your filters or checking a different area.</p>
                            <button
                                onClick={() => onFilterChange({ status: 'all', fuelType: 'all', searchQuery: '', queueLength: 'all' })}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    background: 'var(--color-active)',
                                    color: 'black',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                {!user ? (
                    <button
                        onClick={onLogin}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        Sign In / Sign Up
                    </button>
                ) : (
                    <>
                        <div
                            onClick={onOpenProfile}
                            style={{
                                marginBottom: '4px', fontSize: '0.8rem', opacity: 0.9, textAlign: 'center',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px',
                                cursor: 'pointer', border: '1px solid var(--glass-border)'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem'
                                }}>
                                    {(user.email || '?')[0].toUpperCase()}
                                </div>
                                <span style={{ fontWeight: '500' }}>Profile</span>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-inactive)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    textDecoration: 'underline',
                                    padding: '0'
                                }}
                            >
                                Log Out
                            </button>
                        </div>

                        {/* Fleet Dashboard Button (Visible to logged in users for demo) */}
                        <button
                            onClick={onOpenFleetDashboard}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginTop: '8px',
                                borderRadius: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <Fuel size={16} /> Fleet Command
                        </button>


                    </>
                )}

            </div>
            <style>{`
                @keyframes pulse-badge {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            `}</style>
        </div >
    );
};

export default StationList;
