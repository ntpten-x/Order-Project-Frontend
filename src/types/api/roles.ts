import { User } from "./users";

export interface Role {
    id: number;
    roles_name: string;
    display_name: string;
    users?: User[];
}
