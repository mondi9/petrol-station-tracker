import React from 'react';
import { X, Database, MapPin, AlertTriangle, User, ShieldCheck, BarChart2 } from 'lucide-react';
import AnalyticsPanel from './AnalyticsPanel';

const AdminDashboard = ({ isOpen, onClose, onImport, onFixAddresses, onRestore, onAddStation, onGrantAdmin, importStatus, stations, user }) => {
    if (!isOpen) return null;
    const [adminEmail, setAdminEmail] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('management'); // 'management' | 'analytics'

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Admin Dashboard</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} /> Admin Status
                            </h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

                        {/* Data Management Section */}
                        <div className="glass" style={{ padding: '16px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={18} /> Data Management
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={onAddStation}
                                    className="btn btn-primary"
                                    style={{ justifyContent: 'center', background: 'var(--color-active)', color: 'black' }}
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
                        <div className="glass" style={{ padding: '16px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={18} /> Manage Admins
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
                        <div className="glass" style={{ padding: '16px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} /> Maintenance
                            </h3>

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
                            <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '4px' }}>
                                Scans for stations with missing addresses and uses Reverse Geocoding to fix them.
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
