import { createDefaultPrintSettings } from "../../utils/print-settings/defaults";
import { buildPdfPreviewWindowHtml, shouldUseReceiptRollPdf } from "../../utils/print-settings/runtime";

describe("print-settings runtime", () => {
    it("uses roll PDF rendering for thermal receipts with auto height", () => {
        const receiptSetting = createDefaultPrintSettings().documents.receipt;

        expect(shouldUseReceiptRollPdf(receiptSetting)).toBe(true);
    });

    it("does not use roll PDF rendering for fixed-height receipts", () => {
        const receiptSetting = {
            ...createDefaultPrintSettings().documents.receipt,
            height_mode: "fixed" as const,
            height: 210,
        };

        expect(shouldUseReceiptRollPdf(receiptSetting)).toBe(false);
    });

    it("does not use roll PDF rendering for non-thermal printers", () => {
        const receiptSetting = {
            ...createDefaultPrintSettings().documents.receipt,
            printer_profile: "laser" as const,
            preset: "a4_portrait" as const,
            height_mode: "fixed" as const,
            height: 297,
            width: 210,
        };

        expect(shouldUseReceiptRollPdf(receiptSetting)).toBe(false);
    });

    it("builds an image-based preview shell when a rendered receipt preview is available", () => {
        const html = buildPdfPreviewWindowHtml({
            title: "Receipt #ORD-001",
            filename: "receipt-ord-001.pdf",
            objectUrl: "blob:receipt-preview",
            previewPage: {
                src: "data:image/png;base64,preview",
                width: 80,
                height: 180,
                unit: "mm",
            },
        });

        expect(html).toContain('id="preview-image"');
        expect(html).toContain('class="preview-page-shell"');
        expect(html).toContain('href="blob:receipt-preview"');
        expect(html).toContain("window.print()");
        expect(html).not.toContain('id="preview-frame"');
    });
});
