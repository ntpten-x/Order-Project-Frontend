import { Role } from "./roles";
import { Branch } from "./branch";

export interface User {
    id: string;
    username: string;
    name?: string;
    password?: string;
    roles_id?: string;
    roles?: Role;
    branch_id?: string;
    branch?: Branch;
    create_date?: string;
    last_login_at?: string;
    is_use?: boolean;
    is_active?: boolean;
}
