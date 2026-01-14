import { OrderType, OrderStatus } from "./orders";

export interface PosHistory {
    id: string;
    order_id?: string;
    order_no: string;
    order_type: OrderType;
    table_id?: string | null;
    delivery_id?: string | null;
    created_by_id?: string | null;

    sub_total: number;
    discount_amount: number;
    vat: number;
    total_amount: number;
    received_amount: number;
    change_amount: number;

    status: OrderStatus;

    create_date: string;
    end_date: string;

    items_snapshot?: any;
    payments_snapshot?: any;
    additional_data?: any;
}
