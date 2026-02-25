'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Button, Form, Input, InputNumber, message, Modal, Radio, Spin, Switch, Card, Row, Col, Typography, Alert } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    AppstoreOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined,
    PercentageOutlined,
    DollarOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { DiscountType, Discounts } from '../../../../../../types/api/pos/discounts';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/discounts/style';
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";

const { TextArea } = Input;
const { Title, Text } = Typography;

type DiscountManageMode = 'add' | 'edit';

type DiscountFormValues = {
    discount_name: string;
    display_name: string;
    description?: string;
    discount_type: DiscountType;
    discount_amount: number;
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

const formatDiscountAmount = (type: DiscountType, amount: number) => {
    const normalized = Number(amount || 0);
    return type === DiscountType.Percentage
        ? `${normalized}%`
        : `${normalized.toLocaleString('th-TH')} บาท`;
};

const DiscountPreviewCard = ({
    displayName,
    discountName,
    discountType,
    discountAmount,
    isActive
}: {
    displayName: string;
    discountName: string;
    discountType: DiscountType;
    discountAmount: number;
    isActive: boolean;
}) => {
    const isFixed = discountType === DiscountType.Fixed;

    return (
        <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #F1F5F9',
        }}>
            <Title level={5} style={{ color: '#D97706', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

            <div style={{
                borderRadius: 16,
                border: `1px solid ${isActive ? '#fed7aa' : '#e2e8f0'}`,
                padding: 14,
                background: isActive ? '#fff7ed' : '#f8fafc',
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
                        ? isFixed
                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                            : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                        : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {isFixed ? (
                        <DollarOutlined style={{ fontSize: 20, color: isActive ? '#0369a1' : '#64748b' }} />
                    ) : (
                        <PercentageOutlined style={{ fontSize: 20, color: isActive ? '#7e22ce' : '#64748b' }} />
                    )}
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {displayName || 'ชื่อส่วนลด'}
                        </Text>
                        {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                    </div>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                        {discountName || 'Discount name'}
                    </Text>
                    <Text style={{ fontSize: 13, display: 'block', color: '#D97706', fontWeight: 600 }}>
                        {formatDiscountAmount(discountType, discountAmount)}
                    </Text>
                </div>
            </div>

            <Alert
                type={isActive ? 'success' : 'warning'}
                showIcon
                message={isActive ? 'ส่วนลดนี้พร้อมใช้งานในหน้า POS' : 'ส่วนลดนี้จะไม่สามารถเลือกใช้งานได้'}
            />
        </div>
    );
};

export default function DiscountManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<DiscountFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [discountName, setDiscountName] = useState<string>('');
    const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.Fixed);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalDiscount, setOriginalDiscount] = useState<Discounts | null>(null);
    const [currentDiscountName, setCurrentDiscountName] = useState<string>('');

    const mode = params.mode?.[0] as DiscountManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateDiscounts = can("discounts.page", "create");
    const canUpdateDiscounts = can("discounts.page", "update");
    const canDeleteDiscounts = can("discounts.page", "delete");
    const canSubmit = isEdit ? canUpdateDiscounts : canCreateDiscounts;

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขส่วนลด';
        return 'เพิ่มส่วนลด';
    }, [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/discounts');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchDiscount = useCallback(async () => {
        if (!id) return;
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
                discount_amount: Number(data.discount_amount ?? 0),
                is_active: data.is_active,
            });
            setDisplayName(data.display_name || '');
            setDiscountName(data.discount_name || '');
            setDiscountType(data.discount_type || DiscountType.Fixed);
            setDiscountAmount(Number(data.discount_amount ?? 0));
            setIsActive(Boolean(data.is_active));
            setCurrentDiscountName((data.discount_name || '').toLowerCase());
            setOriginalDiscount(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลส่วนลดได้');
            router.replace('/pos/discounts');
        } finally {
            setLoading(false);
        }
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchDiscount();
        }
    }, [isEdit, fetchDiscount]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && value.toLowerCase() === currentDiscountName) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/discounts/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [currentDiscountName, id, isEdit]);

    const onFinish = async (values: DiscountFormValues) => {
        if (!canSubmit) {
            message.error(isEdit ? "คุณไม่มีสิทธิ์แก้ไขส่วนลด" : "คุณไม่มีสิทธิ์เพิ่มส่วนลด");
            return;
        }
        setSubmitting(true);
        try {
            const payload: DiscountFormValues = {
                discount_name: values.discount_name.trim(),
                display_name: values.display_name.trim(),
                description: values.description?.trim() || undefined,
                discount_type: values.discount_type,
                discount_amount: Number(values.discount_amount || 0),
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/discounts/update/${id}` : '/api/pos/discounts/create';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตส่วนลดได้' : 'ไม่สามารถสร้างส่วนลดได้'));
            }

            message.success(isEdit ? 'อัปเดตส่วนลดสำเร็จ' : 'สร้างส่วนลดสำเร็จ');
            router.push('/pos/discounts');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        if (!canDeleteDiscounts) {
            message.error("คุณไม่มีสิทธิ์ลบส่วนลด");
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด ${displayName || '-'} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
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

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    if (!canSubmit) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader
                title={modeTitle}
                onBack={handleBack}
                actions={
                    isEdit && canDeleteDiscounts ? (
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#D97706' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลส่วนลด</Title>
                                    </div>

                                    <Form<DiscountFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{
                                            is_active: true,
                                            discount_type: DiscountType.Fixed,
                                            discount_amount: 0,
                                        }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.display_name !== undefined) setDisplayName(changedValues.display_name);
                                            if (changedValues.discount_name !== undefined) setDiscountName(changedValues.discount_name);
                                            if (changedValues.discount_type !== undefined) setDiscountType(changedValues.discount_type);
                                            if (changedValues.discount_amount !== undefined) setDiscountAmount(Number(changedValues.discount_amount || 0));
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                        }}
                                    >
                                        <Form.Item
                                            name="discount_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>รหัสส่วนลด</span>}
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกรหัสส่วนลด' },
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
                                                placeholder="NEWYEAR, VIPMEMBER, ..."
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="display_name"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อส่วนลด</span>}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อส่วนลด' },
                                                { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="ส่วนลดปีใหม่, ส่วนลดสมาชิก, ..."
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={100}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="description"
                                            label={<span style={{ fontWeight: 600, color: '#334155' }}>รายละเอียด/เงื่อนไข</span>}
                                            rules={[{ max: 500, message: 'ความยาวต้องไม่เกิน 500 ตัวอักษร' }]}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="เช่น ใช้ได้เฉพาะบิลขั้นต่ำ 200 บาท"
                                                maxLength={500}
                                                style={{ borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                            />
                                        </Form.Item>

                                        <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 14, marginTop: 16, marginBottom: 18, border: '1px solid #E2E8F0' }}>
                                            <Form.Item
                                                name="discount_type"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>ประเภทส่วนลด</span>}
                                                rules={[{ required: true, message: 'กรุณาเลือกประเภทส่วนลด' }]}
                                                style={{ marginBottom: 14 }}
                                            >
                                                <Radio.Group optionType="button" buttonStyle="solid" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    <Radio.Button value={DiscountType.Fixed} style={{ textAlign: 'center', borderRadius: 10 }}>
                                                        ลดเป็นบาท (THB)
                                                    </Radio.Button>
                                                    <Radio.Button value={DiscountType.Percentage} style={{ textAlign: 'center', borderRadius: 10 }}>
                                                        ลดเปอร์เซ็นต์ (%)
                                                    </Radio.Button>
                                                </Radio.Group>
                                            </Form.Item>

                                            <Form.Item
                                                name="discount_amount"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>{discountType === DiscountType.Fixed ? 'มูลค่าส่วนลด (บาท)' : 'มูลค่าส่วนลด (%)'}</span>}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกมูลค่าส่วนลด' },
                                                    {
                                                        validator: async (_, value: number) => {
                                                            if (value === undefined || value === null) return;
                                                            if (value < 0) throw new Error('มูลค่าต้องไม่ติดลบ');
                                                            if (discountType === DiscountType.Percentage && value > 100) {
                                                                throw new Error('เปอร์เซ็นต์ต้องไม่เกิน 100');
                                                            }
                                                        }
                                                    }
                                                ]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <InputNumber<number>
                                                    size="large"
                                                    min={0}
                                                    max={discountType === DiscountType.Percentage ? 100 : undefined}
                                                    precision={2}
                                                    placeholder={discountType === DiscountType.Fixed ? 'เช่น 50.00' : 'เช่น 10'}
                                                    style={{ width: '100%' }}
                                                    controls={false}
                                                    formatter={(value) => `${value}`.replace(/[^0-9.]/g, "")}
                                                    parser={(value) => value?.replace(/[^0-9.]/g, "") as unknown as number}
                                                    onKeyDown={(e) => {
                                                        // Allow: backspace, delete, tab, escape, enter
                                                        if (
                                                            [8, 46, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                                            (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
                                                            // Allow: home, end, left, right
                                                            (e.keyCode >= 35 && e.keyCode <= 39)
                                                        ) {
                                                            return;
                                                        }
                                                        // Ensure that it is a number and stop the keypress
                                                        if (
                                                            (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                                                            (e.keyCode < 96 || e.keyCode > 105)
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                        </div>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้เลือกใช้ส่วนลดได้ในหน้า POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch style={{ background: isActive ? '#10B981' : undefined }} />
                                                </Form.Item>
                                            </div>
                                        </div>
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
                                                    background: '#D97706',
                                                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
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
                                    <DiscountPreviewCard
                                        displayName={displayName}
                                        discountName={discountName}
                                        discountType={discountType}
                                        discountAmount={discountAmount}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalDiscount?.create_date)}</Text>
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
