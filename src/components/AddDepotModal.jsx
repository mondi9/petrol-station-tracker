import React, { useState } from 'react';
import { X, Warehouse, MapPin } from 'lucide-react';

const AddDepotModal = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({ name, address });
            // Reset form
            setName('');
            setAddress('');
            onClose();
        } catch (error) {
            alert("Failed to add depot: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 3000, backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '400px', padding: '30px',
                borderRadius: '16px', position: 'relative',
                border: '1px solid var(--glass-border)',
                background: 'rgba(23, 23, 23, 0.95)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                    <div style={{ background: '#3b82f6', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                        <Warehouse size={32} color="white" />
                    </div>
                    <h2 style={{ textAlign: 'center', fontSize: '1.5rem', margin: 0 }}>Add New Depot</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Register a business hub for fleet tracking</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Depot Name</label>
                        <input
                            type="text" required
                            value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apapa Cargo Hub"
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Address / Location</label>
                        <input
                            type="text" required
                            value={address} onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. 123 Wharf Road, Apapa"
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: '1.4', background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                        <MapPin size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <span>We will automatically find the coordinates for this depot on the map.</span>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{
                        marginTop: '10px', width: '100%', justifyContent: 'center',
                        height: '48px', fontSize: '1rem', fontWeight: 'bold'
                    }}>
                        {loading ? 'Registering...' : 'Register Depot'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddDepotModal;
