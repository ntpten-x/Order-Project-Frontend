'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, InputNumber, message, Spin, Select, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { Category } from '../../../../../../types/api/pos/category';
import { ProductsUnit } from '../../../../../../types/api/pos/productsUnit';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    ImagePreview,
    ActionButtons
} from './style';

const { TextArea } = Input;

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

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

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

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
        } catch (error) {
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
        } catch (error) {
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
                category_id: data.category_id,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setImageUrl(data.img_url || '');
            setDisplayName(data.display_name || '');
        } catch (error) {
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
            <ManagePageStyles />
            
            {/* Header */}
            <PageHeader 
                isEdit={isEdit}
                onBack={handleBack}
                onDelete={isEdit ? handleDelete : undefined}
            />
            
            {/* Form Card */}
            <div className="manage-form-card" style={pageStyles.formCard}>
                {loading ? (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        padding: '60px 0' 
                    }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        autoComplete="off"
                        initialValues={{ is_active: true, price: 0 }}
                        onValuesChange={(changedValues) => {
                            if (changedValues.img_url !== undefined) {
                                setImageUrl(changedValues.img_url);
                            }
                            if (changedValues.display_name !== undefined) {
                                setDisplayName(changedValues.display_name);
                            }
                        }}
                    >
                        <Form.Item
                            name="product_name"
                            label="ชื่อสินค้า (ภาษาอังกฤษ) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อสินค้า' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น Water, Coffee, Tea" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="ชื่อที่แสดง (ภาษาไทย) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น น้ำเปล่า, กาแฟ, ชา" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="ราคา (บาท) *"
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
                                style={{ width: '100%', height: 45, fontSize: 16 }}
                                inputMode="decimal"
                                controls={false}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                onKeyDown={(e) => {
                                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
                                    const isNumber = /^[0-9]$/.test(e.key);
                                    
                                    if (!isNumber && !allowedKeys.includes(e.key)) {
                                        e.preventDefault();
                                    }

                                    // Prevent multiple decimal points
                                    if (e.key === '.' && form.getFieldValue('price')?.toString().includes('.')) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="category_id"
                            label="หมวดหมู่ *"
                            rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เลือกหมวดหมู่"
                                showSearch
                                optionFilterProp="children"
                            >
                                {categories.map((cat) => (
                                    <Select.Option key={cat.id} value={cat.id}>
                                        {cat.display_name} ({cat.category_name})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="unit_id"
                            label="หน่วยสินค้า *"
                            rules={[{ required: true, message: 'กรุณาเลือกหน่วยสินค้า' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เลือกหน่วย"
                                showSearch
                                optionFilterProp="children"
                            >
                                {units.map((unit) => (
                                    <Select.Option key={unit.id} value={unit.id}>
                                        {unit.display_name} ({unit.unit_name})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="img_url"
                            label="รูปภาพ URL"
                        >
                            <Input 
                                size="large" 
                                placeholder="https://example.com/image.jpg" 
                            />
                        </Form.Item>

                        {/* Image Preview */}
                        <ImagePreview url={imageUrl} name={displayName} />

                        <Form.Item
                            name="description"
                            label="รายละเอียด"
                            style={{ marginTop: 20 }}
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="รายละเอียดเพิ่มเติม..." 
                                style={{ borderRadius: 12 }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_active"
                            label="สถานะการใช้งาน"
                            valuePropName="checked"
                        >
                            <Switch 
                                checkedChildren="ใช้งาน" 
                                unCheckedChildren="ไม่ใช้งาน"
                            />
                        </Form.Item>

                        {/* Action Buttons */}
                        <ActionButtons 
                            isEdit={isEdit}
                            loading={submitting}
                            onCancel={handleBack}
                        />
                    </Form>
                )}
            </div>
        </div>
    );
}

