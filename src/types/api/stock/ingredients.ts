import { StockCategory } from "./category";
import { IngredientsUnit } from "./ingredientsUnit";

export interface Ingredients {
    id: string;
    display_name: string;
    description: string;
    is_active: boolean;
    img_url: string | null;
    unit_id: string;
    category_id: string | null;
    create_date?: string;
    unit?: IngredientsUnit;
    category?: StockCategory | null;
}
