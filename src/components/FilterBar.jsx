import React from 'react';
import { Fuel, Filter } from 'lucide-react';

const FilterBar = ({ filters, onFilterChange }) => {
    // filters = { fuelType: 'all' | 'petrol' | 'diesel' | 'gas', status: 'all' | 'active' | 'inactive' }

    return (
        <div className="glass" style={{
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', opacity: 0.7 }}>
                <Filter size={14} />
                <span>Filters</span>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'active', 'inactive'].map(status => (
                    <button
                        key={status}
                        onClick={() => onFilterChange({ ...filters, status })}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: filters.status === status ?
                                (status === 'active' ? '1px solid rgba(34, 197, 94, 0.5)' :
                                    status === 'inactive' ? '1px solid rgba(239, 68, 68, 0.5)' :
                                        '1px solid var(--glass-border)')
                                : '1px solid transparent',
                            background: filters.status === status ?
                                (status === 'active' ? 'rgba(34, 197, 94, 0.1)' :
                                    status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' :
                                        'rgba(255,255,255,0.1)')
                                : 'rgba(0,0,0,0.2)',
                            color: filters.status === status ?
                                (status === 'active' ? 'var(--color-active)' :
                                    status === 'inactive' ? 'var(--color-inactive)' :
                                        'white')
                                : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Fuel Type Filter */}
            <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', opacity: 0.6 }}>Fuel Availability</label>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                        { id: 'all', label: 'Any Fuel' },
                        { id: 'petrol', label: 'Petrol (PMS)' },
                        { id: 'diesel', label: 'Diesel (AGO)' },
                        { id: 'gas', label: 'Gas (LPG)' }
                    ].map(fuel => (
                        <button
                            key={fuel.id}
                            onClick={() => onFilterChange({ ...filters, fuelType: fuel.id })}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: filters.fuelType === fuel.id ? '1px solid var(--color-active)' : '1px solid var(--glass-border)',
                                background: filters.fuelType === fuel.id ? 'var(--color-active)' : 'transparent',
                                color: filters.fuelType === fuel.id ? 'black' : 'var(--text-secondary)',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {fuel.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
