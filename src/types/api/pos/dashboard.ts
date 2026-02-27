export interface SalesSummary {
    date: string;
    total_orders: number;
    total_sales: number;
    total_discount: number;
    cash_sales: number;
    qr_sales: number;
    dine_in_sales: number;
    takeaway_sales: number;
    delivery_sales: number;
}

export interface TopItem {
    product_id: string;
    product_name: string;
    img_url: string;
    category_id?: string;
    total_quantity: number;
    total_revenue: number;
}

export interface RecentOrderSummary {
    id: string;
    order_no: string;
    order_type: "DineIn" | "TakeAway" | "Delivery" | string;
    status: string;
    create_date: string;
    update_date?: string;
    total_amount: number;
    delivery_code?: string | null;
    table?: { table_name?: string | null } | null;
    delivery?: { delivery_name?: string | null } | null;
    items_count: number;
}

export interface DashboardOverview {
    summary: {
        period_start: string | null;
        period_end: string | null;
        total_sales: number;
        total_orders: number;
        total_discount: number;
        average_order_value: number;
        cash_sales: number;
        qr_sales: number;
        dine_in_sales: number;
        takeaway_sales: number;
        delivery_sales: number;
    };
    daily_sales: SalesSummary[];
    top_items: TopItem[];
    recent_orders: RecentOrderSummary[];
}
