import { Tables, TableStatus } from "../../types/api/pos/tables";

/**
 * Determines the navigation link for a given table based on its status.
 * 
 * Logic:
 * 1. WaitingForPayment -> /pos/items/[orderId] (Payment Page)
 * 2. Occupied (Unavailable) + Active Order -> /pos/orders/[orderId] (Order Details)
 * 3. Available -> /pos/channels/dine-in/[tableId] (Create Order)
 */
export const getTableLink = (table: Tables): string => {
    // If inactive, return current location or handler will prevent default
    if (!table.is_active) {
        return '#';
    }

    // 1. Waiting for Payment
    if (table.active_order_status === 'WaitingForPayment' && table.active_order_id) {
        return `/pos/items/${table.active_order_id}`;
    }

    // 2. Active Order (Pending, Cooking, Served) AND Table is not Available
    if (table.status !== TableStatus.Available && table.active_order_id) {
        return `/pos/orders/${table.active_order_id}`;
    }

    // 3. Default / Available -> Create Order Page
    return `/pos/channels/dine-in/${table.id}`;
};
