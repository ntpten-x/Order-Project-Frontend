
/**
 * Utility functions for shift calculations and formatting.
 */

/**
 * Format currency in Thai Baht
 * @param amount - Number or string amount
 * @returns Formatted currency string
 */
export const formatBaht = (amount: number | string): string => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `฿${(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calculate expected amount in drawer
 * @param startAmount - Opening cash
 * @param totalSales - Total sales during shift
 * @returns Expected total amount
 */
export const calculateExpectedAmount = (startAmount: number | string, totalSales: number | string): number => {
    return (Number(startAmount) || 0) + (Number(totalSales) || 0);
};

/**
 * Calculate profit margin percentage
 * @param sales - Total revenue
 * @param cost - Total cost
 * @returns Percentage string
 */
export const calculateProfitMargin = (sales: number, cost: number): string => {
    if (sales <= 0) return '0%';
    const margin = ((sales - cost) / sales) * 100;
    return `${margin.toFixed(1)}%`;
};
