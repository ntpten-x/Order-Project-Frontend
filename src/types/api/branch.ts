export interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    is_active: boolean;
    create_date: string; // ISO Date string
}

export interface CreateBranchInput {
    branch_name: string;
    branch_code: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
    is_active?: boolean;
}
