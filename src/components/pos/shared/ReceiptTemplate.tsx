"use client";

import React, { forwardRef } from "react";
import { SalesOrder, OrderType } from "../../../types/api/pos/salesOrder";
import { Payments } from "../../../types/api/pos/payments";
import { PaymentMethod } from "../../../types/api/pos/paymentMethod";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { groupOrderItems } from "../../../utils/orderGrouping";
import { isCancelledStatus } from "../../../utils/orders";

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
    // Filter out cancelled items
    const items = (order.items || []).filter(item => !isCancelledStatus(item.status));
    const payments = (order.payments || []) as PaymentWithMethod[];

    // Calculate totals for the receipt based on non-cancelled items
    // This ensures consistency if the backend amounts still include cancelled items
    const subTotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const discountAmount = Number(order.discount_amount || 0);
    
    // Recalculate VAT and Total based on the filtered subtotal
    // Assuming 7% VAT if any
    const vat = order.vat > 0 ? (subTotal - discountAmount) * 0.07 : 0;
    const totalAmount = subTotal - discountAmount + vat;
    
    const orderTypeLabel = (type: OrderType) => {
        switch (type) {
            case OrderType.DineIn: return 'ทานที่ร้าน';
            case OrderType.TakeAway: return 'สั่งกลับบ้าน';
            case OrderType.Delivery: return 'เดลิเวอรี่';
            default: return type;
        }
    };

    return (
        <div className="receipt-container">
            <div ref={ref} className="receipt-paper">
                {/* Header */}
                <div className="text-center mb-4">
                    {shopLogo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={shopLogo} alt="Logo" className="receipt-logo" />
                    )}
                    <div className="shop-name">{shopName || 'ร้านค้า POS'}</div>
                    {shopAddress && <div className="shop-info">{shopAddress}</div>}
                    {shopPhone && <div className="shop-info shop-phone">โทร: {shopPhone}</div>}
                    {shopTaxId && <div className="shop-info">TAX ID: {shopTaxId}</div>}
                </div>

                <div className="dashed-line" />

                {/* Order Info */}
                <div className="section">
                    <div className="flex-between">
                        <span>เลขที่ออเดอร์:</span>
                        <span className="font-bold">#{order.order_no}</span>
                    </div>
                    <div className="flex-between">
                        <span>วันที่:</span>
                        <span>{dayjs(order.create_date).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                    <div className="flex-between">
                        <span>ประเภท:</span>
                        <span>{orderTypeLabel(order.order_type)}</span>
                    </div>
                    {order.order_type === OrderType.DineIn && order.table && (
                        <div className="flex-between">
                            <span>โต๊ะ:</span>
                            <span>{order.table.table_name}</span>
                        </div>
                    )}
                    <div className="flex-between">
                        <span>พนักงาน:</span>
                        <span>{order.created_by?.name || order.created_by?.username || '-'}</span>
                    </div>
                </div>

                <div className="dashed-line" />

                {/* Items */}
                <div className="section">
                    <div className="section-header">รายการสินค้า</div>
                    {groupOrderItems(items).map((item, index: number) => (
                        <div key={item.id || index} className="item-row">
                            <div className="flex-between">
                                <span>{item.product?.display_name || item.product?.product_name || 'สินค้า'}</span>
                            </div>
                            <div className="item-details">
                                <span>{item.quantity} x ฿{Number(item.price).toLocaleString()}</span>
                                <span>฿{Number(item.total_price).toLocaleString()}</span>
                            </div>
                            {item.details && item.details.map((detail, dIdx) => (
                                <div key={dIdx} className="item-note" style={{ color: '#16a34a', fontStyle: 'normal' }}>
                                    + {detail.detail_name} {detail.extra_price > 0 && `(+฿${Number(detail.extra_price).toLocaleString()})`}
                                </div>
                            ))}
                            {item.notes && (
                                <div className="item-note">
                                    *{item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="dashed-line" />

                {/* Summary */}
                <div className="section">
                    <div className="flex-between">
                        <span>รวมรายการ:</span>
                        <span>฿{Number(subTotal).toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex-between">
                            <span>ส่วนลด ({order.discount?.display_name || order.discount?.discount_name || 'ส่วนลด'}):</span>
                            <span style={{ color: '#ef4444' }}>-฿{Number(discountAmount).toLocaleString()}</span>
                        </div>
                    )}
                    {vat > 0 && (
                        <div className="flex-between">
                            <span>VAT 7%:</span>
                            <span>฿{Number(vat).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="total-row">
                        <span>ยอดสุทธิ:</span>
                        <span>฿{Number(totalAmount).toLocaleString()}</span>
                    </div>
                </div>

                <div className="dashed-line" />

                {/* Payment Info */}
                {payments.length > 0 && (
                    <div className="section">
                        <div className="section-header">การชำระเงิน</div>
                        {payments.map((p: PaymentWithMethod, index: number) => (
                            <div key={p.id || index} className="flex-between">
                                <span>{p.payment_method?.display_name || p.payment_method?.payment_method_name || 'ไม่ระบุ'}</span>
                                <span>฿{Number(p.amount).toLocaleString()}</span>
                            </div>
                        ))}
                        {payments.some((p: PaymentWithMethod) => p.change_amount > 0) && (
                            <div className="flex-between">
                                <span>เงินทอน:</span>
                                <span>฿{payments.reduce((sum: number, p: PaymentWithMethod) => sum + Number(p.change_amount || 0), 0).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="dashed-line" />

                {/* Footer */}
                <div className="receipt-footer">
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>ขอบคุณที่ใช้บริการ</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Thank you for your purchase!</div>
                    <div style={{ fontSize: '9px', color: '#999', marginTop: 8 }}>
                        พิมพ์เมื่อ: {dayjs().format('DD/MM/YYYY HH:mm:ss')}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .receipt-container {
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                    background: #f0f2f5;
                }
                .receipt-paper {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    width: 80mm;
                    padding: 16px;
                    background-color: #fff;
                    color: #000;
                    margin: 0 auto;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    position: relative;
                }
                .text-center { 
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .mb-4 { margin-bottom: 16px; }
                .dashed-line {
                    border-top: 1px dashed #000;
                    margin: 12px 0;
                    opacity: 0.5;
                }
                .shop-name {
                    font-weight: 900;
                    font-size: 28px;
                    margin-bottom: 4px;
                    text-align: center;
                    width: 100%;
                }
                .shop-info {
                    font-size: 12px;
                    margin-bottom: 2px;
                    text-align: center;
                    width: 100%;
                }
                .shop-phone {
                    font-size: 16px;
                    font-weight: 700;
                    margin-top: 4px;
                }
                .section { margin-bottom: 8px; }
                .section-header {
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                .flex-between {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .font-bold { font-weight: bold; }
                .receipt-logo {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
                    margin-bottom: 8px;
                    margin-left: auto;
                    margin-right: auto;
                    display: block;
                    filter: grayscale(100%); /* Receipt feeling */
                }
                .item-row { margin-bottom: 6px; }
                .item-details {
                    display: flex;
                    justify-content: space-between;
                    padding-left: 10px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #000;
                }
                .item-note {
                    padding-left: 10px;
                    font-size: 9px;
                    font-weight: 300;
                    font-style: italic;
                    color: #4b5563;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 900;
                    font-size: 26px;
                    margin-top: 12px;
                    border-top: 2px solid #000;
                    padding-top: 8px;
                }
                .receipt-footer {
                    text-align: center;
                    margin-top: 16px;
                }

                @media print {
                    .receipt-container {
                        padding: 0;
                        background: none;
                    }
                    .receipt-paper {
                        box-shadow: none;
                        width: 100%;
                        max-width: 80mm;
                    }
                }
            `}</style>
        </div>
    );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
