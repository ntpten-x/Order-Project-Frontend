export enum PromotionType {
    BuyXGetY = "BuyXGetY",
    PercentageOff = "PercentageOff",
    FixedAmountOff = "FixedAmountOff",
    FreeShipping = "FreeShipping",
    Bundle = "Bundle",
    MinimumPurchase = "MinimumPurchase"
}

export enum PromotionCondition {
    AllProducts = "AllProducts",
    SpecificCategory = "SpecificCategory",
    SpecificProduct = "SpecificProduct",
    MinimumAmount = "MinimumAmount"
}

export interface Promotions {
    id: string;
    promotion_code: string;
    name: string;
    description?: string;
    branch_id?: string;
    promotion_type: PromotionType;
    condition_type: PromotionCondition;
    condition_value?: string;
    discount_amount?: number;
    discount_percentage?: number;
    minimum_purchase?: number;
    buy_quantity?: number;
    get_quantity?: number;
    start_date?: string;
    end_date?: string;
    usage_limit?: number;
    usage_count?: number;
    usage_limit_per_user?: number;
    is_active: boolean;
    create_date: string;
    update_date: string;
}

export interface ValidatePromotionDTO {
    code: string;
    orderItems: Array<{
        product_id: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
}

export interface PromotionEligibility {
    eligible: boolean;
    discountAmount: number;
    message?: string;
}
