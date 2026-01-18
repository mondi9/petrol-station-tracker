import React, { useState, useMemo } from 'react';
import { X, Download, Filter, MapPin, Fuel, Warehouse, BarChart2, Layout } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { exportStationsToCSV, formatPrice, calculateDistance } from '../services/stationService';
import FleetAnalytics from './FleetAnalytics';

// Mock Depots
const MOCK_DEPOTS = [
    { id: 'd1', name: 'Apapa Depot', lat: 6.4453, lng: 3.3673 },
    { id: 'd2', name: 'Ikeja HQ', lat: 6.6018, lng: 3.3515 },
    { id: 'd3', name: 'Lekki Branch', lat: 6.4698, lng: 3.5852 }
];

const FleetDashboard = ({ stations, onClose }) => {
    const [mobileView, setMobileView] = useState('map'); // 'list' or 'map'
    const [filterType, setFilterType] = useState('all'); // 'all', 'diesel', 'petrol'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepot, setSelectedDepot] = useState(MOCK_DEPOTS[0]);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics'

    // Filter Logic
    const filteredStations = useMemo(() => {
        return stations.filter(s => {
            if (s.status === 'inactive') return false; // Hide inactive for fleet planning? Or keep? Let's hide.

            // Search
            const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.address.toLowerCase().includes(searchQuery.toLowerCase());

            // Type Filter
            let matchType = true;
            if (filterType === 'diesel') matchType = !!s.prices?.diesel;
            if (filterType === 'petrol') matchType = !!s.prices?.petrol;

            return matchSearch && matchType;
        }).map(s => ({
            ...s,
            distanceFromDepot: calculateDistance(selectedDepot.lat, selectedDepot.lng, s.lat, s.lng)
        })).sort((a, b) => (a.distanceFromDepot || Infinity) - (b.distanceFromDepot || Infinity));
    }, [stations, searchQuery, filterType, selectedDepot]);

    const handleExport = () => {
        exportStationsToCSV(filteredStations);
    };

    return (
        <div className="fleet-dashboard">
            {/* Top Bar */}
            <div className="fleet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#3b82f6', padding: '8px', borderRadius: '8px' }}>
                            <Warehouse size={20} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Fleet Command</h1>
                    </div>

                    <div className="fleet-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '2px', marginLeft: 'auto' }}>
                        {/* Mobile Only Toggles */}
                        <div className="show-on-mobile" style={{ display: 'none', gap: '4px' }}>
                            <button
                                className={`btn ${mobileView === 'list' ? 'btn-primary' : ''}`}
                                onClick={() => setMobileView('list')}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: mobileView === 'list' ? 'var(--color-active)' : 'transparent', color: mobileView === 'list' ? 'black' : 'white', border: 'none', borderRadius: '6px' }}
                            >
                                List
                            </button>
                            <button
                                className={`btn ${mobileView === 'map' ? 'btn-primary' : ''}`}
                                onClick={() => setMobileView('map')}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: mobileView === 'map' ? 'var(--color-active)' : 'transparent', color: mobileView === 'map' ? 'black' : 'white', border: 'none', borderRadius: '6px' }}
                            >
                                Map
                            </button>
                        </div>

                        {/* Desktop Tabs */}
                        <div className="hide-on-mobile" style={{ display: 'flex' }}>
                            <button
                                onClick={() => setActiveTab('overview')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', border: 'none', borderRadius: '6px',
                                    background: activeTab === 'overview' ? 'var(--color-active)' : 'transparent',
                                    color: activeTab === 'overview' ? 'black' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <Layout size={16} /> Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', border: 'none', borderRadius: '6px',
                                    background: activeTab === 'analytics' ? 'var(--color-active)' : 'transparent',
                                    color: activeTab === 'analytics' ? 'black' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <BarChart2 size={16} /> Analytics
                            </button>
                        </div>
                    </div>

                </div>

                <div className="fleet-controls w-full-mobile mt-2-mobile" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <select
                        value={selectedDepot.id}
                        onChange={(e) => setSelectedDepot(MOCK_DEPOTS.find(d => d.id === e.target.value))}
                        className="flex-1-mobile"
                        style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--glass-border)' }}
                    >
                        {MOCK_DEPOTS.map(d => <option key={d.id} value={d.id}>Depot: {d.name}</option>)}
                    </select>

                    <button className="btn" onClick={handleExport} style={{ gap: '8px', background: '#10b981', border: 'none', color: 'white', padding: '8px' }} title="Export CSV">
                        <Download size={16} /> <span className="hide-on-mobile">Export</span>
                    </button>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="fleet-content">
                {/* Left: Table */}
                <div className="fleet-sidebar" style={{
                    display: window.innerWidth <= 768 && mobileView !== 'list' ? 'none' : 'block'
                }}>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <input
                            type="text" placeholder="Search stations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'white', flex: 1, minWidth: '200px' }}
                        />
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', overflowX: 'auto' }}>
                            {['all', 'diesel', 'petrol'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    style={{
                                        padding: '6px 16px', borderRadius: '6px', border: 'none',
                                        background: filterType === type ? 'var(--color-active)' : 'transparent',
                                        color: filterType === type ? 'black' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer', textTransform: 'capitalize', fontWeight: 'bold'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <tr>
                                <th style={{ padding: '12px' }}>Station</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th className="hide-on-mobile" style={{ padding: '12px' }}>Dist.</th>
                                <th style={{ padding: '12px' }}>Queue</th>
                                <th className="hide-on-mobile" style={{ padding: '12px' }}>Prices</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStations.map(station => (
                                <tr key={station.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                        {station.name}
                                        <div className="show-on-mobile" style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 'normal', display: 'none' }}>
                                            {station.distanceFromDepot ? `${station.distanceFromDepot.toFixed(1)} km` : '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-badge status-${station.status}`}>{station.status}</span>
                                    </td>
                                    <td className="hide-on-mobile" style={{ padding: '12px' }}>
                                        {station.distanceFromDepot ? `${station.distanceFromDepot.toFixed(1)} km` : '-'}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {station.queueStatus === 'long' ? (
                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>HIGH</span>
                                        ) : station.queueStatus || '-'}
                                    </td>
                                    <td className="hide-on-mobile" style={{ padding: '12px', gap: '8px' }}>
                                        {station.prices?.diesel && <span style={{ color: '#facc15' }}>AGO: {formatPrice(station.prices.diesel)}</span>}
                                        {station.prices?.petrol && <span style={{ color: '#4ade80' }}>PMS: {formatPrice(station.prices.petrol)}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right: Map or Analytics */}
                <div className="fleet-map-area" style={{
                    flex: 1,
                    minHeight: '400px',
                    height: '100%',
                    position: 'relative',
                    display: window.innerWidth <= 768 && mobileView !== 'map' ? 'none' : 'block'
                }}>

                    {activeTab === 'analytics' ? (
                        <FleetAnalytics stations={stations} />
                    ) : (
                        <MapContainer
                            center={[6.5244, 3.3792]}
                            zoom={11}
                            style={{ height: '100%', width: '100%' }}
                            attributionControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />

                            {/* Depot Marker */}
                            <Marker position={[selectedDepot.lat, selectedDepot.lng]}>
                                <Popup>
                                    <strong>Depot: {selectedDepot.name}</strong>
                                </Popup>
                            </Marker>

                            {/* Stations */}
                            {filteredStations.map(station => (
                                station.lat && station.lng && (
                                    <Marker key={station.id} position={[station.lat, station.lng]}>
                                        <Popup>
                                            <strong>{station.name}</strong><br />
                                            Dist: {station.distanceFromDepot?.toFixed(1)}km
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FleetDashboard;
