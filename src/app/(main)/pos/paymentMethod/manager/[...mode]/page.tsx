'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Select } from 'antd';
import { useRouter } from 'next/navigation';
import {
    ManagePageStyles,
    pageStyles,
    PageHeader,
    PaymentMethodPreview,
    ActionButtons
} from './style';

import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { paymentMethodService } from "../../../../../../services/pos/paymentMethod.service";
import { PaymentMethod } from "../../../../../../types/api/pos/paymentMethod";

// กำหนดค่าที่อนุญาตให้เพิ่มได้
const ALLOWED_PAYMENT_METHODS = [
    { payment_method_name: 'PromptPay', display_name: 'พร้อมเพย์' },
    { payment_method_name: 'Delivery', display_name: 'เดริเวอรี่' },
    { payment_method_name: 'Cash', display_name: 'เงินสด' },
] as const;

export default function PaymentMethodManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethodName, setPaymentMethodName] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [existingPaymentMethods, setExistingPaymentMethods] = useState<PaymentMethod[]>([]);

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

    // ดึงข้อมูล payment methods ที่มีอยู่แล้วเพื่อตรวจสอบการซ้ำ
    const fetchExistingPaymentMethods = useCallback(async () => {
        try {
            const result = await paymentMethodService.getAll();
            setExistingPaymentMethods(result.data || []);
        } catch (error) {
            console.error('ไม่สามารถดึงข้อมูล payment methods ได้:', error);
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            fetchExistingPaymentMethods();
        }
    }, [isAuthorized, fetchExistingPaymentMethods]);

    const fetchPaymentMethod = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/paymentMethod/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            const data = await response.json();
            form.setFieldsValue({
                payment_method_name: data.payment_method_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setPaymentMethodName(data.payment_method_name || '');
            setDisplayName(data.display_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลวิธีการชำระเงินได้');
            router.push('/pos/paymentMethod');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchPaymentMethod();
        }
    }, [isEdit, id, fetchPaymentMethod]);

    // ตรวจสอบว่ามี payment method นี้อยู่แล้วหรือไม่
    const isPaymentMethodExists = useCallback((paymentMethodName: string): boolean => {
        if (!paymentMethodName || !existingPaymentMethods || existingPaymentMethods.length === 0) {
            return false;
        }
        if (isEdit) {
            // ถ้าเป็นโหมดแก้ไข ให้ตรวจสอบว่ามี payment method อื่นที่มีชื่อเดียวกันหรือไม่ (ยกเว้นตัวที่กำลังแก้ไข)
            return existingPaymentMethods.some(
                pm => pm.payment_method_name === paymentMethodName && pm.id !== id
            );
        } else {
            // ถ้าเป็นโหมดเพิ่ม ให้ตรวจสอบว่ามี payment method นี้อยู่แล้วหรือไม่
            return existingPaymentMethods.some(
                pm => pm.payment_method_name === paymentMethodName
            );
        }
    }, [existingPaymentMethods, isEdit, id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFinish = async (values: any) => {
        // ตรวจสอบว่ามีการเพิ่มซ้ำหรือไม่
        if (!isEdit && isPaymentMethodExists(values.payment_method_name)) {
            message.error(`วิธีการชำระเงิน "${values.display_name}" มีอยู่ในระบบแล้ว`);
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/pos/paymentMethod/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตวิธีการชำระเงินได้');
                }
                
                message.success('อัปเดตวิธีการชำระเงินสำเร็จ');
            } else {
                const response = await fetch(`/api/pos/paymentMethod/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างวิธีการชำระเงินได้');
                }
                
                message.success('สร้างวิธีการชำระเงินสำเร็จ');
            }
            router.push('/pos/paymentMethod');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตวิธีการชำระเงินได้' : 'ไม่สามารถสร้างวิธีการชำระเงินได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบวิธีการชำระเงิน "${displayName || paymentMethodName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/paymentMethod/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบวิธีการชำระเงินได้');
                    message.success('ลบวิธีการชำระเงินสำเร็จ');
                    router.push('/pos/paymentMethod');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบวิธีการชำระเงินได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/paymentMethod');

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
                            if (changedValues.payment_method_name !== undefined) {
                                setPaymentMethodName(changedValues.payment_method_name);
                            }
                            if (changedValues.display_name !== undefined) {
                                setDisplayName(changedValues.display_name);
                            }
                        }}
                    >
                        <Form.Item
                            name="payment_method_name"
                            label="รหัสวิธีการชำระเงิน *"
                            rules={[
                                { required: true, message: 'กรุณาเลือกวิธีการชำระเงิน' }
                            ]}
                        >
                            <Select
                                size="large"
                                placeholder="เลือกวิธีการชำระเงิน"
                                onChange={(value) => {
                                    // เมื่อเลือก payment_method_name ให้ set display_name อัตโนมัติ
                                    const selectedMethod = ALLOWED_PAYMENT_METHODS.find(
                                        method => method.payment_method_name === value
                                    );
                                    if (selectedMethod) {
                                        form.setFieldsValue({ display_name: selectedMethod.display_name });
                                        setPaymentMethodName(selectedMethod.payment_method_name);
                                        setDisplayName(selectedMethod.display_name);
                                    }
                                }}
                                disabled={isEdit}
                                getPopupContainer={() => document.body}
                                dropdownStyle={{ zIndex: 9999 }}
                                virtual={false}
                                notFoundContent="ไม่มีตัวเลือก"
                                popupMatchSelectWidth={true}
                                dropdownRender={(menu) => (
                                    <div>
                                        {menu}
                                    </div>
                                )}
                            >
                                {ALLOWED_PAYMENT_METHODS.map(method => {
                                    const exists = !isEdit && isPaymentMethodExists(method.payment_method_name);
                                    return (
                                        <Select.Option 
                                            key={method.payment_method_name} 
                                            value={method.payment_method_name}
                                            disabled={exists}
                                        >
                                            {method.display_name} ({method.payment_method_name})
                                            {exists && ' - มีอยู่แล้ว'}
                                        </Select.Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="ชื่อที่แสดง *"
                            rules={[
                                { required: true, message: 'กรุณาเลือกชื่อที่แสดง' }
                            ]}
                        >
                            <Select
                                size="large"
                                placeholder="ชื่อที่แสดงจะถูกตั้งค่าอัตโนมัติ"
                                disabled
                                getPopupContainer={() => document.body}
                                dropdownStyle={{ zIndex: 9999 }}
                                virtual={false}
                            >
                                {ALLOWED_PAYMENT_METHODS.map(method => (
                                    <Select.Option 
                                        key={method.display_name} 
                                        value={method.display_name}
                                    >
                                        {method.display_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* Payment Method Preview */}
                        <Form.Item noStyle dependencies={['payment_method_name', 'display_name']}>
                            {({ getFieldValue }) => (
                                <PaymentMethodPreview 
                                    name={getFieldValue('payment_method_name')} 
                                    displayName={getFieldValue('display_name')} 
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

