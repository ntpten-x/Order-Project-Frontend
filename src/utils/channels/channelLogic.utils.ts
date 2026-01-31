import { Tables, TableStatus } from "../../types/api/pos/tables";
import { SalesOrder, SalesOrderSummary, OrderStatus } from "../../types/api/pos/salesOrder";

/**
 * Table statistics and grouping
 */
export interface TableStats {
    total: number;
    available: number;
    occupied: number;
    inactive: number;
}

/**
 * Get statistics from table list
 */
export function getTableStats(tables: Tables[]): TableStats {
    const stats: TableStats = {
        total: tables.length,
        available: 0,
        occupied: 0,
        inactive: 0,
    };

    tables.forEach(table => {
        if (!table.is_active) {
            stats.inactive++;
        } else if (table.status === TableStatus.Available) {
            stats.available++;
        } else {
            stats.occupied++;
        }
    });

    return stats;
}

/**
 * Sort tables by name (handles both numeric and alphanumeric names)
 */
export function sortTables(tables: Tables[]): Tables[] {
    return [...tables].sort((a, b) => {
        // Try to extract numbers from table names
        const aNum = parseInt(a.table_name.replace(/\D/g, ''));
        const bNum = parseInt(b.table_name.replace(/\D/g, ''));

        // If both have numbers, sort by number
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }

        // Otherwise, sort alphabetically
        return a.table_name.localeCompare(b.table_name);
    });
}

/**
 * Filter active tables only
 */
export function getActiveTables(tables: Tables[]): Tables[] {
    return tables.filter(table => table.is_active);
}

/**
 * Get table color scheme based on status
 */
export function getTableColorScheme(table: Tables) {
    if (!table.is_active) {
        return 'inactive';
    }

    if (table.active_order_status === 'WaitingForPayment') {
        return 'waitingForPayment';
    }

    return table.status === TableStatus.Available ? 'available' : 'occupied';
}

/**
 * Format order status to Thai
 */
export function formatOrderStatus(status?: string): string {
    if (!status) return '';

    const statusMap: Record<string, string> = {
        'Pending': 'กำลังดำเนินการ',
        'Cooking': 'กำลังปรุง',
        'Served': 'เสิร์ฟแล้ว',
        'WaitingForOrder': 'รอรับออเดอร์',
        'WaitingForPayment': 'รอชำระเงิน',
        'Paid': 'ชำระเงินแล้ว',
        'Completed': 'เสร็จสมบูรณ์',
        'Cancelled': 'ยกเลิก',
    };

    return statusMap[status] || status;
}

/**
 * Order statistics for non-dine-in channels
 */
export interface OrderChannelStats {
    total: number;
    pending: number;
    cooking: number;
    served: number;
}

/**
 * Get statistics from order list
 */
type OrderLike = Pick<SalesOrder, "status"> | Pick<SalesOrderSummary, "status">;

export function getOrderChannelStats(orders: OrderLike[]): OrderChannelStats {
    return orders.reduce((acc, order) => {
        acc.total++;
        if (order.status === OrderStatus.Pending) acc.pending++;
        if (order.status === OrderStatus.Cooking) acc.cooking++;
        if (order.status === OrderStatus.Served) acc.served++;
        return acc;
    }, { total: 0, pending: 0, cooking: 0, served: 0 });
}

/**
 * Get order color scheme based on status
 */
export function getOrderColorScheme(order: Pick<SalesOrder, "status"> | Pick<SalesOrderSummary, "status">) {
    switch (order.status) {
        case OrderStatus.Pending:
            return 'occupied'; // Orange/Active
        case OrderStatus.Cooking:
            return 'occupied'; // Keep it active
        case OrderStatus.Served:
            return 'waitingForPayment'; // Blue/Ready
        case OrderStatus.Paid:
            return 'available'; // Green/Done
        default:
            return 'inactive';
    }
}
