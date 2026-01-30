import { z } from 'zod';

export const RoleSchema = z.object({
    id: z.string(),
    roles_name: z.string(),
    display_name: z.string(),
});
