'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Radio, Space, Tag, Tooltip, Typography, message } from 'antd';
import { DownloadOutlined, LinkOutlined, QrcodeOutlined, ReloadOutlined, SyncOutlined, TableOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import { StatsGroup } from '../../../../components/ui/card/StatsGroup';
import { DynamicQRCode, DynamicQRCodeCanvas } from '../../../../lib/dynamic-imports';
import { TableQrCodeListItem, TableQrInfo, TableStatus } from '../../../../types/api/pos/tables';
import { useListState } from '../../../../hooks/pos/useListState';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { useSocket } from '../../../../hooks/useSocket';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { closePrintWindow, getPrintSettings, peekPrintSettings, primePrintResources, printTableQrDocument, reservePrintWindow } from '../../../../utils/print-settings/runtime';
import { buildTableQrExportCanvas, downloadCanvasAsPng, saveCanvasAsPdf } from '../../../../utils/print-settings/tableQrExport';

const { Text } = Typography;
const DEFAULT_PAGE_SIZE = 10;
const EXPORT_QR_CANVAS_SIZE = 2048;
const QR_TABLE_CACHE_KEY = 'pos:tables:qr:list:default-v1';
const QR_TABLE_CACHE_TTL_MS = 60 * 1000;
const pageGlobalStyles = `.qr-code-page{background:#f8fafc;min-height:100dvh;padding-bottom:96px}.qr-cards-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}.qr-table-card{border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.04);transition:transform .2s ease,box-shadow .2s ease}.qr-table-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.qr-code-box{border:2px dashed #dbeafe;border-radius:16px;min-height:184px;display:flex;justify-content:center;align-items:center;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);padding:16px}.qr-code-box-clickable{cursor:pointer}.qr-code-box-clickable:hover{box-shadow:0 8px 24px rgba(37,99,235,.12);border-color:#60a5fa}@media (max-width:767px){.qr-code-page{padding-bottom:calc(108px + env(safe-area-inset-bottom))}.qr-cards-grid{grid-template-columns:1fr;gap:12px}}`;

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;
type ExportFormat = 'png' | 'pdf';
type PendingQrAutoPrint = { tableId: string; customerPath: string };
type QrCachePayload = { items: TableQrCodeListItem[]; total: number };

const formatDate = (value?: string | Date | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const getTableStatusLabel = (status: TableStatus) => status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง';
const toSafeFilename = (value: string) => value.replace(/[^\w\u0E00-\u0E7F-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'table';
const getCanvasId = (tableId: string) => `table-qr-export-canvas-${tableId}`;

function TableQrCard({ table, customerUrl, canRotate, rotating, exporting, onOpen, onRotate, onExport, onPreviewQr }: { table: TableQrCodeListItem; customerUrl: string; canRotate: boolean; rotating: boolean; exporting: boolean; onOpen: (table: TableQrCodeListItem) => void; onRotate: (table: TableQrCodeListItem) => void; onExport: (table: TableQrCodeListItem) => void; onPreviewQr: (table: TableQrCodeListItem) => void; }) {
    const hasQrUrl = Boolean(customerUrl);
    return (
        <article className="qr-table-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: table.table_name }}>โต๊ะ {table.table_name}</Text>
                </div>
                <Space size={6} wrap>
                    <Tag color={table.status === TableStatus.Available ? 'green' : 'orange'} style={{ margin: 0, borderRadius: 999 }}>{getTableStatusLabel(table.status)}</Tag>
                    <Tag color={table.is_active ? 'processing' : 'default'} style={{ margin: 0, borderRadius: 999 }}>{table.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}</Tag>
                </Space>
            </div>
            <div className={`qr-code-box ${hasQrUrl ? 'qr-code-box-clickable' : ''}`} onClick={() => hasQrUrl && onPreviewQr(table)}>
                {hasQrUrl ? <DynamicQRCode value={customerUrl} size={140} /> : <Text type="secondary">ยังไม่มี QR สำหรับโต๊ะนี้</Text>}
            </div>
            <Tooltip title={customerUrl || 'ยังไม่มีลิงก์ลูกค้า'}>
                <Text type="secondary" style={{ fontSize: 12, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}>{customerUrl || '-'}</Text>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12 }}>หมดอายุ: {formatDate(table.qr_code_expires_at)}</Text>
            <Space size={8} wrap>
                <Button icon={<LinkOutlined />} onClick={() => onOpen(table)} disabled={!hasQrUrl}>เปิดลิงก์</Button>
                <Button icon={<SyncOutlined spin={rotating} />} loading={rotating} disabled={!canRotate} onClick={() => onRotate(table)}>รีเฟรช QR</Button>
                <Button icon={<DownloadOutlined />} loading={exporting} disabled={!hasQrUrl} onClick={() => onExport(table)}>ส่งออก</Button>
            </Space>
            {hasQrUrl ? <div style={{ display: 'none' }}><DynamicQRCodeCanvas id={getCanvasId(table.id)} value={customerUrl} size={EXPORT_QR_CANVAS_SIZE} marginSize={2} /></div> : null} {/* Changed: larger source canvas for higher-resolution export */}
        </article>
    );
}

export default function TableQrCodePage() {
    const router = useRouter();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canRotateQr = can('tables.page', 'update');
    const { page, setPage, pageSize, setPageSize, total, setTotal, searchText, setSearchText, debouncedSearch, createdSort, setCreatedSort, filters, updateFilter, getQueryParams, isUrlReady } = useListState({ defaultPageSize: DEFAULT_PAGE_SIZE, defaultFilters: { status: 'all' as StatusFilter, table_state: 'all' as TableStateFilter } });

    const [tables, setTables] = useState<TableQrCodeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
    const [exportTargetTable, setExportTargetTable] = useState<TableQrCodeListItem | null>(null);
    const [previewTable, setPreviewTable] = useState<TableQrCodeListItem | null>(null);
    const [csrfToken, setCsrfToken] = useState('');
    const [pendingAutoPrint, setPendingAutoPrint] = useState<PendingQrAutoPrint | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const autoPrintWindowRef = useRef<Window | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const isDefaultListView = useMemo(() => page === 1 && pageSize === DEFAULT_PAGE_SIZE && createdSort === DEFAULT_CREATED_SORT && !debouncedSearch.trim() && filters.status === 'all' && filters.table_state === 'all', [createdSort, debouncedSearch, filters.status, filters.table_state, page, pageSize]);

    const buildCustomerUrl = useCallback((customerPath?: string | null) => {
        if (!customerPath) return '';
        const envBaseUrl = process.env.NEXT_PUBLIC_CUSTOMER_ORDER_BASE_URL?.trim();
        const fallbackBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        for (const baseUrl of [envBaseUrl, fallbackBaseUrl].filter(Boolean) as string[]) {
            try { return new URL(customerPath, baseUrl).toString(); } catch {}
        }
        return '';
    }, []);

    const captureCanvasImage = useCallback(async (canvasId: string) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
            if (canvas) {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    if (dataUrl && dataUrl !== 'data:,') return dataUrl;
                } catch {}
            }
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }
        throw new Error('QR image is not ready for print');
    }, []);

    useEffect(() => { getCsrfTokenCached().then(setCsrfToken).catch(() => setCsrfToken('')); }, []);
    useEffect(() => { primePrintResources(); }, []);
    useEffect(() => () => { requestRef.current?.abort(); closePrintWindow(autoPrintWindowRef.current); autoPrintWindowRef.current = null; }, []);
    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) return;
        cacheHydratedRef.current = true;
        const cached = readCache<QrCachePayload>(QR_TABLE_CACHE_KEY, QR_TABLE_CACHE_TTL_MS);
        if (!cached) return;
        setTables(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);
    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<QrCachePayload>(QR_TABLE_CACHE_KEY, { items: tables, total });
    }, [isDefaultListView, loading, tables, total]);

    const fetchQrCodes = useCallback(async (options?: { background?: boolean }) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const background = options?.background === true;
        if (background) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await fetch(`/api/pos/tables/qr-codes?${getQueryParams().toString()}`, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงรายการ QR โต๊ะได้');
            }
            const payload = await response.json();
            if (controller.signal.aborted) return;
            setTables(payload.data || []);
            setTotal(payload.total || 0);
            setLastSyncedAt(new Date().toISOString());
        } catch (fetchError) {
            if (controller.signal.aborted) return;
            closePrintWindow(autoPrintWindowRef.current);
            autoPrintWindowRef.current = null;
            setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงรายการ QR โต๊ะได้'));
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
            if (!controller.signal.aborted) { setLoading(false); setRefreshing(false); }
        }
    }, [getQueryParams, setTotal]);

    useEffect(() => { if (isUrlReady && isAuthorized && !permissionLoading) void fetchQrCodes({ background: hasCachedSnapshot }); }, [fetchQrCodes, hasCachedSnapshot, isAuthorized, isUrlReady, permissionLoading]);
    useRealtimeRefresh({ socket, events: [RealtimeEvents.tables.create, RealtimeEvents.tables.update, RealtimeEvents.tables.delete], enabled: isAuthorized && isUrlReady, debounceMs: 250, onRefresh: () => { void fetchQrCodes({ background: true }); } });

    useEffect(() => {
        if (!pendingAutoPrint) return;
        const targetTable = tables.find((table) => table.id === pendingAutoPrint.tableId && table.customer_path === pendingAutoPrint.customerPath);
        if (!targetTable) return;
        let cancelled = false;
        const runAutoPrint = async () => {
            try {
                const printSettings = await getPrintSettings();
                if (!printSettings.automation.auto_print_table_qr_after_rotation) { closePrintWindow(autoPrintWindowRef.current); return; }
                const customerUrl = buildCustomerUrl(targetTable.customer_path);
                if (!customerUrl) throw new Error('ไม่พบลิงก์ลูกค้าสำหรับพิมพ์ QR');
                const qrImageDataUrl = await captureCanvasImage(getCanvasId(targetTable.id));
                if (cancelled) return;
                await printTableQrDocument({ tableName: targetTable.table_name, customerUrl, qrImageDataUrl, qrCodeExpiresAt: targetTable.qr_code_expires_at, settings: printSettings, targetWindow: autoPrintWindowRef.current });
            } catch (printError) {
                closePrintWindow(autoPrintWindowRef.current);
                message.error(printError instanceof Error ? printError.message : 'เปิดหน้าพิมพ์ QR ไม่สำเร็จ');
            } finally {
                if (!cancelled) { autoPrintWindowRef.current = null; setPendingAutoPrint(null); }
            }
        };
        void runAutoPrint();
        return () => { cancelled = true; };
    }, [buildCustomerUrl, captureCanvasImage, pendingAutoPrint, tables]);

    const handleOpenCustomerPage = useCallback((table: TableQrCodeListItem) => {
        const customerUrl = buildCustomerUrl(table.customer_path);
        if (!customerUrl) return message.warning('ยังไม่มีลิงก์สำหรับโต๊ะนี้');
        window.open(customerUrl, '_blank', 'noopener,noreferrer');
    }, [buildCustomerUrl]);

    const handleRotateQr = useCallback(async (table: TableQrCodeListItem) => {
        if (!canRotateQr) return void message.error('คุณไม่มีสิทธิ์รีเฟรช QR');
        const cachedPrintSettings = peekPrintSettings();
        const shouldPrepareAutoPrint = !cachedPrintSettings || cachedPrintSettings.automation.auto_print_table_qr_after_rotation;
        closePrintWindow(autoPrintWindowRef.current);
        autoPrintWindowRef.current = shouldPrepareAutoPrint ? reservePrintWindow(`Table QR ${table.table_name}`) : null;
        setRotatingId(table.id);
        try {
            const response = await fetch(`/api/pos/tables/${table.id}/qr/rotate`, { method: 'POST', headers: { 'X-CSRF-Token': csrfToken || await getCsrfTokenCached() } });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถรีเฟรช QR ได้');
            }
            const payload = await response.json() as TableQrInfo;
            setTables((prev) => prev.map((row) => row.id === table.id ? { ...row, qr_code_token: payload.qr_code_token, qr_code_expires_at: payload.qr_code_expires_at, customer_path: payload.customer_path, update_date: new Date().toISOString() } : row));
            setLastSyncedAt(new Date().toISOString());
            if (shouldPrepareAutoPrint && payload.customer_path) setPendingAutoPrint({ tableId: table.id, customerPath: payload.customer_path }); else { closePrintWindow(autoPrintWindowRef.current); autoPrintWindowRef.current = null; }
            message.success(`รีเฟรช QR ของโต๊ะ ${table.table_name} สำเร็จ`);
        } catch (rotateError) {
            closePrintWindow(autoPrintWindowRef.current);
            autoPrintWindowRef.current = null;
            message.error(rotateError instanceof Error ? rotateError.message : 'ไม่สามารถรีเฟรช QR ได้');
        } finally {
            setRotatingId(null);
        }
    }, [canRotateQr, csrfToken]);

    const buildExportBundle = useCallback(async (table: TableQrCodeListItem, customerUrl: string) => {
        const printSettings = await getPrintSettings();
        const setting = printSettings.documents.table_qr;
        const qrImageDataUrl = await captureCanvasImage(getCanvasId(table.id));
        const exportCanvas = await buildTableQrExportCanvas({ tableName: table.table_name, customerUrl, qrImageDataUrl, qrCodeExpiresAt: table.qr_code_expires_at, setting, locale: printSettings.locale });
        return { printSettings, setting, qrImageDataUrl, exportCanvas };
    }, [captureCanvasImage]);

    const handleConfirmExport = useCallback(async () => {
        if (!exportTargetTable) return;
        const customerUrl = buildCustomerUrl(exportTargetTable.customer_path);
        if (!customerUrl) return void message.warning('ยังไม่มีลิงก์ลูกค้าสำหรับโต๊ะนี้');
        setExportingId(exportTargetTable.id);
        try {
            if (exportFormat === 'png') {
                const { exportCanvas } = await buildExportBundle(exportTargetTable, customerUrl);
                downloadCanvasAsPng(exportCanvas, `table-qr-${toSafeFilename(exportTargetTable.table_name)}.png`);
                message.success('ดาวน์โหลด PNG สำเร็จ');
            } else {
                const { printSettings, setting, qrImageDataUrl, exportCanvas } = await buildExportBundle(exportTargetTable, customerUrl);
                const targetWindow = reservePrintWindow(`Table QR ${exportTargetTable.table_name}`);
                if (!targetWindow) {
                    await saveCanvasAsPdf({ canvas: exportCanvas, filename: `table-qr-${toSafeFilename(exportTargetTable.table_name)}.pdf`, setting });
                    message.success('ดาวน์โหลด PDF สำเร็จ');
                } else {
                    try {
                        await printTableQrDocument({ tableName: exportTargetTable.table_name, customerUrl, qrImageDataUrl, qrCodeExpiresAt: exportTargetTable.qr_code_expires_at, settings: printSettings, targetWindow });
                        message.success('เปิดหน้าพิมพ์ PDF แล้ว');
                    } catch (printError) {
                        closePrintWindow(targetWindow);
                        throw printError;
                    }
                }
            }
            setIsExportModalOpen(false);
            setExportTargetTable(null);
        } catch (exportError) {
            message.error(exportError instanceof Error ? exportError.message : 'ส่งออกไฟล์ไม่สำเร็จ');
        } finally {
            setExportingId(null);
        }
    }, [buildCustomerUrl, buildExportBundle, exportFormat, exportTargetTable]);

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;

    const activeCount = tables.filter((table) => table.is_active).length;
    const availableCount = tables.filter((table) => table.status === TableStatus.Available).length;
    const unavailableCount = tables.filter((table) => table.status === TableStatus.Unavailable).length;

    return (
        <div className="qr-code-page">
            <style>{pageGlobalStyles}</style>
            <UIPageHeader title="QR Code โต๊ะ" icon={<QrcodeOutlined />} actions={<Space size={10} wrap><Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchQrCodes({ background: tables.length > 0 })}></Button><Button icon={<TableOutlined />} onClick={() => router.push('/pos/tables')}>จัดการโต๊ะ</Button></Space>} />
            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput placeholder="ค้นหา" value={searchText} onChange={setSearchText} />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter> title="สถานะการใช้งาน" value={filters.status} onChange={(value) => updateFilter('status', value)} options={[{ label: 'ทั้งหมด', value: 'all' }, { label: 'ใช้งาน', value: 'active' }, { label: 'ปิดใช้งาน', value: 'inactive' }]} style={{ minWidth: 140 }} />
                                <ModalSelector<TableStateFilter> title="สถานะโต๊ะ" value={filters.table_state} onChange={(value) => updateFilter('table_state', value)} options={[{ label: 'ทุกสถานะ', value: 'all' }, { label: 'ว่าง', value: TableStatus.Available }, { label: 'ไม่ว่าง', value: TableStatus.Unavailable }]} style={{ minWidth: 140 }} />
                                <ModalSelector<CreatedSort> title="เรียงลำดับ" value={createdSort} onChange={setCreatedSort} options={[{ label: 'เก่าก่อน', value: 'old' }, { label: 'ใหม่ก่อน', value: 'new' }]} style={{ minWidth: 140 }} />
                            </Space>
                        </Space>
                    </SearchBar>
                    <PageSection title="รายการ QR โต๊ะ" extra={<Space size={8} wrap>{refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}<Text strong>{total} รายการ</Text></Space>}>
                        {loading && tables.length === 0 ? <PageState status="loading" /> : error && tables.length === 0 ? <PageState status="error" title="โหลดรายการ QR โต๊ะไม่สำเร็จ" error={error} onRetry={() => void fetchQrCodes()} /> : tables.length === 0 ? <UIEmptyState title={debouncedSearch.trim() ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีรายการโต๊ะ'} description={debouncedSearch.trim() ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เพิ่มโต๊ะในหน้าจัดการโต๊ะก่อน แล้วระบบจะสร้าง QR ให้โดยอัตโนมัติ'} /> : <Space direction="vertical" size={14} style={{ width: '100%' }}><div className="qr-cards-grid">{tables.map((table) => <TableQrCard key={table.id} table={table} customerUrl={buildCustomerUrl(table.customer_path)} canRotate={canRotateQr} rotating={rotatingId === table.id} exporting={exportingId === table.id} onOpen={handleOpenCustomerPage} onRotate={handleRotateQr} onExport={(target) => { const customerUrl = buildCustomerUrl(target.customer_path); if (!customerUrl) return void message.warning('ยังไม่มีลิงก์ลูกค้าสำหรับโต๊ะนี้'); setExportTargetTable(target); setExportFormat('pdf'); setIsExportModalOpen(true); }} onPreviewQr={setPreviewTable} />)}</div><div style={{ marginTop: 12 }}><ListPagination page={page} total={total} pageSize={pageSize} loading={loading || refreshing} onPageChange={setPage} onPageSizeChange={setPageSize} activeColor="#2563eb" /></div></Space>}
                    </PageSection>
                </PageStack>
            </PageContainer>
            <Modal title="ส่งออก QR Code" open={isExportModalOpen} onCancel={() => { setIsExportModalOpen(false); setExportTargetTable(null); }} onOk={() => { void handleConfirmExport(); }} okText="ตกลง" cancelText="ยกเลิก" confirmLoading={Boolean(exportTargetTable && exportingId === exportTargetTable.id)} destroyOnClose>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Text type="secondary">{exportTargetTable ? `โต๊ะ: ${exportTargetTable.table_name}` : 'เลือกรูปแบบไฟล์ที่ต้องการส่งออก'}</Text>
                    <Radio.Group value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)} style={{ width: '100%' }}>
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="pdf">PDF (เปิดหน้าพิมพ์หรือบันทึกเป็น PDF)</Radio>
                            <Radio value="png">PNG (ดาวน์โหลดรูป QR)</Radio>
                        </Space>
                    </Radio.Group>
                </Space>
            </Modal>
            <Modal title={`โต๊ะ ${previewTable?.table_name || ''}`} open={Boolean(previewTable)} onCancel={() => setPreviewTable(null)} footer={null} centered destroyOnClose styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' } }} width={400}>
                {previewTable?.customer_path ? <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}><DynamicQRCode value={buildCustomerUrl(previewTable.customer_path)} size={280} /></div> : null}
                <Text type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>ให้ลูกค้าสแกน QR Code นี้เพื่อเปิดเมนูและสั่งอาหาร</Text>
            </Modal>
        </div>
    );
}
