import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FleetAnalytics = ({ stations }) => {

    // 1. Status Distribution
    const statusData = useMemo(() => {
        const active = stations.filter(s => s.status === 'active').length;
        const inactive = stations.filter(s => s.status !== 'active').length;
        return [
            { name: 'Active', value: active },
            { name: 'Inactive', value: inactive }
        ];
    }, [stations]);

    // 2. Average Prices (Mock simulation for trend if no history, but here just current avg)
    // To show "Trend", we'd need historical data. For now, let's show "Average Price by Region" (simulated by finding clusters or just overall avg)
    // Or simpler: Price Distribution Histogram? 
    // Let's do: Average Price per Fuel Type
    const priceData = useMemo(() => {
        const petrolPrices = stations.map(s => s.prices?.petrol).filter(p => p > 0);
        const dieselPrices = stations.map(s => s.prices?.diesel).filter(p => p > 0);

        const avgPetrol = petrolPrices.length ? petrolPrices.reduce((a, b) => a + b, 0) / petrolPrices.length : 0;
        const avgDiesel = dieselPrices.length ? dieselPrices.reduce((a, b) => a + b, 0) / dieselPrices.length : 0;

        return [
            { name: 'PMS (Petrol)', price: Math.round(avgPetrol) },
            { name: 'AGO (Diesel)', price: Math.round(avgDiesel) }
        ];
    }, [stations]);

    const COLORS = ['#22c55e', '#ef4444']; // Active, Inactive

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '24px', color: 'white' }}>
            <h2 style={{ marginBottom: '24px' }}>Fleet Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Status Chart */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Station Availability</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#333', border: 'none', borderRadius: '8px' }} itemStyle={{ color: 'white' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Price Chart */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Average Fuel Prices (₦)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#333', border: 'none', borderRadius: '8px', color: 'white' }} />
                                <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                <h3>Quick Insights</h3>
                <ul style={{ marginTop: '12px', opacity: 0.8, lineHeight: '1.6' }}>
                    <li><strong>{statusData[0].value}</strong> stations are currently active and reporting data.</li>
                    <li>Average Petrol price is <strong>₦{priceData[0].price}</strong> across all stations.</li>
                    <li>Diesel availability is at <strong>{stations.filter(s => s.prices?.diesel).length}</strong> locations.</li>
                </ul>
            </div>
        </div>
    );
};

export default FleetAnalytics;
