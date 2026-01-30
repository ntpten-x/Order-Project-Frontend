'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, InputNumber, message, Spin, Switch, Modal, Radio } from 'antd';
import { useRouter } from 'next/navigation';
import { DiscountType } from '../../../../../../types/api/pos/discounts';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    DiscountPreview,
    ActionButtons
} from './style';

import { getCsrfTokenCached } from "@/utils/pos/csrf";
import { useRoleGuard } from "@/utils/pos/accessControl";
import { AccessGuardFallback } from "@/components/pos/AccessGuard";

const { TextArea } = Input;

export default function DiscountManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Fixed);

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

    const fetchDiscount = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/discounts/getById/${id}`);
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเนเธงเธเธฅเธ”เนเธ”เน');
            const data = await response.json();
            form.setFieldsValue({
                discount_name: data.discount_name,
                display_name: data.display_name,
                description: data.description,
                discount_type: data.discount_type,
                discount_amount: data.discount_amount,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || data.discount_name || '');
            setDiscountType(data.discount_type || DiscountType.Fixed);

        } catch (error) {
            console.error(error);
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธชเนเธงเธเธฅเธ”เนเธ”เน');
            router.push('/pos/discounts');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchDiscount();
        }
    }, [isEdit, id, fetchDiscount]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/discounts/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธชเนเธงเธเธฅเธ”เนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธชเนเธงเธเธฅเธ”เธชเธณเน€เธฃเนเธ');
            } else {
                const response = await fetch(`/api/pos/discounts/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธชเนเธงเธเธฅเธ”เนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธชเนเธงเธเธฅเธ”เธชเธณเน€เธฃเนเธ');
            }
            router.push('/pos/discounts');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธชเนเธงเธเธฅเธ”เนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธชเนเธงเธเธฅเธ”เนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธชเนเธงเธเธฅเธ”',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธชเนเธงเธเธฅเธ” "${displayName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/discounts/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเนเธงเธเธฅเธ”เนเธ”เน');
                    message.success('เธฅเธเธชเนเธงเธเธฅเธ”เธชเธณเน€เธฃเนเธ');
                    router.push('/pos/discounts');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธชเนเธงเธเธฅเธ”เนเธ”เน');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/discounts');

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
                        initialValues={{ 
                            is_active: true,
                            discount_type: DiscountType.Fixed,
                            discount_amount: 0
                        }}
                        onValuesChange={(changedValues) => {
                            if (changedValues.display_name !== undefined) {
                                setDisplayName(changedValues.display_name);
                            }
                            if (changedValues.discount_type !== undefined) {
                                setDiscountType(changedValues.discount_type);
                            }

                        }}
                    >
                        <Form.Item
                            name="discount_name"
                            label="เธฃเธซเธฑเธชเธชเนเธงเธเธฅเธ” (เนเธเธฃเธฐเธเธ) *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธฃเธซเธฑเธชเธชเนเธงเธเธฅเธ”' },
                                { max: 50, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 50 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ DISCOUNT_10, NEW_YEAR" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="เธเธทเนเธญเธ—เธตเนเนเธชเธ”เธเนเธซเนเธฅเธนเธเธเนเธฒ *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธ—เธตเนเนเธชเธ”เธ' },
                                { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เน€เธเนเธ เธชเนเธงเธเธฅเธ”เธเธตเนเธซเธกเน, เธฅเธ” 10%" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”/เน€เธเธทเนเธญเธเนเธ"
                            rules={[
                                { max: 500, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 500 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                            ]}
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธทเนเธญเธเนเธเธเธญเธเธชเนเธงเธเธฅเธ” (เธ–เนเธฒเธกเธต)" 
                                maxLength={500}
                            />
                        </Form.Item>

                        <Form.Item
                            name="discount_type"
                            label="เธเธฃเธฐเน€เธ เธ—เธชเนเธงเธเธฅเธ” *"
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธฃเธฐเน€เธ เธ—เธชเนเธงเธเธฅเธ”' }
                            ]}
                        >
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={DiscountType.Fixed}>
                                    ๐’ต เธฅเธ”เน€เธเนเธเธเธฒเธ— (Fixed)
                                </Radio.Button>
                                <Radio.Button value={DiscountType.Percentage}>
                                    ๐“ เธฅเธ”เน€เธเนเธเน€เธเธญเธฃเนเน€เธเนเธเธ•เน (%)
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            name="discount_amount"
                            label={discountType === DiscountType.Fixed ? "เธกเธนเธฅเธเนเธฒเธชเนเธงเธเธฅเธ” (เธเธฒเธ—) *" : "เธกเธนเธฅเธเนเธฒเธชเนเธงเธเธฅเธ” (%) *"}
                            rules={[
                                { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธกเธนเธฅเธเนเธฒเธชเนเธงเธเธฅเธ”' },
                                { 
                                    validator: async (_, value) => {
                                        if (value < 0) {
                                            throw new Error('เธกเธนเธฅเธเนเธฒเธ•เนเธญเธเนเธกเนเธ•เธดเธ”เธฅเธ');
                                        }
                                        if (discountType === DiscountType.Percentage && value > 100) {
                                            throw new Error('เน€เธเธญเธฃเนเน€เธเนเธเธ•เนเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100%');
                                        }
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                size="large"
                                min={0}
                                max={discountType === DiscountType.Percentage ? 100 : undefined}
                                placeholder={discountType === DiscountType.Fixed ? "เน€เธเนเธ 50" : "เน€เธเนเธ 10"}
                                style={{ width: '100%' }}
                                addonAfter={discountType === DiscountType.Fixed ? "เธเธฒเธ—" : "%"}
                            />
                        </Form.Item>

                        {/* Discount Preview */}
                        <Form.Item noStyle dependencies={['display_name', 'discount_type', 'discount_amount']}>
                            {({ getFieldValue }) => (
                                <DiscountPreview 
                                    displayName={getFieldValue('display_name')} 
                                    discountType={getFieldValue('discount_type')}
                                    discountAmount={getFieldValue('discount_amount')}
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

