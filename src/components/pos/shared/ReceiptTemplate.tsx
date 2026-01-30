"use client";

import React, { forwardRef } from "react";
import { SalesOrder, OrderType } from "../../../types/api/pos/salesOrder";
import { SalesOrderItem } from "../../../types/api/pos/salesOrderItem";
import { Payments } from "../../../types/api/pos/payments";
import { PaymentMethod } from "../../../types/api/pos/paymentMethod";
import dayjs from "dayjs";
import 'dayjs/locale/th';

dayjs.locale('th');

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

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptProps>(({ order, shopName, shopAddress, shopPhone, shopTaxId, shopLogo }, ref) => {
    const items = order.items || [];
    const payments = (order.payments || []) as PaymentWithMethod[];
    
    const orderTypeLabel = (type: OrderType) => {
        switch (type) {
            case OrderType.DineIn: return 'ทานที่ร้าน';
            case OrderType.TakeAway: return 'สั่งกลับบ้าน';
            case OrderType.Delivery: return 'เดลิเวอรี่';
            default: return type;
        }
    };

    const receiptStyles: React.CSSProperties = {
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '12px',
        width: '80mm',
        padding: '10px',
        backgroundColor: '#fff',
        color: '#000',
        margin: '0 auto',
    };

    const hrStyle: React.CSSProperties = {
        border: 'none',
        borderTop: '1px dashed #000',
        margin: '8px 0',
    };

    const centerStyle: React.CSSProperties = {
        textAlign: 'center',
    };

    const flexBetweenStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
    };

    return (
        <div ref={ref} style={receiptStyles}>
            {/* Header */}
            <div style={centerStyle}>
                {shopLogo && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shopLogo} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 8 }} />
                    </>
                )}
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: 4 }}>{shopName || 'ร้านค้า POS'}</div>
                {shopAddress && <div style={{ fontSize: '10px', marginBottom: 2 }}>{shopAddress}</div>}
                {shopPhone && <div style={{ fontSize: '10px', marginBottom: 2 }}>โทร: {shopPhone}</div>}
                {shopTaxId && <div style={{ fontSize: '10px', marginBottom: 4 }}>เลขประจำตัวผู้เสียภาษี: {shopTaxId}</div>}
            </div>

            <hr style={hrStyle} />

            {/* Order Info */}
            <div>
                <div style={flexBetweenStyle}>
                    <span>เลขที่ออเดอร์:</span>
                    <span style={{ fontWeight: 'bold' }}>#{order.order_no}</span>
                </div>
                <div style={flexBetweenStyle}>
                    <span>วันที่:</span>
                    <span>{dayjs(order.create_date).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div style={flexBetweenStyle}>
                    <span>ประเภท:</span>
                    <span>{orderTypeLabel(order.order_type)}</span>
                </div>
                {order.order_type === OrderType.DineIn && order.table && (
                    <div style={flexBetweenStyle}>
                        <span>โต๊ะ:</span>
                        <span>{order.table.table_name}</span>
                    </div>
                )}
                <div style={flexBetweenStyle}>
                    <span>พนักงาน:</span>
                    <span>{order.created_by?.name || order.created_by?.username || '-'}</span>
                </div>
            </div>

            <hr style={hrStyle} />

            {/* Items */}
            <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>รายการสินค้า</div>
                {items.map((item: SalesOrderItem, index: number) => (
                    <div key={item.id || index} style={{ marginBottom: 6 }}>
                        <div style={flexBetweenStyle}>
                            <span>{item.product?.display_name || item.product?.product_name || 'สินค้า'}</span>
                        </div>
                        <div style={{ ...flexBetweenStyle, paddingLeft: 10, fontSize: '11px' }}>
                            <span>{item.quantity} x ฿{Number(item.price).toLocaleString()}</span>
                            <span>฿{Number(item.total_price).toLocaleString()}</span>
                        </div>
                        {item.notes && (
                            <div style={{ paddingLeft: 10, fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
                                *{item.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <hr style={hrStyle} />

            {/* Summary */}
            <div>
                <div style={flexBetweenStyle}>
                    <span>รวมรายการ:</span>
                    <span>฿{Number(order.sub_total).toLocaleString()}</span>
                </div>
                {order.discount_amount > 0 && (
                    <div style={flexBetweenStyle}>
                        <span>ส่วนลด ({order.discount?.display_name || order.discount?.discount_name || 'ส่วนลด'}):</span>
                        <span style={{ color: 'red' }}>-฿{Number(order.discount_amount).toLocaleString()}</span>
                    </div>
                )}
                {order.vat > 0 && (
                    <div style={flexBetweenStyle}>
                        <span>VAT 7%:</span>
                        <span>฿{Number(order.vat).toLocaleString()}</span>
                    </div>
                )}
                <div style={{ ...flexBetweenStyle, fontWeight: 'bold', fontSize: '14px', marginTop: 8 }}>
                    <span>ยอดสุทธิ:</span>
                    <span>฿{Number(order.total_amount).toLocaleString()}</span>
                </div>
            </div>

            <hr style={hrStyle} />

            {/* Payment Info */}
            {payments.length > 0 && (
                <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 8 }}>การชำระเงิน</div>
                    {payments.map((p: PaymentWithMethod, index: number) => (
                        <div key={p.id || index} style={flexBetweenStyle}>
                            <span>{p.payment_method?.display_name || p.payment_method?.payment_method_name || 'ไม่ระบุ'}</span>
                            <span>฿{Number(p.amount).toLocaleString()}</span>
                        </div>
                    ))}
                    {payments.some((p: PaymentWithMethod) => p.change_amount > 0) && (
                        <div style={flexBetweenStyle}>
                            <span>เงินทอน:</span>
                            <span>฿{payments.reduce((sum: number, p: PaymentWithMethod) => sum + Number(p.change_amount || 0), 0).toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}

            <hr style={hrStyle} />

            {/* Footer */}
            <div style={{ ...centerStyle, marginTop: 16 }}>
                <div style={{ fontSize: '11px', marginBottom: 4 }}>ขอบคุณที่ใช้บริการ</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Thank you for your purchase!</div>
                <div style={{ fontSize: '9px', color: '#999', marginTop: 8 }}>
                    พิมพ์เมื่อ: {dayjs().format('DD/MM/YYYY HH:mm:ss')}
                </div>
            </div>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
