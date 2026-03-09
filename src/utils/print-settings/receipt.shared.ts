import { OrderType, SalesOrder } from "../../types/api/pos/salesOrder";
import { SalesOrderItem } from "../../types/api/pos/salesOrderItem";
import { Payments } from "../../types/api/pos/payments";
import { PaymentMethod } from "../../types/api/pos/paymentMethod";
import { groupOrderItems } from "../orderGrouping";
import { isCancelledStatus } from "../orders";

export type ReceiptPaymentWithMethod = Payments & {
    payment_method?: PaymentMethod | null;
};

export type ReceiptItem = ReturnType<typeof groupOrderItems<SalesOrderItem>>[number];

export const RECEIPT_TEXT = {
    currencySymbol: "฿",
    shopFallbackName: "ร้านค้า POS",
    logoAlt: "โลโกร้าน",
    phoneLabel: "โทร",
    taxIdLabel: "เลขผู้เสียภาษี",
    title: "ใบเสร็จรับเงิน / ใบกำกับอย่างย่อ",
    orderNoLabel: "เลขที่ออเดอร์",
    createdAtLabel: "วันที่ทำรายการ",
    orderTypeLabel: "ประเภทออเดอร์",
    tableLabel: "โต๊ะ",
    customerLabel: "ลูกค้า",
    deliveryCodeLabel: "รหัสเดลิเวอรี่",
    employeeLabel: "พนักงาน",
    itemsLabel: "รายการสินค้า",
    itemsCountSuffix: "รายการ",
    fallbackItemName: "สินค้า",
    quantityMultiplier: "x",
    itemUnitSuffix: "ชิ้น",
    noteLabel: "หมายเหตุ",
    subtotalLabel: "รวมก่อนส่วนลด",
    discountLabel: "ส่วนลด",
    vatLabel: "ภาษีมูลค่าเพิ่ม (VAT)",
    totalLabel: "ยอดสุทธิ",
    paymentSectionLabel: "การชำระเงิน",
    paymentFallbackLabel: "ไม่ระบุวิธีชำระ",
    paymentTotalLabel: "รวมชำระ",
    receivedAmountLabel: "รับเงิน",
    changeAmountLabel: "เงินทอน",
    noPaymentsLabel: "ยังไม่มีข้อมูลการชำระเงิน",
    footerThankYou: "ขอบคุณที่ใช้บริการ",
    footerItemCountLabel: "จำนวนสินค้ารวม",
    footerPrintedAtLabel: "พิมพ์เมื่อ",
} as const;

export function formatReceiptMoney(value: unknown, locale: string = "th-TH"): string {
    return `${RECEIPT_TEXT.currencySymbol}${Number(value || 0).toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

export function getReceiptOrderTypeLabel(type: OrderType | string | undefined): string {
    if (type === OrderType.DineIn) return "ทานที่ร้าน";
    if (type === OrderType.TakeAway) return "กลับบ้าน";
    if (type === OrderType.Delivery) return "เดลิเวอรี่";
    return String(type || "-");
}

export function buildReceiptViewModel(order: SalesOrder) {
    const items = groupOrderItems((order.items || []).filter((item) => !isCancelledStatus(item.status)));
    const payments = (order.payments || []) as ReceiptPaymentWithMethod[];

    return {
        items,
        payments,
        subTotal: Number(order.sub_total || 0),
        discountAmount: Number(order.discount_amount || 0),
        vat: Number(order.vat || 0),
        totalAmount: Number(order.total_amount || 0),
        receivedAmount: Number(order.received_amount || 0),
        changeAmount: Number(order.change_amount || 0),
        totalQty: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        paymentTotal: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
}
