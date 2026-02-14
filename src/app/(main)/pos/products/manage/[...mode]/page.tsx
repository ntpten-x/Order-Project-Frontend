'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Form, Input, InputNumber, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    ShopOutlined,
    AppstoreOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined,
    DownOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles, ProductPreview } from './style';
import { Category } from '../../../../../../types/api/pos/category';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';
import { Products } from '../../../../../../types/api/pos/products';
import { isSupportedImageSource, normalizeImageSource } from '../../../../../../utils/image/source';

const { TextArea } = Input;
const { Title, Text } = Typography;

type ManageMode = 'add' | 'edit';

type ProductFormValues = {
    product_name: string;
    display_name: string;
    description?: string;
    img_url?: string;
    price: number;
    price_delivery?: number;
    cost?: number;
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

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

export default function ProductsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<ProductFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [currentProductName, setCurrentProductName] = useState<string>('');
    const [originalProduct, setOriginalProduct] = useState<Products | null>(null);
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);

    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';
    const { isAuthorized, isChecking } = useRoleGuard();

    const selectedCategoryId = Form.useWatch('category_id', form);
    const selectedUnitId = Form.useWatch('unit_id', form);
    const displayName = Form.useWatch('display_name', form);
    const productName = Form.useWatch('product_name', form);
    const imageUrl = Form.useWatch('img_url', form);
    const price = Form.useWatch('price', form);
    const priceDelivery = Form.useWatch('price_delivery', form);
    const isActive = Form.useWatch('is_active', form) ?? true;

    const activeCategories = useMemo(() => categories.filter((item) => item.is_active), [categories]);
    const activeUnits = useMemo(() => units.filter((item) => item.is_active), [units]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/products');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await fetch('/api/pos/category');
            if (!response.ok) return;
            const payload = await response.json();
            setCategories(parseListResponse<Category>(payload));
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    }, []);

    const fetchUnits = useCallback(async () => {
        try {
            const response = await fetch('/api/pos/productsUnit');
            if (!response.ok) return;
            const payload = await response.json();
            setUnits(parseListResponse<ProductsUnit>(payload));
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    }, []);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/products/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
            const data = await response.json();

            form.setFieldsValue({
                product_name: data.product_name,
                display_name: data.display_name,
                description: data.description,
                img_url: data.img_url || undefined,
                price: Number(data.price ?? 0),
                price_delivery: Number(data.price_delivery ?? data.price ?? 0),
                cost: data.cost !== undefined && data.cost !== null ? Number(data.cost) : undefined,
                category_id: data.category_id,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setCurrentProductName((data.product_name || '').toLowerCase());
            setOriginalProduct(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลสินค้าได้');
            router.replace('/pos/products');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        fetchCategories();
        fetchUnits();
        if (isEdit) {
            fetchProduct();
        }
    }, [isEdit, fetchCategories, fetchUnits, fetchProduct]);

    const checkProductNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && value.toLowerCase() === currentProductName) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/products/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [currentProductName, id, isEdit]);

    const onFinish = async (values: ProductFormValues) => {
        setSubmitting(true);
        try {
            const payload = {
                product_name: values.product_name.trim(),
                display_name: values.display_name.trim(),
                description: values.description?.trim() || undefined,
                img_url: normalizeImageSource(values.img_url) || null,
                price: Number(values.price || 0),
                price_delivery: values.price_delivery === undefined || values.price_delivery === null
                    ? Number(values.price || 0)
                    : Number(values.price_delivery),
                cost: values.cost === undefined || values.cost === null ? undefined : Number(values.cost),
                category_id: values.category_id,
                unit_id: values.unit_id,
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/products/update/${id}` : '/api/pos/products/create';
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
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตสินค้าได้' : 'ไม่สามารถสร้างสินค้าได้'));
            }

            message.success(isEdit ? 'อัปเดตสินค้าสำเร็จ' : 'สร้างสินค้าสำเร็จ');
            router.push('/pos/products');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : (isEdit ? 'ไม่สามารถอัปเดตสินค้าได้' : 'ไม่สามารถสร้างสินค้าได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบสินค้า',
            content: `คุณต้องการลบสินค้า "${displayName || '-'}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/products/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบสินค้าได้');
                    message.success('ลบสินค้าสำเร็จ');
                    router.push('/pos/products');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบสินค้าได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/products');

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container}>
            <UIPageHeader
                title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
                subtitle={isEdit ? 'แก้ไขข้อมูลสินค้าและราคา' : 'สร้างสินค้าใหม่ให้พร้อมขายในระบบ POS'}
                onBack={handleBack}
                actions={
                    isEdit ? (
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลสินค้า</Title>
                                    </div>

                                    <Form<ProductFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ is_active: true, price: 0, price_delivery: 0 }}
                                        onValuesChange={(changedValues) => {
                                            if (
                                                !isEdit &&
                                                changedValues.price !== undefined &&
                                                !form.isFieldTouched('price_delivery')
                                            ) {
                                                form.setFieldsValue({ price_delivery: changedValues.price });
                                            }
                                        }}
                                    >
                                        <Alert
                                            showIcon
                                            type="info"
                                            icon={<InfoCircleOutlined />}
                                            message="ข้อมูลที่จำเป็น"
                                            description="ต้องระบุชื่อสินค้า ราคา หมวดหมู่ และหน่วยสินค้า โดยชื่อสินค้าในระบบจะถูกตรวจสอบไม่ให้ซ้ำในสาขา"
                                            style={{ marginBottom: 18 }}
                                        />

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="display_name"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อที่แสดง</span>}
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                                    ]}
                                                >
                                                    <Input size="large" placeholder="เช่น ชาเขียว, ข้าวผัด" maxLength={100} />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="product_name"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อสินค้าในระบบ (English)</span>}
                                                    validateTrigger={['onBlur', 'onSubmit']}
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกชื่อสินค้า' },
                                                        { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรอกได้เฉพาะภาษาอังกฤษ ตัวเลข และ - _ ( ) .' },
                                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                        {
                                                            validator: async (_, value: string) => {
                                                                if (!value?.trim()) return;
                                                                const duplicated = await checkProductNameConflict(value);
                                                                if (duplicated) throw new Error('ชื่อสินค้าในระบบนี้ถูกใช้งานแล้ว');
                                                            }
                                                        }
                                                    ]}
                                                >
                                                    <Input size="large" placeholder="e.g. green-tea, fried-rice" maxLength={100} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={12}>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="price"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>ราคา (หน้าร้าน)</span>}
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกราคา' },
                                                        { type: 'number', min: 0, message: 'ราคาต้องไม่ติดลบ' }
                                                    ]}
                                                >
                                                    <InputNumber<number> size="large" min={0} precision={2} style={{ width: '100%' }} controls={false} />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="price_delivery"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>ราคา Delivery</span>}
                                                    rules={[{ type: 'number', min: 0, message: 'ราคาต้องไม่ติดลบ' }]}
                                                >
                                                    <InputNumber<number> size="large" min={0} precision={2} style={{ width: '100%' }} controls={false} />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    name="cost"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>ต้นทุน (ไม่บังคับ)</span>}
                                                    rules={[{ type: 'number', min: 0, message: 'ต้นทุนต้องไม่ติดลบ' }]}
                                                >
                                                    <InputNumber<number> size="large" min={0} precision={2} style={{ width: '100%' }} controls={false} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={12}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="category_id"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>หมวดหมู่</span>}
                                                    rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
                                                >
                                                    <div 
                                                        onClick={() => setIsCategoryModalVisible(true)}
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: 12,
                                                            border: '2px solid',
                                                            cursor: 'pointer',
                                                            background: selectedCategoryId ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#fff',
                                                            borderColor: selectedCategoryId ? '#4F46E5' : '#e2e8f0',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            minHeight: 46
                                                        }}
                                                    >
                                                        <span style={{ color: selectedCategoryId ? '#1e293b' : '#94a3b8', fontWeight: selectedCategoryId ? 600 : 400 }}>
                                                            {selectedCategoryId 
                                                                ? categories.find(c => c.id === selectedCategoryId)?.display_name 
                                                                : 'เลือกหมวดหมู่'}
                                                        </span>
                                                        <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="unit_id"
                                                    label={<span style={{ fontWeight: 600, color: '#334155' }}>หน่วยสินค้า</span>}
                                                    rules={[{ required: true, message: 'กรุณาเลือกหน่วยสินค้า' }]}
                                                >
                                                    <div 
                                                        onClick={() => setIsUnitModalVisible(true)}
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: 12,
                                                            border: '2px solid',
                                                            cursor: 'pointer',
                                                            background: selectedUnitId ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' : '#fff',
                                                            borderColor: selectedUnitId ? '#4F46E5' : '#e2e8f0',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            minHeight: 46
                                                        }}
                                                    >
                                                        <span style={{ color: selectedUnitId ? '#1e293b' : '#94a3b8', fontWeight: selectedUnitId ? 600 : 400 }}>
                                                            {selectedUnitId 
                                                                ? units.find(u => u.id === selectedUnitId)?.display_name 
                                                                : 'เลือกหน่วยสินค้า'}
                                                        </span>
                                                        <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="img_url"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>รูปภาพ URL</span>}
                                            rules={[
                                                {
                                                    validator: async (_, value: string | undefined) => {
                                                        if (!value?.trim()) return;
                                                        const normalized = normalizeImageSource(value);
                                                        if (!isSupportedImageSource(normalized)) {
                                                            throw new Error('รองรับเฉพาะ URL รูปภาพแบบ http(s), data:image และ blob');
                                                        }
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input size="large" placeholder="https://example.com/image.jpg" />
                                        </Form.Item>

                                        <Form.Item name="description" label={<span style={{ fontWeight: 600, color: '#334155' }}>รายละเอียดเพิ่มเติม</span>}>
                                            <TextArea rows={4} placeholder="รายละเอียดสินค้า, หมายเหตุ, จุดเด่น" style={{ borderRadius: 12 }} maxLength={500} />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 8, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้า POS</Text>
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
                                                    background: '#4F46E5',
                                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
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
                                    <div style={{
                                        background: 'white',
                                        borderRadius: 20,
                                        padding: 20,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                        border: '1px solid #F1F5F9',
                                    }}>
                                        <Title level={5} style={{ color: '#4F46E5', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>
                                        <ProductPreview
                                            name={displayName}
                                            productName={productName}
                                            imageUrl={imageUrl}
                                            price={price}
                                            priceDelivery={priceDelivery}
                                            category={categories.find(c => c.id === selectedCategoryId)?.display_name}
                                            unit={units.find(u => u.id === selectedUnitId)?.display_name}
                                        />
                                    </div>

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">ID: {originalProduct?.id || '-'}</Text>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalProduct?.create_date)}</Text>
                                                <Text type="secondary">อัปเดตเมื่อ: {formatDate(originalProduct?.update_date)}</Text>
                                            </div>
                                        </Card>
                                    ) : null}

                                    {(activeCategories.length === 0 || activeUnits.length === 0) ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            icon={<ShopOutlined />}
                                            message="ข้อมูลอ้างอิงยังไม่ครบ"
                                            description={
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                                    {activeCategories.length === 0 ? (
                                                        <Button size="small" onClick={() => router.push('/pos/category')}>จัดการหมวดหมู่</Button>
                                                    ) : null}
                                                    {activeUnits.length === 0 ? (
                                                        <Button size="small" onClick={() => router.push('/pos/productsUnit')}>จัดการหน่วยสินค้า</Button>
                                                    ) : null}
                                                </div>
                                            }
                                        />
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>

            {/* Category Selection Modal */}
            <Modal
                title="เลือกหมวดหมู่"
                open={isCategoryModalVisible}
                onCancel={() => setIsCategoryModalVisible(false)}
                footer={null}
                centered
                width={400}
                styles={{ body: { padding: '12px 16px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeCategories.map(cat => (
                        <div
                            key={cat.id}
                            onClick={() => {
                                form.setFieldsValue({ category_id: cat.id });
                                setIsCategoryModalVisible(false);
                            }}
                            style={{
                                padding: '14px 18px',
                                border: '2px solid',
                                borderRadius: 12,
                                cursor: 'pointer',
                                background: selectedCategoryId === cat.id ? '#eff6ff' : '#fff',
                                borderColor: selectedCategoryId === cat.id ? '#3b82f6' : '#e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                minHeight: 54
                            }}
                        >
                            <span style={{ fontWeight: selectedCategoryId === cat.id ? 600 : 400 }}>
                                {cat.display_name}
                            </span>
                            {selectedCategoryId === cat.id && <CheckCircleOutlined style={{ color: '#3b82f6', fontSize: 18 }} />}
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Unit Selection Modal */}
            <Modal
                title="เลือกหน่วยสินค้า"
                open={isUnitModalVisible}
                onCancel={() => setIsUnitModalVisible(false)}
                footer={null}
                centered
                width={400}
                styles={{ body: { padding: '12px 16px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeUnits.map(unit => (
                        <div
                            key={unit.id}
                            onClick={() => {
                                form.setFieldsValue({ unit_id: unit.id });
                                setIsUnitModalVisible(false);
                            }}
                            style={{
                                padding: '14px 18px',
                                border: '2px solid',
                                borderRadius: 12,
                                cursor: 'pointer',
                                background: selectedUnitId === unit.id ? '#eff6ff' : '#fff',
                                borderColor: selectedUnitId === unit.id ? '#3b82f6' : '#e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                minHeight: 54
                            }}
                        >
                            <span style={{ fontWeight: selectedUnitId === unit.id ? 600 : 400 }}>
                                {unit.display_name}
                            </span>
                            {selectedUnitId === unit.id && <CheckCircleOutlined style={{ color: '#3b82f6', fontSize: 18 }} />}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
