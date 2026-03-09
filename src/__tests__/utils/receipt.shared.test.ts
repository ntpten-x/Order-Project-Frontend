import {
    buildReceiptViewModel,
    formatReceiptMoney,
    getReceiptOrderTypeLabel,
    RECEIPT_TEXT,
} from "../../utils/print-settings/receipt.shared";
import { OrderStatus, OrderType, type SalesOrder } from "../../types/api/pos/salesOrder";
import { ItemStatus } from "../../types/api/pos/salesOrderItem";

describe("receipt.shared", () => {
    const baseOrder: SalesOrder = {
        id: "o1",
        order_no: "ORD-001",
        order_type: OrderType.DineIn,
        sub_total: 230,
        discount_amount: 10,
        vat: 0,
        total_amount: 220,
        received_amount: 300,
        change_amount: 80,
        status: OrderStatus.Paid,
        create_date: "2026-03-07T10:00:00.000Z",
        update_date: "2026-03-07T10:00:00.000Z",
        items: [
            {
                id: "i1",
                order_id: "o1",
                product_id: "p1",
                quantity: 1,
                price: 100,
                discount_amount: 0,
                total_price: 100,
                status: ItemStatus.Pending,
                product: { id: "p1", display_name: "Espresso" } as never,
            },
            {
                id: "i2",
                order_id: "o1",
                product_id: "p1",
                quantity: 2,
                price: 50,
                discount_amount: 0,
                total_price: 100,
                status: ItemStatus.Pending,
                product: { id: "p1", display_name: "Espresso" } as never,
            },
            {
                id: "i3",
                order_id: "o1",
                product_id: "p2",
                quantity: 1,
                price: 30,
                discount_amount: 0,
                total_price: 30,
                status: ItemStatus.Cancelled,
                product: { id: "p2", display_name: "Tea" } as never,
            },
        ],
        payments: [
            { id: "pay1", amount: 120 },
            { id: "pay2", amount: 100 },
        ] as never,
    };

    it("formats money in baht", () => {
        expect(formatReceiptMoney(1250.5)).toBe("฿1,250.5");
    });

    it("returns thai order type labels", () => {
        expect(getReceiptOrderTypeLabel(OrderType.DineIn)).toBe("ทานที่ร้าน");
        expect(getReceiptOrderTypeLabel(OrderType.TakeAway)).toBe("กลับบ้าน");
        expect(getReceiptOrderTypeLabel(OrderType.Delivery)).toBe("เดลิเวอรี่");
    });

    it("builds receipt summary excluding cancelled items and grouping duplicates", () => {
        const viewModel = buildReceiptViewModel(baseOrder);

        expect(viewModel.items).toHaveLength(1);
        expect(viewModel.items[0].quantity).toBe(3);
        expect(viewModel.totalQty).toBe(3);
        expect(viewModel.paymentTotal).toBe(220);
        expect(viewModel.totalAmount).toBe(220);
    });

    it("exposes stable thai labels for receipt rendering", () => {
        expect(RECEIPT_TEXT.title).toBe("ใบเสร็จรับเงิน / ใบกำกับอย่างย่อ");
        expect(RECEIPT_TEXT.footerThankYou).toBe("ขอบคุณที่ใช้บริการ");
    });
});
