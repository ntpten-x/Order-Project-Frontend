"use client";

import React, { useRef } from 'react';
import { Modal, Button, Typography, Tag, message } from 'antd';
import { PrinterOutlined, FilePdfOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { exportShiftSummaryPDF, ShiftSummaryExport } from '../../../utils/export.utils';

dayjs.locale('th');

const { Title, Text } = Typography;

interface ShiftOrder {
    order_no: string;
    total_amount: number;
    payment_method: string;
    create_date: string;
    status: string;
}

interface ShiftSummaryData {
    id: string;
    user: { name: string; display_name?: string };
    open_time: string;
    close_time: string;
    start_amount: number;
    end_amount: number;
    expected_amount: number;
    diff_amount: number;
    payments?: Array<{
        amount: number;
        payment_method?: { display_name?: string; payment_method_name?: string };
    }>;
}

interface ShiftSummaryModalProps {
    open: boolean;
    onClose: () => void;
    shiftData: ShiftSummaryData | null;
    orders?: ShiftOrder[];
    shopName?: string;
}

export default function ShiftSummaryModal({ open, onClose, shiftData, orders = [], shopName = 'ร้านค้า POS' }: ShiftSummaryModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!shiftData) return null;

    const userName = shiftData.user?.name || shiftData.user?.display_name || 'Unknown';
    
    // Calculate payment method breakdown from orders
    const paymentBreakdown: Record<string, number> = {};
    orders.forEach(order => {
        const method = order.payment_method || 'ไม่ระบุ';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(order.total_amount);
    });

    const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const cashSales = paymentBreakdown['เงินสด'] || 0;
    const qrSales = paymentBreakdown['QR Payment'] || paymentBreakdown['QR'] || 0;

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            message.error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ กรุณาอนุญาต popup');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>รายงานสรุปกะ - ${userName}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                        .print-container { width: 80mm; margin: 0 auto; text-align: left; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed black; padding-bottom: 10px; }
                        .stat-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
                        .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; border-top: 1px dashed black; padding-top: 5px; }
                        .divider { border-bottom: 1px dashed black; margin: 10px 0; }
                        @media print { 
                            @page { margin: 0; size: 80mm auto; }
                            body { margin: 0; padding: 5px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        // Allow images/styles to load
        setTimeout(() => printWindow.print(), 500);
    };

    const handleExportPDF = () => {
        try {
            const exportData: ShiftSummaryExport = {
                shift_id: shiftData.id,
                user_name: userName,
                open_time: dayjs(shiftData.open_time).format('DD/MM/YYYY HH:mm'),
                close_time: dayjs(shiftData.close_time).format('DD/MM/YYYY HH:mm'),
                start_amount: Number(shiftData.start_amount),
                expected_amount: Number(shiftData.expected_amount),
                end_amount: Number(shiftData.end_amount),
                diff_amount: Number(shiftData.diff_amount),
                total_sales: totalSales,
                cash_sales: cashSales,
                qr_sales: qrSales,
                order_count: orders.length
            };

            exportShiftSummaryPDF(exportData, orders, shopName);
            message.success('ส่งออก PDF สำเร็จ');
        } catch (error) {
            console.error(error);
            message.error('เกิดข้อผิดพลาดในการส่งออก PDF');
        }
    };

    const diffIsPositive = Number(shiftData.diff_amount) >= 0;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={null}
            width={720}
            centered
            footer={null}
            className="soft-modal"
            styles={{ 
                body: { padding: 0, borderRadius: 24, overflow: 'hidden', background: '#f0f2f5' } // Grey background for contrast
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', zIndex: 1 }}>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>สรุปกะการขาย</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>Z-Report Summary</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button shape="circle" icon={<PrinterOutlined />} onClick={handlePrint} title="พิมพ์" />
                        <Button shape="circle" icon={<FilePdfOutlined />} onClick={handleExportPDF} title="PDF" />
                        <Button type="primary" shape="round" onClick={onClose} style={{ minWidth: 80 }}>ปิด</Button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
                    <div ref={printRef} className="paper-receipt">
                        {/* Receipt Header */}
                        <div className="text-center" style={{ textAlign: 'center', marginBottom: 16 }}>
                            <Title level={5} style={{ margin: 0 }}>{shopName}</Title>
                            <Text style={{ fontSize: 12 }}>รายงานสรุปยอดขายประจำกะ (Z-Report)</Text>
                        </div>
                        
                        <div className="dashed-divider" />

                        {/* Shift Info */}
                        <div className="receipt-section">
                            <div className="receipt-row"><span>พนักงาน:</span><span>{userName}</span></div>
                            <div className="receipt-row"><span>เปิดกะ:</span><span>{dayjs(shiftData.open_time).format('DD/MM/YYYY HH:mm')}</span></div>
                            <div className="receipt-row"><span>ปิดกะ:</span><span>{dayjs(shiftData.close_time).format('DD/MM/YYYY HH:mm')}</span></div>
                            <div className="receipt-row"><span>จำนวนบิล:</span><span>{orders.length}</span></div>
                        </div>

                        <div className="dashed-divider" />

                        {/* Financials */}
                        <div className="receipt-section">
                            <div className="receipt-row"><span>เงินทอนเริ่มต้น:</span><span>{Number(shiftData.start_amount).toFixed(2)}</span></div>
                            <div className="receipt-row bold"><span>ยอดขายรวม:</span><span>{totalSales.toFixed(2)}</span></div>
                            <div className="receipt-row"><span>ยอดคาดหวัง:</span><span>{Number(shiftData.expected_amount).toFixed(2)}</span></div>
                        </div>
        
                        <div className="dashed-divider" />

                        {/* Cash Control */}
                        <div className="receipt-section">
                            <div className="receipt-row"><span>นับเงินสดได้:</span><span>{Number(shiftData.end_amount).toFixed(2)}</span></div>
                            <div className="receipt-row">
                                <span>ผลต่าง:</span>
                                <span style={{ color: diffIsPositive ? '#52c41a' : '#ef4444' }}>
                                    {Number(shiftData.diff_amount) > 0 ? '+' : ''}{Number(shiftData.diff_amount).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="dashed-divider" />

                        {/* Payments */}
                        <div className="receipt-section">
                            <div className="receipt-header">แยกตามวิธีชำระ</div>
                             {Object.entries(paymentBreakdown).map(([method, amount]) => (
                                <div key={method} className="receipt-row">
                                    <span>{method}:</span>
                                    <span>{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                        </div>

                         <div className="dashed-divider" />

                         {/* Footer */}
                         <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Text style={{ fontSize: 10, color: '#999' }}>พิมพ์เมื่อ: {dayjs().format('DD/MM/YYYY HH:mm:ss')}</Text>
                            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>*** End of Report ***</div>
                         </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .paper-receipt {
                    background: white;
                    width: 380px; /* Approx 80mm scaled up slightly for screen */
                    padding: 24px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 13px;
                    color: #000;
                    margin: 0 auto;
                }
                .dashed-divider {
                    border-bottom: 1px dashed #ccc;
                    margin: 12px 0;
                }
                .receipt-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .receipt-row.bold {
                    font-weight: bold;
                    font-size: 14px;
                }
                .receipt-header {
                    font-weight: bold;
                    margin-bottom: 6px;
                    text-align: left;
                }
                /* Mobile responsiveness */
                @media (max-width: 768px) {
                    .paper-receipt {
                        width: 100%;
                    }
                }
            `}</style>
        </Modal>
    );
}
