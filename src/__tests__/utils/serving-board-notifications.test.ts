import { OrderType } from "../../types/api/pos/salesOrder";
import type { ServingBoardGroup } from "../../types/api/pos/servingBoard";
import {
    areNotificationKeysCoolingDown,
    ENTITY_NOTICE_COOLDOWN_MS,
    FALLBACK_NOTICE_COOLDOWN_MS,
    getGroupNotificationKeys,
    getPayloadNotificationKeys,
    markNotificationKeys,
    pruneNotificationCooldowns,
} from "../../utils/pos/servingBoardNotifications";

function createGroup(overrides: Partial<ServingBoardGroup> = {}): ServingBoardGroup {
    return {
        id: "group-1",
        order_id: "order-1",
        order_no: "ORD-001",
        order_type: OrderType.DineIn,
        order_status: "Pending",
        source_title: "Table A1",
        source_subtitle: null,
        batch_created_at: new Date().toISOString(),
        pending_count: 2,
        served_count: 0,
        total_items: 2,
        items: [],
        ...overrides,
    };
}

describe("servingBoardNotifications", () => {
    it("extracts group and order notification keys", () => {
        expect(getGroupNotificationKeys(createGroup())).toEqual([
            "group:group-1",
            "order:order-1",
        ]);
    });

    it("extracts deduped keys from realtime payload", () => {
        expect(
            getPayloadNotificationKeys({
                id: "entity-1",
                order_id: "order-1",
                data: { id: "entity-1", order_id: "order-2" },
            }),
        ).toEqual(["entity:entity-1", "order:order-1", "order:order-2"]);
    });

    it("uses fallback cooldown when there are no entity keys", () => {
        expect(
            areNotificationKeysCoolingDown(
                new Map(),
                [],
                2_000,
                1_500,
                FALLBACK_NOTICE_COOLDOWN_MS,
                ENTITY_NOTICE_COOLDOWN_MS,
            ),
        ).toBe(true);
    });

    it("tracks cooldown per entity key", () => {
        const cooldowns = new Map<string, number>();
        markNotificationKeys(cooldowns, ["group:group-1"], 10_000);

        expect(
            areNotificationKeysCoolingDown(
                cooldowns,
                ["group:group-1"],
                15_000,
                0,
                FALLBACK_NOTICE_COOLDOWN_MS,
                ENTITY_NOTICE_COOLDOWN_MS,
            ),
        ).toBe(true);

        expect(
            areNotificationKeysCoolingDown(
                cooldowns,
                ["group:group-1"],
                20_500,
                0,
                FALLBACK_NOTICE_COOLDOWN_MS,
                ENTITY_NOTICE_COOLDOWN_MS,
            ),
        ).toBe(false);
    });

    it("prunes expired cooldown entries", () => {
        const cooldowns = new Map<string, number>([
            ["group:expired", 1_000],
            ["group:active", 9_500],
        ]);

        pruneNotificationCooldowns(cooldowns, 11_100, ENTITY_NOTICE_COOLDOWN_MS);

        expect([...cooldowns.keys()]).toEqual(["group:active"]);
    });
});
