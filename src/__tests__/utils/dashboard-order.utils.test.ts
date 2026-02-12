import { sortOrderItems } from "../../utils/dashboard/orderUtils";
import { SalesOrderItem } from "../../types/api/pos/salesOrderItem";

describe("Dashboard order utils", () => {
    test("sortOrderItems moves cancelled items to bottom", () => {
        const items: SalesOrderItem[] = [
            { id: "1", order_id: "o1", product_id: "p1", quantity: 1, price: 10, discount_amount: 0, total_price: 10, status: "cancelled" },
            { id: "2", order_id: "o1", product_id: "p2", quantity: 1, price: 20, discount_amount: 0, total_price: 20, status: "Paid" },
            { id: "3", order_id: "o1", product_id: "p3", quantity: 1, price: 30, discount_amount: 0, total_price: 30, status: "Cancelled" },
            { id: "4", order_id: "o1", product_id: "p4", quantity: 1, price: 40, discount_amount: 0, total_price: 40, status: "Cooking" },
        ];
        const sorted = sortOrderItems([
            ...items,
        ]);

        expect(sorted.map((i) => i.id)).toEqual(["2", "4", "1", "3"]);
    });
});
