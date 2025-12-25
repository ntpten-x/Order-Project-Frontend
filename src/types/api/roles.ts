import { User } from "./users";

export interface Role {
    id: string;
    roles_name: string;
    display_name: string;
    users?: User[];
}
