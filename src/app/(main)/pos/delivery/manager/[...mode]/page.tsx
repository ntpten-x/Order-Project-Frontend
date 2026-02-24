'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    CarOutlined,
    CheckCircleFilled,
    AppstoreOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/delivery/style';
import { Delivery } from '../../../../../../types/api/pos/delivery';
import { isSupportedImageSource, normalizeImageSource, resolveImageSource } from '../../../../../../utils/image/source';
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import SmartAvatar from '../../../../../../components/ui/image/SmartAvatar';

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
        timeStyle: 'short'
    }).format(date);
};

const DeliveryPreviewCard = ({
    deliveryName,
    deliveryPrefix,
    logo,
    isActive
}: {
    deliveryName: string;
    deliveryPrefix: string;
    logo: string;
    isActive: boolean;
}) => {
    const logoSource = resolveImageSource(logo);
    return (
        <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9',
    }}>
        <Title level={5} style={{ color: '#0891B2', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

        <div style={{
            borderRadius: 16,
            border: `1px solid ${isActive ? '#a5f3fc' : '#e2e8f0'}`,
            padding: 14,
            background: isActive ? '#ecfeff' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
        }}>
            <SmartAvatar
                src={logo}
                alt={deliveryName || "Delivery logo"}
                shape="square"
                size={48}
                icon={<CarOutlined />}
                imageStyle={{ objectFit: "contain" }}
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
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
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
    const [deliveryName, setDeliveryName] = useState<string>('');
    const [deliveryPrefix, setDeliveryPrefix] = useState<string>('');
    const [logo, setLogo] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalDelivery, setOriginalDelivery] = useState<Delivery | null>(null);
    const [currentDeliveryName, setCurrentDeliveryName] = useState<string>('');

    const mode = params.mode?.[0] as DeliveryManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateDelivery = can("delivery.page", "create");
    const canUpdateDelivery = can("delivery.page", "update");
    const canDeleteDelivery = can("delivery.page", "delete");
    const canSubmit = isEdit ? canUpdateDelivery : canCreateDelivery;

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขช่องทางจัดส่ง';
        return 'เพิ่มช่องทางจัดส่ง';
    }, [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/delivery');
        }
    }, [isValidMode, mode, id, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchDelivery = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/delivery/getById/${id}`);
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
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchDelivery();
        }
    }, [isEdit, fetchDelivery]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && value.toLowerCase() === currentDeliveryName) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/delivery/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [currentDeliveryName, id, isEdit]);

    const onFinish = async (values: DeliveryFormValues) => {
        if (!canSubmit) {
            message.error(isEdit ? "คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง" : "คุณไม่มีสิทธิ์เพิ่มช่องทางจัดส่ง");
            return;
        }
        setSubmitting(true);
        try {
            const payload: DeliveryFormValues = {
                delivery_name: values.delivery_name.trim(),
                delivery_prefix: values.delivery_prefix?.trim().toUpperCase() || undefined,
                logo: normalizeImageSource(values.logo) || undefined,
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/delivery/update/${id}` : '/api/pos/delivery/create';
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
        if (!id) return;
        if (!canDeleteDelivery) {
            message.error("คุณไม่มีสิทธิ์ลบช่องทางจัดส่ง");
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
                    const response = await fetch(`/api/pos/delivery/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบช่องทางจัดส่งได้');
                    message.success('ลบช่องทางจัดส่งสำเร็จ');
                    router.push('/pos/delivery');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบช่องทางจัดส่งได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/delivery');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    if (!canSubmit) {
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
                                            if (changedValues.delivery_prefix !== undefined) setDeliveryPrefix(changedValues.delivery_prefix);
                                            if (changedValues.logo !== undefined) setLogo(changedValues.logo);
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
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
                                                { required: true, message: 'กรุณากรอกชื่อระบบ' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        const duplicated = await checkNameConflict(value);
                                                        if (duplicated) throw new Error('ชื่อระบบนี้ถูกใช้งานแล้ว');
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="GrabFood, LINE MAN, ShopeeFood"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="delivery_prefix"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>Prefix</span>}
                                            rules={[
                                                { max: 10, message: 'ความยาวต้องไม่เกิน 10 ตัวอักษร' },
                                                { pattern: /^[A-Za-z0-9_-]*$/, message: 'กรอกได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข _ และ -' }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="GF, LM, SP"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', textTransform: 'uppercase' }}
                                                maxLength={10}
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
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="https://example.com/logo.png"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้า POS ที่เกี่ยวข้องกับเดลิเวอรี่</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch style={{ background: isActive ? '#10B981' : undefined }} />
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
                                                style={{
                                                    flex: 2,
                                                    borderRadius: 12,
                                                    height: 46,
                                                    fontWeight: 600,
                                                    background: '#0891B2',
                                                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.25)'
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
                                                <Text strong>รายละเอียดรายการ</Text>
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
