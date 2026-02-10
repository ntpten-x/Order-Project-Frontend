'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Form, Input, Select, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography, Alert, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    CreditCardOutlined,
    CheckCircleFilled,
    AppstoreOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined,
    DownOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/paymentMethod/style';
import { PaymentMethod } from '../../../../../../types/api/pos/paymentMethod';

type ManageMode = 'add' | 'edit';

type PaymentMethodFormValues = {
    payment_method_name: string;
    display_name: string;
    is_active?: boolean;
};

const { Title, Text } = Typography;

const ALLOWED_PAYMENT_METHODS = [
    { payment_method_name: 'Cash', display_name: 'เงินสด' },
    { payment_method_name: 'PromptPay', display_name: 'พร้อมเพย์' },
    { payment_method_name: 'Delivery', display_name: 'เดลิเวอรี่' },
] as const;

type AllowedPaymentMethodName = typeof ALLOWED_PAYMENT_METHODS[number]['payment_method_name'];

const ALLOWED_PAYMENT_METHOD_NAMES = new Set<AllowedPaymentMethodName>(ALLOWED_PAYMENT_METHODS.map((item) => item.payment_method_name));

const isAllowedPaymentMethodName = (value: string): value is AllowedPaymentMethodName =>
    ALLOWED_PAYMENT_METHOD_NAMES.has(value as AllowedPaymentMethodName);

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const PaymentMethodPreviewCard = ({ displayName, methodName, isActive }: { displayName: string, methodName: string, isActive: boolean }) => (
    <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9',
    }}>
        <Title level={5} style={{ color: '#059669', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

        <div style={{
            borderRadius: 16,
            border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
            padding: 14,
            background: isActive ? '#f0fdf4' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
        }}>
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: isActive
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                    : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <CreditCardOutlined style={{
                    fontSize: 20,
                    color: isActive ? '#059669' : '#64748b'
                }} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                        {displayName || 'ชื่อแสดงผล'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {methodName || 'payment_method_name'}
                </Text>
            </div>
        </div>

        <Alert
            type={isActive ? 'success' : 'warning'}
            showIcon
            message={isActive ? 'ช่องทางนี้พร้อมใช้งานในการรับชำระ' : 'ช่องทางนี้จะไม่แสดงให้เลือกชำระเงิน'}
        />
    </div>
);

export default function PaymentMethodManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<PaymentMethodFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [paymentMethodName, setPaymentMethodName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalPaymentMethod, setOriginalPaymentMethod] = useState<PaymentMethod | null>(null);
    const [currentMethodName, setCurrentMethodName] = useState<string>('');
    const [isMethodModalVisible, setIsMethodModalVisible] = useState(false);
    const [existingMethods, setExistingMethods] = useState<string[]>([]);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ['Admin', 'Manager'] });

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขวิธีการชำระเงิน';
        return 'เพิ่มวิธีการชำระเงิน';
    }, [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/paymentMethod');
        }
    }, [isValidMode, mode, id, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };

        const fetchExistingMethods = async () => {
            try {
                const response = await fetch('/api/pos/paymentMethod?limit=100');
                if (response.ok) {
                    const data = await response.json();
                    if (data?.data) {
                        setExistingMethods(data.data.map((m: any) => m.payment_method_name.trim().toLowerCase()));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch existing methods:', err);
            }
        };

        fetchCsrf();
        fetchExistingMethods();
    }, []);

    const fetchPaymentMethod = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/paymentMethod/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            const data = await response.json();
            form.setFieldsValue({
                payment_method_name: data.payment_method_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setPaymentMethodName(data.payment_method_name || '');
            setIsActive(data.is_active);
            setCurrentMethodName((data.payment_method_name || '').toLowerCase());
            setOriginalPaymentMethod(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            router.replace('/pos/paymentMethod');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchPaymentMethod();
        }
    }, [isEdit, fetchPaymentMethod]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && value.toLowerCase() === currentMethodName) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/paymentMethod/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [currentMethodName, id, isEdit]);

    const onFinish = async (values: PaymentMethodFormValues) => {
        setSubmitting(true);
        try {
            if (!isAllowedPaymentMethodName(values.payment_method_name.trim())) {
                throw new Error('ชื่อในระบบต้องเป็น Cash, PromptPay หรือ Delivery เท่านั้น');
            }

            const payload: PaymentMethodFormValues = {
                payment_method_name: values.payment_method_name.trim(),
                display_name: values.display_name.trim(),
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/paymentMethod/update/${id}` : '/api/pos/paymentMethod/create';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตวิธีการชำระเงินได้' : 'ไม่สามารถสร้างวิธีการชำระเงินได้'));
            }

            message.success(isEdit ? 'อัปเดตวิธีการชำระเงินสำเร็จ' : 'สร้างวิธีการชำระเงินสำเร็จ');
            router.push('/pos/paymentMethod');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบวิธีการชำระเงิน "${displayName || paymentMethodName || '-'}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/paymentMethod/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบวิธีการชำระเงินได้');
                    message.success('ลบวิธีการชำระเงินสำเร็จ');
                    router.push('/pos/paymentMethod');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบวิธีการชำระเงินได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/paymentMethod');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader
                title={modeTitle}
                subtitle={isEdit ? 'ปรับแก้ชื่อและสถานะวิธีการชำระเงิน' : 'สร้างวิธีการชำระเงินใหม่ให้พร้อมใช้งาน'}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '90px 0' }}>
                            <Spin size="large" tip="กำลังโหลดข้อมูล..." />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 20,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                        overflow: 'hidden'
                                    }}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#059669' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลวิธีการชำระเงิน</Title>
                                    </div>

                                    <Form<PaymentMethodFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ is_active: true }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                            if (changedValues.payment_method_name !== undefined) setPaymentMethodName(changedValues.payment_method_name);
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                        }}
                                    >
                                        <Form.Item
                                            name="payment_method_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อในระบบ (payment_method_name)</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อในระบบ' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (!isAllowedPaymentMethodName(value.trim())) {
                                                            throw new Error('เลือกได้เฉพาะ Cash, PromptPay หรือ Delivery');
                                                        }
                                                        const duplicated = await checkNameConflict(value);
                                                        if (duplicated) throw new Error('ชื่อวิธีชำระเงินนี้ถูกใช้งานแล้ว');
                                                    }
                                                }
                                            ]}
                                        >
                                            {isEdit ? (
                                                <Input
                                                    size="large"
                                                    disabled
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => setIsMethodModalVisible(true)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderRadius: 12,
                                                        border: '2px solid',
                                                        cursor: 'pointer',
                                                        background: paymentMethodName ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : '#fff',
                                                        borderColor: paymentMethodName ? '#059669' : '#e2e8f0',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        minHeight: 46
                                                    }}
                                                >
                                                    <span style={{ color: paymentMethodName ? '#1e293b' : '#94a3b8', fontWeight: paymentMethodName ? 600 : 400 }}>
                                                        {paymentMethodName 
                                                            ? `${paymentMethodName} (${ALLOWED_PAYMENT_METHODS.find(m => m.payment_method_name === paymentMethodName)?.display_name})` 
                                                            : 'เลือกชื่อในระบบ'}
                                                    </span>
                                                    <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                                </div>
                                            )}
                                        </Form.Item>

                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อที่แสดง</span>}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                disabled
                                                maxLength={100}
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้ใช้งานในหน้า POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch style={{ background: isActive ? '#10B981' : undefined }} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <Alert
                                            showIcon
                                            type="info"
                                            icon={<InfoCircleOutlined />}
                                            message="ข้อมูลที่จำเป็น"
                                            description="ชื่อในระบบเลือกได้เฉพาะ 3 แบบ: Cash, PromptPay, Delivery และระบบจะตั้งชื่อที่แสดงให้อัตโนมัติ"
                                            style={{ marginBottom: 24 }}
                                        />

                                        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                            <Button
                                                size="large"
                                                onClick={handleBack}
                                                style={{ flex: 1, borderRadius: 12, height: 46, fontWeight: 600 }}
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={submitting}
                                                icon={<SaveOutlined />}
                                                style={{
                                                    flex: 2,
                                                    borderRadius: 12,
                                                    height: 46,
                                                    fontWeight: 600,
                                                    background: '#059669',
                                                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                                                }}
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <PaymentMethodPreviewCard
                                        displayName={displayName}
                                        methodName={paymentMethodName}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">ID: {originalPaymentMethod?.id || '-'}</Text>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalPaymentMethod?.create_date)}</Text>
                                            </div>
                                        </Card>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>

            {/* Payment Method Selection Modal */}
            <Modal
                title="เลือกชื่อในระบบ"
                open={isMethodModalVisible}
                onCancel={() => setIsMethodModalVisible(false)}
                footer={null}
                centered
                width={400}
                styles={{ body: { padding: '12px 16px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {ALLOWED_PAYMENT_METHODS.map(method => {
                        const methodKey = method.payment_method_name.trim().toLowerCase();
                        const isAlreadyExists = existingMethods.includes(methodKey);
                        
                        return (
                            <div
                                key={method.payment_method_name}
                                onClick={() => {
                                    if (isAlreadyExists) return;
                                    form.setFieldsValue({ 
                                        payment_method_name: method.payment_method_name,
                                        display_name: method.display_name 
                                    });
                                    setDisplayName(method.display_name);
                                    setPaymentMethodName(method.payment_method_name);
                                    setIsMethodModalVisible(false);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid',
                                    borderRadius: 12,
                                    cursor: isAlreadyExists ? 'not-allowed' : 'pointer',
                                    background: paymentMethodName === method.payment_method_name 
                                        ? '#f0fdf4' 
                                        : isAlreadyExists ? '#f8fafc' : '#fff',
                                    borderColor: paymentMethodName === method.payment_method_name 
                                        ? '#10B981' 
                                        : isAlreadyExists ? '#e2e8f0' : '#e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    minHeight: 54,
                                    opacity: isAlreadyExists ? 0.6 : 1
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ 
                                        fontWeight: paymentMethodName === method.payment_method_name ? 600 : 400, 
                                        fontSize: 16,
                                        textDecoration: isAlreadyExists ? 'line-through' : 'none',
                                        color: isAlreadyExists ? '#94a3b8' : 'inherit'
                                    }}>
                                        {method.payment_method_name}
                                    </span>
                                    <span style={{ fontSize: 12, color: isAlreadyExists ? '#cbd5e1' : '#64748b' }}>
                                        {isAlreadyExists ? 'มีในระบบแล้ว' : method.display_name}
                                    </span>
                                </div>
                                {paymentMethodName === method.payment_method_name && (
                                    <CheckCircleOutlined style={{ color: '#10B981', fontSize: 18 }} />
                                )}
                                {isAlreadyExists && (
                                    <Tag bordered={false} color="default">มีแล้ว</Tag>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}

