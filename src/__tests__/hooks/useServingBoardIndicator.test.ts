import { OrderType } from "../../types/api/pos/salesOrder";
import type { ServingBoardGroup } from "../../types/api/pos/servingBoard";
import {
  countServingBoardPendingItems,
  countServingBoardTotalItems,
} from "../../hooks/pos/useServingBoardIndicator";

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
    pending_count: 0,
    served_count: 0,
    total_items: 0,
    items: [],
    ...overrides,
  };
}

describe("useServingBoardIndicator helpers", () => {
  it("counts only pending items for the red dot", () => {
    const groups = [
      createGroup({ pending_count: 3, served_count: 0, total_items: 3 }),
      createGroup({
        id: "group-2",
        order_id: "order-2",
        pending_count: 0,
        served_count: 4,
        total_items: 4,
      }),
    ];

    expect(countServingBoardPendingItems(groups)).toBe(3);
    expect(countServingBoardTotalItems(groups)).toBe(7);
  });

  it("returns zero when only served items remain", () => {
    const groups = [
      createGroup({
        pending_count: 0,
        served_count: 2,
        total_items: 2,
      }),
    ];

    expect(countServingBoardPendingItems(groups)).toBe(0);
  });
});
