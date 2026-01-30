'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    CategoryPreview,
    ActionButtons
} from './style';

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

export default function CategoryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [categoryName, setCategoryName] = useState<string>('');
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

    const fetchCategory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/category/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            const data = await response.json();
            form.setFieldsValue({
                category_name: data.category_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setCategoryName(data.category_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            router.push('/pos/category');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchCategory();
        }
    }, [isEdit, id, fetchCategory]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/category/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตหมวดหมู่ได้');
                }
                
                message.success('อัปเดตหมวดหมู่สำเร็จ');
            } else {
                const response = await fetch(`/api/pos/category/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างหมวดหมู่ได้');
                }
                
                message.success('สร้างหมวดหมู่สำเร็จ');
            }
            router.push('/pos/category');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตหมวดหมู่ได้' : 'ไม่สามารถสร้างหมวดหมู่ได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/category/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                    message.success('ลบหมวดหมู่สำเร็จ');
                    router.push('/pos/category');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบหมวดหมู่ได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/category');

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
                        initialValues={{ is_active: true }}
                        onValuesChange={(changedValues) => {
                            if (changedValues.display_name !== undefined) {
                                setDisplayName(changedValues.display_name);
                            }
                            if (changedValues.category_name !== undefined) {
                                setCategoryName(changedValues.category_name);
                            }
                        }}
                    >
                        <Form.Item
                            name="category_name"
                            label="ชื่อหมวดหมู่ (ภาษาอังกฤษ) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อหมวดหมู่' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น Beverage, Food, Snack" 
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
                                placeholder="เช่น เครื่องดื่ม, อาหาร, ขนม" 
                                maxLength={100}
                            />
                        </Form.Item>

                        {/* Category Preview */}
                        <CategoryPreview 
                            displayName={displayName} 
                            categoryName={categoryName} 
                        />

                        <Form.Item
                            name="is_active"
                            label="สถานะการใช้งาน"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
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

