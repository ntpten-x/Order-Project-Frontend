import { Category } from "./category";
import { ProductsUnit } from "./productsUnit";

export interface Products {
    id: string;
    product_name: string;
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
}
