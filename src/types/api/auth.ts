export interface User {
    id: string;
    username: string;
    role: string;
    name?: string;
    display_name?: string;
    is_active?: boolean;
    is_use?: boolean;
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
