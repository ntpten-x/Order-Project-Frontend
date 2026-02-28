'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Modal,
    Radio,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import ListPagination from '../../../../components/ui/pagination/ListPagination';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import {
    DownloadOutlined,
    LinkOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    SyncOutlined,
    TableOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { TableQrCodeListItem, TableQrInfo, TableStatus } from '../../../../types/api/pos/tables';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import { DynamicQRCode, DynamicQRCodeCanvas, loadPdfExport } from '../../../../lib/dynamic-imports';
import { useListState } from '../../../../hooks/pos/useListState';

const { Text } = Typography;

const DEFAULT_PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;
type ExportFormat = 'png' | 'pdf';

const pageGlobalStyles = `
  .qr-code-page {
    background: #f8fafc;
    min-height: 100dvh;
    padding-bottom: 96px;
  }

  .qr-summary-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .qr-summary-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 12px;
  }

  .qr-cards-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  }

  .qr-table-card {
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: #ffffff;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .qr-table-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .qr-code-box {
    border: 1px dashed #cbd5e1;
    border-radius: 14px;
    min-height: 170px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .qr-code-box-clickable {
    cursor: pointer;
  }

  .qr-code-box-clickable:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #94a3b8;
  }

  @media (max-width: 768px) {
    .qr-code-page {
      padding-bottom: calc(108px + env(safe-area-inset-bottom));
    }

    .qr-cards-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .qr-table-card {
      padding: 12px;
      border-radius: 16px;
    }
  }
`;

const formatDate = (value?: string | Date | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const getTableStatusLabel = (status: TableStatus) => (
    status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง'
);

const toSafeFilename = (value: string) => {
    return value
        .replace(/[^\w\u0E00-\u0E7F-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60) || 'table';
};

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getCanvasId = (tableId: string) => `table-qr-export-canvas-${tableId}`;

type TableQrCardProps = {
    table: TableQrCodeListItem;
    customerUrl: string;
    canRotate: boolean;
    rotating: boolean;
    exporting: boolean;
    onOpen: (table: TableQrCodeListItem) => void;
    onRotate: (table: TableQrCodeListItem) => void;
    onExport: (table: TableQrCodeListItem) => void;
    onPreviewQr: (table: TableQrCodeListItem) => void;
};

const TableQrCard = ({
    table,
    customerUrl,
    canRotate,
    rotating,
    exporting,
    onOpen,
    onRotate,
    onExport,
    onPreviewQr,
}: TableQrCardProps) => {
    const hasQrUrl = Boolean(customerUrl);

    return (
        <article className="qr-table-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: table.table_name }}>
                        โต๊ะ {table.table_name}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        อัปเดตล่าสุด {formatDate(table.update_date)}
                    </Text>
                </div>

                <Space size={6} wrap>
                    <Tag color={table.status === TableStatus.Available ? 'green' : 'orange'} style={{ margin: 0 }}>
                        {getTableStatusLabel(table.status)}
                    </Tag>
                    <Tag color={table.is_active ? 'processing' : 'default'} style={{ margin: 0 }}>
                        {table.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Tag>
                </Space>
            </div>

            <div 
                className={`qr-code-box ${hasQrUrl ? 'qr-code-box-clickable' : ''}`}
                onClick={() => hasQrUrl && onPreviewQr(table)}
            >
                {hasQrUrl ? (
                    <DynamicQRCode value={customerUrl} size={140} />
                ) : (
                    <Text type="secondary">ยังไม่มี QR สำหรับโต๊ะนี้</Text>
                )}
            </div>

            <Tooltip title={customerUrl || 'ยังไม่มีลิงก์'}>
                <Text
                    type="secondary"
                    style={{
                        fontSize: 12,
                        minHeight: 38,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-all',
                    }}
                >
                    {customerUrl || '-'}
                </Text>
            </Tooltip>

            <Text type="secondary" style={{ fontSize: 12 }}>
                หมดอายุ : {formatDate(table.qr_code_expires_at)}
            </Text>

            <Space size={8} wrap style={{ width: '100%' }}>
                <Button
                    icon={<LinkOutlined />}
                    onClick={() => onOpen(table)}
                    disabled={!hasQrUrl}
                >
                    ไปที่หน้า
                </Button>
                <Button
                    icon={<SyncOutlined spin={rotating} />}
                    loading={rotating}
                    disabled={!canRotate}
                    onClick={() => onRotate(table)}
                >
                    รีเฟรช QR
                </Button>
                <Button icon={<DownloadOutlined />} loading={exporting} disabled={!hasQrUrl} onClick={() => onExport(table)}>
                    ส่งออก
                </Button>
            </Space>

            {hasQrUrl ? (
                <div style={{ display: 'none' }}>
                    <DynamicQRCodeCanvas
                        id={getCanvasId(table.id)}
                        value={customerUrl}
                        size={1024}
                        marginSize={2}
                    />
                </div>
            ) : null}
        </article>
    );
};

export default function TableQrCodePage() {
    const router = useRouter();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canRotateQr = can('tables.page', 'update');

    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, updateFilter,
        getQueryParams,
        isUrlReady
    } = useListState({
        defaultPageSize: DEFAULT_PAGE_SIZE,
        defaultFilters: {
            status: 'all' as StatusFilter,
            table_state: 'all' as TableStateFilter
        }
    });

    const [tables, setTables] = useState<TableQrCodeListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
    const [exportTargetTable, setExportTargetTable] = useState<TableQrCodeListItem | null>(null);
    const [previewTable, setPreviewTable] = useState<TableQrCodeListItem | null>(null);
    const [csrfToken, setCsrfToken] = useState('');

    // const debouncedSearch = useDebouncedValue(searchText, 250); // Managed by hook

    const buildCustomerUrl = useCallback((customerPath?: string | null) => {
        if (!customerPath) return '';

        const envBaseUrl = process.env.NEXT_PUBLIC_CUSTOMER_ORDER_BASE_URL?.trim();
        const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const baseUrls = [envBaseUrl, fallbackBaseUrl].filter((url): url is string => Boolean(url));
        for (const baseUrl of baseUrls) {
            try {
                return new URL(customerPath, baseUrl).toString();
            } catch {
                // Continue to next candidate base URL.
            }
        }
        return '';
    }, []);

    const fetchQrCodes = useCallback(async () => {
        setLoading(true);
        try {
            const params = getQueryParams();
            const response = await fetch(`/api/pos/tables/qr-codes?${params.toString()}`, { cache: 'no-store' });
            if (response.ok) {
                const payload = await response.json();
                setTables(payload.data || []);
                setTotal(payload.total || 0);
                return;
            }

            // Simplified old compatibility check - if this fails, we just show error
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงรายการ QR โต๊ะได้');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถดึงรายการ QR โต๊ะได้');
        } finally {
            setLoading(false);
        }
    }, [getQueryParams, setTotal]);

    useEffect(() => {
        getCsrfTokenCached()
            .then((token) => setCsrfToken(token))
            .catch(() => setCsrfToken(''));
    }, []);

    useEffect(() => {
        if (isUrlReady && isAuthorized && !permissionLoading) {
            fetchQrCodes();
        }
    }, [isUrlReady, isAuthorized, permissionLoading, fetchQrCodes]);

    const displayTables = tables;

    const handleOpenCustomerPage = useCallback((table: TableQrCodeListItem) => {
        const customerUrl = buildCustomerUrl(table.customer_path);
        if (!customerUrl) {
            message.warning('ยังไม่มีลิงก์สำหรับโต๊ะนี้');
            return;
        }
        window.open(customerUrl, '_blank', 'noopener,noreferrer');
    }, [buildCustomerUrl]);

    const handleRotateQr = useCallback(async (table: TableQrCodeListItem) => {
        if (!canRotateQr) {
            message.error('คุณไม่มีสิทธิ์รีเฟรช QR');
            return;
        }

        setRotatingId(table.id);
        try {
            const token = csrfToken || await getCsrfTokenCached();
            const response = await fetch(`/api/pos/tables/${table.id}/qr/rotate`, {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': token,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถรีเฟรช QR ได้');
            }

            const payload = await response.json() as TableQrInfo;
            setTables((prev: TableQrCodeListItem[]) => prev.map((row: TableQrCodeListItem) => {
                if (row.id !== table.id) return row;
                return {
                    ...row,
                    qr_code_token: payload.qr_code_token,
                    qr_code_expires_at: payload.qr_code_expires_at,
                    customer_path: payload.customer_path,
                    update_date: new Date().toISOString(),
                };
            }));

            message.success(`รีเฟรช QR ของโต๊ะ ${table.table_name} สำเร็จ`);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถรีเฟรช QR ได้');
        } finally {
            setRotatingId(null);
        }
    }, [canRotateQr, csrfToken]);

    const downloadPng = useCallback(async (table: TableQrCodeListItem) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const sourceCanvas = document.getElementById(getCanvasId(table.id)) as HTMLCanvasElement | null;
        if (!sourceCanvas) {
            throw new Error('QR image is not ready for export');
        }

        const fileName = `table-qr-${toSafeFilename(table.table_name)}.png`;
        const link = document.createElement('a');
        link.href = sourceCanvas.toDataURL('image/png');
        link.download = fileName;
        link.click();
    }, []);

    const buildPdfCanvas = useCallback(async (table: TableQrCodeListItem, customerUrl: string) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const sourceCanvas = document.getElementById(getCanvasId(table.id)) as HTMLCanvasElement | null;
        if (!sourceCanvas) {
            throw new Error('QR image is not ready for export');
        }

        const qrDataUrl = sourceCanvas.toDataURL('image/png');
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 1240;
        exportCanvas.height = 1754;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Cannot generate PDF canvas');
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 64px "Noto Sans Thai", "Segoe UI", sans-serif';
        ctx.fillText(`Table ${table.table_name}`, exportCanvas.width / 2, 170);

        ctx.fillStyle = '#475569';
        ctx.font = '36px "Noto Sans Thai", "Segoe UI", sans-serif';
        ctx.fillText('Scan to open menu', exportCanvas.width / 2, 235);

        const qrImage = new Image();
        qrImage.decoding = 'async';
        qrImage.src = qrDataUrl;
        await new Promise<void>((resolve, reject) => {
            qrImage.onload = () => resolve();
            qrImage.onerror = () => reject(new Error('Failed to load QR image'));
        });

        const qrSize = 780;
        const qrX = (exportCanvas.width - qrSize) / 2;
        const qrY = 320;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 4;
        ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = '#64748b';
        ctx.font = '26px "Noto Sans Thai", "Segoe UI", sans-serif';
        const urlLines = customerUrl.match(/.{1,58}/g) || [customerUrl];
        urlLines.forEach((line, index) => {
            ctx.fillText(line, exportCanvas.width / 2, qrY + qrSize + 95 + (index * 34));
        });

        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px "Noto Sans Thai", "Segoe UI", sans-serif';
        ctx.fillText(`Generated ${new Date().toLocaleString('th-TH')}`, exportCanvas.width / 2, exportCanvas.height - 110);

        return exportCanvas;
    }, []);

    const savePdfFile = useCallback(async (table: TableQrCodeListItem, exportCanvas: HTMLCanvasElement) => {
        const mergedDataUrl = exportCanvas.toDataURL('image/png');
        const { default: JsPdfCtor } = await loadPdfExport();
        const doc = new JsPdfCtor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const targetWidth = pageWidth - margin * 2;
        const targetHeight = (exportCanvas.height / exportCanvas.width) * targetWidth;
        const drawHeight = Math.min(targetHeight, pageHeight - margin * 2);
        const drawWidth = (exportCanvas.width / exportCanvas.height) * drawHeight;
        const drawX = (pageWidth - drawWidth) / 2;
        const drawY = (pageHeight - drawHeight) / 2;

        doc.addImage(mergedDataUrl, 'PNG', drawX, drawY, drawWidth, drawHeight, undefined, 'FAST');
        doc.save(`table-qr-${toSafeFilename(table.table_name)}.pdf`);
    }, []);

    const printPdfLikeSlip = useCallback(async (table: TableQrCodeListItem, exportCanvas: HTMLCanvasElement) => {
        const imageDataUrl = exportCanvas.toDataURL('image/png');
        const safeTableName = escapeHtml(table.table_name);
        const printWindow = window.open('', '_blank', 'width=960,height=1280');
        if (!printWindow) {
            await savePdfFile(table, exportCanvas);
            message.info('Popup blocked, downloaded PDF instead');
            return;
        }

        printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Table QR - ${safeTableName}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { margin: 0; font-family: Arial, sans-serif; background: #fff; }
    .page { display: flex; justify-content: center; align-items: flex-start; padding: 8mm 0; }
    img { width: 190mm; max-width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <div class="page"><img src="${imageDataUrl}" alt="Table QR"/></div>
  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 250));
    window.addEventListener('afterprint', () => window.close());
  </script>
</body>
</html>`);
        printWindow.document.close();
    }, [savePdfFile]);

    const handleStartExport = useCallback((table: TableQrCodeListItem) => {
        const customerUrl = buildCustomerUrl(table.customer_path);
        if (!customerUrl) {
            message.warning('No customer link available for this table');
            return;
        }

        setExportTargetTable(table);
        setExportFormat('png');
        setIsExportModalOpen(true);
    }, [buildCustomerUrl]);

    const handleConfirmExport = useCallback(async () => {
        if (!exportTargetTable) {
            return;
        }

        const customerUrl = buildCustomerUrl(exportTargetTable.customer_path);
        if (!customerUrl) {
            message.warning('No customer link available for this table');
            return;
        }

        setExportingId(exportTargetTable.id);
        try {
            if (exportFormat === 'png') {
                await downloadPng(exportTargetTable);
                message.success('Downloaded PNG');
                setIsExportModalOpen(false);
                setExportTargetTable(null);
                return;
            }

            const exportCanvas = await buildPdfCanvas(exportTargetTable, customerUrl);
            await printPdfLikeSlip(exportTargetTable, exportCanvas);
            message.success('Opened print dialog for PDF');
            setIsExportModalOpen(false);
            setExportTargetTable(null);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'Export failed');
        } finally {
            setExportingId(null);
        }
    }, [buildCustomerUrl, buildPdfCanvas, downloadPng, exportFormat, exportTargetTable, printPdfLikeSlip]);

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    const totalCount = total;
    const activeCount = tables.filter((table) => table.is_active).length;
    const availableCount = tables.filter((table) => table.status === TableStatus.Available).length;
    const unavailableCount = tables.filter((table) => table.status === TableStatus.Unavailable).length;

    return (
        <div className="qr-code-page">
            <style>{pageGlobalStyles}</style>

            <UIPageHeader
                title="QR Code โต๊ะ"
                icon={<QrcodeOutlined />}
                actions={(
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchQrCodes}>
                        </Button>
                        <Button icon={<TableOutlined />} onClick={() => router.push('/pos/tables')}>
                            จัดการโต๊ะ
                        </Button>
                    </Space>
                )}
            />

            <PageContainer>
                <PageStack>
                    <div className="qr-summary-grid">
                        <div className="qr-summary-card">
                            <Text type="secondary" style={{ fontSize: 12 }}>โต๊ะทั้งหมด</Text>
                            <Text strong style={{ fontSize: 22, display: 'block', color: '#0f172a' }}>{totalCount}</Text>
                        </div>
                        <div className="qr-summary-card">
                            <Text type="secondary" style={{ fontSize: 12 }}>เปิดใช้งาน</Text>
                            <Text strong style={{ fontSize: 22, display: 'block', color: '#0369a1' }}>{activeCount}</Text>
                        </div>
                        <div className="qr-summary-card">
                            <Text type="secondary" style={{ fontSize: 12 }}>สถานะว่าง</Text>
                            <Text strong style={{ fontSize: 22, display: 'block', color: '#059669' }}>{availableCount}</Text>
                        </div>
                        <div className="qr-summary-card">
                            <Text type="secondary" style={{ fontSize: 12 }}>สถานะไม่ว่าง</Text>
                            <Text strong style={{ fontSize: 22, display: 'block', color: '#b45309' }}>{unavailableCount}</Text>
                        </div>
                    </div>

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(value) => setSearchText(value)}
                        />
                        <Space wrap size={10}>
                            <ModalSelector<StatusFilter>
                                title="สถานะใช้งาน"
                                value={filters.status}
                                onChange={(value) => updateFilter('status', value)}
                                options={[
                                    { label: `ทั้งหมด`, value: 'all' },
                                    { label: `เปิดใช้งาน`, value: 'active' },
                                    { label: `ปิดใช้งาน`, value: 'inactive' },
                                ]}
                                style={{ minWidth: 140 }}
                            />
                            <ModalSelector<TableStateFilter>
                                title="สถานะโต๊ะ"
                                value={filters.table_state}
                                onChange={(value) => updateFilter('table_state', value)}
                                options={[
                                    { label: `ทุกสถานะ`, value: 'all' },
                                    { label: `ว่าง`, value: TableStatus.Available },
                                    { label: `ไม่ว่าง`, value: TableStatus.Unavailable },
                                ]}
                                style={{ minWidth: 140 }}
                            />
                                <ModalSelector<CreatedSort>
                                    title="เรียงลำดับ"
                                    value={createdSort}
                                    onChange={(value) => setCreatedSort(value)}
                                    options={[
                                        { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                        { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                                    ]}
                                    style={{ minWidth: 140 }}
                                />
                            </Space>
                        </SearchBar>

                    <PageSection
                        title="รายการ QR โต๊ะ"
                        extra={<Text strong>{total} รายการ</Text>}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '90px 0' }}>
                                <Spin size="large" tip="กำลังโหลด QR โต๊ะ..." />
                            </div>
                        ) : displayTables.length === 0 ? (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีรายการโต๊ะ'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือเงื่อนไขตัวกรอง'
                                        : 'เพิ่มโต๊ะในหน้าโต๊ะก่อน แล้ว QR จะถูกสร้างให้อัตโนมัติ'
                                }
                            />
                        ) : (
                            <Space direction="vertical" size={14} style={{ width: '100%' }}>
                                <div className="qr-cards-grid">
                                    {displayTables.map((table) => {
                                        const customerUrl = buildCustomerUrl(table.customer_path);
                                        return (
                                            <TableQrCard
                                                key={table.id}
                                                table={table}
                                                customerUrl={customerUrl}
                                                canRotate={canRotateQr}
                                                rotating={rotatingId === table.id}
                                                exporting={exportingId === table.id}
                                                onOpen={handleOpenCustomerPage}
                                                onRotate={handleRotateQr}
                                                onExport={handleStartExport}
                                                onPreviewQr={setPreviewTable}
                                            />
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>
                            </Space>
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>

            <Modal
                title="ส่งออก QR Code"
                open={isExportModalOpen}
                onCancel={() => {
                    setIsExportModalOpen(false);
                    setExportTargetTable(null);
                }}
                onOk={() => {
                    void handleConfirmExport();
                }}
                okText="ตกลง"
                cancelText="ยกเลิก"
                confirmLoading={Boolean(exportTargetTable && exportingId === exportTargetTable.id)}
                destroyOnClose
            >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Text type="secondary">
                        {exportTargetTable ? `โต๊ะ: ${exportTargetTable.table_name}` : 'เลือกรูปแบบไฟล์ที่ต้องการส่งออก'}
                    </Text>
                    <Radio.Group
                        value={exportFormat}
                        onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                        style={{ width: '100%' }}
                    >
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="png">PNG (ดาวน์โหลดรูป QR)</Radio>
                            <Radio value="pdf">PDF (เปิดหน้าพิมพ์/บันทึกเป็น PDF)</Radio>
                        </Space>
                    </Radio.Group>
                </Space>
            </Modal>

            {/* QR Preview Modal */}
            <Modal
                title={`โต๊ะ ${previewTable?.table_name || ''}`}
                open={Boolean(previewTable)}
                onCancel={() => setPreviewTable(null)}
                footer={null}
                centered
                destroyOnClose
                bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                width={400}
            >
                {previewTable && previewTable.customer_path && (
                    <div style={{
                        background: '#fff',
                        padding: '16px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}>
                        <DynamicQRCode 
                            value={buildCustomerUrl(previewTable.customer_path)} 
                            size={280} 
                        />
                    </div>
                )}
                <Text type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
                    ให้ลูกค้าสแกน QR Code นี้เพื่อเปิดเมนูสั่งอาหาร
                </Text>
            </Modal>
        </div>
    );
}
