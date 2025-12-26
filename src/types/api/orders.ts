import { User } from "./users";
import { OrdersItem } from "./ordersDetail";

export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

export interface Order {
    id: string;
    ordered_by_id: string;
    ordered_by?: User;
    status: OrderStatus;
    remark?: string;
    create_date: string;
    update_date: string;
    ordersItems?: OrdersItem[];
}
