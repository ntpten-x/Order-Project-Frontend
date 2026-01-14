"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Card } from "antd";
import { ShopOutlined, ShoppingOutlined, RocketOutlined } from "@ant-design/icons";
import { pageStyles, colors } from "../style"; // Reusing styles from main POS

const { Title, Text } = Typography;

export default function ChannelSelectionPage() {
    const router = useRouter();

    const channels = [
        {
            id: 'dine-in',
            title: 'ทานที่ร้าน',
            subtitle: 'Dine In',
            icon: <ShopOutlined style={{ fontSize: 64, color: '#1890ff' }} />,
            color: '#e6f7ff',
            borderColor: '#91d5ff',
            path: '/pos/channels/dine-in'
        },
        {
            id: 'takeaway',
            title: 'สั่งกลับบ้าน',
            subtitle: 'Take Away',
            icon: <ShoppingOutlined style={{ fontSize: 64, color: '#52c41a' }} />,
            color: '#f6ffed',
            borderColor: '#b7eb8f',
            path: '/pos/channels/takeaway'
        },
        {
            id: 'delivery',
            title: 'เดลิเวอรี่',
            subtitle: 'Delivery',
            icon: <RocketOutlined style={{ fontSize: 64, color: '#722ed1' }} />,
            color: '#f9f0ff',
            borderColor: '#d3adf7',
            path: '/pos/channels/delivery'
        }
    ];

    return (
        <div style={pageStyles.container}>
            <div style={{ ...pageStyles.heroParams, paddingBottom: 100 }}>
                 <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <ShopOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>เลือกช่องทางการขาย</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Select Sales Channel</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-60px auto 0', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Row gutter={[24, 24]} justify="center">
                    {channels.map((channel) => (
                        <Col xs={24} md={8} key={channel.id}>
                            <Card
                                hoverable
                                onClick={() => router.push(channel.path)}
                                style={{
                                    height: '100%',
                                    borderRadius: 16,
                                    border: `1px solid ${channel.borderColor}`,
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    background: '#fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    transition: 'all 0.3s'
                                }}
                                styles={{ body: { padding: 0 } }}
                            >
                                <div style={{ 
                                    width: 120, 
                                    height: 120, 
                                    background: channel.color, 
                                    borderRadius: '50%', 
                                    margin: '0 auto 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {channel.icon}
                                </div>
                                <Title level={3} style={{ marginBottom: 4 }}>{channel.title}</Title>
                                <Text type="secondary" style={{ fontSize: 18 }}>{channel.subtitle}</Text>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
