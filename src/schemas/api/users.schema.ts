import { z } from 'zod';
import { RoleSchema } from './roles.schema';
import { BranchSchema } from './branch.schema';

export const UserSchema = z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().optional().nullable(),
    roles_id: z.string().optional().nullable(),
    roles: RoleSchema.optional().nullable(),
    branch_id: z.string().optional().nullable(),
    branch: BranchSchema.optional().nullable(),
    create_date: z.coerce.date().optional(),
    last_login_at: z.coerce.date().optional().nullable(),
    is_use: z.boolean().optional().default(true),
    is_active: z.boolean().optional().default(false),
});

export const UsersResponseSchema = z.array(UserSchema);
