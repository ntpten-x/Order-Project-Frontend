'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import {
    AppstoreOutlined,
    CarOutlined,
    CheckCircleFilled,
    DeleteOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/delivery/style';
import { Delivery } from '../../../../../../types/api/pos/delivery';
import { isSupportedImageSource, normalizeImageSource, resolveImageSource } from '../../../../../../utils/image/source';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import SmartAvatar from '../../../../../../components/ui/image/SmartAvatar';
import { useAuth } from '../../../../../../contexts/AuthContext';


type DeliveryManageMode = 'add' | 'edit';

type DeliveryFormValues = {
    delivery_name: string;
    delivery_prefix?: string;
    logo?: string;
    is_active?: boolean;
};

const { Title, Text } = Typography;

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const DeliveryPreviewCard = ({
    deliveryName,
    deliveryPrefix,
    logo,
    isActive,
}: {
    deliveryName: string;
    deliveryPrefix: string;
    logo: string;
    isActive: boolean;
}) => {
    const logoSource = resolveImageSource(logo);
    return (
        <div
            style={{
                background: 'white',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                border: '1px solid #F1F5F9',
            }}
        >
            <Title level={5} style={{ color: '#0891B2', marginBottom: 16, fontWeight: 700 }}>
                ตัวอย่างการแสดงผล
            </Title>

            <div
                style={{
                    borderRadius: 16,
                    border: `1px solid ${isActive ? '#a5f3fc' : '#e2e8f0'}`,
                    padding: 14,
                    background: isActive ? '#ecfeff' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                }}
            >
                <SmartAvatar
                    src={logo}
                    alt={deliveryName || 'Delivery logo'}
                    shape="square"
                    size={48}
                    icon={<CarOutlined />}
                    imageStyle={{ objectFit: 'contain' }}
                    style={{
                        borderRadius: 12,
                        background: logoSource
                            ? '#ffffff'
                            : isActive
                                ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                                : '#e2e8f0',
                        color: isActive ? '#0891B2' : '#64748b',
                        border: logoSource ? '1px solid #bae6fd' : undefined,
                    }}
                />

                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {deliveryName || 'ชื่อช่องทางจัดส่ง'}
                        </Text>
                        {isActive ? <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} /> : null}
                    </div>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                        รหัสย่อ : {deliveryPrefix || '-'}
                    </Text>
                </div>
            </div>

            <Alert
                type={isActive ? 'success' : 'warning'}
                showIcon
                message={isActive ? 'ช่องทางนี้พร้อมใช้งานในหน้า POS' : 'ช่องทางนี้จะไม่แสดงให้เลือกใช้งาน'}
            />
        </div>
    );
};

export default function DeliveryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<DeliveryFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deliveryName, setDeliveryName] = useState('');
    const [deliveryPrefix, setDeliveryPrefix] = useState('');
    const [logo, setLogo] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalDelivery, setOriginalDelivery] = useState<Delivery | null>(null);
    const [currentDeliveryName, setCurrentDeliveryName] = useState('');

    const mode = params.mode?.[0] as DeliveryManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);

    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'delivery.manager.feature', action: 'access' },
        redirectUnauthorized: '/pos/delivery',
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการเดลิเวอรี่',
    });
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canOpenManager = can('delivery.manager.feature', 'access');
    const canCreateDelivery = can('delivery.page', 'create') && can('delivery.create.feature', 'create') && canOpenManager;
    const canEditDelivery = can('delivery.page', 'update') && can('delivery.edit.feature', 'update') && canOpenManager;
    const canUpdateStatus = can('delivery.page', 'update') && can('delivery.status.feature', 'update') && canOpenManager;
    const canDeleteDelivery = can('delivery.page', 'delete') && can('delivery.delete.feature', 'delete') && canOpenManager;
    const canSubmitAdd = canCreateDelivery;
    const canSubmitEdit = canEditDelivery || canUpdateStatus;
    const currentRoleName = String(user?.role ?? '').trim().toLowerCase();


    const modeTitle = useMemo(() => (isEdit ? 'แก้ไขช่องทางจัดส่ง' : 'เพิ่มช่องทางจัดส่ง'), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/delivery');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;

        if (mode === 'add' && !canCreateDelivery) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มช่องทางจัดส่ง');
            router.replace('/pos/delivery');
            return;
        }

        if (mode === 'edit' && !canEditDelivery && !canUpdateStatus && !canDeleteDelivery) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง');
            router.replace('/pos/delivery');
        }
    }, [
        canCreateDelivery,
        canDeleteDelivery,
        canEditDelivery,
        canUpdateStatus,
        isAuthorized,
        isChecking,
        mode,
        permissionLoading,
        router,
    ]);

    const fetchDelivery = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/delivery/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้');
            const data = await response.json();
            form.setFieldsValue({
                delivery_name: data.delivery_name,
                delivery_prefix: data.delivery_prefix,
                logo: data.logo,
                is_active: data.is_active,
            });
            setDeliveryName(data.delivery_name || '');
            setDeliveryPrefix(data.delivery_prefix || '');
            setLogo(data.logo || '');
            setIsActive(Boolean(data.is_active));
            setCurrentDeliveryName((data.delivery_name || '').toLowerCase());
            setOriginalDelivery(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้');
            router.replace('/pos/delivery');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) {
            void fetchDelivery();
        }
    }, [fetchDelivery, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(
        async (rawValue: string) => {
            if (!(isEdit ? canEditDelivery : canCreateDelivery)) return false;
            const value = rawValue.trim();
            if (!value) return false;

            if (isEdit && value.toLowerCase() === currentDeliveryName) {
                return false;
            }

            try {
                const response = await fetch(`/api/pos/delivery/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
                if (!response.ok) return false;
                const found = await response.json();
                if (!found?.id) return false;
                if (isEdit && found.id === id) return false;
                return true;
            } catch {
                return false;
            }
        },
        [canCreateDelivery, canEditDelivery, currentDeliveryName, id, isEdit]
    );

    const onFinish = async (values: DeliveryFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.error(isEdit ? 'คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง' : 'คุณไม่มีสิทธิ์เพิ่มช่องทางจัดส่ง');
            return;
        }

        setSubmitting(true);
        try {
            const payload: Partial<DeliveryFormValues> = {};

            if (!isEdit) {
                payload.delivery_name = values.delivery_name.trim();
                payload.delivery_prefix = values.delivery_prefix?.trim().toUpperCase() || undefined;
                payload.logo = normalizeImageSource(values.logo) || undefined;
                payload.is_active = values.is_active;
            } else {
                if (canEditDelivery) {
                    payload.delivery_name = values.delivery_name.trim();
                    payload.delivery_prefix = values.delivery_prefix?.trim().toUpperCase() || undefined;
                    payload.logo = normalizeImageSource(values.logo) || undefined;
                }
                if (canUpdateStatus) {
                    payload.is_active = values.is_active;
                }
            }

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }

            const endpoint = isEdit ? `/api/pos/delivery/update/${id}` : '/api/pos/delivery/create';
            const method = isEdit ? 'PUT' : 'POST';
            const token = csrfToken || await getCsrfTokenCached();

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตช่องทางจัดส่งได้' : 'ไม่สามารถสร้างช่องทางจัดส่งได้'));
            }

            message.success(isEdit ? 'อัปเดตช่องทางจัดส่งสำเร็จ' : 'สร้างช่องทางจัดส่งสำเร็จ');
            router.push('/pos/delivery');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteDelivery) {
            message.error('คุณไม่มีสิทธิ์ลบช่องทางจัดส่ง');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบช่องทางจัดส่ง',
            content: `คุณต้องการลบช่องทางจัดส่ง ${deliveryName || '-'} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/delivery/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': token,
                        },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบช่องทางจัดส่งได้');
                    }
                    message.success('ลบช่องทางจัดส่งสำเร็จ');
                    router.replace('/pos/delivery');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบช่องทางจัดส่งได้');
                }
            },
        });
    };

    const handleBack = () => router.replace('/pos/delivery');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    if (isEdit ? (!canEditDelivery && !canUpdateStatus && !canDeleteDelivery) : !canCreateDelivery) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader
                title={modeTitle}
                onBack={handleBack}
                actions={
                    isEdit && canDeleteDelivery ? (
                        <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>

                        {isEdit && !canSubmitEdit ? (
                            <Alert
                                type="warning"
                                showIcon
                                message="หน้า edit นี้เปิดได้เฉพาะบาง action"
                                description={canDeleteDelivery ? 'บัญชีนี้ลบช่องทางจัดส่งได้ แต่ไม่สามารถแก้ชื่อ prefix โลโก้ หรือสถานะได้' : 'บัญชีนี้ไม่มี field สำหรับบันทึกในหน้านี้'}
                            />
                        ) : null}
                    </div>

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
                                        overflow: 'hidden',
                                    }}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#0891B2' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลช่องทางจัดส่ง</Title>
                                    </div>

                                    <Form<DeliveryFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ is_active: true }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.delivery_name !== undefined) setDeliveryName(changedValues.delivery_name);
                                            if (changedValues.delivery_prefix !== undefined) setDeliveryPrefix((changedValues.delivery_prefix || '').toUpperCase());
                                            if (changedValues.logo !== undefined) setLogo(changedValues.logo);
                                            if (changedValues.is_active !== undefined) setIsActive(Boolean(changedValues.is_active));
                                        }}
                                    >
                                        <Form.Item
                                            name="delivery_name"
                                            label={
                                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                                    ผู้จัดส่ง <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
                                                </span>
                                            }
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อช่องทางจัดส่ง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        const duplicated = await checkNameConflict(value);
                                                        if (duplicated) throw new Error('ชื่อระบบนี้ถูกใช้งานแล้ว');
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="GrabFood, LINE MAN, ShopeeFood"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                                disabled={isEdit ? !canEditDelivery : !canCreateDelivery}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="delivery_prefix"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>Prefix</span>}
                                            rules={[
                                                { max: 10, message: 'ความยาวต้องไม่เกิน 10 ตัวอักษร' },
                                                { pattern: /^[A-Za-z0-9_-]*$/, message: 'กรอกได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข _ และ -' },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="GF, LM, SP"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', textTransform: 'uppercase' }}
                                                maxLength={10}
                                                disabled={isEdit ? !canEditDelivery : !canCreateDelivery}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="logo"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>URL โลโก้</span>}
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim()) return;
                                                        const normalized = normalizeImageSource(value);
                                                        if (!isSupportedImageSource(normalized)) {
                                                            throw new Error('รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image, blob หรือ path ภายในระบบ');
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="https://example.com/logo.png"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                disabled={isEdit ? !canEditDelivery : !canCreateDelivery}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้า POS ที่เกี่ยวข้องกับเดลิเวอรี่</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch
                                                        style={{ background: isActive ? '#10B981' : undefined }}
                                                        disabled={isEdit ? !canUpdateStatus : !canCreateDelivery}
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>

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
                                                disabled={isEdit ? !canSubmitEdit : !canSubmitAdd}
                                                style={{
                                                    flex: 2,
                                                    borderRadius: 12,
                                                    height: 46,
                                                    fontWeight: 600,
                                                    background: '#0891B2',
                                                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)',
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
                                    <DeliveryPreviewCard
                                        deliveryName={deliveryName}
                                        deliveryPrefix={deliveryPrefix}
                                        logo={logo}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalDelivery?.create_date)}</Text>
                                                <Text type="secondary">อัปเดตเมื่อ: {formatDate(originalDelivery?.update_date)}</Text>
                                            </div>
                                        </Card>
                                    ) : null}


                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
