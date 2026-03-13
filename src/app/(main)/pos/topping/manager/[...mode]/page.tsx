'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Spin, Switch, Tag, Typography, message } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, DeleteOutlined, DownOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { Category } from '../../../../../../types/api/pos/category';
import { Topping } from '../../../../../../types/api/pos/topping';
import { isSupportedImageSource, normalizeImageSource } from '../../../../../../utils/image/source';
import { pageStyles, ManagePageStyles, ToppingPreview, ActionButtons } from './style';

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
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [tempCategoryIds, setTempCategoryIds] = useState<string[]>([]);
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

    // Sync form values for preview using useWatch
    const displayName = Form.useWatch('display_name', form);
    const price = Form.useWatch('price', form);
    const priceDelivery = Form.useWatch('price_delivery', form);
    const imgUrl = Form.useWatch('img', form);
    const isActive = Form.useWatch('is_active', form) ?? true;
    const categoryIds = Form.useWatch('category_ids', form) || [];

    const selectedCategories = useMemo(
        () => categories.filter((category) => categoryIds.includes(category.id)),
        [categories, categoryIds]
    );

    const hasSelectableCategories = useMemo(
        () => categories.some((category) => category.is_active) || selectedCategories.length > 0,
        [categories, selectedCategories.length]
    );

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

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            <UIPageHeader 
                title={isEdit ? 'แก้ไขข้อมูลท็อปปิ้ง' : 'เพิ่มท็อปปิ้งใหม่'}
                onBack={() => router.replace('/pos/topping')} 
                actions={isEdit && canDelete ? (
                    <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                        ลบ
                    </Button>
                ) : null}
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
                                <Card bordered={false} className="manage-form-card" style={{ borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#4f46e5' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลท็อปปิ้ง</Title>
                                    </div>

                                    <Form<ToppingFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                        initialValues={{ is_active: true, price: 0, price_delivery: 0, img: '', category_ids: [] }}
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
                                                        if (!value?.trim()) return;
                                                        if (await checkNameConflict(value)) throw new Error('ชื่อนี้ถูกใช้งานแล้ว');
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input size="large" maxLength={100} placeholder="ชีส, ไข่มุก, วิปครีม..." />
                                        </Form.Item>

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="price"
                                                    label="ราคา"
                                                    rules={[
                                                        { required: true, message: 'กรุณากรอกราคาขาย' },
                                                        {
                                                            validator: async (_, value) => {
                                                                if (!value && value !== 0) return;
                                                                const num = Number(value);
                                                                if (Number.isNaN(num) || num < 0) throw new Error('ราคาต้องมากกว่าหรือเท่ากับ 0');
                                                            }
                                                        }
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        style={{ width: '100%', borderRadius: 12 }}
                                                        onChange={(e) => {
                                                            const normalized = normalizeDigits(e.target.value);
                                                            form.setFieldValue('price', normalized);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <Form.Item
                                                    name="price_delivery"
                                                    label="ราคาเดลิเวอรี"
                                                    rules={[
                                                        {
                                                            validator: async (_, value) => {
                                                                if (!value && value !== 0) return;
                                                                const num = Number(value);
                                                                if (Number.isNaN(num) || num < 0) throw new Error('ราคาต้องมากกว่าหรือเท่ากับ 0');
                                                            }
                                                        }
                                                    ]}
                                                >
                                                    <Input
                                                        size="large"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        style={{ width: '100%', borderRadius: 12 }}
                                                        onChange={(e) => {
                                                            const normalized = normalizeDigits(e.target.value);
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

                                        <Form.Item
                                            name="category_ids"
                                            label="หมวดหมู่ที่ใช้ท็อปปิ้งนี้"
                                            rules={[{ required: true, type: 'array', min: 1, message: 'กรุณาเลือกอย่างน้อย 1 หมวดหมู่' }]}
                                        >
                                            <div
                                                onClick={() => {
                                                    setTempCategoryIds(categoryIds);
                                                    setIsCategoryModalVisible(true);
                                                }}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: 12,
                                                    border: '2px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    minHeight: 46,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'white',
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                                    {selectedCategories.length > 0 ? (
                                                        selectedCategories.map((cat) => (
                                                            <Tag
                                                                key={cat.id}
                                                                style={{
                                                                    borderRadius: 6,
                                                                    margin: 0,
                                                                    background: '#EEF2FF',
                                                                    color: '#4F46E5',
                                                                    border: 'none',
                                                                }}
                                                            >
                                                                {cat.display_name}
                                                            </Tag>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: '#94a3b8' }}>เลือกหมวดหมู่</span>
                                                    )}
                                                </div>
                                                <DownOutlined style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }} />
                                            </div>
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
                                                    <Switch />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <ActionButtons 
                                            isEdit={isEdit} 
                                            loading={submitting} 
                                            onCancel={() => router.replace('/pos/topping')} 
                                        />
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

                                    {isEdit && (
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
                                    )}

                                    {!hasSelectableCategories && (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="ยังไม่มีหมวดหมู่ที่เปิดใช้งาน"
                                            description="กรุณาตรวจสอบหน้าจัดการหมวดหมู่ก่อนบันทึก"
                                        />
                                    )}
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
                width={400}
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
                    </Button>
                ]}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflowY: 'auto' }}>
                    {categories.map((cat) => {
                        const isSelected = tempCategoryIds.includes(cat.id);
                        const isDisabled = !cat.is_active && !isSelected;
                        
                        return (
                            <div
                                key={cat.id}
                                onClick={() => {
                                    if (isDisabled) return;
                                    const newIds = isSelected
                                        ? tempCategoryIds.filter((id) => id !== cat.id)
                                        : [...tempCategoryIds, cat.id];
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
                                <span>{cat.display_name}</span>
                                {isSelected && <CheckCircleOutlined style={{ color: '#3b82f6' }} />}
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
