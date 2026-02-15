'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Form, Input, message, Modal, Select, Spin, Switch } from 'antd';
import { useRouter } from 'next/navigation';
import { IngredientsUnit } from '../../../../../../types/api/stock/ingredientsUnit';
import {
    ManagePageStyles,
    pageStyles,
    ImagePreview,
    ActionButtons
} from './style';

const { TextArea } = Input;

import { authService } from '../../../../../../services/auth.service';
import PageContainer from "../../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../../components/ui/page/PageHeader";

export default function IngredientsManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [imageUrl, setImageUrl] = useState<string>('');
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

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/stock/ingredientsUnit/getAll?active=true');
            if (response.ok) {
                const data = await response.json();
                setUnits(data);
            }
        } catch (error) {
            console.error("Failed to fetch units", error);
        }
    };

    const fetchIngredient = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/stock/ingredients/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
            const data = await response.json();
            form.setFieldsValue({
                ingredient_name: data.ingredient_name,
                display_name: data.display_name,
                description: data.description,
                img_url: data.img_url,
                unit_id: data.unit_id,
                is_active: data.is_active,
            });
            setImageUrl(data.img_url || '');
            setDisplayName(data.display_name || '');
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลวัตถุดิบได้');
            router.push('/stock/ingredients');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        fetchUnits();
        if (isEdit) {
            fetchIngredient();
        }
    }, [isEdit, id, fetchIngredient]);

    const onFinish = async (values: Record<string, unknown>) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                const response = await fetch(`/api/stock/ingredients/update/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตวัตถุดิบได้');
                }
                
                message.success('อัปเดตวัตถุดิบสำเร็จ');
            } else {
                const response = await fetch(`/api/stock/ingredients/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify(values),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถสร้างวัตถุดิบได้');
                }
                
                message.success('สร้างวัตถุดิบสำเร็จ');
            }
            router.push('/stock/ingredients');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'ไม่สามารถอัปเดตวัตถุดิบได้' : 'ไม่สามารถสร้างวัตถุดิบได้'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบวัตถุดิบ',
            content: `คุณต้องการลบวัตถุดิบ "${displayName}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/stock/ingredients/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบวัตถุดิบได้');
                    message.success('ลบวัตถุดิบสำเร็จ');
                    router.push('/stock/ingredients');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบวัตถุดิบได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/stock/ingredients');

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            
            <UIPageHeader
                title={isEdit ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"}
                subtitle="ข้อมูลวัตถุดิบในคลัง"
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
                                    if (typeof changedValues.img_url === "string") {
                                        setImageUrl(changedValues.img_url);
                                    }
                                    if (typeof changedValues.display_name === "string") {
                                        setDisplayName(changedValues.display_name);
                                    }
                                }}
                            >
                                <Form.Item
                                    name="ingredient_name"
                                    label="ชื่อวัตถุดิบ (ภาษาอังกฤษ) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกชื่อวัตถุดิบ' },
                                        { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรุณากรอกภาษาอังกฤษเท่านั้น' },
                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="เช่น Sugar, Salt, Flour"
                                        maxLength={100}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="display_name"
                                    label="ชื่อที่แสดง (ภาษาไทย) *"
                                    rules={[
                                        { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                        { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="เช่น น้ำตาล, เกลือ, แป้ง"
                                        maxLength={100}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="unit_id"
                                    label="หน่วยวัตถุดิบ *"
                                    rules={[{ required: true, message: 'กรุณาเลือกหน่วยวัตถุดิบ' }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="เลือกหน่วย"
                                        showSearch
                                        dropdownMatchSelectWidth
                                        getPopupContainer={(trigger) => trigger?.parentElement || document.body}
                                        optionFilterProp="children"
                                    >
                                        {units.map((unit) => (
                                            <Select.Option key={unit.id} value={unit.id}>
                                                {unit.display_name} ({unit.unit_name})
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item name="img_url" label="รูปภาพ URL">
                                    <Input size="large" placeholder="https://example.com/image.jpg หรือ data:image/...;base64,..." />
                                </Form.Item>

                                <ImagePreview url={imageUrl} name={displayName} />

                                <Form.Item name="description" label="รายละเอียด" style={{ marginTop: 20 }}>
                                    <TextArea
                                        rows={4}
                                        placeholder="รายละเอียดเพิ่มเติม..."
                                        style={{ borderRadius: 12 }}
                                    />
                                </Form.Item>

                                <Form.Item name="is_active" label="สถานะการใช้งาน" valuePropName="checked">
                                    <Switch checkedChildren="ใช้งาน" unCheckedChildren="ไม่ใช้งาน" />
                                </Form.Item>

                                <ActionButtons isEdit={isEdit} loading={submitting} onCancel={handleBack} />
                            </Form>
                        )}
                    </PageSection>
                </div>
            </PageContainer>
        </div>
    );
}
