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
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒเนเธ”เน');
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
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒเนเธ”เน');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธชเธดเธเธเนเธฒเนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธชเธดเธเธเนเธฒเนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/products');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธชเธดเธเธเนเธฒเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธชเธดเธเธเนเธฒเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธชเธดเธเธเนเธฒ "${displayName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/products/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเธดเธเธเนเธฒเนเธ”เน');
                    message.success('เธฅเธเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
                    router.push('/pos/products');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเธดเธเธเนเธฒเนเธ”เน');
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
                            label="เธเธทเนเธญเธชเธดเธเธเนเธฒ (เธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธชเธดเธเธเนเธฒ' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉเน€เธ—เนเธฒเธเธฑเนเธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ Water, Coffee, Tea" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="เธเธทเนเธญเธ—เธตเนเนเธชเธ”เธ (เธ เธฒเธฉเธฒเนเธ—เธข) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธ—เธตเนเนเธชเธ”เธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ เธเนเธณเน€เธเธฅเนเธฒ, เธเธฒเนเธ, เธเธฒ" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="price"
                            label="เธฃเธฒเธเธฒ (เธเธฒเธ—) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธฒเธเธฒ' },
                                { type: 'number', min: 0, message: 'เธฃเธฒเธเธฒเธ•เนเธญเธเนเธกเนเธ•เธดเธ”เธฅเธ' }
                            ]}
                        >
                            <InputNumber 
                                size="large" 
                                placeholder="0.00"
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>

                        <Form.Item
                            name="category_id"
                            label="เธซเธกเธงเธ”เธซเธกเธนเน *"
                            rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เน€เธฅเธทเธญเธเธซเธกเธงเธ”เธซเธกเธนเน"
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
                            label="เธซเธเนเธงเธขเธชเธดเธเธเนเธฒ *"
                            rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒ' }]}
                        >
                            <Select 
                                size="large" 
                                placeholder="เน€เธฅเธทเธญเธเธซเธเนเธงเธข"
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
                            label="เธฃเธนเธเธ เธฒเธ URL"
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
                            label="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”"
                            style={{ marginTop: 20 }}
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก..." 
                                style={{ borderRadius: 12 }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_active"
                            label="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ"
                            valuePropName="checked"
                        >
                            <Switch 
                                checkedChildren="เนเธเนเธเธฒเธ" 
                                unCheckedChildren="เนเธกเนเนเธเนเธเธฒเธ"
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

