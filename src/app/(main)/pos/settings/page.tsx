"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Form, Input, Button, message, Spin, Divider, Row, Col } from "antd";
import { SaveOutlined, ShopOutlined, SettingOutlined } from "@ant-design/icons";
import { shopProfileService, ShopProfile } from "../../../../services/pos/shopProfile.service";
import { authService } from "../../../../services/auth.service";
import { pageStyles, colors } from "../style";

const { Title, Text } = Typography;

export default function POSSettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await shopProfileService.getProfile();
            form.setFieldsValue(data);
        } catch (error) {
            console.error(error);
            message.error("ไม่สามารถดึงข้อมูลร้านค้าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: Partial<ShopProfile>) => {
        try {
            setSaving(true);
            const csrfToken = await authService.getCsrfToken();
            await shopProfileService.updateProfile(values, undefined, csrfToken);
            message.success("บันทึกการตั้งค่าเรียบร้อย");
            fetchProfile(); // Refresh
        } catch (error) {
            console.error(error);
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <div style={pageStyles.container}>
            {/* Header */}
            <div style={{ ...pageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <SettingOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>ตั้งค่าระบบ (Settings)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Manage Shop Configuration</Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 800, margin: '-40px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Card style={{ borderRadius: 12 }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        initialValues={{}}
                    >
                        <Divider orientation={"left" as any} plain><ShopOutlined /> ข้อมูลร้านค้า (General Info)</Divider>
                        
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="shop_name"
                                    label="ชื่อร้าน (Shop Name)"
                                    rules={[{ required: true, message: 'กรุณาระบุชื่อร้าน' }]}
                                >
                                    <Input placeholder="ระบุชื่อร้าน" size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="phone"
                                    label="เบอร์โทรศัพท์ (Phone)"
                                >
                                    <Input placeholder="ระบุเบอร์โทรศัพท์" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="address"
                            label="ที่อยู่ (Address)"
                        >
                            <Input.TextArea rows={3} placeholder="ระบุที่อยู่ร้าน" />
                        </Form.Item>

                        <Divider orientation={"left" as any} plain>การชำระเงิน (Money & Payments)</Divider>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="promptpay_number"
                                    label="เบอร์ PromptPay / เลขบัตรประชาชน (สำหรับ QR Code)"
                                    extra="ระบบจะนำเลขนี้ไปสร้าง QR Code รับเงินอัตโนมัติ"
                                >
                                    <Input placeholder="081XXXXXXX หรือ 1XXXXXXXXXXXX" size="large" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="promptpay_name"
                                    label="ชื่อบัญชี (Account Name)"
                                    extra="แสดงให้ลูกค้าเห็นเมื่อสแกน (Optional)"
                                >
                                    <Input placeholder="ระบุชื่อบัญชี" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />
                        
                        <div style={{ textAlign: "right" }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                icon={<SaveOutlined />} 
                                size="large" 
                                loading={saving}
                                style={{ background: colors.primary, minWidth: 150 }}
                            >
                                บันทึก (Save)
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}
