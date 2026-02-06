'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    TagsOutlined,
    CheckCircleFilled,
    AppstoreOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/category/style';
import { Category } from '../../../../../../types/api/pos/category';

const { Title, Text } = Typography;

type CategoryManageMode = 'add' | 'edit';

type CategoryFormValues = {
    category_name: string;
    display_name: string;
    is_active?: boolean;
};

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const CategoryPreviewCard = ({ displayName, categoryName, isActive }: { displayName: string, categoryName: string, isActive: boolean }) => (
    <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9',
    }}>
        <Title level={5} style={{ color: '#0f766e', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

        <div style={{
            borderRadius: 16,
            border: `1px solid ${isActive ? '#bae6fd' : '#e2e8f0'}`,
            padding: 14,
            background: isActive ? '#f0fdfa' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
        }}>
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: isActive
                    ? 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)'
                    : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <TagsOutlined style={{
                    fontSize: 20,
                    color: isActive ? '#0f766e' : '#64748b'
                }} />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                        {displayName || 'ชื่อหมวดหมู่'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {categoryName || 'category_name'}
                </Text>
            </div>
        </div>

        <Alert
            type={isActive ? 'success' : 'warning'}
            showIcon
            message={isActive ? 'หมวดหมู่นี้พร้อมใช้งานในหน้า POS' : 'หมวดหมู่นี้จะไม่แสดงในหน้า POS'}
        />
    </div>
);

export default function CategoryManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<CategoryFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [categoryName, setCategoryName] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalCategory, setOriginalCategory] = useState<Category | null>(null);

    const mode = params.mode?.[0] as CategoryManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ['Admin', 'Manager'] });

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขหมวดหมู่';
        return 'เพิ่มหมวดหมู่';
    }, [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/category');
        }
    }, [isValidMode, mode, id, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchCategory = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/category/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            const data = await response.json();
            form.setFieldsValue({
                category_name: data.category_name,
                display_name: data.display_name,
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setCategoryName(data.category_name || '');
            setIsActive(data.is_active);
            setOriginalCategory(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            router.replace('/pos/category');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchCategory();
        }
    }, [isEdit, fetchCategory]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && originalCategory?.category_name?.toLowerCase() === value.toLowerCase()) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/category/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [id, isEdit, originalCategory]);

    const onFinish = async (values: CategoryFormValues) => {
        setSubmitting(true);
        try {
            const payload: CategoryFormValues = {
                category_name: values.category_name.trim(),
                display_name: values.display_name.trim(),
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/category/update/${id}` : '/api/pos/category/create';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตหมวดหมู่ได้' : 'ไม่สามารถสร้างหมวดหมู่ได้'));
            }

            message.success(isEdit ? 'อัปเดตหมวดหมู่สำเร็จ' : 'สร้างหมวดหมู่สำเร็จ');
            router.push('/pos/category');
        } catch (error: unknown) {
            console.error(error);
            message.error((error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ "${displayName || originalCategory?.display_name || '-'}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/pos/category/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                    message.success('ลบหมวดหมู่สำเร็จ');
                    router.push('/pos/category');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบหมวดหมู่ได้');
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
            <UIPageHeader
                title={modeTitle}
                subtitle={isEdit ? 'ปรับแก้ชื่อหมวดหมู่และสถานะการใช้งาน' : 'สร้างหมวดหมู่ใหม่ให้พร้อมใช้งานในระบบ POS'}
                onBack={handleBack}
                actions={
                    isEdit ? (
                        <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>
                            ลบ
                        </Button>
                    ) : null
                }
            />

            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '90px 0' }}>
                            <Spin size="large" tip="กำลังโหลดข้อมูล..." />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 20,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                        overflow: 'hidden'
                                    }}
                                    styles={{ body: { padding: 24 } }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#0f766e' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลหมวดหมู่</Title>
                                    </div>

                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{ is_active: true }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                            if (changedValues.category_name !== undefined) setCategoryName(changedValues.category_name);
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                        }}
                                    >
                                        <Form.Item
                                            name="category_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อระบบ (category_name)</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อระบบ' },
                                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรอกได้เฉพาะภาษาอังกฤษ ตัวเลข และ - _ ( ) .' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        const duplicated = await checkNameConflict(value);
                                                        if (duplicated) throw new Error('ชื่อระบบนี้ถูกใช้งานแล้ว');
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="เช่น beverage, main-course"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อที่แสดง</span>}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อที่แสดง' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="เช่น เครื่องดื่ม, อาหารจานหลัก"
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงในหน้าขายสินค้า POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch style={{ background: isActive ? '#10B981' : undefined }} />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        <Alert
                                            showIcon
                                            type="info"
                                            icon={<InfoCircleOutlined />}
                                            message="ข้อมูลที่จำเป็น"
                                            description="ต้องกรอกชื่อระบบและชื่อที่แสดง โดยชื่อระบบจะถูกตรวจสอบไม่ให้ซ้ำในสาขาเดียวกัน"
                                            style={{ marginBottom: 24 }}
                                        />

                                        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                            <Button
                                                size="large"
                                                onClick={handleBack}
                                                style={{ flex: 1, borderRadius: 12, height: 46, fontWeight: 600 }}
                                            >
                                                ยกเลิก
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={submitting}
                                                icon={<SaveOutlined />}
                                                style={{
                                                    flex: 2,
                                                    borderRadius: 12,
                                                    height: 46,
                                                    fontWeight: 600,
                                                    background: '#0f766e',
                                                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
                                                }}
                                            >
                                                บันทึกข้อมูล
                                            </Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <CategoryPreviewCard
                                        displayName={displayName}
                                        categoryName={categoryName}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">ID: {originalCategory?.id || '-'}</Text>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalCategory?.create_date)}</Text>
                                                <Text type="secondary">อัปเดตเมื่อ: {formatDate(originalCategory?.update_date)}</Text>
                                            </div>
                                        </Card>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
