import { z } from "zod";
import { AuditActionType } from "../../types/api/audit";

export const AuditLogSchema = z.object({
    id: z.string(),
    action_type: z.nativeEnum(AuditActionType),
    user_id: z.string().uuid().nullable().optional(),
    username: z.string().nullable().optional(),
    ip_address: z.string(),
    user_agent: z.string().nullable().optional(),
    entity_type: z.string().nullable().optional(),
    entity_id: z.string().uuid().nullable().optional(),
    branch_id: z.string().uuid().nullable().optional(),
    old_values: z.record(z.string(), z.unknown()).nullable().optional(),
    new_values: z.record(z.string(), z.unknown()).nullable().optional(),
    description: z.string().nullable().optional(),
    path: z.string().nullable().optional(),
    method: z.string().nullable().optional(),
    created_at: z
        .string()
        .or(z.date())
        .transform((val) => new Date(val)),
});

export const AuditLogsResponseSchema = z.array(AuditLogSchema);
