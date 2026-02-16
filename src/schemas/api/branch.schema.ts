import { z } from 'zod';

export const BranchSchema = z.object({
    id: z.string(),
    branch_name: z.string(),
    branch_code: z.string(),
    address: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    tax_id: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
    create_date: z.coerce.date(),
});

export const BranchesResponseSchema = z.array(BranchSchema);
