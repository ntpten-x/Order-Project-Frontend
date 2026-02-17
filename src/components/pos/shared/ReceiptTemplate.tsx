"use client";

import React, { forwardRef } from "react";
import { SalesOrder, OrderType } from "../../../types/api/pos/salesOrder";
import { Payments } from "../../../types/api/pos/payments";
import { PaymentMethod } from "../../../types/api/pos/paymentMethod";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { groupOrderItems } from "../../../utils/orderGrouping";
import { isCancelledStatus } from "../../../utils/orders";
import { resolveImageSource } from "../../../utils/image/source";

dayjs.locale("th");

type PaymentWithMethod = Payments & {
  payment_method?: PaymentMethod | null;
};

interface ReceiptProps {
  order: SalesOrder;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopTaxId?: string;
  shopLogo?: string;
}

function formatMoney(value: number): string {
  return `฿${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function getOrderTypeText(type: OrderType): string {
  if (type === OrderType.DineIn) return "ทานที่ร้าน";
  if (type === OrderType.TakeAway) return "กลับบ้าน";
  if (type === OrderType.Delivery) return "เดลิเวอรี่";
  return String(type || "-");
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ order, shopName, shopAddress, shopPhone, shopTaxId, shopLogo }, ref) => {
    const items = (order.items || []).filter((item) => !isCancelledStatus(item.status));
    const payments = (order.payments || []) as PaymentWithMethod[];

    const subTotal = Number(order.sub_total || 0);
    const discountAmount = Number(order.discount_amount || 0);
    const vat = Number(order.vat || 0);
    const totalAmount = Number(order.total_amount || 0);
    const receivedAmount = Number(order.received_amount || 0);
    const changeAmount = Number(order.change_amount || 0);
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const paymentTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const resolvedShopLogo = resolveImageSource(shopLogo);

    const rowStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      gap: 8,
      alignItems: "flex-start",
      marginBottom: 4,
      fontSize: 12,
    };

    return (
      <div
        ref={ref}
        style={{
          width: "80mm",
          margin: "0 auto",
          padding: 12,
          color: "#111827",
          background: "#ffffff",
          fontFamily: "'Noto Sans Thai', Tahoma, sans-serif",
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          {resolvedShopLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedShopLogo}
              alt="โลโก้ร้าน"
              style={{
                width: 52,
                height: 52,
                objectFit: "contain",
                margin: "0 auto 8px",
                display: "block",
              }}
            />
          ) : null}
          <div style={{ fontSize: 18, fontWeight: 800 }}>{shopName || "ร้านค้า POS"}</div>
          {shopAddress ? <div style={{ color: "#4b5563", marginTop: 2 }}>{shopAddress}</div> : null}
          {shopPhone ? <div style={{ color: "#4b5563" }}>โทร {shopPhone}</div> : null}
          {shopTaxId ? <div style={{ color: "#4b5563" }}>เลขประจำตัวผู้เสียภาษี {shopTaxId}</div> : null}
        </div>

        <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>ใบเสร็จรับเงิน / ใบกำกับอย่างย่อ</div>
        </div>

        <div style={rowStyle}>
          <span style={{ color: "#4b5563" }}>เลขที่ออเดอร์</span>
          <strong>#{order.order_no}</strong>
        </div>
        <div style={rowStyle}>
          <span style={{ color: "#4b5563" }}>วันที่ทำรายการ</span>
          <span>{dayjs(order.create_date).format("DD/MM/YYYY HH:mm")}</span>
        </div>
        <div style={rowStyle}>
          <span style={{ color: "#4b5563" }}>ประเภทออเดอร์</span>
          <span>{getOrderTypeText(order.order_type)}</span>
        </div>
        {order.order_type === OrderType.DineIn && order.table?.table_name ? (
          <div style={rowStyle}>
            <span style={{ color: "#4b5563" }}>โต๊ะ</span>
            <span>{order.table.table_name}</span>
          </div>
        ) : null}
        {order.order_type === OrderType.Delivery && order.delivery_code ? (
          <div style={rowStyle}>
            <span style={{ color: "#4b5563" }}>รหัสเดลิเวอรี่</span>
            <span>{order.delivery_code}</span>
          </div>
        ) : null}
        <div style={rowStyle}>
          <span style={{ color: "#4b5563" }}>พนักงาน</span>
          <span>{order.created_by?.name || "-"}</span>
        </div>

        <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 6 }}>
          <span>รายการสินค้า</span>
          <span>{items.length} รายการ</span>
        </div>
        {groupOrderItems(items).map((item) => (
          <div key={item.id} style={{ marginBottom: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{item.product?.display_name || item.product?.product_name || "สินค้า"}</div>
                <div style={{ color: "#4b5563", fontSize: 11 }}>
                  {Number(item.quantity || 0).toLocaleString()} x {formatMoney(Number(item.price || 0))}
                </div>
              </div>
              <strong>{formatMoney(Number(item.total_price || 0))}</strong>
            </div>
            {item.details?.map((detail, idx) => (
              <div key={`${item.id}-${idx}`} style={{ marginTop: 2, marginLeft: 8, color: "#065f46", fontSize: 11 }}>
                + {detail.detail_name} {Number(detail.extra_price || 0) > 0 ? `(${formatMoney(Number(detail.extra_price || 0))})` : ""}
              </div>
            ))}
            {item.notes ? (
              <div style={{ marginTop: 2, marginLeft: 8, color: "#b45309", fontSize: 11 }}>หมายเหตุ: {item.notes}</div>
            ) : null}
          </div>
        ))}

        <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />

        <div style={rowStyle}>
          <span style={{ color: "#4b5563" }}>รวมก่อนส่วนลด</span>
          <span>{formatMoney(subTotal)}</span>
        </div>
        {discountAmount > 0 ? (
          <div style={rowStyle}>
            <span style={{ color: "#4b5563" }}>ส่วนลด {order.discount?.display_name || order.discount?.discount_name || ""}</span>
            <span style={{ color: "#b91c1c" }}>-{formatMoney(discountAmount)}</span>
          </div>
        ) : null}
        {vat > 0 ? (
          <div style={rowStyle}>
            <span style={{ color: "#4b5563" }}>ภาษีมูลค่าเพิ่ม (VAT)</span>
            <span>{formatMoney(vat)}</span>
          </div>
        ) : null}
        <div style={{ ...rowStyle, borderTop: "1px solid #e5e7eb", paddingTop: 6, marginTop: 6 }}>
          <strong style={{ fontSize: 14 }}>ยอดสุทธิ</strong>
          <strong style={{ fontSize: 14 }}>{formatMoney(totalAmount)}</strong>
        </div>

        <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />

        <div style={{ fontWeight: 700, marginBottom: 4 }}>การชำระเงิน</div>
        {payments.length > 0 ? (
          <>
            {payments.map((payment) => (
              <div key={payment.id} style={rowStyle}>
                <span style={{ color: "#4b5563" }}>
                  {payment.payment_method?.display_name || payment.payment_method?.payment_method_name || "ไม่ระบุวิธีชำระ"}
                </span>
                <span>{formatMoney(Number(payment.amount || 0))}</span>
              </div>
            ))}
            <div style={rowStyle}>
              <span style={{ color: "#4b5563" }}>รวมชำระ</span>
              <span>{formatMoney(paymentTotal)}</span>
            </div>
          </>
        ) : (
          <div style={{ color: "#6b7280", marginBottom: 4 }}>ยังไม่มีข้อมูลการชำระเงิน</div>
        )}

        {receivedAmount > 0 || changeAmount > 0 ? (
          <>
            {receivedAmount > 0 ? (
              <div style={rowStyle}>
                <span style={{ color: "#4b5563" }}>รับเงิน</span>
                <span>{formatMoney(receivedAmount)}</span>
              </div>
            ) : null}
            {changeAmount > 0 ? (
              <div style={rowStyle}>
                <span style={{ color: "#4b5563" }}>เงินทอน</span>
                <span>{formatMoney(changeAmount)}</span>
              </div>
            ) : null}
          </>
        ) : null}

        <div style={{ borderTop: "1px dashed #9ca3af", margin: "8px 0" }} />

        <div style={{ textAlign: "center", color: "#374151" }}>
          <div style={{ fontWeight: 700 }}>ขอบคุณที่ใช้บริการ</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>จำนวนสินค้ารวม {totalQty.toLocaleString()} ชิ้น</div>
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>พิมพ์เมื่อ {dayjs().format("DD/MM/YYYY HH:mm:ss")}</div>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = "ReceiptTemplate";

export default ReceiptTemplate;
