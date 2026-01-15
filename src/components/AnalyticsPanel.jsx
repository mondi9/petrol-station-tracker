import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AnalyticsPanel = ({ stations }) => {
    // 1. Calculate Status Distribution
    const statusData = useMemo(() => {
        const counts = { active: 0, inactive: 0 };
        stations.forEach(s => {
            if (s.status === 'active') counts.active++;
            else counts.inactive++;
        });
        return [
            { name: 'Active', value: counts.active, color: '#22c55e' },
            { name: 'Inactive', value: counts.inactive, color: '#ef4444' }
        ];
    }, [stations]);

    // 2. Calculate Fuel Price Average (Active Stations Only)
    const priceData = useMemo(() => {
        let petrolSum = 0, petrolCount = 0;
        let dieselSum = 0, dieselCount = 0;

        stations.forEach(s => {
            if (s.prices?.petrol) {
                petrolSum += s.prices.petrol;
                petrolCount++;
            }
            if (s.prices?.diesel) {
                dieselSum += s.prices.diesel;
                dieselCount++;
            }
        });

        return [
            { name: 'Petrol (PMS)', price: petrolCount ? Math.round(petrolSum / petrolCount) : 0 },
            { name: 'Diesel (AGO)', price: dieselCount ? Math.round(dieselSum / dieselCount) : 0 },
        ];
    }, [stations]);

    return (
        <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 'bold' }}>Dashboard Overview</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Status Chart */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: 0.7 }}>Station Status Distribution</h3>
                    <div style={{ height: '250px', width: '100%' }}>
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
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: 'white' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Price Chart */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: 0.7 }}>Average Fuel Prices (₦)</h3>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceData}>
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} unit="₦" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#4ade80' }}
                                />
                                <Bar dataKey="price" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Simple Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '20px' }}>
                <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{stations.length}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Total Stations</div>
                </div>
                <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-active)' }}>
                        {stations.filter(s => s.status === 'active').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Active Now</div>
                </div>
                <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#facc15' }}>
                        {stations.filter(s => s.queueStatus === 'short').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Short Queues</div>
                </div>
                <div className="glass-panel" style={{ padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                        {stations.filter(s => s.prices?.gas).length}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Selling Gas</div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
