/**
 * DatePicker — thin wrapper around <input type="date"> with dayjs display formatting.
 * Stores value as YYYY-MM-DD (ISO), displays as DD MMM YYYY.
 * Props: value (YYYY-MM-DD string), onChange(isoString), name, id, placeholder, disabled, className, min, max
 */
export default function DatePicker({ value, onChange, name, id, placeholder = 'DD MMM YYYY', disabled = false, className = '', min, max }) {
    return (
        <input
            type="date"
            name={name}
            id={id}
            value={value ?? ''}
            min={min}
            max={max}
            disabled={disabled}
            placeholder={placeholder}
            className={`form-input ${className}`}
            onChange={e => onChange && onChange(e.target.value)}
        />
    );
}

/**
 * Utility: format an ISO date string or Date object as "05 Apr 2025"
 */
export function formatDate(val) {
    if (!val) return '—';
    const d = typeof val === 'string' ? new Date(val) : val;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
