import React, { useState } from 'react';
import { X, MessageCircle, MapPin, Copy, CheckCheck, Truck, Fuel, Navigation } from 'lucide-react';

const DispatchModal = ({ isOpen, onClose, station, depot }) => {
    const [copied, setCopied] = useState(false);
    const [driverName, setDriverName] = useState('');

    if (!isOpen || !station) return null;

    // Build readable price list
    const priceLines = [];
    if (station.prices?.petrol) priceLines.push(`⛽ PMS: ₦${station.prices.petrol}/L`);
    if (station.prices?.diesel) priceLines.push(`🚛 AGO: ₦${station.prices.diesel}/L`);
    if (station.prices?.gas) priceLines.push(`🔵 Gas: ₦${station.prices.gas}/L`);

    const distanceLine = station.distanceFromDepot
        ? `📍 ${station.distanceFromDepot.toFixed(1)}km from depot`
        : '';

    const queueLine = station.queueStatus
        ? `⏳ Queue: ${station.queueStatus.charAt(0).toUpperCase() + station.queueStatus.slice(1)}`
        : '';

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

    const greeting = driverName.trim() ? `Hi ${driverName.trim()}, ` : '';

    const message = `${greeting}please head to the following fueling station:\n\n🏪 *${station.name}*\n📌 ${station.address || 'Lagos'}\n\n${priceLines.join('\n')}${queueLine ? `\n${queueLine}` : ''}${distanceLine ? `\n${distanceLine}` : ''}\n\n🗺️ Navigate: ${mapsUrl}\n\n_Dispatched via Fleet Command_`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = message;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1f2e, #111827)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px', padding: '28px',
                width: '100%', maxWidth: '480px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', borderRadius: '10px', padding: '8px' }}>
                            <Truck size={20} color="#60a5fa" />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>Dispatch Driver</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.5 }}>Send fueling assignment</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Station Summary */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '16px', marginBottom: '18px'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '6px' }}>{station.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '10px' }}>{station.address || 'Lagos, Nigeria'}</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        {station.prices?.petrol && (
                            <span style={{ color: '#4ade80' }}>⛽ PMS: ₦{station.prices.petrol}/L</span>
                        )}
                        {station.prices?.diesel && (
                            <span style={{ color: '#facc15' }}>🚛 AGO: ₦{station.prices.diesel}/L</span>
                        )}
                        {station.distanceFromDepot && (
                            <span style={{ color: '#60a5fa' }}>📍 {station.distanceFromDepot.toFixed(1)}km</span>
                        )}
                    </div>
                </div>

                {/* Driver Name (Optional) */}
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>
                        Driver Name (optional)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Emeka, Driver 3..."
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                            color: 'white', fontSize: '0.9rem', outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Message Preview */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>
                        Message Preview
                    </label>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px', padding: '12px', fontSize: '0.78rem',
                        whiteSpace: 'pre-wrap', lineHeight: '1.6', opacity: 0.85,
                        maxHeight: '160px', overflowY: 'auto', fontFamily: 'monospace'
                    }}>
                        {message}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* WhatsApp */}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', padding: '14px', borderRadius: '12px',
                            background: '#25d366', color: 'white', fontWeight: 'bold',
                            fontSize: '0.9rem', textDecoration: 'none', transition: 'opacity 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </a>

                    {/* Maps Link */}
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '6px', padding: '14px 16px', borderRadius: '12px',
                            background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6',
                            color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem',
                            textDecoration: 'none', transition: 'opacity 0.2s'
                        }}
                        title="Open in Google Maps"
                    >
                        <Navigation size={18} />
                    </a>

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '6px', padding: '14px 16px', borderRadius: '12px',
                            background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                            border: copied ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                            color: copied ? '#4ade80' : 'white', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        title="Copy to clipboard"
                    >
                        {copied ? <CheckCheck size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DispatchModal;
