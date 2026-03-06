import {
    BranchPrintSettings,
    PrintDocumentSetting,
    PrintDocumentType,
    PrintPreset,
    PrintPrinterProfile,
    PrintSettingsPayload,
    PrintUnit,
} from "../../types/api/pos/printSettings";

type PresetMeta = {
    value: PrintPreset;
    label: string;
    description: string;
    printerProfile: PrintPrinterProfile;
    width: number;
    height: number | null;
    heightMode: "auto" | "fixed";
    orientation: "portrait" | "landscape";
};

type DocumentMeta = {
    key: PrintDocumentType;
    label: string;
    shortLabel: string;
    description: string;
    recommendedPresets: PrintPreset[];
};

export const PRINT_PRESET_OPTIONS: PresetMeta[] = [
    {
        value: "thermal_58mm",
        label: "Thermal 58 mm",
        description: "Compact receipt roll for low-volume counters.",
        printerProfile: "thermal",
        width: 58,
        height: null,
        heightMode: "auto",
        orientation: "portrait",
    },
    {
        value: "thermal_80mm",
        label: "Thermal 80 mm",
        description: "Recommended for standard POS receipts and kitchen slips.",
        printerProfile: "thermal",
        width: 80,
        height: null,
        heightMode: "auto",
        orientation: "portrait",
    },
    {
        value: "a4_portrait",
        label: "A4 Portrait",
        description: "Standard office print for summary and purchase documents.",
        printerProfile: "laser",
        width: 210,
        height: 297,
        heightMode: "fixed",
        orientation: "portrait",
    },
    {
        value: "a5_portrait",
        label: "A5 Portrait",
        description: "Half-sheet operational print, useful for compact handouts.",
        printerProfile: "laser",
        width: 148,
        height: 210,
        heightMode: "fixed",
        orientation: "portrait",
    },
    {
        value: "label_4x6",
        label: "Label 4x6",
        description: "Common shipping and table QR label format.",
        printerProfile: "label",
        width: 101.6,
        height: 152.4,
        heightMode: "fixed",
        orientation: "portrait",
    },
    {
        value: "custom",
        label: "Custom",
        description: "Manual dimensions for branch-specific hardware.",
        printerProfile: "laser",
        width: 210,
        height: 297,
        heightMode: "fixed",
        orientation: "portrait",
    },
];

const PRESET_BY_VALUE = Object.fromEntries(
    PRINT_PRESET_OPTIONS.map((preset) => [preset.value, preset])
) as Record<PrintPreset, PresetMeta>;

export const PRINT_DOCUMENT_META: Record<PrintDocumentType, DocumentMeta> = {
    receipt: {
        key: "receipt",
        label: "ใบเสร็จ",
        shortLabel: "Receipt",
        description: "ลูกค้ารับหลังชำระเงิน ต้องอ่านง่ายและพิมพ์ไว",
        recommendedPresets: ["thermal_80mm", "thermal_58mm"],
    },
    order_summary: {
        key: "order_summary",
        label: "ใบสรุป",
        shortLabel: "Summary",
        description: "เอกสารสรุปยอดหรือปิดกะสำหรับงานหลังบ้าน",
        recommendedPresets: ["a4_portrait", "a5_portrait"],
    },
    purchase_order: {
        key: "purchase_order",
        label: "ใบสั่งซื้อ",
        shortLabel: "Purchase",
        description: "เอกสารสั่งซื้อสำหรับ supplier หรือ stock workflow",
        recommendedPresets: ["a4_portrait", "a5_portrait"],
    },
    table_qr: {
        key: "table_qr",
        label: "QR Code โต๊ะ",
        shortLabel: "Table QR",
        description: "ป้าย QR สำหรับหน้าร้าน ต้องสแกนง่ายและคมชัด",
        recommendedPresets: ["label_4x6", "a5_portrait"],
    },
    kitchen_ticket: {
        key: "kitchen_ticket",
        label: "ใบส่งครัว",
        shortLabel: "Kitchen",
        description: "ใบสั่งผลิต/ส่งครัว เน้นความกระชับและอ่านเร็ว",
        recommendedPresets: ["thermal_80mm", "thermal_58mm"],
    },
    custom: {
        key: "custom",
        label: "เอกสารอื่น ๆ",
        shortLabel: "Custom",
        description: "พื้นที่เผื่อสำหรับ template พิเศษของแต่ละสาขา",
        recommendedPresets: ["custom", "a4_portrait"],
    },
};

const BASE_DOCUMENT_DEFAULTS = {
    enabled: true,
    unit: "mm" as PrintUnit,
    margin_top: 4,
    margin_right: 4,
    margin_bottom: 4,
    margin_left: 4,
    font_scale: 100,
    line_spacing: 1.2,
    copies: 1,
    density: "comfortable" as const,
    show_logo: true,
    show_qr: false,
    show_footer: true,
    show_branch_address: true,
    show_order_meta: true,
    cut_paper: false,
    note: null,
};

const DOCUMENT_OVERRIDES: Record<
    PrintDocumentType,
    Partial<PrintDocumentSetting> & { preset: PrintPreset }
> = {
    receipt: {
        preset: "thermal_80mm",
        density: "compact",
        margin_top: 3,
        margin_right: 3,
        margin_bottom: 3,
        margin_left: 3,
        line_spacing: 1.12,
        show_qr: true,
        cut_paper: true,
    },
    order_summary: {
        preset: "a4_portrait",
        margin_top: 10,
        margin_right: 10,
        margin_bottom: 12,
        margin_left: 10,
        line_spacing: 1.28,
    },
    purchase_order: {
        preset: "a4_portrait",
        margin_top: 12,
        margin_right: 12,
        margin_bottom: 14,
        margin_left: 12,
        line_spacing: 1.3,
    },
    table_qr: {
        preset: "label_4x6",
        printer_profile: "label",
        margin_top: 6,
        margin_right: 6,
        margin_bottom: 6,
        margin_left: 6,
        font_scale: 110,
        line_spacing: 1.15,
        show_qr: true,
        show_footer: false,
        show_order_meta: false,
    },
    kitchen_ticket: {
        preset: "thermal_80mm",
        density: "compact",
        margin_top: 2,
        margin_right: 2,
        margin_bottom: 2,
        margin_left: 2,
        font_scale: 96,
        line_spacing: 1.08,
        show_logo: false,
        show_footer: false,
        show_branch_address: false,
        cut_paper: true,
    },
    custom: {
        preset: "custom",
        enabled: false,
        margin_top: 8,
        margin_right: 8,
        margin_bottom: 8,
        margin_left: 8,
        line_spacing: 1.25,
    },
};

function convertValue(value: number, from: PrintUnit, to: PrintUnit): number {
    if (from === to) return value;
    return from === "mm" ? value / 25.4 : value * 25.4;
}

export function formatNumber(value: number): string {
    const rounded = Number(value.toFixed(2));
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function toCssLength(value: number, unit: PrintUnit): string {
    return `${formatNumber(value)}${unit}`;
}

export function formatPaperSize(setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "unit">): string {
    if (setting.height_mode === "auto" || setting.height == null) {
        return `${formatNumber(setting.width)}${setting.unit} x auto`;
    }
    return `${formatNumber(setting.width)} x ${formatNumber(setting.height)} ${setting.unit}`;
}

export function estimateCharsPerLine(setting: Pick<PrintDocumentSetting, "width" | "unit" | "font_scale">): number {
    const widthInMm = setting.unit === "mm" ? setting.width : convertValue(setting.width, "in", "mm");
    const base = widthInMm / 2.2;
    return Math.max(16, Math.round(base * (100 / Math.max(setting.font_scale, 70))));
}

export function getPresetMeta(preset: PrintPreset): PresetMeta {
    return PRESET_BY_VALUE[preset];
}

export function createDefaultDocumentSetting(documentType: PrintDocumentType): PrintDocumentSetting {
    const override = DOCUMENT_OVERRIDES[documentType];
    const preset = PRESET_BY_VALUE[override.preset];

    return {
        ...BASE_DOCUMENT_DEFAULTS,
        printer_profile: preset.printerProfile,
        width: preset.width,
        height: preset.height,
        height_mode: preset.heightMode,
        orientation: preset.orientation,
        ...override,
        document_type: documentType,
    };
}

export function createDefaultPrintSettings(): BranchPrintSettings {
    return {
        default_unit: "mm",
        locale: "th-TH",
        allow_manual_override: true,
        automation: {
            auto_print_receipt_after_payment: true,
            auto_print_order_summary_after_close_shift: false,
            auto_print_purchase_order_after_submit: false,
            auto_print_table_qr_after_rotation: false,
            auto_print_kitchen_ticket_after_submit: true,
        },
        documents: {
            receipt: createDefaultDocumentSetting("receipt"),
            order_summary: createDefaultDocumentSetting("order_summary"),
            purchase_order: createDefaultDocumentSetting("purchase_order"),
            table_qr: createDefaultDocumentSetting("table_qr"),
            kitchen_ticket: createDefaultDocumentSetting("kitchen_ticket"),
            custom: createDefaultDocumentSetting("custom"),
        },
    };
}

export function mergePrintSettings(
    base?: Partial<BranchPrintSettings> | null,
    incoming?: Partial<BranchPrintSettings> | null
): BranchPrintSettings {
    const defaults = createDefaultPrintSettings();
    const existingDocs = base?.documents;
    const nextDocs = incoming?.documents;

    const mergeDocument = (documentType: PrintDocumentType): PrintDocumentSetting => ({
        ...defaults.documents[documentType],
        ...(existingDocs?.[documentType] || {}),
        ...(nextDocs?.[documentType] || {}),
        document_type: documentType,
    });

    return {
        ...(base?.id ? { id: base.id } : {}),
        ...(incoming?.id ? { id: incoming.id } : {}),
        branch_id: incoming?.branch_id ?? base?.branch_id,
        created_at: incoming?.created_at ?? base?.created_at,
        updated_at: incoming?.updated_at ?? base?.updated_at,
        default_unit: incoming?.default_unit ?? base?.default_unit ?? defaults.default_unit,
        locale: incoming?.locale ?? base?.locale ?? defaults.locale,
        allow_manual_override:
            incoming?.allow_manual_override ??
            base?.allow_manual_override ??
            defaults.allow_manual_override,
        automation: {
            ...defaults.automation,
            ...(base?.automation || {}),
            ...(incoming?.automation || {}),
        },
        documents: {
            receipt: mergeDocument("receipt"),
            order_summary: mergeDocument("order_summary"),
            purchase_order: mergeDocument("purchase_order"),
            table_qr: mergeDocument("table_qr"),
            kitchen_ticket: mergeDocument("kitchen_ticket"),
            custom: mergeDocument("custom"),
        },
    };
}

export function convertDocumentUnit(
    document: PrintDocumentSetting,
    nextUnit: PrintUnit
): PrintDocumentSetting {
    if (document.unit === nextUnit) return document;

    return {
        ...document,
        unit: nextUnit,
        width: Number(convertValue(document.width, document.unit, nextUnit).toFixed(2)),
        height:
            document.height == null
                ? null
                : Number(convertValue(document.height, document.unit, nextUnit).toFixed(2)),
        margin_top: Number(convertValue(document.margin_top, document.unit, nextUnit).toFixed(2)),
        margin_right: Number(convertValue(document.margin_right, document.unit, nextUnit).toFixed(2)),
        margin_bottom: Number(convertValue(document.margin_bottom, document.unit, nextUnit).toFixed(2)),
        margin_left: Number(convertValue(document.margin_left, document.unit, nextUnit).toFixed(2)),
    };
}

export function applyPresetToDocument(
    document: PrintDocumentSetting,
    preset: PrintPreset
): PrintDocumentSetting {
    const presetMeta = PRESET_BY_VALUE[preset];
    const width = convertValue(presetMeta.width, "mm", document.unit);
    const height =
        presetMeta.height == null ? null : convertValue(presetMeta.height, "mm", document.unit);

    return {
        ...document,
        preset,
        printer_profile: presetMeta.printerProfile,
        orientation: presetMeta.orientation,
        width: Number(width.toFixed(2)),
        height: height == null ? null : Number(height.toFixed(2)),
        height_mode: presetMeta.heightMode,
    };
}

export function countEnabledDocuments(settings: PrintSettingsPayload): number {
    return Object.values(settings.documents).filter((item) => item.enabled).length;
}

export function countAutomationJobs(settings: PrintSettingsPayload): number {
    return Object.values(settings.automation).filter(Boolean).length;
}
