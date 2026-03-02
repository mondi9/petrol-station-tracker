import React from 'react';
import { MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

const LocationDisclosure = ({ onAccept, onDecline }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0f172a',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: 'white',
            textAlign: 'center'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: '#22c55e',
                animation: 'pulse-active 2s infinite'
            }}>
                <MapPin size={48} />
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '16px' }}>
                Location Access
            </h1>

            <div style={{
                maxWidth: '320px',
                lineHeight: '1.6',
                opacity: 0.9,
                marginBottom: '32px'
            }}>
                <p style={{ marginBottom: '16px' }}>
                    <strong>FuelPulse</strong> uses your location data to find the nearest fuel stations, provide accurate queue estimates, and navigate you to active pumps.
                </p>
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', marginBottom: '8px', fontWeight: '600' }}>
                        <ShieldCheck size={16} />
                        Play Store Compliance
                    </div>
                    This app collects location data to enable <strong>Real-time Station Alerts</strong> and <strong>Nearest Station Tracking</strong> even when the app is closed or not in use.
                </div>
            </div>

            <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={onAccept}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        borderRadius: '12px'
                    }}
                >
                    Agree & Continue
                </button>
                <button
                    onClick={onDecline}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '8px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    No thanks, I'll search manually
                </button>
            </div>

            <style>{`
                @keyframes pulse-active {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            `}</style>
        </div>
    );
};

export default LocationDisclosure;
