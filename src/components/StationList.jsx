import React from 'react';
import { MapPin, Fuel, Clock, Activity } from 'lucide-react';
import { formatTimeAgo } from '../services/mockData';

const StationList = ({ stations, onSelect, selectedStationId }) => {
    const [filter, setFilter] = React.useState('all'); // 'all', 'active', 'inactive'
    const activeCount = stations.filter(s => s.status === 'active').length;

    const filteredStations = stations.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    return (
        <div className="sidebar" style={{
            width: '380px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--glass-border)',
            position: 'relative',
            zIndex: 500,
            boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}>
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
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Petrol Pulse</h1>
                </div>
                <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                    Real-time crowd-sourced fuel availability.
                </p>

                <div style={{ marginTop: '20px', display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                    <button
                        onClick={() => setFilter('all')}
                        style={{
                            flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
                            background: filter === 'all' ? 'var(--glass-panel)' : 'transparent',
                            color: filter === 'all' ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                            border: filter === 'all' ? '1px solid var(--glass-border)' : 'none'
                        }}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        style={{
                            flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
                            background: filter === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                            color: filter === 'active' ? 'var(--color-active)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                            border: filter === 'active' ? '1px solid rgba(34, 197, 94, 0.2)' : 'none'
                        }}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('inactive')}
                        style={{
                            flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
                            background: filter === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            color: filter === 'inactive' ? 'var(--color-inactive)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
                            border: filter === 'inactive' ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                        }}
                    >
                        Inactive
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <h2 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>
                    {filter === 'all' ? 'Nearby Stations' : filter === 'active' ? 'Active Stations' : 'Inactive Stations'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredStations.map(station => (
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
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5, fontSize: '0.8rem' }}>
                                <Clock size={12} />
                                Updated {formatTimeAgo(station.lastUpdated)}
                            </div>
                        </div>
                    ))}
                    {filteredStations.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                            No stations found with this status.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / User Info Placeholder */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', fontSize: '0.8rem', opacity: 0.5, textAlign: 'center' }}>
                <p>Displaying demo data for Lagos, Nigeria area.</p>
            </div>
        </div>
    );
};

export default StationList;
