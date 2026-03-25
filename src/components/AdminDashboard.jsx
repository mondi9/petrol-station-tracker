import React from 'react';
import { X, Database, MapPin, AlertTriangle, User, ShieldCheck, BarChart2, Users, Activity, CheckCircle, Trash2, Clock, ThumbsUp, ThumbsDown, Info, Edit3 } from 'lucide-react';
import { getAllUsers } from '../services/userService';
import { getRecentActivity } from '../services/activityService';
import { approveCorrection, rejectCorrection, subscribeToAllPendingCorrections } from '../services/correctionService';
import AnalyticsPanel from './AnalyticsPanel';

const AdminDashboard = ({ 
    isOpen, 
    onClose, 
    onImport, 
    onFixAddresses, 
    onRestore, 
    onAddStation, 
    onGrantAdmin, 
    onUpdateMRS, 
    onGlobalPriceUpdate, 
    onCleanupDuplicates, 
    importStatus, 
    stations, 
    user 
}) => {
    if (!isOpen) return null;
    const [adminEmail, setAdminEmail] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('management'); // 'management' | 'analytics' | 'users' | 'activity' | 'corrections'
    const [allUsers, setAllUsers] = React.useState([]);
    const [activityLogs, setActivityLogs] = React.useState([]);
    const [pendingCorrections, setPendingCorrections] = React.useState([]);
    const [isLoadingData, setIsLoadingData] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;

        let unsubscribeCorrections = () => { };

        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'activity') {
            fetchActivity();
        } else if (activeTab === 'corrections') {
            setIsLoadingData(true);
            unsubscribeCorrections = subscribeToAllPendingCorrections((corrections) => {
                setPendingCorrections(corrections);
                setIsLoadingData(false);
            });
        }

        return () => {
            unsubscribeCorrections();
        };
    }, [activeTab, isOpen]);

    const fetchUsers = async () => {
        setIsLoadingData(true);
        try {
            const users = await getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchActivity = async () => {
        setIsLoadingData(true);
        try {
            const logs = await getRecentActivity(50);
            setActivityLogs(logs);
        } catch (error) {
            console.error("Failed to fetch activity logs", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleApproveCorrection = async (id) => {
        if (window.confirm('Approve this correction and update the station?')) {
            await approveCorrection(id, user.uid);
        }
    };

    const handleRejectCorrection = async (id) => {
        if (window.confirm('Reject this correction?')) {
            await rejectCorrection(id, user.uid);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Admin Dashboard</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <h3 style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} /> Admin: <strong>{user?.email}</strong>
                            </h3>
                        </div>
                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', gap: '4px', overflowX: 'auto', maxWidth: '100%' }}>
                            {[
                                { id: 'management', label: 'Data', icon: <Database size={14} /> },
                                { id: 'corrections', label: 'Corrections', icon: <Edit3 size={14} /> },
                                { id: 'users', label: 'Users', icon: <Users size={14} /> },
                                { id: 'activity', label: 'Activity', icon: <Activity size={14} /> },
                                { id: 'analytics', label: 'Stats', icon: <BarChart2 size={14} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: activeTab === tab.id ? 'var(--color-active)' : 'transparent',
                                        color: activeTab === tab.id ? 'black' : 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {activeTab === 'analytics' ? (
                    <AnalyticsPanel stations={stations} />
                ) : activeTab === 'corrections' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '350px' }}>
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Info size={16} /> Correction Queue ({pendingCorrections.length})
                                </div>
                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Community Peer Review</span>
                            </h3>

                            {isLoadingData ? (
                                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>Loading queue...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {pendingCorrections.map((corr) => (
                                        <div key={corr.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{corr.stationName}</div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Suggested by {corr.userEmail}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', color: '#22c55e', fontSize: '0.8rem', alignItems: 'center', gap: '4px', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                        <ThumbsUp size={12} /> {corr.upvotes?.length || 0}
                                                    </div>
                                                    <div style={{ display: 'flex', color: '#ef4444', fontSize: '0.8rem', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                        <ThumbsDown size={12} /> {corr.downvotes?.length || 0}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', opacity: 0.4, textTransform: 'uppercase' }}>Current {corr.field}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{corr.oldValue || 'None'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-active)', textTransform: 'uppercase' }}>Proposed {corr.field}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>{corr.newValue}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => handleApproveCorrection(corr.id)}
                                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    <CheckCircle size={16} /> Approve & Update
                                                </button>
                                                <button
                                                    onClick={() => handleRejectCorrection(corr.id)}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingCorrections.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <div style={{ marginBottom: '12px' }}><CheckCircle size={48} style={{ margin: '0 auto', opacity: 0.2 }} /></div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>Queue is Clear!</div>
                                            <p style={{ fontSize: '0.85rem' }}>No pending corrections awaiting review.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'users' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={16} /> Registered Users ({allUsers.length})
                            </h3>

                            {isLoadingData ? (
                                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>Loading users...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {allUsers.map((u) => (
                                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{u.displayName || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{u.email}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: u.role === 'admin' ? 'var(--color-active)' : 'white', textTransform: 'uppercase' }}>{u.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'activity' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '350px' }}>
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={16} /> Recent Activity ({activityLogs.length})
                            </h3>

                            {isLoadingData ? (
                                <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>Loading activity...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                    {activityLogs.map((log) => (
                                        <div key={log.id} style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold' }}>{log.email}</span>
                                                <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <div style={{ opacity: 0.6, fontSize: '0.7rem' }}>Platform: {log.platform}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>

                        {/* Data Management Section */}
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Database size={16} /> Data Management
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={onAddStation} className="btn btn-primary" style={{ justifyContent: 'center', background: 'var(--color-active)', color: 'black', padding: '8px 12px', fontSize: '0.85rem' }}>
                                    + Add New Station
                                </button>
                                <button onClick={onImport} className="btn btn-secondary" disabled={!!importStatus} style={{ justifyContent: 'center' }}>
                                    {importStatus?.includes("Fetching") ? importStatus : "Import Lagos Stations (OSM)"}
                                </button>
                                <button onClick={onFixAddresses} className="btn" style={{ background: '#f59e0b', color: 'black', justifyContent: 'center' }}>
                                    Fix Missing Addresses
                                </button>
                                <button onClick={onUpdateMRS} className="btn" style={{ background: 'var(--color-active)', color: 'black', justifyContent: 'center' }}>
                                    Sync Festac (Coords, Queue, Prices)
                                </button>
                                <button onClick={onCleanupDuplicates} className="btn" style={{ background: '#f43f5e', color: 'white', justifyContent: 'center' }}>
                                    Deep Cleanup (De-duplicate)
                                </button>
                                <button onClick={onGrantAdmin} style={{ display: 'none' }}></button> {/* for prop alignment if needed */}
                            </div>
                        </div>

                        {/* Admin Management Section */}
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={16} /> Manage Admins
                            </h3>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="email"
                                    placeholder="User Email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                                />
                                <button
                                    onClick={() => {
                                        if (adminEmail) {
                                            onGrantAdmin(adminEmail);
                                            setAdminEmail('');
                                        }
                                    }}
                                    className="btn"
                                    style={{ background: 'var(--color-active)', color: 'black', border: 'none', padding: '0 12px' }}
                                >
                                    Grant
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {importStatus && (
                    <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        &gt; {importStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
