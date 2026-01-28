import React from 'react';
import { OrderStatus, SalesOrder } from '../../types/api/pos/salesOrder';
import { Tables, TableStatus } from '../../types/api/pos/tables';
import { DialogType } from '../../components/dialog/ConfirmationDialog';

export interface ConfirmationConfig {
    open: boolean;
    type: DialogType;
    title: string;
    content: string | React.ReactNode;
    okText?: string;
    cancelText?: string;
    onOk: () => void;
    onCancel?: () => void;
    loading?: boolean;
}

/**
 * Get the navigation path for a table based on its status and active order status.
 * @param table - The table object
 * @returns The navigation path string
 */
export const getTableNavigationPath = (table: Tables): string => {
    // 1. Available -> Go to Table Detail Page (New Order)
    if (table.status === TableStatus.Available) {
        return `/pos/channels/dine-in/${table.id}`;
    }

    // 2. Unavailable -> Check Active Order
    const activeOrderId = table.active_order_id || (table as any).active_order?.id;
    const activeOrderStatus = table.active_order_status || (table as any).active_order?.status;

    if (activeOrderId) {
        // If Waiting For Payment -> Go to Payment Page
        if (activeOrderStatus === OrderStatus.WaitingForPayment) {
            return `/pos/items/${activeOrderId}`;
        }

        // Other statuses (Pending, Cooking, Served) -> Go to Order Detail Page
        return `/pos/orders/${activeOrderId}`;
    }

    // Fallback if unavailable but no active order ID (should not happen in normal flow)
    return `/pos/channels/dine-in/${table.id}`;
};

type OrderItemDetailLike = {
    detail_name?: string;
    extra_price?: number | string;
};

type OrderItemLike = {
    id?: string;
    status?: OrderStatus | string;
    quantity?: number;
    price?: number | string;
    total_price?: number | string;
    notes?: string;
    product?: {
        display_name?: string;
        category?: {
            display_name?: string;
        };
    };
    details?: OrderItemDetailLike[];
};

type OrderLike = {
    order_type?: string;
    table?: { table_name?: string } | null;
    delivery_code?: string | null;
    delivery?: { delivery_name?: string | null } | null;
    order_no?: string;
    items?: OrderItemLike[];
    create_date?: string;
};

export const getOrderStatusColor = (status: OrderStatus | string): string => {
    switch (status) {
        case OrderStatus.Pending:
            return 'orange'; // กำลังดำเนินการ
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

export const getOrderStatusText = (status: OrderStatus | string): string => {
    switch (status) {
        case OrderStatus.Pending:
            return 'กำลังดำเนินการ';
        case OrderStatus.Cooking:
            return 'กำลังปรุง';
        case OrderStatus.Served:
            return 'เสิร์ฟแล้ว';
        case OrderStatus.Paid:
            return 'ชำระเงินแล้ว';
        case OrderStatus.Completed:
            return 'สำเร็จ';
        case OrderStatus.Cancelled:
            return 'ยกเลิก';
        case OrderStatus.WaitingForPayment:
            return 'รอชำระเงิน';
        default:
            return status;
    }
};

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

export const getOrderChannelText = (type: string): string => {
    switch (type) {
        case 'DineIn':
            return 'ทานที่ร้าน';
        case 'TakeAway':
            return 'สั่งกลับบ้าน';
        case 'Delivery':
            return 'เดลิเวอรี่';
        default:
            return type;
    }
};

export const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `฿${Number(numAmount).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const getOrderReference = (order: OrderLike): string => {
    if (order.order_type === 'DineIn') {
        return order.table?.table_name || 'ไม่ระบุโต๊ะ';
    }
    if (order.order_type === 'Delivery') {
        return order.delivery_code || order.delivery?.delivery_name || 'ไม่ระบุข้อมูล';
    }
    if (order.order_type === 'TakeAway') {
        return order.order_no || 'ไม่ระบุเลขที่';
    }
    return order.order_no || 'N/A';
};

export const getNonCancelledItems = (items?: OrderItemLike[]): OrderItemLike[] => {
    return (items ?? []).filter(item => item.status !== OrderStatus.Cancelled);
};

export const calculateItemExtras = (details?: OrderItemDetailLike[]): number => {
    return (details ?? []).reduce((sum, detail) => sum + (Number(detail.extra_price) || 0), 0);
};

export const calculateItemTotal = (price: number | string, quantity: number, details?: OrderItemDetailLike[]): number => {
    const basePrice = Number(price) || 0;
    const extrasPrice = calculateItemExtras(details);
    return (basePrice + extrasPrice) * quantity;
};

export const getTotalItemsQuantity = (items?: OrderItemLike[]): number => {
    return getNonCancelledItems(items).reduce((sum, item) => sum + (item.quantity || 0), 0);
};

export const groupItemsByCategory = (items?: OrderItemLike[]): Record<string, number> => {
    return getNonCancelledItems(items).reduce((acc, item) => {
        const categoryName = item.product?.category?.display_name || 'ไม่ระบุหมวด';
        acc[categoryName] = (acc[categoryName] || 0) + (item.quantity || 0);
        return acc;
    }, {} as Record<string, number>);
};

export const calculateOrderTotal = (items?: OrderItemLike[]): number => {
    return getNonCancelledItems(items).reduce((sum, item) => sum + Number(item.total_price || 0), 0);
};

export const sortOrdersByDate = <T extends { create_date?: string }>(orders: T[] = [], ascending: boolean = true): T[] => {
    return [...orders].sort((a, b) => {
        const dateA = a.create_date ? new Date(a.create_date).getTime() : 0;
        const dateB = b.create_date ? new Date(b.create_date).getTime() : 0;
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

export const sortOrdersByQuantity = <T extends { items?: OrderItemLike[] }>(orders: T[] = [], ascending: boolean = false): T[] => {
    return [...orders].sort((a, b) => {
        const qtyA = getTotalItemsQuantity(a.items);
        const qtyB = getTotalItemsQuantity(b.items);
        return ascending ? qtyA - qtyB : qtyB - qtyA;
    });
};

/**
 * Get navigation path after all items are served (Confirm Serve)
 * @param order - The order object
 * @returns The target navigation path
 */
export const getPostConfirmServeNavigationPath = (order: OrderLike | SalesOrder): string => {
    // Both DineIn and Others -> Go to Payment page for that specific order
    const orderId = (order as any).id;
    if (orderId) {
        return `/pos/items/${orderId}`;
    }

    // Fallback to orders list
    return '/pos/orders';
};

/**
 * Get navigation path after an order is successfully created
 * @param orderType - The type of order created
 * @returns The target navigation path
 */
export const getPostCreateOrderNavigationPath = (orderType: string): string => {
    if (orderType === 'DineIn') {
        return '/pos/channels/dine-in';
    }
    return '/pos/orders';
};

/**
 * Get navigation path for editing an order (Order Detail page)
 * @param orderId - The ID of the order to edit
 * @returns The target navigation path
 */
export const getEditOrderNavigationPath = (orderId: string): string => {
    return `/pos/orders/${orderId}`;
};

/**
 * Get navigation path after an order is cancelled
 * @param orderType - The type of order that was cancelled
 * @returns The target navigation path
 */
export const getCancelOrderNavigationPath = (orderType: string): string => {
    if (orderType === 'DineIn') {
        return '/pos/channels/dine-in';
    }
    return '/pos/orders';
};

