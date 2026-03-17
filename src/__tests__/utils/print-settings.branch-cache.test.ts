jest.mock("../../services/pos/printSettings.service", () => ({
    printSettingsService: {
        getSettings: jest.fn(),
    },
}));

import { printSettingsService } from "../../services/pos/printSettings.service";
import {
    getPrintSettings,
    invalidatePrintSettingsCache,
} from "../../utils/print-settings/runtime";

const mockedPrintSettingsService = printSettingsService as jest.Mocked<typeof printSettingsService>;

describe("print settings branch cache", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        invalidatePrintSettingsCache();
        mockedPrintSettingsService.getSettings.mockResolvedValue({
            id: "settings-1",
            branch_id: "branch-1",
            default_unit: "mm",
            locale: "th-TH",
            allow_manual_override: true,
            automation: {
                auto_print_receipt_after_payment: true,
                auto_print_order_summary_after_close_shift: false,
                auto_print_purchase_order_after_submit: false,
                auto_print_table_qr_after_rotation: false,
            },
            documents: {
                receipt: {
                    document_type: "receipt",
                    enabled: true,
                    preset: "thermal_80mm",
                    printer_profile: "thermal",
                    unit: "mm",
                    orientation: "portrait",
                    width: 80,
                    height: null,
                    height_mode: "auto",
                    margin_top: 3,
                    margin_right: 3,
                    margin_bottom: 3,
                    margin_left: 3,
                    font_scale: 100,
                    line_spacing: 1.12,
                    copies: 1,
                    density: "compact",
                    show_logo: true,
                    show_qr: true,
                    show_footer: true,
                    show_branch_address: true,
                    show_order_meta: true,
                    cut_paper: true,
                    note: null,
                },
                order_summary: {
                    document_type: "order_summary",
                    enabled: true,
                    preset: "a4_portrait",
                    printer_profile: "laser",
                    unit: "mm",
                    orientation: "portrait",
                    width: 210,
                    height: 297,
                    height_mode: "fixed",
                    margin_top: 10,
                    margin_right: 10,
                    margin_bottom: 12,
                    margin_left: 10,
                    font_scale: 100,
                    line_spacing: 1.28,
                    copies: 1,
                    density: "comfortable",
                    show_logo: true,
                    show_qr: false,
                    show_footer: true,
                    show_branch_address: true,
                    show_order_meta: true,
                    cut_paper: false,
                    note: null,
                },
                purchase_order: {
                    document_type: "purchase_order",
                    enabled: true,
                    preset: "a4_portrait",
                    printer_profile: "laser",
                    unit: "mm",
                    orientation: "portrait",
                    width: 210,
                    height: 297,
                    height_mode: "fixed",
                    margin_top: 12,
                    margin_right: 12,
                    margin_bottom: 14,
                    margin_left: 12,
                    font_scale: 100,
                    line_spacing: 1.3,
                    copies: 1,
                    density: "comfortable",
                    show_logo: true,
                    show_qr: false,
                    show_footer: true,
                    show_branch_address: true,
                    show_order_meta: true,
                    cut_paper: false,
                    note: null,
                },
                table_qr: {
                    document_type: "table_qr",
                    enabled: true,
                    preset: "label_4x6",
                    printer_profile: "label",
                    unit: "mm",
                    orientation: "portrait",
                    width: 101.6,
                    height: 152.4,
                    height_mode: "fixed",
                    margin_top: 6,
                    margin_right: 6,
                    margin_bottom: 6,
                    margin_left: 6,
                    font_scale: 110,
                    line_spacing: 1.15,
                    copies: 1,
                    density: "comfortable",
                    show_logo: true,
                    show_qr: true,
                    show_footer: false,
                    show_branch_address: true,
                    show_order_meta: false,
                    cut_paper: false,
                    note: null,
                },
                custom: {
                    document_type: "custom",
                    enabled: false,
                    preset: "custom",
                    printer_profile: "laser",
                    unit: "mm",
                    orientation: "portrait",
                    width: 210,
                    height: 297,
                    height_mode: "fixed",
                    margin_top: 8,
                    margin_right: 8,
                    margin_bottom: 8,
                    margin_left: 8,
                    font_scale: 100,
                    line_spacing: 1.25,
                    copies: 1,
                    density: "comfortable",
                    show_logo: true,
                    show_qr: false,
                    show_footer: true,
                    show_branch_address: true,
                    show_order_meta: true,
                    cut_paper: false,
                    note: null,
                },
            },
        });
    });

    it("invalidates cached print settings when active branch changes", async () => {
        await getPrintSettings();
        await getPrintSettings();

        expect(mockedPrintSettingsService.getSettings).toHaveBeenCalledTimes(1);

        window.dispatchEvent(new CustomEvent("active-branch-changed", { detail: { activeBranchId: "branch-2" } }));

        await getPrintSettings();

        expect(mockedPrintSettingsService.getSettings).toHaveBeenCalledTimes(2);
    });
});
