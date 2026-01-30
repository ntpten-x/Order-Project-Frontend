'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    ProductsUnitPreview,
    ActionButtons
} from './style';

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

export default function ProductsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [unitName, setUnitName] = useState<string>('');
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

    const fetchUnit = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/productsUnit/getById/${id}`);
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
            const data = await response.json();
            form.setFieldsValue({
                unit_name: data.unit_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setUnitName(data.unit_name || '');
        } catch (error) {
            console.error(error);
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
            router.push('/pos/productsUnit');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchUnit();
        }
    }, [isEdit, id, fetchUnit]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/productsUnit/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธซเธเนเธงเธขเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
            } else {
                const response = await fetch(`/api/pos/productsUnit/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/productsUnit');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธซเธเนเธงเธข "${displayName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/productsUnit/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
                    message.success('เธฅเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเธชเธณเน€เธฃเนเธ');
                    router.push('/pos/productsUnit');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธซเธเนเธงเธขเธชเธดเธเธเนเธฒเนเธ”เน');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/productsUnit');

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
                            if (changedValues.unit_name !== undefined) {
                                setUnitName(changedValues.unit_name);
                            }
                        }}
                    >
                        <Form.Item
                            name="unit_name"
                            label="เธเธทเนเธญเธซเธเนเธงเธข (เธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธซเธเนเธงเธข' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉเน€เธ—เนเธฒเธเธฑเนเธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ Piece, Bottle, Cup" 
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
                                placeholder="เน€เธเนเธ เธเธดเนเธ, เธเธงเธ”, เนเธเนเธง" 
                                maxLength={100}
                            />
                        </Form.Item>

                        {/* Unit Preview */}
                        <ProductsUnitPreview 
                            displayName={displayName} 
                            unitName={unitName} 
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

