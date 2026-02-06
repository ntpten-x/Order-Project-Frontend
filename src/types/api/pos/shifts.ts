export enum ShiftStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

export interface Shift {
    id: string;
    user_id: string;
    opened_by_user_id?: string;
    closed_by_user_id?: string;
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
        expected_amount?: number | string;
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

export interface ShiftHistoryItem {
    id: string;
    user_id: string;
    opened_by_user_id?: string | null;
    closed_by_user_id?: string | null;
    start_amount: number;
    end_amount?: number | null;
    expected_amount?: number | null;
    diff_amount?: number | null;
    status: ShiftStatus;
    open_time: string;
    close_time?: string | null;
    create_date: string;
    update_date: string;
    user?: {
        id: string;
        username: string;
        name?: string | null;
    } | null;
}

export interface ShiftHistoryPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface ShiftHistoryStats {
    total: number;
    open: number;
    closed: number;
    total_start_amount: number;
    total_end_amount: number;
    total_expected_amount: number;
    total_diff_amount: number;
}

export interface ShiftHistoryResponse {
    data: ShiftHistoryItem[];
    pagination: ShiftHistoryPagination;
    stats: ShiftHistoryStats;
}

export interface ShiftHistoryQuery {
    page?: number;
    limit?: number;
    q?: string;
    status?: ShiftStatus;
    date_from?: string;
    date_to?: string;
}
