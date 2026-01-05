import React, { useState } from 'react';
import { X, MapPin, Clock, Navigation } from 'lucide-react';
import ReviewList from './ReviewList';
import AddReviewModal from './AddReviewModal';
import { addReview } from '../services/reviewService';
import { formatTimeAgo } from '../services/stationService';

const StationDetailsModal = ({ isOpen, onClose, station, user, onLoginRequest }) => {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    if (!isOpen || !station) return null;

    const handleAddReview = async (data) => {
        await addReview(station.id, data, user);
        // ReviewList will auto-update via subscription
    };

    const handleWriteReviewClick = () => {
        if (!user) {
            onLoginRequest();
        } else {
            setIsReviewOpen(true);
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000, backdropFilter: 'blur(3px)'
            }} onClick={onClose}>
                <div className="glass-panel" style={{
                    width: '100%', maxWidth: '600px', height: '85vh',
                    borderRadius: '16px', position: 'relative',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden'
                }} onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <span className={`status-badge status-${station.status}`} style={{ marginBottom: '12px', display: 'inline-block' }}>
                                {station.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{station.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, marginTop: '8px', fontSize: '0.95rem' }}>
                                <MapPin size={16} />
                                {station.address}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                            <X size={28} />
                        </button>
                    </div>

                    {/* Actions Row */}
                    <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                        >
                            <Navigation size={16} /> Directions
                        </a>
                        <button
                            className="btn"
                            onClick={handleWriteReviewClick}
                            style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}
                        >
                            Write a Review
                        </button>
                    </div>

                    {/* Content (Scrollable) */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5, fontSize: '0.9rem', marginBottom: '24px' }}>
                                <Clock size={16} />
                                Last status update: {formatTimeAgo(station.lastUpdated)}
                            </div>

                            <ReviewList stationId={station.id} user={user} />
                        </div>
                    </div>
                </div>
            </div>

            <AddReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={handleAddReview}
                stationName={station.name}
            />
        </>
    );
};

export default StationDetailsModal;
