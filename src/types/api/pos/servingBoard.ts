import { OrderType } from "./salesOrder";

export enum ServingStatus {
    PendingServe = "PendingServe",
    Served = "Served",
}

export interface ServingBoardItem {
    id: string;
    product_id: string;
    display_name: string;
    product_image_url: string | null;
    quantity: number;
    notes: string | null;
    serving_status: ServingStatus;
    details: { detail_name: string; extra_price: number }[];
}

export interface ServingBoardGroup {
    id: string;
    order_id: string;
    order_no: string;
    order_type: OrderType;
    order_status: string;
    customer_name?: string | null;
    source_title: string;
    source_subtitle: string | null;
    batch_created_at: string;
    pending_count: number;
    served_count: number;
    total_items: number;
    items: ServingBoardItem[];
}
