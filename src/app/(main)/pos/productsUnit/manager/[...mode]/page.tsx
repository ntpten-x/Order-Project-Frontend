'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import {
    AppstoreOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { pageStyles } from '../../../../../../theme/pos/productsUnit/style';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';
import { useAuth } from '../../../../../../contexts/AuthContext';


const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';
type UnitFormValues = { display_name: string; is_active?: boolean };

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? '-'
        : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function ProductsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<UnitFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [originalUnit, setOriginalUnit] = useState<ProductsUnit | null>(null);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'products_unit.manager.feature', action: 'access' },
        redirectUnauthorized: '/pos/productsUnit',
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการหน่วยสินค้า',
    });
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canOpenManager = can('products_unit.manager.feature', 'access');
    const canCreateProductsUnit =
        can('products_unit.page', 'create') &&
        can('products_unit.create.feature', 'create') &&
        canOpenManager;
    const canEditProductsUnit =
        can('products_unit.page', 'update') &&
        can('products_unit.edit.feature', 'update') &&
        canOpenManager;
    const canUpdateProductsUnitStatus =
        can('products_unit.page', 'update') &&
        can('products_unit.status.feature', 'update') &&
        canOpenManager;
    const canDeleteProductsUnit =
        can('products_unit.page', 'delete') &&
        can('products_unit.delete.feature', 'delete') &&
        canOpenManager;
    const canSubmitAdd = canCreateProductsUnit;
    const canSubmitEdit = canEditProductsUnit || canUpdateProductsUnitStatus;


    const title = useMemo(() => (isEdit ? 'แก้ไขหน่วยสินค้า' : 'เพิ่มหน่วยสินค้า'), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/productsUnit');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreateProductsUnit) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มหน่วยสินค้า');
            router.replace('/pos/productsUnit');
            return;
        }
        if (mode === 'edit' && !canEditProductsUnit && !canUpdateProductsUnitStatus && !canDeleteProductsUnit) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขหน่วยสินค้า');
            router.replace('/pos/productsUnit');
        }
    }, [
        canCreateProductsUnit,
        canDeleteProductsUnit,
        canEditProductsUnit,
        canUpdateProductsUnitStatus,
        isAuthorized,
        isChecking,
        mode,
        permissionLoading,
        router,
    ]);

    const fetchUnit = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/productsUnit/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setIsActive(Boolean(data.is_active));
            setOriginalUnit(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            router.replace('/pos/productsUnit');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) void fetchUnit();
    }, [fetchUnit, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!canOpenManager) return false;
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && originalUnit?.display_name?.trim().toLowerCase() === value.toLowerCase()) return false;
        try {
            const response = await fetch(`/api/pos/productsUnit/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canOpenManager, id, isEdit, originalUnit]);

    const handleSubmit = async (values: UnitFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์บันทึกการแก้ไขหน่วยสินค้า' : 'คุณไม่มีสิทธิ์สร้างหน่วยสินค้า');
            return;
        }

        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<UnitFormValues> = {};

            if (!isEdit) {
                payload.display_name = values.display_name.trim();
                payload.is_active = values.is_active;
            } else {
                if (canEditProductsUnit) {
                    payload.display_name = values.display_name.trim();
                }
                if (canUpdateProductsUnitStatus) {
                    payload.is_active = values.is_active;
                }
            }

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }

            const response = await fetch(isEdit ? `/api/pos/productsUnit/update/${id}` : '/api/pos/productsUnit/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกหน่วยสินค้าได้');
            }
            message.success(isEdit ? 'อัปเดตหน่วยสินค้าสำเร็จ' : 'สร้างหน่วยสินค้าสำเร็จ');
            router.replace('/pos/productsUnit');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกหน่วยสินค้าได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteProductsUnit) return;
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วยสินค้า ${displayName || '-'} หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/productsUnit/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบหน่วยสินค้าได้');
                    }
                    message.success('ลบหน่วยสินค้าสำเร็จ');
                    router.replace('/pos/productsUnit');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบหน่วยสินค้าได้');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (isEdit ? (!canEditProductsUnit && !canUpdateProductsUnitStatus && !canDeleteProductsUnit) : !canCreateProductsUnit) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={title}
                onBack={() => router.replace('/pos/productsUnit')}
                actions={isEdit && canDeleteProductsUnit ? <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>ลบ</Button> : null}
            />

            <PageContainer maxWidth={1120}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                    

                                    

                                    {!canEditProductsUnit || !canUpdateProductsUnitStatus ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="บาง field ถูกล็อกตามสิทธิ์"
                                            description={`แก้ชื่อ ${canEditProductsUnit ? 'พร้อมใช้งาน' : 'ถูกปิด'} | สถานะ ${canUpdateProductsUnitStatus ? 'พร้อมใช้งาน' : 'ถูกปิด'}`}
                                        />
                                    ) : null}

                                    <Card bordered={false} style={{ borderRadius: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <AppstoreOutlined style={{ fontSize: 20, color: '#0e7490' }} />
                                            <Title level={5} style={{ margin: 0 }}>ข้อมูลหน่วยสินค้า</Title>
                                        </div>

                                        <Form<UnitFormValues>
                                            form={form}
                                            layout="vertical"
                                            onFinish={handleSubmit}
                                            initialValues={{ is_active: true }}
                                            onValuesChange={(changed) => {
                                                if (changed.display_name !== undefined) setDisplayName(changed.display_name);
                                                if (changed.is_active !== undefined) setIsActive(Boolean(changed.is_active));
                                            }}
                                        >
                                            <Form.Item
                                                name="display_name"
                                                label={<span style={{ fontWeight: 600 }}>ชื่อหน่วยสินค้า</span>}
                                                validateTrigger={['onBlur', 'onSubmit']}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกชื่อหน่วยสินค้า' },
                                                    { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                    {
                                                        validator: async (_, value: string) => {
                                                            if (!value?.trim()) return;
                                                            if (await checkNameConflict(value)) throw new Error('ชื่อนี้ถูกใช้งานแล้ว');
                                                        },
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    maxLength={100}
                                                    placeholder="จาน, กล่อง, ขวด..."
                                                    disabled={isEdit ? !canEditProductsUnit : !canCreateProductsUnit}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 46,
                                                        backgroundColor: isEdit && !canEditProductsUnit ? '#f8fafc' : undefined,
                                                    }}
                                                />
                                            </Form.Item>

                                            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <Text strong>สถานะการใช้งาน</Text>
                                                        <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                            เปิดเพื่อให้เลือกใช้งานบนสินค้าและ POS
                                                        </Text>
                                                    </div>
                                                    <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                        <Switch checked={isActive} disabled={isEdit ? !canUpdateProductsUnitStatus : !canCreateProductsUnit} />
                                                    </Form.Item>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <Button size="large" onClick={() => router.replace('/pos/productsUnit')} style={{ flex: 1 }}>
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
                                </Space>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                            <UnorderedListOutlined style={{ color: '#0e7490' }} />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName || 'ชื่อหน่วยสินค้า'}</Title>
                                        <Alert type={isActive ? 'success' : 'warning'} showIcon message={isActive ? 'หน่วยสินค้านี้พร้อมใช้งาน' : 'หน่วยสินค้านี้ถูกปิดใช้งาน'} />
                                    </Card>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียด</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalUnit?.create_date)}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>อัปเดตเมื่อ: {formatDate(originalUnit?.update_date)}</Text>
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
