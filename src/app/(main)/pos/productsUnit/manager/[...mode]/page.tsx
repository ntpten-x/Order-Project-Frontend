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
    UnorderedListOutlined,
    CheckCircleFilled,
    AppstoreOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { pageStyles } from '../../../../../../theme/pos/productsUnit/style';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';

type ProductsUnitMode = 'add' | 'edit';

type ProductsUnitFormValues = {
    unit_name: string;
    display_name: string;
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

const UnitPreviewCard = ({ displayName, unitName, isActive }: { displayName: string, unitName: string, isActive: boolean }) => (
    <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9',
    }}>
        <Title level={5} style={{ color: '#0e7490', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

        <div style={{
            borderRadius: 16,
            border: `1px solid ${isActive ? '#bae6fd' : '#e2e8f0'}`,
            padding: 14,
            background: isActive ? '#f0f9ff' : '#f8fafc',
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
                    ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                    : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <UnorderedListOutlined style={{
                    fontSize: 20,
                    color: isActive ? '#0e7490' : '#64748b'
                }} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                        {displayName || 'ชื่อหน่วยสินค้า'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {unitName || 'Unit name'}
                </Text>
            </div>
        </div>

        <Alert
            type={isActive ? 'success' : 'warning'}
            showIcon
            message={isActive ? 'หน่วยสินค้านี้พร้อมใช้งานในหน้า POS' : 'หน่วยสินค้านี้จะไม่แสดงในหน้า POS'}
        />
    </div>
);

export default function ProductsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ProductsUnitFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [unitName, setUnitName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalUnit, setOriginalUnit] = useState<ProductsUnit | null>(null);

    const mode = params.mode?.[0] as ProductsUnitMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateUnits = can("products_unit.page", "create");
    const canUpdateUnits = can("products_unit.page", "update");
    const canDeleteUnits = can("products_unit.page", "delete");

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขหน่วยสินค้า';
        return 'เพิ่มหน่วยสินค้า';
    }, [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/productsUnit');
        }
    }, [isValidMode, mode, id, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchUnit = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/productsUnit/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            const data = await response.json();
            form.setFieldsValue({
                unit_name: data.unit_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setUnitName(data.unit_name || '');
            setIsActive(data.is_active);
            setOriginalUnit(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            router.replace('/pos/productsUnit');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchUnit();
        }
    }, [isEdit, fetchUnit]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && originalUnit?.unit_name?.toLowerCase() === value.toLowerCase()) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/productsUnit/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [id, isEdit, originalUnit]);

    const onFinish = async (values: ProductsUnitFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit ? !canUpdateUnits : !canCreateUnits) {
                throw new Error('คุณไม่มีสิทธิ์บันทึกข้อมูลหน่วยสินค้า');
            }
            const payload: ProductsUnitFormValues = {
                unit_name: values.unit_name.trim(),
                display_name: values.display_name.trim(),
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/productsUnit/update/${id}` : '/api/pos/productsUnit/create';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตหน่วยสินค้าได้' : 'ไม่สามารถสร้างหน่วยสินค้าได้'));
            }

            message.success(isEdit ? 'อัปเดตหน่วยสินค้าสำเร็จ' : 'สร้างหน่วยสินค้าสำเร็จ');
            router.push('/pos/productsUnit');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถสร้าง/แก้ไขหน่วยสินค้าได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วยสินค้า ${displayName || originalUnit?.display_name || '-'} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/productsUnit/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหน่วยสินค้าได้');
                    message.success('ลบหน่วยสินค้าสำเร็จ');
                    router.push('/pos/productsUnit');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบหน่วยสินค้าได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/productsUnit');

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            <UIPageHeader
                title={modeTitle}
                onBack={handleBack}
                actions={
                    isEdit && canDeleteUnits ? (
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#0e7490' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลหน่วยสินค้า</Title>
                                    </div>

                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ is_active: true }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                            if (changedValues.unit_name !== undefined) setUnitName(changedValues.unit_name);
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                        }}
                                    >
                                        <Form.Item
                                            name="unit_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อหน่วยสินค้าภาษาอังกฤษ <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อหน่วยสินค้า' },
                                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรอกได้เฉพาะภาษาอังกฤษ ตัวเลข และ - _ ( ) .' },
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
                                                placeholder="Plate, Bottle, ..."
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อหน่วยสินค้าภาษาไทย <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อหน่วยสินค้า' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="จาน, ขวด, ..."
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้าขายสินค้า POS</Text>
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
                                                    background: '#0e7490',
                                                    boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)'
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
                                    <UnitPreviewCard
                                        displayName={displayName}
                                        unitName={unitName}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalUnit?.create_date)}</Text>
                                                <Text type="secondary">อัปเดตเมื่อ: {formatDate(originalUnit?.update_date)}</Text>
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
