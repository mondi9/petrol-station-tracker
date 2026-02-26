import React, { useState } from 'react';
import { X, Send, Info } from 'lucide-react';

const AddCorrectionModal = ({ isOpen, onClose, onSubmit, station }) => {
    const [field, setField] = useState('address');
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newValue.trim()) return;

        setLoading(true);
        try {
            await onSubmit({
                field,
                oldValue: station[field],
                newValue: newValue.trim()
            });
            setNewValue('');
            onClose();
        } catch (error) {
            alert("Failed to submit correction: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fieldLabels = {
        name: 'Station Name',
        address: 'Physical Address',
        area: 'Neighborhood/Area'
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 3000, backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '450px', padding: '24px',
                borderRadius: '16px', position: 'relative',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--bg-secondary)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px',
                    color: 'white', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <X size={20} />
                </button>

                <h2 style={{ marginBottom: '8px', fontSize: '1.25rem', color: 'white' }}>Suggest a Correction</h2>
                <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '20px', color: 'white' }}>
                    Help improve details for <strong>{station.name}</strong>. Corrections are reviewed by the community.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
                            What needs fixing?
                        </label>
                        <select
                            value={field}
                            onChange={(e) => {
                                setField(e.target.value);
                                setNewValue('');
                            }}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
                                color: 'white', outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="address">Address</option>
                            <option value="name">Station Name</option>
                            <option value="area">Neighborhood/Area</option>
                        </select>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Current {fieldLabels[field]}</span>
                        <div style={{ fontSize: '0.9rem', color: 'white' }}>{station[field] || 'None set'}</div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>
                            Correct {fieldLabels[field]}
                        </label>
                        <textarea
                            required
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder={`Enter the correct ${fieldLabels[field].toLowerCase()}...`}
                            rows={3}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
                                color: 'white', outline: 'none', resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex', gap: '10px', padding: '12px',
                        background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '0.75rem', color: '#93c5fd', margin: 0, lineHeight: 1.4 }}>
                            Your suggestion will be visible to other users. It will update the app automatically if 5 people verify it.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !newValue.trim()}
                        className="btn btn-primary"
                        style={{
                            justifyContent: 'center', padding: '14px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: '600', transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Submitting...' : (
                            <>
                                <Send size={18} />
                                Submit Correction
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddCorrectionModal;
