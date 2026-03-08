import { zipSync } from "fflate";
import { loadPdfExport } from "../../lib/dynamic-imports";
import { PrintDocumentSetting, PrintUnit } from "../../types/api/pos/printSettings";
import { downloadBlob } from "../browser/download";

function convertToMm(value: number, unit: PrintUnit): number {
    return unit === "mm" ? value : value * 25.4;
}

function convertFromMm(value: number, unit: PrintUnit): number {
    return unit === "mm" ? value : value / 25.4;
}

function getEffectiveDocumentSize(
    setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "orientation" | "unit">
) {
    const width = setting.width;
    const rawHeight =
        setting.height_mode === "fixed" && setting.height != null
            ? setting.height
            : convertFromMm(convertToMm(setting.width, setting.unit) * 1.5, setting.unit);

    if (setting.orientation === "landscape") {
        return {
            width: rawHeight,
            height: width,
        };
    }

    return {
        width,
        height: rawHeight,
    };
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type));
    if (!blob) {
        throw new Error("Unable to convert QR canvas to blob");
    }
    return blob;
}

export async function createBulkTableQrPdfExporter(setting: PrintDocumentSetting): Promise<{
    addCanvas: (canvas: HTMLCanvasElement) => void;
    download: (filename: string) => void;
}> {
    const { default: JsPdfCtor } = await loadPdfExport();
    const pageSize = getEffectiveDocumentSize(setting);
    const doc = new JsPdfCtor({
        orientation: setting.orientation,
        unit: setting.unit,
        format: [pageSize.width, pageSize.height],
    });

    let isFirstPage = true;

    return {
        addCanvas(canvas) {
            const imageDataUrl = canvas.toDataURL("image/png");
            if (!isFirstPage) {
                doc.addPage([pageSize.width, pageSize.height], setting.orientation);
            }
            doc.addImage(imageDataUrl, "PNG", 0, 0, pageSize.width, pageSize.height, undefined, "FAST");
            isFirstPage = false;
        },
        download(filename) {
            const blob = doc.output("blob");
            downloadBlob(blob, filename);
        },
    };
}

export async function buildBulkTableQrPngZipEntry(
    canvas: HTMLCanvasElement
): Promise<Uint8Array> {
    const blob = await canvasToBlob(canvas, "image/png");
    return new Uint8Array(await blob.arrayBuffer());
}

export function downloadBulkTableQrZip(
    files: Record<string, Uint8Array>,
    filename: string
): void {
    const archiveBytes = new Uint8Array(Array.from(zipSync(files, { level: 6 })));
    const blob = new Blob([archiveBytes], { type: "application/zip" });
    downloadBlob(blob, filename);
}
