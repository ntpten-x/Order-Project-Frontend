export type PrintDocumentType =
    | "receipt"
    | "order_summary"
    | "purchase_order"
    | "table_qr"
    | "kitchen_ticket"
    | "custom";

export type PrintUnit = "mm" | "in";
export type PrintOrientation = "portrait" | "landscape";
export type PrintPreset =
    | "thermal_58mm"
    | "thermal_80mm"
    | "a4_portrait"
    | "a5_portrait"
    | "label_4x6"
    | "custom";
export type PrintPrinterProfile = "thermal" | "laser" | "label";
export type PrintDensity = "compact" | "comfortable" | "spacious";
export type PrintHeightMode = "auto" | "fixed";

export interface PrintDocumentSetting {
    document_type: PrintDocumentType;
    enabled: boolean;
    preset: PrintPreset;
    printer_profile: PrintPrinterProfile;
    unit: PrintUnit;
    orientation: PrintOrientation;
    width: number;
    height: number | null;
    height_mode: PrintHeightMode;
    margin_top: number;
    margin_right: number;
    margin_bottom: number;
    margin_left: number;
    font_scale: number;
    line_spacing: number;
    copies: number;
    density: PrintDensity;
    show_logo: boolean;
    show_qr: boolean;
    show_footer: boolean;
    show_branch_address: boolean;
    show_order_meta: boolean;
    cut_paper: boolean;
    note?: string | null;
}

export interface PrintAutomationSettings {
    auto_print_receipt_after_payment: boolean;
    auto_print_order_summary_after_close_shift: boolean;
    auto_print_purchase_order_after_submit: boolean;
    auto_print_table_qr_after_rotation: boolean;
    auto_print_kitchen_ticket_after_submit: boolean;
}

export interface PrintSettingsDocuments {
    receipt: PrintDocumentSetting;
    order_summary: PrintDocumentSetting;
    purchase_order: PrintDocumentSetting;
    table_qr: PrintDocumentSetting;
    kitchen_ticket: PrintDocumentSetting;
    custom: PrintDocumentSetting;
}

export interface PrintSettingsPayload {
    default_unit: PrintUnit;
    locale: string;
    allow_manual_override: boolean;
    automation: PrintAutomationSettings;
    documents: PrintSettingsDocuments;
}

export interface BranchPrintSettings extends PrintSettingsPayload {
    id?: string;
    branch_id?: string;
    created_at?: string;
    updated_at?: string;
}

