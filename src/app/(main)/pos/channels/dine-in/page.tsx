"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Badge, Tag, Button } from "antd";
import { ShopOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useTables } from "../../../../../hooks/pos/useTables";
import { pageStyles, colors } from "../../style"; // Assuming style is at src/app/(main)/pos/style.tsx

const { Title, Text } = Typography;

export default function DineInTableSelectionPage() {
    const router = useRouter();
    const { tables, isLoading } = useTables();

    // Sort tables by name (simple sort)
    const sortedTables = [...tables].sort((a, b) => a.table_name.localeCompare(b.table_name));

    return (
        <div style={pageStyles.container}>
            <div style={{ ...pageStyles.heroParams, paddingBottom: 100 }}>
                 <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <Button 
                            type="text" 
                            icon={<ArrowLeftOutlined />} 
                            style={{ color: '#fff', marginRight: 16, fontSize: '18px' }} 
                            onClick={() => router.push('/pos/channels')}
                        >
                            กลับ
                        </Button>
                        <ShopOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>เลือกโต๊ะ (Dine In)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Select Table</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-60px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", background: '#fff', borderRadius: 12 }}>
                        <Spin size="large" />
                    </div>
                ) : sortedTables.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {sortedTables.map((table) => (
                            <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                                <Card
                                    hoverable
                                    onClick={() => router.push(`/pos/channels/dine-in/${table.id}`)}
                                    style={{
                                        borderRadius: 12,
                                        textAlign: 'center',
                                        border: `1px solid ${table.status === 'Available' ? '#b7eb8f' : '#ffa39e'}`,
                                        background: table.status === 'Available' ? '#f6ffed' : '#fff1f0',
                                    }}
                                    styles={{ body: { padding: '20px 12px' } }}
                                >
                                    <div style={{ marginBottom: 8 }}>
                                        {table.status === 'Available' ? (
                                            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                        ) : (
                                            <CloseCircleOutlined style={{ fontSize: 32, color: '#f5222d' }} />
                                        )}
                                    </div>
                                    <Title level={4} style={{ margin: 0, marginBottom: 4 }}>{table.table_name}</Title>
                                    <Tag color={table.status === 'Available' ? 'success' : 'error'}>
                                        {table.status === 'Available' ? 'ว่าง' : 'ไม่ว่าง'}
                                    </Tag>
                                    {table.status !== 'Available' && table.active_order_status && (
                                        <div style={{ marginTop: 8 }}>
                                            <Tag color="#d46b08" style={{ marginRight: 0 }}>
                                                {(() => {
                                                    const statusMap: any = {
                                                        "Pending": "รอรับออเดอร์",
                                                        "Cooking": "กำลังปรุง",
                                                        "Served": "เสิร์ฟแล้ว",
                                                        "Paid": "ชำระแล้ว",
                                                        "pending": "รอรับออเดอร์",
                                                    };
                                                    return statusMap[table.active_order_status] || table.active_order_status;
                                                })()}
                                            </Tag>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 50, textAlign: 'center' }}>
                        <Empty description="ไม่พบข้อมูลโต๊ะ" />
                    </div>
                )}
            </div>
        </div>
    );
}
