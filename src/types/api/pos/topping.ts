import { Category } from "./category";

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
}
