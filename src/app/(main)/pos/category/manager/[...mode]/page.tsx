'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Spin, Switch, Typography, message } from 'antd';
import { AppstoreOutlined, DeleteOutlined, ExclamationCircleOutlined, SaveOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { pageStyles } from '../../../../../../theme/pos/category/style';
import { Category } from '../../../../../../types/api/pos/category';
import { useAuth } from '../../../../../../contexts/AuthContext';

const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';

type CategoryFormValues = {
    display_name: string;
    is_active?: boolean;
};

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? '-'
        : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function CategoryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<CategoryFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalCategory, setOriginalCategory] = useState<Category | null>(null);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking } = useRoleGuard();
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreate = can('category.page', 'create');
    const canUpdate = can('category.page', 'update');
    const canDelete = can('category.page', 'delete');

    const title = useMemo(() => (isEdit ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/category');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreate) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มหมวดหมู่');
            router.replace('/pos/category');
            return;
        }
        if (mode === 'edit' && !canUpdate) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขหมวดหมู่');
            router.replace('/pos/category');
        }
    }, [canCreate, canUpdate, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchCategory = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/category/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setIsActive(Boolean(data.is_active));
            setOriginalCategory(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            router.replace('/pos/category');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) {
            void fetchCategory();
        }
    }, [fetchCategory, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && originalCategory?.display_name?.toLowerCase() === value.toLowerCase()) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/category/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [id, isEdit, originalCategory]);

    const handleSubmit = async (values: CategoryFormValues) => {
        if (isEdit ? !canUpdate : !canCreate) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์แก้ไขหมวดหมู่' : 'คุณไม่มีสิทธิ์เพิ่มหมวดหมู่');
            return;
        }

        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload = {
                display_name: values.display_name.trim(),
                is_active: values.is_active,
            };

            const response = await fetch(isEdit ? `/api/pos/category/update/${id}` : '/api/pos/category/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกหมวดหมู่ได้');
            }

            message.success(isEdit ? 'อัปเดตหมวดหมู่สำเร็จ' : 'สร้างหมวดหมู่สำเร็จ');
            router.replace('/pos/category');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกหมวดหมู่ได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ ${displayName || '-'} หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/category/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบหมวดหมู่ได้');
                    }
                    message.success('ลบหมวดหมู่สำเร็จ');
                    router.replace('/pos/category');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบหมวดหมู่ได้');
                }
            },
        });
    };

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={title}
                subtitle={isEdit ? 'แก้ไขชื่อและสถานะของหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่สำหรับหน้า POS'}
                onBack={() => router.replace('/pos/category')}
                actions={isEdit && canDelete ? <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>ลบ</Button> : null}
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#0f766e' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลหมวดหมู่</Title>
                                    </div>

                                    <Form<CategoryFormValues>
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
                                            label={<span style={{ fontWeight: 600 }}>ชื่อหมวดหมู่ <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อหมวดหมู่' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (await checkNameConflict(value)) {
                                                            throw new Error('ชื่อนี้ถูกใช้งานแล้ว');
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="เครื่องดื่ม, อาหาร, ของหวาน..." />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>เปิดเพื่อให้แสดงบนหน้า POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/category')} style={{ flex: 1 }}>ยกเลิก</Button>
                                            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={submitting} style={{ flex: 2 }}>
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
                                            <TagsOutlined style={{ color: '#0f766e' }} />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName || 'ชื่อหมวดหมู่'}</Title>
                                        <Alert
                                            type={isActive ? 'success' : 'warning'}
                                            showIcon
                                            message={isActive ? 'หมวดหมู่นี้พร้อมใช้งาน' : 'หมวดหมู่นี้ถูกปิดใช้งาน'}
                                        />
                                    </Card>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalCategory?.create_date)}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>อัปเดตเมื่อ: {formatDate(originalCategory?.update_date)}</Text>
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
