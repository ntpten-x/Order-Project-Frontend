import * as XLSX from "xlsx";
import { strFromU8, unzipSync } from "fflate";
import { createDefaultDocumentSetting } from "../../utils/print-settings/defaults";
import {
    applyWorkbookPageSetup,
    buildWorksheetPageSetupXml,
} from "../../utils/print-settings/excelPageSetup";

describe("excel page setup", () => {
    it("builds OOXML page setup metadata for A4 documents", () => {
        const setting = createDefaultDocumentSetting("order_summary");

        expect(buildWorksheetPageSetupXml(setting)).toContain('paperSize="9"');
        expect(buildWorksheetPageSetupXml(setting)).toContain('paperWidth="210mm"');
        expect(buildWorksheetPageSetupXml(setting)).toContain('paperHeight="297mm"');
        expect(buildWorksheetPageSetupXml(setting)).toContain('orientation="portrait"');
    });

    it("injects pageSetup into every worksheet xml inside the workbook zip", () => {
        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.aoa_to_sheet([["Summary"], ["Value"]]);
        const recentSheet = XLSX.utils.aoa_to_sheet([["Recent"], ["Order"]]);
        summarySheet["!margins"] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
        recentSheet["!margins"] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
        XLSX.utils.book_append_sheet(workbook, recentSheet, "Recent");

        const setting = {
            ...createDefaultDocumentSetting("order_summary"),
            preset: "a5_portrait" as const,
            width: 148,
            height: 210,
        };

        const workbookBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const patchedWorkbookBytes = applyWorkbookPageSetup(workbookBytes, setting);
        const archive = unzipSync(patchedWorkbookBytes);
        const sheetOneXml = strFromU8(archive["xl/worksheets/sheet1.xml"]);
        const sheetTwoXml = strFromU8(archive["xl/worksheets/sheet2.xml"]);

        expect(sheetOneXml).toContain("<pageSetup");
        expect(sheetOneXml).toContain('paperSize="11"');
        expect(sheetOneXml).toContain('paperWidth="148mm"');
        expect(sheetOneXml).toContain('paperHeight="210mm"');
        expect(sheetTwoXml).toContain("<pageSetup");
        expect(sheetTwoXml).toContain('paperSize="11"');
    });
});
