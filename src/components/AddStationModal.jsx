import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

const AddStationModal = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const petrolPrice = e.target.petrolPrice.value;
        const dieselPrice = e.target.dieselPrice.value;

        const prices = {};
        if (petrolPrice) prices.petrol = parseInt(petrolPrice);
        if (dieselPrice) prices.diesel = parseInt(dieselPrice);

        try {
            await onSubmit({ name, address, prices: Object.keys(prices).length > 0 ? prices : null });
            // Reset form
            setName('');
            setAddress('');
            onClose();
        } catch (error) {
            alert("Failed to add station: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '400px', padding: '30px',
                borderRadius: '16px', position: 'relative',
                border: '1px solid var(--glass-border)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <h2 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '1.5rem' }}>Add New Station</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Station Name</label>
                        <input
                            type="text" required
                            value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Conoil, Lekki Phase 1"
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Address</label>
                        <input
                            type="text" required
                            value={address} onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. Admiralty Way, Lekki"
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Petrol Price (₦)</label>
                            <input
                                type="number"
                                placeholder="e.g. 950"
                                name="petrolPrice"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                    color: 'white', outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Diesel Price (₦)</label>
                            <input
                                type="number"
                                placeholder="e.g. 1200"
                                name="dieselPrice"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                    color: 'white', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: '1.4' }}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        We will automatically find the GPS location for this address.
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                        {loading ? 'Adding...' : 'Add Station'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddStationModal;
