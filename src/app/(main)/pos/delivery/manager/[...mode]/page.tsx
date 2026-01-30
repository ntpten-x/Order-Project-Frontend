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
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
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
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธเธฃเธดเธเธฒเธฃเธชเนเธเธชเธณเน€เธฃเนเธ');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธเธฃเธดเธเธฒเธฃเธชเนเธเธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/delivery');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธเธฃเธดเธเธฒเธฃเธชเนเธ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธเธฃเธดเธเธฒเธฃเธชเนเธ "${deliveryName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/delivery/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
                    message.success('เธฅเธเธเธฃเธดเธเธฒเธฃเธชเนเธเธชเธณเน€เธฃเนเธ');
                    router.push('/pos/delivery');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธเธฃเธดเธเธฒเธฃเธชเนเธเนเธ”เน');
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
                            label="เธเธทเนเธญเธเธฃเธดเธเธฒเธฃเธชเนเธ *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธเธฃเธดเธเธฒเธฃเธชเนเธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ Grab, Lineman, Food Panda" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="delivery_prefix"
                            label="เธฃเธซเธฑเธชเธขเนเธญ (Prefix)"
                            rules={[
                                { max: 10, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 10 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                            normalize={(value) => (value || '').toUpperCase()}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ GF, LM (เธชเธณเธซเธฃเธฑเธเธชเธฃเนเธฒเธเธฃเธซเธฑเธชเธญเธญเน€เธ”เธญเธฃเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด)" 
                                maxLength={10}
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="logo"
                            label="เนเธฅเนเธเน (URL)"
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
                                            throw new Error('เธเธฃเธธเธ“เธฒเธเธฃเธญเธ URL เธซเธฃเธทเธญ Data URI เธ—เธตเนเธ–เธนเธเธ•เนเธญเธ');
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
                            label="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
                        >
                            <Switch 
                                checkedChildren="เน€เธเธดเธ”เนเธเนเธเธฒเธ" 
                                unCheckedChildren="เธเธดเธ”เนเธเนเธเธฒเธ"
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

