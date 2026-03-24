'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Radio, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { AppstoreOutlined, DeleteOutlined, DollarOutlined, ExclamationCircleOutlined, PercentageOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { pageStyles } from '../../../../../../theme/pos/discounts/style';
import { DiscountType, Discounts } from '../../../../../../types/api/pos/discounts';
import { useAuth } from '../../../../../../contexts/AuthContext';


const { TextArea } = Input;
const { Title, Text } = Typography;
type ManageMode = 'add' | 'edit';
type DiscountFormValues = { display_name: string; description?: string; discount_type: DiscountType; discount_amount: number; is_active?: boolean };
const normalizeDigits = (value: string) => value.replace(/\D/g, '');
const formatDate = (raw?: string | Date) => !raw ? '-' : Number.isNaN(new Date(raw).getTime()) ? '-' : new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(raw));

export default function DiscountManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<DiscountFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalDiscount, setOriginalDiscount] = useState<Discounts | null>(null);
    const [previewName, setPreviewName] = useState('');
    const [previewType, setPreviewType] = useState<DiscountType>(DiscountType.Fixed);
    const [previewAmount, setPreviewAmount] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const mode = params.mode?.[0] as ManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isEdit = mode === 'edit' && Boolean(id);
    const isValidMode = mode === 'add' || mode === 'edit';
    const { isAuthorized, isChecking } = useRoleGuard({ requiredPermission: { resourceKey: 'discounts.manager.feature', action: 'access' }, redirectUnauthorized: '/pos/discounts', unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการส่วนลด' });
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canOpenManager = can('discounts.manager.feature', 'access');
    const canCreate = can('discounts.page', 'create') && can('discounts.create.feature', 'create') && canOpenManager;
    const canEditMetadata = can('discounts.page', 'update') && can('discounts.edit.feature', 'update') && canOpenManager;
    const canEditPricing = can('discounts.page', 'update') && can('discounts.pricing.feature', 'update') && canOpenManager;
    const canUpdateStatus = can('discounts.page', 'update') && can('discounts.status.feature', 'update') && canOpenManager;
    const canDelete = can('discounts.page', 'delete') && can('discounts.delete.feature', 'delete') && canOpenManager;
    const canSubmitAdd = canCreate;
    const canSubmitEdit = canEditMetadata || canEditPricing || canUpdateStatus;

    const title = useMemo(() => (isEdit ? 'แก้ไขส่วนลด' : 'เพิ่มส่วนลด'), [isEdit]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/discounts');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => { void getCsrfTokenCached().then(setCsrfToken); }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (mode === 'add' && !canCreate) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มส่วนลด');
            router.replace('/pos/discounts');
            return;
        }
        if (mode === 'edit' && !canEditMetadata && !canEditPricing && !canUpdateStatus && !canDelete) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขส่วนลด');
            router.replace('/pos/discounts');
        }
    }, [canCreate, canDelete, canEditMetadata, canEditPricing, canUpdateStatus, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchDiscount = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/discounts/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลส่วนลดได้');
            const data = await response.json();
            form.setFieldsValue({ display_name: data.display_name, description: data.description, discount_type: data.discount_type, discount_amount: Number(data.discount_amount || 0), is_active: data.is_active });
            setPreviewName(data.display_name || '');
            setPreviewType(data.discount_type || DiscountType.Fixed);
            setPreviewAmount(Number(data.discount_amount || 0));
            setIsActive(Boolean(data.is_active));
            setOriginalDiscount(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลส่วนลดได้');
            router.replace('/pos/discounts');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) void fetchDiscount();
    }, [fetchDiscount, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!(isEdit ? canEditMetadata : canCreate)) return false;
        const value = rawValue.trim();
        if (!value) return false;
        if (isEdit && originalDiscount?.display_name?.toLowerCase() === value.toLowerCase()) return false;
        try {
            const response = await fetch(`/api/pos/discounts/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canCreate, canEditMetadata, id, isEdit, originalDiscount]);

    const handleSubmit = async (values: DiscountFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์แก้ไขส่วนลด' : 'คุณไม่มีสิทธิ์เพิ่มส่วนลด');
            return;
        }
        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<DiscountFormValues> = {};
            if (!isEdit) {
                payload.display_name = values.display_name.trim();
                payload.description = values.description?.trim() || undefined;
                payload.discount_type = values.discount_type;
                payload.discount_amount = Number(values.discount_amount || 0);
                payload.is_active = values.is_active;
            } else {
                if (canEditMetadata) {
                    payload.display_name = values.display_name.trim();
                    payload.description = values.description?.trim() || undefined;
                }
                if (canEditPricing) {
                    payload.discount_type = values.discount_type;
                    payload.discount_amount = Number(values.discount_amount || 0);
                }
                if (canUpdateStatus) {
                    payload.is_active = values.is_active;
                }
            }
            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }
            const response = await fetch(isEdit ? `/api/pos/discounts/update/${id}` : '/api/pos/discounts/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกส่วนลดได้');
            }
            message.success(isEdit ? 'อัปเดตส่วนลดสำเร็จ' : 'สร้างส่วนลดสำเร็จ');
            router.replace('/pos/discounts');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกส่วนลดได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDelete) return;
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด ${previewName || '-'} หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ef4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/discounts/delete/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': token } });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบส่วนลดได้');
                    }
                    message.success('ลบส่วนลดสำเร็จ');
                    router.replace('/pos/discounts');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบส่วนลดได้');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (isEdit ? (!canEditMetadata && !canEditPricing && !canUpdateStatus && !canDelete) : !canCreate) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;

    return (
        <div style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader title={title} onBack={() => router.replace('/pos/discounts')} actions={isEdit && canDelete ? <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>ลบ</Button> : null} />
            <PageContainer maxWidth={1040}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                        
                        {isEdit && !canSubmitEdit ? <Alert type="warning" showIcon message="หน้า edit นี้เปิดได้เฉพาะบาง action" description={canDelete ? 'บัญชีนี้ลบส่วนลดได้ แต่ไม่สามารถแก้ข้อมูลหรือกติกาส่วนลดได้' : 'บัญชีนี้ไม่มี field สำหรับบันทึกในหน้านี้'} /> : null}
                    </div>
                    {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spin size="large" /></div> : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#d97706' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลส่วนลด</Title>
                                    </div>
                                    <Form<DiscountFormValues> form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ discount_type: DiscountType.Fixed, discount_amount: 0, is_active: true }} onValuesChange={(changed) => {
                                        if (changed.display_name !== undefined) setPreviewName(changed.display_name);
                                        if (changed.discount_type !== undefined) setPreviewType(changed.discount_type);
                                        if (changed.discount_amount !== undefined) setPreviewAmount(Number(changed.discount_amount || 0));
                                        if (changed.is_active !== undefined) setIsActive(Boolean(changed.is_active));
                                    }}>
                                        <Form.Item name="display_name" label={<span style={{ fontWeight: 600 }}>ชื่อส่วนลด</span>} validateTrigger={['onBlur', 'onSubmit']} rules={[{ required: true, message: 'กรุณากรอกชื่อส่วนลด' }, { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }, { validator: async (_, value: string) => { if (!value?.trim()) return; if (await checkNameConflict(value)) throw new Error('ชื่อนี้ถูกใช้งานแล้ว'); } }]}>
                                            <Input size="large" maxLength={100} placeholder="ส่วนลดสมาชิก, โปรวันเกิด..." disabled={isEdit ? !canEditMetadata : !canCreate} />
                                        </Form.Item>
                                        <Form.Item name="description" label={<span style={{ fontWeight: 600 }}>รายละเอียด</span>}>
                                            <TextArea rows={3} maxLength={500} placeholder="เงื่อนไขหรือคำอธิบายเพิ่มเติม" disabled={isEdit ? !canEditMetadata : !canCreate} />
                                        </Form.Item>
                                        <Form.Item name="discount_type" label={<span style={{ fontWeight: 600 }}>ประเภทส่วนลด</span>}>
                                            <Radio.Group optionType="button" buttonStyle="solid" disabled={isEdit ? !canEditPricing : !canCreate}>
                                                <Radio.Button value={DiscountType.Fixed}>ลดเป็นบาท</Radio.Button>
                                                <Radio.Button value={DiscountType.Percentage}>ลดเปอร์เซ็นต์</Radio.Button>
                                            </Radio.Group>
                                        </Form.Item>
                                        <Form.Item name="discount_amount" label={<span style={{ fontWeight: 600 }}>{previewType === DiscountType.Fixed ? 'มูลค่าส่วนลด (บาท)' : 'มูลค่าส่วนลด (%)'}</span>} rules={[{ required: true, message: 'กรุณากรอกมูลค่าส่วนลด' }, { validator: async (_, value: unknown) => { if (value === undefined || value === null || value === '') return; const num = Number(value); if (Number.isNaN(num) || num < 0) throw new Error('มูลค่าต้องไม่ติดลบ'); if (previewType === DiscountType.Percentage && num > 100) throw new Error('เปอร์เซ็นต์ต้องไม่เกิน 100'); } }]}>
                                            <Input size="large" inputMode="numeric" placeholder="0" style={{ width: '100%', borderRadius: 12, height: 46 }} disabled={isEdit ? !canEditPricing : !canCreate} onChange={(e) => { const normalized = normalizeDigits(e.target.value); form.setFieldValue('discount_amount', normalized); setPreviewAmount(Number(normalized || 0)); }} />
                                        </Form.Item>
                                        <div style={{ padding: 16, background: '#f8fafc', borderRadius: 14, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <Text strong>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>เปิดเพื่อให้เลือกใช้ในหน้า POS</Text>
                                                </div>
                                                <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                    <Switch checked={isActive} disabled={isEdit ? !canUpdateStatus : !canCreate} />
                                                </Form.Item>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/discounts')} style={{ flex: 1 }}>ยกเลิก</Button>
                                            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !canSubmitEdit : !canSubmitAdd} style={{ flex: 2 }}>บันทึกข้อมูล</Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>
                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>
                                    <Card style={{ borderRadius: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                            {previewType === DiscountType.Fixed ? <DollarOutlined style={{ color: '#2563eb' }} /> : <PercentageOutlined style={{ color: '#7c3aed' }} />}
                                            <Text strong>ตัวอย่างการแสดงผล</Text>
                                        </div>
                                        <Title level={4} style={{ marginBottom: 8 }}>{previewName || 'ชื่อส่วนลด'}</Title>
                                        <Text style={{ display: 'block', marginBottom: 12, color: '#d97706', fontWeight: 600 }}>{previewType === DiscountType.Percentage ? `${previewAmount}%` : `${previewAmount.toLocaleString('th-TH')} บาท`}</Text>
                                        <Alert type={isActive ? 'success' : 'warning'} showIcon message={isActive ? 'ส่วนลดนี้พร้อมใช้งาน' : 'ส่วนลดนี้ถูกปิดใช้งาน'} />
                                    </Card>
                                    {isEdit ? <Card style={{ borderRadius: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><ExclamationCircleOutlined style={{ color: '#0369a1' }} /><Text strong>รายละเอียด</Text></div><Text type="secondary" style={{ display: 'block' }}>สร้างเมื่อ: {formatDate(originalDiscount?.create_date)}</Text></Card> : null}
                                    
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}
