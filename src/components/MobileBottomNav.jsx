import React from 'react';
import { Map, List, Fuel, User } from 'lucide-react';

const MobileBottomNav = ({ viewMode, setViewMode, onOpenFleet, onOpenProfile, unreadCount = 0 }) => {
    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            padding: '10px 0', zIndex: 3000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
        }}>

            <button
                onClick={() => setViewMode('map')}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    color: viewMode === 'map' ? 'var(--color-active)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1
                }}
            >
                <Map size={24} strokeWidth={viewMode === 'map' ? 2.5 : 2} />
                <span style={{ fontSize: '0.7rem', fontWeight: viewMode === 'map' ? 'bold' : 'normal' }}>Map</span>
            </button>

            <button
                onClick={() => setViewMode('list')}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    color: viewMode === 'list' ? 'var(--color-active)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1
                }}
            >
                <List size={24} strokeWidth={viewMode === 'list' ? 2.5 : 2} />
                <span style={{ fontSize: '0.7rem', fontWeight: viewMode === 'list' ? 'bold' : 'normal' }}>Stations</span>
            </button>

            <button
                onClick={onOpenFleet}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1
                }}
            >
                <Fuel size={24} />
                <span style={{ fontSize: '0.7rem' }}>Fleet</span>
            </button>

            <button
                onClick={onOpenProfile}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1, position: 'relative'
                }}
            >
                <User size={24} />
                <span style={{ fontSize: '0.7rem' }}>Profile</span>
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute', top: 0, right: '25%',
                        width: '8px', height: '8px', borderRadius: '50%', background: 'red'
                    }}></div>
                )}
            </button>

        </div>
    );
};

export default MobileBottomNav;
