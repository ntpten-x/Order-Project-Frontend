'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Radio, Skeleton, Space, Tag, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, DownloadOutlined, LinkOutlined, QrcodeOutlined, ReloadOutlined, SyncOutlined, TableOutlined } from '@ant-design/icons';
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
import { buildBulkTableQrPngZipEntry, downloadBulkTableQrZip } from '../../../../utils/print-settings/tableQrBulkExport';
import { createTableQrPrintDocument, type TableQrPrintItem } from '../../../../utils/print-settings/tableQrPrintExport';
import { buildTableQrExportCanvas, downloadCanvasAsPng } from '../../../../utils/print-settings/tableQrExport';
import { takeawayQrService, type TakeawayQrInfo } from '../../../../services/pos/takeawayQr.service';
import { getBackendErrorMessage, unwrapBackendData } from '../../../../utils/api/backendResponse';

const { Text } = Typography;
const DEFAULT_PAGE_SIZE = 10;
const EXPORT_QR_CANVAS_SIZE = 2048;
const BULK_EXPORT_CANVAS_ID = 'table-qr-export-canvas-bulk';
const TAKEAWAY_EXPORT_CANVAS_ID = 'takeaway-qr-export-canvas';
const QR_TABLE_CACHE_KEY = 'pos:tables:qr:list:default-v1';
const QR_TABLE_CACHE_TTL_MS = 60 * 1000;
const pageGlobalStyles = `.qr-code-page{background:#f8fafc;min-height:100dvh;padding-bottom:96px}.qr-cards-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}.qr-table-card{border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.04);transition:transform .2s ease,box-shadow .2s ease}.qr-table-card:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(15,23,42,.08)}.qr-code-box{border:2px dashed #dbeafe;border-radius:16px;min-height:184px;display:flex;justify-content:center;align-items:center;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);padding:16px}.qr-code-box-clickable{cursor:pointer}.qr-code-box-clickable:hover{box-shadow:0 8px 24px rgba(37,99,235,.12);border-color:#60a5fa}@media (max-width:767px){.qr-code-page{padding-bottom:calc(108px + env(safe-area-inset-bottom))}.qr-cards-grid{grid-template-columns:1fr;gap:12px}}`;
const TAKEAWAY_QR_UI = {
    label: 'QR Code เธชเธฑเนเธเธเธฅเธฑเธ',
    exportLabel: 'Export',
    copyLinkLabel: 'Copy Link',
    openPageLabel: 'เนเธเธ—เธตเนเธซเธเนเธฒ',
    missingLinkWarning: 'เธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒ',
    loadError: 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เนเธซเธฅเธ” Takeaway QR เนเธ”เน',
    exportError: 'เธชเนเธเธญเธญเธ Takeaway QR เนเธกเนเธชเธณเน€เธฃเนเธ',
    openPdfSuccess: 'เน€เธเธดเธ”เธซเธเนเธฒ Takeaway QR PDF เนเธฅเนเธง',
    refreshLabel: 'Refresh',
};
const TABLE_QR_EXPORT_UI = {
    singleButtonLabel: 'Export',
    singleModalTitle: 'Export QR Code เนเธ•เนเธฐ',
    singleScopeDescription: 'เธเธฐเธชเนเธเธญเธญเธเน€เธเธเธฒเธฐ QR Code เธเธญเธเนเธ•เนเธฐเธ—เธตเนเน€เธฅเธทเธญเธเน€เธ—เนเธฒเธเธฑเนเธ',
    bulkButtonLabel: 'Export เธ—เธฑเนเธเธซเธกเธ” (เนเธ•เนเธฐ)',
    bulkModalTitle: 'Export เธ—เธฑเนเธเธซเธกเธ” (เนเธ•เนเธฐ)',
    bulkScopeDescription: 'เธฃเธฐเธเธเธเธฐเธชเนเธเธญเธญเธ QR Code เธเธญเธเธ—เธธเธเนเธ•เนเธฐเธ•เธฒเธกเธเธฅเธเธฒเธฃเธเนเธเธซเธฒเนเธฅเธฐเธ•เธฑเธงเธเธฃเธญเธเธเธฑเธเธเธธเธเธฑเธ',
};

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;
type ExportFormat = 'a4' | 'receipt' | 'png';
type BulkExportRenderTarget = { requestId: number; customerUrl: string };
type BulkExportProgress = { stage: string; current: number; total: number; skipped: number };
type PendingQrAutoPrint = { tableId: string; customerPath: string };
type QrCachePayload = { items: TableQrCodeListItem[]; total: number };

const formatDate = (value?: string | Date | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const getTableStatusLabel = (status: TableStatus) => status === TableStatus.Available ? 'เธงเนเธฒเธ' : 'เนเธกเนเธงเนเธฒเธ';
const toSafeFilename = (value: string) => value.replace(/[^\w\u0E00-\u0E7F-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'table';
const getCanvasId = (tableId: string) => `table-qr-export-canvas-${tableId}`;

function TableQrCard({ table, customerUrl, canRotate, rotating, exporting, onOpen, onRotate, onExport, onPreviewQr }: { table: TableQrCodeListItem; customerUrl: string; canRotate: boolean; rotating: boolean; exporting: boolean; onOpen: (table: TableQrCodeListItem) => void; onRotate: (table: TableQrCodeListItem) => void; onExport: (table: TableQrCodeListItem) => void; onPreviewQr: (table: TableQrCodeListItem) => void; }) {
    const hasQrUrl = Boolean(customerUrl);
    return (
        <article className="qr-table-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: table.table_name }}>เนเธ•เนเธฐ {table.table_name}</Text>
                </div>
                <Space size={6} wrap>
                    <Tag color={table.status === TableStatus.Available ? 'green' : 'orange'} style={{ margin: 0, borderRadius: 999 }}>{getTableStatusLabel(table.status)}</Tag>
                    <Tag color={table.is_active ? 'processing' : 'default'} style={{ margin: 0, borderRadius: 999 }}>{table.is_active ? 'เนเธเนเธเธฒเธ' : 'เธเธดเธ”เนเธเนเธเธฒเธ'}</Tag>
                </Space>
            </div>
            <div className={`qr-code-box ${hasQrUrl ? 'qr-code-box-clickable' : ''}`} onClick={() => hasQrUrl && onPreviewQr(table)}>
                {hasQrUrl ? <DynamicQRCode value={customerUrl} size={140} /> : <Text type="secondary">เธขเธฑเธเนเธกเนเธกเธต QR เธชเธณเธซเธฃเธฑเธเนเธ•เนเธฐเธเธตเน</Text>}
            </div>
            <Tooltip title={customerUrl || 'เธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒ'}>
                <Text type="secondary" style={{ fontSize: 12, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-all' }}>{customerUrl || '-'}</Text>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12 }}>เธซเธกเธ”เธญเธฒเธขเธธ: {formatDate(table.qr_code_expires_at)}</Text>
            <Space size={8} wrap>
                <Button icon={<LinkOutlined />} onClick={() => onOpen(table)} disabled={!hasQrUrl}>เนเธเธ—เธตเนเธซเธเนเธฒ</Button>
                <Button icon={<SyncOutlined spin={rotating} />} loading={rotating} disabled={!canRotate} onClick={() => onRotate(table)}>Refresh</Button>
                <Button icon={<DownloadOutlined />} loading={exporting} disabled={!hasQrUrl} onClick={() => onExport(table)}>{TABLE_QR_EXPORT_UI.singleButtonLabel}</Button>
            </Space>
            {hasQrUrl ? <div style={{ display: 'none' }}><DynamicQRCodeCanvas id={getCanvasId(table.id)} value={customerUrl} size={EXPORT_QR_CANVAS_SIZE} marginSize={0} /></div> : null}
        </article>
    );
}

export default function TableQrCodePage() {
    const router = useRouter();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canRotateQr = can('tables.page', 'update');
    const canOpenTakeawayQr = can('orders.page', 'create');
    const { page, setPage, pageSize, setPageSize, total, setTotal, searchText, setSearchText, debouncedSearch, createdSort, setCreatedSort, filters, updateFilter, getQueryParams, isUrlReady } = useListState({ defaultPageSize: DEFAULT_PAGE_SIZE, defaultFilters: { status: 'all' as StatusFilter, table_state: 'all' as TableStateFilter } });

    const [tables, setTables] = useState<TableQrCodeListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [rotatingId, setRotatingId] = useState<string | null>(null);
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('receipt');
    const [exportTargetTable, setExportTargetTable] = useState<TableQrCodeListItem | null>(null);
    const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
    const [bulkExportFormat, setBulkExportFormat] = useState<ExportFormat>('receipt');
    const [bulkExporting, setBulkExporting] = useState(false);
    const [bulkExportProgress, setBulkExportProgress] = useState<BulkExportProgress | null>(null);
    const [bulkRenderTarget, setBulkRenderTarget] = useState<BulkExportRenderTarget | null>(null);
    const [previewTable, setPreviewTable] = useState<TableQrCodeListItem | null>(null);
    const [isTakeawayQrModalOpen, setIsTakeawayQrModalOpen] = useState(false);
    const [isTakeawayQrLoading, setIsTakeawayQrLoading] = useState(false);
    const [isTakeawayQrRefreshing, setIsTakeawayQrRefreshing] = useState(false);
    const [isTakeawayQrExportModalOpen, setIsTakeawayQrExportModalOpen] = useState(false);
    const [takeawayQrExportFormat, setTakeawayQrExportFormat] = useState<ExportFormat>('receipt');
    const [isTakeawayQrExporting, setIsTakeawayQrExporting] = useState(false);
    const [takeawayQr, setTakeawayQr] = useState<TakeawayQrInfo | null>(null);
    const [csrfToken, setCsrfToken] = useState('');
    const [pendingAutoPrint, setPendingAutoPrint] = useState<PendingQrAutoPrint | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const autoPrintWindowRef = useRef<Window | null>(null);
    const bulkExportWindowRef = useRef<Window | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const bulkRenderRequestIdRef = useRef(0);
    const bulkRenderResolverRef = useRef<{
        requestId: number;
        resolve: (dataUrl: string) => void;
        reject: (error: Error) => void;
    } | null>(null);
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
    const takeawayCustomerUrl = useMemo(() => buildCustomerUrl(takeawayQr?.customer_path), [buildCustomerUrl, takeawayQr?.customer_path]);
    const takeawayLabel = useMemo(() => takeawayQr?.shop_name?.trim() || 'Takeaway', [takeawayQr?.shop_name]);
    const takeawayQrHeading = TAKEAWAY_QR_UI.label;
    const takeawayQrSubtitle = 'เธชเนเธเธเธเธดเธงเธญเธฒเธฃเนเนเธเนเธ”เธเธตเนเน€เธเธทเนเธญเธชเธฑเนเธเธญเธฒเธซเธฒเธฃ';
    const takeawayQrDocumentTitle = useMemo(() => `${TAKEAWAY_QR_UI.label} ${takeawayLabel}`, [takeawayLabel]);
    const takeawayQrRenderKey = takeawayQr?.token || takeawayCustomerUrl || 'takeaway-qr';

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

    const waitForNextFrame = useCallback(
        () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())),
        []
    );

    useEffect(() => {
        if (!bulkRenderTarget) return;
        const pendingRequest = bulkRenderResolverRef.current;
        if (!pendingRequest || pendingRequest.requestId !== bulkRenderTarget.requestId) return;

        let cancelled = false;
        const resolveBulkCanvas = async () => {
            try {
                for (let attempt = 0; attempt < 60; attempt += 1) {
                    await waitForNextFrame();
                    const canvas = document.getElementById(BULK_EXPORT_CANVAS_ID) as HTMLCanvasElement | null;
                    if (!canvas) continue;
                    const dataUrl = canvas.toDataURL('image/png');
                    if (dataUrl && dataUrl !== 'data:,') {
                        if (!cancelled && bulkRenderResolverRef.current?.requestId === bulkRenderTarget.requestId) {
                            bulkRenderResolverRef.current.resolve(dataUrl);
                            bulkRenderResolverRef.current = null;
                            setBulkRenderTarget(null);
                        }
                        return;
                    }
                }
                throw new Error('QR image is not ready for bulk export');
            } catch (error) {
                if (!cancelled && bulkRenderResolverRef.current?.requestId === bulkRenderTarget.requestId) {
                    bulkRenderResolverRef.current.reject(error instanceof Error ? error : new Error('Bulk QR export failed'));
                    bulkRenderResolverRef.current = null;
                    setBulkRenderTarget(null);
                }
            }
        };

        void resolveBulkCanvas();
        return () => {
            cancelled = true;
        };
    }, [bulkRenderTarget, waitForNextFrame]);

    const captureBulkRenderedQr = useCallback((customerUrl: string) => {
        return new Promise<string>((resolve, reject) => {
            bulkRenderRequestIdRef.current += 1;
            const requestId = bulkRenderRequestIdRef.current;
            bulkRenderResolverRef.current?.reject(new Error('Bulk QR export request was replaced'));
            bulkRenderResolverRef.current = { requestId, resolve, reject };
            setBulkRenderTarget({ requestId, customerUrl });
        });
    }, []);

    useEffect(() => { getCsrfTokenCached().then(setCsrfToken).catch(() => setCsrfToken('')); }, []);
    useEffect(() => { primePrintResources(); }, []);
    useEffect(() => () => {
        requestRef.current?.abort();
        closePrintWindow(autoPrintWindowRef.current);
        autoPrintWindowRef.current = null;
        closePrintWindow(bulkExportWindowRef.current);
        bulkExportWindowRef.current = null;
        bulkRenderResolverRef.current?.reject(new Error('Bulk QR export was cancelled'));
        bulkRenderResolverRef.current = null;
    }, []);
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

    const fetchAllTablesForBulkExport = useCallback(async () => {
        if (tables.length === total && total > 0) {
            return tables;
        }

        const params = getQueryParams();
        params.set('page', '1');
        params.set('limit', String(Math.max(total || 0, pageSize, 200)));

        const collected: TableQrCodeListItem[] = [];
        let currentPage = 1;
        let lastPage = 1;

        while (currentPage <= lastPage) {
            params.set('page', String(currentPage));
            const response = await fetch(`/api/pos/tables/qr-codes?${params.toString()}`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃ QR เธชเธณเธซเธฃเธฑเธ export เธ—เธฑเนเธเธซเธกเธ”เนเธ”เน');
            }
            const payload = await response.json();
            const items = Array.isArray(payload.data) ? payload.data as TableQrCodeListItem[] : [];
            collected.push(...items);
            lastPage = Math.max(1, Number(payload.last_page) || 1);
            currentPage += 1;
        }

        const seen = new Set<string>();
        return collected.filter((table) => {
            if (!table?.id || seen.has(table.id)) return false;
            seen.add(table.id);
            return true;
        });
    }, [getQueryParams, pageSize, tables, total]);

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
                throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃ QR เนเธ•เนเธฐเนเธ”เน');
            }
            const payload = await response.json();
            if (controller.signal.aborted) return;
            setTables(payload.data || []);
            setTotal(payload.total || 0);
        } catch (fetchError) {
            if (controller.signal.aborted) return;
            closePrintWindow(autoPrintWindowRef.current);
            autoPrintWindowRef.current = null;
            setError(fetchError instanceof Error ? fetchError : new Error('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ”เธถเธเธฃเธฒเธขเธเธฒเธฃ QR เนเธ•เนเธฐเนเธ”เน'));
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
                if (!customerUrl) throw new Error('เนเธกเนเธเธเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒเธชเธณเธซเธฃเธฑเธเธเธดเธกเธเน QR');
                const qrImageDataUrl = await captureCanvasImage(getCanvasId(targetTable.id));
                if (cancelled) return;
                await printTableQrDocument({ tableName: targetTable.table_name, customerUrl, qrImageDataUrl, qrCodeExpiresAt: targetTable.qr_code_expires_at, settings: printSettings, targetWindow: autoPrintWindowRef.current });
            } catch (printError) {
                closePrintWindow(autoPrintWindowRef.current);
                message.error(printError instanceof Error ? printError.message : 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเน QR เนเธกเนเธชเธณเน€เธฃเนเธ');
            } finally {
                if (!cancelled) { autoPrintWindowRef.current = null; setPendingAutoPrint(null); }
            }
        };
        void runAutoPrint();
        return () => { cancelled = true; };
    }, [buildCustomerUrl, captureCanvasImage, pendingAutoPrint, tables]);

    const handleOpenCustomerPage = useCallback((table: TableQrCodeListItem) => {
        const customerUrl = buildCustomerUrl(table.customer_path);
        if (!customerUrl) return message.warning('เธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธชเธณเธซเธฃเธฑเธเนเธ•เนเธฐเธเธตเน');
        window.open(customerUrl, '_blank', 'noopener,noreferrer');
    }, [buildCustomerUrl]);

    const handleRotateQr = useCallback(async (table: TableQrCodeListItem) => {
        if (!canRotateQr) return void message.error('เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเน Refresh QR');
        const cachedPrintSettings = peekPrintSettings();
        const shouldPrepareAutoPrint = !cachedPrintSettings || cachedPrintSettings.automation.auto_print_table_qr_after_rotation;
        closePrintWindow(autoPrintWindowRef.current);
        autoPrintWindowRef.current = shouldPrepareAutoPrint ? reservePrintWindow(`Table QR ${table.table_name}`) : null;
        setRotatingId(table.id);
        try {
            const response = await fetch(`/api/pos/tables/${table.id}/qr/rotate`, { method: 'POST', headers: { 'X-CSRF-Token': csrfToken || await getCsrfTokenCached() } });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ– Refresh QR เนเธ”เน');
            }
            const payload = await response.json() as TableQrInfo;
            setTables((prev) => prev.map((row) => row.id === table.id ? { ...row, qr_code_token: payload.qr_code_token, qr_code_expires_at: payload.qr_code_expires_at, customer_path: payload.customer_path, update_date: new Date().toISOString() } : row));
            if (shouldPrepareAutoPrint && payload.customer_path) setPendingAutoPrint({ tableId: table.id, customerPath: payload.customer_path }); else { closePrintWindow(autoPrintWindowRef.current); autoPrintWindowRef.current = null; }
            message.success(`Refresh QR เธเธญเธเนเธ•เนเธฐ ${table.table_name} เธชเธณเน€เธฃเนเธ`);
        } catch (rotateError) {
            closePrintWindow(autoPrintWindowRef.current);
            autoPrintWindowRef.current = null;
            message.error(rotateError instanceof Error ? rotateError.message : 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ– Refresh QR เนเธ”เน');
        } finally {
            setRotatingId(null);
        }
    }, [canRotateQr, csrfToken]);

    const buildStandardExportCanvas = useCallback(async (options: {
        tableName: string;
        customerUrl: string;
        qrImageDataUrl: string;
        qrCodeExpiresAt?: string | null;
        printSettings: Awaited<ReturnType<typeof getPrintSettings>>;
        heading?: string;
        subtitle?: string;
    }) => {
        const setting = options.printSettings.documents.table_qr;
        return buildTableQrExportCanvas({
            tableName: options.tableName,
            customerUrl: options.customerUrl,
            qrImageDataUrl: options.qrImageDataUrl,
            qrCodeExpiresAt: options.qrCodeExpiresAt,
            setting,
            locale: options.printSettings.locale,
            heading: options.heading,
            subtitle: options.subtitle,
        });
    }, []);

    const openQrPrintExport = useCallback(async (options: {
        items: TableQrPrintItem[];
        mode: Exclude<ExportFormat, 'png'>;
        printSettings: Awaited<ReturnType<typeof getPrintSettings>>;
        filenameBase: string;
        documentTitle: string;
        targetWindow?: Window | null;
        a4Layout?: 'grid4' | 'single';
    }) => {
        const targetWindow = options.targetWindow ?? reservePrintWindow(options.documentTitle);
        try {
            const document = await createTableQrPrintDocument({
                items: options.items,
                mode: options.mode,
                baseSetting: options.printSettings.documents.table_qr,
                locale: options.printSettings.locale,
                a4Layout: options.a4Layout,
            });

            if (!targetWindow) {
                throw new Error('Popup blocked. Please allow popups to print.');
            }

            document.openInWindow(targetWindow, {
                filename: `${options.filenameBase}-${options.mode}.pdf`,
                title: options.documentTitle,
            });
            return 'window' as const;
        } catch (error) {
            closePrintWindow(targetWindow);
            throw error;
        }
    }, []);

    const handleConfirmExport = useCallback(async () => {
        if (!exportTargetTable) return;
        const customerUrl = buildCustomerUrl(exportTargetTable.customer_path);
        if (!customerUrl) return void message.warning('เธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒเธชเธณเธซเธฃเธฑเธเนเธ•เนเธฐเธเธตเน');
        setExportingId(exportTargetTable.id);
        let reservedPrintWindow: Window | null = null;
        try {
            if (exportFormat !== 'png') {
                reservedPrintWindow = reservePrintWindow(`Table QR ${exportTargetTable.table_name}`);
            }
            const printSettings = await getPrintSettings();
            const qrImageDataUrl = await captureCanvasImage(getCanvasId(exportTargetTable.id));
            if (exportFormat === 'png') {
                const exportCanvas = await buildStandardExportCanvas({
                    tableName: exportTargetTable.table_name,
                    customerUrl,
                    qrImageDataUrl,
                    qrCodeExpiresAt: exportTargetTable.qr_code_expires_at,
                    printSettings,
                });
                downloadCanvasAsPng(exportCanvas, `table-qr-${toSafeFilename(exportTargetTable.table_name)}.png`);
                message.success('เธ”เธฒเธงเธเนเนเธซเธฅเธ” PNG เธชเธณเน€เธฃเนเธ');
            } else {
                const result = await openQrPrintExport({
                    items: [{
                        tableName: exportTargetTable.table_name,
                        customerUrl,
                        qrImageDataUrl,
                        qrCodeExpiresAt: exportTargetTable.qr_code_expires_at,
                    }],
                    mode: exportFormat,
                    printSettings,
                    filenameBase: `table-qr-${toSafeFilename(exportTargetTable.table_name)}`,
                    documentTitle: `Table QR ${exportTargetTable.table_name}`,
                    targetWindow: reservedPrintWindow,
                });
                reservedPrintWindow = null;
                /* legacy export path replaced
                    ? exportFormat === 'a4'
                    message.success('เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF เธชเธณเน€เธฃเนเธ');
                } else {
                    try {
                        await printTableQrDocument({ tableName: exportTargetTable.table_name, customerUrl, qrImageDataUrl, qrCodeExpiresAt: exportTargetTable.qr_code_expires_at, settings: printSettings, targetWindow });
                        message.success('เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเน PDF เนเธฅเนเธง');
                    } catch (printError) {
                        closePrintWindow(targetWindow);
                        throw printError;
                    }
                }
            }
            */
            message.success(result === 'window'
                ? exportFormat === 'a4'
                    ? 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเน A4 เนเธฅเนเธง'
                    : 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเนเธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเนเธฅเนเธง'
                : exportFormat === 'a4'
                    ? 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF A4 เธชเธณเน€เธฃเนเธ'
                    : 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเธชเธณเน€เธฃเนเธ');
            }
            setIsExportModalOpen(false);
            setExportTargetTable(null);
        } catch (exportError) {
            closePrintWindow(reservedPrintWindow);
            message.error(exportError instanceof Error ? exportError.message : 'เธชเนเธเธญเธญเธเนเธเธฅเนเนเธกเนเธชเธณเน€เธฃเนเธ');
        } finally {
            setExportingId(null);
        }
    }, [buildCustomerUrl, buildStandardExportCanvas, captureCanvasImage, exportFormat, exportTargetTable, openQrPrintExport]);

    const readTakeawayQrResponse = useCallback(async (response: Response, fallback: string) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(getBackendErrorMessage(payload, fallback));
        }
        return unwrapBackendData(payload) as TakeawayQrInfo;
    }, []);

    const handleOpenTakeawayQrModal = useCallback(async () => {
        setIsTakeawayQrModalOpen(true);
        if (takeawayQr) return;

        setIsTakeawayQrLoading(true);
        try {
            const info = await takeawayQrService.getInfo();
            setTakeawayQr(info);
        } catch (error) {
            message.error(error instanceof Error ? error.message : TAKEAWAY_QR_UI.loadError);
        } finally {
            setIsTakeawayQrLoading(false);
        }
    }, [takeawayQr]);

    const handleRefreshTakeawayQr = useCallback(async () => {
        setIsTakeawayQrRefreshing(true);
        try {
            const rotateTakeawayQr = async (forceRefreshCsrf = false): Promise<TakeawayQrInfo> => {
                const nextCsrfToken = await getCsrfTokenCached(forceRefreshCsrf);
                if (nextCsrfToken && nextCsrfToken !== csrfToken) {
                    setCsrfToken(nextCsrfToken);
                }

                const response = await fetch('/api/pos/takeaway-qr/rotate', {
                    method: 'POST',
                    cache: 'no-store',
                    credentials: 'include',
                    headers: nextCsrfToken ? { 'X-CSRF-Token': nextCsrfToken } : undefined,
                });

                if (response.status === 403 && !forceRefreshCsrf) {
                    return rotateTakeawayQr(true);
                }

                return readTakeawayQrResponse(response, 'Refresh takeaway QR failed');
            };

            const info = await rotateTakeawayQr();
            setTakeawayQr(info);
            message.success('Refresh takeaway QR เธชเธณเน€เธฃเนเธ');
        } catch (error) {
            message.error(error instanceof Error ? error.message : 'Refresh takeaway QR เนเธกเนเธชเธณเน€เธฃเนเธ');
        } finally {
            setIsTakeawayQrRefreshing(false);
        }
    }, [csrfToken, readTakeawayQrResponse]);

    const handleCopyTakeawayQrLink = useCallback(async () => {
        if (!takeawayCustomerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        try {
            await navigator.clipboard.writeText(takeawayCustomerUrl);
            message.success('เธเธฑเธ”เธฅเธญเธเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒเนเธฅเนเธง');
        } catch {
            message.error('เธเธฑเธ”เธฅเธญเธเธฅเธดเธเธเนเนเธกเนเธชเธณเน€เธฃเนเธ');
        }
    }, [takeawayCustomerUrl]);

    const handleOpenTakeawayCustomerPage = useCallback(() => {
        if (!takeawayCustomerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        window.open(takeawayCustomerUrl, '_blank', 'noopener,noreferrer');
    }, [takeawayCustomerUrl]);

    const buildTakeawayExportSource = useCallback(async () => {
        if (!takeawayCustomerUrl) throw new Error('No takeaway QR link available');

        const printSettings = await getPrintSettings();
        const qrImageDataUrl = await captureCanvasImage(TAKEAWAY_EXPORT_CANVAS_ID);

        return { printSettings, qrImageDataUrl };
    }, [captureCanvasImage, takeawayCustomerUrl]);

    const handleOpenTakeawayExportModal = useCallback(() => {
        if (!takeawayCustomerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        setTakeawayQrExportFormat('receipt');
        setIsTakeawayQrExportModalOpen(true);
    }, [takeawayCustomerUrl]);

    const handleConfirmTakeawayExport = useCallback(async () => {
        if (!takeawayCustomerUrl) {
            message.warning(TAKEAWAY_QR_UI.missingLinkWarning);
            return;
        }

        setIsTakeawayQrExporting(true);
        let reservedPrintWindow: Window | null = null;
        try {
            if (takeawayQrExportFormat !== 'png') {
                reservedPrintWindow = reservePrintWindow(takeawayQrDocumentTitle);
            }
            const { printSettings, qrImageDataUrl } = await buildTakeawayExportSource();
            const filenameBase = `takeaway-qr-${toSafeFilename(takeawayLabel)}`;

            if (takeawayQrExportFormat === 'png') {
                const exportCanvas = await buildStandardExportCanvas({
                    tableName: takeawayLabel,
                    customerUrl: takeawayCustomerUrl,
                    qrImageDataUrl,
                    qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                    printSettings,
                    heading: takeawayQrHeading,
                    subtitle: takeawayQrSubtitle,
                });
                downloadCanvasAsPng(exportCanvas, `${filenameBase}.png`);
                message.success('เธ”เธฒเธงเธเนเนเธซเธฅเธ” PNG เธชเธณเน€เธฃเนเธ');
            } else {
                const result = await openQrPrintExport({
                    items: [{
                        tableName: takeawayLabel,
                        customerUrl: takeawayCustomerUrl,
                        qrImageDataUrl,
                        qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                        heading: takeawayQrHeading,
                        subtitle: takeawayQrSubtitle,
                    }],
                    mode: takeawayQrExportFormat,
                    printSettings,
                    filenameBase,
                    documentTitle: takeawayQrDocumentTitle,
                    targetWindow: reservedPrintWindow,
                    a4Layout: takeawayQrExportFormat === 'a4' ? 'single' : undefined,
                });
                reservedPrintWindow = null;
                /* legacy takeaway export path replaced
                    message.success('เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF เธชเธณเน€เธฃเนเธ');
                } else {
                    try {
                        await printTableQrDocument({
                            tableName: takeawayLabel,
                            customerUrl: takeawayCustomerUrl,
                            qrImageDataUrl,
                            qrCodeExpiresAt: takeawayQr?.qr_code_expires_at,
                            settings: printSettings,
                            targetWindow,
                            documentTitle: takeawayQrDocumentTitle,
                            heading: takeawayQrHeading,
                            subtitle: takeawayQrSubtitle,
                            qrAltText: takeawayQrAltText,
                        });
                        message.success(TAKEAWAY_QR_UI.openPdfSuccess);
                    } catch (error) {
                        closePrintWindow(targetWindow);
                        throw error;
                    }
                }
            }

            */
            message.success(result === 'window'
                ? takeawayQrExportFormat === 'a4'
                    ? 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเน A4 เนเธฅเนเธง'
                    : 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเนเธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเนเธฅเนเธง'
                : takeawayQrExportFormat === 'a4'
                    ? 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF A4 เธชเธณเน€เธฃเนเธ'
                    : 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเธชเธณเน€เธฃเนเธ');
            }
            setIsTakeawayQrExportModalOpen(false);
        } catch (error) {
            closePrintWindow(reservedPrintWindow);
            message.error(error instanceof Error ? error.message : TAKEAWAY_QR_UI.exportError);
        } finally {
            setIsTakeawayQrExporting(false);
        }
    }, [buildStandardExportCanvas, buildTakeawayExportSource, openQrPrintExport, takeawayCustomerUrl, takeawayLabel, takeawayQr?.qr_code_expires_at, takeawayQrDocumentTitle, takeawayQrExportFormat, takeawayQrHeading, takeawayQrSubtitle]);

    const handleOpenSingleTableExportModal = useCallback((target: TableQrCodeListItem) => {
        const customerUrl = buildCustomerUrl(target.customer_path);
        if (!customerUrl) {
            message.warning('เธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒเธชเธณเธซเธฃเธฑเธเนเธ•เนเธฐเธเธตเน');
            return;
        }

        setExportTargetTable(target);
        setExportFormat('receipt');
        setIsExportModalOpen(true);
    }, [buildCustomerUrl]);

    const handleOpenBulkExportModal = useCallback(() => {
        setBulkExportFormat('receipt');
        setBulkExportProgress(null);
        setIsBulkExportModalOpen(true);
    }, []);

    const handleConfirmBulkExport = useCallback(async () => {
        if (bulkExporting) return;

        setBulkExporting(true);
        setBulkExportProgress({ stage: 'เธเธณเธฅเธฑเธเน€เธ•เธฃเธตเธขเธกเธฃเธฒเธขเธเธฒเธฃ QR เธ—เธฑเนเธเธซเธกเธ”', current: 0, total: 0, skipped: 0 });
        closePrintWindow(bulkExportWindowRef.current);
        bulkExportWindowRef.current = bulkExportFormat !== 'png' ? reservePrintWindow('Table QR Export All') : null;

        try {
            const [sourceTables, printSettings] = await Promise.all([
                fetchAllTablesForBulkExport(),
                getPrintSettings(),
            ]);

            const exportEntries = sourceTables
                .map((table) => {
                    const customerUrl = buildCustomerUrl(table.customer_path);
                    return customerUrl ? { table, customerUrl } : null;
                })
                .filter((entry): entry is { table: TableQrCodeListItem; customerUrl: string } => Boolean(entry));

            const skippedCount = Math.max(0, sourceTables.length - exportEntries.length);
            if (!exportEntries.length) {
                throw new Error('เนเธกเนเธเธ QR เธ—เธตเนเธเธฃเนเธญเธกเธชเนเธเธญเธญเธเธ•เธฒเธกเธ•เธฑเธงเธเธฃเธญเธเธเธฑเธเธเธธเธเธฑเธ');
            }

            const setting = printSettings.documents.table_qr;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filenameBase = `table-qr-all-${timestamp}`;
            const fileNameCounts = new Map<string, number>();
            const printItems: TableQrPrintItem[] = [];
            const zipFiles: Record<string, Uint8Array> = {};

            for (let index = 0; index < exportEntries.length; index += 1) {
                const entry = exportEntries[index];
                setBulkExportProgress({
                    stage: 'เธเธณเธฅเธฑเธเธชเธฃเนเธฒเธเนเธเธฅเน QR',
                    current: index + 1,
                    total: exportEntries.length,
                    skipped: skippedCount,
                });

                const qrImageDataUrl = await captureBulkRenderedQr(entry.customerUrl);
                if (bulkExportFormat === 'png') {
                    const exportCanvas = await buildTableQrExportCanvas({
                        tableName: entry.table.table_name,
                        customerUrl: entry.customerUrl,
                        qrImageDataUrl,
                        qrCodeExpiresAt: entry.table.qr_code_expires_at,
                        setting,
                        locale: printSettings.locale,
                    });
                    const safeBaseName = `table-qr-${toSafeFilename(entry.table.table_name)}`;
                    const nextIndex = (fileNameCounts.get(safeBaseName) || 0) + 1;
                    fileNameCounts.set(safeBaseName, nextIndex);
                    const resolvedBaseName = nextIndex === 1 ? safeBaseName : `${safeBaseName}-${nextIndex}`;
                    zipFiles[`${resolvedBaseName}.png`] = await buildBulkTableQrPngZipEntry(exportCanvas);
                } else {
                    printItems.push({
                        tableName: entry.table.table_name,
                        customerUrl: entry.customerUrl,
                        qrImageDataUrl,
                        qrCodeExpiresAt: entry.table.qr_code_expires_at,
                    });
                }

                await waitForNextFrame();
            }

            if (bulkExportFormat !== 'png') {
                setBulkExportProgress({
                    stage: 'เธเธณเธฅเธฑเธเธฃเธงเธกเนเธเธฅเน PDF',
                    current: exportEntries.length,
                    total: exportEntries.length,
                    skipped: skippedCount,
                });
                const result = await openQrPrintExport({
                    items: printItems,
                    mode: bulkExportFormat,
                    printSettings,
                    filenameBase,
                    documentTitle: 'Table QR Export All',
                    targetWindow: bulkExportWindowRef.current,
                });
                bulkExportWindowRef.current = null;
                message.success(
                    result === 'window'
                        ? bulkExportFormat === 'a4'
                            ? 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเน A4 เนเธฅเนเธง'
                            : 'เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเนเธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเนเธฅเนเธง'
                        : bulkExportFormat === 'a4'
                            ? 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF A4 เธชเธณเน€เธฃเนเธ'
                            : 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” PDF เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธเธชเธณเน€เธฃเนเธ'
                );
            } else {
                setBulkExportProgress({
                    stage: 'เธเธณเธฅเธฑเธเธเธตเธเธญเธฑเธ” ZIP',
                    current: exportEntries.length,
                    total: exportEntries.length,
                    skipped: skippedCount,
                });
                downloadBulkTableQrZip(zipFiles, `${filenameBase}.zip`);
            }

            message.success(
                skippedCount > 0
                    ? `เธชเนเธเธญเธญเธ QR เธชเธณเน€เธฃเนเธ ${exportEntries.length} เธฃเธฒเธขเธเธฒเธฃ เนเธฅเธฐเธเนเธฒเธก ${skippedCount} เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธขเธฑเธเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒ`
                    : `เธชเนเธเธญเธญเธ QR เธชเธณเน€เธฃเนเธ ${exportEntries.length} เธฃเธฒเธขเธเธฒเธฃ`
            );
            setIsBulkExportModalOpen(false);
        } catch (bulkExportError) {
            closePrintWindow(bulkExportWindowRef.current);
            bulkExportWindowRef.current = null;
            message.error(bulkExportError instanceof Error ? bulkExportError.message : 'เธชเนเธเธญเธญเธ QR เธ—เธฑเนเธเธซเธกเธ”เนเธกเนเธชเธณเน€เธฃเนเธ');
        } finally {
            setBulkExporting(false);
            setBulkExportProgress(null);
            setBulkRenderTarget(null);
        }
    }, [bulkExportFormat, bulkExporting, buildCustomerUrl, captureBulkRenderedQr, fetchAllTablesForBulkExport, openQrPrintExport, waitForNextFrame]);

    if (isChecking) return <AccessGuardFallback message="เธเธณเธฅเธฑเธเธ•เธฃเธงเธเธชเธญเธเธชเธดเธ—เธเธดเนเธเธฒเธฃเนเธเนเธเธฒเธ..." />;
    if (!isAuthorized) return <AccessGuardFallback message="เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเธซเธเนเธฒเธเธตเน เธเธณเธฅเธฑเธเธเธฒเธเธฅเธฑเธ..." tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธชเธดเธ—เธเธดเนเธเธนเนเนเธเนเธเธฒเธ..." />;

    return (
        <div className="qr-code-page">
            <style>{pageGlobalStyles}</style>
            <UIPageHeader
                title="QR Code เธชเธฑเนเธเธญเธฒเธซเธฒเธฃ"
                icon={<QrcodeOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchQrCodes({ background: tables.length > 0 })}></Button>
                        {canOpenTakeawayQr ? (
                            <Button icon={<QrcodeOutlined />} onClick={() => void handleOpenTakeawayQrModal()} style={{ borderRadius: 12, fontWeight: 700 }}>
                                {TAKEAWAY_QR_UI.label}
                            </Button>
                        ) : null}
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleOpenBulkExportModal}
                            disabled={loading || refreshing || total === 0 || bulkExporting}
                        >
                            {TABLE_QR_EXPORT_UI.bulkButtonLabel}
                        </Button>
                        <Button icon={<TableOutlined />} onClick={() => router.push('/pos/tables')}>เธเธฑเธ”เธเธฒเธฃเนเธ•เนเธฐ</Button>
                    </Space>
                }
            />
            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput placeholder="เธเนเธเธซเธฒ" value={searchText} onChange={setSearchText} />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter> title="เธชเธ–เธฒเธเธฐเธเธฒเธฃเนเธเนเธเธฒเธ" value={filters.status} onChange={(value) => updateFilter('status', value)} options={[{ label: 'เธ—เธฑเนเธเธซเธกเธ”', value: 'all' }, { label: 'เนเธเนเธเธฒเธ', value: 'active' }, { label: 'เธเธดเธ”เนเธเนเธเธฒเธ', value: 'inactive' }]} style={{ minWidth: 140 }} />
                                <ModalSelector<TableStateFilter> title="เธชเธ–เธฒเธเธฐเนเธ•เนเธฐ" value={filters.table_state} onChange={(value) => updateFilter('table_state', value)} options={[{ label: 'เธ—เธธเธเธชเธ–เธฒเธเธฐ', value: 'all' }, { label: 'เธงเนเธฒเธ', value: TableStatus.Available }, { label: 'เนเธกเนเธงเนเธฒเธ', value: TableStatus.Unavailable }]} style={{ minWidth: 140 }} />
                                <ModalSelector<CreatedSort> title="เน€เธฃเธตเธขเธเธฅเธณเธ”เธฑเธ" value={createdSort} onChange={setCreatedSort} options={[{ label: 'เน€เธเนเธฒเธเนเธญเธ', value: 'old' }, { label: 'เนเธซเธกเนเธเนเธญเธ', value: 'new' }]} style={{ minWidth: 140 }} />
                            </Space>
                        </Space>
                    </SearchBar>
                    <PageSection title="เธฃเธฒเธขเธเธฒเธฃ QR เนเธ•เนเธฐ" extra={<Space size={8} wrap>{refreshing ? <Tag color="processing">เธเธณเธฅเธฑเธเธญเธฑเธเน€เธ”เธ•เธเนเธญเธกเธนเธฅ</Tag> : null}<Text strong>{total} เธฃเธฒเธขเธเธฒเธฃ</Text></Space>}>
                        {loading && tables.length === 0 ? <PageState status="loading" /> : error && tables.length === 0 ? <PageState status="error" title="เนเธซเธฅเธ”เธฃเธฒเธขเธเธฒเธฃ QR เนเธ•เนเธฐเนเธกเนเธชเธณเน€เธฃเนเธ" error={error} onRetry={() => void fetchQrCodes()} /> : tables.length === 0 ? <UIEmptyState title={debouncedSearch.trim() ? 'เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธ—เธตเนเธเนเธเธซเธฒ' : 'เธขเธฑเธเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเนเธ•เนเธฐ'} description={debouncedSearch.trim() ? 'เธฅเธญเธเน€เธเธฅเธตเนเธขเธเธเธณเธเนเธเธซเธฒเธซเธฃเธทเธญเธ•เธฑเธงเธเธฃเธญเธ' : 'เน€เธเธดเนเธกเนเธ•เนเธฐเนเธเธซเธเนเธฒเธเธฑเธ”เธเธฒเธฃเนเธ•เนเธฐเธเนเธญเธ เนเธฅเนเธงเธฃเธฐเธเธเธเธฐเธชเธฃเนเธฒเธ QR เนเธซเนเนเธ”เธขเธญเธฑเธ•เนเธเธกเธฑเธ•เธด'} /> : <Space direction="vertical" size={14} style={{ width: '100%' }}><div className="qr-cards-grid">{tables.map((table) => <TableQrCard key={table.id} table={table} customerUrl={buildCustomerUrl(table.customer_path)} canRotate={canRotateQr} rotating={rotatingId === table.id} exporting={exportingId === table.id} onOpen={handleOpenCustomerPage} onRotate={handleRotateQr} onExport={handleOpenSingleTableExportModal} onPreviewQr={setPreviewTable} />)}</div><div style={{ marginTop: 12 }}><ListPagination page={page} total={total} pageSize={pageSize} loading={loading || refreshing} onPageChange={setPage} onPageSizeChange={setPageSize} activeColor="#2563eb" /></div></Space>}
                    </PageSection>
                </PageStack>
            </PageContainer>
            <Modal
                title={<div style={{ textAlign: 'center', width: '100%', paddingRight: 32 }}>{TAKEAWAY_QR_UI.label}</div>}
                open={isTakeawayQrModalOpen}
                onCancel={() => setIsTakeawayQrModalOpen(false)}
                footer={
                    <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
                        <Button icon={<SyncOutlined spin={isTakeawayQrRefreshing} />} onClick={() => void handleRefreshTakeawayQr()} loading={isTakeawayQrRefreshing} disabled={isTakeawayQrLoading}>
                            {TAKEAWAY_QR_UI.refreshLabel}
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={() => void handleOpenTakeawayExportModal()} disabled={!takeawayCustomerUrl}>
                            {TAKEAWAY_QR_UI.exportLabel}
                        </Button>
                        <Button icon={<CopyOutlined />} onClick={() => void handleCopyTakeawayQrLink()} disabled={!takeawayCustomerUrl}>
                            {TAKEAWAY_QR_UI.copyLinkLabel}
                        </Button>
                        <Button icon={<LinkOutlined />} onClick={handleOpenTakeawayCustomerPage} disabled={!takeawayCustomerUrl}>
                            {TAKEAWAY_QR_UI.openPageLabel}
                        </Button>
                    </Space>
                }
                centered
                destroyOnClose={false}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div
                        style={{
                            background: '#fff',
                            padding: 20,
                            borderRadius: 18,
                            border: '1px solid #E2E8F0',
                            minHeight: 300,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {isTakeawayQrLoading ? (
                            <Skeleton active paragraph={{ rows: 6 }} style={{ width: '100%' }} />
                        ) : takeawayCustomerUrl ? (
                            <DynamicQRCode key={takeawayQrRenderKey} value={takeawayCustomerUrl} size={260} />
                        ) : (
                            <Text type="secondary">เธขเธฑเธเนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธชเธฃเนเธฒเธ QR เนเธ”เน</Text>
                        )}
                    </div>
                    {takeawayCustomerUrl ? <Text style={{ wordBreak: 'break-all' }}>{takeawayCustomerUrl}</Text> : null}
                </div>
            </Modal>
            <Modal title={TABLE_QR_EXPORT_UI.singleModalTitle} open={isExportModalOpen} onCancel={() => { setIsExportModalOpen(false); setExportTargetTable(null); }} onOk={() => { void handleConfirmExport(); }} okText="เธเธดเธกเธเน" cancelText="เธขเธเน€เธฅเธดเธ" confirmLoading={Boolean(exportTargetTable && exportingId === exportTargetTable.id)} destroyOnClose>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Text type="secondary">{exportTargetTable ? `เนเธ•เนเธฐ: ${exportTargetTable.table_name}` : 'เน€เธฅเธทเธญเธเธฃเธนเธเนเธเธเนเธเธฅเนเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเธชเนเธเธญเธญเธ'}</Text>
                    <Radio.Group value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)} style={{ width: '100%' }}>
                        {false && <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="pdf">PDF (เน€เธเธดเธ”เธซเธเนเธฒเธเธดเธกเธเนเธซเธฃเธทเธญเธเธฑเธเธ—เธถเธเน€เธเนเธ PDF)</Radio>
                            <Radio value="png">PNG (เธ”เธฒเธงเธเนเนเธซเธฅเธ”เธฃเธนเธ QR)</Radio>
                        </Space>}
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="receipt">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ</Radio>
                            <Radio value="a4">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเธเธเธ•เธด</Radio>
                            <Radio value="png">PNG</Radio>
                        </Space>
                    </Radio.Group>
                </Space>
            </Modal>
            <Modal
                title={TABLE_QR_EXPORT_UI.bulkModalTitle}
                open={isBulkExportModalOpen}
                onCancel={() => {
                    if (bulkExporting) return;
                    setIsBulkExportModalOpen(false);
                    setBulkExportProgress(null);
                }}
                onOk={() => { void handleConfirmBulkExport(); }}
                okText={bulkExportFormat === 'png' ? 'เธ”เธฒเธงเธเนเนเธซเธฅเธ” ZIP' : 'เธเธดเธกเธเน'}
                cancelText="เธขเธเน€เธฅเธดเธ"
                confirmLoading={bulkExporting}
                okButtonProps={{ disabled: loading || total === 0 }}
                maskClosable={!bulkExporting}
                closable={!bulkExporting}
                destroyOnClose
            >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>

                    <Radio.Group value={bulkExportFormat} onChange={(event) => setBulkExportFormat(event.target.value as ExportFormat)} style={{ width: '100%' }} disabled={bulkExporting}>
                        {false && <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="pdf">PDF เธฃเธงเธกเธ—เธธเธเนเธ•เนเธฐ (1 เนเธเธฅเน)</Radio>
                            <Radio value="png">ZIP เธเธญเธ PNG (เนเธขเธเนเธเธฅเนเธ•เนเธญเนเธ•เนเธฐ)</Radio>
                        </Space>}
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="receipt">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ</Radio>
                            <Radio value="a4">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเธเธเธ•เธด</Radio>
                            <Radio value="png">PNG (ZIP)</Radio>
                        </Space>
                    </Radio.Group>
                    {bulkExportProgress && (
                        <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Text strong style={{ display: 'block' }}>{bulkExportProgress.stage}</Text>
                            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                {bulkExportProgress.total > 0
                                    ? `${bulkExportProgress.current}/${bulkExportProgress.total} เธฃเธฒเธขเธเธฒเธฃ`
                                    : 'เธเธณเธฅเธฑเธเน€เธฃเธดเนเธกเธ•เนเธ'}
                                {bulkExportProgress.skipped > 0 ? `, เธเนเธฒเธก ${bulkExportProgress.skipped} เธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเนเธกเนเธกเธตเธฅเธดเธเธเนเธฅเธนเธเธเนเธฒ` : ''}
                            </Text>
                        </div>
                    )}                </Space>
            </Modal>
            <Modal
                title={TAKEAWAY_QR_UI.exportLabel}
                open={isTakeawayQrExportModalOpen}
                onCancel={() => setIsTakeawayQrExportModalOpen(false)}
                onOk={() => { void handleConfirmTakeawayExport(); }}
                okText="เธเธดเธกเธเน"
                cancelText="เธขเธเน€เธฅเธดเธ"
                confirmLoading={isTakeawayQrExporting}
                destroyOnClose
            >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Radio.Group value={takeawayQrExportFormat} onChange={(event) => setTakeawayQrExportFormat(event.target.value as ExportFormat)} style={{ width: '100%' }}>
                        {false && <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="pdf">PDF</Radio>
                            <Radio value="png">PNG</Radio>
                        </Space>}
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Radio value="receipt">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเนเธเน€เธชเธฃเนเธ</Radio>
                            <Radio value="a4">เธชเธณเธซเธฃเธฑเธเน€เธเธฃเธทเนเธญเธเธเธดเธกเธเนเธเธเธ•เธด</Radio>
                            <Radio value="png">PNG</Radio>
                        </Space>
                    </Radio.Group>
                </Space>
            </Modal>
            <Modal title={`เนเธ•เนเธฐ ${previewTable?.table_name || ''}`} open={Boolean(previewTable)} onCancel={() => setPreviewTable(null)} footer={null} centered destroyOnClose styles={{ body: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' } }} width="min(400px, calc(100vw - 16px))">
                {previewTable?.customer_path ? <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}><DynamicQRCode value={buildCustomerUrl(previewTable.customer_path)} size={280} /></div> : null}
                <Text type="secondary" style={{ textAlign: 'center', marginTop: 8 }}>เนเธซเนเธฅเธนเธเธเนเธฒเธชเนเธเธ QR Code เธเธตเนเน€เธเธทเนเธญเน€เธเธดเธ”เน€เธกเธเธนเนเธฅเธฐเธชเธฑเนเธเธญเธฒเธซเธฒเธฃ</Text>
            </Modal>
            {takeawayCustomerUrl ? (
                <div style={{ display: 'none' }}>
                    <DynamicQRCodeCanvas
                        key={takeawayQrRenderKey}
                        id={TAKEAWAY_EXPORT_CANVAS_ID}
                        value={takeawayCustomerUrl}
                        size={EXPORT_QR_CANVAS_SIZE}
                        marginSize={0}
                    />
                </div>
            ) : null}
            {bulkRenderTarget ? (
                <div style={{ display: 'none' }}>
                    <DynamicQRCodeCanvas id={BULK_EXPORT_CANVAS_ID} value={bulkRenderTarget.customerUrl} size={EXPORT_QR_CANVAS_SIZE} marginSize={0} />
                </div>
            ) : null}
        </div>
    );
}

