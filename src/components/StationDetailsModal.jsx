import React, { useState } from 'react';
import { X, MapPin, Clock, Navigation, Star, TrendingUp } from 'lucide-react';
import ReviewList from './ReviewList';
import AddReviewModal from './AddReviewModal';
import PriceDisplay from './PriceDisplay';
import { addReview } from '../services/reviewService';
import { formatTimeAgo, calculateTravelTime, verifyStation } from '../services/stationService';
import { CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

const StationDetailsModal = ({ isOpen, onClose, station, user, onLoginRequest, userLocation }) => {
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    if (!isOpen) return null;

    // Safety check for empty station object
    if (!station) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 3000, backdropFilter: 'blur(3px)',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }} onClick={onClose}>
                <div className="glass-panel" style={{ padding: '20px', color: 'white' }}>
                    Loading station details...
                </div>
            </div>
        );
    }

    const handleAddReview = async (data) => {
        await addReview(station.id, data, user);
    };

    const handleVerify = async (type) => {
        if (!user) {
            onLoginRequest();
            return;
        }
        await verifyStation(station.id, type, user.uid);
    };

    const confirmCount = station.confirmations?.length || 0;
    const flagCount = station.flags?.length || 0;
    const isVerified = confirmCount >= 5;
    const isDisputed = flagCount >= 3 && flagCount > confirmCount;
    const hasConfirmed = user && station.confirmations?.includes(user.uid);
    const hasFlagged = user && station.flags?.includes(user.uid);

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
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000, backdropFilter: 'blur(8px)',
                padding: '20px'
            }} onClick={onClose}>
                <div className="glass-panel" style={{
                    width: '100%', maxWidth: '600px',
                    maxHeight: '90vh',
                    borderRadius: '16px', position: 'relative',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column',
                    backgroundColor: 'var(--bg-secondary)',
                    overflow: 'hidden'
                }} onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        borderBottom: '1px solid var(--glass-border)',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, transparent 100%)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
                                    {station.name}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, fontSize: '0.9rem' }}>
                                    <MapPin size={16} />
                                    <span>{station.address}</span>
                                </div>
                                {userLocation && station.lat && station.lng && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--color-active)' }}>
                                        <Navigation size={14} />
                                        <span>{station.distance?.toFixed(1) || 'N/A'}km away • ~{calculateTravelTime(station.distance)} min</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status Badges */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span className={`status-badge status-${station.status}`}>
                                {station.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                            </span>
                            {isVerified && (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(34, 197, 94, 0.2)',
                                    color: '#22c55e',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <CheckCircle size={12} /> Verified
                                </span>
                            )}
                            {isDisputed && (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <AlertTriangle size={12} /> Disputed
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                        {/* Price Section */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '12px',
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <TrendingUp size={16} />
                                Fuel Prices
                            </h3>
                            <PriceDisplay
                                prices={station.prices}
                                lastPriceUpdate={station.lastPriceUpdate}
                                compact={false}
                            />
                        </div>

                        {/* Last Updated */}
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.7 }}>
                                <Clock size={14} />
                                <span>Last updated {formatTimeAgo(station.lastUpdated)}</span>
                                {station.lastReporter && (
                                    <span>by {station.lastReporter}</span>
                                )}
                            </div>
                        </div>

                        {/* Community Verification */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#94a3b8' }}>
                                Community Verification
                            </h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => handleVerify('confirm')}
                                    disabled={hasConfirmed}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: hasConfirmed ? '1px solid #22c55e' : '1px solid var(--glass-border)',
                                        background: hasConfirmed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: hasConfirmed ? '#22c55e' : 'white',
                                        cursor: hasConfirmed ? 'default' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <ThumbsUp size={18} />
                                    <span>{hasConfirmed ? 'Confirmed' : 'Confirm'}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{confirmCount}</span>
                                </button>
                                <button
                                    onClick={() => handleVerify('flag')}
                                    disabled={hasFlagged}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: hasFlagged ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                                        background: hasFlagged ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: hasFlagged ? '#ef4444' : 'white',
                                        cursor: hasFlagged ? 'default' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <ThumbsDown size={18} />
                                    <span>{hasFlagged ? 'Flagged' : 'Flag'}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{flagCount}</span>
                                </button>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8' }}>
                                    <Star size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                    Reviews
                                </h3>
                                <button
                                    onClick={handleWriteReviewClick}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-active)',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: 'var(--color-active)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Write Review
                                </button>
                            </div>
                            <ReviewList stationId={station.id} />
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
