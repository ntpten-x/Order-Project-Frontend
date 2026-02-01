'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, InputNumber, message, Spin, Switch, Modal, Radio, DatePicker, Select } from 'antd';
import { useRouter } from 'next/navigation';
import { PromotionType, PromotionCondition } from '../../../../../../types/api/pos/promotions';
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../../../components/pos/AccessGuard";
import { GiftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
dayjs.locale('th');

const promotionTypeOptions = [
    { label: 'ซื้อ X แถม Y', value: PromotionType.BuyXGetY },
    { label: 'ลดเปอร์เซ็นต์', value: PromotionType.PercentageOff },
    { label: 'ลดจำนวนเงิน', value: PromotionType.FixedAmountOff },
    { label: 'ฟรีค่าจัดส่ง', value: PromotionType.FreeShipping },
    { label: 'ชุดโปรโมชัน', value: PromotionType.Bundle },
    { label: 'ซื้อขั้นต่ำ', value: PromotionType.MinimumPurchase },
];

const conditionTypeOptions = [
    { label: 'ทุกสินค้า', value: PromotionCondition.AllProducts },
    { label: 'หมวดหมู่เฉพาะ', value: PromotionCondition.SpecificCategory },
    { label: 'สินค้าเฉพาะ', value: PromotionCondition.SpecificProduct },
    { label: 'ยอดซื้อขั้นต่ำ', value: PromotionCondition.MinimumAmount },
];

export default function PromotionManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [promotionType, setPromotionType] = useState<PromotionType>(PromotionType.PercentageOff);
    const [conditionType, setConditionType] = useState<PromotionCondition>(PromotionCondition.AllProducts);
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

    const fetchPromotion = useCallback(async () => {
        setLoading(true);
        try {
            const { promotionsService } = await import('../../../../../../services/pos/promotions.service');
            const data = await promotionsService.getById(id);
            
            form.setFieldsValue({
                promotion_code: data.promotion_code,
                name: data.name,
                description: data.description,
                promotion_type: data.promotion_type,
                condition_type: data.condition_type,
                condition_value: data.condition_value ? JSON.parse(data.condition_value) : undefined,
                discount_amount: data.discount_amount,
                discount_percentage: data.discount_percentage,
                minimum_purchase: data.minimum_purchase,
                buy_quantity: data.buy_quantity,
                get_quantity: data.get_quantity,
                start_date: data.start_date ? dayjs(data.start_date) : undefined,
                end_date: data.end_date ? dayjs(data.end_date) : undefined,
                usage_limit: data.usage_limit,
                usage_limit_per_user: data.usage_limit_per_user,
                is_active: data.is_active,
            });
            setPromotionType(data.promotion_type || PromotionType.PercentageOff);
            setConditionType(data.condition_type || PromotionCondition.AllProducts);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลโปรโมชันได้');
            router.push('/pos/promotions');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchPromotion();
        }
    }, [isEdit, id, fetchPromotion]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const payload = {
                ...values,
                condition_value: values.condition_value ? JSON.stringify(values.condition_value) : undefined,
                start_date: values.start_date ? values.start_date.toISOString() : undefined,
                end_date: values.end_date ? values.end_date.toISOString() : undefined,
            };

            const { promotionsService } = await import('../../../../../../services/pos/promotions.service');
            
            if (isEdit) {
                await promotionsService.update(id, payload);
                message.success('อัปเดตโปรโมชันสำเร็จ');
            } else {
                await promotionsService.create(payload);
                message.success('สร้างโปรโมชันสำเร็จ');
            }
            
            router.push('/pos/promotions');
        } catch (error: any) {
            message.error(error.message || 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: 20,
                padding: '24px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
            }}>
                <GiftOutlined style={{ fontSize: 32, color: 'white' }} />
                <div>
                    <h2 style={{ color: 'white', margin: 0 }}>
                        {isEdit ? 'แก้ไขโปรโมชัน' : 'เพิ่มโปรโมชัน'}
                    </h2>
                </div>
            </div>

            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        promotion_type: PromotionType.PercentageOff,
                        condition_type: PromotionCondition.AllProducts,
                        is_active: true,
                        usage_limit: 0,
                        usage_limit_per_user: 1,
                    }}
                >
                    <Form.Item
                        label="รหัสโปรโมชัน"
                        name="promotion_code"
                        rules={[{ required: true, message: 'กรุณากรอกรหัสโปรโมชัน' }]}
                    >
                        <Input placeholder="เช่น SUMMER2024" />
                    </Form.Item>

                    <Form.Item
                        label="ชื่อโปรโมชัน"
                        name="name"
                        rules={[{ required: true, message: 'กรุณากรอกชื่อโปรโมชัน' }]}
                    >
                        <Input placeholder="เช่น โปรโมชันฤดูร้อน" />
                    </Form.Item>

                    <Form.Item
                        label="รายละเอียด"
                        name="description"
                    >
                        <TextArea rows={3} placeholder="อธิบายรายละเอียดโปรโมชัน" />
                    </Form.Item>

                    <Form.Item
                        label="ประเภทโปรโมชัน"
                        name="promotion_type"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group
                            options={promotionTypeOptions}
                            onChange={(e) => setPromotionType(e.target.value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="เงื่อนไข"
                        name="condition_type"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group
                            options={conditionTypeOptions}
                            onChange={(e) => setConditionType(e.target.value)}
                        />
                    </Form.Item>

                    {(promotionType === PromotionType.PercentageOff || promotionType === PromotionType.FixedAmountOff) && (
                        <>
                            {promotionType === PromotionType.PercentageOff && (
                                <Form.Item
                                    label="เปอร์เซ็นต์ส่วนลด"
                                    name="discount_percentage"
                                    rules={[{ required: true, message: 'กรุณากรอกเปอร์เซ็นต์ส่วนลด' }]}
                                >
                                    <InputNumber
                                        min={0}
                                        max={100}
                                        placeholder="เช่น 10"
                                        style={{ width: '100%' }}
                                        addonAfter="%"
                                    />
                                </Form.Item>
                            )}

                            {promotionType === PromotionType.FixedAmountOff && (
                                <Form.Item
                                    label="จำนวนเงินส่วนลด"
                                    name="discount_amount"
                                    rules={[{ required: true, message: 'กรุณากรอกจำนวนเงินส่วนลด' }]}
                                >
                                    <InputNumber
                                        min={0}
                                        placeholder="เช่น 50"
                                        style={{ width: '100%' }}
                                        addonAfter="บาท"
                                    />
                                </Form.Item>
                            )}
                        </>
                    )}

                    {promotionType === PromotionType.BuyXGetY && (
                        <>
                            <Form.Item
                                label="จำนวนที่ต้องซื้อ"
                                name="buy_quantity"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item
                                label="จำนวนที่ได้ฟรี"
                                name="get_quantity"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </>
                    )}

                    {promotionType === PromotionType.MinimumPurchase && (
                        <>
                            <Form.Item
                                label="ยอดซื้อขั้นต่ำ"
                                name="minimum_purchase"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} addonAfter="บาท" />
                            </Form.Item>
                            <Form.Item
                                label="ส่วนลด"
                                name="discount_amount"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} addonAfter="บาท" />
                            </Form.Item>
                        </>
                    )}

                    {(conditionType === PromotionCondition.SpecificCategory || conditionType === PromotionCondition.SpecificProduct) && (
                        <Form.Item
                            label="ค่าเงื่อนไข (JSON Array)"
                            name="condition_value"
                            tooltip="กรอกเป็น JSON Array เช่น ['id1', 'id2']"
                        >
                            <TextArea rows={2} placeholder='["id1", "id2"]' />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="วันที่เริ่มต้น - สิ้นสุด"
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            showTime
                            format="DD/MM/YYYY HH:mm"
                        />
                    </Form.Item>

                    <Form.Item
                        label="จำนวนครั้งที่ใช้ได้ (0 = ไม่จำกัด)"
                        name="usage_limit"
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="จำนวนครั้งที่ใช้ได้ต่อผู้ใช้"
                        name="usage_limit_per_user"
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="สถานะ"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: '1px solid #d9d9d9',
                                    background: 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: '8px 24px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                {submitting ? 'กำลังบันทึก...' : isEdit ? 'อัปเดต' : 'สร้าง'}
                            </button>
                        </div>
                    </Form.Item>
                </Form>
            </Spin>
        </div>
    );
}
