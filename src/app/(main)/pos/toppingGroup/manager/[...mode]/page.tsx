'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
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
import { ToppingGroup } from '../../../../../../types/api/pos/toppingGroup';


const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';
type ToppingGroupFormValues = {
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

export default function ToppingGroupManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ToppingGroupFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalToppingGroup, setOriginalToppingGroup] = useState<ToppingGroup | null>(null);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking, user } = useRoleGuard({
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการกลุ่มท็อปปิ้ง',
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canOpenToppingGroupManager = can('topping_group.manager.feature', 'access');
    const canCreateToppingGroup = can('topping_group.page', 'create') && can('topping_group.create.feature', 'create') && canOpenToppingGroupManager;
    const canEditToppingGroupDetails = can('topping_group.page', 'update') && can('topping_group.edit.feature', 'update') && canOpenToppingGroupManager;
    const canUpdateToppingGroupStatus = can('topping_group.page', 'update') && can('topping_group.status.feature', 'update') && canOpenToppingGroupManager;
    const canDeleteToppingGroup = can('topping_group.page', 'delete') && can('topping_group.delete.feature', 'delete') && canOpenToppingGroupManager;
    const canSubmitAdd = canCreateToppingGroup;
    const canSubmitEdit = canEditToppingGroupDetails || canUpdateToppingGroupStatus;

    const displayName = Form.useWatch('display_name', form) || '';
    const isActive = Form.useWatch('is_active', form) ?? true;
    const isDetailsReadOnly = isEdit && !canEditToppingGroupDetails;
    const isStatusReadOnly = isEdit && !canUpdateToppingGroupStatus;

    const title = useMemo(() => (isEdit ? 'แก้ไขกลุ่มท็อปปิ้ง' : 'เพิ่มกลุ่มท็อปปิ้ง'), [isEdit]);


    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/toppingGroup');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    const fetchToppingGroup = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/toppingGroup/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Unable to load topping group');
            }
            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setOriginalToppingGroup(data);
        } catch (fetchError) {
            message.error(fetchError instanceof Error ? fetchError.message : 'Unable to load topping group');
            router.replace('/pos/toppingGroup');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading && canOpenToppingGroupManager) {
            void fetchToppingGroup();
        }
    }, [canOpenToppingGroupManager, fetchToppingGroup, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!(canCreateToppingGroup || canEditToppingGroupDetails)) return false;

        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && originalToppingGroup?.display_name?.toLowerCase() === value.toLowerCase()) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/toppingGroup/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canCreateToppingGroup, canEditToppingGroupDetails, id, isEdit, originalToppingGroup]);

    const handleSubmit = async (values: ToppingGroupFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'You do not have permission to update this topping group' : 'You do not have permission to create topping groups');
            return;
        }

        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<ToppingGroupFormValues> = !isEdit
                ? {
                    display_name: values.display_name.trim(),
                    is_active: values.is_active,
                }
                : {
                    ...(canEditToppingGroupDetails ? { display_name: values.display_name.trim() } : {}),
                    ...(canUpdateToppingGroupStatus ? { is_active: values.is_active } : {}),
                };

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('No editable fields are available for this account');
                return;
            }

            const response = await fetch(isEdit ? `/api/pos/toppingGroup/update/${id}` : '/api/pos/toppingGroup/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Unable to save topping group');
            }

            message.success(isEdit ? 'Topping group updated' : 'Topping group created');
            router.replace('/pos/toppingGroup');
        } catch (submitError) {
            message.error(submitError instanceof Error ? submitError.message : 'Unable to save topping group');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteToppingGroup) return;

        Modal.confirm({
            title: 'Delete topping group',
            content: `Delete ${displayName || originalToppingGroup?.display_name || '-'}?`,
            okText: 'Delete',
            cancelText: 'Cancel',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/toppingGroup/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'Unable to delete topping group');
                    }
                    message.success('Topping group deleted');
                    router.replace('/pos/toppingGroup');
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'Unable to delete topping group');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized || !canOpenToppingGroupManager) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if ((!isEdit && !canSubmitAdd) || (isEdit && !canSubmitEdit && !canDeleteToppingGroup)) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={title}
                onBack={() => router.replace('/pos/toppingGroup')}
                actions={isEdit && canDeleteToppingGroup ? <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>ลบ</Button> : null}
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#6d28d9' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลกลุ่มท็อปปิ้ง</Title>
                                    </div>

                                    <Form<ToppingGroupFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true }}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>ชื่อกลุ่มท็อปปิ้ง</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อกลุ่มท็อปปิ้ง' },
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
                                            <Input size="large" maxLength={100} placeholder="เช่น กลุ่มซอส, กลุ่มท็อปปิ้งหวาน" disabled={isDetailsReadOnly} />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                        ควบคุมการมองเห็นกลุ่มท็อปปิ้งในหน้าตั้งค่าสินค้าและท็อปปิ้ง
                                                    </Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch disabled={isStatusReadOnly} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/toppingGroup')} style={{ flex: 1 }}>
                                                ยกเลิก
                                            </Button>
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
                                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <TagsOutlined style={{ color: '#6d28d9' }} />
                                                <Text strong>Preview</Text>
                                            </div>
                                            <Title level={4} style={{ margin: 0 }}>
                                                {displayName || 'ชื่อกลุ่มท็อปปิ้ง'}
                                            </Title>
                                            <Alert type={isActive ? 'success' : 'warning'} showIcon message={isActive ? 'กลุ่มนี้พร้อมใช้งาน' : 'กลุ่มนี้ถูกปิดใช้งาน'} />
                                        </Space>
                                    </Card>



                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>Record details</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalToppingGroup?.create_date)}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>อัปเดตเมื่อ: {formatDate(originalToppingGroup?.update_date)}</Text>
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
