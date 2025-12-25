import { Role } from "./roles";

export interface User {
    id: string;
    username: string;
    password?: string;
    roles_id?: string;
    roles?: Role;
    create_date?: string;
    last_login_at?: string;
    is_use?: boolean;
    is_active?: boolean;
}
