import { Category } from "./category";
import { ProductsUnit } from "./productsUnit";
import { ToppingGroup } from "./toppingGroup";

export interface Products {
    id: string;
    display_name: string;
    description: string;
    price: number;
    price_delivery?: number;
    category_id: string;
    unit_id: string;
    img_url: string | null;
    create_date: Date;
    update_date: Date;
    is_active: boolean;
    category?: Category;
    unit?: ProductsUnit;
    topping_groups?: ToppingGroup[];
    topping_group_ids?: string[];
}
