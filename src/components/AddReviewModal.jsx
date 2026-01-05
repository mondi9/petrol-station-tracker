import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

const AddReviewModal = ({ isOpen, onClose, onSubmit, stationName }) => {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ rating, text });
            setText('');
            setRating(5);
            onClose();
        } catch (error) {
            alert("Failed to submit review: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2200, backdropFilter: 'blur(5px)'
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

                <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.4rem' }}>Write a Review</h2>
                <p style={{ textAlign: 'center', opacity: 0.6, fontSize: '0.9rem', marginBottom: '24px' }}>
                    for {stationName}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Star Rating Input */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                                <Star
                                    size={32}
                                    fill={star <= rating ? "#fbbf24" : "none"}
                                    color={star <= rating ? "#fbbf24" : "var(--text-secondary)"}
                                    style={{ transition: 'all 0.2s' }}
                                />
                            </button>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', opacity: 0.8 }}>
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                    </div>

                    <textarea
                        required
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Share your experience... (e.g. queue length, pump speed, service quality)"
                        rows={4}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '12px',
                            border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)',
                            color: 'white', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                        {loading ? 'Posting...' : 'Post Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddReviewModal;
