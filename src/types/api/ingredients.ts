import { IngredientsUnit } from "./ingredientsUnit";

export interface Ingredients {
    id: string;
    ingredient_name: string;
    display_name: string;
    description: string;
    is_active: boolean;
    img_url: string;
    unit_id: string;
    create_date?: string;
    unit?: IngredientsUnit;
}
