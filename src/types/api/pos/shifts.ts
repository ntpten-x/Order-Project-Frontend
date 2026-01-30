export enum ShiftStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

export interface Shift {
    id: string;
    user_id: string;
    user?: {
        id: string;
        username: string;
        display_name?: string;
    };
    start_amount: number;
    end_amount?: number;
    expected_amount?: number;
    diff_amount?: number;
    status: ShiftStatus;
    open_time: string;
    close_time?: string;
    create_date: string;
    update_date: string;
}

export interface ShiftSummary {
    shift_info: {
        start_amount: number | string;
        end_amount?: number | string;
        diff_amount?: number | string;
    };
    summary: {
        total_sales: number | string;
        net_profit: number | string;
        payment_methods?: Record<string, number | string>;
        order_types?: {
            DineIn?: number | string;
            TakeAway?: number | string;
            Delivery?: number | string;
        };
    };
    categories: Record<string, number>;
    top_products: Array<{
        id: string;
        name: string;
        quantity: number;
        unit?: string;
        revenue: number | string;
    }>;
}
