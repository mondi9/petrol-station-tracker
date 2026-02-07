import React, { useState, useEffect } from 'react';
import { X, User, Edit2, Check, Award, MessageSquare, Activity, Bell } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import AlertsList from './AlertsList';
import { getActiveAlertCount } from '../services/alertService';
import { useTheme } from '../context/ThemeContext';
import { getUserReports, getUserReviews } from '../services/statsService';
import { formatTimeAgo, formatPrice, getStatusColor } from '../services/stationService';

const UserProfileModal = ({ isOpen, onClose, user, stats = { contributions: 0, reviews: 0 }, stations = [] }) => {
    const { theme, toggleTheme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'alerts'
    const [alertCount, setAlertCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // History State
    const [historyType, setHistoryType] = useState('none'); // 'none' | 'reports' | 'reviews'
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const getStationName = (id) => {
        const s = stations.find(s => s.id === id);
        return s ? s.name : 'Unknown Station';
    };

    const handleShowHistory = async (type) => {
        setHistoryType(type);
        setLoadingHistory(true);
        try {
            const data = type === 'reports'
                ? await getUserReports(user.uid)
                : await getUserReviews(user.uid);
            setHistoryData(data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleBackToProfile = () => {
        setHistoryType('none');
        setHistoryData([]);
    };

    // Fetch alert count
    useEffect(() => {
        if (user && isOpen) {
            getActiveAlertCount(user.uid).then(setAlertCount);
        }
    }, [user, isOpen]);

    // Early return AFTER all hooks
    if (!isOpen || !user) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile(user, { displayName });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div className="glass-panel" style={{
                width: 'calc(100% - 32px)', maxWidth: '400px',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden',
                maxHeight: '80vh',
                animation: 'slideUp 0.3s ease-out',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {historyType !== 'none' && (
                            <button onClick={handleBackToProfile} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginRight: '8px' }}>
                                ←
                            </button>
                        )}
                        <User size={20} /> {historyType === 'reports' ? 'My Reports' : historyType === 'reviews' ? 'My Reviews' : 'User Profile'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '50%',
                                width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s'
                            }}
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    borderBottom: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                    display: historyType === 'none' ? 'flex' : 'none'
                }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: activeTab === 'profile' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'profile' ? '2px solid #22c55e' : '2px solid transparent',
                            color: activeTab === 'profile' ? '#22c55e' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <User size={16} />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: activeTab === 'alerts' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'alerts' ? '2px solid #22c55e' : '2px solid transparent',
                            color: activeTab === 'alerts' ? '#22c55e' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        <Bell size={16} />
                        My Alerts
                        {alertCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '6px',
                                right: '20px',
                                background: '#22c55e',
                                color: '#000',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                minWidth: '18px',
                                textAlign: 'center'
                            }}>
                                {alertCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', overflowY: 'auto', flex: 1 }}>

                    {historyType !== 'none' ? (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {loadingHistory ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading history...</div>
                            ) : historyData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No history found.</div>
                            ) : (
                                historyData.map(item => (
                                    <div key={item.id} style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 'bold' }}>{getStationName(item.stationId)}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTimeAgo(item.timestamp)}</span>
                                        </div>

                                        {historyType === 'reports' ? (
                                            <div style={{ fontSize: '0.9rem', display: 'flex', gap: '8px' }}>
                                                <span style={{ color: item.availability === 'empty' ? '#ef4444' : '#10b981' }}>
                                                    {item.availability === 'empty' ? 'No Fuel' : 'Available'}
                                                </span>
                                                {item.fuelType && <span style={{ opacity: 0.7 }}>• {item.fuelType}</span>}
                                                {item.price && <span style={{ opacity: 0.7 }}>• {formatPrice(item.price)}</span>}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.9rem' }}>
                                                <div style={{ color: '#f59e0b', marginBottom: '4px' }}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</div>
                                                <div style={{ opacity: 0.8 }}>{item.comment}</div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : activeTab === 'profile' && (
                        <>
                            {/* Avatar Circle */}
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem', fontWeight: 'bold', border: '4px solid rgba(255,255,255,0.1)'
                            }}>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    (displayName || user.email || '?')[0].toUpperCase()
                                )}
                            </div>

                            {/* Name & Email */}
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Enter your name"
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                                background: 'rgba(255,255,255,0.05)', color: 'white', width: '70%'
                                            }}
                                        />
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            style={{
                                                background: '#10b981', border: 'none', borderRadius: '8px', padding: '8px',
                                                cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center'
                                            }}
                                        >
                                            <Check size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                        <h3 style={{ fontSize: '1.4rem', margin: 0 }}>
                                            {displayName || 'Anonymous User'}
                                        </h3>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                                <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>{user.email}</p>
                            </div>

                            {/* Stats Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                                <button onClick={() => handleShowHistory('reports')} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid transparent', cursor: 'pointer', color: 'inherit', transition: 'background 0.2s' }} className="hover-glass">
                                    <Activity size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.contributions}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reports</div>
                                </button>
                                <button onClick={() => handleShowHistory('reviews')} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid transparent', cursor: 'pointer', color: 'inherit', transition: 'background 0.2s' }} className="hover-glass">
                                    <MessageSquare size={24} color="#3b82f6" style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.reviews}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reviews</div>
                                </button>
                            </div>

                            {/* Badges (Placeholder) */}
                            <div style={{ width: '100%' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Achievements</h4>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div title="Early Adopter" style={{
                                        padding: '8px', background: 'rgba(255,215,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.3)',
                                        color: '#ffd700', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem'
                                    }}>
                                        <Award size={16} />
                                        <span>Early Adopter</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'alerts' && (
                        <div style={{ width: '100%' }}>
                            <AlertsList user={user} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
