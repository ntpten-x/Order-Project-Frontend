'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    DeleteOutlined,
    DownOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { pageStyles } from '../../../../../../theme/pos/paymentMethod/style';
import { PaymentMethod } from '../../../../../../types/api/pos/paymentMethod';
import { useAuth } from '../../../../../../contexts/AuthContext';


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

const ALLOWED_PAYMENT_METHOD_NAMES = new Set<AllowedPaymentMethodName>(
    ALLOWED_PAYMENT_METHODS.map((item) => item.payment_method_name)
);

const isAllowedPaymentMethodName = (value: string): value is AllowedPaymentMethodName =>
    ALLOWED_PAYMENT_METHOD_NAMES.has(value as AllowedPaymentMethodName);

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const getPaymentMethodIcon = (methodName: string, isActive: boolean) => {
    const code = methodName.toLowerCase();
    if (code.includes('cash')) {
        return <WalletOutlined style={{ color: isActive ? '#4d7c0f' : '#94a3b8' }} />;
    }
    return <CreditCardOutlined style={{ color: isActive ? '#059669' : '#94a3b8' }} />;
};

export default function PaymentMethodManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<PaymentMethodFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalPaymentMethod, setOriginalPaymentMethod] = useState<PaymentMethod | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [paymentMethodName, setPaymentMethodName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [currentMethodName, setCurrentMethodName] = useState('');
    const [isMethodModalVisible, setIsMethodModalVisible] = useState(false);
    const [existingMethods, setExistingMethods] = useState<string[]>([]);
    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';
    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'payment_method.manager.feature', action: 'access' },
        redirectUnauthorized: '/pos/paymentMethod',
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการวิธีการชำระเงิน',
    });
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canOpenManager = can('payment_method.manager.feature', 'access');
    const canCreatePaymentMethods =
        can('payment_method.page', 'create') &&
        can('payment_method.create.feature', 'create') &&
        canOpenManager;
    const canEditPaymentMethodCatalog =
        can('payment_method.page', 'update') &&
        can('payment_method.catalog.feature', 'update') &&
        canOpenManager;
    const canUpdatePaymentMethodStatus =
        can('payment_method.page', 'update') &&
        can('payment_method.status.feature', 'update') &&
        canOpenManager;
    const canDeletePaymentMethods =
        can('payment_method.page', 'delete') &&
        can('payment_method.delete.feature', 'delete') &&
        canOpenManager;
    const canSubmitAdd = canCreatePaymentMethods;
    const canSubmitEdit = canEditPaymentMethodCatalog || canUpdatePaymentMethodStatus;


    const title = useMemo(() => (isEdit ? 'แก้ไขวิธีการชำระเงิน' : 'เพิ่มวิธีการชำระเงิน'), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/paymentMethod');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreatePaymentMethods) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มวิธีการชำระเงิน');
            router.replace('/pos/paymentMethod');
            return;
        }
        if (mode === 'edit' && !canEditPaymentMethodCatalog && !canUpdatePaymentMethodStatus && !canDeletePaymentMethods) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขวิธีการชำระเงิน');
            router.replace('/pos/paymentMethod');
        }
    }, [
        canCreatePaymentMethods,
        canDeletePaymentMethods,
        canEditPaymentMethodCatalog,
        canUpdatePaymentMethodStatus,
        isAuthorized,
        isChecking,
        mode,
        permissionLoading,
        router,
    ]);

    const fetchExistingMethods = useCallback(async () => {
        if (!canOpenManager) return;
        try {
            const response = await fetch('/api/pos/paymentMethod?limit=100', { cache: 'no-store' });
            if (!response.ok) return;
            const data = await response.json();
            setExistingMethods((data?.data || []).map((item: PaymentMethod) => item.payment_method_name.trim().toLowerCase()));
        } catch {
            setExistingMethods([]);
        }
    }, [canOpenManager]);

    useEffect(() => {
        if (isAuthorized && !permissionLoading) void fetchExistingMethods();
    }, [fetchExistingMethods, isAuthorized, permissionLoading]);

    const fetchPaymentMethod = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/paymentMethod/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            const data = await response.json();
            form.setFieldsValue({
                payment_method_name: data.payment_method_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setPaymentMethodName(data.payment_method_name || '');
            setCurrentMethodName((data.payment_method_name || '').trim().toLowerCase());
            setIsActive(Boolean(data.is_active));
            setOriginalPaymentMethod(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            router.replace('/pos/paymentMethod');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) void fetchPaymentMethod();
    }, [fetchPaymentMethod, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!canCreatePaymentMethods) return false;
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && value.toLowerCase() === currentMethodName) return false;
        try {
            const response = await fetch(`/api/pos/paymentMethod/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canCreatePaymentMethods, currentMethodName, id, isEdit]);

    const handleSubmit = async (values: PaymentMethodFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์บันทึกการแก้ไขวิธีการชำระเงิน' : 'คุณไม่มีสิทธิ์สร้างวิธีการชำระเงิน');
            return;
        }

        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<PaymentMethodFormValues> = {};

            if (!isEdit) {
                if (!isAllowedPaymentMethodName(values.payment_method_name.trim())) {
                    throw new Error('เลือกได้เฉพาะ Cash, PromptPay หรือ Delivery');
                }
                payload.payment_method_name = values.payment_method_name.trim();
                payload.display_name = values.display_name.trim();
                payload.is_active = values.is_active;
            } else {
                if (canEditPaymentMethodCatalog) {
                    payload.display_name = values.display_name.trim();
                }
                if (canUpdatePaymentMethodStatus) {
                    payload.is_active = values.is_active;
                }
            }

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }

            const response = await fetch(isEdit ? `/api/pos/paymentMethod/update/${id}` : '/api/pos/paymentMethod/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกวิธีการชำระเงินได้');
            }
            message.success(isEdit ? 'อัปเดตวิธีการชำระเงินสำเร็จ' : 'สร้างวิธีการชำระเงินสำเร็จ');
            router.replace('/pos/paymentMethod');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกวิธีการชำระเงินได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeletePaymentMethods) return;
        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบวิธีการชำระเงิน ${displayName || paymentMethodName || '-'} หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/paymentMethod/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบวิธีการชำระเงินได้');
                    }
                    message.success('ลบวิธีการชำระเงินสำเร็จ');
                    router.replace('/pos/paymentMethod');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบวิธีการชำระเงินได้');
                }
            },
        });
    };

    const handleMethodSelect = (methodName: AllowedPaymentMethodName, displayNameValue: string) => {
        form.setFieldsValue({
            payment_method_name: methodName,
            display_name: displayNameValue,
        });
        setPaymentMethodName(methodName);
        setDisplayName(displayNameValue);
        setIsMethodModalVisible(false);
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (isEdit ? (!canEditPaymentMethodCatalog && !canUpdatePaymentMethodStatus && !canDeletePaymentMethods) : !canCreatePaymentMethods) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader
                title={title}
                onBack={() => router.replace('/pos/paymentMethod')}
                actions={isEdit && canDeletePaymentMethods ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        ลบ
                    </Button>
                ) : null}
            />
            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                        
                        {isEdit && !canSubmitEdit ? (
                            <Alert
                                type="warning"
                                showIcon
                                message="หน้า edit นี้เปิดได้เฉพาะบาง action"
                                description={canDeletePaymentMethods ? 'บัญชีนี้ลบวิธีการชำระเงินได้ แต่ไม่สามารถแก้ชื่อหรือสถานะได้' : 'บัญชีนี้ไม่มี field สำหรับบันทึกในหน้านี้'}
                            />
                        ) : null}
                    </div>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#059669' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลวิธีการชำระเงิน</Title>
                                    </div>
                                    <Form<PaymentMethodFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                            if (changedValues.payment_method_name !== undefined) setPaymentMethodName(changedValues.payment_method_name);
                                            if (changedValues.is_active !== undefined) setIsActive(Boolean(changedValues.is_active));
                                        }}
                                    >
                                        <Form.Item
                                            name="payment_method_name"
                                            label={<span style={{ fontWeight: 600 }}>ช่องทางการชำระเงิน</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณาเลือกช่องทางการชำระเงิน' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (!isAllowedPaymentMethodName(value.trim())) {
                                                            throw new Error('เลือกได้เฉพาะ Cash, PromptPay หรือ Delivery');
                                                        }
                                                        if (await checkNameConflict(value)) {
                                                            throw new Error('ชื่อวิธีชำระเงินนี้ถูกใช้งานแล้ว');
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            {isEdit ? (
                                                <Input
                                                    size="large"
                                                    disabled
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => {
                                                        if (!canCreatePaymentMethods) return;
                                                        setIsMethodModalVisible(true);
                                                    }}
                                                    style={{
                                                        padding: '10px 16px',
                                                        borderRadius: 12,
                                                        border: '2px solid',
                                                        cursor: canCreatePaymentMethods ? 'pointer' : 'not-allowed',
                                                        background: paymentMethodName ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : '#fff',
                                                        borderColor: paymentMethodName ? '#059669' : '#e2e8f0',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        minHeight: 46,
                                                        opacity: canCreatePaymentMethods ? 1 : 0.7,
                                                    }}
                                                >
                                                    <span style={{ color: paymentMethodName ? '#1e293b' : '#94a3b8', fontWeight: paymentMethodName ? 600 : 400 }}>
                                                        {paymentMethodName
                                                            ? `${paymentMethodName} (${ALLOWED_PAYMENT_METHODS.find((item) => item.payment_method_name === paymentMethodName)?.display_name})`
                                                            : 'เลือกชื่อในระบบ'}
                                                    </span>
                                                    <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                                </div>
                                            )}
                                        </Form.Item>
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>ชื่อที่แสดง</span>}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                maxLength={100}
                                                disabled={isEdit ? !canEditPaymentMethodCatalog : !canCreatePaymentMethods}
                                                style={{
                                                    borderRadius: 12,
                                                    height: 46,
                                                    backgroundColor: isEdit && !canEditPaymentMethodCatalog ? '#f8fafc' : undefined,
                                                    border: '1px solid #e2e8f0',
                                                }}
                                            />
                                        </Form.Item>
                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                        เปิดเพื่อให้ใช้งานในหน้า POS
                                                    </Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} disabled={isEdit ? !canUpdatePaymentMethodStatus : !canCreatePaymentMethods} />
                                                </Form.Item>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/paymentMethod')} style={{ flex: 1 }}>
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                icon={<SaveOutlined />}
                                                loading={submitting}
                                                disabled={isEdit ? !canSubmitEdit : !canSubmitAdd}
                                                style={{ flex: 2 }}
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>
                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                            {getPaymentMethodIcon(paymentMethodName, isActive)}
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName || 'ชื่อที่แสดง'}</Title>
                                        <Text style={{ display: 'block', marginBottom: 12, color: '#059669', fontWeight: 600 }}>
                                            {paymentMethodName || 'Payment method'}
                                        </Text>
                                        <Alert
                                            type={isActive ? 'success' : 'warning'}
                                            showIcon
                                            message={isActive ? 'ช่องทางนี้พร้อมใช้งานในการรับชำระ' : 'ช่องทางนี้จะไม่แสดงให้เลือกชำระเงิน'}
                                        />
                                    </Card>
                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>ID: {originalPaymentMethod?.id || '-'}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalPaymentMethod?.create_date)}</Text>
                                        </Card>
                                    ) : null}
                                    
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>

            <Modal
                title="เลือกชื่อในระบบ"
                open={isMethodModalVisible}
                onCancel={() => setIsMethodModalVisible(false)}
                footer={null}
                centered
                width="min(420px, calc(100vw - 16px))"
                styles={{ body: { padding: '12px 16px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {ALLOWED_PAYMENT_METHODS.map((method) => {
                        const methodKey = method.payment_method_name.trim().toLowerCase();
                        const isAlreadyExists = !isEdit && existingMethods.includes(methodKey);
                        return (
                            <div
                                key={method.payment_method_name}
                                onClick={() => {
                                    if (isAlreadyExists || !canCreatePaymentMethods) return;
                                    handleMethodSelect(method.payment_method_name, method.display_name);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid',
                                    borderRadius: 12,
                                    cursor: isAlreadyExists || !canCreatePaymentMethods ? 'not-allowed' : 'pointer',
                                    background: paymentMethodName === method.payment_method_name ? '#f0fdf4' : isAlreadyExists ? '#f8fafc' : '#fff',
                                    borderColor: paymentMethodName === method.payment_method_name ? '#10b981' : isAlreadyExists ? '#e2e8f0' : '#e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    minHeight: 54,
                                    opacity: isAlreadyExists || !canCreatePaymentMethods ? 0.6 : 1,
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span
                                        style={{
                                            fontWeight: paymentMethodName === method.payment_method_name ? 600 : 400,
                                            fontSize: 16,
                                            textDecoration: isAlreadyExists ? 'line-through' : 'none',
                                            color: isAlreadyExists ? '#94a3b8' : 'inherit',
                                        }}
                                    >
                                        {method.payment_method_name}
                                    </span>
                                    <span style={{ fontSize: 12, color: isAlreadyExists ? '#cbd5e1' : '#64748b' }}>
                                        {isAlreadyExists ? 'มีในระบบแล้ว' : method.display_name}
                                    </span>
                                </div>
                                {paymentMethodName === method.payment_method_name ? (
                                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
                                ) : null}
                                {isAlreadyExists ? <Tag bordered={false} color="default">มีแล้ว</Tag> : null}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
