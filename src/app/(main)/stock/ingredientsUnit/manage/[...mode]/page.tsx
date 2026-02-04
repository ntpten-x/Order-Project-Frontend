'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Form, Input, message, Modal, Spin, Switch } from 'antd';
import { useRouter } from 'next/navigation';
import {
    ManagePageStyles,
    pageStyles,
    ActionButtons
} from './style';

import { authService } from '../../../../../../services/auth.service';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";

export default function IngredientsUnitManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [csrfToken, setCsrfToken] = useState<string>("");

    const mode = params.mode[0];
    const id = params.mode[1] || null;
    const isEdit = mode === 'edit' && !!id;

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchIngredientsUnit = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/stock/ingredientsUnit/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
            const data = await response.json();
            form.setFieldsValue({
                unit_name: data.unit_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
            router.push('/stock/ingredientsUnit');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchIngredientsUnit();
        }
    }, [isEdit, id, fetchIngredientsUnit]);

    const onFinish = async (values: unknown) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/stock/ingredientsUnit/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตหน่วยวัตถุดิบได้');
                }
                
                message.success('อัปเดตหน่วยวัตถุดิบสำเร็จ');
            } else {
                const response = await fetch(`/api/stock/ingredientsUnit/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างหน่วยวัตถุดิบได้');
                }
                
                message.success('สร้างหน่วยวัตถุดิบสำเร็จ');
            }
            router.push('/stock/ingredientsUnit');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตหน่วยวัตถุดิบได้' : 'ไม่สามารถสร้างหน่วยวัตถุดิบได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยวัตถุดิบ',
            content: `คุณต้องการลบหน่วยวัตถุดิบ "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/stock/ingredientsUnit/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหน่วยวัตถุดิบได้');
                    message.success('ลบหน่วยวัตถุดิบสำเร็จ');
                    router.push('/stock/ingredientsUnit');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบหน่วยวัตถุดิบได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/stock/ingredientsUnit');

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            
            <UIPageHeader
                title={isEdit ? "แก้ไขหน่วยวัตถุดิบ" : "เพิ่มหน่วยวัตถุดิบ"}
                subtitle="หน่วยสำหรับวัตถุดิบในคลัง"
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete}>
                            ลบ
                        </Button>
                    ) : undefined
                }
            />

            <PageContainer maxWidth={900}>
                <div className="manage-form-card">
                    <PageSection>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
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
                                onValuesChange={(changedValues: Record<string, unknown>) => {
                                    if (typeof changedValues.display_name === 'string') {
                                        setDisplayName(changedValues.display_name);
                                    }
                                }}
                            >
                        <Form.Item
                            name="unit_name"
                            label="ชื่อหน่วย (ภาษาอังกฤษ) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อหน่วย' },
                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น kg, g, l, ml" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="display_name"
                            label="ชื่อที่แสดง (ภาษาไทย) *"
                            rules={[
                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }
                            ]}
                        >
                            <Input 
                                size="large" 
                                placeholder="เช่น กิโลกรัม, กรัม, ลิตร, มิลลิลิตร" 
                                maxLength={50}
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_active"
                            label="สถานะการใช้งาน"
                            valuePropName="checked"
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
                    </PageSection>
                </div>
            </PageContainer>
        </div>
    );
}
