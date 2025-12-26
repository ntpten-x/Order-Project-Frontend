export interface User {
    id: string;
    username: string;
    role: string;
    display_name?: string;
    is_active?: boolean;
    is_use?: boolean;
}

export interface LoginResponse {
    message: string;
    user: User;
}

export interface LoginCredentials {
    username?: string;
    password?: string;
}
