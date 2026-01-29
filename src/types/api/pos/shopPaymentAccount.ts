export interface ShopPaymentAccount {
    id: string;
    shop_id: string;
    account_name: string;
    account_number: string;
    bank_name?: string;
    address?: string;
    phone?: string;
    account_type: 'PromptPay' | 'BankAccount';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreatePaymentAccountDto {
    account_name: string;
    account_number: string;
    bank_name?: string;
    address?: string;
    phone?: string;
    account_type?: 'PromptPay' | 'BankAccount';
    is_active?: boolean;
}
