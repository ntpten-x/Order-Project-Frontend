import { loadPdfExport } from "../../lib/dynamic-imports";
import { PrintDocumentSetting, PrintUnit } from "../../types/api/pos/printSettings";
import { downloadBlob, triggerDownloadFromUrl } from "../browser/download";

// High-resolution export density (~609.6 DPI)
const DEFAULT_PX_PER_MM = 24;
const QR_FRAME_PADDING_PX = 18;
const QR_EXPORT_SUBTITLE = "สแกนเพื่อเปิดเมนูและสั่งสั่งอาหาร";

function convertToMm(value: number, unit: PrintUnit): number {
    return unit === "mm" ? value : value * 25.4;
}

function convertFromMm(value: number, unit: PrintUnit): number {
    return unit === "mm" ? value : value / 25.4;
}

function toPixels(value: number, unit: PrintUnit, pxPerMm = DEFAULT_PX_PER_MM): number {
    return Math.max(1, Math.round(convertToMm(value, unit) * pxPerMm));
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("โหลดภาพ QR ไม่สำเร็จ"));
        image.src = src;
    });
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

export async function buildTableQrExportCanvas(options: {
    tableName: string;
    customerUrl: string;
    qrImageDataUrl: string;
    qrCodeExpiresAt?: string | null;
    setting: PrintDocumentSetting;
    locale?: string;
}): Promise<HTMLCanvasElement> {
    const { tableName, customerUrl, qrImageDataUrl, setting } = options;
    const pageSize = getEffectiveDocumentSize(setting);
    const canvas = document.createElement("canvas");
    canvas.width = toPixels(pageSize.width, setting.unit);
    canvas.height = toPixels(pageSize.height, setting.unit);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("ไม่สามารถสร้างเอกสาร QR ได้");
    }

    const qrImage = await loadImage(qrImageDataUrl);
    const marginLeft = toPixels(setting.margin_left, setting.unit);
    const marginRight = toPixels(setting.margin_right, setting.unit);
    const marginTop = toPixels(setting.margin_top, setting.unit);
    const marginBottom = toPixels(setting.margin_bottom, setting.unit);
    const contentWidth = Math.max(1, canvas.width - marginLeft - marginRight);
    const contentHeight = Math.max(1, canvas.height - marginTop - marginBottom);
    const centerX = Math.round(canvas.width / 2);
    const baseFont = Math.max(22, Math.round(contentWidth * 0.055 * (Math.max(setting.font_scale, 70) / 100)));
    const titleFontSize = baseFont;
    const subtitleFontSize = Math.max(18, Math.round(baseFont * 0.55));
    const urlFontSize = Math.max(16, Math.round(baseFont * 0.42));
    const titleFont = `700 ${titleFontSize}px "Noto Sans Thai", "Segoe UI", sans-serif`;
    const subtitleFont = `500 ${subtitleFontSize}px "Noto Sans Thai", "Segoe UI", sans-serif`;
    const urlFont = `400 ${urlFontSize}px "Noto Sans Thai", "Segoe UI", sans-serif`;
    const titleLineHeight = Math.round(titleFontSize * 1.2);
    const subtitleLineHeight = Math.round(subtitleFontSize * 1.3);
    const urlLineHeight = Math.round(urlFontSize * 1.45);
    const titleToSubtitleGap = Math.round(baseFont * 0.35);
    const subtitleToQrGap = Math.round(baseFont * 0.8);
    const qrToUrlGap = Math.round(baseFont * 0.8);
    const urlLines = customerUrl.match(/.{1,44}/g) || [customerUrl];
    const urlBlockHeight = urlLines.length * urlLineHeight;
    const qrMaxSize = Math.max(
        1,
        Math.min(
            contentWidth - QR_FRAME_PADDING_PX * 2,
            contentHeight -
                titleLineHeight -
                titleToSubtitleGap -
                subtitleLineHeight -
                subtitleToQrGap -
                qrToUrlGap -
                urlBlockHeight -
                QR_FRAME_PADDING_PX * 2
        )
    );
    const qrPreferredSize = Math.round(contentWidth * 0.62);
    const qrSize = Math.max(1, Math.min(qrMaxSize, qrPreferredSize));
    const qrFrameSize = qrSize + QR_FRAME_PADDING_PX * 2;
    const contentBlockHeight =
        titleLineHeight +
        titleToSubtitleGap +
        subtitleLineHeight +
        subtitleToQrGap +
        qrFrameSize +
        qrToUrlGap +
        urlBlockHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let currentY = marginTop + Math.max(0, Math.round((contentHeight - contentBlockHeight) / 2));

    ctx.fillStyle = "#0f172a";
    ctx.font = titleFont;
    ctx.fillText(`โต๊ะ ${tableName}`, centerX, currentY);
    currentY += titleLineHeight + titleToSubtitleGap;

    ctx.fillStyle = "#475569";
    ctx.font = subtitleFont;
    ctx.fillText(QR_EXPORT_SUBTITLE, centerX, currentY);
    currentY += subtitleLineHeight + subtitleToQrGap;

    // Snap the QR block to whole pixels and disable smoothing for sharp edges.
    const qrX = Math.round(centerX - qrSize / 2);
    const qrY = Math.round(currentY + QR_FRAME_PADDING_PX);
    const qrFrameX = qrX - QR_FRAME_PADDING_PX;
    const qrFrameY = qrY - QR_FRAME_PADDING_PX;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 3;
    ctx.strokeRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();
    currentY += qrFrameSize + qrToUrlGap;

    ctx.fillStyle = "#64748b";
    ctx.font = urlFont;
    urlLines.forEach((line, index) => {
        ctx.fillText(line, centerX, currentY + index * urlLineHeight);
    });

    return canvas;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
    triggerDownloadFromUrl(canvas.toDataURL("image/png"), filename);
}

export async function saveCanvasAsPdf(options: {
    canvas: HTMLCanvasElement;
    filename: string;
    setting: PrintDocumentSetting;
}): Promise<void> {
    const { canvas, filename, setting } = options;
    const imageDataUrl = canvas.toDataURL("image/png");
    const { default: JsPdfCtor } = await loadPdfExport();
    const pageSize = getEffectiveDocumentSize(setting);
    const doc = new JsPdfCtor({
        orientation: setting.orientation,
        unit: setting.unit,
        format: [pageSize.width, pageSize.height],
    });

    doc.addImage(imageDataUrl, "PNG", 0, 0, pageSize.width, pageSize.height, undefined, "FAST");
    const blob = doc.output("blob");
    downloadBlob(blob, filename);
}
