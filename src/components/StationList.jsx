import React from 'react';
import { MapPin, Fuel, Clock } from 'lucide-react';
import { formatTimeAgo, formatPrice } from '../services/stationService';
import FilterBar from './FilterBar';

const StationList = ({ stations, onSelect, onViewDetails, selectedStationId, onImport, onFixAddresses, onRestore, onAddStation, onOpenAdminDashboard, importStatus, user, onLogin, onLogout, filters, onFilterChange }) => {
    // ... matching existing code ...
    // Local State for sorting only
    const [sortBy, setSortBy] = React.useState('distance'); // 'distance', 'price', 'queue'

    // Sort the incoming filtered stations
    const sortedStations = [...stations].sort((a, b) => {
        if (sortBy === 'distance') {
            // Assuming stations have 'distance' calculated (which they do in App.jsx when location is found, BUT maybe not just raw list)
            // If distance is missing, push to bottom.
            const distA = a.distance || Infinity;
            const distB = b.distance || Infinity;
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
                if (s.queueStatus === 'medium') return 2;
                if (s.queueStatus === 'long') return 3;
                return 4; // active but no queue info
            };
            return getRank(a) - getRank(b);
        }
        return 0;
    });

    return (
        <div className="sidebar">
            {/* ... Header and List sections remain roughly same, only Footer changes ... */}

            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{
                        background: 'var(--color-active)',
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Fuel size={20} color="#000" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Lagos Petrol Pulse</h1>
                </div>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
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
                        marginTop: '15px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        color: 'white',
                        outline: 'none'
                    }}
                />

                <div style={{ marginTop: '16px' }}>
                    <FilterBar filters={filters} onFilterChange={onFilterChange} />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>
                    {filters.status === 'all' ? 'Nearby Stations' : filters.status === 'active' ? 'Active Stations' : 'Inactive Stations'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {sortedStations.map(station => (
                        <div
                            key={station.id}
                            onClick={() => onSelect(station)}
                            className="glass"
                            style={{
                                padding: '16px',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: selectedStationId === station.id ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                background: selectedStationId === station.id ? 'rgba(34, 197, 94, 0.05)' : 'var(--glass-panel)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{station.name}</h3>
                                <span className={`status-badge status-${station.status}`}>
                                    {station.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, fontSize: '0.85rem', marginBottom: '4px' }}>
                                <MapPin size={14} />
                                {station.address}
                                {station.distance && <span style={{ color: 'var(--color-active)', fontWeight: 'bold' }}>• {station.distance.toFixed(1)}km</span>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {station.prices?.petrol && (
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                P: {formatPrice(station.prices.petrol)}
                                            </div>
                                        )}
                                        {station.prices?.diesel && (
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#facc15', background: 'rgba(234, 179, 8, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                D: {formatPrice(station.prices.diesel)}
                                            </div>
                                        )}
                                        {station.prices?.gas && (
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                G: {formatPrice(station.prices.gas)}
                                            </div>
                                        )}
                                        {!station.prices?.petrol && !station.prices?.diesel && !station.prices?.gas && (
                                            <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>No Price</span>
                                        )}
                                    </div>

                                    {station.status === 'active' && station.queueStatus && (
                                        <div style={{
                                            fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px',
                                            background: station.queueStatus === 'short' ? 'rgba(34, 197, 94, 0.2)' : station.queueStatus === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: station.queueStatus === 'short' ? '#4ade80' : station.queueStatus === 'medium' ? '#facc15' : '#f87171'
                                        }}>
                                            {station.queueStatus === 'short' ? 'Short Q' : station.queueStatus === 'medium' ? 'Med Q' : 'Long Q'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5, fontSize: '0.8rem' }}>
                                    <Clock size={12} />
                                    {formatTimeAgo(station.lastUpdated)}
                                </div>
                            </div>

                            <div
                                style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-active)', textDecoration: 'underline', cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails(station);
                                }}
                            >
                                View Reviews & Details
                            </div>
                        </div>
                    ))}
                    {sortedStations.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                            No stations found with this status.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>

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
                        <div style={{ marginBottom: '4px', fontSize: '0.75rem', opacity: 0.7, textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{user.email}</span>
                            <button
                                onClick={onLogout}
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
                        {user.role === 'admin' && (
                            <div style={{
                                fontSize: '0.7rem',
                                background: 'var(--color-active)',
                                color: 'black',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '8px',
                                fontWeight: 'bold'
                            }}>
                                ADMIN MODE
                            </div>
                        )}

                        {user.role === 'admin' && (
                            <button
                                onClick={onOpenAdminDashboard}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    marginTop: '8px',
                                    background: 'var(--color-active)',
                                    color: 'black',
                                    fontWeight: 'bold'
                                }}
                            >
                                Open Admin Dashboard
                            </button>
                        )}


                    </>
                )}

            </div>
        </div>
    );
};

export default StationList;
