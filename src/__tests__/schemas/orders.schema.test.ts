import { OrdersResponseSchema } from "../../schemas/api/pos/orders.schema";

describe("Orders schema", () => {
    it("keeps created_by.name so dashboard and receipt can display employee name", () => {
        const parsed = OrdersResponseSchema.parse({
            data: [
                {
                    id: "order-1",
                    order_no: "ORD-1",
                    order_type: "DineIn",
                    status: "Paid",
                    sub_total: 100,
                    discount_amount: 0,
                    vat: 0,
                    total_amount: 100,
                    received_amount: 100,
                    change_amount: 0,
                    create_date: "2026-02-19T00:00:00.000Z",
                    update_date: "2026-02-19T00:00:00.000Z",
                    created_by: {
                        id: "u-1",
                        username: "admin",
                        name: "System Administrator",
                    },
                },
            ],
            total: 1,
            page: 1,
            last_page: 1,
        });

        expect(parsed.data[0].created_by?.name).toBe("System Administrator");
    });
});
