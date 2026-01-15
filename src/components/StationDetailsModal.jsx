import React, { useState } from 'react';
import { X, MapPin, Clock, Navigation } from 'lucide-react';
import ReviewList from './ReviewList';
import AddReviewModal from './AddReviewModal';
import { addReview } from '../services/reviewService';
import { formatTimeAgo, formatPrice } from '../services/stationService';

const StationDetailsModal = ({ isOpen, onClose, station, user, onLoginRequest, userLocation }) => {
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
                            {station.status === 'active' && station.queueStatus && (
                                <span className={`status-badge`} style={{
                                    marginBottom: '12px',
                                    marginLeft: '8px',
                                    display: 'inline-block',
                                    backgroundColor: station.queueStatus === 'short' ? '#22c55e' :
                                        station.queueStatus === 'medium' ? '#eab308' :
                                            station.queueStatus === 'long' ? '#ef4444' : '#64748b',
                                    color: station.queueStatus === 'medium' ? 'black' : 'white'
                                }}>
                                    {station.queueStatus === 'short' ? 'Short Queue' :
                                        station.queueStatus === 'medium' ? 'Med Queue' :
                                            station.queueStatus === 'long' ? 'Long Queue' : station.queueStatus}
                                </span>
                            )}

                            {/* Price Ticker */}
                            {station.prices && (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    {station.prices.petrol && (
                                        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.85rem' }}>
                                            <span style={{ opacity: 0.7 }}>PMS:</span> <strong>{formatPrice(station.prices.petrol)}</strong>
                                        </div>
                                    )}
                                    {station.prices.diesel && (
                                        <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#facc15', fontSize: '0.85rem' }}>
                                            <span style={{ opacity: 0.7 }}>AGO:</span> <strong>{formatPrice(station.prices.diesel)}</strong>
                                        </div>
                                    )}
                                    {station.prices.gas && (
                                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.85rem' }}>
                                            <span style={{ opacity: 0.7 }}>LPG:</span> <strong>{formatPrice(station.prices.gas)}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{station.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, marginTop: '8px', fontSize: '0.95rem' }}>
                                <MapPin size={16} />
                                {station.address}
                                {/* Distance Display */}
                                {userLocation && station.lat && station.lng && (
                                    <span style={{ marginLeft: '8px', fontWeight: 'bold', color: 'var(--color-active)' }}>
                                        • {(() => {
                                            const R = 6371;
                                            const dLat = (station.lat - userLocation.lat) * (Math.PI / 180);
                                            const dLon = (station.lng - userLocation.lng) * (Math.PI / 180);
                                            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                                Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(station.lat * (Math.PI / 180)) *
                                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                            return (R * c).toFixed(1);
                                        })()} km away
                                    </span>
                                )}
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
                            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', gap: '8px' }}
                        >
                            <Navigation size={16} /> Google Maps
                        </a>
                        <a
                            href={`https://waze.com/ul?ll=${station.lat},${station.lng}&navigate=yes`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn"
                            style={{
                                flex: 1,
                                justifyContent: 'center',
                                textDecoration: 'none',
                                gap: '8px',
                                background: '#33ccff',
                                color: 'black',
                                border: 'none'
                            }}
                        >
                            <Navigation size={16} /> Waze
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
