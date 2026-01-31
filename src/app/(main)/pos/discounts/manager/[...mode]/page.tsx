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

import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";

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
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลส่วนลดได้');
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
            message.error('ไม่สามารถดึงข้อมูลส่วนลดได้');
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
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตส่วนลดได้');
                }
                
                message.success('อัปเดตส่วนลดสำเร็จ');
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
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างส่วนลดได้');
                }
                
                message.success('สร้างส่วนลดสำเร็จ');
            }
            router.push('/pos/discounts');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตส่วนลดได้' : 'ไม่สามารถสร้างส่วนลดได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/discounts/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบส่วนลดได้');
                    message.success('ลบส่วนลดสำเร็จ');
                    router.push('/pos/discounts');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบส่วนลดได้');
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
                            label="รหัสส่วนลด (ในระบบ) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกรหัสส่วนลด' },
                                { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น DISCOUNT_10, NEW_YEAR" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="ชื่อที่แสดงให้ลูกค้า *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น ส่วนลดปีใหม่, ลด 10%" 
                                maxLength={100}
                            />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="รายละเอียด/เงื่อนไข"
                            rules={[
                                { max: 500, message: 'ความยาวต้องไม่เกิน 500 ตัวอักษร' }
                            ]}
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="รายละเอียดเงื่อนไขของส่วนลด (ถ้ามี)" 
                                maxLength={500}
                            />
                        </Form.Item>

                        <Form.Item
                            name="discount_type"
                            label="ประเภทส่วนลด *"
                            rules={[
                                { required: true, message: 'กรุณาเลือกประเภทส่วนลด' }
                            ]}
                        >
                            <Radio.Group buttonStyle="solid">
                                <Radio.Button value={DiscountType.Fixed}>
                                    💵 ลดเป็นบาท (Fixed)
                                </Radio.Button>
                                <Radio.Button value={DiscountType.Percentage}>
                                    📊 ลดเป็นเปอร์เซ็นต์ (%)
                                </Radio.Button>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            name="discount_amount"
                            label={discountType === DiscountType.Fixed ? "มูลค่าส่วนลด (บาท) *" : "มูลค่าส่วนลด (%) *"}
                            rules={[
                                { required: true, message: 'กรุณากรอกมูลค่าส่วนลด' },
                                { 
                                    validator: async (_, value) => {
                                        if (value < 0) {
                                            throw new Error('มูลค่าต้องไม่ติดลบ');
                                        }
                                        if (discountType === DiscountType.Percentage && value > 100) {
                                            throw new Error('เปอร์เซ็นต์ต้องไม่เกิน 100%');
                                        }
                                    }
                                }
                            ]}
                        >
                            <InputNumber
                                size="large"
                                min={0}
                                max={discountType === DiscountType.Percentage ? 100 : undefined}
                                placeholder={discountType === DiscountType.Fixed ? "เช่น 50" : "เช่น 10"}
                                style={{ width: '100%' }}
                                addonAfter={discountType === DiscountType.Fixed ? "บาท" : "%"}
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

