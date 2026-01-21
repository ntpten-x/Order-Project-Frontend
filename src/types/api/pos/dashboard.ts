export interface SalesSummary {
    date: string;
    total_orders: number;
    total_sales: number;
    total_discount: number;
    cash_sales: number;
    qr_sales: number;
}

export interface TopItem {
    product_id: string;
    product_name: string;
    img_url: string;
    category_id?: string;
    total_quantity: number;
    total_revenue: number;
}
