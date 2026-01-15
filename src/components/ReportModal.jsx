import React, { useState, useEffect } from 'react';
import { X, Fuel, Ban, Check } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onSubmit, station }) => {
    const [status, setStatus] = useState(null); // 'active' | 'inactive'
    const [queue, setQueue] = useState('short'); // 'short' | 'medium' | 'long'
    const [prices, setPrices] = useState({ petrol: '', diesel: '', gas: '' });

    useEffect(() => {
        if (isOpen) {
            setStatus(null);
            setQueue('short');
            setPrices({ petrol: '', diesel: '', gas: '' });
        }
    }, [isOpen]);

    if (!isOpen || !station) return null;

    const handleSubmit = () => {
        if (!status) return;

        if (status === 'inactive') {
            onSubmit('inactive', null, null);
        } else {
            const formattedPrices = {};
            if (prices.petrol) formattedPrices.petrol = parseInt(prices.petrol);
            if (prices.diesel) formattedPrices.diesel = parseInt(prices.diesel);
            if (prices.gas) formattedPrices.gas = parseInt(prices.gas);

            onSubmit('active', queue, Object.keys(formattedPrices).length > 0 ? formattedPrices : null);
        }
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

                {/* 1. Availability Selection */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Is fuel available right now?</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                            onClick={() => setStatus('active')}
                            style={{
                                padding: '16px', borderRadius: '12px',
                                border: status === 'active' ? '2px solid var(--color-active)' : '1px solid var(--glass-border)',
                                background: status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                color: status === 'active' ? 'var(--color-active)' : 'white',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Fuel size={24} />
                            <span style={{ fontWeight: '600' }}>Yes, Selling</span>
                        </button>
                        <button
                            onClick={() => setStatus('inactive')}
                            style={{
                                padding: '16px', borderRadius: '12px',
                                border: status === 'inactive' ? '2px solid var(--color-inactive)' : '1px solid var(--glass-border)',
                                background: status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                                color: status === 'inactive' ? 'var(--color-inactive)' : 'white',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Ban size={24} />
                            <span style={{ fontWeight: '600' }}>No Fuel</span>
                        </button>
                    </div>
                </div>

                {/* 2. Details Form (Only if Active) */}
                {status === 'active' && (
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
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>Update Prices (Optional)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Petrol</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        value={prices.petrol}
                                        onChange={(e) => setPrices({ ...prices, petrol: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Diesel</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        value={prices.diesel}
                                        onChange={(e) => setPrices({ ...prices, diesel: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Gas (kg)</label>
                                    <input
                                        type="number"
                                        placeholder="₦"
                                        value={prices.gas}
                                        onChange={(e) => setPrices({ ...prices, gas: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    disabled={!status}
                    onClick={handleSubmit}
                    className="btn btn-primary"
                    style={{
                        width: '100%', padding: '14px',
                        opacity: !status ? 0.5 : 1,
                        cursor: !status ? 'not-allowed' : 'pointer',
                        justifyContent: 'center', fontWeight: 'bold'
                    }}
                >
                    {status ? 'Submit Report' : 'Select Availability First'}
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
