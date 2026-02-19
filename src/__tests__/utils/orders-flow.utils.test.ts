import {
    OrderStatus,
    OrderType,
    SalesOrder,
    SalesOrderSummary,
} from "../../types/api/pos/salesOrder";
import {
    calculateOrderTotal,
    getCancelOrderNavigationPath,
    createOrderPayload,
    getOrderNavigationPath,
    getOrderStatusText,
    isCancelledStatus,
} from "../../utils/orders";
import { calculatePaymentTotals } from "../../utils/payments";

describe("Orders flow utilities", () => {
    test("isCancelledStatus supports legacy lowercase status", () => {
        expect(isCancelledStatus("cancelled")).toBe(true);
        expect(isCancelledStatus(OrderStatus.Cancelled)).toBe(true);
        expect(isCancelledStatus(OrderStatus.Paid)).toBe(false);
    });

    test("calculateOrderTotal excludes cancelled items", () => {
        const total = calculateOrderTotal([
            { total_price: 100, status: OrderStatus.Paid },
            { total_price: 50, status: "cancelled" },
            { total_price: 25, status: OrderStatus.Cooking },
        ]);
        expect(total).toBe(125);
    });

    test("getOrderNavigationPath routes WaitingForPayment correctly (including legacy casing)", () => {
        const deliveryOrder = {
            id: "o-1",
            order_type: OrderType.Delivery,
            status: OrderStatus.WaitingForPayment,
        } as SalesOrderSummary;
        const dineInOrder = {
            id: "o-2",
            order_type: OrderType.DineIn,
            status: OrderStatus.WaitingForPayment,
        } as SalesOrderSummary;
        const paidOrder = {
            id: "o-3",
            order_type: OrderType.TakeAway,
            status: OrderStatus.Paid,
        } as SalesOrderSummary;
        const legacyDeliveryOrder = {
            id: "o-4",
            order_type: "delivery",
            status: "waitingforpayment",
        } as unknown as SalesOrderSummary;

        expect(getOrderNavigationPath(deliveryOrder)).toBe("/pos/items/delivery/o-1");
        expect(getOrderNavigationPath(dineInOrder)).toBe("/pos/items/payment/o-2");
        expect(getOrderNavigationPath(paidOrder)).toBe("/pos/orders/o-3");
        expect(getOrderNavigationPath(legacyDeliveryOrder)).toBe("/pos/items/delivery/o-4");
    });

    test("getCancelOrderNavigationPath supports mixed casing", () => {
        expect(getCancelOrderNavigationPath("delivery")).toBe("/pos/channels/delivery");
        expect(getCancelOrderNavigationPath("TakeAway")).toBe("/pos/channels/takeaway");
        expect(getCancelOrderNavigationPath("DINEIN")).toBe("/pos/channels/dine-in");
    });

    test("getOrderStatusText returns completed label", () => {
        expect(getOrderStatusText(OrderStatus.Completed)).toBe("สำเร็จ");
    });

    test("createOrderPayload keeps VAT at 0", () => {
        const payload = createOrderPayload(
            [{ product: { id: "p1", price: 100 }, quantity: 1 }],
            OrderType.DineIn,
            { subTotal: 100, discountAmount: 0, totalAmount: 100 },
            {}
        );
        expect(payload.vat).toBe(0);
    });

    test("calculatePaymentTotals uses backend total_amount as source of truth", () => {
        const order = {
            sub_total: 500,
            discount_amount: 120,
            vat: 0,
            total_amount: 333,
        } as SalesOrder;

        const totals = calculatePaymentTotals(order, 400);
        expect(totals.total).toBe(333);
        expect(totals.change).toBe(67);
    });
});
