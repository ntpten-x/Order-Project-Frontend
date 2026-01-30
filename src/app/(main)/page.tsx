"use client";

import React from "react";
import { Typography, Row, Col, Card } from "antd";
import { AppstoreOutlined, ShopOutlined, SettingOutlined, ArrowRightOutlined, BranchesOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function LandingPage() {
    const router = useRouter();

    const modules = [
        {
            title: "จัดการสต๊อก/วัตถุดิบ",
            description: "รับเข้า โอน ลดจ่าย ตรวจนับ และดูต้นทุนสต๊อกได้แบบเรียลไทม์",
            icon: <AppstoreOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
            path: "/stock",
            color: "linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)",
            borderColor: "#91d5ff",
            enabled: true,
        },
        {
            title: "ขายหน้าร้าน (POS)",
            description: "เปิดบิล คิดเงิน ออกใบเสร็จ รองรับ Dine-in / Takeaway / Delivery",
            icon: <ShopOutlined style={{ fontSize: 48, color: '#fa541c' }} />,
            path: "/pos",
            color: "linear-gradient(135deg, #fff2e8 0%, #ffffff 100%)",
            borderColor: "#ffbb96",
            enabled: true,
        },
        {
            title: "ตั้งค่าและสิทธิ์ผู้ใช้",
            description: "จัดการโปรไฟล์ร้าน สิทธิ์การเข้าถึง พนักงาน และการตั้งค่าอื่น ๆ",
            icon: <SettingOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
            path: "/users",
            color: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
            borderColor: "#b7eb8f",
            enabled: true,
        },
        {
            title: "จัดการข้อมูลสาขา",
            description: "ตั้งค่าสาขา ข้อมูลติดต่อ และตรวจสอบการทำงานรายสาขา",
            icon: <BranchesOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
            path: "/branch",
            color: "linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)",
            borderColor: "#d3adf7",
            enabled: true,
        },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f0f2f5",
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <div style={{ maxWidth: 1200, width: "100%" }}>
                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <Title level={1} style={{ color: "#001529", marginBottom: 16 }}>
                        แพลตฟอร์ม POS + สต๊อกครบวงจร
                    </Title>
                    <Text type="secondary" style={{ fontSize: 18 }}>
                        บริหารงานขาย หน้าร้าน สต๊อก และทีมงาน ได้ในที่เดียวแบบเรียลไทม์
                    </Text>
                </div>

                <Row gutter={[24, 24]} justify="center">
                    {modules.map((module, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <Card
                                hoverable={module.enabled}
                                style={{
                                    height: "100%",
                                    borderRadius: 16,
                                    border: `1px solid ${module.enabled ? module.borderColor : '#f0f0f0'}`,
                                    background: module.color,
                                    opacity: module.enabled ? 1 : 0.7,
                                    cursor: module.enabled ? "pointer" : "not-allowed",
                                    transition: "all 0.3s ease",
                                }}
                                styles={{ body: { padding: 32 } }}
                                onClick={() => {
                                    if (module.enabled && module.path) {
                                        router.push(module.path);
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        textAlign: "center",
                                        gap: 24,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 24,
                                            borderRadius: "50%",
                                            background: "white",
                                            boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        {module.icon}
                                    </div>
                                    <div>
                                        <Title level={4} style={{ marginBottom: 8 }}>
                                            {module.title}
                                        </Title>
                                        <Text type="secondary">{module.description}</Text>
                                    </div>
                                    {module.enabled && (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                color: "#1890ff",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            เข้าใช้งาน <ArrowRightOutlined />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}
