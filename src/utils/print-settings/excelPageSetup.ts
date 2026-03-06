import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { PrintDocumentSetting } from "../../types/api/pos/printSettings";

const A4_MM = { width: 210, height: 297, code: 9 };
const A5_MM = { width: 148, height: 210, code: 11 };

function toMm(value: number, unit: PrintDocumentSetting["unit"]): number {
    return unit === "mm" ? value : value * 25.4;
}

function formatMm(value: number): string {
    const rounded = Number(value.toFixed(2));
    return Number.isInteger(rounded) ? `${rounded}mm` : `${rounded.toFixed(2)}mm`;
}

function inferPageHeightMm(setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "width" | "unit" | "preset">): number {
    if (setting.height_mode === "fixed" && setting.height != null) {
        return toMm(setting.height, setting.unit);
    }

    if (setting.preset === "a4_portrait") {
        return A4_MM.height;
    }

    if (setting.preset === "a5_portrait") {
        return A5_MM.height;
    }

    return toMm(setting.width, setting.unit) * Math.SQRT2;
}

function getOrientedPageSizeMm(
    setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "orientation" | "preset" | "unit" | "width">
) {
    const rawWidthMm = toMm(setting.width, setting.unit);
    const rawHeightMm = inferPageHeightMm(setting);

    if (setting.orientation === "landscape") {
        return {
            widthMm: Math.max(rawWidthMm, rawHeightMm),
            heightMm: Math.min(rawWidthMm, rawHeightMm),
        };
    }

    return {
        widthMm: Math.min(rawWidthMm, rawHeightMm),
        heightMm: Math.max(rawWidthMm, rawHeightMm),
    };
}

function getPortraitPaperSizeMm(
    setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "orientation" | "preset" | "unit" | "width">
) {
    const { widthMm, heightMm } = getOrientedPageSizeMm(setting);
    return {
        widthMm: Math.min(widthMm, heightMm),
        heightMm: Math.max(widthMm, heightMm),
    };
}

function isApproxPaper(
    actual: { widthMm: number; heightMm: number },
    expected: { width: number; height: number },
    toleranceMm = 3
): boolean {
    return (
        Math.abs(actual.widthMm - expected.width) <= toleranceMm &&
        Math.abs(actual.heightMm - expected.height) <= toleranceMm
    );
}

function getNearestPaperCode(actual: { widthMm: number; heightMm: number }): number {
    const a4Delta = Math.abs(actual.widthMm - A4_MM.width) + Math.abs(actual.heightMm - A4_MM.height);
    const a5Delta = Math.abs(actual.widthMm - A5_MM.width) + Math.abs(actual.heightMm - A5_MM.height);
    return a5Delta < a4Delta ? A5_MM.code : A4_MM.code;
}

function resolvePaperCode(
    setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "orientation" | "preset" | "unit" | "width">
): number {
    if (setting.preset === "a4_portrait") return A4_MM.code;
    if (setting.preset === "a5_portrait") return A5_MM.code;

    const portrait = getPortraitPaperSizeMm(setting);
    if (isApproxPaper(portrait, A4_MM)) return A4_MM.code;
    if (isApproxPaper(portrait, A5_MM)) return A5_MM.code;

    return getNearestPaperCode(portrait);
}

export function buildWorksheetPageSetupXml(
    setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "orientation" | "preset" | "unit" | "width">
): string {
    const { widthMm, heightMm } = getOrientedPageSizeMm(setting);
    const paperCode = resolvePaperCode(setting);

    return `<pageSetup orientation="${setting.orientation}" paperSize="${paperCode}" paperWidth="${formatMm(
        widthMm
    )}" paperHeight="${formatMm(heightMm)}"/>`;
}

export function upsertWorksheetPageSetupXml(worksheetXml: string, pageSetupXml: string): string {
    const withoutExistingPageSetup = worksheetXml
        .replace(/<pageSetup\b[^>]*\/>/i, "")
        .replace(/<pageSetup\b[^>]*>[\s\S]*?<\/pageSetup>/i, "");

    if (/<pageMargins\b[^>]*\/>/i.test(withoutExistingPageSetup)) {
        return withoutExistingPageSetup.replace(/(<pageMargins\b[^>]*\/>)/i, `$1${pageSetupXml}`);
    }

    if (/<headerFooter\b/i.test(withoutExistingPageSetup)) {
        return withoutExistingPageSetup.replace(/<headerFooter\b/i, `${pageSetupXml}<headerFooter`);
    }

    return withoutExistingPageSetup.replace(/<\/worksheet>\s*$/i, `${pageSetupXml}</worksheet>`);
}

export function applyWorkbookPageSetup(
    workbookBytes: ArrayBuffer | Uint8Array,
    setting: Pick<PrintDocumentSetting, "height" | "height_mode" | "orientation" | "preset" | "unit" | "width">
): Uint8Array {
    const archive = unzipSync(workbookBytes instanceof Uint8Array ? workbookBytes : new Uint8Array(workbookBytes));
    const pageSetupXml = buildWorksheetPageSetupXml(setting);

    Object.keys(archive).forEach((entryName) => {
        if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(entryName)) {
            return;
        }

        const worksheetXml = strFromU8(archive[entryName]);
        archive[entryName] = strToU8(upsertWorksheetPageSetupXml(worksheetXml, pageSetupXml));
    });

    return zipSync(archive, { level: 6 });
}

export function downloadWorkbookBytes(workbookBytes: Uint8Array, filename: string): void {
    const normalizedBytes = new Uint8Array(workbookBytes.byteLength);
    normalizedBytes.set(workbookBytes);
    const blob = new Blob(
        [normalizedBytes.buffer],
        {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
    );
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
