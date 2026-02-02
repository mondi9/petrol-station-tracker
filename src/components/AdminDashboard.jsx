import React from 'react';
import { X, Database, MapPin, AlertTriangle, User, ShieldCheck, BarChart2 } from 'lucide-react';
import AnalyticsPanel from './AnalyticsPanel';

const AdminDashboard = ({ isOpen, onClose, onImport, onFixAddresses, onRestore, onAddStation, onGrantAdmin, onUpdateMRS, importStatus, stations, user }) => {
    if (!isOpen) return null;
    const [adminEmail, setAdminEmail] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('management'); // 'management' | 'analytics'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Admin Dashboard</h2>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ marginBottom: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} /> Admin Status
                            </h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                Logged in as: <strong>{user?.email}</strong>
                            </p>
                        </div>
                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                            <button
                                onClick={() => setActiveTab('management')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: activeTab === 'management' ? 'var(--color-active)' : 'transparent',
                                    color: activeTab === 'management' ? 'black' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Management
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: activeTab === 'analytics' ? 'var(--color-active)' : 'transparent',
                                    color: activeTab === 'analytics' ? 'black' : 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <BarChart2 size={14} /> Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'analytics' ? (
                    <AnalyticsPanel stations={stations} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>

                        {/* Data Management Section */}
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Database size={16} /> Data Management
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={onAddStation}
                                    className="btn btn-primary"
                                    style={{ justifyContent: 'center', background: 'var(--color-active)', color: 'black', padding: '8px 12px', fontSize: '0.85rem' }}
                                >
                                    + Add New Station
                                </button>

                                <button
                                    onClick={onImport}
                                    className="btn btn-secondary"
                                    disabled={!!importStatus}
                                    style={{ justifyContent: 'center' }}
                                >
                                    {importStatus && importStatus.includes("Fetching") ? importStatus : "Import Lagos Stations (OSM v3)"}
                                </button>
                                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '-8px' }}>
                                    Fetches real data from OpenStreetMap. Warning: Can create duplicates if not careful.
                                </p>

                                <button
                                    onClick={onRestore}
                                    className="btn"
                                    style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', justifyContent: 'center' }}
                                >
                                    Restore Manual Stations
                                </button>
                                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '-8px' }}>
                                    Re-adds the 12 curated/manual stations (Festac, etc).
                                </p>
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
                                    style={{ background: 'var(--color-active)', color: 'black', border: 'none', cursor: 'pointer', padding: '0 12px' }}
                                >
                                    Grant
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                Enter the email of an EXISTING user to grant them Admin privileges. They must re-login to see changes.
                            </p>
                        </div>

                        {/* Maintenance Section */}
                        <div className="glass" style={{ padding: '12px', borderRadius: '6px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertTriangle size={16} /> Maintenance
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={onFixAddresses}
                                    className="btn btn-secondary"
                                    disabled={importStatus && importStatus.includes("...")}
                                    style={{
                                        background: '#f59e0b',
                                        color: 'black',
                                        justifyContent: 'center',
                                        width: '100%'
                                    }}
                                >
                                    {importStatus && importStatus.includes("Enhancing") ? importStatus : "Fix Missing Addresses"}
                                </button>

                                <button
                                    onClick={onUpdateMRS}
                                    className="btn"
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'white',
                                        justifyContent: 'center',
                                        width: '100%'
                                    }}
                                >
                                    Sync Festac Cluster Coords
                                </button>
                            </div>

                            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>
                                Maintenance tools to fix data inconsistencies. The Sync button moves MRS Festac and AP to their correct physical locations.
                            </p>
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
