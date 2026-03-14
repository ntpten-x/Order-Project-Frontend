import { Topping } from "./topping";

export interface SalesOrderDetail {
    id: string;
    orders_item_id: string;
    topping_id?: string | null;
    detail_name: string;
    extra_price: number;
    create_date: string;
    topping?: Topping | null;
}
