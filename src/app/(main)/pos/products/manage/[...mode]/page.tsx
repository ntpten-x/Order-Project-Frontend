'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Spin, Switch, Typography, message } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, DeleteOutlined, DownOutlined, ExclamationCircleOutlined, SaveOutlined, ShopOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { Category } from '../../../../../../types/api/pos/category';
import { Products } from '../../../../../../types/api/pos/products';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';
import { isSupportedImageSource, normalizeImageSource } from '../../../../../../utils/image/source';
import { pageStyles, ProductPreview } from './style';

const { TextArea } = Input;
const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';
type ProductFormValues = {
    display_name: string;
    description?: string;
    img_url?: string;
    price: number;
    price_delivery?: number;
    category_id: string;
    unit_id: string;
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

export default function ProductsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ProductFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalProduct, setOriginalProduct] = useState<Products | null>(null);
    const [currentName, setCurrentName] = useState('');
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';

    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreate = can('products.page', 'create');
    const canUpdate = can('products.page', 'update');
    const canDelete = can('products.page', 'delete');

    const selectedCategoryId = Form.useWatch('category_id', form);
    const selectedUnitId = Form.useWatch('unit_id', form);
    const displayName = Form.useWatch('display_name', form);
    const imageUrl = Form.useWatch('img_url', form);
    const price = Form.useWatch('price', form);
    const priceDelivery = Form.useWatch('price_delivery', form);
    const isActive = Form.useWatch('is_active', form) ?? true;

    const activeCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);
    const activeUnits = useMemo(() => units.filter((item) => item.is_active), [units]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('เธฃเธนเธเนเธเธ URL เนเธกเนเธ–เธนเธเธ•เนเธญเธ');
            router.replace('/pos/products');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        void getCsrfTokenCached().then(setCsrfToken);
    }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreate) {
            message.warning('เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเธดเนเธกเธชเธดเธเธเนเธฒ');
            router.replace('/pos/products');
            return;
        }
        if (mode === 'edit' && !canUpdate) {
            message.warning('เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเนเธเนเนเธเธชเธดเธเธเนเธฒ');
            router.replace('/pos/products');
        }
    }, [canCreate, canUpdate, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchCategories = useCallback(async () => {
        const response = await fetch('/api/pos/category', { cache: 'no-store' });
        if (response.ok) setCategories(parseListResponse<Category>(await response.json()));
    }, []);

    const fetchUnits = useCallback(async () => {
        const response = await fetch('/api/pos/productsUnit', { cache: 'no-store' });
        if (response.ok) setUnits(parseListResponse<ProductsUnit>(await response.json()));
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/products/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒเนเธ”เน');
            const data = await response.json();
            form.setFieldsValue({
                display_name: data.display_name,
                description: data.description,
                img_url: data.img_url || undefined,
                price: Number(data.price || 0),
                price_delivery: Number(data.price_delivery ?? data.price ?? 0),
                category_id: data.category_id,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setCurrentName((data.display_name || '').toLowerCase());
            setOriginalProduct(data);
        } catch (error) {
            console.error(error);
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒเนเธ”เน');
            router.replace('/pos/products');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (!isAuthorized || permissionLoading) return;
        void fetchCategories();
        void fetchUnits();
        if (isEdit) void fetchProduct();
    }, [fetchCategories, fetchProduct, fetchUnits, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && value.toLowerCase() === currentName) return false;
        try {
            const response = await fetch(`/api/pos/products/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [currentName, id, isEdit]);

    const handleSubmit = async (values: ProductFormValues) => {
        if (isEdit ? !canUpdate : !canCreate) {
            message.warning(isEdit ? 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเนเธเนเนเธเธชเธดเธเธเนเธฒ' : 'เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเธดเนเธกเธชเธดเธเธเนเธฒ');
            return;
        }
        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload = {
                display_name: values.display_name.trim(),
                description: values.description?.trim() ?? '',
                img_url: normalizeImageSource(values.img_url) || null,
                price: Number(values.price || 0),
                price_delivery: values.price_delivery === undefined || values.price_delivery === null ? Number(values.price || 0) : Number(values.price_delivery),
                category_id: values.category_id,
                unit_id: values.unit_id,
                is_active: values.is_active,
            };
            const response = await fetch(isEdit ? `/api/pos/products/update/${id}` : '/api/pos/products/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฑเธเธ—เธถเธเธชเธดเธเธเนเธฒเนเธ”เน');
            }
            message.success(isEdit ? 'เธญเธฑเธเน€เธ”เธ•เธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ' : 'เธชเธฃเนเธฒเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
            router.replace('/pos/products');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฑเธเธ—เธถเธเธชเธดเธเธเนเธฒเนเธ”เน');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒ "${displayName || '-'}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/products/delete/${id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเธดเธเธเนเธฒเนเธ”เน');
                    }
                    message.success('เธฅเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
                    router.replace('/pos/products');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเธดเธเธเนเธฒเนเธ”เน');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="เธเธณเธฅเธฑเธเธ•เธฃเธงเธเธชเธญเธเธชเธดเธ—เธเธดเน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเธซเธเนเธฒเธเธตเน" tone="danger" />;

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={isEdit ? 'เนเธเนเนเธเธชเธดเธเธเนเธฒ' : 'เน€เธเธดเนเธกเธชเธดเธเธเนเธฒ'}
                onBack={() => router.replace('/pos/products')}
                actions={isEdit && canDelete ? <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>เธฅเธ</Button> : null}
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                                        <Title level={5} style={{ margin: 0 }}>เธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒ</Title>
                                    </div>

                                    <Form<ProductFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true, price: 0, price_delivery: 0 }}
                                        onValuesChange={(changed) => {
                                            if (!isEdit && changed.price !== undefined && !form.isFieldTouched('price_delivery')) {
                                                form.setFieldsValue({ price_delivery: changed.price });
                                            }
                                        }}
                                    >
                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600 }}>เธเธทเนเธญเธชเธดเธเธเนเธฒ</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธชเธดเธเธเนเธฒ' },
                                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        if (await checkNameConflict(value)) throw new Error('เธเธทเนเธญเธเธตเนเธ–เธนเธเนเธเนเธเธฒเธเนเธฅเนเธง');
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="เธญเน€เธกเธฃเธดเธเธฒเนเธเน, เธเนเธฒเธงเธเธฐเน€เธเธฃเธฒ..." />
                                        </Form.Item>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="price" label={<span style={{ fontWeight: 600 }}>เธฃเธฒเธเธฒเธเธฒเธข</span>} rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธฒเธเธฒ' }]}>
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        style={{ width: '100%', borderRadius: 12, height: 46 }}
                                                        onChange={(e) => {
                                                            const normalized = normalizeDigits(e.target.value);
                                                            form.setFieldValue('price', normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="price_delivery" label={<span style={{ fontWeight: 600 }}>เธฃเธฒเธเธฒเน€เธ”เธฅเธดเน€เธงเธญเธฃเธต</span>}>
                                                    <Input
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        style={{ width: '100%', borderRadius: 12, height: 46 }}
                                                        onChange={(e) => {
                                                            const normalized = normalizeDigits(e.target.value);
                                                            form.setFieldValue('price_delivery', normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="category_id" label={<span style={{ fontWeight: 600 }}>เธซเธกเธงเธ”เธซเธกเธนเน</span>} rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน' }]}>
                                                    <div onClick={() => setIsCategoryModalVisible(true)} style={{ padding: '10px 16px', borderRadius: 12, border: '2px solid #e2e8f0', cursor: 'pointer', minHeight: 46, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>{selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId)?.display_name : 'เน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน'}</span>
                                                        <DownOutlined />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item name="unit_id" label={<span style={{ fontWeight: 600 }}>เธซเธเนเธงเธขเธชเธดเธเธเนเธฒ</span>} rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒ' }]}>
                                                    <div onClick={() => setIsUnitModalVisible(true)} style={{ padding: '10px 16px', borderRadius: 12, border: '2px solid #e2e8f0', cursor: 'pointer', minHeight: 46, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>{selectedUnitId ? units.find((u) => u.id === selectedUnitId)?.display_name : 'เน€เธฅเธทเธญเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒ'}</span>
                                                        <DownOutlined />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="img_url"
                                            label={<span style={{ fontWeight: 600 }}>เธฃเธนเธเธ เธฒเธ URL</span>}
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim()) return;
                                                        if (!isSupportedImageSource(normalizeImageSource(value))) {
                                                            throw new Error('เธฃเธญเธเธฃเธฑเธเน€เธเธเธฒเธฐ URL เธฃเธนเธเธ เธฒเธเนเธเธ http(s), data:image เนเธฅเธฐ blob');
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" placeholder="https://example.com/image.jpg" />
                                        </Form.Item>

                                        <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก</span>}>
                                            <TextArea rows={4} maxLength={500} placeholder="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธชเธดเธเธเนเธฒ, เธซเธกเธฒเธขเน€เธซเธ•เธธ" />
                                        </Form.Item>

                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>เน€เธเธดเธ”เน€เธเธทเนเธญเนเธซเนเนเธชเธ”เธเนเธเธซเธเนเธฒ POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/products')} style={{ flex: 1 }}>เธขเธเน€เธฅเธดเธ</Button>
                                            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={submitting} style={{ flex: 2 }}>
                                                เธเธฑเธเธ—เธถเธเธเนเธญเธกเธนเธฅ
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <Title level={5} style={{ color: '#4f46e5', marginBottom: 16 }}>เธ•เธฑเธงเธญเธขเนเธฒเธเธเธฒเธฃเนเธชเธ”เธเธเธฅ</Title>
                                        <ProductPreview
                                            name={displayName}
                                            imageUrl={imageUrl}
                                            price={price}
                                            priceDelivery={priceDelivery}
                                            category={categories.find((c) => c.id === selectedCategoryId)?.display_name}
                                            unit={units.find((u) => u.id === selectedUnitId)?.display_name}
                                        />
                                    </Card>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เธฃเธฒเธขเธเธฒเธฃ</Text>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block' }}>เธชเธฃเนเธฒเธเน€เธกเธทเนเธญ: {formatDate(originalProduct?.create_date)}</Text>
                                            <Text type="secondary" style={{ display: 'block' }}>เธญเธฑเธเน€เธ”เธ•เน€เธกเธทเนเธญ: {formatDate(originalProduct?.update_date)}</Text>
                                        </Card>
                                    ) : null}

                                    {(activeCategories.length === 0 || activeUnits.length === 0) ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            icon={<ShopOutlined />}
                                            message="เธเนเธญเธกเธนเธฅเธญเนเธฒเธเธญเธดเธเธขเธฑเธเนเธกเนเธเธฃเธ"
                                            description="เธเธฃเธธเธ“เธฒเธ•เธฃเธงเธเธชเธญเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธฅเธฐเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเธ—เธตเนเน€เธเธดเธ”เนเธเนเธเธฒเธเธเนเธญเธเธเธฑเธเธ—เธถเธเธชเธดเธเธเนเธฒ"
                                        />
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>

            <Modal title="เน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน" open={isCategoryModalVisible} onCancel={() => setIsCategoryModalVisible(false)} footer={null} centered width="min(400px, calc(100vw - 16px))">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeCategories.map((cat) => (
                        <div key={cat.id} onClick={() => { form.setFieldsValue({ category_id: cat.id }); setIsCategoryModalVisible(false); }} style={{ padding: '14px 18px', border: '2px solid', borderRadius: 12, cursor: 'pointer', background: selectedCategoryId === cat.id ? '#eff6ff' : '#fff', borderColor: selectedCategoryId === cat.id ? '#3b82f6' : '#e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{cat.display_name}</span>
                            {selectedCategoryId === cat.id ? <CheckCircleOutlined style={{ color: '#3b82f6' }} /> : null}
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal title="เน€เธฅเธทเธญเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒ" open={isUnitModalVisible} onCancel={() => setIsUnitModalVisible(false)} footer={null} centered width="min(400px, calc(100vw - 16px))">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeUnits.map((unit) => (
                        <div key={unit.id} onClick={() => { form.setFieldsValue({ unit_id: unit.id }); setIsUnitModalVisible(false); }} style={{ padding: '14px 18px', border: '2px solid', borderRadius: 12, cursor: 'pointer', background: selectedUnitId === unit.id ? '#eff6ff' : '#fff', borderColor: selectedUnitId === unit.id ? '#3b82f6' : '#e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{unit.display_name}</span>
                            {selectedUnitId === unit.id ? <CheckCircleOutlined style={{ color: '#3b82f6' }} /> : null}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
