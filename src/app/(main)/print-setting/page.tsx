'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
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
    BgColorsOutlined,
    CopyOutlined,
    DeploymentUnitOutlined,
    FileDoneOutlined,
    PrinterOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    SaveOutlined,
    ShopOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageContainer from '../../../components/ui/page/PageContainer';
import PageSection from '../../../components/ui/page/PageSection';
import PageStack from '../../../components/ui/page/PageStack';
import UIPageHeader from '../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../components/pos/AccessGuard';
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

const { Text, Title, Paragraph } = Typography;

const pageStyles = `
  .print-settings-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(245, 158, 11, 0.12), transparent 28%),
      radial-gradient(circle at top right, rgba(15, 118, 110, 0.16), transparent 32%),
      linear-gradient(180deg, #f8fafc 0%, #fffdf7 100%);
    padding-bottom: 48px;
  }

  .print-settings-hero {
    overflow: hidden;
    border: none;
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(15, 118, 110, 0.96), rgba(15, 23, 42, 0.94)),
      linear-gradient(180deg, #0f766e 0%, #0f172a 100%);
    color: #f8fafc;
    box-shadow: 0 28px 54px rgba(15, 23, 42, 0.16);
  }

  .print-settings-hero-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: minmax(0, 1.8fr) minmax(280px, 1fr);
  }

  .print-settings-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fefce8;
    margin-bottom: 14px;
  }

  .print-settings-hero-copy {
    color: rgba(248, 250, 252, 0.82);
    max-width: 700px;
  }

  .print-settings-hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .print-settings-hero-tag {
    border-radius: 999px;
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    font-size: 12px;
  }

  .print-settings-hero-highlights {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .print-settings-hero-highlight {
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.08);
    padding: 16px 18px;
  }

  .print-settings-hero-highlight-label {
    display: block;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.8);
    margin-bottom: 6px;
  }

  .print-settings-hero-highlight-value {
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
  }

  .print-settings-hero-highlight-note {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.8);
  }

  .print-settings-stats {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .print-settings-stat {
    border-radius: 20px;
    border: 1px solid #e5e7eb;
    background: rgba(255,255,255,0.86);
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
    padding: 18px;
  }

  .print-settings-nav {
    display: grid;
    gap: 10px;
  }

  .print-settings-nav-btn {
    width: 100%;
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    border-radius: 18px;
    padding: 14px 16px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .print-settings-nav-btn:hover {
    transform: translateY(-1px);
    border-color: #0f766e;
    box-shadow: 0 12px 24px rgba(15, 118, 110, 0.12);
  }

  .print-settings-nav-btn.active {
    border-color: #0f766e;
    background: linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(15, 23, 42, 0.03));
    box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.18);
  }

  .print-settings-presets {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .print-settings-preset {
    border: 1px solid #dbe3ea;
    border-radius: 18px;
    background: #fff;
    padding: 14px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }

  .print-settings-preset:hover {
    transform: translateY(-1px);
    border-color: #0f766e;
    box-shadow: 0 14px 24px rgba(15, 118, 110, 0.1);
  }

  .print-settings-preset.active {
    border-color: #0f766e;
    background: linear-gradient(180deg, #ecfeff 0%, #ffffff 100%);
    box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.18);
  }

  .print-settings-paper-shell {
    border-radius: 28px;
    background: linear-gradient(180deg, #12222b 0%, #0f172a 100%);
    padding: 18px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 28px 40px rgba(15, 23, 42, 0.16);
  }

  .print-settings-paper-frame {
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
    padding: 18px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .print-settings-paper {
    background: #fffef9;
    border-radius: 14px;
    color: #0f172a;
    padding: 16px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16);
    position: relative;
    overflow: hidden;
  }

  .print-settings-paper::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.04), transparent 24%);
    pointer-events: none;
  }

  .print-settings-toggle-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .print-settings-toggle {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 12px 14px;
    background: #fff;
  }

  .print-settings-setting-block {
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    padding: 14px;
  }

  .print-settings-summary-grid {
    display: grid;
    gap: 10px;
  }

  .print-settings-summary-item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #fff;
    padding: 12px 14px;
  }

  @media (max-width: 992px) {
    .print-settings-hero-grid {
      grid-template-columns: 1fr;
    }
    .print-settings-paper-shell { padding: 14px; }
    .print-settings-paper-frame { padding: 12px; }
  }
`;

const documentOrder = Object.keys(PRINT_DOCUMENT_META) as PrintDocumentType[];

const presetCategoryLabel: Record<string, string> = {
    thermal: 'เครื่องความร้อน',
    laser: 'สำนักงาน',
    label: 'สติ๊กเกอร์',
};

const densityLabel: Record<PrintDocumentSetting['density'], string> = {
    compact: 'กะทัดรัด',
    comfortable: 'สมดุล',
    spacious: 'โปร่ง',
};

const printerProfileLabel: Record<PrintPrinterProfile, string> = {
    thermal: 'เครื่องความร้อน',
    laser: 'กระดาษสำนักงาน',
    label: 'ฉลาก/สติ๊กเกอร์',
};

const automationItems: Array<{
    key: keyof BranchPrintSettings['automation'];
    title: string;
    description: string;
}> = [
    {
        key: 'auto_print_receipt_after_payment',
        title: 'พิมพ์ใบเสร็จอัตโนมัติหลังชำระเงิน',
        description: 'ช่วยให้หน้าร้านจบการขายได้เร็วและลดการกดซ้ำ',
    },
    {
        key: 'auto_print_order_summary_after_close_shift',
        title: 'พิมพ์สรุปยอดอัตโนมัติหลังปิดกะ',
        description: 'เหมาะกับรอบปิดกะที่ต้องการเอกสารสรุปยอดทันที',
    },
    {
        key: 'auto_print_purchase_order_after_submit',
        title: 'พิมพ์ใบสั่งซื้ออัตโนมัติหลังยืนยัน',
        description: 'เหมาะกับการส่งต่อเอกสารให้ฝ่ายจัดซื้อหรือซัพพลายเออร์ทันที',
    },
    {
        key: 'auto_print_table_qr_after_rotation',
        title: 'พิมพ์ QR โต๊ะอัตโนมัติหลังหมุนรหัส',
        description: 'ช่วยให้ป้าย QR ใหม่พร้อมใช้งานทันทีหลังรีเซ็ตรหัสโต๊ะ',
    },
];

function formatTimestamp(value?: string) {
    if (!value) return 'ยังไม่มีประวัติการบันทึก';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'ยังไม่มีประวัติการบันทึก';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getDocumentRows(documentType: PrintDocumentType) {
    if (documentType === 'receipt') return [['เอสเปรสโซ x2', '160.00'], ['ครัวซองต์ x1', '85.00'], ['ส่วนลด', '-20.00'], ['ยอดสุทธิ', '225.00']];
    if (documentType === 'order_summary') return [['จำนวนออเดอร์', '126'], ['ยอดขายรวม', '34,580'], ['เงินสด', '9,800'], ['พร้อมเพย์', '24,780']];
    if (documentType === 'purchase_order') return [['นมสด 2 ลิตร', '24'], ['เมล็ดกาแฟ', '8'], ['ฝาแก้ว', '120'], ['เวลารับของ', '09:00']];
    if (documentType === 'table_qr') return [['โต๊ะ', 'A12'], ['โซน', 'ห้องหลัก'], ['วิธีใช้งาน', 'สแกนเพื่อเปิดเมนู'], ['อายุรหัส', 'หมุนใหม่ทุกเดือน']];
    return [['เทมเพลต', 'กำหนดเอง'], ['สาขา', 'ใช้เฉพาะภายใน'], ['ขนาดกระดาษ', 'ตั้งเอง'], ['สถานะ', 'พร้อมใช้งาน']];
}

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
    const scale = Math.min(2.15, 290 / Math.max(setting.width, 1), 360 / Math.max(canvasHeight, 1));
    const paperWidth = Math.max(140, Math.round(setting.width * scale));
    const paperHeight = Math.max(210, Math.round(canvasHeight * scale));
    const rows = getDocumentRows(documentType);

    return (
        <div className="print-settings-paper-shell">
            <div className="print-settings-paper-frame">
                <div
                    className="print-settings-paper"
                    style={{
                        width: paperWidth,
                        minHeight: paperHeight,
                        padding: `${Math.max(12, setting.margin_top * scale)}px ${Math.max(12, setting.margin_right * scale)}px ${Math.max(12, setting.margin_bottom * scale)}px ${Math.max(12, setting.margin_left * scale)}px`,
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                            {setting.show_logo ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#fef3c7', fontSize: 11, fontWeight: 700 }}>
                                    <ShopOutlined />
                                    {branchName}
                                </div>
                            ) : null}
                            <div style={{ marginTop: 8, fontSize: Math.max(12, 14 * (setting.font_scale / 100)), fontWeight: 800, letterSpacing: 0.2 }}>
                                {meta.label}
                            </div>
                            {setting.show_branch_address ? (
                                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>128 ถนนสุขุมวิท แขวงบริการ เขตธุรกิจ</div>
                            ) : null}
                        </div>

                        {setting.show_order_meta ? (
                            <div style={{ display: 'grid', gap: 4, padding: '8px 0 10px', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', fontSize: 10.5, color: '#334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>โปรไฟล์พิมพ์</span><strong>{printerProfileLabel[setting.printer_profile]}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ขนาดกระดาษ</span><strong>{formatPaperSize(setting)}</strong></div>
                            </div>
                        ) : null}

                        <div style={{ display: 'grid', gap: Math.max(4, 6 * setting.line_spacing), marginTop: 12, fontSize: Math.max(11, 12 * (setting.font_scale / 100)) }}>
                            {rows.map(([label, value]) => (
                                <div key={`${label}-${value}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: label === 'ยอดสุทธิ' ? 700 : 500 }}>
                                    <span>{label}</span>
                                    <span>{value}</span>
                                </div>
                            ))}
                        </div>

                        {setting.show_qr ? (
                            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 76, height: 76, borderRadius: 12, border: '2px dashed #0f766e', display: 'grid', placeItems: 'center', color: '#0f766e', background: '#ecfeff' }}>
                                    <QrcodeOutlined style={{ fontSize: 28 }} />
                                </div>
                            </div>
                        ) : null}

                        {setting.show_footer ? (
                            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: 10, color: '#475569' }}>
                                จำนวนสำเนา {setting.copies} ชุด
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PrintSettingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.lg;
    const initialCachedSettingsRef = useRef<BranchPrintSettings | null>(peekPrintSettings());
    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'print_settings.page', action: 'view' },
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canUpdateSettings = can('print_settings.page', 'update');

    const [selectedDocument, setSelectedDocument] = useState<PrintDocumentType>('receipt');
    const [settings, setSettings] = useState<BranchPrintSettings>(() => initialCachedSettingsRef.current ?? createDefaultPrintSettings());
    const [savedSettings, setSavedSettings] = useState<BranchPrintSettings>(() => initialCachedSettingsRef.current ?? createDefaultPrintSettings());
    const [loading, setLoading] = useState(!initialCachedSettingsRef.current);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [hasIncomingUpdate, setHasIncomingUpdate] = useState(false);

    const branchName = user?.branch?.branch_name || 'สาขาปัจจุบัน';

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
            if (silent) setRefreshing(true);
            else setLoading(true);

            const response = await getPrintSettings({
                forceRefresh: Boolean(options?.forceRefresh),
                allowFallback: false,
            });
            applyLoadedSettings(response);
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถโหลดการตั้งค่าการพิมพ์ได้');
        } finally {
            if (silent) setRefreshing(false);
            else setLoading(false);
        }
    }, [applyLoadedSettings, isAuthorized]);

    useEffect(() => {
        if (isChecking || permissionLoading || !isAuthorized) return;
        void fetchSettings({
            silent: Boolean(initialCachedSettingsRef.current),
            forceRefresh: Boolean(initialCachedSettingsRef.current),
        });
    }, [fetchSettings, isAuthorized, isChecking, permissionLoading]);

    const isDirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(savedSettings), [settings, savedSettings]);
    const isDirtyRef = useRef(isDirty);

    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.printSettings.update],
        onRefresh: () => {
            if (isDirtyRef.current) {
                setHasIncomingUpdate(true);
                return;
            }
            void fetchSettings({ silent: true, forceRefresh: true });
        },
        intervalMs: isConnected ? undefined : 45000,
        enabled: isAuthorized,
        debounceMs: 400,
    });

    useEffect(() => {
        if (!isDirty) return undefined;
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    const currentDocument = settings.documents[selectedDocument];
    const selectedMeta = PRINT_DOCUMENT_META[selectedDocument];
    const currentPresetMeta = getPresetMeta(currentDocument.preset);
    const enabledDocumentCount = countEnabledDocuments(settings);
    const automationCount = countAutomationJobs(settings);
    const charsPerLine = estimateCharsPerLine(currentDocument);

    const updateDocument = useCallback((patch: Partial<PrintDocumentSetting> | ((current: PrintDocumentSetting) => PrintDocumentSetting)) => {
        setSettings((prev) => {
            const current = prev.documents[selectedDocument];
            const nextDocument = typeof patch === 'function' ? patch(current) : { ...current, ...patch, document_type: selectedDocument };
            return { ...prev, documents: { ...prev.documents, [selectedDocument]: nextDocument } };
        });
    }, [selectedDocument]);

    const runWithDiscardGuard = useCallback((
        action: () => void,
        title: string,
        content: string,
        okText: string = 'ยืนยัน'
    ) => {
        if (!isDirty) {
            action();
            return;
        }

        Modal.confirm({
            centered: true,
            title,
            content,
            okText,
            cancelText: 'ยกเลิก',
            okButtonProps: { danger: true },
            onOk: action,
        });
    }, [isDirty]);

    const handleRefresh = useCallback(() => {
        runWithDiscardGuard(
            () => { void fetchSettings({ silent: true, forceRefresh: true }); },
            'โหลดค่าล่าสุดแทนค่าที่กำลังแก้อยู่หรือไม่',
            'การดำเนินการนี้จะทิ้งการแก้ไขที่ยังไม่ได้บันทึก แล้วดึงค่าล่าสุดจากระบบมาแทน',
            'โหลดค่าล่าสุด'
        );
    }, [fetchSettings, runWithDiscardGuard]);

    const handleLoadLatest = useCallback(() => {
        runWithDiscardGuard(
            () => { void fetchSettings({ silent: true, forceRefresh: true }); },
            'พบการอัปเดตจากอุปกรณ์อื่น ต้องการใช้ค่าล่าสุดทันทีหรือไม่',
            'ถ้าดำเนินการต่อ การแก้ไขที่ยังไม่ได้บันทึกในหน้านี้จะถูกแทนที่ด้วยข้อมูลล่าสุดจากระบบ',
            'ใช้ค่าล่าสุด'
        );
    }, [fetchSettings, runWithDiscardGuard]);

    const handleSave = useCallback(async () => {
        if (!canUpdateSettings) {
            message.error('คุณไม่มีสิทธิ์แก้ไขการตั้งค่าการพิมพ์');
            return;
        }

        setSaving(true);
        try {
            const csrfToken = await getCsrfTokenCached();
            const payload = mergePrintSettings(createDefaultPrintSettings(), {
                ...settings,
                locale: settings.locale.trim() || 'th-TH',
            });
            const updated = await printSettingsService.updateSettings(payload, undefined, csrfToken);
            applyLoadedSettings(updated);
            message.success('บันทึกการตั้งค่าการพิมพ์เรียบร้อย');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการตั้งค่าการพิมพ์ได้');
        } finally {
            setSaving(false);
        }
    }, [applyLoadedSettings, canUpdateSettings, settings]);

    const handleResetAll = useCallback(() => {
        Modal.confirm({
            centered: true,
            title: 'คืนค่าเริ่มต้นของทั้งสาขาหรือไม่',
            content: 'ระบบจะเปลี่ยนค่าบนหน้าจอเป็นค่าเริ่มต้นก่อน และจะมีผลจริงเมื่อคุณกดบันทึกเท่านั้น',
            okText: 'คืนค่าเริ่มต้น',
            cancelText: 'ยกเลิก',
            okButtonProps: { danger: true },
            onOk: () => {
                const defaults = createDefaultPrintSettings();
                setSettings((prev) => mergePrintSettings(defaults, { id: prev.id, branch_id: prev.branch_id, created_at: prev.created_at }));
            },
        });
    }, []);

    const handleResetDocument = useCallback(() => {
        const defaults = createDefaultPrintSettings().documents[selectedDocument];
        const nextDocument = currentDocument.unit === defaults.unit ? defaults : convertDocumentUnit(defaults, currentDocument.unit);
        updateDocument(nextDocument);
    }, [currentDocument.unit, selectedDocument, updateDocument]);

    const handlePrintTest = useCallback(() => {
        setPrinting(true);
        const windowRef = reservePrintWindow(`ทดสอบการพิมพ์ - ${selectedMeta.label}`);
        if (!windowRef) {
            message.error('เบราว์เซอร์บล็อก popup สำหรับการทดสอบพิมพ์');
            setPrinting(false);
            return;
        }

        try {
            const rows = getDocumentRows(selectedDocument).map(([label, value]) => `<div class="row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
            const marginCss = [toCssLength(currentDocument.margin_top, currentDocument.unit), toCssLength(currentDocument.margin_right, currentDocument.unit), toCssLength(currentDocument.margin_bottom, currentDocument.unit), toCssLength(currentDocument.margin_left, currentDocument.unit)].join(' ');
            const pageSizeCss = currentDocument.height_mode === 'fixed' && currentDocument.height != null
                ? `size: ${toCssLength(currentDocument.width, currentDocument.unit)} ${toCssLength(currentDocument.height, currentDocument.unit)};`
                : '';
            const sheetHeightCss = currentDocument.height_mode === 'fixed' && currentDocument.height != null
                ? `min-height: ${toCssLength(currentDocument.height, currentDocument.unit)};`
                : '';

            windowRef.document.open();
            windowRef.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>ทดสอบการพิมพ์ - ${escapeHtml(selectedMeta.label)}</title><style>@page { ${pageSizeCss} margin: ${marginCss}; } body { margin: 0; background: #eef2f7; font-family: "Segoe UI", "Sarabun", sans-serif; color: #0f172a; } .stage { min-height: 100vh; display: grid; place-items: center; padding: 16px; } .sheet { width: ${toCssLength(currentDocument.width, currentDocument.unit)}; ${sheetHeightCss} box-sizing: border-box; background: #fffef9; border: 1px solid rgba(15, 23, 42, 0.1); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16); } .content { padding: ${marginCss}; font-size: ${formatNumber(12 * (currentDocument.font_scale / 100))}px; line-height: ${formatNumber(currentDocument.line_spacing)}; } .pill { display: inline-flex; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #fef3c7; font-size: 12px; font-weight: 700; } .header { text-align: center; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1; } .meta { padding: 10px 0; font-size: 12px; border-bottom: 1px dashed #cbd5e1; } .meta-row, .row { display: flex; justify-content: space-between; gap: 10px; } .rows { padding-top: 14px; display: grid; gap: 8px; } .footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #475569; } .qr { margin: 16px auto 0; width: 82px; height: 82px; border-radius: 12px; border: 2px dashed #0f766e; display: grid; place-items: center; color: #0f766e; background: #ecfeff; } @media print { body { background: #fff; } .stage { padding: 0; } .sheet { box-shadow: none; border: none; } }</style></head><body><div class="stage"><div class="sheet"><div class="content"><div class="header">${currentDocument.show_logo ? `<div class="pill">${escapeHtml(branchName)}</div>` : ''}<div style="margin-top: 8px; font-size: ${formatNumber(14 * (currentDocument.font_scale / 100))}px; font-weight: 800;">${escapeHtml(selectedMeta.label)}</div>${currentDocument.show_branch_address ? `<div style="margin-top: 4px; font-size: 11px; color: #475569;">128 ถนนสุขุมวิท แขวงบริการ เขตธุรกิจ</div>` : ''}</div>${currentDocument.show_order_meta ? `<div class="meta"><div class="meta-row"><span>โปรไฟล์พิมพ์</span><strong>${escapeHtml(printerProfileLabel[currentDocument.printer_profile])}</strong></div><div class="meta-row"><span>ขนาดกระดาษ</span><strong>${escapeHtml(formatPaperSize(currentDocument))}</strong></div></div>` : ''}<div class="rows">${rows}</div>${currentDocument.show_qr ? `<div class="qr">QR</div>` : ''}${currentDocument.show_footer ? `<div class="footer">จำนวนสำเนา ${currentDocument.copies} ชุด</div>` : ''}</div></div></div><script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); }); window.addEventListener('afterprint', function () { window.close(); });</script></body></html>`);
            windowRef.document.close();
        } catch (error) {
            closePrintWindow(windowRef);
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปิดหน้าทดสอบการพิมพ์ได้');
        } finally {
            setPrinting(false);
        }
    }, [branchName, currentDocument, selectedDocument, selectedMeta.label]);

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์และโหลดการตั้งค่าการพิมพ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าการพิมพ์" tone="danger" />;
    }

    if (loading) {
        return (
            <div className="print-settings-page">
                <style>{pageStyles}</style>
                <UIPageHeader title="ตั้งค่าการพิมพ์" subtitle="กำลังโหลดข้อมูล..." icon={<PrinterOutlined />} onBack={() => router.back()} />
                <PageContainer>
                    <div style={{ minHeight: 380, display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="print-settings-page">
            <style>{pageStyles}</style>

            <UIPageHeader
                title="ตั้งค่าการพิมพ์"
                subtitle="จัดรูปแบบเอกสารของสาขาให้พิมพ์ง่าย อ่านง่าย และพร้อมใช้งานจริงทุกหน้าจอ"
                icon={<PrinterOutlined />}
                onBack={() => router.back()}
                actions={(
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>
                            โหลดล่าสุด
                        </Button>
                        <Button onClick={handleResetAll} disabled={!canUpdateSettings}>คืนค่าเริ่มต้น</Button>
                        <Button icon={<SyncOutlined />} onClick={handlePrintTest} loading={printing}>ทดสอบพิมพ์</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!canUpdateSettings || !isDirty}>
                            บันทึกการตั้งค่า
                        </Button>
                    </Space>
                )}
            />

            <PageContainer maxWidth={1360}>
                <PageStack>
                    <PageSection>
                        <Card className="print-settings-hero" styles={{ body: { padding: 24 } }}>
                            <div className="print-settings-hero-grid">
                                <div>
                                    <div className="print-settings-hero-badge">
                                        <ShopOutlined />
                                        <span>{branchName}</span>
                                    </div>
                                    <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
                                        จัดการงานพิมพ์ของแต่ละเอกสารให้พร้อมใช้งานจริง
                                    </Title>
                                    <Paragraph className="print-settings-hero-copy">
                                        เลือก preset ที่ใกล้ที่สุด แล้วค่อยปรับขนาดกระดาษ ระยะขอบ และข้อมูลที่ต้องแสดง
                                        เพื่อให้ทีมใช้งานง่ายบนคอมพิวเตอร์ แท็บเล็ต และมือถือ โดยไม่ต้องจำขั้นตอนซับซ้อน
                                    </Paragraph>
                                    <div className="print-settings-hero-tags">
                                        <span className="print-settings-hero-tag">
                                            {isConnected ? 'เชื่อมต่อแบบเรียลไทม์' : 'ใช้การรีเฟรชสำรองอัตโนมัติ'}
                                        </span>
                                        <span className="print-settings-hero-tag">
                                            {canUpdateSettings ? 'บัญชีนี้แก้ไขได้' : 'บัญชีนี้ดูได้อย่างเดียว'}
                                        </span>
                                        <span className="print-settings-hero-tag">
                                            {isDirty ? 'มีรายการรอบันทึก' : 'ข้อมูลบนหน้าจอตรงกับระบบ'}
                                        </span>
                                    </div>
                                </div>

                                <div className="print-settings-hero-highlights">
                                    <div className="print-settings-hero-highlight">
                                        <span className="print-settings-hero-highlight-label">เอกสารที่เปิดใช้งาน</span>
                                        <div className="print-settings-hero-highlight-value">
                                            {enabledDocumentCount} จาก {documentOrder.length} แบบ
                                        </div>
                                        <span className="print-settings-hero-highlight-note">
                                            เอกสารที่ปิดไว้จะไม่ถูกใช้ใน workflow อัตโนมัติของสาขา
                                        </span>
                                    </div>
                                    <div className="print-settings-hero-highlight">
                                        <span className="print-settings-hero-highlight-label">งานอัตโนมัติที่เปิดอยู่</span>
                                        <div className="print-settings-hero-highlight-value">{automationCount} รายการ</div>
                                        <span className="print-settings-hero-highlight-note">
                                            ครอบคลุมงานชำระเงิน ปิดกะ จัดซื้อ และ QR โต๊ะ
                                        </span>
                                    </div>
                                    <div className="print-settings-hero-highlight">
                                        <span className="print-settings-hero-highlight-label">อัปเดตล่าสุด</span>
                                        <div className="print-settings-hero-highlight-value">{formatTimestamp(savedSettings.updated_at)}</div>
                                        <span className="print-settings-hero-highlight-note">
                                            ระบบจะไม่ดึงข้อมูลใหม่มาทับเมื่อคุณกำลังแก้ไขค้างอยู่
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </PageSection>

                    {hasIncomingUpdate ? (
                        <PageSection>
                            <Alert
                                showIcon
                                type="warning"
                                message="พบการอัปเดตจากอุปกรณ์หรือแท็บอื่น"
                                description="เพื่อป้องกันข้อมูลที่คุณกำลังแก้ไขหาย ระบบยังไม่แทนค่าบนหน้าจอนี้โดยอัตโนมัติ"
                                action={<Button size="small" type="primary" onClick={handleLoadLatest}>โหลดค่าล่าสุด</Button>}
                            />
                        </PageSection>
                    ) : null}

                    <PageSection>
                        <div className="print-settings-stats">
                            <div className="print-settings-stat">
                                <Text type="secondary">เอกสารที่กำลังตั้งค่า</Text>
                                <Title level={3} style={{ margin: '8px 0 0', color: '#0f172a' }}>{selectedMeta.label}</Title>
                                <Text type="secondary">{selectedMeta.description}</Text>
                            </div>
                            <div className="print-settings-stat">
                                <Text type="secondary">รูปแบบที่เลือกอยู่</Text>
                                <Title level={3} style={{ margin: '8px 0 0', color: '#0f766e' }}>{currentPresetMeta.label}</Title>
                                <Text type="secondary">{formatPaperSize(currentDocument)}</Text>
                            </div>
                            <div className="print-settings-stat">
                                <Text type="secondary">ตัวอักษรต่อบรรทัดโดยประมาณ</Text>
                                <Title level={3} style={{ margin: '8px 0 0', color: '#0f172a' }}>{charsPerLine}</Title>
                                <Text type="secondary">ใช้ช่วยประเมินว่าหน้ากระดาษแน่นหรือหลวมเกินไปหรือไม่</Text>
                            </div>
                            <div className="print-settings-stat">
                                <Text type="secondary">สถานะการบันทึก</Text>
                                <Title level={4} style={{ margin: '8px 0 0', color: isDirty ? '#c2410c' : '#15803d' }}>
                                    {isDirty ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'พร้อมใช้งาน'}
                                </Title>
                                <Text type="secondary">{isDirty ? 'กดบันทึกเมื่อพร้อมใช้งานจริง' : 'ค่าบนหน้าจอตรงกับข้อมูลในระบบ'}</Text>
                            </div>
                        </div>
                    </PageSection>

                    <Row gutter={[16, 16]} align="top">
                        <Col xs={24} xl={8}>
                            <Card title={isMobile ? 'เลือกเอกสาร' : 'เอกสารที่ต้องตั้งค่า'} extra={<Tag color="cyan">แยกตามสาขา</Tag>} styles={{ body: { paddingTop: 8 } }}>
                                <div className="print-settings-nav">
                                    {documentOrder.map((documentType) => {
                                        const item = settings.documents[documentType];
                                        const meta = PRINT_DOCUMENT_META[documentType];
                                        const active = selectedDocument === documentType;
                                        return (
                                            <button
                                                key={documentType}
                                                type="button"
                                                className={`print-settings-nav-btn ${active ? 'active' : ''}`}
                                                onClick={() => setSelectedDocument(documentType)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{meta.label}</div>
                                                        <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{meta.description}</div>
                                                    </div>
                                                    <Tag color={item.enabled ? 'green' : 'default'} style={{ margin: 0 }}>
                                                        {item.enabled ? 'พร้อมใช้' : 'ปิดอยู่'}
                                                    </Tag>
                                                </div>
                                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    <Tag color="blue" style={{ margin: 0 }}>{formatPaperSize(item)}</Tag>
                                                    <Tag style={{ margin: 0 }}>{densityLabel[item.density]}</Tag>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </Card>

                            <Card title="การทำงานอัตโนมัติ" style={{ marginTop: 16 }} styles={{ body: { display: 'grid', gap: 12 } }}>
                                {automationItems.map((item) => (
                                    <div key={item.key} className="print-settings-toggle">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{item.title}</div>
                                                <Text type="secondary">{item.description}</Text>
                                            </div>
                                            <Switch
                                                checked={settings.automation[item.key]}
                                                disabled={!canUpdateSettings}
                                                onChange={(checked) => setSettings((prev) => ({
                                                    ...prev,
                                                    automation: { ...prev.automation, [item.key]: checked },
                                                }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Card>

                            <Card title="ค่ากลางของสาขา" style={{ marginTop: 16 }}>
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <div className="print-settings-setting-block">
                                        <Text type="secondary">หน่วยหลักของสาขา</Text>
                                        <div style={{ marginTop: 6 }}>
                                            <Segmented<PrintUnit>
                                                block
                                                options={[{ label: 'มม.', value: 'mm' }, { label: 'นิ้ว', value: 'in' }]}
                                                value={settings.default_unit}
                                                onChange={(value) => setSettings((prev) => ({ ...prev, default_unit: value }))}
                                                disabled={!canUpdateSettings}
                                            />
                                        </div>
                                    </div>
                                    <div className="print-settings-setting-block">
                                        <Text type="secondary">รูปแบบภาษาและเวลา</Text>
                                        <Input
                                            value={settings.locale}
                                            disabled={!canUpdateSettings}
                                            onChange={(event) => setSettings((prev) => ({ ...prev, locale: event.target.value }))}
                                            placeholder="th-TH"
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="print-settings-setting-block">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>อนุญาตให้ปรับจากหน้าปฏิบัติงาน</div>
                                                <Text type="secondary">เปิดไว้เมื่อสาขาจำเป็นต้องปรับบางเอกสารได้จากหน้าหน้างาน</Text>
                                            </div>
                                            <Switch
                                                checked={settings.allow_manual_override}
                                                disabled={!canUpdateSettings}
                                                onChange={(checked) => setSettings((prev) => ({ ...prev, allow_manual_override: checked }))}
                                            />
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} xl={16}>
                            <Card
                                title={selectedMeta.label}
                                extra={(
                                    <Space size={8} wrap>
                                        <Tag color="geekblue">{selectedMeta.shortLabel}</Tag>
                                        <Tag>{presetCategoryLabel[currentDocument.printer_profile]}</Tag>
                                        {isDirty ? <Tag color="orange">รอบันทึก</Tag> : <Tag color="green">ล่าสุด</Tag>}
                                    </Space>
                                )}
                            >
                                {!canUpdateSettings ? (
                                    <Alert
                                        style={{ marginBottom: 16 }}
                                        type="warning"
                                        showIcon
                                        message="เปิดในโหมดดูอย่างเดียว"
                                        description="บัญชีนี้ตรวจสอบการตั้งค่าการพิมพ์ได้ แต่ไม่มีสิทธิ์บันทึกหรือแก้ไขค่าใหม่"
                                    />
                                ) : null}

                                {isMobile ? (
                                    <div style={{ marginBottom: 16 }}>
                                        <Segmented<PrintDocumentType>
                                            block
                                            options={documentOrder.map((documentType) => ({
                                                label: PRINT_DOCUMENT_META[documentType].shortLabel,
                                                value: documentType,
                                            }))}
                                            value={selectedDocument}
                                            onChange={setSelectedDocument}
                                        />
                                    </div>
                                ) : null}

                                <Paragraph type="secondary" style={{ marginBottom: 18 }}>{selectedMeta.description}</Paragraph>

                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                                    <Space wrap size={8}>
                                        <Tooltip title="ใช้ตัวเลขนี้ช่วยประเมินว่าข้อความบนกระดาษจะอัดแน่นหรือหลวมเกินไปหรือไม่">
                                            <Tag icon={<DeploymentUnitOutlined />} color="blue">{charsPerLine} ตัวต่อบรรทัด</Tag>
                                        </Tooltip>
                                        <Tag icon={<CopyOutlined />} color="gold">{currentDocument.copies} สำเนา</Tag>
                                        <Tag icon={<BgColorsOutlined />} color="green">{densityLabel[currentDocument.density]}</Tag>
                                    </Space>
                                    <Space wrap size={8}>
                                        <Button onClick={handleResetDocument} disabled={!canUpdateSettings}>คืนค่าเอกสารนี้</Button>
                                        <Button icon={<SyncOutlined />} onClick={handlePrintTest} loading={printing}>ทดสอบพิมพ์</Button>
                                    </Space>
                                </div>

                                <Divider style={{ marginBlock: 14 }} />

                                <Title level={5}>เลือกรูปแบบที่ใกล้กับเครื่องจริงที่สุด</Title>
                                <div className="print-settings-presets">
                                    {PRINT_PRESET_OPTIONS.map((preset) => {
                                        const recommended = selectedMeta.recommendedPresets.includes(preset.value);
                                        const active = currentDocument.preset === preset.value;
                                        return (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                className={`print-settings-preset ${active ? 'active' : ''}`}
                                                disabled={!canUpdateSettings}
                                                onClick={() => updateDocument((current) => applyPresetToDocument(current, preset.value))}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                    <div style={{ fontWeight: 700 }}>{preset.label}</div>
                                                    {recommended ? <Tag color="green" style={{ margin: 0 }}>แนะนำ</Tag> : null}
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{preset.description}</div>
                                                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    <Tag color="blue" style={{ margin: 0 }}>
                                                        {preset.height == null ? `${formatNumber(preset.width)} มม. x auto` : `${formatNumber(preset.width)} x ${formatNumber(preset.height)} มม.`}
                                                    </Tag>
                                                    <Tag style={{ margin: 0 }}>{presetCategoryLabel[preset.printerProfile]}</Tag>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <Divider style={{ marginBlock: 18 }} />

                                <Title level={5}>ปรับเครื่องพิมพ์และกระดาษ</Title>
                                <Row gutter={[12, 12]}>
                                    <Col xs={24} md={8}>
                                        <Text type="secondary">ประเภทเครื่องพิมพ์</Text>
                                        <Segmented<PrintPrinterProfile>
                                            block
                                            style={{ width: '100%', marginTop: 6 }}
                                            value={currentDocument.printer_profile}
                                            disabled={!canUpdateSettings}
                                            onChange={(value) => updateDocument({ printer_profile: value })}
                                            options={[
                                                { label: 'ความร้อน', value: 'thermal' },
                                                { label: 'สำนักงาน', value: 'laser' },
                                                { label: 'สติ๊กเกอร์', value: 'label' },
                                            ]}
                                        />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Text type="secondary">หน่วยวัด</Text>
                                        <Segmented<PrintUnit>
                                            block
                                            style={{ marginTop: 6 }}
                                            value={currentDocument.unit}
                                            disabled={!canUpdateSettings}
                                            options={[{ label: 'มม.', value: 'mm' }, { label: 'นิ้ว', value: 'in' }]}
                                            onChange={(value) => updateDocument((current) => convertDocumentUnit(current, value))}
                                        />
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Text type="secondary">แนวกระดาษ</Text>
                                        <Segmented<'portrait' | 'landscape'>
                                            block
                                            style={{ marginTop: 6 }}
                                            value={currentDocument.orientation}
                                            disabled={!canUpdateSettings}
                                            options={[{ label: 'แนวตั้ง', value: 'portrait' }, { label: 'แนวนอน', value: 'landscape' }]}
                                            onChange={(value) => updateDocument({ orientation: value })}
                                        />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Text type="secondary">ความกว้าง</Text>
                                        <InputNumber
                                            min={1}
                                            max={500}
                                            precision={2}
                                            value={currentDocument.width}
                                            disabled={!canUpdateSettings}
                                            onChange={(value) => updateDocument({ width: Number(value || 0) })}
                                            addonAfter={currentDocument.unit}
                                            style={{ width: '100%', marginTop: 6 }}
                                        />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Text type="secondary">รูปแบบความสูง</Text>
                                        <Segmented<'auto' | 'fixed'>
                                            block
                                            style={{ marginTop: 6 }}
                                            value={currentDocument.height_mode}
                                            disabled={!canUpdateSettings}
                                            options={[{ label: 'อัตโนมัติ', value: 'auto' }, { label: 'กำหนดเอง', value: 'fixed' }]}
                                            onChange={(value) =>
                                                updateDocument((current) => ({
                                                    ...current,
                                                    height_mode: value,
                                                    height: value === 'auto' ? null : current.height ?? Number(current.width.toFixed(2)),
                                                }))
                                            }
                                        />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Text type="secondary">ความสูง</Text>
                                        <InputNumber
                                            min={1}
                                            max={500}
                                            precision={2}
                                            value={currentDocument.height ?? undefined}
                                            disabled={!canUpdateSettings || currentDocument.height_mode === 'auto'}
                                            onChange={(value) => updateDocument({ height: value == null ? null : Number(value) })}
                                            addonAfter={currentDocument.unit}
                                            style={{ width: '100%', marginTop: 6 }}
                                        />
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Text type="secondary">จำนวนสำเนา</Text>
                                        <InputNumber
                                            min={1}
                                            max={5}
                                            precision={0}
                                            value={currentDocument.copies}
                                            disabled={!canUpdateSettings}
                                            onChange={(value) => updateDocument({ copies: Number(value || 1) })}
                                            style={{ width: '100%', marginTop: 6 }}
                                        />
                                    </Col>
                                </Row>

                                <Divider style={{ marginBlock: 18 }} />

                                <Title level={5}>ปรับให้อ่านง่ายและไม่แน่นเกินไป</Title>
                                <Row gutter={[12, 12]}>
                                    <Col xs={24} md={12}>
                                        <Text type="secondary">ความหนาแน่นของเนื้อหา</Text>
                                        <Segmented<PrintDocumentSetting['density']>
                                            block
                                            style={{ marginTop: 6 }}
                                            value={currentDocument.density}
                                            disabled={!canUpdateSettings}
                                            options={[{ label: 'กะทัดรัด', value: 'compact' }, { label: 'สมดุล', value: 'comfortable' }, { label: 'โปร่ง', value: 'spacious' }]}
                                            onChange={(value) => updateDocument({ density: value })}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Text type="secondary">ขนาดตัวอักษร</Text>
                                        <div style={{ paddingInline: 8, marginTop: 6 }}>
                                            <Slider
                                                min={70}
                                                max={180}
                                                value={currentDocument.font_scale}
                                                disabled={!canUpdateSettings}
                                                onChange={(value) => updateDocument({ font_scale: Number(value) })}
                                                tooltip={{ formatter: (value) => `${value}%` }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Text type="secondary">ระยะห่างบรรทัด</Text>
                                        <div style={{ paddingInline: 8, marginTop: 6 }}>
                                            <Slider
                                                min={0.8}
                                                max={2}
                                                step={0.05}
                                                value={currentDocument.line_spacing}
                                                disabled={!canUpdateSettings}
                                                onChange={(value) => updateDocument({ line_spacing: Number(value) })}
                                                tooltip={{ formatter: (value) => `${value}x` }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Text type="secondary">ระยะขอบกระดาษ</Text>
                                        <Row gutter={[8, 8]} style={{ marginTop: 6 }}>
                                            <Col span={12}>
                                                <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_top} disabled={!canUpdateSettings} addonBefore="บน" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_top: Number(value || 0) })} style={{ width: '100%' }} />
                                            </Col>
                                            <Col span={12}>
                                                <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_right} disabled={!canUpdateSettings} addonBefore="ขวา" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_right: Number(value || 0) })} style={{ width: '100%' }} />
                                            </Col>
                                            <Col span={12}>
                                                <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_bottom} disabled={!canUpdateSettings} addonBefore="ล่าง" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_bottom: Number(value || 0) })} style={{ width: '100%' }} />
                                            </Col>
                                            <Col span={12}>
                                                <InputNumber min={0} max={60} precision={2} value={currentDocument.margin_left} disabled={!canUpdateSettings} addonBefore="ซ้าย" addonAfter={currentDocument.unit} onChange={(value) => updateDocument({ margin_left: Number(value || 0) })} style={{ width: '100%' }} />
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>

                                <Divider style={{ marginBlock: 18 }} />

                                <Title level={5}>เลือกข้อมูลที่ต้องแสดงบนเอกสาร</Title>
                                <div className="print-settings-toggle-grid">
                                    {[
                                        { key: 'enabled', label: 'เปิดใช้งานเอกสารนี้', value: currentDocument.enabled },
                                        { key: 'show_logo', label: 'แสดงโลโก้หรือชื่อสาขา', value: currentDocument.show_logo },
                                        { key: 'show_branch_address', label: 'แสดงข้อมูลติดต่อสาขา', value: currentDocument.show_branch_address },
                                        { key: 'show_order_meta', label: 'แสดงข้อมูลอ้างอิงของงานพิมพ์', value: currentDocument.show_order_meta },
                                        { key: 'show_qr', label: 'แสดง QR ภายในเอกสาร', value: currentDocument.show_qr },
                                        { key: 'show_footer', label: 'แสดงข้อความท้ายเอกสาร', value: currentDocument.show_footer },
                                        { key: 'cut_paper', label: 'สั่งตัดกระดาษหลังพิมพ์', value: currentDocument.cut_paper },
                                    ].map((item) => (
                                        <div key={item.key} className="print-settings-toggle">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <Text strong>{item.label}</Text>
                                                <Switch
                                                    checked={item.value}
                                                    disabled={!canUpdateSettings}
                                                    onChange={(checked) => updateDocument({ [item.key]: checked } as Partial<PrintDocumentSetting>)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Divider style={{ marginBlock: 18 }} />

                                <Title level={5}>หมายเหตุสำหรับทีมงาน</Title>
                                <Input.TextArea
                                    rows={3}
                                    maxLength={140}
                                    value={currentDocument.note || ''}
                                    disabled={!canUpdateSettings}
                                    onChange={(event) => updateDocument({ note: event.target.value || null })}
                                    placeholder="ตัวอย่าง: ใช้กับเครื่องพิมพ์หน้าเคาน์เตอร์ 80 มม. และควรทดสอบพิมพ์ทุกครั้งก่อนใช้จริง"
                                />
                            </Card>

                            <Card title="ตัวอย่างก่อนพิมพ์" style={{ marginTop: 16 }}>
                                <Row gutter={[16, 16]} align="middle">
                                    <Col xs={24} lg={13}>
                                        <DocumentPreview documentType={selectedDocument} setting={currentDocument} branchName={branchName} />
                                    </Col>
                                    <Col xs={24} lg={11}>
                                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                            <Alert showIcon type="success" message={selectedMeta.label} description={`รูปแบบปัจจุบัน: ${currentPresetMeta.label} | ${formatPaperSize(currentDocument)}`} />
                                            <Card size="small" bordered={false} style={{ background: '#f8fafc' }}>
                                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">ประเภทเครื่องพิมพ์</Text><Text strong>{printerProfileLabel[currentDocument.printer_profile]}</Text></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">ตัวอักษรต่อบรรทัด</Text><Text strong>{charsPerLine}</Text></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">ระยะขอบ</Text><Text strong>{`${formatNumber(currentDocument.margin_top)}/${formatNumber(currentDocument.margin_right)}/${formatNumber(currentDocument.margin_bottom)}/${formatNumber(currentDocument.margin_left)} ${currentDocument.unit}`}</Text></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">จำนวนสำเนา</Text><Text strong>{currentDocument.copies}</Text></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text type="secondary">บันทึกล่าสุด</Text><Text strong>{formatTimestamp(savedSettings.updated_at)}</Text></div>
                                                </Space>
                                            </Card>
                                            <Card size="small" bordered={false} style={{ background: '#fff7ed' }}>
                                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <FileDoneOutlined style={{ color: '#c2410c' }} />
                                                        <Text strong>แนวทางที่แนะนำ</Text>
                                                    </div>
                                                    <Text type="secondary">เริ่มจาก preset ที่ระบบแนะนำก่อน แล้วค่อยปรับเฉพาะค่าที่จำเป็น เช่น ขนาดตัวอักษร ระยะขอบ หรือจำนวนสำเนา</Text>
                                                    <Text type="secondary">ถ้ามีการเปลี่ยนประเภทเครื่องพิมพ์ เช่น จากเครื่องความร้อนเป็น A4 หรือฉลาก ควรทดสอบพิมพ์ทุกครั้งก่อนใช้งานจริง</Text>
                                                </Space>
                                            </Card>
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </PageStack>
            </PageContainer>
        </div>
    );
}
