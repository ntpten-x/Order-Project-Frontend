'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Form, Input, message, Spin, Switch, Modal, Button, Card, Row, Col, Typography, Alert, Tag, Space } from 'antd';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import {
    DeleteOutlined,
    SaveOutlined,
    TableOutlined,
    CopyOutlined,
    DownloadOutlined,
    QrcodeOutlined,
    SyncOutlined,
    CheckCircleFilled,
    AppstoreOutlined,
    ExclamationCircleOutlined,
    CheckCircleOutlined,
    DownOutlined
} from '@ant-design/icons';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { pageStyles } from '../../../../../../theme/pos/tables/style';
import { Tables, TableStatus } from '../../../../../../types/api/pos/tables';
import type { TableQrInfo } from '../../../../../../types/api/pos/tables';
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { DynamicQRCode, DynamicQRCodeCanvas } from "../../../../../../lib/dynamic-imports";
import {
    closePrintWindow,
    getPrintSettings,
    peekPrintSettings,
    primePrintResources,
    printTableQrDocument,
    reservePrintWindow,
} from '../../../../../../utils/print-settings/runtime';
import {
    buildTableQrExportCanvas,
    saveCanvasAsPdf,
} from '../../../../../../utils/print-settings/tableQrExport';

type TablesManageMode = 'add' | 'edit';

type TableFormValues = {
    table_name: string;
    status: TableStatus;
    is_active?: boolean;
};

type PendingQrAutoPrint = {
    tableId: string;
    tableName: string;
    customerPath: string;
    qrCodeExpiresAt: string | null;
};

const { Title, Text } = Typography;

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const getStatusLabel = (status: TableStatus) => {
    return status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง';
};

const toSafeFilename = (value: string) => {
    return value
        .replace(/[^\w\u0E00-\u0E7F-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60) || 'table';
};

const TablePreviewCard = ({
    tableName,
    status,
    isActive
}: {
    tableName: string;
    status: TableStatus;
    isActive: boolean;
}) => {
    const isAvailable = status === TableStatus.Available;

    return (
        <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: '1px solid #F1F5F9',
        }}>
            <Title level={5} style={{ color: '#7C3AED', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

            <div style={{
                borderRadius: 16,
                border: `1px solid ${isActive ? '#ddd6fe' : '#e2e8f0'}`,
                padding: 14,
                background: isActive ? '#f5f3ff' : '#f8fafc',
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
                        ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)'
                        : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <TableOutlined style={{
                        fontSize: 20,
                        color: isActive ? '#7C3AED' : '#64748b'
                    }} />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {tableName || 'ชื่อโต๊ะ'}
                        </Text>
                        {isActive && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                    </div>
                    <Tag color={isAvailable ? 'green' : 'orange'} style={{ margin: '6px 0 0', borderRadius: 6 }}>
                        {getStatusLabel(status)}
                    </Tag>
                </div>
            </div>

            <Alert
                type={isActive ? 'success' : 'warning'}
                showIcon
                message={isActive ? 'โต๊ะนี้พร้อมใช้งานในระบบ POS' : 'โต๊ะนี้จะไม่แสดงให้เลือกใช้งาน'}
            />
        </div>
    );
};

export default function TablesManagePage({ params }: { params: { mode: string[] } }) {
    const router = useRouter();
    const [form] = Form.useForm<TableFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tableName, setTableName] = useState<string>('');
    const [status, setStatus] = useState<TableStatus>(TableStatus.Available);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [originalTable, setOriginalTable] = useState<Tables | null>(null);
    const [currentTableName, setCurrentTableName] = useState<string>('');
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [qrInfo, setQrInfo] = useState<TableQrInfo | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrRotating, setQrRotating] = useState(false);
    const [qrPdfDownloading, setQrPdfDownloading] = useState(false);
    const [pendingAutoPrint, setPendingAutoPrint] = useState<PendingQrAutoPrint | null>(null);
    const autoPrintWindowRef = useRef<Window | null>(null);

    const mode = params.mode?.[0] as TablesManageMode | undefined;
    const id = params.mode?.[1] || null;
    const isValidMode = mode === 'add' || mode === 'edit';
    const isEdit = mode === 'edit' && Boolean(id);
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateTables = can("tables.page", "create");
    const canUpdateTables = can("tables.page", "update");
    const canDeleteTables = can("tables.page", "delete");
    const canSubmit = isEdit ? canUpdateTables : canCreateTables;

    const modeTitle = useMemo(() => {
        if (isEdit) return 'แก้ไขข้อมูลโต๊ะ';
        return 'เพิ่มโต๊ะ';
    }, [isEdit]);

    const qrExportCanvasId = useMemo(() => {
        return `table-qr-export-canvas-${id || 'new'}`;
    }, [id]);

    useEffect(() => {
        if (!isValidMode || (mode === 'edit' && !id)) {
            message.warning('รูปแบบ URL ไม่ถูกต้อง');
            router.replace('/pos/tables');
        }
    }, [isValidMode, mode, id, router]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await getCsrfTokenCached();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchTable = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/pos/tables/getById/${id}`);
            if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลโต๊ะได้');
            const data = await response.json();
            form.setFieldsValue({
                table_name: data.table_name,
                status: data.status,
                is_active: data.is_active,
            });
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
    }, [id, form, router]);

    useEffect(() => {
        if (isEdit) {
            fetchTable();
        }
    }, [isEdit, fetchTable]);

    const buildCustomerUrl = useCallback((customerPath?: string | null) => {
        if (!customerPath) return '';
        if (typeof window === 'undefined') return customerPath;
        return new URL(customerPath, window.location.origin).toString();
    }, []);

    const captureCanvasImage = useCallback(async (canvasId: string): Promise<string> => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (canvas) {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    if (dataUrl && dataUrl !== 'data:,') {
                        return dataUrl;
                    }
                } catch {
                    // Retry on the next frame while the canvas is still rendering.
                }
            }

            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }

        throw new Error('QR image is not ready for print');
    }, []);

    const fetchQrInfo = useCallback(async () => {
        if (!id) return;
        setQrLoading(true);
        try {
            const response = await fetch(`/api/pos/tables/${id}/qr`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to load table QR');
            }
            const payload = await response.json();
            setQrInfo(payload);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to load table QR');
        } finally {
            setQrLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEdit) {
            fetchQrInfo();
        }
    }, [isEdit, fetchQrInfo]);

    useEffect(() => {
        primePrintResources();
    }, []);

    useEffect(() => {
        if (!pendingAutoPrint || !qrInfo || qrInfo.customer_path !== pendingAutoPrint.customerPath) {
            return;
        }

        let cancelled = false;

        const runAutoPrint = async () => {
            try {
                const printSettings = await getPrintSettings();
                if (!printSettings.automation.auto_print_table_qr_after_rotation) {
                    closePrintWindow(autoPrintWindowRef.current);
                    return;
                }

                const customerUrl = buildCustomerUrl(qrInfo.customer_path);
                if (!customerUrl) {
                    throw new Error('QR link is not available');
                }

                const qrImageDataUrl = await captureCanvasImage(qrExportCanvasId);
                if (cancelled) return;

                await printTableQrDocument({
                    tableName: qrInfo.table_name || tableName,
                    customerUrl,
                    qrImageDataUrl,
                    qrCodeExpiresAt: qrInfo.qr_code_expires_at,
                    settings: printSettings,
                    targetWindow: autoPrintWindowRef.current,
                });
            } catch (error) {
                closePrintWindow(autoPrintWindowRef.current);
                console.error('QR auto print failed', error);
                message.error(error instanceof Error ? error.message : 'เปิดหน้าพิมพ์ QR ไม่สำเร็จ');
            } finally {
                if (!cancelled) {
                    autoPrintWindowRef.current = null;
                    setPendingAutoPrint(null);
                }
            }
        };

        void runAutoPrint();

        return () => {
            cancelled = true;
        };
    }, [buildCustomerUrl, captureCanvasImage, pendingAutoPrint, qrExportCanvasId, qrInfo, tableName]);

    const handleCopyQrLink = useCallback(async () => {
        const customerUrl = buildCustomerUrl(qrInfo?.customer_path || '');
        if (!customerUrl) {
            message.warning('QR link is not available');
            return;
        }
        try {
            await navigator.clipboard.writeText(customerUrl);
            message.success('Copied customer ordering link');
        } catch {
            message.error('Failed to copy link');
        }
    }, [buildCustomerUrl, qrInfo?.customer_path]);

    const handleRotateQr = useCallback(async () => {
        if (!id) return;
        const cachedPrintSettings = peekPrintSettings();
        const shouldPrepareAutoPrint =
            !cachedPrintSettings || cachedPrintSettings.automation.auto_print_table_qr_after_rotation;
        closePrintWindow(autoPrintWindowRef.current);
        autoPrintWindowRef.current = shouldPrepareAutoPrint ? reservePrintWindow(`Table QR ${tableName || id}`) : null;
        setQrRotating(true);
        try {
            const response = await fetch(`/api/pos/tables/${id}/qr/rotate`, {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Failed to rotate QR');
            }

            const payload = await response.json();
            setQrInfo(payload);
            if (shouldPrepareAutoPrint && payload.customer_path) {
                setPendingAutoPrint({
                    tableId: payload.table_id || id,
                    tableName: payload.table_name || tableName || 'Table',
                    customerPath: payload.customer_path,
                    qrCodeExpiresAt: payload.qr_code_expires_at,
                });
            } else {
                closePrintWindow(autoPrintWindowRef.current);
                autoPrintWindowRef.current = null;
            }
            message.success('Rotated table QR successfully');
        } catch (error) {
            closePrintWindow(autoPrintWindowRef.current);
            autoPrintWindowRef.current = null;
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Failed to rotate QR');
        } finally {
            setQrRotating(false);
        }
    }, [csrfToken, id, tableName]);

    const handleDownloadQrPdf = useCallback(async () => {
        const customerUrl = buildCustomerUrl(qrInfo?.customer_path || '');
        if (!customerUrl) {
            message.warning('ยังไม่มีลิงก์ QR สำหรับดาวน์โหลด');
            return;
        }

        const tableDisplayName = String(qrInfo?.table_name || tableName || 'ไม่ระบุชื่อโต๊ะ').trim();
        setQrPdfDownloading(true);

        try {
            const printSettings = await getPrintSettings();
            const setting = printSettings.documents.table_qr;
            const qrImageDataUrl = await captureCanvasImage(qrExportCanvasId);
            const exportCanvas = await buildTableQrExportCanvas({
                tableName: tableDisplayName,
                customerUrl,
                qrImageDataUrl,
                qrCodeExpiresAt: qrInfo?.qr_code_expires_at,
                setting,
                locale: printSettings.locale,
            });

            await saveCanvasAsPdf({
                canvas: exportCanvas,
                filename: `qr-table-${toSafeFilename(tableDisplayName)}.pdf`,
                setting,
            });
            message.success('ดาวน์โหลด PDF สำเร็จ');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ดาวน์โหลด PDF ไม่สำเร็จ');
        } finally {
            setQrPdfDownloading(false);
        }
    }, [buildCustomerUrl, captureCanvasImage, qrExportCanvasId, qrInfo?.customer_path, qrInfo?.qr_code_expires_at, qrInfo?.table_name, tableName]);

    const checkNameConflict = useCallback(async (rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return false;

        if (isEdit && value.toLowerCase() === currentTableName) {
            return false;
        }

        try {
            const response = await fetch(`/api/pos/tables/getByName/${encodeURIComponent(value)}`);
            if (!response.ok) return false;
            const found = await response.json();
            if (!found?.id) return false;
            if (isEdit && found.id === id) return false;
            return true;
        } catch {
            return false;
        }
    }, [currentTableName, id, isEdit]);

    const onFinish = async (values: TableFormValues) => {
        if (!canSubmit) {
            message.error(isEdit ? "คุณไม่มีสิทธิ์แก้ไขโต๊ะ" : "คุณไม่มีสิทธิ์เพิ่มโต๊ะ");
            return;
        }
        setSubmitting(true);
        try {
            const payload: TableFormValues = {
                table_name: values.table_name.trim(),
                status: values.status,
                is_active: values.is_active,
            };

            const endpoint = isEdit ? `/api/pos/tables/update/${id}` : '/api/pos/tables/create';
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
                throw new Error(errorData.error || errorData.message || (isEdit ? 'ไม่สามารถอัปเดตโต๊ะได้' : 'ไม่สามารถสร้างโต๊ะได้'));
            }

            message.success(isEdit ? 'อัปเดตโต๊ะสำเร็จ' : 'สร้างโต๊ะสำเร็จ');
            router.push('/pos/tables');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = () => {
        if (!id) return;
        if (!canDeleteTables) {
            message.error("คุณไม่มีสิทธิ์ลบโต๊ะ");
            return;
        }
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
                    const response = await fetch(`/api/pos/tables/delete/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error('ไม่สามารถลบโต๊ะได้');
                    message.success('ลบโต๊ะสำเร็จ');
                    router.push('/pos/tables');
                } catch (error) {
                    console.error(error);
                    message.error('ไม่สามารถลบโต๊ะได้');
                }
            }
        });
    };

    const handleBack = () => router.push('/pos/tables');

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

    const customerOrderUrl = buildCustomerUrl(qrInfo?.customer_path || '');
    const qrExpireText = qrInfo?.qr_code_expires_at ? formatDate(qrInfo.qr_code_expires_at) : 'No expiry';

    return (
        <div className="manage-page" style={pageStyles.container as React.CSSProperties}>
            <UIPageHeader
                title={modeTitle}
                onBack={handleBack}
                actions={
                    isEdit && canDeleteTables ? (
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
                                        <AppstoreOutlined style={{ fontSize: 20, color: '#7C3AED' }} />
                                        <Title level={5} style={{ margin: 0 }}>ข้อมูลโต๊ะ</Title>
                                    </div>

                                    <Form<TableFormValues>
                                        form={form}
                                        layout="vertical"
                                        onFinish={onFinish}
                                        requiredMark={false}
                                        autoComplete="off"
                                        initialValues={{
                                            is_active: true,
                                            status: TableStatus.Available
                                        }}
                                        onValuesChange={(changedValues) => {
                                            if (changedValues.table_name !== undefined) setTableName(changedValues.table_name);
                                            if (changedValues.status !== undefined) setStatus(changedValues.status);
                                            if (changedValues.is_active !== undefined) setIsActive(changedValues.is_active);
                                        }}
                                    >
                                        <Form.Item
                                            name="table_name"
                                            label={
                                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                                    ชื่อโต๊ะ <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
                                                </span>
                                            }
                                            validateTrigger={['onBlur', 'onSubmit']}
                                            rules={[
                                                { required: true, message: 'กรุณากรอกชื่อระบบ' },
                                                { max: 50, message: 'ความยาวต้องไม่เกิน 50 ตัวอักษร' },
                                                { pattern: /^[a-zA-Z0-9\s\-_().]*$/, message: 'กรอกได้เฉพาะภาษาอังกฤษ ตัวเลข และ - _ ( ) .' },
                                                {
                                                    validator: async (_, value: string) => {
                                                        if (!value?.trim()) return;
                                                        const duplicated = await checkNameConflict(value);
                                                        if (duplicated) throw new Error('ชื่อโต๊ะนี้ถูกใช้งานแล้ว');
                                                    }
                                                }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                placeholder="1, 2, 3, ..."
                                                style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                maxLength={50}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="status"
                                            label={
                                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                                    สถานะโต๊ะ <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
                                                </span>
                                            }
                                            rules={[{ required: true, message: 'กรุณาเลือกสถานะโต๊ะ' }]}
                                        >
                                            <div 
                                                onClick={() => setIsStatusModalVisible(true)}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: 12,
                                                    border: '2px solid',
                                                    cursor: 'pointer',
                                                    background: status ? 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)' : '#fff',
                                                    borderColor: status ? '#7C3AED' : '#e2e8f0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    minHeight: 46
                                                }}
                                            >
                                                <span style={{ color: status ? '#1e293b' : '#94a3b8', fontWeight: status ? 600 : 400 }}>
                                                    {status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง'}
                                                </span>
                                                <DownOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                                            </div>
                                        </Form.Item>

                                        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ fontSize: 15, display: 'block' }}>สถานะการใช้งาน</Text>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อให้แสดงโต๊ะนี้ในหน้า POS</Text>
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
                                                    background: '#7C3AED',
                                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
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
                                    <TablePreviewCard
                                        tableName={tableName}
                                        status={status}
                                        isActive={isActive}
                                    />

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <QrcodeOutlined style={{ color: '#0f766e' }} />
                                                <Text strong>QR สำหรับสั่งอาหาร</Text>
                                            </div>

                                            {qrLoading ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                                                    <Spin size="small" />
                                                </div>
                                            ) : qrInfo && customerOrderUrl ? (
                                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                                                        <DynamicQRCode value={customerOrderUrl} size={150} />
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                                        {customerOrderUrl}
                                                    </Text>
                                                    <Text type="secondary">วันหมดอายุ : {qrExpireText}</Text>
                                                    <Space wrap>
                                                        <Button icon={<CopyOutlined />} onClick={handleCopyQrLink}>
                                                            Copy link
                                                        </Button>
                                                        <Button
                                                            icon={<SyncOutlined spin={qrRotating} />}
                                                            loading={qrRotating}
                                                            onClick={handleRotateQr}
                                                        >
                                                            Refresh QR
                                                        </Button>
                                                        <Button
                                                            type="default"
                                                            icon={<DownloadOutlined />}
                                                            loading={qrPdfDownloading}
                                                            onClick={handleDownloadQrPdf}
                                                        >
                                                            ดาวน์โหลด PDF
                                                        </Button>
                                                    </Space>
                                                    <div style={{ display: 'none' }}>
                                                        <DynamicQRCodeCanvas
                                                            id={qrExportCanvasId}
                                                            value={customerOrderUrl}
                                                            size={1024}
                                                            marginSize={2}
                                                        />
                                                    </div>
                                                </Space>
                                            ) : (
                                                <Alert
                                                    type="warning"
                                                    showIcon
                                                    message="QR not available"
                                                    description="Save this table first, then generate QR."
                                                />
                                            )}
                                        </Card>
                                    ) : null}

                                    {isEdit ? (
                                        <Card style={{ borderRadius: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                <Text strong>รายละเอียดรายการ</Text>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8 }}>
                                                <Text type="secondary">สร้างเมื่อ: {formatDate(originalTable?.create_date)}</Text>
                                                <Text type="secondary">อัปเดตเมื่อ: {formatDate(originalTable?.update_date)}</Text>
                                            </div>
                                        </Card>
                                    ) : null}
                                </div>
                            </Col>
                        </Row>
                    )}
                </PageSection>
            </PageContainer>
            
            {/* Status Selection Modal */}
            <Modal
                title="เลือกสถานะโต๊ะ"
                open={isStatusModalVisible}
                onCancel={() => setIsStatusModalVisible(false)}
                footer={null}
                centered
                width={400}
                styles={{ body: { padding: '12px 16px 24px' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { value: TableStatus.Available, label: 'ว่าง' },
                        { value: TableStatus.Unavailable, label: 'ไม่ว่าง' }
                    ].map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                form.setFieldsValue({ status: opt.value });
                                setStatus(opt.value);
                                setIsStatusModalVisible(false);
                            }}
                            style={{
                                padding: '14px 18px',
                                border: '2px solid',
                                borderRadius: 12,
                                cursor: 'pointer',
                                background: status === opt.value ? '#f5f3ff' : '#fff',
                                borderColor: status === opt.value ? '#7c3aed' : '#e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                minHeight: 54
                            }}
                        >
                            <span style={{ fontWeight: status === opt.value ? 600 : 400 }}>
                                {opt.label}
                            </span>
                            {status === opt.value && <CheckCircleOutlined style={{ color: '#7c3aed', fontSize: 18 }} />}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
