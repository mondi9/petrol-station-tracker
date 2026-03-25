import React, { useState, useMemo, useEffect } from 'react';
import { X, Download, Filter, MapPin, Fuel, Warehouse, BarChart2, Layout, Plus, Trash2, TrendingUp, Settings, Send, BookOpen, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { exportStationsToCSV, formatPrice, calculateDistance, calculateSavings, getTrafficAwareDistance, formatTravelTime } from '../services/stationService';
import { subscribeToDepots, addDepot, deleteDepot } from '../services/depotService';
import FleetAnalytics from './FleetAnalytics';
import AddDepotModal from './AddDepotModal';
import DispatchModal from './DispatchModal';
import FuelLedger from './FuelLedger';

const FleetDashboard = ({ stations, onClose }) => {
    const [mobileView, setMobileView] = useState('map'); // 'list' or 'map'
    const [filterType, setFilterType] = useState('all'); // 'all', 'diesel', 'petrol'
    const [searchQuery, setSearchQuery] = useState('');
    const [depots, setDepots] = useState([]);
    const [selectedDepot, setSelectedDepot] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [dispatchStation, setDispatchStation] = useState(null);

    // Optimizer Settings
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [tankSize, setTankSize] = useState(50); // Liters
    const [fuelConsumption, setFuelConsumption] = useState(15); // Liters per 100km (e.g. 15L/100km for a truck)
    const [trafficData, setTrafficData] = useState({}); // { stationId: { durationMins, distanceKm, text, trafficModel } }
    const [loadingTraffic, setLoadingTraffic] = useState(false);

    // Fetch Depots
    useEffect(() => {
        const unsubscribe = subscribeToDepots((fetchedDepots) => {
            setDepots(fetchedDepots);
            if (fetchedDepots.length > 0 && (!selectedDepot || !fetchedDepots.find(d => d.id === selectedDepot.id))) {
                setSelectedDepot(fetchedDepots[0]);
            }
        });
        return () => unsubscribe();
    }, [selectedDepot]);

    // Calculate Reference Price (Average of active stations)
    const referencePrice = useMemo(() => {
        const activePrices = stations
            .filter(s => s.status === 'active' && s.prices?.petrol)
            .map(s => s.prices.petrol);
        if (activePrices.length === 0) return 1000; // Fallback
        return activePrices.reduce((a, b) => a + b, 0) / activePrices.length;
    }, [stations]);

    // Filter Logic & Savings Calculation
    const filteredStations = useMemo(() => {
        if (!selectedDepot) return [];

        return stations.filter(s => {
            if (s.status === 'inactive') return false;

            // Search
            const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));

            // Type Filter
            let matchType = true;
            if (filterType === 'diesel') matchType = !!s.prices?.diesel;
            if (filterType === 'petrol') matchType = !!s.prices?.petrol;

            return matchSearch && matchType;
        }).map(s => {
            const dist = calculateDistance(selectedDepot.lat, selectedDepot.lng, s.lat, s.lng);

            // Calculate Savings if Petrol is available (Focus on PMS for now or switch based on filter?)
            // Let's assume PMS for simplicity or detect based on filter
            const targetPrice = filterType === 'diesel' ? s.prices?.diesel : s.prices?.petrol;
            let savingsData = null;

            if (targetPrice) {
                // Consumption is L/100km, so L/km = val / 100
                const consumptionPerKm = fuelConsumption / 100;
                savingsData = calculateSavings(targetPrice, referencePrice, dist, tankSize, consumptionPerKm);
            }

            return {
                ...s,
                distanceFromDepot: dist,
                savings: savingsData
            };
        }).sort((a, b) => {
            if (showOptimizer) {
                // Sort by Net Savings (High to Low)
                return (b.savings?.netSavings || -Infinity) - (a.savings?.netSavings || -Infinity);
            }
            // Default: Sort by Distance
            return (a.distanceFromDepot || Infinity) - (b.distanceFromDepot || Infinity);
        });
    }, [stations, searchQuery, filterType, selectedDepot, showOptimizer, tankSize, fuelConsumption, referencePrice]);

    // Fetch Traffic Data for Top 5 Stations
    useEffect(() => {
        if (!selectedDepot || filteredStations.length === 0) return;

        const fetchTraffic = async () => {
            setLoadingTraffic(true);
            const top5 = filteredStations.slice(0, 5);
            const newTrafficData = { ...trafficData };

            for (const station of top5) {
                // Only fetch if not already fetched for this depot move
                if (station.lat && station.lng && !newTrafficData[station.id]) {
                    const data = await getTrafficAwareDistance(
                        { lat: selectedDepot.lat, lng: selectedDepot.lng },
                        { lat: station.lat, lng: station.lng }
                    );
                    if (data) {
                        newTrafficData[station.id] = data;
                    }
                }
            }
            setTrafficData(newTrafficData);
            setLoadingTraffic(false);
        };

        const timer = setTimeout(fetchTraffic, 1000); // Debounce to allow sorting to settle
        return () => clearTimeout(timer);
    }, [selectedDepot?.id, filteredStations.slice(0, 5).map(s => s.id).join(',')]);

    const handleExport = () => {
        exportStationsToCSV(filteredStations);
    };

    const handleAddDepot = async (depotData) => {
        try {
            const newDepot = await addDepot(depotData);
            setSelectedDepot(newDepot);
        } catch (error) {
            console.error("Error adding depot:", error);
        }
    };

    const handleDeleteDepot = async () => {
        if (!selectedDepot) return;
        if (!window.confirm(`Are you sure you want to delete "${selectedDepot.name}" ? `)) return;

        try {
            await deleteDepot(selectedDepot.id);
            setSelectedDepot(null);
        } catch (error) {
            console.error("Error deleting depot:", error);
        }
    };

    return (
        <div className="fleet-dashboard">
            {/* Top Bar */}
            <div className="fleet-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                        onClick={onClose}
                        className="btn"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Home</span>
                    </button>

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
                                className={`btn ${mobileView === 'list' ? 'btn-primary' : ''} `}
                                onClick={() => setMobileView('list')}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: mobileView === 'list' ? 'var(--color-active)' : 'transparent', color: mobileView === 'list' ? 'black' : 'white', border: 'none', borderRadius: '6px' }}
                            >
                                List
                            </button>
                            <button
                                className={`btn ${mobileView === 'map' ? 'btn-primary' : ''} `}
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
                            <button
                                onClick={() => setActiveTab('ledger')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '6px 12px', border: 'none', borderRadius: '6px',
                                    background: activeTab === 'ledger' ? 'var(--color-active)' : 'transparent',
                                    color: activeTab === 'ledger' ? 'black' : 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                <BookOpen size={16} /> Ledger
                            </button>
                        </div>
                    </div>

                </div>

                <div className="fleet-controls w-full-mobile mt-2-mobile" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center', minWidth: '200px' }}>
                        <select
                            value={selectedDepot?.id || ''}
                            onChange={(e) => setSelectedDepot(depots.find(d => d.id === e.target.value))}
                            style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--glass-border)', flex: 1 }}
                        >
                            <option value="" disabled>{depots.length === 0 ? 'No Depots Found' : 'Select Depot'}</option>
                            {depots.map(d => <option key={d.id} value={d.id}>{"Depot: " + d.name}</option>)}
                        </select>

                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="btn"
                            style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa' }}
                            title="Add New Depot"
                        >
                            <Plus size={18} />
                        </button>

                        {selectedDepot && (
                            <button
                                onClick={handleDeleteDepot}
                                className="btn"
                                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171' }}
                                title="Delete Current Depot"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={`btn ${showOptimizer ? 'btn-primary' : ''} `}
                            onClick={() => setShowOptimizer(!showOptimizer)}
                            style={{
                                gap: '8px', border: '1px solid var(--glass-border)', padding: '8px 12px',
                                background: showOptimizer ? 'var(--color-active)' : 'rgba(255,255,255,0.05)',
                                color: showOptimizer ? 'black' : 'white'
                            }}
                            title="Toggle Cost Optimizer"
                        >
                            <TrendingUp size={16} /> <span className="hide-on-mobile">{showOptimizer ? 'Optimizer On' : 'Optimizer Off'}</span>
                        </button>

                        <button className="btn" onClick={handleExport} style={{ gap: '8px', background: '#10b981', border: 'none', color: 'white', padding: '8px' }} title="Export CSV">
                            <Download size={16} /> <span className="hide-on-mobile">Export</span>
                        </button>
                    </div>
                </div>

                {/* Optimizer Settings Panel */}
                {showOptimizer && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e',
                        borderRadius: '12px', padding: '16px', marginTop: '12px',
                        display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4ade80', fontWeight: 'bold' }}>
                            <Settings size={20} />
                            <span>Logistics Settings</span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Fleet Tank Size (L)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range" min="30" max="200" step="5"
                                        value={tankSize} onChange={(e) => setTankSize(parseInt(e.target.value))}
                                        style={{ accentColor: '#22c55e' }}
                                    />
                                    <strong>{tankSize}L</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', opacity: 0.8 }}>Consumption (L/100km)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range" min="5" max="40" step="1"
                                        value={fuelConsumption} onChange={(e) => setFuelConsumption(parseInt(e.target.value))}
                                        style={{ accentColor: '#22c55e' }}
                                    />
                                    <strong>{fuelConsumption}L</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.9rem', opacity: 0.8, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '16px' }}>
                            Ref Price: <strong>₦{Math.round(referencePrice)}</strong>/L
                        </div>
                    </div>
                )}
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
                    {!selectedDepot ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <Warehouse size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>No depot selected. Add or select a depot to see proximity rankings.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                                <tr>
                                    <th style={{ padding: '12px' }}>Station</th>
                                    <th className="hide-on-mobile" style={{ padding: '12px' }}>Dist.</th>
                                    <th style={{ padding: '12px' }}>Duration</th>
                                    {showOptimizer && <th style={{ padding: '12px', color: '#4ade80' }}>Net Savings</th>}
                                    <th style={{ padding: '12px' }}>Prices</th>
                                    <th style={{ padding: '12px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStations.map(station => (
                                    <tr key={station.id} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: showOptimizer && station.savings?.isProfitable && station === filteredStations[0] ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                            {station.name}
                                            {showOptimizer && station === filteredStations[0] && station.savings?.isProfitable && (
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#4ade80' }}>★ BEST ROI</span>
                                            )}
                                            <div className="show-on-mobile" style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 'normal', display: 'none' }}>
                                                {station.distanceFromDepot ? `${station.distanceFromDepot.toFixed(1)} km` : '-'}
                                            </div>
                                        </td>
                                        <td className="hide-on-mobile" style={{ padding: '12px' }}>
                                            {trafficData[station.id]?.distanceKm 
                                                ? `${trafficData[station.id].distanceKm.toFixed(1)} km` 
                                                : station.distanceFromDepot 
                                                    ? `${station.distanceFromDepot.toFixed(1)} km` 
                                                    : '-'}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {trafficData[station.id] ? (
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 'bold', color: trafficData[station.id].trafficModel ? '#60a5fa' : 'white' }}>
                                                        {trafficData[station.id].text}
                                                    </span>
                                                    {trafficData[station.id].trafficModel && (
                                                        <span style={{ fontSize: '0.7rem', color: '#60a5fa' }}>Live Traffic</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ opacity: 0.5 }}>-</span>
                                            )}
                                        </td>

                                        {/* Savings Column (Only when Optimizer ON) */}
                                        {showOptimizer && (
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>
                                                {station.savings ? (
                                                    <span style={{ color: station.savings.netSavings > 0 ? '#4ade80' : '#ef4444' }}>
                                                        {station.savings.netSavings > 0 ? '+' : ''}₦{Math.round(station.savings.netSavings).toLocaleString()}
                                                    </span>
                                                ) : '-'}
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 'normal' }}>
                                                    Cost: -₦{Math.round(station.savings?.travelCost || 0)}
                                                </div>
                                            </td>
                                        )}

                                        <td style={{ padding: '12px', gap: '8px' }}>
                                            {station.prices?.diesel && <div style={{ color: '#facc15', fontSize: '0.85rem' }}>AGO: {formatPrice(station.prices.diesel)}</div>}
                                            {station.prices?.petrol && <div style={{ color: '#4ade80', fontSize: '0.85rem' }}>PMS: {formatPrice(station.prices.petrol)}</div>}
                                        </td>

                                        {/* Dispatch Button */}
                                        <td style={{ padding: '8px' }}>
                                            <button
                                                onClick={() => setDispatchStation(station)}
                                                title="Dispatch driver to this station"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '7px 10px', borderRadius: '8px', border: 'none',
                                                    background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold',
                                                    whiteSpace: 'nowrap', transition: 'background 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.3)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
                                            >
                                                <Send size={13} />
                                                <span className="hide-on-mobile">Dispatch</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
                    ) : activeTab === 'ledger' ? (
                        <FuelLedger stations={stations} depot={selectedDepot} />
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
                            {selectedDepot && (
                                <Marker position={[selectedDepot.lat, selectedDepot.lng]}>
                                    <Popup>
                                        <strong>Depot: {selectedDepot.name}</strong><br />
                                        {selectedDepot.address}
                                    </Popup>
                                </Marker>
                            )}

                            {/* Stations */}
                            {filteredStations.map(station => (
                                station.lat && station.lng && (
                                    <Marker key={station.id} position={[station.lat, station.lng]}>
                                        <Popup>
                                            <strong>{station.name}</strong><br />
                                            Dist: {station.distanceFromDepot?.toFixed(1)}km<br />
                                            {showOptimizer && station.savings && (
                                                <div style={{ marginTop: '4px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                                                    <strong>Net Benefit: <span style={{ color: station.savings.netSavings > 0 ? 'green' : 'red' }}>
                                                        ₦{Math.round(station.savings.netSavings).toLocaleString()}
                                                    </span></strong>
                                                </div>
                                            )}
                                        </Popup>
                                    </Marker>
                                )
                            ))}
                        </MapContainer>
                    )}

                </div>
            </div>

            <AddDepotModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddDepot}
            />

            <DispatchModal
                isOpen={!!dispatchStation}
                onClose={() => setDispatchStation(null)}
                station={dispatchStation}
                depot={selectedDepot}
            />
        </div>
    );
};

export default FleetDashboard;
