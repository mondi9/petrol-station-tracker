import React, { useState } from 'react';
import { MapPin, ShieldCheck, Camera, ArrowRight, CheckCircle2, Waves } from 'lucide-react';

const OnboardingFlow = ({ onComplete }) => {
    const [step, setStep] = useState(1);

    const slides = [
        {
            icon: <MapPin size={60} />,
            title: "Welcome to FuelPulse",
            description: "Real-time petrol tracking built for the streets of Lagos. Find active pumps, skip the queues, and save money.",
            color: "#22c55e",
            highlight: "Lagos Only"
        },
        {
            icon: <ShieldCheck size={60} />,
            title: "The Trust Engine",
            description: "We use 'Weighted Consensus' to verify data. Validated reports move the map in seconds, so you never drive to a dry station again.",
            color: "#3b82f6",
            highlight: "Data You Can Trust"
        },
        {
            icon: <Camera size={60} />,
            title: "Join the Pulse",
            description: "Be the eyes on the street. Submit reports with photos to become a 'Trusted Reporter' and help your neighborhood stay moving.",
            color: "#fbbf24",
            highlight: "Community Powered"
        }
    ];

    const currentSlide = slides[step - 1];

    const handleNext = () => {
        if (step < slides.length) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#0a0a0a',
            zIndex: 10005,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            textAlign: 'center',
            color: 'white'
        }}>
            {/* Background Decor */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '300px',
                height: '300px',
                background: `radial-gradient(circle, ${currentSlide.color}15 0%, transparent 70%)`,
                pointerEvents: 'none'
            }} />

            <div style={{
                color: currentSlide.color,
                marginBottom: '32px',
                animation: 'float 3s ease-in-out infinite'
            }}>
                {currentSlide.icon}
            </div>

            <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: currentSlide.color,
                background: `${currentSlide.color}10`,
                padding: '4px 12px',
                borderRadius: '20px',
                marginBottom: '16px'
            }}>
                {currentSlide.highlight}
            </span>

            <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>
                {currentSlide.title}
            </h1>

            <p style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                opacity: 0.8,
                maxWidth: '320px',
                marginBottom: '48px'
            }}>
                {currentSlide.description}
            </p>

            {/* Stepper Dots */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        style={{
                            width: i === step ? '24px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
                            background: i === step ? currentSlide.color : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    />
                ))}
            </div>

            <button
                onClick={handleNext}
                className="btn btn-primary"
                style={{
                    width: '100%',
                    maxWidth: '320px',
                    padding: '18px',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: currentSlide.color,
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: `0 10px 30px ${currentSlide.color}20`,
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                {step === slides.length ? "Let's Go!" : "Next Step"}
                <ArrowRight size={20} />
            </button>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

export default OnboardingFlow;
