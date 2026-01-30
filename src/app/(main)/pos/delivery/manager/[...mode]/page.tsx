'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    DeliveryPreview,
    ActionButtons
} from './style';

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

export default function DeliveryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deliveryName, setDeliveryName] = useState<string>('');
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

    const fetchDelivery = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/delivery/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลบริการส่งได้');
            const data = await response.json();
            form.setFieldsValue({
                delivery_name: data.delivery_name,
                delivery_prefix: data.delivery_prefix,
                logo: data.logo,
                is_active: data.is_active,
            });
            setDeliveryName(data.delivery_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลบริการส่งได้');
            router.push('/pos/delivery');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchDelivery();
        }
    }, [isEdit, id, fetchDelivery]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/delivery/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตบริการส่งได้');
                }
                
                message.success('อัปเดตบริการส่งสำเร็จ');
            } else {
                const response = await fetch(`/api/pos/delivery/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างบริการส่งได้');
                }
                
                message.success('สร้างบริการส่งสำเร็จ');
            }
            router.push('/pos/delivery');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตบริการส่งได้' : 'ไม่สามารถสร้างบริการส่งได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบบริการส่ง',
            content: `คุณต้องการลบบริการส่ง "${deliveryName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/delivery/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบบริการส่งได้');
                    message.success('ลบบริการส่งสำเร็จ');
                    router.push('/pos/delivery');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบบริการส่งได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/delivery');

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
                            if (changedValues.delivery_name !== undefined) {
                                setDeliveryName(changedValues.delivery_name);
                            }
                        }}
                    >
                        <Form.Item
                            name="delivery_name"
                            label="ชื่อบริการส่ง *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อบริการส่ง' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น Grab, Lineman, Food Panda" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="delivery_prefix"
                            label="รหัสย่อ (Prefix)"
                            rules={[
                                { max: 10, message: 'ความยาวต้องไม่เกิน 10 ตัวอักษร' }
                            ]}
                            normalize={(value) => (value || '').toUpperCase()}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น GF, LM (สำหรับสร้างรหัสออเดอร์อัตโนมัติ)" 
                                maxLength={10}
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="logo"
                            label="โลโก้ (URL)"
                            rules={[
                                { 
                                    validator: async (_, value) => {
                                        if (!value) return;
                                        // Allow if it's a data URI
                                        if (value.startsWith('data:image')) return;
                                        // Allow if it's a valid URL
                                        try {
                                            new URL(value);
                                            return;
                                        } catch {
                                            throw new Error('กรุณากรอก URL หรือ Data URI ที่ถูกต้อง');
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="https://example.com/logo.png" 
                            />
                        </Form.Item>

                        {/* Delivery Preview */}
                        <Form.Item noStyle dependencies={['delivery_name', 'logo']}>
                            {({ getFieldValue }) => (
                                <DeliveryPreview 
                                    name={getFieldValue('delivery_name')} 
                                    logo={getFieldValue('logo')} 
                                />
                            )}
                        </Form.Item>

                        <Form.Item
                            name="is_active"
                            label="สถานะการใช้งาน"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
                        >
                            <Switch 
                                checkedChildren="เปิดใช้งาน" 
                                unCheckedChildren="ปิดใช้งาน"
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

