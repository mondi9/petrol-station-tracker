import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { subscribeToUserAlerts, deleteAlert } from '../services/alertService';
import { formatTimeAgo } from '../services/stationService';

const AlertsList = ({ user }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setAlerts([]);
            setLoading(false);
            return;
        }

        // Subscribe to real-time alerts
        const unsubscribe = subscribeToUserAlerts(user.uid, (userAlerts) => {
            setAlerts(userAlerts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (alertId) => {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                await deleteAlert(alertId);
            } catch (error) {
                alert('Failed to delete alert. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>
                Loading alerts...
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)'
            }}>
                <Bell size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>
                    No Price Alerts
                </h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '16px' }}>
                    Create an alert to get notified when fuel prices drop!
                </p>
                <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                    💡 Tip: Open any station and click "Set Price Alert"
                </p>
            </div>
        );
    }

    // Separate active and triggered alerts
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
                <div>
                    <h3 style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Active Alerts ({activeAlerts.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeAlerts.map(alert => (
                            <div key={alert.id} className="glass" style={{
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                background: 'rgba(34, 197, 94, 0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                gap: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <Bell size={16} style={{ color: '#22c55e' }} />
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
                                            {alert.stationName}
                                        </h4>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.1)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {alert.fuelType}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <DollarSign size={12} />
                                            Target: ₦{alert.targetPrice}
                                        </span>
                                        <span style={{ opacity: 0.6 }}>
                                            Current: ₦{alert.currentPrice}
                                        </span>
                                    </div>
                                    <div style={{
                                        marginTop: '6px',
                                        fontSize: '0.75rem',
                                        opacity: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={12} />
                                        Created {formatTimeAgo(alert.createdAt)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(alert.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Delete alert"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
                <div>
                    <h3 style={{
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Triggered Alerts ({triggeredAlerts.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {triggeredAlerts.map(alert => (
                            <div key={alert.id} className="glass" style={{
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(100, 116, 139, 0.3)',
                                background: 'rgba(100, 116, 139, 0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'start',
                                gap: '12px',
                                opacity: 0.7
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <CheckCircle size={16} style={{ color: '#22c55e' }} />
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
                                            {alert.stationName}
                                        </h4>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            color: '#22c55e',
                                            fontWeight: '600'
                                        }}>
                                            TRIGGERED
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: 'rgba(255,255,255,0.1)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {alert.fuelType}
                                        </span>
                                        <span>Target: ₦{alert.targetPrice}</span>
                                    </div>
                                    <div style={{
                                        marginTop: '6px',
                                        fontSize: '0.75rem',
                                        opacity: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={12} />
                                        Triggered {formatTimeAgo(alert.triggeredAt)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(alert.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Delete alert"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsList;
