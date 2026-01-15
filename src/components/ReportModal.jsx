import React, { useState, useEffect } from 'react';
import { X, Fuel, Ban, Check } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onSubmit, station }) => {
    const [availability, setAvailability] = useState({ petrol: true, diesel: true, gas: false });
    const [queue, setQueue] = useState('short'); // 'short' | 'medium' | 'long'
    const [prices, setPrices] = useState({ petrol: '', diesel: '', gas: '' });

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            // Default to all active for ease, or maybe just petrol
            setAvailability({ petrol: true, diesel: true, gas: false });
            setQueue('short');
            setPrices({ petrol: '', diesel: '', gas: '' });
        }
    }, [isOpen]);

    if (!isOpen || !station) return null;

    // Derived Status
    const isAnyFuelAvailable = Object.values(availability).some(v => v);
    const derivedStatus = isAnyFuelAvailable ? 'active' : 'inactive';

    const handleSubmit = () => {
        // Prepare prices (only if value exists)
        const formattedPrices = {};
        if (prices.petrol) formattedPrices.petrol = parseInt(prices.petrol);
        if (prices.diesel) formattedPrices.diesel = parseInt(prices.diesel);
        if (prices.gas) formattedPrices.gas = parseInt(prices.gas);

        // Submit derived status + granular availability
        onSubmit(
            derivedStatus,
            derivedStatus === 'active' ? queue : null,
            Object.keys(formattedPrices).length > 0 ? formattedPrices : null,
            availability
        );
    };

    const toggleAvailability = (type) => {
        setAvailability(prev => ({ ...prev, [type]: !prev[type] }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass" style={{
                width: '90%',
                maxWidth: '400px',
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#1a1a1a',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transform: 'scale(1)',
                animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Report Status</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{station.name}</h3>
                    <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>{station.address}</p>
                </div>

                {/* 1. Granular Availability Toggles */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>What is available?</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['petrol', 'diesel', 'gas'].map(type => (
                            <button
                                key={type}
                                onClick={() => toggleAvailability(type)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: availability[type] ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                    background: availability[type] ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: availability[type] ? 'var(--color-active)' : 'rgba(255,255,255,0.5)',
                                    fontWeight: availability[type] ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ textTransform: 'capitalize' }}>{type}</span>
                                {availability[type] ? <Check size={16} /> : <Ban size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Details Form (Only if Active) */}
                {derivedStatus === 'active' ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }} />

                        {/* Queue Length */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>How long is the queue?</label>
                            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                                {['short', 'medium', 'long'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setQueue(q)}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                                            background: queue === q ? (q === 'short' ? 'var(--color-active)' : q === 'medium' ? '#eab308' : '#ef4444') : 'transparent',
                                            color: queue === q ? 'black' : 'rgba(255,255,255,0.6)',
                                            fontWeight: queue === q ? 'bold' : 'normal',
                                            cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem'
                                        }}
                                    >
                                        {q.charAt(0).toUpperCase() + q.slice(1)} Q
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Prices */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Current Prices (Optional)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Petrol</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        disabled={!availability.petrol}
                                        value={prices.petrol}
                                        onChange={(e) => setPrices({ ...prices, petrol: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: availability.petrol ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)', opacity: availability.petrol ? 1 : 0.3, color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Diesel</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        disabled={!availability.diesel}
                                        value={prices.diesel}
                                        onChange={(e) => setPrices({ ...prices, diesel: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: availability.diesel ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)', opacity: availability.diesel ? 1 : 0.3, color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Gas (kg)</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        disabled={!availability.gas}
                                        value={prices.gas}
                                        onChange={(e) => setPrices({ ...prices, gas: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: availability.gas ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)', opacity: availability.gas ? 1 : 0.3, color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, border: '1px dashed var(--glass-border)', borderRadius: '8px', marginBottom: '20px' }}>
                        Station will be marked as <strong>Inactive (No Fuel)</strong>.
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    style={{
                        width: '100%', padding: '14px',
                        justifyContent: 'center', fontWeight: 'bold',
                        background: derivedStatus === 'active' ? 'var(--color-active)' : 'var(--color-inactive)',
                        color: derivedStatus === 'active' ? 'black' : 'white'
                    }}
                >
                    {derivedStatus === 'active' ? 'Submit Active Update' : 'Report No Fuel'}
                </button>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
        </div >
    );
};

export default ReportModal;
