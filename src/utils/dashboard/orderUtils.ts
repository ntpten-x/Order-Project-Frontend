import { SalesOrderItem, ItemStatus } from "../../types/api/pos/salesOrderItem";

/**
 * Sorts order items so that non-cancelled items appear first,
 * and cancelled items appear at the bottom.
 */
export const sortOrderItems = (items: SalesOrderItem[]): SalesOrderItem[] => {
    return [...items].sort((a, b) => {
        const aIsCancelled = a.status === ItemStatus.Cancelled;
        const bIsCancelled = b.status === ItemStatus.Cancelled;

        if (aIsCancelled && !bIsCancelled) return 1;
        if (!aIsCancelled && bIsCancelled) return -1;
        return 0;
    });
};

/**
 * Determines if a row should have a highlighted style based on item status.
 */
export const getItemRowStyle = (status: string) => {
    if (status === ItemStatus.Cancelled) {
        return {
            backgroundColor: '#fff1f0', // Light red background (Ant Design red-1)
            transition: 'all 0.3s'
        };
    }
    return {};
};

/**
 * Returns the CSS class or style for the item status text.
 */
export const getStatusTextStyle = (status: string) => {
    if (status === ItemStatus.Cancelled) {
        return {
            color: '#f5222d',
            fontWeight: 'bold'
        };
    }
    return {};
};
