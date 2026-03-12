import { Category } from "./category";

export interface Topping {
    id: string;
    display_name: string;
    price: number;
    create_date: Date;
    update_date: Date;
    is_active: boolean;
    categories?: Category[];
    category_ids?: string[];
}
