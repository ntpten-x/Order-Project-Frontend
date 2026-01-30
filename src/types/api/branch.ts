export interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
    address?: string; // Optional
    phone?: string;   // Optional
    tax_id?: string;  // Optional
    is_active: boolean;
    create_date: string; // ISO Date string
}

export interface CreateBranchInput {
    branch_name: string;
    branch_code: string;
    address?: string;
    phone?: string;
    tax_id?: string;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
    is_active?: boolean;
}
