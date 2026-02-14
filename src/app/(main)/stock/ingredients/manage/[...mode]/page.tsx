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
            if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
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
            message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธเนเธญเธกเธนเธฅเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
                }
                
                message.success('เธญเธฑเธเน€เธ”เธ•เธงเธฑเธ•เธ–เธธเธ”เธดเธเธชเธณเน€เธฃเนเธ');
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
                    throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
                }
                
                message.success('เธชเธฃเนเธฒเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเธชเธณเน€เธฃเนเธ');
            }
            router.push('/stock/ingredients');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as { message: string }).message || (isEdit ? 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธญเธฑเธเน€เธ”เธ•เธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน' : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธงเธฑเธ•เธ–เธธเธ”เธดเธ',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธงเธฑเธ•เธ–เธธเธ”เธดเธ "${displayName}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/stock/ingredients/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
                    message.success('เธฅเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเธชเธณเน€เธฃเนเธ');
                    router.push('/stock/ingredients');
                } catch (error) {
                    console.error(error);
                    message.error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธ”เน');
                }
            }
        });
    };

    const handleBack = () => router.push('/stock/ingredients');

    return (
        <div className="manage-page" style={pageStyles.container}>
            <ManagePageStyles />
            
            <UIPageHeader
                title={isEdit ? "เนเธเนเนเธเธงเธฑเธ•เธ–เธธเธ”เธดเธ" : "เน€เธเธดเนเธกเธงเธฑเธ•เธ–เธธเธ”เธดเธ"}
                subtitle="เธเนเธญเธกเธนเธฅเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธเธเธฅเธฑเธ"
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete}>
                            เธฅเธ
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
                                    label="เธเธทเนเธญเธงเธฑเธ•เธ–เธธเธ”เธดเธ (เธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉ) *"
                                    rules={[
                                        { required: true, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญเธงเธฑเธ•เธ–เธธเธ”เธดเธ' },
                                        { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธ เธฒเธฉเธฒเธญเธฑเธเธเธคเธฉเน€เธ—เนเธฒเธเธฑเนเธ' },
                                        { max: 100, message: 'เธเธงเธฒเธกเธขเธฒเธงเธ•เนเธญเธเนเธกเนเน€เธเธดเธ 100 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="เน€เธเนเธ Sugar, Salt, Flour"
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
                                        placeholder="เน€เธเนเธ เธเนเธณเธ•เธฒเธฅ, เน€เธเธฅเธทเธญ, เนเธเนเธ"
                                        maxLength={100}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="unit_id"
                                    label="เธซเธเนเธงเธขเธงเธฑเธ•เธ–เธธเธ”เธดเธ *"
                                    rules={[{ required: true, message: 'เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธซเธเนเธงเธขเธงเธฑเธ•เธ–เธธเธ”เธดเธ' }]}
                                >
                                    <Select
                                        size="large"
                                        placeholder="เน€เธฅเธทเธญเธเธซเธเนเธงเธข"
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

                                <Form.Item name="img_url" label="เธฃเธนเธเธ เธฒเธ URL">
                                    <Input size="large" placeholder="https://example.com/image.jpg หรือ data:image/...;base64,..." />
                                </Form.Item>

                                <ImagePreview url={imageUrl} name={displayName} />

                                <Form.Item name="description" label="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”" style={{ marginTop: 20 }}>
                                    <TextArea
                                        rows={4}
                                        placeholder="เธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ”เน€เธเธดเนเธกเน€เธ•เธดเธก..."
                                        style={{ borderRadius: 12 }}
                                    />
                                </Form.Item>

                                <Form.Item name="is_active" label="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ" valuePropName="checked">
                                    <Switch checkedChildren="เนเธเนเธเธฒเธ" unCheckedChildren="เนเธกเนเนเธเนเธเธฒเธ" />
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

