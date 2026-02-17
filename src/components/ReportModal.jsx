import React, { useState, useEffect, useRef } from 'react';
import { X, Fuel, CheckCircle, TriangleAlert, Ban, Banknote, Camera, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validatePrice, mockExtractPriceFromPhoto } from '../services/priceService';
import { calculateQueueStatus, calculateDistance } from '../services/stationService';
import { uploadPhoto, validateImageFile } from '../services/photoService';
import { checkDuplicateReport, checkRateLimit, validateReportData, calculateReportQuality } from '../services/verificationService';
import { Sparkles, Loader2 } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, onSubmit, station, user, userLocation }) => {
    // Form State
    const [fuelType, setFuelType] = useState('petrol');
    const [availability, setAvailability] = useState('available');
    const [queueLength, setQueueLength] = useState(0);
    const [price, setPrice] = useState('');
    const [comment, setComment] = useState('');
    const [agreedToHonesty, setAgreedToHonesty] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [priceError, setPriceError] = useState('');

    // Photo State
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Verification State
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    const [rateLimitError, setRateLimitError] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    const fileInputRef = useRef(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setFuelType('petrol');
            setAvailability('available');
            setQueueLength(0);
            setPrice('');
            setComment('');
            setAgreedToHonesty(false);
            setGuestName('');
            setPriceError('');
            setPhotoFile(null);
            setPhotoPreview(null);
            setPhotoError('');
            setShowConfirmation(false);
            setDuplicateWarning(null);
            setRateLimitError(null);
            setValidationErrors([]);
        }
    }, [isOpen]);

    // Check for duplicates and rate limits when modal opens
    useEffect(() => {
        if (isOpen && station && user) {
            checkForIssues();
        }
    }, [isOpen, station, user]);

    const checkForIssues = async () => {
        if (!user || !station) return;

        // Check rate limit
        const rateLimit = await checkRateLimit(user.uid);
        if (rateLimit.exceeded) {
            setRateLimitError(`You've reached the limit of ${rateLimit.count} reports per hour. Please try again later.`);
        }

        // Check for duplicate
        const duplicate = await checkDuplicateReport(user.uid, station.id);
        if (duplicate.isDuplicate) {
            setDuplicateWarning('You recently reported this station. Are you sure you want to submit another report?');
        }
    };

    if (!isOpen || !station) return null;

    const handlePhotoSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            setPhotoError(validation.error);
            return;
        }

        setPhotoFile(file);
        setPhotoError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // --- Start AI Price Extraction ---
        setIsScanning(true);
        try {
            const extractedPrice = await mockExtractPriceFromPhoto(file, fuelType);
            if (extractedPrice) {
                setPrice(extractedPrice.toString());
                setPriceError('');
                // Optional: Provide visual feedback that price was auto-filled
            }
        } catch (err) {
            console.error("AI Scanning failed", err);
        } finally {
            setIsScanning(false);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhotoError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleInitialSubmit = () => {
        // Validate data
        const reportData = {
            fuelType,
            availability,
            queueLength: parseInt(queueLength) || 0,
            price: price ? parseInt(price) : null,
            comment: comment.trim(),
            reporterName: user ? (user.displayName || user.email.split('@')[0]) : (guestName.trim() || 'Guest')
        };

        const validation = validateReportData(reportData);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        // Validate price if provided
        if (price && !validatePrice(parseInt(price), fuelType)) {
            setPriceError('Price seems unrealistic. Please check.');
            return;
        }

        // Check rate limit
        if (rateLimitError) {
            alert(rateLimitError);
            return;
        }

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    const handleFinalSubmit = async () => {
        setIsUploading(true);

        try {
            let photoUrl = null;
            let thumbUrl = null;
            let isVerifiedEvidence = false;

            // Check if photo is taken near the station
            if (photoFile && userLocation && station.lat && station.lng) {
                const distance = calculateDistance(userLocation.lat, userLocation.lng, station.lat, station.lng);
                // If user is within 300m of the station, consider it verified evidence
                if (distance !== null && distance <= 0.3) {
                    isVerifiedEvidence = true;
                }
            }

            // Upload photo if selected
            if (photoFile && user) {
                const uploadResult = await uploadPhoto(photoFile, station.id, user.uid);
                photoUrl = uploadResult.photoUrl;
                thumbUrl = uploadResult.thumbUrl;
            }

            // Construct final report data
            const reportData = {
                fuelType,
                availability,
                queueLength: parseInt(queueLength) || 0,
                price: price ? parseInt(price) : null,
                comment: comment.trim(),
                reporterName: user ? (user.displayName || user.email.split('@')[0]) : (guestName.trim() || 'Guest'),
                photoUrl,
                photoThumbUrl: thumbUrl,
                hasPhoto: !!photoUrl,
                isVerifiedEvidence,
                quality: calculateReportQuality({
                    hasPhoto: !!photoUrl,
                    isVerifiedEvidence,
                    price: price ? parseInt(price) : null,
                    queueLength: parseInt(queueLength) || 0,
                    comment: comment.trim(),
                    userId: user?.uid,
                    reporterName: user ? (user.displayName || user.email.split('@')[0]) : (guestName.trim() || 'Guest')
                })
            };

            await onSubmit(reportData);
            setIsUploading(false);
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report. Please try again.');
            setIsUploading(false);
        }
    };

    const handlePriceChange = (e) => {
        setPrice(e.target.value);
        setPriceError('');
    };

    const lastPrice = station.prices?.[fuelType];
    const currentQueueStatus = calculateQueueStatus(parseInt(queueLength) || 0);

    // Confirmation Dialog
    if (showConfirmation) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.2s ease-out'
            }}>
                <div className="glass" style={{
                    width: '90%', maxWidth: '400px', padding: '24px',
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)',
                    background: '#1a1a1a', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>Confirm Report</h2>

                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <strong>{station.name}</strong>
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>🛢️ <strong>{fuelType.toUpperCase()}</strong> - {availability}</div>
                            <div>⏱️ Queue: <strong>{queueLength} min</strong> ({currentQueueStatus === 'mild' ? 'Mild' : (currentQueueStatus || 'N/A')})</div>
                            {price && <div>💰 Price: <strong>₦{price}</strong></div>}
                            {comment && <div>💬 Comment: <strong>{comment}</strong></div>}
                            {photoFile && <div>📸 Photo attached</div>}
                        </div>
                    </div>

                    {duplicateWarning && (
                        <div style={{
                            padding: '12px', marginBottom: '16px', borderRadius: '8px',
                            background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308',
                            color: '#facc15', fontSize: '0.85rem', display: 'flex', gap: '8px'
                        }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{duplicateWarning}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <button
                            onClick={() => setShowConfirmation(false)}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'transparent',
                                color: 'white', cursor: 'pointer', fontWeight: '600'
                            }}
                            disabled={isUploading}
                        >
                            Back
                        </button>
                    </div>

                    {/* Honesty Disclaimer */}
                    <div style={{
                        padding: '12px',
                        background: 'rgba(234, 179, 8, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(234, 179, 8, 0.1)',
                        marginBottom: '16px'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                            <input
                                type="checkbox"
                                checked={agreedToHonesty}
                                onChange={(e) => setAgreedToHonesty(e.target.checked)}
                                style={{ marginTop: '3px' }}
                            />
                            <span>I confirm this report is honest and based on what I see right now. 🤝</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleFinalSubmit}
                        disabled={isUploading || !agreedToHonesty}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} style={{ marginRight: '8px' }} />
                                Submitting...
                            </>
                        ) : 'Submit Truthful Report'}
                    </button>
                </div>
            </div>
        );
    }

    // Main Form
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out', overflowY: 'auto', padding: '20px'
        }}>
            <div className="glass" style={{
                width: '90%', maxWidth: '450px', padding: '24px',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)',
                background: '#1a1a1a', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Report Status</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Share what you see</h2>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '0.85rem' }}>Help the community save time and money.</p>
                </div>

                {rateLimitError && (
                    <div style={{
                        padding: '12px', marginBottom: '16px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444',
                        color: '#f87171', fontSize: '0.85rem'
                    }}>
                        {rateLimitError}
                    </div>
                )}

                {validationErrors.length > 0 && (
                    <div style={{
                        padding: '12px', marginBottom: '16px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444',
                        color: '#f87171', fontSize: '0.85rem'
                    }}>
                        {validationErrors.map((error, idx) => (
                            <div key={idx}>• {error}</div>
                        ))}
                    </div>
                )}

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Fuel Type */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Fuel Type <span style={{ color: 'red' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={fuelType}
                                onChange={(e) => setFuelType(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem', appearance: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="petrol" style={{ background: '#333' }}>Petrol (PMS)</option>
                                <option value="diesel" style={{ background: '#333' }}>Diesel (AGO)</option>
                                <option value="premium" style={{ background: '#333' }}>Premium (High Octane)</option>
                            </select>
                            <Fuel size={16} style={{ position: 'absolute', right: '12px', top: '14px', opacity: 0.5, pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Availability */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Availability <span style={{ color: 'red' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { val: 'available', label: 'Available', color: 'var(--color-active)', icon: CheckCircle },
                                { val: 'low', label: 'Low', color: '#eab308', icon: TriangleAlert },
                                { val: 'empty', label: 'Empty', color: '#ef4444', icon: Ban }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setAvailability(opt.val)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: availability === opt.val ? `1px solid ${opt.color}` : '1px solid var(--glass-border)',
                                        background: availability === opt.val ? `${opt.color}20` : 'transparent',
                                        color: availability === opt.val ? opt.color : 'rgba(255,255,255,0.6)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <opt.icon size={18} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: availability === opt.val ? 'bold' : 'normal' }}>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Queue & Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Queue Time</label>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { val: 0, label: 'None', emoji: '✅' },
                                    { val: 5, label: '5m', emoji: '✅' },
                                    { val: 15, label: '15m', emoji: '⏳' },
                                    { val: 30, label: '30m', emoji: '🚨' },
                                    { val: 60, label: '1h', emoji: '🚨' }
                                ].map(preset => (
                                    <button
                                        key={preset.val}
                                        type="button"
                                        onClick={() => setQueueLength(preset.val)}
                                        style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem',
                                            border: queueLength == preset.val ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                            background: queueLength == preset.val ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                                            color: queueLength == preset.val ? 'var(--color-active)' : 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer', transition: 'all 0.2s', fontWeight: queueLength == preset.val ? 'bold' : 'normal'
                                        }}
                                    >
                                        {preset.emoji} {preset.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                min="0"
                                value={queueLength}
                                onChange={(e) => setQueueLength(e.target.value)}
                                placeholder="Custom"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                            {queueLength > 0 && currentQueueStatus && (
                                <div style={{
                                    marginTop: '6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px',
                                    color: currentQueueStatus === 'short' ? '#22c55e' : currentQueueStatus === 'medium' ? '#eab308' : '#ef4444',
                                    fontWeight: 'bold'
                                }}>
                                    {currentQueueStatus === 'short' ? '✅ Short Queue' : currentQueueStatus === 'mild' ? '⏳ Mild Queue' : '🚨 Long Queue'}
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                                <Banknote size={16} style={{ color: '#22c55e' }} />
                                Price (₦)
                                {lastPrice && (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                                        Last: ₦{lastPrice}
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                placeholder={lastPrice ? `e.g., ${lastPrice}` : "e.g., 950"}
                                value={price}
                                onChange={handlePriceChange}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: priceError ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                            {price && !isScanning && photoFile && (
                                <div style={{
                                    marginTop: '6px', fontSize: '0.7rem', color: '#22c55e',
                                    display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'
                                }}>
                                    <Sparkles size={12} />
                                    AI SMART SUGGESTION
                                </div>
                            )}
                            {priceError && (
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                    {priceError}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                            📸 Snapshot = Trust (Optional)
                        </label>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: photoPreview ? `url(${photoPreview}) center/cover` : 'rgba(255,255,255,0.03)',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden',
                                height: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {!photoPreview && (
                                <>
                                    <Camera size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Upload fuel price or pump photo</span>
                                </>
                            )}
                            {isScanning && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px'
                                }}>
                                    <Loader2 className="animate-spin" size={24} />
                                    <span style={{ fontSize: '0.75rem' }}>Analyzing price...</span>
                                </div>
                            )}
                            {photoPreview && !isScanning && (
                                <div style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'white'
                                }} onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}>
                                    <X size={18} />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        {photoError && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                {photoError}
                            </span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            💡 Verified photos build the most trust in the community.
                        </span>
                    </div>

                    {/* Comments */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                            💬 Any other details? (Optional)
                        </label>
                        <textarea
                            placeholder="e.g., 'Only 2 pumps working' or 'Cash only today'"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                color: 'white', fontSize: '0.9rem', minHeight: '80px', resize: 'vertical',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Guest Name */}
                    {!user && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Your Name <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(Optional)</span></label>
                            <input
                                type="text"
                                placeholder="Guest Reporter"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    color: 'white', fontSize: '1rem'
                                }}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleInitialSubmit}
                        className="btn btn-primary"
                        style={{
                            marginTop: '8px', padding: '14px', width: '100%', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1rem'
                        }}
                        disabled={rateLimitError}
                    >
                        Continue
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.3; transform: scale(0.8); } }
      `}} />
        </div>
    );
};

export default ReportModal;
