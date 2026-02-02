export enum QueueStatus {
    Pending = "Pending",
    Processing = "Processing",
    Completed = "Completed",
    Cancelled = "Cancelled"
}

export enum QueuePriority {
    Low = "Low",
    Normal = "Normal",
    High = "High",
    Urgent = "Urgent"
}

export interface OrderQueue {
    id: string;
    order_id: string;
    branch_id?: string;
    status: QueueStatus;
    priority: QueuePriority;
    queue_position: number;
    started_at?: string;
    completed_at?: string;
    notes?: string;
    created_at: string;
    order?: {
        id: string;
        order_no: string;
        order_type: string;
        status: string;
    };
}

export interface CreateOrderQueueDTO {
    orderId: string;
    priority?: QueuePriority;
}

export interface UpdateOrderQueueStatusDTO {
    status: QueueStatus;
}
