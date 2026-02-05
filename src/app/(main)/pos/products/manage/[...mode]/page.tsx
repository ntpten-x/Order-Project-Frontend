'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Spin, Switch, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { Category } from '../../../../../../types/api/pos/category';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import {
    ManagePageStyles,
    pageStyles,
    ProductPreview,
    ActionButtons
} from './style';

const { TextArea } = Input;

import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";

export default function ProductsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [unitModalVisible, setUnitModalVisible] = useState(false);
    const [, forceUpdate] = useState({}); // To trigger re-render on form change for custom display

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await getCsrfTokenCached();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/pos/category');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.filter((c: Category) => c.is_active));
            }
        } catch (error: unknown) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/pos/productsUnit');
            if (response.ok) {
                const data = await response.json();
                setUnits(data.filter((u: ProductsUnit) => u.is_active));
            }
        } catch (error: unknown) {
            console.error("Failed to fetch units", error);
        }
    };

    const fetchProduct = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/products/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลสินค้าได้');
            const data = await response.json();
            form.setFieldsValue({
                product_name: data.product_name,
                display_name: data.display_name,
                description: data.description,
                img_url: data.img_url,
                price: parseFloat(data.price),
                price_delivery: Number(data.price_delivery ?? data.price ?? 0),
                category_id: data.category_id,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setImageUrl(data.img_url || '');
            setDisplayName(data.display_name || '');
        } catch (error: unknown) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลสินค้าได้');
            router.push('/pos/products');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        fetchCategories();
        fetchUnits();
        if (isEdit) {
            fetchProduct();
        }
    }, [isEdit, id, fetchProduct]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/products/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตสินค้าได้');
                }
                
                message.success('อัปเดตสินค้าสำเร็จ');
            } else {
                const response = await fetch(`/api/pos/products/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างสินค้าได้');
                }
                
                message.success('สร้างสินค้าสำเร็จ');
            }
            router.push('/pos/products');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตสินค้าได้' : 'ไม่สามารถสร้างสินค้าได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบสินค้า',
            content: `คุณต้องการลบสินค้า "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
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
                } catch (error: unknown) {
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
            <ManagePageStyles />

            <UIPageHeader
                title={isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
                subtitle={isEdit ? "แก้ไขข้อมูลสินค้า" : "สร้างสินค้าใหม่"}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1200}>
                <PageSection style={{ background: "transparent", border: "none" }}>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 340px', 
                gap: 24, 
                alignItems: 'start',
                margin: 0
            }}>
                {/* Left Column: Form */}
                <div className="manage-form-card" style={{
                     ...pageStyles.formCard,
                     gridColumn: '1 / span 1',
                     margin: 0
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark={false}
                            autoComplete="off"
                            initialValues={{ is_active: true, price: 0, price_delivery: 0 }}
                            onValuesChange={(changedValues) => {
                                if (changedValues.img_url !== undefined) setImageUrl(changedValues.img_url);
                                if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                if (
                                    !isEdit &&
                                    changedValues.price !== undefined &&
                                    !form.isFieldTouched("price_delivery")
                                ) {
                                    form.setFieldsValue({ price_delivery: changedValues.price });
                                }
                                forceUpdate({});
                            }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Form.Item
                                    name="display_name"
                                    label="ชื่อที่แสดง (ภาษาไทย) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                    ]}
                                >
                                    <Input size="large" placeholder="เช่น น้ำเปล่า, กาแฟ" maxLength={100} />
                                </Form.Item>
                                
                                <Form.Item
                                    name="product_name"
                                    label="ชื่อสินค้า (ภาษาอังกฤษ) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกชื่อสินค้า' },
                                        { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                    ]}
                                >
                                    <Input size="large" placeholder="如 Water, Coffee" maxLength={100} />
                                </Form.Item>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Form.Item
                                    name="price"
                                    label="ราคา (หน้าร้าน) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกราคา' },
                                        { type: 'number', min: 0, message: 'ราคาต้องไม่ติดลบ' }
                                    ]}
                                >
                                    <InputNumber<number>
                                        size="large"
                                        placeholder="0.00"
                                        min={0}
                                        precision={2}
                                        style={{ width: '100%', height: 45, fontSize: 16, borderRadius: 12 }}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0}
                                        controls={false}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="price_delivery"
                                    label="ราคา (Delivery) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกราคา Delivery' },
                                        { type: 'number', min: 0, message: 'ราคาต้องไม่ติดลบ' }
                                    ]}
                                >
                                    <InputNumber<number>
                                        size="large"
                                        placeholder="0.00"
                                        min={0}
                                        precision={2}
                                        style={{ width: '100%', height: 45, fontSize: 16, borderRadius: 12 }}
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={(value) => value ? parseFloat(value.replace(/\$\s?|(,*)/g, '')) : 0}
                                        controls={false}
                                    />
                                </Form.Item>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <Form.Item
                                    name="category_id"
                                    label="หมวดหมู่ *"
                                    rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
                                >
                                    <div 
                                        className="custom-select"
                                        onClick={() => setCategoryModalVisible(true)}
                                        style={{
                                            border: '1px solid #d9d9d9', borderRadius: 12, padding: '10px 16px',
                                            cursor: 'pointer', height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}
                                    >
                                        <span style={{ color: form.getFieldValue('category_id') ? '#1E293B' : '#bfbfbf' }}>
                                            {categories.find(c => c.id === form.getFieldValue('category_id'))?.display_name || "เลือกหมวดหมู่"}
                                        </span>
                                        <span style={{ color: '#94A3B8' }}>▼</span>
                                    </div>
                                    <Form.Item name="category_id" hidden><Input /></Form.Item>
                                </Form.Item>

                                <Form.Item
                                    name="unit_id"
                                    label="หน่วยสินค้า *"
                                    rules={[{ required: true, message: 'กรุณาเลือกหน่วยสินค้า' }]}
                                >
                                    <div 
                                        className="custom-select"
                                        onClick={() => setUnitModalVisible(true)}
                                        style={{
                                            border: '1px solid #d9d9d9', borderRadius: 12, padding: '10px 16px',
                                            cursor: 'pointer', height: 45, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}
                                    >
                                        <span style={{ color: form.getFieldValue('unit_id') ? '#1E293B' : '#bfbfbf' }}>
                                            {units.find(u => u.id === form.getFieldValue('unit_id'))?.display_name || "เลือกหน่วย"}
                                        </span>
                                        <span style={{ color: '#94A3B8' }}>▼</span>
                                    </div>
                                    <Form.Item name="unit_id" hidden><Input /></Form.Item>
                                </Form.Item>
                            </div>

                            <Form.Item name="img_url" label="รูปภาพ URL">
                                <Input size="large" placeholder="https://example.com/image.jpg" />
                            </Form.Item>

                            <Form.Item name="description" label="รายละเอียดเพิ่มเติม">
                                <TextArea rows={4} placeholder="รายละเอียด..." style={{ borderRadius: 12 }} />
                            </Form.Item>

                            <Form.Item name="is_active" label="สถานะ" valuePropName="checked">
                                <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิดใช้งาน" />
                            </Form.Item>

                            <ActionButtons isEdit={isEdit} loading={submitting} onCancel={handleBack} />
                        </Form>
                    )}
                </div>

                {/* Right Column: Preview */}
                <div style={{ 
                    position: 'sticky', 
                    top: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                }}>
                     <div style={{
                        background: 'white',
                        borderRadius: 24,
                        padding: 24,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                        border: '1px solid #F1F5F9'
                     }}>
                        <Typography.Title level={5} style={{ margin: 0, marginBottom: 16, color: '#475569' }}>
                            ตัวอย่างการแสดงผล
                        </Typography.Title>
                        <ProductPreview 
                            name={displayName}
                            productName={form.getFieldValue('product_name')}
                            imageUrl={imageUrl}
                            price={form.getFieldValue('price')}
                            priceDelivery={form.getFieldValue('price_delivery')}
                            category={categories.find(c => c.id === form.getFieldValue('category_id'))?.display_name}
                            unit={units.find(u => u.id === form.getFieldValue('unit_id'))?.display_name}
                        />
                     </div>
                </div>
            </div>
                </PageSection>
            </PageContainer>

            {/* Modals */}
             <Modal
                title="เลือกหมวดหมู่"
                open={categoryModalVisible}
                onCancel={() => setCategoryModalVisible(false)}
                footer={null}
                centered
                width={400}
                zIndex={10001}
                styles={{ body: { borderRadius: 20, overflow: 'hidden', padding: 0 } }}
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 16, background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => {
                                form.setFieldsValue({ category_id: cat.id });
                                setCategoryModalVisible(false);
                            }}
                            style={{
                                padding: '16px',
                                border: `1px solid ${form.getFieldValue('category_id') === cat.id ? '#4F46E5' : '#E2E8F0'}`,
                                borderRadius: 16,
                                cursor: 'pointer',
                                background: form.getFieldValue('category_id') === cat.id ? '#F5F3FF' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, color: '#1E293B' }}>{cat.display_name}</div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>{cat.category_name}</div>
                            </div>
                            {form.getFieldValue('category_id') === cat.id && <span style={{ color: '#4F46E5', fontWeight: 'bold' }}>✓</span>}
                        </div>
                    ))}
                    </div>
                </div>
            </Modal>

            <Modal
                title="เลือกหน่วยสินค้า"
                open={unitModalVisible}
                onCancel={() => setUnitModalVisible(false)}
                footer={null}
                centered
                width={400}
                zIndex={10001}
                 styles={{ body: { borderRadius: 20, overflow: 'hidden', padding: 0 } }}
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 16, background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {units.map((unit) => (
                        <div
                            key={unit.id}
                            onClick={() => {
                                form.setFieldsValue({ unit_id: unit.id });
                                setUnitModalVisible(false);
                            }}
                            style={{
                                padding: '16px',
                                border: `1px solid ${form.getFieldValue('unit_id') === unit.id ? '#10B981' : '#E2E8F0'}`,
                                borderRadius: 16,
                                cursor: 'pointer',
                                background: form.getFieldValue('unit_id') === unit.id ? '#ECFDF5' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600, color: '#1E293B' }}>{unit.display_name}</div>
                                <div style={{ fontSize: 12, color: '#64748B' }}>{unit.unit_name}</div>
                            </div>
                            {form.getFieldValue('unit_id') === unit.id && <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>}
                        </div>
                    ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
