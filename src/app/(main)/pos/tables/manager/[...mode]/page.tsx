'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, Spin, Switch, Tag, Typography, message } from 'antd';
import { AppstoreOutlined, CheckCircleFilled, CheckCircleOutlined, DeleteOutlined, DownOutlined, ExclamationCircleOutlined, QrcodeOutlined, SaveOutlined, TableOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/tables/style';
import { Tables, TableStatus } from '../../../../../../types/api/pos/tables';
import type { TableQrInfo } from '../../../../../../types/api/pos/tables';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { DynamicQRCode } from '../../../../../../lib/dynamic-imports';


type TablesManageMode = 'add' | 'edit';
type TableFormValues = { table_name: string; status: TableStatus; is_active?: boolean };

const { Title, Text } = Typography;

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const getStatusLabel = (status: TableStatus) => (status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง');

function TablePreviewCard({ tableName, status, isActive }: { tableName: string; status: TableStatus; isActive: boolean }) {
    const isAvailable = status === TableStatus.Available;
    return (
        <Card style={{ borderRadius: 16 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text strong style={{ color: '#7C3AED' }}>ตัวอย่างการแสดงผล</Text>
                <div style={{ borderRadius: 16, border: `1px solid ${isActive ? '#ddd6fe' : '#e2e8f0'}`, padding: 14, background: isActive ? '#f5f3ff' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: isActive ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TableOutlined style={{ fontSize: 20, color: isActive ? '#7C3AED' : '#64748b' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <Space size={8}>
                            <Text strong>{tableName || 'ชื่อโต๊ะ'}</Text>
                            {isActive ? <CheckCircleFilled style={{ color: '#10B981' }} /> : null}
                        </Space>
                        <div><Tag color={isAvailable ? 'green' : 'orange'}>{getStatusLabel(status)}</Tag></div>
                    </div>
                </div>
                <Alert type={isActive ? 'success' : 'warning'} showIcon message={isActive ? 'โต๊ะนี้พร้อมใช้งานในระบบ POS' : 'โต๊ะนี้จะไม่แสดงให้เลือกใช้งาน'} />
            </Space>
        </Card>
    );
}

export default function TablesManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<TableFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tableName, setTableName] = useState('');
    const [status, setStatus] = useState<TableStatus>(TableStatus.Available);
    const [isActive, setIsActive] = useState(true);
    const [csrfToken, setCsrfToken] = useState('');
    const [originalTable, setOriginalTable] = useState<Tables | null>(null);
    const [currentTableName, setCurrentTableName] = useState('');
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [qrInfo, setQrInfo] = useState<TableQrInfo | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const mode = params.mode?.[0] as TablesManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking, user } = useRoleGuard({ unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการโต๊ะ' });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canOpenTablesManager = can('tables.manager.feature', 'access');
    const canCreateTables = can('tables.page', 'create') && can('tables.create.feature', 'create') && canOpenTablesManager;
    const canEditTableDetails = can('tables.page', 'update') && can('tables.edit.feature', 'update') && canOpenTablesManager;
    const canUpdateTableStatus = can('tables.page', 'update') && can('tables.status.feature', 'update') && canOpenTablesManager;
    const canDeleteTables = can('tables.page', 'delete') && can('tables.delete.feature', 'delete') && canOpenTablesManager;
    const canPreviewTableQr = can('qr_code.preview.feature', 'view');
    const canSubmitAdd = canCreateTables;
    const canSubmitEdit = canEditTableDetails || canUpdateTableStatus;



    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/tables');
        }
    }, [id, isValidMode, mode, router]);

    useEffect(() => { void getCsrfTokenCached().then(setCsrfToken); }, []);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        if (!canOpenTablesManager || (mode === 'add' && !canCreateTables) || (mode === 'edit' && !canEditTableDetails && !canUpdateTableStatus && !canDeleteTables)) {
            router.replace('/pos/tables');
        }
    }, [canCreateTables, canDeleteTables, canEditTableDetails, canOpenTablesManager, canUpdateTableStatus, isAuthorized, isChecking, mode, permissionLoading, router]);

    const fetchTable = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/tables/getById/${id}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            const data = await response.json();
            form.setFieldsValue({ table_name: data.table_name, status: data.status, is_active: data.is_active });
            setTableName(data.table_name || '');
            setStatus(data.status || TableStatus.Available);
            setIsActive(Boolean(data.is_active));
            setCurrentTableName((data.table_name || '').toLowerCase());
            setOriginalTable(data);
        } catch (error) {
            console.error(error);
            message.error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            router.replace('/pos/tables');
        } finally {
            setLoading(false);
        }
    }, [form, id, router]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading) void fetchTable();
    }, [fetchTable, isAuthorized, isEdit, permissionLoading]);

    const fetchQrInfo = useCallback(async () => {
        if (!id || !canPreviewTableQr) return;
        setQrLoading(true);
        try {
            const response = await fetch(`/api/pos/tables/${id}/qr`, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load table QR');
            setQrInfo(await response.json());
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load table QR');
        } finally {
            setQrLoading(false);
        }
    }, [canPreviewTableQr, id]);

    useEffect(() => {
        if (isEdit && isAuthorized && !permissionLoading && canPreviewTableQr) void fetchQrInfo();
    }, [canPreviewTableQr, fetchQrInfo, isAuthorized, isEdit, permissionLoading]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        if (!(canCreateTables || canEditTableDetails)) return false;
        const value = rawValue.trim();
        if (!value || (isEdit && value.toLowerCase() === currentTableName)) return false;
        try {
            const response = await fetch(`/api/pos/tables/getByName/${encodeURIComponent(value)}`, { cache: 'no-store' });
            if (!response.ok) return false;
            const found = await response.json();
            return Boolean(found?.id && (!isEdit || found.id !== id));
        } catch {
            return false;
        }
    }, [canCreateTables, canEditTableDetails, currentTableName, id, isEdit]);

    const handleSubmit = async (values: TableFormValues) => {
        if (isEdit ? !canSubmitEdit : !canSubmitAdd) {
            message.warning(isEdit ? 'คุณไม่มีสิทธิ์บันทึกการแก้ไขโต๊ะ' : 'คุณไม่มีสิทธิ์เพิ่มโต๊ะ');
            return;
        }
        setSubmitting(true);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const payload: Partial<TableFormValues> = !isEdit
                ? { table_name: values.table_name.trim(), status: values.status, is_active: values.is_active }
                : {
                    ...(canEditTableDetails ? { table_name: values.table_name.trim(), status: values.status } : {}),
                    ...(canUpdateTableStatus ? { is_active: values.is_active } : {}),
                };
            if (isEdit && Object.keys(payload).length === 0) {
                message.warning('ไม่มี field ที่บัญชีนี้มีสิทธิ์บันทึก');
                return;
            }
            const response = await fetch(isEdit ? `/api/pos/tables/update/${id}` : '/api/pos/tables/create', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }
            message.success(isEdit ? 'อัปเดตโต๊ะสำเร็จ' : 'สร้างโต๊ะสำเร็จ');
            router.replace('/pos/tables');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id || !canDeleteTables) return;
        Modal.confirm({
            title: 'ยืนยันการลบโต๊ะ',
            content: `คุณต้องการลบโต๊ะ ${tableName || '-'} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                try {
                    const token = csrfToken || await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/tables/delete/${id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': token } });
                    if (!response.ok) throw new Error('ไม่สามารถลบโต๊ะได้');
                    message.success('ลบโต๊ะสำเร็จ');
                    router.replace('/pos/tables');
                } catch (error) {
                    console.error(error);
                    message.error(error instanceof Error ? error.message : 'ไม่สามารถลบโต๊ะได้');
                }
            },
        });
    };

    if (isChecking || permissionLoading) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (!canOpenTablesManager || (isEdit ? (!canEditTableDetails && !canUpdateTableStatus && !canDeleteTables) : !canCreateTables)) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    const customerOrderUrl = qrInfo?.customer_path && typeof window !== 'undefined' ? new URL(qrInfo.customer_path, window.location.origin).toString() : (qrInfo?.customer_path || '');
    const qrExpireText = qrInfo?.qr_code_expires_at ? formatDate(qrInfo.qr_code_expires_at) : 'No expiry';

    return (
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader title={isEdit ? 'แก้ไขข้อมูลโต๊ะ' : 'เพิ่มโต๊ะ'} onBack={() => router.replace('/pos/tables')} actions={isEdit && canDeleteTables ? <Button danger onClick={handleDelete} icon={<DeleteOutlined />}>ลบ</Button> : null} />
            <PageContainer maxWidth={1100}>
                <PageSection style={{ background: 'transparent', border: 'none' }}>
                    <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 16 }}>

                        {(!canEditTableDetails || !canUpdateTableStatus || (isEdit && !canPreviewTableQr)) ? <Alert type="warning" showIcon message="Some table manager controls are restricted by policy" description="field ชื่อโต๊ะ, สถานะโต๊ะ, สวิตช์การใช้งาน และ preview QR จะถูกปิดหรือซ่อนตาม capability ของ role นี้" /> : null}
                    </Space>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '90px 0' }}><Spin size="large" tip="กำลังโหลดข้อมูล..." /></div>
                    ) : (
                        <Row gutter={[20, 20]}>
                            <Col xs={24} lg={15}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }} styles={{ body: { padding: 24 } }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><AppstoreOutlined style={{ fontSize: 20, color: '#7C3AED' }} /><Title level={5} style={{ margin: 0 }}>ข้อมูลโต๊ะ</Title></div>
                                    <Form<TableFormValues> form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} autoComplete="off" initialValues={{ is_active: true, status: TableStatus.Available }} onValuesChange={(changedValues) => { if (changedValues.table_name !== undefined) setTableName(changedValues.table_name); if (changedValues.status !== undefined) setStatus(changedValues.status); if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active); }}>
                                        <Form.Item name="table_name" label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อโต๊ะ <span style={{ color: '#EF4444' }}>*</span></span>} validateTrigger={['onBlur', 'onSubmit']} rules={[{ required: true, message: 'กรุณากรอกชื่อโต๊ะ' }, { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' }, { pattern: /^[a-zA-Z0-9\u0E00-\u0E7F\s\-_()./]*$/, message: 'กรอกได้เฉพาะภาษาไทย ภาษาอังกฤษ ตัวเลข และ - _ ( ) . /' }, { validator: async (_, value: string) => { if (!value?.trim() || (isEdit && !canEditTableDetails)) return; if (await checkNameConflict(value)) throw new Error('ชื่อโต๊ะนี้ถูกใช้งานแล้ว'); } }]}>
                                            <Input size="large" placeholder="1, 2, 3, ..." disabled={isEdit && !canEditTableDetails} style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} maxLength={50} />
                                        </Form.Item>
                                        <Form.Item name="status" label={<span style={{ fontWeight: 600, color: '#334155' }}>สถานะโต๊ะ <span style={{ color: '#EF4444' }}>*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกสถานะโต๊ะ' }]}>
                                            <div onClick={() => { if (isEdit && !canEditTableDetails) return; setIsStatusModalVisible(true); }} style={{ padding: '10px 16px', borderRadius: 12, border: '2px solid', cursor: isEdit && !canEditTableDetails ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', borderColor: '#7C3AED', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 46, opacity: isEdit && !canEditTableDetails ? 0.6 : 1 }}>
                                                <span style={{ color: '#1e293b', fontWeight: 600 }}>{getStatusLabel(status)}</span>
                                                <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                            </div>
                                        </Form.Item>
                                        <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                            <div><Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text><Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงโต๊ะนี้ในหน้า POS</Text></div>
                                            <Form.Item name="is_active" valuePropName="checked" noStyle><Switch disabled={isEdit && !canUpdateTableStatus} style={{ background: isActive ? '#10B981' : undefined }} /></Form.Item>
                                        </div>
                                        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                            <Button size="large" onClick={() => router.replace('/pos/tables')} style={{ flex: 1, borderRadius: 12, height: 46, fontWeight: 600 }}>ยกเลิก</Button>
                                            <Button type="primary" htmlType="submit" loading={submitting} disabled={isEdit ? !canSubmitEdit : !canSubmitAdd} icon={<SaveOutlined />} style={{ flex: 2, borderRadius: 12, height: 46, fontWeight: 600, background: '#7C3AED' }}>บันทึกข้อมูล</Button>
                                        </div>
                                    </Form>
                                </Card>
                            </Col>
                            <Col xs={24} lg={9}>
                                <div style={{ display: 'grid', gap: 14 }}>

                                    <TablePreviewCard tableName={tableName} status={status} isActive={isActive} />
                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                <Space><QrcodeOutlined style={{ color: '#0f766e' }} /><Text strong>QR สำหรับสั่งอาหาร</Text></Space>
                                                {!canPreviewTableQr ? <Alert type="info" showIcon message="QR preview is locked" description="role นี้ไม่มีสิทธิ์ preview QR ของโต๊ะ" /> : qrLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Spin size="small" /></div> : qrInfo && customerOrderUrl ? <><div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}><DynamicQRCode value={customerOrderUrl} size={150} /></div><Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>{customerOrderUrl}</Text><Text type="secondary">วันหมดอายุ : {qrExpireText}</Text></> : <Alert type="warning" showIcon message="QR not available" description="Save this table first, then generate QR." />}
                                            </Space>
                                        </Card>
                                    ) : null}
                                    {isEdit ? <Card style={{ borderRadius: 16 }}><Space direction="vertical" size={8}><Space><ExclamationCircleOutlined style={{ color: '#0369a1' }} /><Text strong>รายละเอียด</Text></Space><Text type="secondary">สร้างเมื่อ: {formatDate(originalTable?.create_date)}</Text><Text type="secondary">อัปเดตเมื่อ: {formatDate(originalTable?.update_date)}</Text></Space></Card> : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
            <Modal title="เลือกสถานะโต๊ะ" open={isStatusModalVisible} onCancel={() => setIsStatusModalVisible(false)} footer={null} centered width="min(400px, calc(100vw - 16px))" styles={{ body: { padding: '12px 16px 24px' } }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[{ value: TableStatus.Available, label: 'ว่าง' }, { value: TableStatus.Unavailable, label: 'ไม่ว่าง' }].map((opt) => (
                        <div key={opt.value} onClick={() => { if (isEdit && !canEditTableDetails) return; form.setFieldsValue({ status: opt.value }); setStatus(opt.value); setIsStatusModalVisible(false); }} style={{ padding: '14px 18px', border: '2px solid', borderRadius: 12, cursor: isEdit && !canEditTableDetails ? 'not-allowed' : 'pointer', background: status === opt.value ? '#f5f3ff' : '#fff', borderColor: status === opt.value ? '#7c3aed' : '#e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 54, opacity: isEdit && !canEditTableDetails ? 0.6 : 1 }}>
                            <span style={{ fontWeight: status === opt.value ? 600 : 400 }}>{opt.label}</span>
                            {status === opt.value ? <CheckCircleOutlined style={{ color: '#7c3aed', fontSize: 18 }} /> : null}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
