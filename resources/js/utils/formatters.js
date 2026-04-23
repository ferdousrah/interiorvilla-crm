import dayjs from 'dayjs';

/**
 * Format amount in BDT lakh format: 1,23,456.00৳
 * BD standard: amount first, then currency symbol
 */
export function formatBDT(amount) {
    if (amount === null || amount === undefined || amount === '') return '0.00৳';

    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00৳';

    const isNegative = num < 0;
    const abs = Math.abs(num);

    // Format with 2 decimal places
    const [intPart, decPart] = abs.toFixed(2).split('.');

    // Apply Indian/lakh numbering: last 3 digits, then groups of 2
    let formatted = intPart;
    if (intPart.length > 3) {
        const last3 = intPart.slice(-3);
        const rest = intPart.slice(0, -3);
        const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        formatted = restFormatted + ',' + last3;
    }

    return `${isNegative ? '-' : ''}${formatted}.${decPart}৳`;
}

/**
 * Format date as DD MMM YYYY
 */
export function formatDate(date) {
    if (!date) return '-';
    return dayjs(date).format('DD MMM YYYY');
}

/**
 * Format datetime
 */
export function formatDateTime(date) {
    if (!date) return '-';
    return dayjs(date).format('DD MMM YYYY HH:mm');
}

/**
 * Is date past due?
 */
export function isPastDue(date) {
    if (!date) return false;
    return dayjs(date).isBefore(dayjs(), 'day');
}
