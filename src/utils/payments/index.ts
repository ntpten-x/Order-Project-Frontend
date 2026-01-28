import { SalesOrder } from '../../types/api/pos/salesOrder';
import { Discounts } from '../../types/api/pos/discounts';

/**
 * Calculate totals for an order including discount, vat, and change.
 * This logic consolidates calculations used in the payment page.
 */
export const calculatePaymentTotals = (
    order: SalesOrder | null,
    receivedAmount: number = 0
) => {
    if (!order) return { subtotal: 0, discount: 0, vat: 0, total: 0, change: 0 };

    const subtotal = Number(order.sub_total || 0);
    const discountVal = Number(order.discount_amount || 0);
    const vat = Number(order.vat || 0);
    const total = Number(order.total_amount || 0);

    // Ensure change is not negative for display
    const change = Math.max(0, receivedAmount - total);

    return {
        subtotal,
        discount: discountVal,
        vat,
        total,
        change
    };
};

/**
 * Helper to identify if a payment method is Cash
 */
export const isCashMethod = (methodName: string = '', displayName: string = ''): boolean => {
    const lowerName = methodName.toLowerCase();
    const lowerDisplay = displayName.toLowerCase();
    return lowerName.includes('cash') || lowerDisplay.includes('สด');
};

/**
 * Helper to identify if a payment method is QR/PromptPay
 */
export const isPromptPayMethod = (methodName: string = '', displayName: string = ''): boolean => {
    const lowerName = methodName.toLowerCase();
    const lowerDisplay = displayName.toLowerCase();
    // Common keywords for QR payment
    return lowerName.includes('qr') || lowerName.includes('prompt') || lowerDisplay.includes('qr') || lowerDisplay.includes('พร้อมเพย์');
};

export const quickCashAmounts = [20, 50, 100, 500, 1000];
