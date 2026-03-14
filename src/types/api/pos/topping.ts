import { Category } from "./category";
import { ToppingGroup } from "./toppingGroup";

export interface Topping {
    id: string;
    display_name: string;
    price: number;
    price_delivery?: number;
    img?: string | null;
    create_date: Date;
    update_date: Date;
    is_active: boolean;
    categories?: Category[];
    category_ids?: string[];
    topping_groups?: ToppingGroup[];
    topping_group_ids?: string[];
}
