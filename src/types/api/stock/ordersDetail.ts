import { User } from "../users";
import { Ingredients } from "./ingredients";
import { Order } from "./orders";

export interface OrdersDetail {
    id: string;
    orders_item_id: string;
    actual_quantity?: number;
    purchased_by_id?: string;
    purchased_by?: User;
    is_purchased: boolean;
    create_date: string;
}

export interface OrdersItem {
    id: string;
    ingredient_id: string;
    ingredient?: Ingredients;
    orders_id: string;
    orders?: Order;
    quantity_ordered: number;
    ordersDetail?: OrdersDetail;
}
