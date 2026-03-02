import React from 'react';
import { MapPin, Info, ArrowRight, ExternalLink } from 'lucide-react';

const LagosOnlyModal = ({ isOpen, onClose, userLocation }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: 'white',
            textAlign: 'center'
        }}>
            <div style={{
                width: '70px',
                height: '70px',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.2)'
            }}>
                <MapPin size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                Exclusive to Lagos
            </h2>

            <div style={{
                maxWidth: '300px',
                lineHeight: '1.5',
                opacity: 0.9,
                marginBottom: '24px',
                fontSize: '0.95rem'
            }}>
                <p>
                    <strong>FuelPulse</strong> is currently optimized for Lagos State only. We detected your location is outside our service area.
                </p>

                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    textAlign: 'left'
                }}>
                    <Info size={18} style={{ flexShrink: 0, color: '#fbbf24', marginTop: '2px' }} />
                    <span>Don't worry! You can still browse the Lagos map to check prices and availability for your trips.</span>
                </div>
            </div>

            <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={onClose}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '14px',
                        justifyContent: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        borderRadius: '12px',
                        background: '#fbbf24',
                        color: '#451a03'
                    }}
                >
                    Browse Lagos Map
                </button>

                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '10px' }}>
                    Current Location: {userLocation?.lat?.toFixed(2)}, {userLocation?.lng?.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default LagosOnlyModal;
