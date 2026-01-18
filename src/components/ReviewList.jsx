import React, { useEffect, useState } from 'react';
import { Star, Trash2, MessageSquare } from 'lucide-react';
import { subscribeToReviews, deleteReview } from '../services/reviewService';
import { formatTimeAgo } from '../services/stationService';

const ReviewList = ({ stationId, user }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToReviews(stationId, (data) => {
            setReviews(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [stationId]);

    const handleDelete = async (reviewId) => {
        if (confirm("Delete this review?")) {
            await deleteReview(stationId, reviewId);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
        : 0;

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>Loading reviews...</div>;

    return (
        <div style={{ padding: '0 20px 20px 20px' }}>
            {/* Header / Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '12px', textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', lineHeight: 1 }}>{averageRating}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={10} fill={i <= Math.round(averageRating) ? "white" : "none"} color="white" />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>User Reviews</h3>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Based on {reviews.length} opinions</p>
                </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', opacity: 0.5, border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                        <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p>No reviews yet. Be the first!</p>
                    </div>
                )}

                {reviews.map(review => (
                    <div key={review.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ fontWeight: '600' }}>{review.userName || 'Anonymous'}</div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} size={12} fill={i <= review.rating ? "#fbbf24" : "none"} color={i <= review.rating ? "#fbbf24" : "var(--glass-border)"} />
                                    ))}
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                {(() => {
                                    try {
                                        const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date();
                                        return formatTimeAgo(date.toISOString());
                                    } catch (e) {
                                        return 'Just now';
                                    }
                                })()}
                            </div>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', opacity: 0.9 }}>{review.text}</p>

                        {user && user.uid === review.userId && (
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px' }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewList;
