import { OrderStatus } from '../../types/api/pos/salesOrder';

/**
 * Get color for order status
 */
export const getOrderStatusColor = (status: string): string => {
    switch (status) {
        case OrderStatus.Pending:
            return 'orange';
        case OrderStatus.Cooking:
            return 'blue';
        case OrderStatus.Served:
            return 'green';
        case OrderStatus.Paid:
            return 'cyan';
        case OrderStatus.Cancelled:
            return 'red';
        case OrderStatus.WaitingForPayment:
            return 'gold';
        default:
            return 'default';
    }
};

/**
 * Get Thai text for order status
 */
export const getOrderStatusText = (status: string): string => {
    switch (status) {
        case OrderStatus.Pending:
            return 'รอรับออเดอร์';
        case OrderStatus.Cooking:
            return 'กำลังปรุง';
        case OrderStatus.Served:
            return 'เสิร์ฟแล้ว';
        case OrderStatus.Paid:
            return 'ชำระเงินแล้ว';
        case OrderStatus.Cancelled:
            return 'ยกเลิก';
        case OrderStatus.WaitingForPayment:
            return 'รอชำระเงิน';
        default:
            return status;
    }
};

/**
 * Get color for order channel type
 */
export const getOrderChannelColor = (type: string): string => {
    switch (type) {
        case 'DineIn':
            return '#722ed1';
        case 'TakeAway':
            return '#fa8c16';
        case 'Delivery':
            return '#eb2f96';
        default:
            return '#1890ff';
    }
};

/**
 * Get Thai text for order channel type
 */
export const getOrderChannelText = (type: string): string => {
    switch (type) {
        case 'DineIn':
            return 'ทานที่ร้าน';
        case 'TakeAway':
            return 'กลับบ้าน';
        case 'Delivery':
            return 'เดลิเวอรี่';
        default:
            return type;
    }
};

/**
 * Format currency to Thai Baht
 */
export const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `฿${numAmount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

/**
 * Get order reference display text based on order type
 */
export const getOrderReference = (order: any): string => {
    if (order.order_type === 'DineIn') {
        return order.table?.table_name || 'ไม่ระบุโต๊ะ';
    }
    if (order.order_type === 'Delivery') {
        return order.delivery_code || order.delivery?.delivery_name || 'ไม่ระบุ';
    }
    if (order.order_type === 'TakeAway') {
        return order.order_no || 'ไม่ระบุ';
    }
    return order.order_no || 'N/A';
};

/**
 * Get items that are not cancelled
 */
export const getNonCancelledItems = (items: any[] = []): any[] => {
    return items.filter(item => item.status !== OrderStatus.Cancelled);
};

/**
 * Calculate total extra price from item details
 */
export const calculateItemExtras = (details: any[] = []): number => {
    return details.reduce((sum, d) => sum + (Number(d.extra_price) || 0), 0);
};

/**
 * Calculate total for a single item (price + extras) * quantity
 */
export const calculateItemTotal = (price: number | string, quantity: number, details: any[] = []): number => {
    const basePrice = Number(price) || 0;
    const extrasPrice = calculateItemExtras(details);
    return (basePrice + extrasPrice) * quantity;
};

/**
 * Calculate total items quantity from order items (excluding cancelled)
 */
export const getTotalItemsQuantity = (items: any[] = []): number => {
    return getNonCancelledItems(items).reduce((sum, item) => sum + (item.quantity || 0), 0);
};

/**
 * Group order items by category and calculate quantities (excluding cancelled)
 */
export const groupItemsByCategory = (items: any[] = []): Record<string, number> => {
    return getNonCancelledItems(items).reduce((acc, item) => {
        const categoryName = item.product?.category?.display_name || 'อื่นๆ';
        acc[categoryName] = (acc[categoryName] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);
};

/**
 * Calculate total order amount excluding cancelled items
 */
export const calculateOrderTotal = (items: any[] = []): number => {
    return getNonCancelledItems(items).reduce((sum, item) => sum + Number(item.total_price || 0), 0);
};

/**
 * Sort orders by creation date
 * @param orders - Array of orders to sort
 * @param ascending - If true, oldest first (FIFO). If false, newest first. Default: true
 */
export const sortOrdersByDate = (orders: any[], ascending: boolean = true): any[] => {
    return [...orders].sort((a, b) => {
        const dateA = new Date(a.create_date).getTime();
        const dateB = new Date(b.create_date).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
};
/**
 * Sort orders by total item quantity
 * @param orders - Array of orders to sort
 * @param ascending - If true, smallest quantity first. If false, largest quantity first. Default: false (largest first)
 */
export const sortOrdersByQuantity = (orders: any[], ascending: boolean = false): any[] => {
    return [...orders].sort((a, b) => {
        const qtyA = getTotalItemsQuantity(a.items || []);
        const qtyB = getTotalItemsQuantity(b.items || []);
        return ascending ? qtyA - qtyB : qtyB - qtyA;
    });
};
