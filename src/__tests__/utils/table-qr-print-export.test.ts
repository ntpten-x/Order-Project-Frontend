import { createDefaultPrintSettings } from "../../utils/print-settings/defaults";
import {
    RECEIPT_MAX_PAGE_HEIGHT_MM,
    chunkTableQrItems,
    planReceiptQrPages,
    resolveTableQrPrintSetting,
} from "../../utils/print-settings/tableQrPrintExport";

describe("tableQrPrintExport", () => {
    it("chunks A4 exports into groups of four", () => {
        expect(chunkTableQrItems(["a", "b", "c", "d", "e"], 4)).toEqual([
            ["a", "b", "c", "d"],
            ["e"],
        ]);
    });

    it("resolves an A4 profile for standard printer output", () => {
        const baseSetting = createDefaultPrintSettings().documents.table_qr;
        const resolved = resolveTableQrPrintSetting(baseSetting, "a4");

        expect(resolved.preset).toBe("a4_portrait");
        expect(resolved.printer_profile).toBe("laser");
        expect(resolved.height_mode).toBe("fixed");
        expect(resolved.height).not.toBeNull();
    });

    it("resolves a thermal profile for receipt printer output", () => {
        const baseSetting = createDefaultPrintSettings().documents.table_qr;
        const resolved = resolveTableQrPrintSetting(baseSetting, "receipt");

        expect(resolved.preset).toBe("thermal_80mm");
        expect(resolved.printer_profile).toBe("thermal");
        expect(resolved.height_mode).toBe("auto");
        expect(resolved.height).toBeNull();
    });

    it("splits receipt pages when the page height would exceed the safety cap", () => {
        const plans = planReceiptQrPages({
            itemCount: 20,
            cardHeightMm: 120,
            gapMm: 4,
            pageTopMm: 4,
            pageBottomMm: 4,
        });

        expect(plans.length).toBeGreaterThan(1);
        expect(plans.every((plan) => plan.pageHeightMm <= RECEIPT_MAX_PAGE_HEIGHT_MM)).toBe(true);
        expect(plans.reduce((sum, plan) => sum + plan.itemCount, 0)).toBe(20);
    });
});
