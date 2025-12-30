import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onSubmit, station }) => {
    if (!isOpen || !station) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass" style={{
                width: '90%',
                maxWidth: '400px',
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#1a1a1a',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                transform: 'scale(1)',
                animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Report Status</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <p style={{ opacity: 0.7, marginBottom: '4px' }}>Station</p>
                    <h3 style={{ fontSize: '1.1rem' }}>{station.name}</h3>
                    <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>{station.address}</p>
                </div>

                <p style={{ marginBottom: '16px', fontWeight: '500' }}>Is fuel available right now?</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <button
                        className="btn glass"
                        style={{
                            flexDirection: 'column',
                            padding: '20px',
                            gap: '12px',
                            border: '2px solid transparent',
                            background: 'rgba(34, 197, 94, 0.1)',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-active)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                        onClick={() => onSubmit('active')}
                    >
                        <div style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%', background: 'var(--color-active)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'black'
                        }}>
                            <ThumbsUp size={20} />
                        </div>
                        <span>Yes, Active</span>
                    </button>

                    <button
                        className="btn glass"
                        style={{
                            flexDirection: 'column',
                            padding: '20px',
                            gap: '12px',
                            border: '2px solid transparent',
                            background: 'rgba(239, 68, 68, 0.1)',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-inactive)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                        onClick={() => onSubmit('inactive')}
                    >
                        <div style={{
                            width: '40px', height: '40px',
                            borderRadius: '50%', background: 'var(--color-inactive)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}>
                            <ThumbsDown size={20} />
                        </div>
                        <span>No, Inactive</span>
                    </button>
                </div>

                <p style={{ fontSize: '0.8rem', opacity: 0.4, textAlign: 'center' }}>
                    Your report helps the community. Thank you!
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
        </div>
    );
};

export default ReportModal;
