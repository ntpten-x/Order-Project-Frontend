'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Select, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { IngredientsUnit } from '../../../../../types/api/ingredientsUnit';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    ImagePreview,
    ActionButtons
} from './style';

const { TextArea } = Input;

import { authService } from '../../../../../services/auth.service';

export default function IngredientsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/ingredientsUnit/getAll');
            if (response.ok) {
                const data = await response.json();
                setUnits(data.filter((u: IngredientsUnit) => u.is_active));
            }
        } catch (error) {
            console.error("Failed to fetch units", error);
        }
    };

    const fetchIngredient = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/ingredients/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
            const data = await response.json();
            form.setFieldsValue({
                ingredient_name: data.ingredient_name,
                display_name: data.display_name,
                description: data.description,
                img_url: data.img_url,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setImageUrl(data.img_url || '');
            setDisplayName(data.display_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
            router.push('/ingredients');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        fetchUnits();
        if (isEdit) {
            fetchIngredient();
        }
    }, [isEdit, id, fetchIngredient]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/ingredients/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตวัตถุดิบได้');
                }
                
                message.success('อัปเดตวัตถุดิบสำเร็จ');
            } else {
                const response = await fetch(`/api/ingredients/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างวัตถุดิบได้');
                }
                
                message.success('สร้างวัตถุดิบสำเร็จ');
            }
            router.push('/ingredients');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตวัตถุดิบได้' : 'ไม่สามารถสร้างวัตถุดิบได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบวัตถุดิบ',
            content: `คุณต้องการลบวัตถุดิบ "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/ingredients/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบวัตถุดิบได้');
                    message.success('ลบวัตถุดิบสำเร็จ');
                    router.push('/ingredients');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบวัตถุดิบได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/ingredients');

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
                        initialValues={{ is_active: true }}
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
                            name="ingredient_name"
                            label="ชื่อวัตถุดิบ (ภาษาอังกฤษ) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อวัตถุดิบ' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น Sugar, Salt, Flour" 
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
                                placeholder="เช่น น้ำตาล, เกลือ, แป้ง" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="unit_id"
                            label="หน่วยวัตถุดิบ *"
                            rules={[{ required: true, message: 'กรุณาเลือกหน่วยวัตถุดิบ' }]}
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
