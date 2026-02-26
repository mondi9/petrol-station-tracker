import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Navigation, Star, TrendingUp, Bell, Camera, ShieldCheck, CheckCircle, AlertTriangle, ThumbsUp, ThumbsDown, Edit3, Info } from 'lucide-react';
import ReviewList from './ReviewList';
import AddReviewModal from './AddReviewModal';
import PriceDisplay from './PriceDisplay';
import PriceAlertModal from './PriceAlertModal';
import AddCorrectionModal from './AddCorrectionModal';
import { addReview } from '../services/reviewService';
import { formatTimeAgo, calculateTravelTime, verifyStation, verifyPrice, subscribeToStationPhotos } from '../services/stationService';
import { submitCorrection, voteCorrection, subscribeToStationCorrections } from '../services/correctionService';

const StationDetailsModal = ({ isOpen, onClose, station, user, onLoginRequest, userLocation, onNavigate }) => {
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [corrections, setCorrections] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    useEffect(() => {
        if (isOpen && station?.id) {
            const unsubscribePhotos = subscribeToStationPhotos(station.id, (newPhotos) => {
                setPhotos(newPhotos);
            });
            const unsubscribeCorrections = subscribeToStationCorrections(station.id, (newCorrections) => {
                setCorrections(newCorrections);
            });
            return () => {
                unsubscribePhotos();
                unsubscribeCorrections();
            };
        }
    }, [isOpen, station?.id]);

    if (!isOpen) return null;

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

    const handleVerifyPrice = async (fuelType) => {
        if (!user) {
            onLoginRequest();
            return;
        }
        await verifyPrice(station.id, fuelType, user.uid);
    };

    const handleSubmitCorrection = async (data) => {
        await submitCorrection(station.id, station.name, data, user);
    };

    const handleVoteCorrection = async (correctionId, type) => {
        if (!user) {
            onLoginRequest();
            return;
        }
        await voteCorrection(correctionId, user.uid, type);
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
                                {userLocation && station.lat !== undefined && station.lng !== undefined && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--color-active)' }}>
                                        <Navigation size={14} />
                                        <span>{(station.distance !== undefined && station.distance !== null) ? station.distance.toFixed(1) : 'N/A'}km away • ~{calculateTravelTime(station.distance)} min</span>
                                    </div>
                                )}
                                {station.lastComment && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                            Latest Insight from the Street
                                        </h4>
                                        <p style={{ fontSize: '0.9rem', color: 'white', fontStyle: 'italic', margin: 0 }}>
                                            "{station.lastComment}"
                                        </p>
                                        <div style={{ marginTop: '8px', fontSize: '0.7rem', opacity: 0.6 }}>
                                            Reported by {station.lastReporter || 'Anonymous'} {station.trustLevel === 'verified-fresh' && '🛡️'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={onClose} aria-label="Close station details" style={{
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
                            <span className={`status-badge status-${station.status}`}
                                title={station.status === 'active'
                                    ? "Recent reports confirm pumps are dispensing fuel."
                                    : "Community members on-site report pumps are dry."}
                                style={{
                                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'
                                }}
                            >
                                {station.status === 'active'
                                    ? (station.trustLevel === 'mixed-reports' ? 'Mixed Reports ⚠️' : 'Active')
                                    : 'Inactive'}
                            </span>
                            {station.trustLevel === 'verified-fresh' && (
                                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ✨ Verified Fresh
                                </span>
                            )}
                            <span style={{ fontSize: '0.8rem', opacity: 0.6, color: 'white' }}>Updated {formatTimeAgo(station.lastUpdated)}</span>
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

                    {/* Pending Corrections Alert */}
                    {corrections.length > 0 && (
                        <div style={{
                            margin: '16px 20px 0',
                            padding: '12px 16px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <Info size={16} />
                                <span>Pending Community Corrections ({corrections.length})</span>
                            </div>
                            {corrections.map(corr => (
                                <div key={corr.id} style={{
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', color: '#94a3b8' }}>
                                            Suggested {corr.field}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>
                                            {corr.newValue}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleVoteCorrection(corr.id, 'up')}
                                            style={{
                                                background: corr.upvotes?.includes(user?.uid) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '6px',
                                                padding: '4px 8px',
                                                color: corr.upvotes?.includes(user?.uid) ? '#22c55e' : 'white',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                                            }}
                                        >
                                            <ThumbsUp size={14} />
                                            {corr.upvotes?.length || 0}
                                        </button>
                                        <button
                                            onClick={() => handleVoteCorrection(corr.id, 'down')}
                                            style={{
                                                background: corr.downvotes?.includes(user?.uid) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '6px',
                                                padding: '4px 8px',
                                                color: corr.downvotes?.includes(user?.uid) ? '#ef4444' : 'white',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem'
                                            }}
                                        >
                                            <ThumbsDown size={14} />
                                            {corr.downvotes?.length || 0}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                        {/* Price Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    margin: 0,
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
                                <button
                                    onClick={() => user ? setIsAlertOpen(true) : onLoginRequest()}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(34, 197, 94, 0.5)',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: '#22c55e',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Bell size={14} />
                                    Set Alert
                                </button>
                            </div>
                            <PriceDisplay
                                prices={station.prices}
                                lastPriceUpdate={station.lastPriceUpdate}
                                compact={false}
                                onVerify={handleVerifyPrice}
                                verifications={station.verifications}
                            />
                        </div>

                        {/* Last Updated Action Bar */}
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.85rem'
                        }}>
                            <Clock size={14} color="#94a3b8" />
                            <span style={{ opacity: 0.7, color: 'white' }}>Updated {formatTimeAgo(station.lastUpdated)}</span>
                            {station.lastReporter && (
                                <span style={{ opacity: 0.7, color: 'white' }}>by {station.lastReporter}</span>
                            )}
                            <button
                                onClick={() => user ? setIsCorrectionOpen(true) : onLoginRequest()}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-active)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: '600'
                                }}
                            >
                                <Edit3 size={12} />
                                Suggest Correction
                            </button>
                        </div>

                        {/* Community Verification */}
                        <div style={{ marginBottom: '24px' }}>
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
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem'
                                    }}
                                >
                                    <ThumbsUp size={18} />
                                    <span>{hasConfirmed ? 'Confirmed' : 'Verify Availability'}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{confirmCount} upvotes</span>
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
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem'
                                    }}
                                >
                                    <ThumbsDown size={18} />
                                    <span>{hasFlagged ? 'Flagged Dry' : 'Report Dry'}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{flagCount} downvotes</span>
                                </button>
                            </div>
                        </div>

                        {/* Directions */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: '#94a3b8' }}>
                                Get Directions
                            </h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => onNavigate(station, 'google')}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        border: '1px solid var(--color-active)',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        color: 'var(--color-active)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600'
                                    }}
                                >
                                    <MapPin size={18} /> Google Maps
                                </button>
                                <button
                                    onClick={() => onNavigate(station, 'waze')}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        border: '1px solid #33b1ff',
                                        background: 'rgba(51, 177, 255, 0.1)',
                                        color: '#33b1ff',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600'
                                    }}
                                >
                                    <Navigation size={18} /> Waze
                                </button>
                            </div>
                        </div>

                        {/* Photo Evidence */}
                        {photos.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Camera size={16} /> Evidence ({photos.length})
                                </h3>
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {photos.map((photo) => (
                                        <div
                                            key={photo.id}
                                            onClick={() => setSelectedPhoto(photo)}
                                            style={{
                                                flex: '0 0 140px', height: '140px', borderRadius: '12px', overflow: 'hidden',
                                                position: 'relative', border: '1px solid var(--glass-border)', cursor: 'pointer'
                                            }}
                                        >
                                            <img src={photo.thumbUrl || photo.url} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {photo.isVerified && (
                                                <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                    <ShieldCheck size={10} /> VERIFIED
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8' }}>
                                    <Star size={16} style={{ display: 'inline', marginRight: '6px' }} /> Reviews
                                </h3>
                                <button
                                    onClick={handleWriteReviewClick}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-active)',
                                        background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-active)',
                                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
                                    }}
                                >
                                    Write Review
                                </button>
                            </div>
                            <ReviewList stationId={station.id} />
                        </div>
                    </div>
                </div>

                {/* Full Screen Photo View */}
                {selectedPhoto && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 4000,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px'
                    }} onClick={() => setSelectedPhoto(null)}>
                        <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={24} color="black" />
                        </button>
                        <img src={selectedPhoto.url} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '2px solid white', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
                        <div style={{ color: 'white', marginTop: '20px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                                <Camera size={20} /> <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Report by {selectedPhoto.reporterName}</span>
                            </div>
                            <p style={{ opacity: 0.7 }}>Captured {new Date(selectedPhoto.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            <AddReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={handleAddReview}
                stationName={station.name}
            />

            <PriceAlertModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                station={station}
                user={user}
                onSuccess={() => console.log('Alert created successfully')}
            />

            <AddCorrectionModal
                isOpen={isCorrectionOpen}
                onClose={() => setIsCorrectionOpen(false)}
                onSubmit={handleSubmitCorrection}
                station={station}
            />
        </>
    );
};

export default StationDetailsModal;
