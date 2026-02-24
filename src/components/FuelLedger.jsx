import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, BookOpen, Fuel, TrendingDown, DollarSign, X, CheckCircle } from 'lucide-react';
import { addLedgerEntry, subscribeToLedger, deleteLedgerEntry } from '../services/fuelLedgerService';

// ── Add Entry Modal ──────────────────────────────────────────────────────────
const AddEntryModal = ({ isOpen, onClose, onSubmit, stations, depot }) => {
    const [form, setForm] = useState({
        stationId: '',
        stationName: '',
        fuelType: 'petrol',
        litres: '',
        pricePerLitre: '',
        driverName: '',
        vehicleId: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    if (!isOpen) return null;

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleStationChange = (id) => {
        const station = stations.find(s => s.id === id);
        set('stationId', id);
        set('stationName', station?.name || '');
        if (station?.prices?.[form.fuelType]) {
            set('pricePerLitre', station.prices[form.fuelType]);
        }
    };

    const handleFuelTypeChange = (ft) => {
        set('fuelType', ft);
        if (form.stationId) {
            const station = stations.find(s => s.id === form.stationId);
            if (station?.prices?.[ft]) set('pricePerLitre', station.prices[ft]);
        }
    };

    const totalCost = form.litres && form.pricePerLitre
        ? (parseFloat(form.litres) * parseFloat(form.pricePerLitre)).toFixed(0)
        : null;

    const handleSubmit = async () => {
        if (!form.stationName || !form.litres || !form.pricePerLitre) return;
        setLoading(true);
        await onSubmit({
            ...form,
            litres: parseFloat(form.litres),
            pricePerLitre: parseFloat(form.pricePerLitre),
            depotId: depot?.id || null,
            depotName: depot?.name || null
        });
        setLoading(false);
        setDone(true);
        setTimeout(() => { setDone(false); onClose(); setForm({ stationId: '', stationName: '', fuelType: 'petrol', litres: '', pricePerLitre: '', driverName: '', vehicleId: '', notes: '' }); }, 1200);
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
    };
    const labelStyle = { fontSize: '0.78rem', opacity: 0.55, display: 'block', marginBottom: '5px' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1a1f2e, #111827)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: '10px', padding: '8px' }}>
                            <Fuel size={18} color="#4ade80" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Log Fill-Up</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.45 }}>{depot ? depot.name : 'All Depots'}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                {/* Station picker */}
                <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Station</label>
                    <select value={form.stationId} onChange={e => handleStationChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">— Select a station —</option>
                        {stations.filter(s => s.status === 'active').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="__custom">Other (type below)</option>
                    </select>
                    {form.stationId === '__custom' && (
                        <input placeholder="Station name" value={form.stationName} onChange={e => set('stationName', e.target.value)} style={{ ...inputStyle, marginTop: '8px' }} />
                    )}
                </div>

                {/* Fuel type */}
                <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Fuel Type</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['petrol', 'diesel', 'gas'].map(ft => (
                            <button key={ft} onClick={() => handleFuelTypeChange(ft)}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'capitalize', background: form.fuelType === ft ? '#22c55e' : 'rgba(255,255,255,0.08)', color: form.fuelType === ft ? 'black' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s' }}>
                                {ft === 'petrol' ? '⛽ PMS' : ft === 'diesel' ? '🚛 AGO' : '🔵 Gas'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Litres + Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                        <label style={labelStyle}>Litres Filled</label>
                        <input type="number" min="1" placeholder="e.g. 50" value={form.litres} onChange={e => set('litres', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Price / Litre (₦)</label>
                        <input type="number" min="1" placeholder="e.g. 935" value={form.pricePerLitre} onChange={e => set('pricePerLitre', e.target.value)} style={inputStyle} />
                    </div>
                </div>

                {/* Total cost preview */}
                {totalCost && (
                    <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Cost</span>
                        <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>₦{parseInt(totalCost).toLocaleString()}</strong>
                    </div>
                )}

                {/* Driver + Vehicle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                        <label style={labelStyle}>Driver Name (optional)</label>
                        <input placeholder="e.g. Emeka" value={form.driverName} onChange={e => set('driverName', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Vehicle ID (optional)</label>
                        <input placeholder="e.g. LG-234-KJA" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} style={inputStyle} />
                    </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '22px' }}>
                    <label style={labelStyle}>Notes (optional)</label>
                    <input placeholder="e.g. Full tank before Abuja run" value={form.notes} onChange={e => set('notes', e.target.value)} style={inputStyle} />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.stationName || !form.litres || !form.pricePerLitre}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: done ? '#22c55e' : (loading || !form.stationName || !form.litres || !form.pricePerLitre ? 'rgba(255,255,255,0.1)' : '#22c55e'),
                        color: done || (!loading && form.stationName) ? 'black' : 'rgba(255,255,255,0.4)',
                        fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s'
                    }}
                >
                    {done ? <><CheckCircle size={18} /> Logged!</> : loading ? 'Saving...' : 'Log Fill-Up'}
                </button>
            </div>
        </div>
    );
};

// ── Main Ledger Component ────────────────────────────────────────────────────
const FuelLedger = ({ stations, depot }) => {
    const [entries, setEntries] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        setLoading(true);
        const unsub = subscribeToLedger(
            depot?.id || null,
            (data) => { setEntries(data); setLoading(false); },
            (err) => { console.error(err); setLoading(false); }
        );
        return unsub;
    }, [depot?.id]);

    const handleAdd = async (entryData) => {
        await addLedgerEntry(entryData);
    };

    const handleDelete = async (id) => {
        await deleteLedgerEntry(id);
        setDeleteConfirm(null);
    };

    // Summary stats
    const stats = useMemo(() => {
        if (!entries.length) return null;
        const totalCost = entries.reduce((s, e) => s + (e.totalCost || 0), 0);
        const totalLitres = entries.reduce((s, e) => s + (e.litres || 0), 0);
        const avgPrice = totalLitres > 0 ? totalCost / totalLitres : 0;
        const thisMonth = entries.filter(e => {
            const d = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const monthCost = thisMonth.reduce((s, e) => s + (e.totalCost || 0), 0);
        return { totalCost, totalLitres, avgPrice, monthCost, count: entries.length };
    }, [entries]);

    const fuelColor = (ft) => ft === 'petrol' ? '#4ade80' : ft === 'diesel' ? '#facc15' : '#60a5fa';
    const fuelIcon = (ft) => ft === 'petrol' ? '⛽' : ft === 'diesel' ? '🚛' : '🔵';

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '24px', color: 'white' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontWeight: 'bold' }}>Fuel Ledger</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', opacity: 0.45 }}>
                        {depot ? `Entries for ${depot.name}` : 'All depots'}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', borderRadius: '12px', border: 'none',
                        background: '#22c55e', color: 'black', fontWeight: 'bold',
                        cursor: 'pointer', fontSize: '0.9rem'
                    }}
                >
                    <Plus size={16} /> Log Fill-Up
                </button>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    {[
                        { icon: <DollarSign size={16} />, label: 'This Month', value: `₦${stats.monthCost.toLocaleString()}`, color: '#22c55e' },
                        { icon: <TrendingDown size={16} />, label: 'Avg Price/L', value: `₦${stats.avgPrice.toFixed(0)}`, color: '#3b82f6' },
                        { icon: <Fuel size={16} />, label: 'Total Litres', value: `${stats.totalLitres.toFixed(0)}L`, color: '#f59e0b' },
                        { icon: <BookOpen size={16} />, label: 'Total Entries', value: stats.count, color: '#a855f7' }
                    ].map((k, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: k.color, marginBottom: '8px', opacity: 0.8 }}>{k.icon}<span style={{ fontSize: '0.75rem' }}>{k.label}</span></div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: k.color }}>{k.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Entries Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>Loading ledger...</div>
            ) : entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.35 }}>
                    <BookOpen size={48} style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '0.9rem' }}>No fill-ups logged yet.<br />Tap <strong>Log Fill-Up</strong> after each fueling run.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {entries.map(entry => {
                        const date = entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp);
                        const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
                        const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={entry.id} style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '14px', padding: '14px 16px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
                            }}>
                                {/* Left: icon + station */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{fuelIcon(entry.fuelType)}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.stationName}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {dateStr} · {timeStr}
                                            {entry.driverName && ` · ${entry.driverName}`}
                                            {entry.vehicleId && ` · ${entry.vehicleId}`}
                                        </div>
                                        {entry.notes && <div style={{ fontSize: '0.72rem', opacity: 0.4, marginTop: '2px', fontStyle: 'italic' }}>{entry.notes}</div>}
                                    </div>
                                </div>

                                {/* Right: price info */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontWeight: 'bold', color: fuelColor(entry.fuelType) }}>₦{(entry.totalCost || 0).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.5 }}>{entry.litres}L @ ₦{entry.pricePerLitre}/L</div>
                                </div>

                                {/* Delete */}
                                {deleteConfirm === entry.id ? (
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Yes</button>
                                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>No</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setDeleteConfirm(entry.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AddEntryModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSubmit={handleAdd}
                stations={stations}
                depot={depot}
            />
        </div>
    );
};

export default FuelLedger;
