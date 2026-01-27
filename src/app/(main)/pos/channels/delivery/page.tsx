"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card, Empty, Spin, Modal, Input, message } from "antd";
import { RocketOutlined, CarOutlined } from "@ant-design/icons";
import { useDelivery } from "../../../../../hooks/pos/useDelivery";
import { Delivery } from "../../../../../types/api/pos/delivery";
import { pageStyles } from "../../style"; 

const { Title, Text } = Typography;

export default function DeliverySelectionPage() {
    const router = useRouter();
    const { deliveryProviders, isLoading } = useDelivery();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Delivery | null>(null);
    const [deliveryCode, setDeliveryCode] = useState("");

    const handleSelectProvider = (provider: Delivery) => {
        setSelectedProvider(provider);
        setDeliveryCode("");
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        if (!deliveryCode.trim()) {
            message.error("กรุณากรอกรหัสออเดอร์");
            return;
        }
        if (selectedProvider) {
            router.push(`/pos/channels/delivery/${selectedProvider.id}?code=${encodeURIComponent(deliveryCode)}`);
        }
    };

    return (
        <div style={pageStyles.container}>
            <div style={{ ...pageStyles.heroParams, paddingBottom: 100 }}>
                 <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <RocketOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>เดลิเวอรี่ (Delivery)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Select Delivery Provider</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-60px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "60px", background: '#fff', borderRadius: 12 }}>
                        <Spin size="large" />
                    </div>
                ) : deliveryProviders.length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {deliveryProviders.map((provider) => (
                            <Col xs={12} sm={8} md={6} lg={4} key={provider.id}>
                                <Card
                                    hoverable
                                    onClick={() => handleSelectProvider(provider)}
                                    style={{
                                        borderRadius: 12,
                                        textAlign: 'center',
                                        border: '1px solid #f0f0f0',
                                        background: '#fff',
                                    }}
                                    styles={{ body: { padding: '20px 12px' } }}
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        {/* Ideally checking for logo url here if available */}
                                        <div style={{ 
                                            width: 60, height: 60, background: '#f9f0ff', borderRadius: '50%', margin: '0 auto',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <CarOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                                        </div>
                                    </div>
                                    <Title level={4} style={{ margin: 0, marginBottom: 4 }}>{provider.delivery_name}</Title>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 50, textAlign: 'center' }}>
                        <Empty description="ไม่พบข้อมูลเดลิเวอรี่" />
                    </div>
                )}
            </div>

            <Modal
                title={`เดลิเวอรี่ ${selectedProvider?.delivery_name || ''}`}
                open={isModalOpen}
                onOk={handleConfirm}
                onCancel={() => setIsModalOpen(false)}
                okText="ยืนยัน"
                cancelText="ยกเลิก"
            >
                <div style={{ paddingTop: 12 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Delivery Code / Order ID</Text>
                    <Input 
                        placeholder="กรอกรหัสออเดอร์" 
                        value={deliveryCode}
                        onChange={(e) => setDeliveryCode(e.target.value)}
                        size="large"
                        autoFocus
                        onPressEnter={handleConfirm}
                    />
                </div>
            </Modal>
        </div>
    );
}
