'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Spin, Switch, Tag, Typography, message } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, SaveOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { pageStyles } from '../../../../../../theme/pos/topping/style';
import { Category } from '../../../../../../types/api/pos/category';
import { Topping } from '../../../../../../types/api/pos/topping';
import { formatCurrency } from '../../../../../../utils/format.utils';
import { isSupportedImageSource, normalizeImageSource } from '../../../../../../utils/image/source';

const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';
type ToppingFormValues = {
    display_name: string;
    price: number;
    price_delivery?: number;
    img?: string;
    category_ids: string[];
    is_active?: boolean;
};

const parseListResponse = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
        return (payload as { data: T[] }).data;
    }
    return [];
};

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
    const [displayName, setDisplayName] = useState('');
    const [price, setPrice] = useState(0);
    const [priceDelivery, setPriceDelivery] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [originalTopping, setOriginalTopping] = useState<Topping | null>(null);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreate = can('topping.page', 'create');
    const canUpdate = can('topping.page', 'update');
    const canDelete = can('topping.page', 'delete');

    const title = useMemo(() => (isEdit ? 'แก้ไขท็อปปิ้ง' : 'เพิ่มท็อปปิ้ง'), [isEdit]);
    const selectedCategoryIds = Form.useWatch('category_ids', form) || [];
    const selectedCategories = useMemo(
        () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
        [categories, selectedCategoryIds]
    );
    const hasSelectableCategories = useMemo(
        () => categories.some((category) => category.is_active) || selectedCategories.length > 0,
        [categories, selectedCategories.length]
    );
    const normalizedPreviewImage = normalizeImageSource(imageUrl);
    const hasPreviewImage = isSupportedImageSource(normalizedPreviewImage);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/topping');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreate) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มท็อปปิ้ง');
            router.replace('/pos/topping');
            return;
        }
        if (mode === 'edit' && !canUpdate) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขท็อปปิ้ง');
            router.replace('/pos/topping');
        }
    }, [canCreate, canUpdate, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchCategories = useCallback(async () => {
        const response = await fetch('/api/pos/category', { cache: 'no-store' });
        if (response.ok) {
            setCategories(parseListResponse<Category>(await response.json()));
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
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setPrice(Number(data.price || 0));
            setPriceDelivery(Number(data.price_delivery ?? data.price ?? 0));
            setImageUrl(data.img || '');
            setIsActive(Boolean(data.is_active));
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
        if (isEdit) {
            void fetchTopping();
        }
    }, [fetchCategories, fetchTopping, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
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
    }, [id, isEdit, originalTopping]);

    const handleSubmit = async (values: ToppingFormValues) => {
        if (isEdit ? !canUpdate : !canCreate) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์แก้ไขท็อปปิ้ง' : 'คุณไม่มีสิทธิ์เพิ่มท็อปปิ้ง');
            return;
        }
        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload = {
                display_name: values.display_name.trim(),
                price: Number(values.price || 0),
                price_delivery: values.price_delivery === undefined || values.price_delivery === null
                    ? Number(values.price || 0)
                    : Number(values.price_delivery),
                img: normalizeImageSource(values.img) || null,
                category_ids: values.category_ids,
                is_active: values.is_active,
            };
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
        if (!id || !canDelete) return;
        Modal.confirm({
            title: 'ยืนยันการลบท็อปปิ้ง',
            content: `คุณต้องการลบท็อปปิ้ง ${displayName || '-'} หรือไม่?`,
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

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={title}
                onBack={() => router.replace('/pos/topping')}
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
                                        <TagsOutlined style={{ fontSize: 20, color: '#ea580c' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลท็อปปิ้ง</Title>
                                    </div>

                                    <Form<ToppingFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true, price: 0, price_delivery: 0, img: '', category_ids: [] }}
                                        onValuesChange={(changed) => {
                                            if (changed.display_name !== undefined) setDisplayName(changed.display_name);
                                            if (changed.price !== undefined) {
                                                setPrice(Number(changed.price || 0));
                                                if (!isEdit && !form.isFieldTouched('price_delivery')) {
                                                    form.setFieldsValue({ price_delivery: changed.price });
                                                    setPriceDelivery(Number(changed.price || 0));
                                                }
                                            }
                                            if (changed.price_delivery !== undefined) setPriceDelivery(Number(changed.price_delivery || 0));
                                            if (changed.img !== undefined) setImageUrl(changed.img || '');
                                            if (changed.is_active !== undefined) setIsActive(Boolean(changed.is_active));
                                        }}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>ชื่อท็อปปิ้ง</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อท็อปปิ้ง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (await checkNameConflict(value)) throw new Error('ชื่อนี้ถูกใช้งานแล้ว');
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="ชีส, ไข่มุก, วิปครีม..." />
                                        </Form.Item>

                                        <Row gutter={12}>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="price"
                                                    label={<span style={{ fontWeight: 600 }}>ราคา POS</span>}
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกราคา POS' },
                                                        { type: 'number', min: 0, message: 'ราคาต้องมากกว่าหรือเท่ากับ 0' },
                                                    ]}
                                                >
                                                    <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="price_delivery"
                                                    label={<span style={{ fontWeight: 600 }}>ราคา Delivery</span>}
                                                    rules={[{ type: 'number', min: 0, message: 'ราคาต้องมากกว่าหรือเท่ากับ 0' }]}
                                                >
                                                    <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="img"
                                                    label={<span style={{ fontWeight: 600 }}>รูปภาพ URL</span>}
                                                    rules={[
                                                        {
                                                            validator: async (_, value: string | undefined) => {
                                                                if (!value?.trim()) return;
                                                                if (!isSupportedImageSource(normalizeImageSource(value))) {
                                                                    throw new Error('รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image และ blob');
                                                                }
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <Input size="large" placeholder="https://example.com/topping.jpg" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="category_ids"
                                            label={<span style={{ fontWeight: 600 }}>หมวดหมู่ที่ใช้ได้</span>}
                                            rules={[{ required: true, type: 'array', min: 1, message: 'กรุณาเลือกอย่างน้อย 1 หมวดหมู่' }]}
                                            extra="หนึ่งท็อปปิ้งสามารถใช้ได้หลายหมวดหมู่ เช่น เครื่องดื่ม, นม และของหวาน"
                                        >
                                            <Select
                                                mode="multiple"
                                                size="large"
                                                placeholder="เลือกหมวดหมู่ที่ใช้ท็อปปิ้งนี้"
                                                optionFilterProp="label"
                                                maxTagCount="responsive"
                                                options={categories.map((category) => ({
                                                    label: category.is_active ? category.display_name : `${category.display_name} (ปิดใช้งาน)`,
                                                    value: category.id,
                                                    disabled: !category.is_active && !selectedCategoryIds.includes(category.id),
                                                }))}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: '#fff7ed', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                        เปิดเพื่อให้พนักงานเลือกใช้งานได้ทันทีที่จุดขาย
                                                    </Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/topping')} style={{ flex: 1 }}>ยกเลิก</Button>
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
                                            <TagsOutlined style={{ color: '#ea580c' }} />
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <div
                                            style={{
                                                width: '100%',
                                                aspectRatio: '16 / 10',
                                                borderRadius: 16,
                                                background: '#fff7ed',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: 14,
                                            }}
                                        >
                                            {hasPreviewImage ? (
                                                <img src={normalizedPreviewImage} alt={displayName || 'preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <TagsOutlined style={{ fontSize: 40, color: '#ea580c' }} />
                                            )}
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{displayName || 'ชื่อท็อปปิ้ง'}</Title>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                            <Tag color="orange" style={{ borderRadius: 999 }}>
                                                POS {formatCurrency(Number(price || 0))}
                                            </Tag>
                                            <Tag color="blue" style={{ borderRadius: 999 }}>
                                                Delivery {formatCurrency(Number(priceDelivery || 0))}
                                            </Tag>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                            {selectedCategories.length > 0 ? (
                                                selectedCategories.map((category) => (
                                                    <Tag key={category.id} color={category.is_active ? 'gold' : 'default'} style={{ borderRadius: 999 }}>
                                                        {category.display_name}
                                                    </Tag>
                                                ))
                                            ) : (
                                                <Text type="secondary">ยังไม่ได้เลือกหมวดหมู่</Text>
                                            )}
                                        </div>
                                        <Alert type={isActive ? 'success' : 'warning'} showIcon message={isActive ? 'ท็อปปิ้งนี้พร้อมใช้งาน' : 'ท็อปปิ้งนี้ถูกปิดใช้งาน'} />
                                    </Card>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#c2410c' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalTopping?.create_date)}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>อัปเดตเมื่อ: {formatDate(originalTopping?.update_date)}</Text>
                                        </Card>
                                    ) : null}

                                    {!hasSelectableCategories ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="ยังไม่มีหมวดหมู่ให้เลือก"
                                            description="กรุณาสร้างหรือเปิดใช้งาน Category ก่อนบันทึกท็อปปิ้ง เพื่อกำหนดว่าท็อปปิ้งนี้ใช้ได้กับเมนูหมวดใดบ้าง"
                                        />
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
