"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Typography, Card, Form, Input, Button, Spin, Divider, Row, Col, App } from "antd";
import { SaveOutlined, ShopOutlined, SettingOutlined } from "@ant-design/icons";
import { shopProfileService, ShopProfile } from "../../../../services/pos/shopProfile.service";
import { authService } from "../../../../services/auth.service";
import { posPageStyles, posColors } from "@/theme/pos";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";

const { Title, Text } = Typography;

export default function POSSettingsPage() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const { showLoading, hideLoading } = useGlobalLoading();

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await shopProfileService.getProfile();
            form.setFieldsValue(data);
        } catch (error) {
            message.error("ไม่สามารถดึงข้อมูลร้านค้าได้");
        } finally {
            setLoading(false);
        }
    }, [form, message]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleSave = async (values: Partial<ShopProfile>) => {
        try {
            showLoading("กำลังบันทึกการตั้งค่า...");
            const csrfToken = await authService.getCsrfToken();
            await shopProfileService.updateProfile(values, undefined, csrfToken);
            message.success("บันทึกการตั้งค่าเรียบร้อย");
            await fetchProfile(); // Refresh
        } catch (error) {
            message.error("บันทึกไม่สำเร็จ");
        } finally {
            hideLoading();
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: posPageStyles.container.background as string }}>
                <Spin size="large" tip="กำลังโหลด..." />
            </div>
        );
    }

    return (
        <div style={posPageStyles.container}>
            {/* Header */}
            <div style={{ ...posPageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={posPageStyles.sectionTitle}>
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
                <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        initialValues={{}}
                        requiredMark="optional"
                    >
                        <Divider titlePlacement="left" plain style={{ fontSize: 16, fontWeight: 600 }}>
                            <ShopOutlined style={{ marginRight: 8 }} /> ข้อมูลร้านค้า (General Info)
                        </Divider>
                        
                        <Row gutter={24}>
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
                            <Input.TextArea rows={3} placeholder="ระบุที่อยู่ร้าน" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Divider titlePlacement="left" plain style={{ fontSize: 16, fontWeight: 600, marginTop: 32 }}>
                            การชำระเงิน (Money & Payments)
                        </Divider>

                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="promptpay_number"
                                    label="เบอร์ PromptPay / เลขบัตรประชาชน"
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

                        <Divider style={{ margin: '32px 0 24px' }} />
                        
                        <div style={{ textAlign: "right" }}>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                icon={<SaveOutlined />} 
                                size="large" 
                                style={{ 
                                    background: posColors.primary, 
                                    borderColor: posColors.primary,
                                    minWidth: 160,
                                    height: 48,
                                    borderRadius: 12,
                                    fontWeight: 600
                                }}
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
