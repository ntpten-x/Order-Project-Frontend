import { Role } from "./roles";

export interface User {
    id: number;
    username: string;
    password?: string;
    roles_id?: number;
    roles?: Role;
}
