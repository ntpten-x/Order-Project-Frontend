"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Button, Table, Tag, Modal, Form, Input, Select, App, Space, Switch, Popconfirm, Divider, Row, Col, Empty, Spin } from "antd";
import { ArrowLeftOutlined, PlusOutlined, BankOutlined, QrcodeOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined, ShoppingCartOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { pageStyles } from "./style";
import { paymentAccountService } from "@/services/pos/paymentAccount.service";
import { authService } from "@/services/auth.service";
import { ShopPaymentAccount } from "@/types/api/pos/shopPaymentAccount";
import { posColors } from "@/theme/pos";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PaymentAccountManagementPage({ params }: { params: { mode: string[] } }) {
    const { message } = App.useApp();
    const router = useRouter();
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<string | null>(null);
    const accountType = Form.useWatch('account_type', form);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const data = await paymentAccountService.getByShopId();
            setAccounts(data);
        } catch (error) {
            message.error("ไม่สามารถโหลดข้อมูลบัญชีได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record: ShopPaymentAccount) => {
        setEditingId(record.id);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const csrfToken = await authService.getCsrfToken();
            await paymentAccountService.delete(id, undefined, undefined, csrfToken);
            message.success("ลบบัญชีสำเร็จ");
            fetchAccounts();
        } catch (error: any) {
            message.error(error.message || "ลบไม่สำเร็จ (บัญชีที่ใช้งานอยู่อาจลบไม่ได้)");
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Validation for number
            if (!/^\d+$/.test(values.account_number)) {
                return message.error("เบอร์โทร/เลขบัญชี ต้องเป็นตัวเลขเท่านั้น");
            }
            if (values.account_type === 'PromptPay' && values.account_number.length !== 10 && values.account_number.length !== 13) {
                return message.error("เบอร์พร้อมเพย์ต้องเป็น 10 หรือ 13 หลัก (เบอร์โทร/เลขบัตรประชาชน)");
            }
            if (values.account_type === 'BankAccount' && values.account_number.length < 10) {
                return message.error("เลขบัญชีต้องมีความยาวอย่างน้อย 10 หลัก");
            }

            const csrfToken = await authService.getCsrfToken();

            if (editingId) {
                await paymentAccountService.update(editingId, values, undefined, undefined, csrfToken);
                message.success("แก้ไขบัญชีสำเร็จ");
            } else {
                await paymentAccountService.create(values, undefined, undefined, csrfToken);
                message.success("เพิ่มบัญชีสำเร็จ");
            }
            setIsModalVisible(false);
            fetchAccounts();
        } catch (error: any) {
            if (error?.errorFields) return; // Form validation error
            message.error(error.message || "บันทึกไม่สำเร็จ");
        }
    };

    return (
        <div style={{ ...pageStyles.container, background: '#f8fafc', minHeight: '100vh', padding: '40px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <Button 
                            type="default" 
                            shape="circle"
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => router.back()}
                            style={{ width: 48, height: 48, border: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                        />
                        <div>
                            <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>จัดการพร้อมเพย์ (PromptPay)</Title>
                            <Text type="secondary" style={{ fontSize: 16 }}>ตั้งค่าและจัดการรายการพร้อมเพย์ทั้งหมดของคุณ</Text>
                        </div>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleAdd}
                        size="large"
                        style={{ 
                            borderRadius: 12, 
                            height: 52, 
                            padding: '0 28px', 
                            fontWeight: 600, 
                            background: posColors.primary,
                            boxShadow: `0 4px 12px ${posColors.primary}40`
                        }}
                    >
                        เพิ่มพร้อมเพย์ใหม่
                    </Button>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
                ) : accounts.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {accounts.map(acc => (
                            <Col xs={24} md={12} lg={8} key={acc.id}>
                                <Card 
                                    hoverable
                                    variant="borderless"
                                    style={{ 
                                        borderRadius: 20, 
                                        overflow: 'hidden', 
                                        boxShadow: acc.is_active ? `0 8px 24px ${posColors.primary}15` : '0 4px 12px rgba(0,0,0,0.03)',
                                        border: acc.is_active ? `2px solid ${posColors.primary}` : '2px solid transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                    bodyStyle={{ padding: 24 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                        <div style={{ 
                                            width: 56, 
                                            height: 56, 
                                            borderRadius: 16, 
                                            background: '#eb2f9610',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: 28,
                                            color: '#eb2f96'
                                        }}>
                                            <QrcodeOutlined />
                                        </div>
                                        {acc.is_active && (
                                            <Tag color="green" style={{ borderRadius: 8, margin: 0, padding: '4px 12px', fontWeight: 600, fontSize: 13, border: 'none' }}>
                                                <CheckCircleOutlined style={{ marginRight: 4 }} /> กำลังใช้งาน
                                            </Tag>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={4} style={{ margin: '0 0 4px 0', fontSize: 18, color: '#1e293b' }}>{acc.account_name}</Title>
                                        <Text type="secondary" style={{ fontSize: 14 }}>พร้อมเพย์ (PromptPay)</Text>
                                    </div>

                                    <div style={{ 
                                        background: '#f8fafc', 
                                        borderRadius: 12, 
                                        padding: '12px 16px', 
                                        marginBottom: 24,
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <Text strong style={{ fontSize: 20, letterSpacing: 1.5, fontFamily: 'monospace' }}>{acc.account_number}</Text>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                        <Button 
                                            icon={<EditOutlined />} 
                                            onClick={() => handleEdit(acc)}
                                            style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                                        >
                                            จัดการ
                                        </Button>
                                        {!acc.is_active && (
                                            <Popconfirm 
                                                title="ยืนยันการลบ?" 
                                                description="คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?"
                                                onConfirm={() => handleDelete(acc.id)}
                                                okText="ลบทิ้ง"
                                                cancelText="ยกเลิก"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 10 }} />
                                            </Popconfirm>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Card style={{ borderRadius: 24, padding: '80px 0', textAlign: 'center' }}>
                        <Empty 
                            description={<Text type="secondary" style={{ fontSize: 16 }}>ยังไม่มีข้อมูลบัญชีรับเงินในระบบ</Text>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary" size="large" onClick={handleAdd} icon={<PlusOutlined />} style={{ borderRadius: 10, height: 48, marginTop: 16 }}>
                                เริ่มต้นเพิ่มบัญชีแรก
                            </Button>
                        </Empty>
                    </Card>
                )}
            </div>

            <Modal
                title={editingId ? "แก้ไขข้อมูลพร้อมเพย์" : "เพิ่มพร้อมเพย์ใหม่"}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                okText="บันทึกข้อมูล"
                cancelText="ยกเลิก"
                okButtonProps={{ size: 'large', style: { borderRadius: 8, background: posColors.primary } }}
                cancelButtonProps={{ size: 'large', style: { borderRadius: 8 } }}
                width={500}
            >
                <div style={{ paddingTop: 12 }}>
                    <Form form={form} layout="vertical" initialValues={{ account_type: 'PromptPay' }}>
                        {/* Hidden field for account_type since it's always PromptPay */}
                        <Form.Item name="account_type" hidden initialValue="PromptPay">
                            <Input />
                        </Form.Item>

                        <Form.Item 
                            name="account_name" 
                            label={<Text strong>ชื่อบัญชี / เจ้าของพร้อมเพย์</Text>}
                            rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]}
                        >
                            <Input size="large" placeholder="เช่น นายสมใจ ดีมาก" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item 
                            name="account_number" 
                            label={<Text strong>เบอร์พร้อมเพย์ / เลขบัตรประชาชน</Text>}
                            rules={[
                                { required: true, message: 'กรุณาระบุเลขพร้อมเพย์' },
                                { pattern: /^\d+$/, message: 'ต้องเป็นตัวเลขเท่านั้น' },
                                { validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    if (value.length !== 10 && value.length !== 13) {
                                        return Promise.reject('ต้องเป็น 10 หรือ 13 หลัก');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                            extra="กรอกเบอร์โทรศัพท์ (10 หลัก) หรือ เลขบัตรประชาชน (13 หลัก)"
                        >
                            <Input size="large" placeholder="08xxxxxxxx หรือ 123xxxxxxxxxx" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Divider plain style={{ fontSize: 13, color: '#999' }}>ข้อมูลติดต่อเพิ่มเติม (ถ้ามี)</Divider>

                        <Form.Item 
                            name="phone" 
                            label={<Text strong>เบอร์โทรศัพท์ร้าน</Text>}
                        >
                            <Input size="large" placeholder="ระบุเบอร์โทรศัพท์สำหรับบัญชีนี้" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item 
                            name="address" 
                            label={<Text strong>ที่อยู่ร้าน</Text>}
                        >
                            <Input.TextArea rows={2} placeholder="ระบุที่อยู่สำหรับบัญชีนี้" style={{ borderRadius: 8 }} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
}
