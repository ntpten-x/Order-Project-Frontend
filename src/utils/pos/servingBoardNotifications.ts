import type { ServingBoardGroup } from "../../types/api/pos/servingBoard";

export const FALLBACK_NOTICE_COOLDOWN_MS = 1200;
export const ENTITY_NOTICE_COOLDOWN_MS = 10000;

export function dedupeStrings(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getGroupNotificationKeys(group: ServingBoardGroup): string[] {
    return dedupeStrings([
        group.id ? `group:${group.id}` : null,
        group.order_id ? `order:${group.order_id}` : null,
    ]);
}

export function getPayloadNotificationKeys(payload: unknown): string[] {
    if (!payload) return [];
    if (typeof payload === "string") return [`entity:${payload}`];
    if (typeof payload !== "object") return [];

    const entity = payload as {
        id?: string;
        order_id?: string;
        data?: { id?: string; order_id?: string };
    };

    return dedupeStrings([
        entity.id ? `entity:${entity.id}` : null,
        entity.order_id ? `order:${entity.order_id}` : null,
        entity.data?.id ? `entity:${entity.data.id}` : null,
        entity.data?.order_id ? `order:${entity.data.order_id}` : null,
    ]);
}

export function pruneNotificationCooldowns(
    cooldowns: Map<string, number>,
    now: number,
    ttlMs: number = ENTITY_NOTICE_COOLDOWN_MS,
) {
    cooldowns.forEach((timestamp, key) => {
        if (now - timestamp >= ttlMs) {
            cooldowns.delete(key);
        }
    });
}

export function areNotificationKeysCoolingDown(
    cooldowns: Map<string, number>,
    keys: string[],
    now: number,
    fallbackLastNoticeAt: number,
    fallbackCooldownMs: number = FALLBACK_NOTICE_COOLDOWN_MS,
    entityCooldownMs: number = ENTITY_NOTICE_COOLDOWN_MS,
) {
    if (!keys.length) {
        return now - fallbackLastNoticeAt < fallbackCooldownMs;
    }

    pruneNotificationCooldowns(cooldowns, now, entityCooldownMs);
    return keys.some((key) => {
        const lastTimestamp = cooldowns.get(key);
        return typeof lastTimestamp === "number" && now - lastTimestamp < entityCooldownMs;
    });
}

export function markNotificationKeys(
    cooldowns: Map<string, number>,
    keys: string[],
    now: number,
) {
    keys.forEach((key) => {
        cooldowns.set(key, now);
    });
}
