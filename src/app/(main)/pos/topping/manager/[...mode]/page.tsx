'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, DeleteOutlined, DownOutlined, ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { ModalSelector } from '../../../../../../components/ui/select/ModalSelector';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { Category } from '../../../../../../types/api/pos/category';
import { Topping } from '../../../../../../types/api/pos/topping';
import { ToppingGroup } from '../../../../../../types/api/pos/toppingGroup';
import { isSupportedImageSource, normalizeImageSource } from '../../../../../../utils/image/source';
import { pageStyles, ManagePageStyles, ToppingPreview } from './style';
import { TOPPING_CAPABILITIES, TOPPING_ROLE_BLUEPRINT } from '../../../../../../lib/rbac/topping-capabilities';

const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';
type ToppingFormValues = {
    display_name: string;
    price: number;
    price_delivery?: number;
    img?: string;
    category_ids: string[];
    topping_group_ids?: string[];
    is_active?: boolean;
};

const parseListResponse = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
};

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    return Number.isNaN(date.getTime())
        ? '-'
        : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function ToppingManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ToppingFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>([]);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [tempCategoryIds, setTempCategoryIds] = useState<string[]>([]);
    const [originalTopping, setOriginalTopping] = useState<Topping | null>(null);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking, user } = useRoleGuard({
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการท็อปปิ้ง',
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canOpenToppingManager = can('topping.manager.feature', 'access');
    const canCreateTopping = can('topping.page', 'create') && can('topping.create.feature', 'create') && canOpenToppingManager;
    const canEditToppingCatalog = can('topping.page', 'update') && can('topping.catalog.feature', 'update') && canOpenToppingManager;
    const canEditToppingPricing = can('topping.page', 'update') && can('topping.pricing.feature', 'update') && canOpenToppingManager;
    const canUpdateToppingStatus = can('topping.page', 'update') && can('topping.status.feature', 'update') && canOpenToppingManager;
    const canDeleteTopping = can('topping.page', 'delete') && can('topping.delete.feature', 'delete') && canOpenToppingManager;
    const canSubmitAdd = canCreateTopping;
    const canSubmitEdit = canEditToppingCatalog || canEditToppingPricing || canUpdateToppingStatus;

    const displayName = Form.useWatch('display_name', form);
    const price = Form.useWatch('price', form);
    const priceDelivery = Form.useWatch('price_delivery', form);
    const imgUrl = Form.useWatch('img', form);
    const isActive = Form.useWatch('is_active', form) ?? true;
    const watchedCategoryIds = Form.useWatch('category_ids', form);
    const categoryIds = useMemo(() => watchedCategoryIds ?? [], [watchedCategoryIds]);
    const watchedToppingGroupIds = Form.useWatch('topping_group_ids', form);
    const toppingGroupIds = useMemo(() => watchedToppingGroupIds ?? [], [watchedToppingGroupIds]);

    const currentRoleName = String(user?.role ?? '').trim().toLowerCase();
    const selectedRoleBlueprint = useMemo(
        () => TOPPING_ROLE_BLUEPRINT.find((item) => item.roleName.toLowerCase() === currentRoleName) ?? null,
        [currentRoleName]
    );
    const capabilityMatrix = useMemo(
        () => TOPPING_CAPABILITIES.map((item) => ({ ...item, enabled: can(item.resourceKey, item.action) })),
        [can]
    );
    const selectedCategories = useMemo(
        () => categories.filter((category) => categoryIds.includes(category.id)),
        [categories, categoryIds]
    );
    const hasSelectableCategories = useMemo(
        () => categories.some((category) => category.is_active) || selectedCategories.length > 0,
        [categories, selectedCategories.length]
    );
    const availableToppingGroups = useMemo(
        () => toppingGroups.filter((group) => group.is_active || toppingGroupIds.includes(group.id)),
        [toppingGroupIds, toppingGroups]
    );
    const isCatalogReadOnly = isEdit && !canEditToppingCatalog;
    const isPricingReadOnly = isEdit && !canEditToppingPricing;
    const isStatusReadOnly = isEdit && !canUpdateToppingStatus;

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/topping');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    const fetchCategories = useCallback(async () => {
        const response = await fetch('/api/pos/category', { cache: 'no-store' });
        if (response.ok) {
            setCategories(parseListResponse<Category>(await response.json()));
        }
    }, []);

    const fetchToppingGroups = useCallback(async () => {
        const response = await fetch('/api/pos/toppingGroup', { cache: 'no-store' });
        if (response.ok) {
            setToppingGroups(parseListResponse<ToppingGroup>(await response.json()));
        }
    }, []);

    const fetchTopping = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/topping/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลท็อปปิ้งได้');
            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                price: Number(data.price || 0),
                price_delivery: Number(data.price_delivery ?? data.price ?? 0),
                img: data.img || '',
                category_ids: (data.categories || []).map((category: Category) => category.id),
                topping_group_ids: (data.topping_groups || []).map((group: ToppingGroup) => group.id),
                is_active: data.is_active,
            });
            setOriginalTopping(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลท็อปปิ้งได้');
            router.replace('/pos/topping');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (!isAuthorized || permissionLoading) return;
        void fetchCategories();
        void fetchToppingGroups();
        if (isEdit) {
            void fetchTopping();
        }
    }, [fetchCategories, fetchTopping, fetchToppingGroups, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!(canCreateTopping || canEditToppingCatalog)) return false;
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && originalTopping?.display_name?.toLowerCase() === value.toLowerCase()) {
            return false;
        }
        try {
            const response = await fetch(`/api/pos/topping/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canCreateTopping, canEditToppingCatalog, id, isEdit, originalTopping]);

    const handleSubmit = async (values: ToppingFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์บันทึกการแก้ไขท็อปปิ้ง' : 'คุณไม่มีสิทธิ์เพิ่มท็อปปิ้ง');
            return;
        }

        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<ToppingFormValues> = !isEdit
                ? {
                    display_name: values.display_name.trim(),
                    price: Number(values.price || 0),
                    price_delivery:
                        values.price_delivery === undefined || values.price_delivery === null
                            ? Number(values.price || 0)
                            : Number(values.price_delivery),
                    img: normalizeImageSource(values.img) || '',
                    category_ids: values.category_ids,
                    topping_group_ids: values.topping_group_ids || [],
                    is_active: values.is_active,
                }
                : {
                    ...(canEditToppingCatalog
                        ? {
                            display_name: values.display_name.trim(),
                            img: normalizeImageSource(values.img) || '',
                            category_ids: values.category_ids,
                            topping_group_ids: values.topping_group_ids || [],
                        }
                        : {}),
                    ...(canEditToppingPricing
                        ? {
                            price: Number(values.price || 0),
                            price_delivery:
                                values.price_delivery === undefined || values.price_delivery === null
                                    ? Number(values.price || 0)
                                    : Number(values.price_delivery),
                        }
                        : {}),
                    ...(canUpdateToppingStatus ? { is_active: values.is_active } : {}),
                };

            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }

            const response = await fetch(isEdit ? `/api/pos/topping/update/${id}` : '/api/pos/topping/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกท็อปปิ้งได้');
            }

            message.success(isEdit ? 'อัปเดตท็อปปิ้งสำเร็จ' : 'สร้างท็อปปิ้งสำเร็จ');
            router.replace('/pos/topping');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกท็อปปิ้งได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteTopping) return;
        Modal.confirm({
            title: 'ยืนยันการลบท็อปปิ้ง',
            content: `คุณต้องการลบท็อปปิ้ง "${displayName || '-'}" หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/topping/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบท็อปปิ้งได้');
                    }
                    message.success('ลบท็อปปิ้งสำเร็จ');
                    router.replace('/pos/topping');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบท็อปปิ้งได้');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (!canOpenToppingManager || (isEdit ? (!canSubmitEdit && !canDeleteTopping) : !canSubmitAdd)) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            <UIPageHeader
                title={isEdit ? 'แก้ไขข้อมูลท็อปปิ้ง' : 'เพิ่มท็อปปิ้งใหม่'}
                onBack={() => router.replace('/pos/topping')}
                actions={isEdit && canDeleteTopping ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        ลบ
                    </Button>
                ) : null}
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 16 }}>
                        <Alert
                            type={selectedRoleBlueprint?.roleName === 'Employee' ? 'info' : 'success'}
                            showIcon
                            message={selectedRoleBlueprint?.title || 'Topping governance'}
                            description={
                                selectedRoleBlueprint
                                    ? `${selectedRoleBlueprint.summary} | ทำได้: ${selectedRoleBlueprint.allowed.join(', ')}${selectedRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedRoleBlueprint.denied.join(', ')}` : ''}`
                                    : 'เปิดเฉพาะ field และ action ที่ role นี้มี capability จริง'
                            }
                        />
                        {(!canEditToppingCatalog || !canEditToppingPricing || !canUpdateToppingStatus) ? (
                            <Alert
                                type="warning"
                                showIcon
                                message="Some topping manager controls are restricted by policy"
                                description="field catalog, pricing และ switch สถานะจะถูกปิดตาม capability ของ role นี้"
                            />
                        ) : null}
                    </Space>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} className="manage-form-card" style={{ borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลท็อปปิ้ง</Title>
                                    </div>

                                    <Form<ToppingFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true, price: 0, price_delivery: 0, img: '', category_ids: [], topping_group_ids: [] }}
                                        onValuesChange={(changed) => {
                                            if (!isEdit && changed.price !== undefined && !form.isFieldTouched('price_delivery')) {
                                                form.setFieldsValue({ price_delivery: changed.price });
                                            }
                                        }}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label="ชื่อท็อปปิ้ง"
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อท็อปปิ้ง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim() || isCatalogReadOnly) return;
                                                        if (await checkNameConflict(value)) throw new Error('ชื่อนี้ถูกใช้งานแล้ว');
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="ชีส, ไข่มุก, วิปครีม..." disabled={isCatalogReadOnly} />
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="price"
                                                    label="ราคาหน้าร้าน"
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกราคา' },
                                                        {
                                                            validator: async (_, value) => {
                                                                const num = Number(value);
                                                                if (Number.isNaN(num) || num < 0) throw new Error('ราคาต้องมากกว่าหรือเท่ากับ 0');
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        disabled={isPricingReadOnly}
                                                        style={{ width: '100%', borderRadius: 12 }}
                                                        onChange={(event) => {
                                                            const normalized = normalizeDigits(event.target.value);
                                                            form.setFieldValue('price', normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="price_delivery"
                                                    label="ราคาเดลิเวอรี่"
                                                    rules={[
                                                        {
                                                            validator: async (_, value) => {
                                                                if (!value && value !== 0) return;
                                                                const num = Number(value);
                                                                if (Number.isNaN(num) || num < 0) throw new Error('ราคาต้องมากกว่าหรือเท่ากับ 0');
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        disabled={isPricingReadOnly}
                                                        style={{ width: '100%', borderRadius: 12 }}
                                                        onChange={(event) => {
                                                            const normalized = normalizeDigits(event.target.value);
                                                            form.setFieldValue('price_delivery', normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="img"
                                            label="รูปภาพ (URL)"
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim() || isCatalogReadOnly) return;
                                                        if (!isSupportedImageSource(normalizeImageSource(value))) {
                                                            throw new Error('รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image และ blob');
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" placeholder="https://example.com/topping.jpg" disabled={isCatalogReadOnly} />
                                        </Form.Item>

                                        <Form.Item
                                            name="category_ids"
                                            label="หมวดหมู่ที่ใช้ท็อปปิ้งนี้"
                                            rules={[{ required: true, type: 'array', min: 1, message: 'กรุณาเลือกอย่างน้อย 1 หมวดหมู่' }]}
                                        >
                                            <div
                                                onClick={() => {
                                                    if (isCatalogReadOnly) return;
                                                    setTempCategoryIds(categoryIds);
                                                    setIsCategoryModalVisible(true);
                                                }}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: 12,
                                                    border: '2px solid #e2e8f0',
                                                    cursor: isCatalogReadOnly ? 'not-allowed' : 'pointer',
                                                    minHeight: 46,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'white',
                                                    opacity: isCatalogReadOnly ? 0.6 : 1,
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                                    {selectedCategories.length > 0 ? (
                                                        selectedCategories.map((category) => (
                                                            <Tag
                                                                key={category.id}
                                                                style={{
                                                                    borderRadius: 6,
                                                                    margin: 0,
                                                                    background: '#EEF2FF',
                                                                    color: '#4F46E5',
                                                                    border: 'none',
                                                                }}
                                                            >
                                                                {category.display_name}
                                                            </Tag>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: '#94a3b8' }}>เลือกหมวดหมู่</span>
                                                    )}
                                                </div>
                                                <DownOutlined style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }} />
                                            </div>
                                        </Form.Item>

                                        <Form.Item
                                            name="topping_group_ids"
                                            label="กลุ่มท็อปปิ้งที่สังกัด"
                                            extra="เลือกกลุ่มที่ท็อปปิ้งนี้สามารถแสดงร่วมกับสินค้าได้"
                                        >
                                            <ModalSelector<string>
                                                title="เลือกกลุ่มท็อปปิ้ง"
                                                value={toppingGroupIds}
                                                multiple
                                                showSearch
                                                disabled={isCatalogReadOnly}
                                                options={availableToppingGroups.map((group) => ({
                                                    label: group.display_name,
                                                    value: group.id,
                                                    searchLabel: group.display_name,
                                                }))}
                                                onChange={(value) => form.setFieldValue('topping_group_ids', value)}
                                                placeholder="ไม่กำหนดกลุ่มท็อปปิ้ง"
                                                style={{ minHeight: 46, borderRadius: 12, padding: '10px 16px' }}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 16, marginBottom: 24, border: '1px solid #f1f5f9' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                        เปิดเพื่อให้พนักงานเลือกใช้งานได้ทันทีที่จุดขาย
                                                    </Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch disabled={isStatusReadOnly} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button
                                                size="large"
                                                onClick={() => router.replace('/pos/topping')}
                                                style={{ flex: 1, borderRadius: 14, height: 48 }}
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                size="large"
                                                loading={submitting}
                                                disabled={isEdit ? !canSubmitEdit : !canSubmitAdd}
                                                icon={<SaveOutlined />}
                                                style={{
                                                    flex: 2,
                                                    borderRadius: 14,
                                                    height: 48,
                                                    background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                                                    border: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                                                }}
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 20 }}>
                                    <Card bordered={false} style={{ borderRadius: 20 }}>
                                        <ToppingPreview
                                            name={displayName}
                                            imageUrl={imgUrl}
                                            price={price}
                                            priceDelivery={priceDelivery}
                                            categories={selectedCategories}
                                            isActive={isActive}
                                        />
                                    </Card>

                                    <Card bordered={false} style={{ borderRadius: 16 }}>
                                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                            <Space>
                                                <ExclamationCircleOutlined style={{ color: '#2563eb' }} />
                                                <Text strong>Topping Governance</Text>
                                            </Space>
                                            <Text type="secondary">
                                                Capability ของ pos/topping ถูกแยกออกจาก page access เพื่อควบคุม search, filter, manager workspace, create, catalog, pricing, status และ delete แบบราย action
                                            </Text>
                                            <Space wrap>
                                                {capabilityMatrix.map((item) => (
                                                    <Tag
                                                        key={item.resourceKey}
                                                        color={item.enabled ? 'blue' : item.securityLevel === 'governance' ? 'red' : 'default'}
                                                    >
                                                        {item.title}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </Space>
                                    </Card>

                                    {isEdit ? (
                                        <Card bordered={false} style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <div style={{ padding: 6, background: '#fff7ed', borderRadius: 8 }}>
                                                    <SaveOutlined style={{ color: '#ea580c' }} />
                                                </div>
                                                <Text strong>ประวัติรายการ</Text>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>สร้างเมื่อ:</Text>
                                                    <Text style={{ fontSize: 13 }}>{formatDate(originalTopping?.create_date)}</Text>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>อัปเดตเมื่อ:</Text>
                                                    <Text style={{ fontSize: 13 }}>{formatDate(originalTopping?.update_date)}</Text>
                                                </div>
                                            </div>
                                        </Card>
                                    ) : null}

                                    {!hasSelectableCategories ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="ยังไม่มีหมวดหมู่ที่เปิดใช้งาน"
                                            description="กรุณาตรวจสอบหน้าจัดการหมวดหมู่ก่อนบันทึก"
                                        />
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
            <Modal
                title="เลือกหมวดหมู่"
                open={isCategoryModalVisible}
                onCancel={() => setIsCategoryModalVisible(false)}
                centered
                width="min(400px, calc(100vw - 16px))"
                footer={[
                    <Button key="cancel" onClick={() => setIsCategoryModalVisible(false)} style={{ borderRadius: 10, minWidth: 80, height: 36 }}>
                        ยกเลิก
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={() => {
                            form.setFieldsValue({ category_ids: tempCategoryIds });
                            setIsCategoryModalVisible(false);
                        }}
                        style={{ borderRadius: 10, minWidth: 80, height: 36, background: '#4F46E5', borderColor: '#4F46E5' }}
                    >
                        ตกลง
                    </Button>,
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {categories.map((category) => {
                        const isSelected = tempCategoryIds.includes(category.id);
                        const isDisabled = (!category.is_active && !isSelected) || isCatalogReadOnly;

                        return (
                            <div
                                key={category.id}
                                onClick={() => {
                                    if (isDisabled) return;
                                    const newIds = isSelected
                                        ? tempCategoryIds.filter((value) => value !== category.id)
                                        : [...tempCategoryIds, category.id];
                                    setTempCategoryIds(newIds);
                                }}
                                style={{
                                    padding: '14px 18px',
                                    border: '2px solid',
                                    borderRadius: 12,
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                    background: isSelected ? '#eff6ff' : '#fff',
                                    borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: isDisabled ? 0.6 : 1,
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <span>{category.display_name}</span>
                                {isSelected ? <CheckCircleOutlined style={{ color: '#3b82f6' }} /> : null}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
