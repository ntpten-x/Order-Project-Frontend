import { createDefaultPrintSettings } from "../../utils/print-settings/defaults";
import {
    calculateReceiptRollHeight,
    createTableQrPrintDocument,
    RECEIPT_MAX_PAGE_HEIGHT_MM,
    chunkTableQrItems,
    planReceiptQrPages,
    resolveTableQrPrintSetting,
} from "../../utils/print-settings/tableQrPrintExport";
import { loadPdfExport } from "../../lib/dynamic-imports";
import { buildTableQrExportCanvas } from "../../utils/print-settings/tableQrExport";

jest.mock("../../lib/dynamic-imports", () => ({
    loadPdfExport: jest.fn(),
}));

jest.mock("../../utils/print-settings/tableQrExport", () => ({
    buildTableQrExportCanvas: jest.fn(),
}));

describe("tableQrPrintExport", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

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

    it("calculates a single continuous receipt roll height for all QR items", () => {
        expect(
            calculateReceiptRollHeight({
                itemCount: 3,
                cardHeight: 100,
                gap: 4,
                marginTop: 4,
                marginBottom: 4,
            })
        ).toBe(316);
    });

    it("opens receipt exports in the auto-print preview shell when preview pages are available", async () => {
        class MockJsPdf {
            addImage = jest.fn();

            output = jest.fn(() => new Blob(["pdf"], { type: "application/pdf" }));
        }

        (loadPdfExport as jest.Mock).mockResolvedValue({
            default: MockJsPdf,
        });
        (buildTableQrExportCanvas as jest.Mock).mockResolvedValue({
            toDataURL: jest.fn(() => "data:image/png;base64,qr-card"),
        });

        const previewCanvas = {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ({
                fillStyle: "#ffffff",
                fillRect: jest.fn(),
                drawImage: jest.fn(),
            })),
            toDataURL: jest.fn(() => "data:image/png;base64,qr-preview"),
        };
        const originalCreateElement = document.createElement.bind(document);
        jest.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
            if (tagName.toLowerCase() === "canvas") {
                return previewCanvas as unknown as HTMLCanvasElement;
            }
            return originalCreateElement(tagName);
        }) as typeof document.createElement);

        const printDocument = await createTableQrPrintDocument({
            items: [{
                tableName: "A01",
                customerUrl: "https://example.com/table/A01",
                qrImageDataUrl: "data:image/png;base64,qr",
            }],
            mode: "receipt",
            baseSetting: createDefaultPrintSettings().documents.table_qr,
        });

        const targetWindow = {
            document: {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
            },
        } as unknown as Window;

        printDocument.openInWindow(targetWindow, {
            filename: "table-qr-a01-receipt.pdf",
            title: "Table QR A01",
        });

        const renderedHtml = (targetWindow.document.write as jest.Mock).mock.calls[0]?.[0] as string;

        expect(renderedHtml).toContain("window.print()");
        expect(renderedHtml).toContain('class="print-root"');
        expect(renderedHtml).toContain('class="page-image"');
        expect(renderedHtml).not.toContain("preview-frame");
    });
});
