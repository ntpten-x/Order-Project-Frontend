export enum TableStatus {
    Available = "Available",
    Unavailable = "Unavailable"
}

export interface Tables {
    id: string;
    table_name: string;
    status: TableStatus;
    active_order_status?: string;
    active_order_id?: string;
    create_date: string;
    update_date: string;
    is_active: boolean;
}

export interface TableQrInfo {
    table_id: string;
    table_name: string;
    qr_code_token: string | null;
    qr_code_expires_at: string | null;
    customer_path: string | null;
}
