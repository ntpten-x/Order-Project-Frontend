'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Col, Form, Input, message, Modal, Row, Select, Spin, Switch } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";
import {
    ManagePageStyles,
    pageStyles,
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
    const [methodModalVisible, setMethodModalVisible] = useState(false);

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
        if (isPaymentMethodExists(values.payment_method_name)) {
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
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <ManagePageStyles />

            <UIPageHeader
                title={isEdit ? "แก้ไขวิธีการชำระเงิน" : "เพิ่มวิธีการชำระเงิน"}
                subtitle={isEdit ? "แก้ไขข้อมูลวิธีการชำระเงิน" : "สร้างวิธีการชำระเงินใหม่"}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1000}>
                <PageSection>
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
                        <Row gutter={[32, 24]}>
                            {/* Left Column: Form Fields */}
                            <Col xs={24} lg={14} xl={15}>
                                <div style={pageStyles.formSection}>
                                    <Form.Item
                                        name="payment_method_name"
                                        label="รหัสวิธีการชำระเงิน *"
                                        rules={[
                                            { required: true, message: 'กรุณาเลือกวิธีการชำระเงิน' }
                                        ]}
                                    >
                                        {/* Payment Method Selection - Switched to Modal for better Mobile/Touch experience */}
                                        <>
                                            <div 
                                                style={{ 
                                                    border: `1px solid ${paymentMethodName ? '#10b981' : '#d9d9d9'}`,
                                                    borderRadius: 12,
                                                    padding: '12px 16px',
                                                    cursor: isEdit ? 'not-allowed' : 'pointer',
                                                    background: isEdit ? '#f5f5f5' : '#fff',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    height: 48,
                                                    transition: 'all 0.2s',
                                                    boxShadow: paymentMethodName ? '0 0 0 2px rgba(16, 185, 129, 0.1)' : 'none'
                                                }}
                                                onClick={() => {
                                                    if (!isEdit) {
                                                        setMethodModalVisible(true);
                                                    }
                                                }}
                                            >
                                                <span style={{ color: paymentMethodName ? '#1a1a2e' : '#bfbfbf', fontSize: 16 }}>
                                                    {paymentMethodName 
                                                        ? `${displayName} (${paymentMethodName})`
                                                        : "เลือกวิธีการชำระเงิน"}
                                                </span>
                                                <span style={{ color: '#bfbfbf' }}>▼</span>
                                            </div>
                                            {/* Hidden Input for Form Validation */}
                                            <Form.Item 
                                                name="payment_method_name" 
                                                style={{ display: 'none' }}
                                                rules={[{ required: true, message: 'กรุณาเลือกวิธีการชำระเงิน' }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                        </>
                                    </Form.Item>

                                    <Modal
                                        title="เลือกวิธีการชำระเงิน"
                                        open={methodModalVisible}
                                        onCancel={() => setMethodModalVisible(false)}
                                        footer={null}
                                        centered
                                        width={400}
                                        zIndex={10001}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {ALLOWED_PAYMENT_METHODS.map(method => {
                                                const exists = !isEdit && isPaymentMethodExists(method.payment_method_name);
                                                const isSelected = paymentMethodName === method.payment_method_name;
                                                
                                                return (
                                                    <div
                                                        key={method.payment_method_name}
                                                        onClick={() => {
                                                            if (!exists) {
                                                                form.setFieldsValue({ 
                                                                    payment_method_name: method.payment_method_name,
                                                                    display_name: method.display_name
                                                                });
                                                                setPaymentMethodName(method.payment_method_name);
                                                                setDisplayName(method.display_name);
                                                                setMethodModalVisible(false);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '16px',
                                                            border: `1px solid ${isSelected ? '#10b981' : '#e5e7eb'}`,
                                                            borderRadius: 12,
                                                            cursor: exists ? 'not-allowed' : 'pointer',
                                                            background: isSelected ? '#ecfdf5' : (exists ? '#f5f5f5' : '#fff'),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            opacity: exists ? 0.6 : 1
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: isSelected ? '#047857' : '#1f2937', fontSize: 16 }}>
                                                                {method.display_name}
                                                            </div>
                                                            <div style={{ fontSize: 13, color: isSelected ? '#059669' : '#6b7280' }}>
                                                                {method.payment_method_name}
                                                            </div>
                                                        </div>
                                                        {exists && <span style={{ fontSize: 12, color: '#ef4444' }}>มีอยู่แล้ว</span>}
                                                        {isSelected && !exists && <span style={{ color: '#10b981', fontSize: 18 }}>✓</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Modal>

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

                                    <Form.Item
                                        name="is_active"
                                        label="สถานะการใช้งาน"
                                        valuePropName="checked"
                                        style={{ marginTop: 24 }}
                                    >
                                        <Switch 
                                            checkedChildren="เปิดใช้งาน" 
                                            unCheckedChildren="ปิดใช้งาน"
                                            style={{ transform: 'scale(1.1)' }}
                                        />
                                    </Form.Item>
                                </div>

                                <ActionButtons 
                                    isEdit={isEdit}
                                    loading={submitting}
                                    onCancel={handleBack}
                                />
                            </Col>

                            {/* Right Column: Preview */}
                            <Col xs={24} lg={10} xl={9}>
                                <div style={{ 
                                    position: 'sticky', 
                                    top: 24,
                                    background: 'rgba(250, 250, 250, 0.5)', 
                                    padding: 24, 
                                    borderRadius: 20, 
                                    border: '1px solid #f0f0f0' 
                                }}>
                                    <Form.Item noStyle dependencies={['payment_method_name', 'display_name']}>
                                        {({ getFieldValue }) => (
                                            <PaymentMethodPreview 
                                                name={getFieldValue('payment_method_name')} 
                                                displayName={getFieldValue('display_name')} 
                                            />
                                        )}
                                    </Form.Item>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
