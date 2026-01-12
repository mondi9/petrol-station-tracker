import React from 'react';
import { MapPin, Fuel, Clock } from 'lucide-react';
import { formatTimeAgo } from '../services/stationService';

const StationList = ({ stations, onSelect, onViewDetails, selectedStationId, onImport, onFixAddresses, onRestore, onAddStation, onOpenAdminDashboard, importStatus, user, onLogin, onLogout }) => {
    // ... matching existing code ...
    const [filter, setFilter] = React.useState('all'); // 'all', 'active', 'inactive'
    const [searchQuery, setSearchQuery] = React.useState('');


    const filteredStations = stations.filter(s => {
        const matchesFilter = filter === 'all' || s.status === filter;
        const name = s.name || '';
        const address = s.address || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                    {filteredStations.length === 0 && (
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

                        {/* Temporary Dev Button */}
                        {user.role !== 'admin' && (
                            <button
                                onClick={async () => {
                                    if (confirm("Make current user Admin?")) {
                                        try {
                                            const { doc, setDoc, getFirestore } = await import('firebase/firestore');
                                            const db = getFirestore();
                                            const { auth } = await import('../services/firebase');
                                            if (auth.currentUser) {
                                                await setDoc(doc(db, "users", auth.currentUser.uid), { role: "admin" }, { merge: true });
                                                alert("You are now an Admin! Refresh the page.");
                                                window.location.reload();
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert("Error: " + e.message);
                                        }
                                    }
                                }}
                                style={{ marginTop: '20px', fontSize: '0.7rem', opacity: 0.5, background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
                            >
                                (Dev) Make Me Admin
                            </button>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default StationList;
