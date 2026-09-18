import React from 'react';
import { X, Fuel, Search, Filter, Activity, ArrowRight } from 'lucide-react';

const OnboardingModal = ({ isOpen, onComplete }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10010,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '460px',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '28px',
                color: 'white',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
                {/* Close button */}
                <button
                    onClick={onComplete}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <X size={18} />
                </button>

                {/* Logo header */}
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'var(--color-active)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    boxShadow: '0 8px 24px var(--color-active-glow)'
                }}>
                    <Fuel size={28} color="#000" />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                    Welcome to Lagos Petrol Pulse
                </h2>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.8, margin: '0 0 24px' }}>
                    A real-time, crowd-sourced map of petrol stations across Lagos. See which pumps are
                    dispensing, what fuel costs, and how long the queues are — before you drive there.
                </p>

                {/* What the app does */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: '12px' }}>
                        What you can do
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', background: 'var(--color-active)20', color: 'var(--color-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Search size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Search stations</div>
                                <div style={{ fontSize: '0.82rem', lineHeight: '1.5', opacity: 0.75, marginTop: '2px' }}>
                                    Type a station name or address in the search box to jump straight to it.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', background: 'var(--color-active)20', color: 'var(--color-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Read queue indicators</div>
                                <div style={{ fontSize: '0.82rem', lineHeight: '1.5', opacity: 0.75, marginTop: '2px' }}>
                                    Each station shows how busy it is right now.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', background: 'var(--color-active)20', color: 'var(--color-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Filter size={18} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Use filters</div>
                                <div style={{ fontSize: '0.82rem', lineHeight: '1.5', opacity: 0.75, marginTop: '2px' }}>
                                    Narrow the map down by station status or fuel type.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Queue indicators legend */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: '12px' }}>
                        Queue indicators
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                            <span style={{ fontSize: '1rem' }}>⚡</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#4ade80' }}>Short Queue</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Fast movement — expect under ~15 mins.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                            <span style={{ fontSize: '1rem' }}>⏳</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#facc15' }}>Mild Queue</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Steady progress — expect ~15–30 mins.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            <span style={{ fontSize: '1rem' }}>🚨</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#f87171' }}>Long Queue</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Slow going — expect 45+ mins.</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: '12px' }}>
                        Using the filters
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ fontSize: '1rem' }}>🟢</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Status</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                                    <strong>Active</strong> = confirmed dispensing · <strong>Inactive</strong> = reported dry · <strong>All</strong> = show everything.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ fontSize: '1rem' }}>⛽</span>
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>Fuel type</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                                    Filter for Petrol (PMS), Diesel (AGO), or Gas (LPG) availability.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Get Started */}
                <button
                    onClick={onComplete}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '14px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        background: 'var(--color-active)',
                        color: '#000',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 30px var(--color-active-glow)'
                    }}
                >
                    Get Started <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default OnboardingModal;
