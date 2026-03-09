import { zipSync } from "fflate";
import { downloadBlob } from "../browser/download";

async function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type));
    if (!blob) {
        throw new Error("Unable to convert QR canvas to blob");
    }
    return blob;
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
