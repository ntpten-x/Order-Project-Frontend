import { Tables, TableStatus } from "@/types/api/pos/tables";

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
    return table.status === TableStatus.Available ? 'available' : 'occupied';
}

/**
 * Format order status to Thai
 */
export function formatOrderStatus(status?: string): string {
    if (!status) return '';

    const statusMap: Record<string, string> = {
        'Pending': 'รอรับออเดอร์',
        'Cooking': 'กำลังปรุง',
        'Served': 'เสิร์ฟแล้ว',
        'WaitingForPayment': 'รอชำระเงิน',
        'Paid': 'ชำระแล้ว',
        'Cancelled': 'ยกเลิก',
    };

    return statusMap[status] || status;
}
