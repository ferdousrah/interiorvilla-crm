import { useState } from 'react';

/**
 * CurrencyInput — formats BDT amounts in lakh format on blur.
 * Props: value (number/string), onChange(numericString), name, id, placeholder, disabled, className
 */
export default function CurrencyInput({ value, onChange, name, id, placeholder = '0.00', disabled = false, className = '' }) {
    const [focused, setFocused] = useState(false);

    // Format for display when not focused
    function formatBDT(val) {
        const num = parseFloat(val);
        if (isNaN(num)) return '';
        // Bengali lakh format: last 3 then groups of 2
        const parts = num.toFixed(2).split('.');
        const intPart = parts[0];
        const decPart = parts[1];
        let formatted = '';
        if (intPart.length <= 3) {
            formatted = intPart;
        } else {
            const last3 = intPart.slice(-3);
            const rest = intPart.slice(0, -3);
            const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
            formatted = restFormatted + ',' + last3;
        }
        return `${formatted}৳.${decPart}`;
    }

    const displayValue = focused ? (value ?? '') : (value !== '' && value !== null && value !== undefined ? formatBDT(value) : '');

    return (
        <input
            type={focused ? 'number' : 'text'}
            name={name}
            id={id}
            value={displayValue}
            placeholder={focused ? '' : placeholder}
            disabled={disabled}
            className={`form-input ${className}`}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={e => onChange && onChange(e.target.value)}
            step="0.01"
            min="0"
        />
    );
}

/**
 * Utility function to format a number as BDT string.
 * Usage: formatBDT(123456) → '৳1,23,456.00'
 */
export function formatBDT(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return '৳0.00';
    const abs = Math.abs(num);
    const parts = abs.toFixed(2).split('.');
    const intPart = parts[0];
    let formatted = '';
    if (intPart.length <= 3) {
        formatted = intPart;
    } else {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3);
        const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        formatted = restFormatted + ',' + last3;
    }
    return `${num < 0 ? '-' : ''}${formatted}৳.${parts[1]}`;
}
