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
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
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
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธซเธกเธงเธ”เธซเธกเธนเนเธชเธณเน€เธฃเนเธ');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธซเธกเธงเธ”เธซเธกเธนเนเธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/category');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธซเธกเธงเธ”เธซเธกเธนเน',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธซเธกเธงเธ”เธซเธกเธนเน "${displayName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/category/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
                    message.success('เธฅเธเธซเธกเธงเธ”เธซเธกเธนเนเธชเธณเน€เธฃเนเธ');
                    router.push('/pos/category');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธ”เน');
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
                            label="เธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเน (เธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธซเธกเธงเธ”เธซเธกเธนเน' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉเน€เธ—เนเธฒเธเธฑเนเธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ Beverage, Food, Snack" 
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
                                placeholder="เน€เธเนเธ เน€เธเธฃเธทเนเธญเธเธ”เธทเนเธก, เธญเธฒเธซเธฒเธฃ, เธเธเธก" 
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
                            label="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ"
                            valuePropName="checked"
                            style={{ marginTop: 20 }}
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

