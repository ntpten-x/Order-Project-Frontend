export interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
    address?: string;
    phone?: string;
    is_active: boolean;
}

export interface User {
    id: string;
    username: string;
    role: string;
    name?: string;
    display_name?: string;
    is_active?: boolean;
    is_use?: boolean;
    branch_id?: string;
    branch?: Branch;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: User;
}

export interface LoginCredentials {
    username?: string;
    password?: string;
}
