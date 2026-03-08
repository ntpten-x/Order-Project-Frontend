"use client";

import React, { forwardRef, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";

import { OrderType, SalesOrder } from "../../../types/api/pos/salesOrder";
import { resolveImageSource } from "../../../utils/image/source";
import {
    buildReceiptViewModel,
    formatReceiptMoney,
    getReceiptOrderTypeLabel,
    RECEIPT_TEXT,
} from "../../../utils/print-settings/receipt.shared";

dayjs.locale("th");

interface ReceiptProps {
    order: SalesOrder;
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    shopTaxId?: string;
    shopLogo?: string;
}

const receiptRootStyle: React.CSSProperties = {
    width: "80mm",
    margin: "0 auto",
    padding: 12,
    color: "#111827",
    background: "#ffffff",
    fontFamily: "'Noto Sans Thai', Tahoma, sans-serif",
    fontSize: 12,
    lineHeight: 1.45,
};

const dividerStyle: React.CSSProperties = {
    borderTop: "1px dashed #9ca3af",
    margin: "8px 0",
};

const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 4,
    fontSize: 12,
};

const mutedStyle: React.CSSProperties = { color: "#4b5563" };

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(
    ({ order, shopName, shopAddress, shopPhone, shopTaxId, shopLogo }, ref) => {
        const {
            items,
            payments,
            subTotal,
            discountAmount,
            vat,
            totalAmount,
            receivedAmount,
            changeAmount,
            totalQty,
            paymentTotal,
        } = useMemo(() => buildReceiptViewModel(order), [order]);

        const resolvedShopLogo = useMemo(() => resolveImageSource(shopLogo), [shopLogo]);

        return (
            <div ref={ref} style={receiptRootStyle}>
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                    {resolvedShopLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={resolvedShopLogo}
                            alt={RECEIPT_TEXT.logoAlt}
                            style={{
                                width: 52,
                                height: 52,
                                objectFit: "contain",
                                margin: "0 auto 8px",
                                display: "block",
                            }}
                        />
                    ) : null}
                    <div style={{ fontSize: 18, fontWeight: 800 }}>
                        {shopName || RECEIPT_TEXT.shopFallbackName}
                    </div>
                    {shopAddress ? <div style={{ ...mutedStyle, marginTop: 2 }}>{shopAddress}</div> : null}
                    {shopPhone ? <div style={mutedStyle}>{RECEIPT_TEXT.phoneLabel} {shopPhone}</div> : null}
                    {shopTaxId ? <div style={mutedStyle}>{RECEIPT_TEXT.taxIdLabel} {shopTaxId}</div> : null}
                </div>

                <div style={dividerStyle} />

                <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{RECEIPT_TEXT.title}</div>
                </div>

                <ReceiptRow label={RECEIPT_TEXT.orderNoLabel} value={`#${order.order_no}`} />
                <ReceiptRow
                    label={RECEIPT_TEXT.createdAtLabel}
                    value={dayjs(order.create_date).format("DD/MM/YYYY HH:mm")}
                />
                <ReceiptRow
                    label={RECEIPT_TEXT.orderTypeLabel}
                    value={getReceiptOrderTypeLabel(order.order_type)}
                />
                {order.order_type === OrderType.DineIn && order.table?.table_name ? (
                    <ReceiptRow label={RECEIPT_TEXT.tableLabel} value={order.table.table_name} />
                ) : null}
                {order.order_type === OrderType.TakeAway && (order.customer_name || order.customer_phone) ? (
                    <ReceiptRow
                        label={RECEIPT_TEXT.customerLabel}
                        value={order.customer_name || order.customer_phone || "-"}
                    />
                ) : null}
                {order.order_type === OrderType.TakeAway && order.customer_name && order.customer_phone ? (
                    <ReceiptRow label={RECEIPT_TEXT.customerPhoneLabel} value={order.customer_phone} />
                ) : null}
                {order.order_type === OrderType.Delivery && order.delivery_code ? (
                    <ReceiptRow label={RECEIPT_TEXT.deliveryCodeLabel} value={order.delivery_code} />
                ) : null}
                <ReceiptRow
                    label={RECEIPT_TEXT.employeeLabel}
                    value={order.created_by?.name || order.created_by?.username || "-"}
                />

                <div style={dividerStyle} />

                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 6 }}>
                    <span>{RECEIPT_TEXT.itemsLabel}</span>
                    <span>
                        {items.length} {RECEIPT_TEXT.itemsCountSuffix}
                    </span>
                </div>
                {items.map((item) => (
                    <div key={item.id} style={{ marginBottom: 7 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>
                                    {item.product?.display_name ||
                                        item.product?.display_name ||
                                        RECEIPT_TEXT.fallbackItemName}
                                </div>
                                <div style={{ ...mutedStyle, fontSize: 11 }}>
                                    {Number(item.quantity || 0).toLocaleString("th-TH")} {RECEIPT_TEXT.quantityMultiplier}{" "}
                                    {formatReceiptMoney(Number(item.price || 0))}
                                </div>
                            </div>
                            <strong>{formatReceiptMoney(Number(item.total_price || 0))}</strong>
                        </div>

                        {item.details?.map((detail, idx) => (
                            <div
                                key={`${item.id}-${idx}`}
                                style={{ marginTop: 2, marginLeft: 8, color: "#065f46", fontSize: 11 }}
                            >
                                + {detail.detail_name}{" "}
                                {Number(detail.extra_price || 0) > 0
                                    ? `(${formatReceiptMoney(Number(detail.extra_price || 0))})`
                                    : ""}
                            </div>
                        ))}

                        {item.notes ? (
                            <div style={{ marginTop: 2, marginLeft: 8, color: "#b45309", fontSize: 11 }}>
                                {RECEIPT_TEXT.noteLabel}: {item.notes}
                            </div>
                        ) : null}
                    </div>
                ))}

                <div style={dividerStyle} />

                <ReceiptRow label={RECEIPT_TEXT.subtotalLabel} value={formatReceiptMoney(subTotal)} />
                {discountAmount > 0 ? (
                    <ReceiptRow
                        label={`${RECEIPT_TEXT.discountLabel} ${order.discount?.display_name || ""}`.trim()}
                        value={`-${formatReceiptMoney(discountAmount)}`}
                        valueStyle={{ color: "#b91c1c" }}
                    />
                ) : null}
                {vat > 0 ? (
                    <ReceiptRow label={RECEIPT_TEXT.vatLabel} value={formatReceiptMoney(vat)} />
                ) : null}
                <div
                    style={{
                        ...rowStyle,
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: 6,
                        marginTop: 6,
                    }}
                >
                    <strong style={{ fontSize: 14 }}>{RECEIPT_TEXT.totalLabel}</strong>
                    <strong style={{ fontSize: 14 }}>{formatReceiptMoney(totalAmount)}</strong>
                </div>

                <div style={dividerStyle} />

                <div style={{ fontWeight: 700, marginBottom: 4 }}>{RECEIPT_TEXT.paymentSectionLabel}</div>
                {payments.length > 0 ? (
                    <>
                        {payments.map((payment) => (
                            <ReceiptRow
                                key={payment.id}
                                label={
                                    payment.payment_method?.display_name ||
                                    payment.payment_method?.payment_method_name ||
                                    RECEIPT_TEXT.paymentFallbackLabel
                                }
                                value={formatReceiptMoney(Number(payment.amount || 0))}
                            />
                        ))}
                        <ReceiptRow
                            label={RECEIPT_TEXT.paymentTotalLabel}
                            value={formatReceiptMoney(paymentTotal)}
                        />
                    </>
                ) : (
                    <div style={{ color: "#6b7280", marginBottom: 4 }}>{RECEIPT_TEXT.noPaymentsLabel}</div>
                )}

                {receivedAmount > 0 ? (
                    <ReceiptRow
                        label={RECEIPT_TEXT.receivedAmountLabel}
                        value={formatReceiptMoney(receivedAmount)}
                    />
                ) : null}
                {changeAmount > 0 ? (
                    <ReceiptRow
                        label={RECEIPT_TEXT.changeAmountLabel}
                        value={formatReceiptMoney(changeAmount)}
                    />
                ) : null}

                <div style={dividerStyle} />

                <div style={{ textAlign: "center", color: "#374151" }}>
                    <div style={{ fontWeight: 700 }}>{RECEIPT_TEXT.footerThankYou}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        {RECEIPT_TEXT.footerItemCountLabel} {totalQty.toLocaleString("th-TH")}{" "}
                        {RECEIPT_TEXT.itemUnitSuffix}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                        {RECEIPT_TEXT.footerPrintedAtLabel}{" "}
                        {dayjs().format("DD/MM/YYYY HH:mm:ss")}
                    </div>
                </div>
            </div>
        );
    },
);

ReceiptTemplate.displayName = "ReceiptTemplate";

function ReceiptRow({
    label,
    value,
    valueStyle,
}: {
    label: string;
    value: string;
    valueStyle?: React.CSSProperties;
}) {
    return (
        <div style={rowStyle}>
            <span style={mutedStyle}>{label}</span>
            <span style={valueStyle}>{value}</span>
        </div>
    );
}

export default ReceiptTemplate;
