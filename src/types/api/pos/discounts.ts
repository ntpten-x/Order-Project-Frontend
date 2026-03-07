export enum DiscountType {
    Fixed = "Fixed",
    Percentage = "Percentage",
}

export interface Discounts {
    id: string;
    display_name: string;
    description?: string;
    discount_amount: number;
    discount_type: DiscountType;
    is_active: boolean;
    create_date: string;
}
