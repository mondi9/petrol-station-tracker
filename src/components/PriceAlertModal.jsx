import React, { useState } from 'react';
import { X, Bell, Banknote, AlertCircle } from 'lucide-react';
import { validatePrice } from '../services/priceService';
import { createAlert } from '../services/alertService';

const PriceAlertModal = ({ isOpen, onClose, station, user, onSuccess }) => {
    const [fuelType, setFuelType] = useState('petrol');
    const [targetPrice, setTargetPrice] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isGlobal, setIsGlobal] = useState(false);

    if (!isOpen || !station) return null;

    const currentPrice = station.prices?.[fuelType] || 0;

    const handleSubmit = async () => {
        setError('');

        // Validation
        if (!targetPrice || targetPrice <= 0) {
            setError('Please enter a valid target price');
            return;
        }

        const price = parseInt(targetPrice);

        if (!validatePrice(price, fuelType)) {
            setError('Price seems unrealistic. Please check.');
            return;
        }

        if (price >= currentPrice) {
            setError('Target price should be lower than current price');
            return;
        }

        if (!user) {
            setError('You must be logged in to create alerts');
            return;
        }

        setLoading(true);

        try {
            await createAlert(
                user.uid,
                isGlobal ? null : station.id,
                isGlobal ? "Any Station Nearby" : station.name,
                fuelType,
                price,
                currentPrice
            );

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
                setSuccess(false);
                setTargetPrice('');
            }, 1500);
        } catch (err) {
            setError('Failed to create alert. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div className="glass" style={{
                width: '100%', maxWidth: '400px', padding: '24px',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)',
                background: '#1a1a1a', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Bell size={20} color="#000" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Set Price Alert</h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: 'white',
                        cursor: 'pointer', padding: '4px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Station Info */}
                {!isGlobal && (
                    <div style={{
                        marginBottom: '20px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 4px 0' }}>{station.name}</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>{station.address}</p>
                    </div>
                )}

                {/* Alert Scope Toggle */}
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '4px'
                }}>
                    <button
                        onClick={() => setIsGlobal(false)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            borderRadius: '6px',
                            background: !isGlobal ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                            color: !isGlobal ? '#22c55e' : '#94a3b8',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        This Station
                    </button>
                    <button
                        onClick={() => setIsGlobal(true)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            borderRadius: '6px',
                            background: isGlobal ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                            color: isGlobal ? '#22c55e' : '#94a3b8',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Any Station
                    </button>
                </div>

                {/* Fuel Type Selector */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                        Fuel Type
                    </label>
                    <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                            color: 'white', fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        <option value="petrol" style={{ background: '#333' }}>Petrol (PMS)</option>
                        <option value="diesel" style={{ background: '#333' }}>Diesel (AGO)</option>
                        <option value="premium" style={{ background: '#333' }}>Premium</option>
                    </select>
                </div>

                {/* Current Price Display */}
                {currentPrice > 0 && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current Price:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#22c55e' }}>
                            ₦{currentPrice.toLocaleString()}
                        </span>
                    </div>
                )}

                {/* Target Price Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500'
                    }}>
                        <Banknote size={16} style={{ color: '#22c55e' }} />
                        Target Price (₦)
                    </label>
                    <input
                        type="number"
                        placeholder={currentPrice ? `Lower than ${currentPrice}` : "e.g., 900"}
                        value={targetPrice}
                        onChange={(e) => {
                            setTargetPrice(e.target.value);
                            setError('');
                        }}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: error ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                            color: 'white', fontSize: '1rem'
                        }}
                    />
                    {error && (
                        <div style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#ef4444',
                            fontSize: '0.85rem'
                        }}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                    {!error && targetPrice && (
                        <p style={{
                            marginTop: '8px',
                            fontSize: '0.8rem',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Bell size={14} />
                            You'll be notified when {isGlobal ? 'ANY station' : 'this station'} reports ₦{parseInt(targetPrice).toLocaleString()} or below
                        </p>
                    )}
                </div>

                {/* Success Message */}
                {success && (
                    <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#22c55e',
                        textAlign: 'center',
                        fontWeight: '600',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        ✅ Alert created successfully!
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || success}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '14px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        opacity: loading || success ? 0.6 : 1,
                        cursor: loading || success ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Creating Alert...' : success ? 'Alert Created!' : 'Create Alert'}
                </button>
            </div>
        </div>
    );
};

export default PriceAlertModal;
