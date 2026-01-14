"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Descriptions, Table, Tag, Button, Spin, Row, Col, Divider, message, Image, Avatar, Space } from "antd";
import { ArrowLeftOutlined, PrinterOutlined, UserOutlined, ShopOutlined, ClockCircleOutlined, DollarCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { posHistoryService } from "../../../../../services/pos/posHistory.service";
import { PosHistory } from "../../../../../types/api/pos/posHistory";
import { pageStyles, colors } from "../../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
dayjs.locale('th');

interface Props {
    params: {
        historyId: string[];
    };
}

export default function PosHistoryDetailPage({ params }: Props) {
    const router = useRouter();
    const historyId = params.historyId[0];
    
    const [history, setHistory] = useState<PosHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (historyId) {
            fetchHistoryDetail();
        }
    }, [historyId]);

    const fetchHistoryDetail = async () => {
        setIsLoading(true);
        try {
            const data = await posHistoryService.getById(historyId);
            setHistory(data);
        } catch (error) {
            console.error("Fetch history detail error:", error);
            message.error("ไม่สามารถโหลดข้อมูลรายละเอียดได้");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ ...pageStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!history) {
        return (
             <div style={pageStyles.container}>
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <Title level={4}>ไม่พบข้อมูล</Title>
                    <Button onClick={() => router.back()}>ย้อนกลับ</Button>
                </div>
            </div>
        );
    }

    const items = history.items_snapshot || [];
    const payments = history.payments_snapshot || [];
    const additionalData = history.additional_data || {};

    const itemColumns = [
        {
            title: 'รูป',
            dataIndex: 'product',
            key: 'image',
            width: 80,
            render: (product: any) => (
                <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                     {product?.img_url ? (
                        <Image src={product.img_url} width="100%" height="100%" style={{ objectFit: 'cover' }} preview={false} />
                     ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                            <ShopOutlined style={{ fontSize: 24, color: '#ccc' }} />
                        </div>
                     )}
                </div>
            )
        },
        {
            title: 'สินค้า',
            dataIndex: 'product',
            key: 'name',
            render: (product: any, record: any) => (
                <div>
                    <Text strong style={{ fontSize: 16 }}>{product?.display_name || product?.product_name || 'สินค้า'}</Text>
                    {record.details && record.details.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            {record.details.map((m: any, i: number) => (
                                <Tag key={i} color="blue">{m.detail_name} (+{Number(m.extra_price).toLocaleString()})</Tag>
                            ))}
                        </div>
                    )}
                     {record.note && (
                        <div style={{ fontSize: 12, color: 'orange', marginTop: 4 }}>Note: {record.note}</div>
                    )}
                </div>
            )
        },
        {
            title: 'ราคา',
            dataIndex: 'price',
            key: 'price',
            align: 'right' as const,
            render: (val: number) => `฿${Number(val).toLocaleString()}`
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
            render: (val: number) => <Tag style={{ fontSize: 14, padding: '4px 10px' }}>x {val}</Tag>
        },
        {
            title: 'รวม',
            key: 'total',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const total = record.total_price || (record.price * record.quantity);
                return <Text strong style={{ color: colors.primary }}>฿{Number(total).toLocaleString()}</Text>
            }
        }
    ];

    const paymentColumns = [
        {
            title: 'วิธีการชำระเงิน',
            key: 'method',
            render: (_: any, record: any) => {
                // Try to find name in various places
               return <Text strong>{record.payment_method_name || record.payment_method?.name || 'Unknown'}</Text>
            }
        },
        {
            title: 'จำนวนเงิน',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right' as const,
            render: (val: number) => <Text strong>฿{Number(val).toLocaleString()}</Text>
        },
        {
             title: 'เวลา',
             dataIndex: 'create_date',
             key: 'time',
             align: 'right' as const,
             render: (date: string) => dayjs(date || history.create_date).format('HH:mm')
        }
    ];

    return (
        <div style={{ ...pageStyles.container, minHeight: '100vh', paddingBottom: 40 }}>
             {/* Header Section */}
             <div style={{ ...pageStyles.heroParams, height: 280, paddingBottom: 0 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 0', position: 'relative', zIndex: 10 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        style={{ color: '#fff', marginBottom: 16 }}
                        onClick={() => router.back()}
                    >
                        ย้อนกลับไปประวัติ
                    </Button>
                    
                    <Row gutter={24} align="bottom" style={{ paddingBottom: 40 }}>
                        <Col flex="auto">
                             <Title level={2} style={{ margin: 0, color: '#fff' }}>Order #{history.order_no}</Title>
                             <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                                    <ClockCircleOutlined />
                                    <Text style={{ color: 'inherit' }}>{dayjs(history.create_date).format('DD MMM YYYY, HH:mm')}</Text>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.3)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                                    <UserOutlined />
                                    <Text style={{ color: 'inherit' }}>ผู้ทำรายการ: {additionalData.employee_name || 'Unknown'}</Text>
                                </div>
                                <div style={{ width: 1, background: 'rgba(255,255,255,0.3)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                                    <ShopOutlined />
                                    <Text style={{ color: 'inherit' }}>
                                        {history.order_type === 'DineIn' ? `โต๊ะ: ${additionalData.table_name || 'N/A'}` : history.order_type}
                                    </Text>
                                </div>
                             </div>
                        </Col>
                        <Col>
                            <Space direction="vertical" align="end">
                                <Tag color={history.status === 'Paid' ? 'success' : 'warning'} style={{ padding: '6px 16px', fontSize: 16, margin: 0 }}>
                                    {history.status.toUpperCase()}
                                </Tag>
                                <Button icon={<PrinterOutlined />} size="large" disabled ghost style={{ color: '#fff', borderColor: '#fff' }}>
                                    เบิกใบเสร็จ
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '-60px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        {/* Order Items */}
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24, overflow: 'hidden' }}>
                            <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #f0f0f0', marginBottom: 0 }}>
                                <Title level={4} style={{ margin: 0 }}>รายการออเดอร์ ({items.length})</Title>
                            </div>
                            <Table 
                                dataSource={items} 
                                columns={itemColumns} 
                                pagination={false} 
                                rowKey={(record: any) => record.id || Math.random()} 
                            />
                        </Card>

                         {/* Payment History */}
                         <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #f0f0f0', marginBottom: 0 }}>
                                <Title level={4} style={{ margin: 0 }}>ประวัติการชำระเงิน</Title>
                            </div>
                            <Table 
                                dataSource={payments} 
                                columns={paymentColumns} 
                                pagination={false} 
                                rowKey={(record: any) => record.id || Math.random()}
                            />
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        {/* Summary Card */}
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: 24 }}>
                            <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>สรุปยอดชำระ</Title>
                            <Descriptions column={1} labelStyle={{ color: '#666' }} contentStyle={{ fontWeight: 500, justifyContent: 'flex-end' }}>
                                <Descriptions.Item label="ยอดรวมสินค้า">฿{Number(history.sub_total).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label={
                                    <span>
                                        ส่วนลด
                                        {(additionalData.discount_display_name || additionalData.discount_name) && (
                                            <Tag color="red" style={{ marginLeft: 8, marginRight: 0 }}>
                                                {additionalData.discount_display_name || additionalData.discount_name}
                                            </Tag>
                                        )}
                                    </span>
                                }>
                                    <span style={{ color: history.discount_amount > 0 ? 'red' : 'inherit' }}>
                                        {history.discount_amount > 0 ? `-${Number(history.discount_amount).toLocaleString()}` : '-'}
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="VAT (7%)">฿{Number(history.vat).toLocaleString()}</Descriptions.Item>
                                <Divider style={{ margin: '12px 0' }} />
                                <Descriptions.Item label={<Text strong style={{ fontSize: 18 }}>ยอดสุทธิ</Text>}>
                                    <Text strong style={{ fontSize: 24, color: colors.primary }}>
                                        ฿{Number(history.total_amount).toLocaleString()}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>

                             <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 12, marginTop: 16 }}>
                                 <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">รับเงิน</Text>
                                    <Text strong>฿{Number(history.received_amount).toLocaleString()}</Text>
                                 </Row>
                                 <Row justify="space-between">
                                    <Text type="secondary">เงินทอน</Text>
                                    <Text strong style={{ color: 'green' }}>฿{Number(history.change_amount).toLocaleString()}</Text>
                                 </Row>
                             </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
