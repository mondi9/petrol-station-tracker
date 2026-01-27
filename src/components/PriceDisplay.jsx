import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import { getPriceFreshness, formatPriceWithTrend } from '../services/priceService';

/**
 * PriceDisplay Component
 * Displays fuel prices with freshness indicators and trend arrows
 * 
 * @param {object} props
 * @param {object} props.prices - { petrol: 950, diesel: 1100, premium: 1200 }
 * @param {string} props.lastPriceUpdate - ISO timestamp
 * @param {string} props.fuelType - Specific fuel type to display (optional, shows all if not provided)
 * @param {boolean} props.compact - Compact mode for list view
 * @param {object} props.previousPrices - Previous prices for trend calculation (optional)
 */
const PriceDisplay = ({
    prices,
    lastPriceUpdate,
    fuelType = null,
    compact = false,
    previousPrices = null
}) => {
    if (!prices || Object.keys(prices).length === 0) {
        return (
            <div style={{
                padding: compact ? '4px 8px' : '8px 12px',
                borderRadius: '6px',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: compact ? '0.75rem' : '0.85rem',
                color: '#94a3b8'
            }}>
                <DollarSign size={compact ? 12 : 14} />
                <span>No price data</span>
            </div>
        );
    }

    const freshness = getPriceFreshness(lastPriceUpdate);

    // If specific fuel type requested, show only that
    const displayPrices = fuelType
        ? { [fuelType]: prices[fuelType] }
        : prices;

    // Compact mode - show lowest price only
    if (compact) {
        const lowestFuel = Object.entries(displayPrices).reduce((min, [fuel, price]) =>
            !min || price < min.price ? { fuel, price } : min
            , null);

        if (!lowestFuel) return null;

        const priceData = formatPriceWithTrend(
            lowestFuel.price,
            previousPrices?.[lowestFuel.fuel]
        );

        const TrendIcon = priceData.trend === 'rising' ? TrendingUp :
            priceData.trend === 'falling' ? TrendingDown : Minus;

        return (
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: `${freshness.color}15`,
                border: `1px solid ${freshness.color}40`,
                fontSize: '0.85rem',
                fontWeight: '600'
            }}>
                <DollarSign size={14} style={{ color: freshness.color }} />
                <span style={{ color: 'white' }}>{priceData.formatted}</span>
                <TrendIcon size={12} style={{ color: priceData.color }} />
                <span style={{
                    fontSize: '0.7rem',
                    color: freshness.color,
                    fontWeight: '500'
                }}>
                    {freshness.label}
                </span>
            </div>
        );
    }

    // Full mode - show all fuel types
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)'
        }}>
            {/* Freshness Badge */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
            }}>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Fuel Prices
                </span>
                <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${freshness.color}20`,
                    color: freshness.color,
                    fontWeight: '600'
                }}>
                    {freshness.label}
                </span>
            </div>

            {/* Price List */}
            {Object.entries(displayPrices).map(([fuel, price]) => {
                if (!price) return null;

                const priceData = formatPriceWithTrend(price, previousPrices?.[fuel]);
                const TrendIcon = priceData.trend === 'rising' ? TrendingUp :
                    priceData.trend === 'falling' ? TrendingDown : Minus;

                const fuelLabels = {
                    petrol: 'Petrol (PMS)',
                    diesel: 'Diesel (AGO)',
                    premium: 'Premium'
                };

                return (
                    <div key={fuel} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <span style={{
                            fontSize: '0.85rem',
                            color: '#cbd5e1',
                            fontWeight: '500'
                        }}>
                            {fuelLabels[fuel] || fuel}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: 'white'
                            }}>
                                {priceData.formatted}
                            </span>
                            <TrendIcon size={14} style={{ color: priceData.color }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PriceDisplay;
