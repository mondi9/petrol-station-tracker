import React, { useState, useEffect } from 'react';
import { X, Fuel, CheckCircle, AlertTriangle, Ban } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onSubmit, station, user }) => {
    // Form State
    const [fuelType, setFuelType] = useState('petrol'); // 'petrol' | 'diesel' | 'premium'
    const [availability, setAvailability] = useState('available'); // 'available' | 'low' | 'empty'
    const [queueLength, setQueueLength] = useState(0); // number (minutes or cars)
    const [price, setPrice] = useState('');
    const [guestName, setGuestName] = useState('');

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setFuelType('petrol');
            setAvailability('available');
            setQueueLength(0);
            setPrice('');
            setGuestName('');
        }
    }, [isOpen]);

    if (!isOpen || !station) return null;

    const handleSubmit = () => {
        // Validation
        if (queueLength < 0) {
            alert("Queue length cannot be negative.");
            return;
        }
        if (!user && !guestName.trim()) {
            // Optional per request ("optional for guest"), but improved UX usually asks for it.
            // Requirement said "Name (Text input, optional for guest)".
            // So we won't block, but we will pass it.
        }

        // Construct Data
        const reportData = {
            fuelType,
            availability,
            queueLength: parseInt(queueLength) || 0,
            price: price ? parseInt(price) : null,
            reporterName: user ? (user.displayName || user.email.split('@')[0]) : (guestName.trim() || 'Guest')
        };

        onSubmit(reportData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass" style={{
                width: '90%', maxWidth: '400px', padding: '24px',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)',
                background: '#1a1a1a', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Report Status</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{station.name}</h3>
                    <p style={{ fontSize: '0.9rem', opacity: 0.5, margin: 0 }}>{station.address}</p>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Fuel Type Dropdown */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Fuel Type <span style={{ color: 'red' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={fuelType}
                                onChange={(e) => setFuelType(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem', appearance: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="petrol" style={{ background: '#333' }}>Petrol (PMS)</option>
                                <option value="diesel" style={{ background: '#333' }}>Diesel (AGO)</option>
                                <option value="premium" style={{ background: '#333' }}>Premium (High Octane)</option>
                            </select>
                            <Fuel size={16} style={{ position: 'absolute', right: '12px', top: '14px', opacity: 0.5, pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Availability Radio */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Availability <span style={{ color: 'red' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { val: 'available', label: 'Available', color: 'var(--color-active)', icon: CheckCircle },
                                { val: 'low', label: 'Low', color: '#eab308', icon: AlertTriangle },
                                { val: 'empty', label: 'Empty', color: '#ef4444', icon: Ban }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    onClick={() => setAvailability(opt.val)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: availability === opt.val ? `1px solid ${opt.color}` : '1px solid var(--glass-border)',
                                        background: availability === opt.val ? `${opt.color}20` : 'transparent', // 20 hex alpha
                                        color: availability === opt.val ? opt.color : 'rgba(255,255,255,0.6)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <opt.icon size={18} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: availability === opt.val ? 'bold' : 'normal' }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Queue Length & Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Queue (mins)</label>
                            <input
                                type="number"
                                min="0"
                                value={queueLength}
                                onChange={(e) => setQueueLength(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Price (₦)</label>
                            <input
                                type="number"
                                placeholder="Optional"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Guest Name (if no user) */}
                    {!user && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Your Name <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(Optional)</span></label>
                            <input
                                type="text"
                                placeholder="Guest Reporter"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        style={{
                            marginTop: '8px', padding: '14px', width: '100%', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1rem'
                        }}
                    >
                        Submit Report
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
        </div>
    );
};

export default ReportModal;
