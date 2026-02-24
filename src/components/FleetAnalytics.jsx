import React, { useMemo, useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, BarChart2, Activity } from 'lucide-react';
import { fetchMultiStationPriceHistory } from '../services/priceHistoryService';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '12px', fontSize: '0.8rem'
            }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{label}</p>
                {payload.map((entry, i) => (
                    <div key={i} style={{ color: entry.color, marginBottom: '2px' }}>
                        {entry.name}: <strong>₦{entry.value?.toLocaleString()}/L</strong>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const FleetAnalytics = ({ stations }) => {
    const [fuelFilter, setFuelFilter] = useState('petrol');
    const [historyData, setHistoryData] = useState([]);
    const [historyStationNames, setHistoryStationNames] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Load price history on mount and when fuel filter changes
    useEffect(() => {
        const activeStations = stations.filter(s => s.status === 'active' && s.prices?.[fuelFilter]);
        if (activeStations.length === 0) {
            setHistoryLoading(false);
            return;
        }

        setHistoryLoading(true);
        fetchMultiStationPriceHistory(activeStations, fuelFilter, 30)
            .then(({ chartData, stationNames }) => {
                setHistoryData(chartData);
                setHistoryStationNames(stationNames);
            })
            .finally(() => setHistoryLoading(false));
    }, [stations, fuelFilter]);

    // 1. Status Distribution
    const statusData = useMemo(() => {
        const active = stations.filter(s => s.status === 'active').length;
        const inactive = stations.filter(s => s.status !== 'active').length;
        return [
            { name: 'Active', value: active },
            { name: 'Inactive', value: inactive }
        ];
    }, [stations]);

    // 2. Current Price Comparison (Bar Chart)
    const priceComparisonData = useMemo(() => {
        return stations
            .filter(s => s.status === 'active' && s.prices?.[fuelFilter])
            .map(s => ({
                name: s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name,
                price: s.prices[fuelFilter]
            }))
            .sort((a, b) => a.price - b.price)
            .slice(0, 8); // Top 8
    }, [stations, fuelFilter]);

    // 3. Cheapest station
    const cheapestStation = priceComparisonData[0];
    const mostExpensive = priceComparisonData[priceComparisonData.length - 1];
    const priceDelta = cheapestStation && mostExpensive
        ? mostExpensive.price - cheapestStation.price : 0;

    // 4. Time to Fuel KPI
    const avgTimeToFuel = useMemo(() => {
        const active = stations.filter(s => s.status === 'active');
        if (active.length === 0) return 0;
        const totalQueue = active.reduce((acc, s) => {
            const mins = s.queueStatus === 'short' ? 5 : (s.queueStatus === 'mild' ? 15 : (s.queueStatus === 'long' ? 45 : 0));
            return acc + mins;
        }, 0);
        // Assuming an average 15 min drive for fleet ops across Lagos
        return Math.round((totalQueue / active.length) + 15);
    }, [stations]);

    const STATUS_COLORS = ['#22c55e', '#ef4444'];

    const noHistory = !historyLoading && historyData.length === 0;

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '24px', color: 'white' }}>

            {/* Header + Fuel Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ margin: 0, fontWeight: 'bold' }}>Fleet Analytics</h2>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
                    {['petrol', 'diesel'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFuelFilter(f)}
                            style={{
                                padding: '6px 16px', borderRadius: '6px', border: 'none',
                                background: fuelFilter === f ? 'var(--color-active)' : 'transparent',
                                color: fuelFilter === f ? 'black' : 'rgba(255,255,255,0.7)',
                                cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize'
                            }}
                        >
                            {f === 'petrol' ? '⛽ PMS' : '🚛 AGO'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Cheapest Station', value: cheapestStation ? `₦${cheapestStation.price}/L` : 'N/A', sub: cheapestStation?.name, color: '#22c55e' },
                    { label: 'Avg Time to Fuel', value: `${avgTimeToFuel}m`, sub: 'drive + avg queue', color: '#a855f7' },
                    { label: 'Price Spread', value: priceDelta ? `₦${priceDelta}/L` : 'N/A', sub: 'across active stations', color: '#f59e0b' },
                    { label: 'Active Stations', value: statusData[0]?.value || 0, sub: `of ${stations.length} total`, color: '#3b82f6' }
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px', padding: '16px'
                    }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '6px' }}>{kpi.label}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Price Trend Chart */}
                <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Activity size={18} color="#3b82f6" />
                        <h3 style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
                            {fuelFilter === 'petrol' ? 'PMS' : 'AGO'} Price Trend — Last 30 Days
                        </h3>
                    </div>

                    {historyLoading ? (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                            Loading history...
                        </div>
                    ) : noHistory ? (
                        <div style={{ height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}>
                            <TrendingUp size={40} style={{ marginBottom: '12px' }} />
                            <p style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                No price history yet.<br />
                                Trend data builds up as users submit price reports.
                            </p>
                        </div>
                    ) : (
                        <div style={{ height: '240px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickFormatter={v => `₦${v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '0.8rem', opacity: 0.7 }} />
                                    {historyStationNames.map((name, i) => (
                                        <Line
                                            key={name}
                                            type="monotone"
                                            dataKey={name}
                                            stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                            strokeWidth={2}
                                            dot={false}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Current Price Bar Chart */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <BarChart2 size={18} color="#22c55e" />
                        <h3 style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>Current Price Comparison</h3>
                    </div>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceComparisonData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                                <XAxis type="number" domain={['auto', 'auto']} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickFormatter={v => `₦${v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="price" fill="#22c55e" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Donut */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', opacity: 0.8 }}>Station Availability</h3>
                    <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData} cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={90}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {statusData.map((_, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem', opacity: 0.7 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetAnalytics;
