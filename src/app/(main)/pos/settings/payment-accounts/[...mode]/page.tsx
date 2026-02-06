"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Button, Tag, Modal, Form, Input, App, Divider, Row, Col, Spin } from "antd";
import { PlusOutlined, QrcodeOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { pageStyles, paymentAccountsResponsiveStyles } from "./style";
import { paymentAccountService } from "../../../../../../services/pos/paymentAccount.service";
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { ShopPaymentAccount } from "../../../../../../types/api/pos/shopPaymentAccount";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { posColors } from "../../../../../../theme/pos";
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../../../components/ui/states/EmptyState";

const { Title, Text } = Typography;


export default function PaymentAccountManagementPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);


    const fetchAccounts = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await paymentAccountService.getByShopId();
            setAccounts(data);
        } catch {
            message.error("ไม่สามารถโหลดข้อมูลบัญชีได้");
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

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
            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.delete(id, undefined, undefined, csrfToken);
            message.success("ลบบัญชีสำเร็จ");
            setDeleteId(null);
            fetchAccounts();
        } catch (error: unknown) {
             const errorMessage = error instanceof Error ? error.message : "ลบไม่สำเร็จ (บัญชีที่ใช้งานอยู่อาจลบไม่ได้)";
             message.error(errorMessage);
             setDeleteId(null);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Validation for number (Strict 10 digits as requested)
            if (!/^\d{10}$/.test(values.account_number)) {
                return message.error("เบอร์พร้อมเพย์ต้องเป็นตัวเลข 10 หลักเท่านั้น");
            }
            
            if (values.phone && !/^\d{10}$/.test(values.phone)) {
                return message.error("เบอร์โทรศัพท์ร้านต้องเป็นตัวเลข 10 หลักเท่านั้น");
            }

            const csrfToken = await getCsrfTokenCached();

            if (editingId) {
                await paymentAccountService.update(editingId, values, undefined, undefined, csrfToken);
                message.success("แก้ไขบัญชีสำเร็จ");
            } else {
                await paymentAccountService.create(values, undefined, undefined, csrfToken);
                message.success("เพิ่มบัญชีสำเร็จ");
            }
            setIsModalVisible(false);
            fetchAccounts();
        } catch (error: unknown) {
            // Check if it's a form validation error (has errorFields property)
            // Since error is unknown, we need a type guard or safe check
            if (typeof error === 'object' && error !== null && 'errorFields' in error) return; 

            const errorMessage = error instanceof Error ? error.message : "บันทึกไม่สำเร็จ";
            message.error(errorMessage);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <style>{paymentAccountsResponsiveStyles}</style>

            <UIPageHeader
                title="จัดการพร้อมเพย์"
                subtitle="PromptPay Management"
                icon={<QrcodeOutlined />}
                onBack={() => router.back()}
                actions={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        เพิ่มพร้อมเพย์ใหม่
                    </Button>
                }
            />

            <PageContainer maxWidth={1100}>
                <PageSection style={{ background: "transparent", border: "none" }}>
                    <div style={pageStyles.contentWrapper} className="payment-content-mobile">
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
                                            <Button 
                                                danger 
                                                icon={<DeleteOutlined />} 
                                                style={{ borderRadius: 10 }}
                                                onClick={() => setDeleteId(acc.id)}
                                            />
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Card style={{ borderRadius: 24, padding: '80px 0', textAlign: 'center' }}>
                        <UIEmptyState
                            title="ยังไม่มีข้อมูลบัญชีรับเงินในระบบ"
                            description="กดปุ่มเพื่อเริ่มต้นเพิ่มบัญชีแรก"
                            action={
                                <Button type="primary" size="large" onClick={handleAdd} icon={<PlusOutlined />} style={{ borderRadius: 10, height: 48 }}>
                                    เริ่มต้นเพิ่มบัญชีแรก
                                </Button>
                            }
                        />
                    </Card>
                )}
                    </div>
                </PageSection>
            </PageContainer>

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
                            label={<Text strong>เบอร์พร้อมเพย์</Text>}
                            rules={[
                                { required: true, message: 'กรุณาระบุเลขพร้อมเพย์' },
                                { pattern: /^\d{10}$/, message: 'ต้องเป็นตัวเลข 10 หลักเท่านั้น' }
                            ]}
                            extra="กรอกเบอร์โทรศัพท์พร้อมเพย์ (10 หลัก)"
                        >
                            <Input 
                                size="large" 
                                placeholder="08xxxxxxxx" 
                                style={{ borderRadius: 8 }} 
                                maxLength={10}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    form.setFieldValue('account_number', val);
                                }}
                            />
                        </Form.Item>

                        <Divider plain style={{ fontSize: 13, color: '#999' }}>ข้อมูลติดต่อเพิ่มเติม (ถ้ามี)</Divider>

                        <Form.Item 
                            name="phone" 
                            label={<Text strong>เบอร์โทรศัพท์ร้าน</Text>}
                            rules={[
                                { pattern: /^\d{10}$/, message: 'ต้องเป็นตัวเลข 10 หลักเท่านั้น' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="08xxxxxxxx" 
                                style={{ borderRadius: 8 }} 
                                maxLength={10}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    form.setFieldValue('phone', val);
                                }}
                            />
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

            {/* Delete Confirmation Modal */}
            <Modal
                title="ยืนยันการลบ"
                open={deleteId !== null}
                onOk={() => deleteId && handleDelete(deleteId)}
                onCancel={() => setDeleteId(null)}
                okText="ลบทิ้ง"
                cancelText="ยกเลิก"
                okButtonProps={{ danger: true, size: 'large', style: { borderRadius: 8 } }}
                cancelButtonProps={{ size: 'large', style: { borderRadius: 8 } }}
                centered
            >
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                    <DeleteOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
                    <p style={{ fontSize: 16, margin: 0 }}>คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้?</p>
                    <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
            </Modal>
        </div>
    );
}
