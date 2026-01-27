/**
 * Formats a number as a Thai Baht currency string.
 * @param amount - The amount to format.
 * @returns Formatted currency string (e.g., "฿1,000.00").
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

/**
 * Formats a date string or object into a readable Thai date format.
 * @param date - The date to format.
 * @returns Formatted date string (e.g., "1 มกราคม 2567").
 */
export const formatDateKeys = (date: string | Date): string => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d);
};
