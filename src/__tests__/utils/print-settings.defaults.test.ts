import {
    applyPresetToDocument,
    countEnabledDocuments,
    createDefaultPrintSettings,
    formatPaperSize,
} from "../../utils/print-settings/defaults";

describe("print settings defaults", () => {
    it("creates a branch-scoped default profile with production-friendly presets", () => {
        const settings = createDefaultPrintSettings();

        expect(settings.documents.receipt.preset).toBe("thermal_80mm");
        expect(settings.documents.receipt.width).toBe(80);
        expect(settings.documents.table_qr.preset).toBe("label_4x6");
        expect(settings.documents.custom.enabled).toBe(false);
        expect(countEnabledDocuments(settings)).toBe(5);
    });

    it("applies preset dimensions while preserving the current unit", () => {
        const settings = createDefaultPrintSettings();
        const receiptInches = { ...settings.documents.receipt, unit: "in" as const, width: 3.15, height: null };
        const updated = applyPresetToDocument(receiptInches, "thermal_58mm");

        expect(updated.unit).toBe("in");
        expect(updated.width).toBeCloseTo(2.28, 2);
        expect(formatPaperSize(updated)).toContain("auto");
    });
});
