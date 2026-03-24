'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Col,
    Grid,
    Input,
    InputNumber,
    Modal,
    Row,
    Segmented,
    Slider,
    Space,
    Spin,
    Switch,
    Tag,
    Tooltip,
    Typography,
    message,
} from 'antd';
import {
    CheckCircleOutlined,
    CopyOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    PrinterOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    SaveOutlined,
    SettingOutlined,
    ShopOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    UndoOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../components/ui/page/PageContainer';
import PageStack from '../../../components/ui/page/PageStack';
import UIPageHeader from '../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../components/pos/AccessGuard';
import { branchService } from '../../../services/branch.service';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../hooks/useEffectivePermissions';
import { useSocket } from '../../../hooks/useSocket';
import { printSettingsService } from '../../../services/pos/printSettings.service';
import {
    BranchPrintSettings,
    PrintDocumentSetting,
    PrintDocumentType,
    PrintPrinterProfile,
    PrintUnit,
} from '../../../types/api/pos/printSettings';
import { useRoleGuard } from '../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../utils/pos/csrf';
import { useRealtimeRefresh } from '../../../utils/pos/realtime';
import { RealtimeEvents } from '../../../utils/realtimeEvents';

import {
    PRINT_DOCUMENT_META,
    PRINT_PRESET_OPTIONS,
    applyPresetToDocument,
    convertDocumentUnit,
    countAutomationJobs,
    countEnabledDocuments,
    createDefaultPrintSettings,
    estimateCharsPerLine,
    formatPaperSize,
    formatNumber,
    getPresetMeta,
    mergePrintSettings,
    toCssLength,
} from '../../../utils/print-settings/defaults';
import {
    closePrintWindow,
    getPrintSettings,
    hydratePrintSettingsCache,
    peekPrintSettings,
    reservePrintWindow,
} from '../../../utils/print-settings/runtime';
import { PrintSettingStyles } from './style';

const { Text } = Typography;

/* ─── Static data ────────────────────────────────────────────────────────── */

const documentOrder = Object.keys(PRINT_DOCUMENT_META) as PrintDocumentType[];

const printerProfileLabel: Record<PrintPrinterProfile, string> = {
    thermal: 'เครื่องความร้อน',
    laser: 'กระดาษสำนักงาน',
    label: 'ฉลาก/สติ๊กเกอร์',
};

const densityLabel: Record<PrintDocumentSetting['density'], string> = {
    compact: 'กะทัดรัด',
    comfortable: 'สมดุล',
    spacious: 'โปร่ง',
};

const automationItems: Array<{
    key: keyof BranchPrintSettings['automation'];
    title: string;
    desc: string;
}> = [
    { key: 'auto_print_receipt_after_payment', title: 'พิมพ์ใบเสร็จหลังชำระเงิน', desc: 'จบการขายได้ไวขึ้น ไม่ต้องกดพิมพ์เอง' },
    { key: 'auto_print_order_summary_after_close_shift', title: 'สรุปยอดหลังปิดกะ', desc: 'ได้เอกสารสรุปทันทีเมื่อปิดกะ' },
    { key: 'auto_print_purchase_order_after_submit', title: 'ใบสั่งซื้อหลังยืนยัน', desc: 'ส่งต่อเอกสารให้ฝ่ายจัดซื้อทันที' },
    { key: 'auto_print_table_qr_after_rotation', title: 'QR โต๊ะหลังหมุนรหัส', desc: 'ป้าย QR ใหม่พร้อมใช้ทันที' },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatTimestamp(value?: string) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function escapeHtml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getDocumentRows(documentType: PrintDocumentType) {
    if (documentType === 'receipt') return [['เอสเปรสโซ x2', '160.00'], ['ครัวซองต์ x1', '85.00'], ['ส่วนลด', '-20.00'], ['ยอดสุทธิ', '225.00']];
    if (documentType === 'order_summary') return [['จำนวนออเดอร์', '126'], ['ยอดขาย', '34,580'], ['เงินสด', '9,800'], ['พร้อมเพย์', '24,780']];
    if (documentType === 'purchase_order') return [['นมสด 2 ลิตร', '24'], ['เมล็ดกาแฟ', '8'], ['ฝาแก้ว', '120'], ['เวลารับของ', '09:00']];
    if (documentType === 'table_qr') return [['โต๊ะ', 'A12'], ['โซน', 'ห้องหลัก'], ['วิธีใช้', 'สแกนเปิดเมนู'], ['อายุรหัส', 'รายเดือน']];
    return [['เทมเพลต', 'กำหนดเอง'], ['สาขา', 'ใช้ภายใน'], ['กระดาษ', 'ตั้งเอง'], ['สถานะ', 'พร้อม']];
}

/* ─── Preview component ──────────────────────────────────────────────────── */

function DocumentPreview({
    documentType,
    setting,
    branchName,
}: {
    documentType: PrintDocumentType;
    setting: PrintDocumentSetting;
    branchName: string;
}) {
    const meta = PRINT_DOCUMENT_META[documentType];
    const hasFixedHeight = setting.height_mode === 'fixed' && setting.height != null;
    const canvasHeight = hasFixedHeight ? setting.height ?? 220 : 180;
    const scale = Math.min(2.15, 260 / Math.max(setting.width, 1), 340 / Math.max(canvasHeight, 1));
    const paperWidth = Math.max(130, Math.round(setting.width * scale));
    const paperHeight = Math.max(190, Math.round(canvasHeight * scale));
    const rows = getDocumentRows(documentType);

    return (
        <div className="ps-preview-shell">
            <div
                className="ps-preview-paper"
                style={{
                    width: paperWidth,
                    minHeight: paperHeight,
                    padding: `${Math.max(10, setting.margin_top * scale)}px ${Math.max(10, setting.margin_right * scale)}px ${Math.max(10, setting.margin_bottom * scale)}px ${Math.max(10, setting.margin_left * scale)}px`,
                }}
            >
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        {setting.show_logo ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: '#fef3c7', fontSize: 10, fontWeight: 700 }}>
                                <ShopOutlined />
                                {branchName}
                            </div>
                        ) : null}
                        <div style={{ marginTop: 6, fontSize: Math.max(11, 13 * (setting.font_scale / 100)), fontWeight: 800 }}>
                            {meta.label}
                        </div>
                        {setting.show_branch_address ? (
                            <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>128 ถ.สุขุมวิท เขตธุรกิจ</div>
                        ) : null}
                    </div>

                    {setting.show_order_meta ? (
                        <div style={{ display: 'grid', gap: 3, padding: '6px 0 8px', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', fontSize: 9.5, color: '#334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>โปรไฟล์</span><strong>{printerProfileLabel[setting.printer_profile]}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ขนาดกระดาษ</span><strong>{formatPaperSize(setting)}</strong></div>
                        </div>
                    ) : null}

                    <div style={{ display: 'grid', gap: Math.max(3, 5 * setting.line_spacing), marginTop: 10, fontSize: Math.max(10, 11 * (setting.font_scale / 100)) }}>
                        {rows.map(([label, value]) => (
                            <div key={`${label}-${value}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: label === 'ยอดสุทธิ' ? 700 : 500 }}>
                                <span>{label}</span>
                                <span>{value}</span>
                            </div>
                        ))}
                    </div>

                    {setting.show_qr ? (
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                            <div style={{ width: 60, height: 60, borderRadius: 10, border: '2px dashed #0f766e', display: 'grid', placeItems: 'center', color: '#0f766e', background: '#ecfeff' }}>
                                <QrcodeOutlined style={{ fontSize: 22 }} />
                            </div>
                        </div>
                    ) : null}

                    {setting.show_footer ? (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: 9, color: '#475569' }}>
                            จำนวนสำเนา {setting.copies} ชุด
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function PrintSettingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const initialCachedSettingsRef = useRef<BranchPrintSettings | null>(peekPrintSettings());
    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'print_settings.page', action: 'view' },
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canUpdatePage = can('print_settings.page', 'update');
    const canPreviewSettings = can('print_settings.preview.feature', 'view');
    const canTestPrint = can('print_settings.test_print.feature', 'access');
    const canEditPresets = can('print_settings.presets.feature', 'update');
    const canEditLayout = can('print_settings.layout.feature', 'update');
    const canEditVisibility = can('print_settings.visibility.feature', 'update');
    const canEditAutomation = can('print_settings.automation.feature', 'update');
    const canEditBranchDefaults = can('print_settings.branch_defaults.feature', 'update');
    const canEditOverridePolicy = can('print_settings.override_policy.feature', 'update');
    const canResetSettings = can('print_settings.reset.feature', 'update');
    const canPublishSettings = can('print_settings.publish.feature', 'update');
    const canEditAnySetting = canEditPresets || canEditLayout || canEditVisibility || canEditAutomation || canEditBranchDefaults || canEditOverridePolicy;
    const canSaveChanges = canUpdatePage && canPublishSettings;

    const [selectedDocument, setSelectedDocument] = useState<PrintDocumentType>('receipt');
    const [settings, setSettings] = useState<BranchPrintSettings>(() => initialCachedSettingsRef.current ?? createDefaultPrintSettings());
    const [savedSettings, setSavedSettings] = useState<BranchPrintSettings>(() => initialCachedSettingsRef.current ?? createDefaultPrintSettings());
    const [loading, setLoading] = useState(!initialCachedSettingsRef.current);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [hasIncomingUpdate, setHasIncomingUpdate] = useState(false);
    const [branchLabel, setBranchLabel] = useState(() => user?.branch?.branch_name || 'สาขาปัจจุบัน');

    const branchName = branchLabel;


    /* ─── Data logic (same as original) ────────────────────────────────── */

    const applyLoadedSettings = useCallback((payload: BranchPrintSettings) => {
        const merged = mergePrintSettings(createDefaultPrintSettings(), payload);
        setSettings(merged);
        setSavedSettings(merged);
        hydratePrintSettingsCache(merged);
        setHasIncomingUpdate(false);
    }, []);

    const fetchSettings = useCallback(async (options?: { silent?: boolean; forceRefresh?: boolean }) => {
        if (!isAuthorized) return;
        const silent = Boolean(options?.silent);
        try {
            if (silent) setRefreshing(true); else setLoading(true);
            const response = await getPrintSettings({ forceRefresh: Boolean(options?.forceRefresh), allowFallback: false });
            applyLoadedSettings(response);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถโหลดการตั้งค่าการพิมพ์ได้');
        } finally {
            if (silent) setRefreshing(false); else setLoading(false);
        }
    }, [applyLoadedSettings, isAuthorized]);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        void fetchSettings({
            silent: Boolean(initialCachedSettingsRef.current),
            forceRefresh: Boolean(initialCachedSettingsRef.current),
        });
    }, [fetchSettings, isAuthorized, isChecking, permissionLoading]);

    useEffect(() => {
        if (!isAuthorized || typeof window === 'undefined') return undefined;

        const handleBranchChanged = () => {
            if (isDirtyRef.current) {
                message.warning('มีการเปลี่ยนสาขา ระบบจะโหลดค่าการพิมพ์ของสาขาใหม่');
            }
            void fetchSettings({ silent: true, forceRefresh: true });
        };

        window.addEventListener('active-branch-changed', handleBranchChanged as EventListener);
        return () => window.removeEventListener('active-branch-changed', handleBranchChanged as EventListener);
    }, [fetchSettings, isAuthorized]);

    const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
    const isDirtyRef = useRef(isDirty);

    useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

    useEffect(() => {
        const settingsBranchId = settings.branch_id;
        const fallbackLabel = user?.branch?.branch_name || 'สาขาปัจจุบัน';

        if (!settingsBranchId) {
            setBranchLabel(fallbackLabel);
            return;
        }

        if (user?.branch?.id === settingsBranchId && user.branch.branch_name) {
            setBranchLabel(user.branch.branch_name);
            return;
        }

        let active = true;
        branchService
            .getById(settingsBranchId)
            .then((branch) => {
                if (!active) return;
                const label = branch.branch_code
                    ? `${branch.branch_name} (${branch.branch_code})`
                    : branch.branch_name;
                setBranchLabel(label);
            })
            .catch(() => {
                if (active) {
                    setBranchLabel(settingsBranchId);
                }
            });

        return () => {
            active = false;
        };
    }, [settings.branch_id, user?.branch?.branch_name, user?.branch?.id]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.printSettings.update],
        onRefresh: () => {
            if (isDirtyRef.current) { setHasIncomingUpdate(true); return; }
            void fetchSettings({ silent: true, forceRefresh: true });
        },
        intervalMs: isConnected ? undefined : 45000,
        enabled: isAuthorized,
        debounceMs: 400,
    });

    useEffect(() => {
        if (!isDirty) return undefined;
        const onBeforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    /* ─── Derived values ───────────────────────────────────────────────── */

    const currentDocument = settings.documents[selectedDocument];
    const selectedMeta = PRINT_DOCUMENT_META[selectedDocument];
    const currentPresetMeta = getPresetMeta(currentDocument.preset);
    const enabledDocumentCount = countEnabledDocuments(settings);
    const automationCount = countAutomationJobs(settings);
    const charsPerLine = estimateCharsPerLine(currentDocument);

    /* ─── Mutations ────────────────────────────────────────────────────── */

    const updateDocument = useCallback((patch: Partial<PrintDocumentSetting> | ((current: PrintDocumentSetting) => PrintDocumentSetting)) => {
        setSettings((prev) => {
            const current = prev.documents[selectedDocument];
            const nextDocument = typeof patch === 'function' ? patch(current) : { ...current, ...patch, document_type: selectedDocument };
            return { ...prev, documents: { ...prev.documents, [selectedDocument]: nextDocument } };
        });
    }, [selectedDocument]);

    const runWithDiscardGuard = useCallback((action: () => void, title: string, content: string, okText = 'ยืนยัน') => {
        if (!isDirty) { action(); return; }
        Modal.confirm({ centered: true, title, content, okText, cancelText: 'ยกเลิก', okButtonProps: { danger: true }, onOk: action });
    }, [isDirty]);

    const handleRefresh = useCallback(() => {
        runWithDiscardGuard(
            () => { void fetchSettings({ silent: true, forceRefresh: true }); },
            'โหลดค่าล่าสุดจากระบบ?',
            'การแก้ไขที่ยังไม่ได้บันทึกจะหายไป',
            'โหลดค่าล่าสุด'
        );
    }, [fetchSettings, runWithDiscardGuard]);

    const handleLoadLatest = useCallback(() => {
        runWithDiscardGuard(
            () => { void fetchSettings({ silent: true, forceRefresh: true }); },
            'ใช้ค่าล่าสุดจากระบบ?',
            'การแก้ไขที่ยังไม่ได้บันทึกจะถูกแทนที่',
            'ใช้ค่าล่าสุด'
        );
    }, [fetchSettings, runWithDiscardGuard]);

    const handleSave = useCallback(async () => {
        if (!canSaveChanges) { message.error('คุณไม่มีสิทธิ์บันทึกการตั้งค่าการพิมพ์'); return; }
        setSaving(true);
        try {
            const csrfToken = await getCsrfTokenCached();
            const payload = mergePrintSettings(createDefaultPrintSettings(), { ...settings, locale: settings.locale.trim() || 'th-TH' });
            const updated = await printSettingsService.updateSettings(payload, undefined, csrfToken);
            applyLoadedSettings(updated);
            message.success('บันทึกเรียบร้อย');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกได้');
        } finally {
            setSaving(false);
        }
    }, [applyLoadedSettings, canSaveChanges, settings]);

    const handleResetAll = useCallback(() => {
        if (!canResetSettings) {
            message.error('คุณไม่มีสิทธิ์รีเซ็ตค่าการพิมพ์');
            return;
        }
        Modal.confirm({
            centered: true,
            title: 'คืนค่าเริ่มต้นทั้งหมด?',
            content: 'จะเปลี่ยนค่าบนหน้าจอเป็นค่าเริ่มต้น ต้องกดบันทึกอีกครั้งเพื่อให้มีผลจริง',
            okText: 'คืนค่าเริ่มต้น',
            cancelText: 'ยกเลิก',
            okButtonProps: { danger: true },
            onOk: () => {
                const defaults = createDefaultPrintSettings();
                setSettings((prev) => mergePrintSettings(defaults, { id: prev.id, branch_id: prev.branch_id, created_at: prev.created_at }));
            },
        });
    }, [canResetSettings]);

    const handleResetDocument = useCallback(() => {
        if (!canResetSettings) {
            message.error('คุณไม่มีสิทธิ์รีเซ็ตค่าการพิมพ์');
            return;
        }
        const defaults = createDefaultPrintSettings().documents[selectedDocument];
        const nextDocument = currentDocument.unit === defaults.unit ? defaults : convertDocumentUnit(defaults, currentDocument.unit);
        updateDocument(nextDocument);
    }, [canResetSettings, currentDocument.unit, selectedDocument, updateDocument]);

    const handlePrintTest = useCallback(() => {
        if (!canTestPrint) {
            message.error('คุณไม่มีสิทธิ์ทดสอบพิมพ์');
            return;
        }
        setPrinting(true);
        const windowRef = reservePrintWindow(`ทดสอบ - ${selectedMeta.label}`);
        if (!windowRef) { message.error('เบราว์เซอร์บล็อก popup'); setPrinting(false); return; }

        try {
            const rows = getDocumentRows(selectedDocument).map(([label, value]) => `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
            const marginCss = [toCssLength(currentDocument.margin_top, currentDocument.unit), toCssLength(currentDocument.margin_right, currentDocument.unit), toCssLength(currentDocument.margin_bottom, currentDocument.unit), toCssLength(currentDocument.margin_left, currentDocument.unit)].join(' ');
            const pageSizeCss = currentDocument.height_mode === 'fixed' && currentDocument.height != null ? `size: ${toCssLength(currentDocument.width, currentDocument.unit)} ${toCssLength(currentDocument.height, currentDocument.unit)};` : '';
            const sheetHeightCss = currentDocument.height_mode === 'fixed' && currentDocument.height != null ? `min-height: ${toCssLength(currentDocument.height, currentDocument.unit)};` : '';

            windowRef.document.open();
            windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>ทดสอบ - ${escapeHtml(selectedMeta.label)}</title><style>@page { ${pageSizeCss} margin: ${marginCss}; } body { margin: 0; background: #eef2f7; font-family: "Segoe UI", "Sarabun", sans-serif; color: #0f172a; } .stage { min-height: 100dvh; display: grid; place-items: center; padding: 16px; } .sheet { width: ${toCssLength(currentDocument.width, currentDocument.unit)}; ${sheetHeightCss} box-sizing: border-box; background: #fffef9; border: 1px solid rgba(15, 23, 42, 0.1); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16); } .content { padding: ${marginCss}; font-size: ${formatNumber(12 * (currentDocument.font_scale / 100))}px; line-height: ${formatNumber(currentDocument.line_spacing)}; } .pill { display: inline-flex; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #fef3c7; font-size: 12px; font-weight: 700; } .header { text-align: center; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; } .meta { padding: 10px 0; font-size: 12px; border-bottom: 1px dashed #cbd5e1; } .meta-row, .row { display: flex; justify-content: space-between; gap: 10px; } .rows { padding-top: 14px; display: grid; gap: 8px; } .footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #475569; } .qr { margin: 16px auto 0; width: 82px; height: 82px; border-radius: 12px; border: 2px dashed #0f766e; display: grid; place-items: center; color: #0f766e; background: #ecfeff; } @media print { body { background: #fff; } .stage { padding: 0; } .sheet { box-shadow: none; border: none; } }</style></head><body><div class="stage"><div class="sheet"><div class="content"><div class="header">${currentDocument.show_logo ? `<div class="pill">${escapeHtml(branchName)}</div>` : ''}<div style="margin-top: 8px; font-size: ${formatNumber(14 * (currentDocument.font_scale / 100))}px; font-weight: 800;">${escapeHtml(selectedMeta.label)}</div>${currentDocument.show_branch_address ? `<div style="margin-top: 4px; font-size: 11px; color: #475569;">128 ถนนสุขุมวิท แขวงบริการ เขตธุรกิจ</div>` : ''}</div>${currentDocument.show_order_meta ? `<div class="meta"><div class="meta-row"><span>โปรไฟล์พิมพ์</span><strong>${escapeHtml(printerProfileLabel[currentDocument.printer_profile])}</strong></div><div class="meta-row"><span>ขนาดกระดาษ</span><strong>${escapeHtml(formatPaperSize(currentDocument))}</strong></div></div>` : ''}<div class="rows">${rows}</div>${currentDocument.show_qr ? `<div class="qr">QR</div>` : ''}${currentDocument.show_footer ? `<div class="footer">จำนวนสำเนา ${currentDocument.copies} ชุด</div>` : ''}</div></div></div><script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); }); window.addEventListener('afterprint', function () { window.close(); });</script></body></html>`);
            windowRef.document.close();
        } catch (error) {
            closePrintWindow(windowRef);
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปิดหน้าทดสอบพิมพ์ได้');
        } finally {
            setPrinting(false);
        }
    }, [branchName, canTestPrint, currentDocument, selectedDocument, selectedMeta.label]);

    /* ─── Guards ────────────────────────────────────────────────────────── */

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (loading) {
        return (
            <div className="ps-page">
                <PrintSettingStyles />
                <UIPageHeader title="ตั้งค่าการพิมพ์" subtitle="กำลังโหลด..." icon={<PrinterOutlined />} onBack={() => router.back()} />
                <PageContainer>
                    <div style={{ minHeight: 380, display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>
                </PageContainer>
            </div>
        );
    }

    /* ─── Status bar helper ─────────────────────────────────────────────── */
    const statusVariant = hasIncomingUpdate ? 'update' : isDirty ? 'dirty' : 'synced';
    const statusText = hasIncomingUpdate
        ? 'มีอัปเดตจากอุปกรณ์อื่น'
        : isDirty ? 'มีการแก้ไขที่ยังไม่ได้บันทึก' : 'ข้อมูลเป็นปัจจุบัน';

    /* ─── Render ────────────────────────────────────────────────────────── */

    return (
        <div className="ps-page">
            <PrintSettingStyles />

            {/* Header */}
            <UIPageHeader
                title="ตั้งค่าการพิมพ์"
                subtitle={branchName}
                icon={<PrinterOutlined />}
                onBack={() => router.back()}
                actions={(
                    <Space size={8} wrap>
                        <Tooltip title="โหลดค่าล่าสุดจากระบบ">
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing} />
                        </Tooltip>
                        <Tooltip title={canTestPrint ? 'พิมพ์ตัวอย่างเพื่อตรวจสอบผลลัพธ์จริง' : 'ต้องมีสิทธิ์ทดสอบพิมพ์'}>
                            <Button icon={<SyncOutlined />} onClick={handlePrintTest} loading={printing} disabled={!canTestPrint}>
                                {!isMobile && 'ทดสอบพิมพ์'}
                            </Button>
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSave}
                            loading={saving}
                            disabled={!canSaveChanges || !isDirty}
                        >
                            บันทึก
                        </Button>
                    </Space>
                )}
            />

            <PageContainer maxWidth={1360}>
                <PageStack gap={16}>
                    {/* Status bar */}
                    <div className={`ps-status-bar ps-status-bar--${statusVariant}`}>
                        <span className="ps-status-bar__dot" />
                        <span>{statusText}</span>
                        {hasIncomingUpdate && (
                            <Button size="small" type="link" onClick={handleLoadLatest} style={{ padding: 0, height: 'auto' }}>
                                โหลดค่าล่าสุด
                            </Button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
                            {isConnected ? 'เรียลไทม์' : 'ออฟไลน์'}
                        </span>
                    </div>

                    {/* Read-only alert */}
                    {!canEditAnySetting && (
                        <Alert
                            showIcon
                            type="warning"
                            message="โหมดดูอย่างเดียว"
                            description="บัญชีนี้เห็นข้อมูลได้ แต่ไม่สามารถแก้ configuration ของระบบพิมพ์"
                        />
                    )}

                    {canEditAnySetting && !canSaveChanges && (
                        <Alert
                            showIcon
                            type="warning"
                            message="แก้ไขได้แต่ยังเผยแพร่ไม่ได้"
                            description="บัญชีนี้ปรับค่าเพื่อทดลองดูผลได้ แต่ไม่มีสิทธิ์บันทึกขึ้นระดับสาขา"
                        />
                    )}



                    {/* Summary chips */}
                    <div className="ps-chips">
                        <div className="ps-chip">
                            <FileTextOutlined className="ps-chip__icon" />
                            <span>เอกสาร</span>
                            <span className="ps-chip__value">{enabledDocumentCount}/{documentOrder.length}</span>
                        </div>
                        <div className="ps-chip">
                            <ThunderboltOutlined className="ps-chip__icon" />
                            <span>อัตโนมัติ</span>
                            <span className="ps-chip__value">{automationCount}</span>
                        </div>
                        <div className="ps-chip">
                            <PrinterOutlined className="ps-chip__icon" />
                            <span>พิมพ์ด้วย</span>
                            <span className="ps-chip__value">{printerProfileLabel[currentDocument.printer_profile]}</span>
                        </div>
                        <div className="ps-chip">
                            <CopyOutlined className="ps-chip__icon" />
                            <span>สำเนา</span>
                            <span className="ps-chip__value">{currentDocument.copies}</span>
                        </div>
                        <div className="ps-chip">
                            <SettingOutlined className="ps-chip__icon" />
                            <span>บทบาท</span>
                            <span className="ps-chip__value">{user?.role || 'Unknown'}</span>
                        </div>
                    </div>

                    {/* Document tabs */}
                    <div className="ps-doc-tabs">
                        {documentOrder.map((docType) => {
                            const meta = PRINT_DOCUMENT_META[docType];
                            const isEnabled = settings.documents[docType].enabled;
                            const isActive = selectedDocument === docType;
                            return (
                                <button
                                    key={docType}
                                    type="button"
                                    className={`ps-doc-tab ${isActive ? 'ps-doc-tab--active' : ''}`}
                                    onClick={() => setSelectedDocument(docType)}
                                >
                                    {meta.shortLabel}
                                    <span className={`ps-doc-tab__badge ${isEnabled ? 'ps-doc-tab__badge--on' : 'ps-doc-tab__badge--off'}`}>
                                        {isEnabled ? 'เปิด' : 'ปิด'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main 2-col layout */}
                    <div className="ps-layout">
                        {/* ── Left: settings ── */}
                        <div style={{ display: 'grid', gap: 16 }}>
                            {/* Presets */}
                            <div className="ps-card">
                                <div className="ps-card__header">
                                    <h3 className="ps-card__title">
                                        {selectedMeta.label}
                                    </h3>
                                    <Space size={6}>
                                        <Tag color={currentDocument.enabled ? 'green' : 'default'}>
                                            {currentDocument.enabled ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                                        </Tag>
                                        <Tag color="blue">{currentPresetMeta.label}</Tag>
                                    </Space>
                                </div>
                                <div className="ps-card__body">
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                                        {selectedMeta.description}
                                    </Text>

                                    {/* Preset selection */}
                                    <div className="ps-section">
                                        <div className="ps-section__label">เลือกรูปแบบกระดาษ</div>
                                        {!canEditPresets && <Text type="secondary">Preset ถูกล็อกโดยนโยบายสิทธิ์</Text>}
                                        <div className="ps-presets">
                                            {PRINT_PRESET_OPTIONS.map((preset) => {
                                                const recommended = selectedMeta.recommendedPresets.includes(preset.value);
                                                const active = currentDocument.preset === preset.value;
                                                return (
                                                    <button
                                                        key={preset.value}
                                                        type="button"
                                                        className={`ps-preset ${active ? 'ps-preset--active' : ''}`}
                                                        disabled={!canEditPresets}
                                                        onClick={() => updateDocument((current) => applyPresetToDocument(current, preset.value))}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span className="ps-preset__name">{preset.label}</span>
                                                            {recommended && <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 12 }} />}
                                                        </div>
                                                        <div className="ps-preset__size">
                                                            {preset.height == null ? `${formatNumber(preset.width)} มม. × auto` : `${formatNumber(preset.width)} × ${formatNumber(preset.height)} มม.`}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Paper & printer */}
                                    <div className="ps-section">
                                        <div className="ps-section__label">เครื่องพิมพ์ & กระดาษ</div>
                                        {!canEditLayout && <Text type="secondary">Layout, paper size, และ typography ถูกล็อกโดยนโยบายสิทธิ์</Text>}
                                        <Row gutter={[12, 14]}>
                                            <Col xs={24} sm={8}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ประเภทเครื่อง</span>
                                                    <Segmented<PrintPrinterProfile>
                                                        block
                                                        value={currentDocument.printer_profile}
                                                        disabled={!canEditLayout}
                                                        onChange={(value) => updateDocument({ printer_profile: value })}
                                                        options={[
                                                            { label: 'ความร้อน', value: 'thermal' },
                                                            { label: 'สำนักงาน', value: 'laser' },
                                                            { label: 'สติ๊กเกอร์', value: 'label' },
                                                        ]}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={8}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">หน่วยวัด</span>
                                                    <Segmented<PrintUnit>
                                                        block
                                                        value={currentDocument.unit}
                                                        disabled={!canEditLayout}
                                                        options={[{ label: 'มม.', value: 'mm' }, { label: 'นิ้ว', value: 'in' }]}
                                                        onChange={(value) => updateDocument((current) => convertDocumentUnit(current, value))}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={8}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">แนวกระดาษ</span>
                                                    <Segmented<'portrait' | 'landscape'>
                                                        block
                                                        value={currentDocument.orientation}
                                                        disabled={!canEditLayout}
                                                        options={[{ label: 'แนวตั้ง', value: 'portrait' }, { label: 'แนวนอน', value: 'landscape' }]}
                                                        onChange={(value) => updateDocument({ orientation: value })}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={6}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ความกว้าง</span>
                                                    <InputNumber
                                                        min={1} max={500} precision={2}
                                                        value={currentDocument.width}
                                                        disabled={!canEditLayout}
                                                        onChange={(value) => updateDocument({ width: Number(value || 0) })}
                                                        addonAfter={currentDocument.unit}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={6}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ความสูง</span>
                                                    <Segmented<'auto' | 'fixed'>
                                                        block
                                                        value={currentDocument.height_mode}
                                                        disabled={!canEditLayout}
                                                        options={[{ label: 'อัตโนมัติ', value: 'auto' }, { label: 'กำหนด', value: 'fixed' }]}
                                                        onChange={(value) =>
                                                            updateDocument((current) => ({
                                                                ...current,
                                                                height_mode: value,
                                                                height: value === 'auto' ? null : current.height ?? Number(current.width.toFixed(2)),
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={6}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ค่าความสูง</span>
                                                    <InputNumber
                                                        min={1} max={500} precision={2}
                                                        value={currentDocument.height ?? undefined}
                                                        disabled={!canEditLayout || currentDocument.height_mode === 'auto'}
                                                        onChange={(value) => updateDocument({ height: value == null ? null : Number(value) })}
                                                        addonAfter={currentDocument.unit}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={12} sm={6}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">จำนวนสำเนา</span>
                                                    <InputNumber
                                                        min={1} max={5} precision={0}
                                                        value={currentDocument.copies}
                                                        disabled={!canEditLayout}
                                                        onChange={(value) => updateDocument({ copies: Number(value || 1) })}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Typography & density */}
                                    <div className="ps-section">
                                        <div className="ps-section__label">ความหนาแน่น & ตัวอักษร</div>
                                        <Row gutter={[12, 14]}>
                                            <Col xs={24} sm={12}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ความหนาแน่น</span>
                                                    <Segmented<PrintDocumentSetting['density']>
                                                        block
                                                        value={currentDocument.density}
                                                        disabled={!canEditLayout}
                                                        options={[
                                                            { label: 'กะทัดรัด', value: 'compact' },
                                                            { label: 'สมดุล', value: 'comfortable' },
                                                            { label: 'โปร่ง', value: 'spacious' },
                                                        ]}
                                                        onChange={(value) => updateDocument({ density: value })}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ขนาดตัวอักษร ({currentDocument.font_scale}%)</span>
                                                    <Slider
                                                        min={70} max={180}
                                                        value={currentDocument.font_scale}
                                                        disabled={!canEditLayout}
                                                        onChange={(value) => updateDocument({ font_scale: Number(value) })}
                                                        tooltip={{ formatter: (value) => `${value}%` }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ระยะห่างบรรทัด ({formatNumber(currentDocument.line_spacing)}x)</span>
                                                    <Slider
                                                        min={0.8} max={2} step={0.05}
                                                        value={currentDocument.line_spacing}
                                                        disabled={!canEditLayout}
                                                        onChange={(value) => updateDocument({ line_spacing: Number(value) })}
                                                        tooltip={{ formatter: (value) => `${value}x` }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div className="ps-field">
                                                    <span className="ps-field__label">ระยะขอบกระดาษ</span>
                                                    <div className="ps-margin-grid">
                                                        <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_top} disabled={!canEditLayout} addonBefore="บน" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_top: Number(value || 0) })} style={{ width: '100%' }} />
                                                        <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_right} disabled={!canEditLayout} addonBefore="ขวา" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_right: Number(value || 0) })} style={{ width: '100%' }} />
                                                        <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_bottom} disabled={!canEditLayout} addonBefore="ล่าง" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_bottom: Number(value || 0) })} style={{ width: '100%' }} />
                                                        <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_left} disabled={!canEditLayout} addonBefore="ซ้าย" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_left: Number(value || 0) })} style={{ width: '100%' }} />
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    {/* Visibility toggles */}
                                    <div className="ps-section">
                                        <div className="ps-section__label">แสดงข้อมูลบนเอกสาร</div>
                                        {!canEditVisibility && <Text type="secondary">Document visibility และ note ถูกล็อกโดยนโยบายสิทธิ์</Text>}
                                        <div className="ps-toggle-grid">
                                            {[
                                                { key: 'enabled', label: 'เปิดใช้เอกสาร', value: currentDocument.enabled },
                                                { key: 'show_logo', label: 'โลโก้/ชื่อสาขา', value: currentDocument.show_logo },
                                                { key: 'show_branch_address', label: 'ที่อยู่สาขา', value: currentDocument.show_branch_address },
                                                { key: 'show_order_meta', label: 'ข้อมูลอ้างอิง', value: currentDocument.show_order_meta },
                                                { key: 'show_qr', label: 'QR Code', value: currentDocument.show_qr },
                                                { key: 'show_footer', label: 'ท้ายเอกสาร', value: currentDocument.show_footer },
                                                { key: 'cut_paper', label: 'ตัดกระดาษอัตโนมัติ', value: currentDocument.cut_paper },
                                            ].map((item) => (
                                                <div key={item.key} className="ps-toggle">
                                                    <span className="ps-toggle__label">{item.label}</span>
                                                    <Switch
                                                        size="small"
                                                        checked={item.value}
                                                        disabled={!canEditVisibility}
                                                        onChange={(checked) => updateDocument({ [item.key]: checked } as Partial<PrintDocumentSetting>)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Note */}
                                    <div className="ps-section">
                                        <div className="ps-section__label">หมายเหตุ</div>
                                        <Input.TextArea
                                            rows={2}
                                            maxLength={140}
                                            value={currentDocument.note || ''}
                                            disabled={!canEditVisibility}
                                            onChange={(event) => updateDocument({ note: event.target.value || null })}
                                            placeholder="เช่น ใช้กับเครื่องพิมพ์ 80 มม. หน้าเคาน์เตอร์"
                                            style={{ borderRadius: 10 }}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <Button icon={<UndoOutlined />} onClick={handleResetDocument} disabled={!canResetSettings}>
                                            คืนค่าเอกสารนี้
                                        </Button>
                                        <Button onClick={handleResetAll} disabled={!canResetSettings}>
                                            คืนค่าทั้งหมด
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Right sidebar ── */}
                        <div style={{ display: 'grid', gap: 16 }}>
                            {/* Preview */}
                            <div className="ps-card">
                                <div className="ps-card__header">
                                    <h3 className="ps-card__title">ตัวอย่าง</h3>
                                    <Tag color="geekblue">{formatPaperSize(currentDocument)}</Tag>
                                </div>
                                <div className="ps-card__body--compact">
                                    {canPreviewSettings ? (
                                        <DocumentPreview documentType={selectedDocument} setting={currentDocument} branchName={branchName} />
                                    ) : (
                                        <Alert
                                            showIcon
                                            type="warning"
                                            message="พรีวิวถูกจำกัด"
                                            description="บัญชีนี้ไม่มีสิทธิ์ดูตัวอย่างเอกสารสดของหน้าตั้งค่าการพิมพ์"
                                        />
                                    )}

                                    {canPreviewSettings && (
                                        <div className="ps-preview-info" style={{ marginTop: 14 }}>
                                            <div className="ps-preview-info__row"><span className="ps-preview-info__label">เครื่องพิมพ์</span><span className="ps-preview-info__value">{printerProfileLabel[currentDocument.printer_profile]}</span></div>
                                            <div className="ps-preview-info__row"><span className="ps-preview-info__label">ตัวอักษร/บรรทัด</span><span className="ps-preview-info__value">~{charsPerLine}</span></div>
                                            <div className="ps-preview-info__row"><span className="ps-preview-info__label">ความหนาแน่น</span><span className="ps-preview-info__value">{densityLabel[currentDocument.density]}</span></div>
                                            <div className="ps-preview-info__row"><span className="ps-preview-info__label">ขอบ</span><span className="ps-preview-info__value">{formatNumber(currentDocument.margin_top)}/{formatNumber(currentDocument.margin_right)}/{formatNumber(currentDocument.margin_bottom)}/{formatNumber(currentDocument.margin_left)} {currentDocument.unit}</span></div>
                                            <div className="ps-preview-info__row"><span className="ps-preview-info__label">อัปเดต</span><span className="ps-preview-info__value">{formatTimestamp(savedSettings.updated_at)}</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Automation */}
                            <div className="ps-card">
                                <div className="ps-card__header">
                                    <h3 className="ps-card__title">
                                        <ThunderboltOutlined style={{ marginRight: 6, color: '#f59e0b' }} />
                                        พิมพ์อัตโนมัติ
                                    </h3>
                                    <Tag>{automationCount} เปิดอยู่</Tag>
                                </div>
                                <div className="ps-card__body--compact">
                                    {!canEditAutomation && <Text type="secondary">Automation ถูกล็อกโดยนโยบายสิทธิ์</Text>}
                                    {automationItems.map((item) => (
                                        <div key={item.key} className="ps-auto-item">
                                            <div>
                                                <div className="ps-auto-item__title">{item.title}</div>
                                                <div className="ps-auto-item__desc">{item.desc}</div>
                                            </div>
                                            <Switch
                                                size="small"
                                                checked={settings.automation[item.key]}
                                                disabled={!canEditAutomation}
                                                onChange={(checked) => setSettings((prev) => ({
                                                    ...prev,
                                                    automation: { ...prev.automation, [item.key]: checked },
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>



                            {/* Branch settings */}
                            <div className="ps-card">
                                <div className="ps-card__header">
                                    <h3 className="ps-card__title">
                                        <SettingOutlined style={{ marginRight: 6, color: '#64748b' }} />
                                        ค่ากลางสาขา
                                    </h3>
                                </div>
                                <div className="ps-card__body--compact">
                                    <div className="ps-branch-grid">
                                        <div className="ps-branch-item">
                                            <span className="ps-branch-item__label">หน่วยหลัก</span>
                                            <Segmented<PrintUnit>
                                                block
                                                options={[{ label: 'มม.', value: 'mm' }, { label: 'นิ้ว', value: 'in' }]}
                                                value={settings.default_unit}
                                                onChange={(value) => setSettings((prev) => ({ ...prev, default_unit: value }))}
                                                disabled={!canEditBranchDefaults}
                                            />
                                        </div>
                                        <div className="ps-branch-item">
                                            <span className="ps-branch-item__label">ภาษาและเวลา</span>
                                            <Input
                                                value={settings.locale}
                                                disabled={!canEditBranchDefaults}
                                                onChange={(event) => setSettings((prev) => ({ ...prev, locale: event.target.value }))}
                                                placeholder="th-TH"
                                                maxLength={20}
                                                style={{ borderRadius: 8 }}
                                            />
                                        </div>
                                        <div className="ps-branch-item">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>ปรับจากหน้างาน</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>ให้ทีมปรับค่าได้ขณะทำงาน</div>
                                                </div>
                                                <Switch
                                                    size="small"
                                                    checked={settings.allow_manual_override}
                                                    disabled={!canEditOverridePolicy}
                                                    onChange={(checked) => setSettings((prev) => ({ ...prev, allow_manual_override: checked }))}
                                                />
                                            </div>
                                            {!canEditOverridePolicy && (
                                                <Text type="secondary">Governance policy จุดนี้ปรับได้เฉพาะ Admin</Text>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </PageStack>
            </PageContainer>

            {/* Sticky save bar */}
            <div className={`ps-save-bar ${isDirty ? 'ps-save-bar--visible' : ''}`}>
                <ExclamationCircleOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                <Text style={{ fontSize: 13 }}>มีการแก้ไขที่ยังไม่ได้บันทึก</Text>
                <Button size="small" onClick={() => {
                    setSettings(savedSettings);
                }}>
                    ยกเลิกการแก้ไข
                </Button>
                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!canSaveChanges}>
                    บันทึก
                </Button>
            </div>
        </div>
    );
}
