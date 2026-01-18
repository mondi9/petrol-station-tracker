import React, { useState } from 'react';
import { X, MapPin, Clock, Navigation, Star } from 'lucide-react';
import ReviewList from './ReviewList';
import AddReviewModal from './AddReviewModal';
import { addReview } from '../services/reviewService';
import { formatTimeAgo, formatPrice, verifyStation, calculateTravelTime } from '../services/stationService';
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
    // Check if current user has already voted
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
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                zIndex: 1000, backdropFilter: 'blur(3px)'
            }} onClick={onClose}>
                <div className="glass-panel" style={{
                    width: '100%', maxWidth: '600px',
                    height: '50vh', // Reduced height for safety
                    borderRadius: '16px', position: 'relative',
                    border: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    margin: '10px'
                }} onClick={e => e.stopPropagation()}>
                    <h2 style={{ color: 'white' }}>Debug Mode</h2>
                    <p style={{ color: 'white' }}>If you see this, the crash is in the UI code.</p>
                    <button onClick={onClose} style={{ padding: '10px', marginTop: '20px' }}>Close</button>
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
