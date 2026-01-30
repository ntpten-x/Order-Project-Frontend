"use client";

import React, { useRef } from 'react';
import { Modal, Button, Typography, Descriptions, Table, Statistic, Row, Col, Card, Divider, Tag, message } from 'antd';
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
                        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .stat-label { color: #666; }
                        .stat-value { font-weight: bold; }
                        .positive { color: #52c41a; }
                        .negative { color: #ff4d4f; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background: #f5f5f5; }
                        @media print { body { -webkit-print-color-adjust: exact; } }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
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
        } catch {
            message.error('เกิดข้อผิดพลาดในการส่งออก PDF');
        }
    };

    const diffIsPositive = Number(shiftData.diff_amount) >= 0;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={
                <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ marginBottom: 4 }}>สรุปกะการขาย</Title>
                    <Text type="secondary">Shift Summary Report</Text>
                </div>
            }
            width={700}
            centered
            footer={
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                        พิมพ์
                    </Button>
                    <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
                        ส่งออก PDF
                    </Button>
                    <Button type="primary" onClick={onClose}>
                        ปิด
                    </Button>
                </div>
            }
        >
            <div ref={printRef}>
                <div className="header" style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>{shopName}</Title>
                    <Text type="secondary">รายงานสรุปกะ</Text>
                </div>

                <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="พนักงาน">{userName}</Descriptions.Item>
                    <Descriptions.Item label="จำนวนออเดอร์">{orders.length} รายการ</Descriptions.Item>
                    <Descriptions.Item label="เปิดกะ">{dayjs(shiftData.open_time).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="ปิดกะ">{dayjs(shiftData.close_time).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                </Descriptions>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic 
                                title="เงินทอนเริ่มต้น" 
                                value={Number(shiftData.start_amount)} 
                                precision={2}
                                suffix="฿"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic 
                                title="ยอดขายรวม" 
                                value={totalSales} 
                                precision={2}
                                suffix="฿"
                                valueStyle={{ color: '#52c41a' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card size="small">
                            <Statistic 
                                title="ยอดคาดหวัง" 
                                value={Number(shiftData.expected_amount)} 
                                precision={2}
                                suffix="฿"
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }}>สรุปเงินสด</Divider>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Card size="small">
                            <Statistic 
                                title="เงินสดที่นับได้" 
                                value={Number(shiftData.end_amount)} 
                                precision={2}
                                suffix="฿"
                                prefix={<DollarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card size="small">
                            <Statistic 
                                title="ผลต่าง" 
                                value={Number(shiftData.diff_amount)} 
                                precision={2}
                                suffix="฿"
                                prefix={diffIsPositive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                valueStyle={{ color: diffIsPositive ? '#52c41a' : '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {Object.keys(paymentBreakdown).length > 0 && (
                    <>
                        <Divider style={{ margin: '12px 0' }}>แยกตามวิธีชำระเงิน</Divider>
                        <Table
                            size="small"
                            pagination={false}
                            dataSource={Object.entries(paymentBreakdown).map(([method, amount]) => ({
                                key: method,
                                method,
                                amount
                            }))}
                            columns={[
                                { title: 'วิธีชำระเงิน', dataIndex: 'method', key: 'method' },
                                { 
                                    title: 'ยอดรวม', 
                                    dataIndex: 'amount', 
                                    key: 'amount', 
                                    align: 'right' as const,
                                    render: (val: number) => `฿${val.toLocaleString()}`
                                }
                            ]}
                        />
                    </>
                )}

                {orders.length > 0 && (
                    <>
                        <Divider style={{ margin: '12px 0' }}>รายการออเดอร์ ({orders.length})</Divider>
                        <Table
                            size="small"
                            pagination={{ pageSize: 5 }}
                            dataSource={orders.map(o => ({ ...o, key: o.order_no }))}
                            columns={[
                                { title: 'เลขที่', dataIndex: 'order_no', render: (v: string) => `#${v}` },
                                { title: 'เวลา', dataIndex: 'create_date', render: (v: string) => dayjs(v).format('HH:mm') },
                                { title: 'วิธีชำระ', dataIndex: 'payment_method' },
                                { 
                                    title: 'ยอดเงิน', 
                                    dataIndex: 'total_amount', 
                                    align: 'right' as const,
                                    render: (v: number) => `฿${Number(v).toLocaleString()}`
                                },
                                {
                                    title: 'สถานะ',
                                    dataIndex: 'status',
                                    render: (s: string) => (
                                        <Tag color={s === 'Paid' ? 'green' : s === 'Cancelled' ? 'red' : 'default'}>
                                            {s === 'Paid' ? 'ชำระแล้ว' : s === 'Cancelled' ? 'ยกเลิก' : s}
                                        </Tag>
                                    )
                                }
                            ]}
                        />
                    </>
                )}
            </div>
        </Modal>
    );
}
