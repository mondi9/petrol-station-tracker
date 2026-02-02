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
            padding: '0', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 999,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'auto'
        }}>

            <button
                onClick={() => setViewMode('map')}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    color: viewMode === 'map' ? 'var(--color-active)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1,
                    padding: '6px 0'
                }}
            >
                <Map size={20} strokeWidth={viewMode === 'map' ? 2.5 : 2} />
                <span style={{ fontSize: '0.7rem', fontWeight: viewMode === 'map' ? 'bold' : 'normal' }}>Map</span>
            </button>

            <button
                onClick={() => setViewMode('list')}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    color: viewMode === 'list' ? 'var(--color-active)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1,
                    padding: '6px 0'
                }}
            >
                <List size={20} strokeWidth={viewMode === 'list' ? 2.5 : 2} />
                <span style={{ fontSize: '0.7rem', fontWeight: viewMode === 'list' ? 'bold' : 'normal' }}>Stations</span>
            </button>

            <button
                onClick={onOpenFleet}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1,
                    padding: '6px 0'
                }}
            >
                <Fuel size={20} />
                <span style={{ fontSize: '0.7rem' }}>Fleet</span>
            </button>

            <button
                onClick={onOpenProfile}
                style={{
                    background: 'transparent', border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', flex: 1, position: 'relative',
                    padding: '6px 0'
                }}
            >
                <User size={20} />
                <span style={{ fontSize: '0.7rem' }}>Profile</span>
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute', top: '8px', right: '25%',
                        width: '8px', height: '8px', borderRadius: '50%', background: 'red'
                    }}></div>
                )}
            </button>

        </div>
    );
};

export default MobileBottomNav;
