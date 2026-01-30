"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Button, Table, Tag, Modal, Form, Input, Select, App, Space, Switch, Popconfirm, Divider, Row, Col, Empty, Spin } from "antd";
import { ArrowLeftOutlined, PlusOutlined, BankOutlined, QrcodeOutlined, DeleteOutlined, CheckCircleOutlined, EditOutlined, ShoppingCartOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { pageStyles } from "./style";
import { paymentAccountService } from "@/services/pos/paymentAccount.service";
import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { ShopPaymentAccount } from "@/types/api/pos/shopPaymentAccount";
import { posColors } from "@/theme/pos";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PaymentAccountManagementPage({ params }: { params: { mode: string[] } }) {
    const { message } = App.useApp();
    const router = useRouter();
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });
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
            message.error("เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเนเธ”เน");
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
            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.delete(id, undefined, undefined, csrfToken);
            message.success("เธฅเธเธเธฑเธเธเธตเธชเธณเน€เธฃเนเธ");
            fetchAccounts();
        } catch (error: any) {
            message.error(error.message || "เธฅเธเนเธกเนเธชเธณเน€เธฃเนเธ (เธเธฑเธเธเธตเธ—เธตเนเนเธเนเธเธฒเธเธญเธขเธนเนเธญเธฒเธเธฅเธเนเธกเนเนเธ”เน)");
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Validation for number
            if (!/^\d+$/.test(values.account_number)) {
                return message.error("เน€เธเธญเธฃเนเนเธ—เธฃ/เน€เธฅเธเธเธฑเธเธเธต เธ•เนเธญเธเน€เธเนเธเธ•เธฑเธงเน€เธฅเธเน€เธ—เนเธฒเธเธฑเนเธ");
            }
            if (values.account_type === 'PromptPay' && values.account_number.length !== 10 && values.account_number.length !== 13) {
                return message.error("เน€เธเธญเธฃเนเธเธฃเนเธญเธกเน€เธเธขเนเธ•เนเธญเธเน€เธเนเธ 10 เธซเธฃเธทเธญ 13 เธซเธฅเธฑเธ (เน€เธเธญเธฃเนเนเธ—เธฃ/เน€เธฅเธเธเธฑเธ•เธฃเธเธฃเธฐเธเธฒเธเธ)");
            }
            if (values.account_type === 'BankAccount' && values.account_number.length < 10) {
                return message.error("เน€เธฅเธเธเธฑเธเธเธตเธ•เนเธญเธเธกเธตเธเธงเธฒเธกเธขเธฒเธงเธญเธขเนเธฒเธเธเนเธญเธข 10 เธซเธฅเธฑเธ");
            }

            const csrfToken = await getCsrfTokenCached();

            if (editingId) {
                await paymentAccountService.update(editingId, values, undefined, undefined, csrfToken);
                message.success("เนเธเนเนเธเธเธฑเธเธเธตเธชเธณเน€เธฃเนเธ");
            } else {
                await paymentAccountService.create(values, undefined, undefined, csrfToken);
                message.success("เน€เธเธดเนเธกเธเธฑเธเธเธตเธชเธณเน€เธฃเนเธ");
            }
            setIsModalVisible(false);
            fetchAccounts();
        } catch (error: any) {
            if (error?.errorFields) return; // Form validation error
            message.error(error.message || "เธเธฑเธเธ—เธถเธเนเธกเนเธชเธณเน€เธฃเนเธ");
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

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
                            <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>เธเธฑเธ”เธเธฒเธฃเธเธฃเนเธญเธกเน€เธเธขเน (PromptPay)</Title>
                            <Text type="secondary" style={{ fontSize: 16 }}>เธ•เธฑเนเธเธเนเธฒเนเธฅเธฐเธเธฑเธ”เธเธฒเธฃเธฃเธฒเธขเธเธฒเธฃเธเธฃเนเธญเธกเน€เธเธขเนเธ—เธฑเนเธเธซเธกเธ”เธเธญเธเธเธธเธ“</Text>
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
                        เน€เธเธดเนเธกเธเธฃเนเธญเธกเน€เธเธขเนเนเธซเธกเน
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
                                                <CheckCircleOutlined style={{ marginRight: 4 }} /> เธเธณเธฅเธฑเธเนเธเนเธเธฒเธ
                                            </Tag>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <Title level={4} style={{ margin: '0 0 4px 0', fontSize: 18, color: '#1e293b' }}>{acc.account_name}</Title>
                                        <Text type="secondary" style={{ fontSize: 14 }}>เธเธฃเนเธญเธกเน€เธเธขเน (PromptPay)</Text>
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
                                            เธเธฑเธ”เธเธฒเธฃ
                                        </Button>
                                        {!acc.is_active && (
                                            <Popconfirm 
                                                title="เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธ?" 
                                                description="เธเธธเธ“เนเธเนเนเธเธซเธฃเธทเธญเนเธกเนเธงเนเธฒเธ•เนเธญเธเธเธฒเธฃเธฅเธเธเธฑเธเธเธตเธเธตเน?"
                                                onConfirm={() => handleDelete(acc.id)}
                                                okText="เธฅเธเธ—เธดเนเธ"
                                                cancelText="เธขเธเน€เธฅเธดเธ"
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
                            description={<Text type="secondary" style={{ fontSize: 16 }}>เธขเธฑเธเนเธกเนเธกเธตเธเนเธญเธกเธนเธฅเธเธฑเธเธเธตเธฃเธฑเธเน€เธเธดเธเนเธเธฃเธฐเธเธ</Text>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary" size="large" onClick={handleAdd} icon={<PlusOutlined />} style={{ borderRadius: 10, height: 48, marginTop: 16 }}>
                                เน€เธฃเธดเนเธกเธ•เนเธเน€เธเธดเนเธกเธเธฑเธเธเธตเนเธฃเธ
                            </Button>
                        </Empty>
                    </Card>
                )}
            </div>

            <Modal
                title={editingId ? "เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฃเนเธญเธกเน€เธเธขเน" : "เน€เธเธดเนเธกเธเธฃเนเธญเธกเน€เธเธขเนเนเธซเธกเน"}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                okText="เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ"
                cancelText="เธขเธเน€เธฅเธดเธ"
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
                            label={<Text strong>เธเธทเนเธญเธเธฑเธเธเธต / เน€เธเนเธฒเธเธญเธเธเธฃเนเธญเธกเน€เธเธขเน</Text>}
                            rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธทเนเธญ' }]}
                        >
                            <Input size="large" placeholder="เน€เธเนเธ เธเธฒเธขเธชเธกเนเธ เธ”เธตเธกเธฒเธ" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item 
                            name="account_number" 
                            label={<Text strong>เน€เธเธญเธฃเนเธเธฃเนเธญเธกเน€เธเธขเน / เน€เธฅเธเธเธฑเธ•เธฃเธเธฃเธฐเธเธฒเธเธ</Text>}
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเน€เธฅเธเธเธฃเนเธญเธกเน€เธเธขเน' },
                                { pattern: /^\d+$/, message: 'เธ•เนเธญเธเน€เธเนเธเธ•เธฑเธงเน€เธฅเธเน€เธ—เนเธฒเธเธฑเนเธ' },
                                { validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    if (value.length !== 10 && value.length !== 13) {
                                        return Promise.reject('เธ•เนเธญเธเน€เธเนเธ 10 เธซเธฃเธทเธญ 13 เธซเธฅเธฑเธ');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                            extra="เธเธฃเธญเธเน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เน (10 เธซเธฅเธฑเธ) เธซเธฃเธทเธญ เน€เธฅเธเธเธฑเธ•เธฃเธเธฃเธฐเธเธฒเธเธ (13 เธซเธฅเธฑเธ)"
                        >
                            <Input size="large" placeholder="08xxxxxxxx เธซเธฃเธทเธญ 123xxxxxxxxxx" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Divider plain style={{ fontSize: 13, color: '#999' }}>เธเนเธญเธกเธนเธฅเธ•เธดเธ”เธ•เนเธญเน€เธเธดเนเธกเน€เธ•เธดเธก (เธ–เนเธฒเธกเธต)</Divider>

                        <Form.Item 
                            name="phone" 
                            label={<Text strong>เน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเธฃเนเธฒเธ</Text>}
                        >
                            <Input size="large" placeholder="เธฃเธฐเธเธธเน€เธเธญเธฃเนเนเธ—เธฃเธจเธฑเธเธ—เนเธชเธณเธซเธฃเธฑเธเธเธฑเธเธเธตเธเธตเน" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item 
                            name="address" 
                            label={<Text strong>เธ—เธตเนเธญเธขเธนเนเธฃเนเธฒเธ</Text>}
                        >
                            <Input.TextArea rows={2} placeholder="เธฃเธฐเธเธธเธ—เธตเนเธญเธขเธนเนเธชเธณเธซเธฃเธฑเธเธเธฑเธเธเธตเธเธตเน" style={{ borderRadius: 8 }} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </div>
    );
}

