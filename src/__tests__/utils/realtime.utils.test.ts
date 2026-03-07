import { matchesRealtimeEntityPayload } from "../../utils/pos/realtime";

describe("matchesRealtimeEntityPayload", () => {
    it("matches direct id payloads", () => {
        expect(matchesRealtimeEntityPayload({ id: "order-1" }, "order-1")).toBe(true);
        expect(matchesRealtimeEntityPayload({ order_id: "order-1" }, "order-1")).toBe(true);
    });

    it("matches nested data payloads", () => {
        expect(matchesRealtimeEntityPayload({ data: { id: "order-2" } }, "order-2")).toBe(true);
        expect(matchesRealtimeEntityPayload({ data: { order_id: "order-2" } }, "order-2")).toBe(true);
    });

    it("matches string payloads", () => {
        expect(matchesRealtimeEntityPayload("order-3", "order-3")).toBe(true);
        expect(matchesRealtimeEntityPayload("order-4", "order-3")).toBe(false);
    });

    it("returns false for unrelated or empty payloads", () => {
        expect(matchesRealtimeEntityPayload({ id: "other-order" }, "order-5")).toBe(false);
        expect(matchesRealtimeEntityPayload(null, "order-5")).toBe(false);
        expect(matchesRealtimeEntityPayload(undefined, "order-5")).toBe(false);
        expect(matchesRealtimeEntityPayload({ data: {} }, "order-5")).toBe(false);
    });
});
