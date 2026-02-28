import { loadPdfExport } from "../../lib/dynamic-imports";
import { PrintDocumentSetting, PrintUnit } from "../../types/api/pos/printSettings";

const DEFAULT_PX_PER_MM = 12;

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

function getEffectiveDocumentSize(setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "orientation" | "unit">) {
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
    const { tableName, customerUrl, qrImageDataUrl, qrCodeExpiresAt, setting, locale = "th-TH" } = options;
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
    const baseFont = Math.max(22, Math.round(contentWidth * 0.055 * (Math.max(setting.font_scale, 70) / 100)));
    const titleFont = `700 ${baseFont}px "Noto Sans Thai", "Segoe UI", sans-serif`;
    const subtitleFont = `500 ${Math.max(18, Math.round(baseFont * 0.55))}px "Noto Sans Thai", "Segoe UI", sans-serif`;
    const metaFont = `400 ${Math.max(16, Math.round(baseFont * 0.42))}px "Noto Sans Thai", "Segoe UI", sans-serif`;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#0f172a";
    ctx.font = titleFont;
    const titleY = marginTop + Math.round(baseFont * 1.1);
    ctx.fillText(`โต๊ะ ${tableName}`, canvas.width / 2, titleY);

    const subtitleY = titleY + Math.round(baseFont * 0.92);
    ctx.fillStyle = "#475569";
    ctx.font = subtitleFont;
    ctx.fillText("สแกนเพื่อเปิดเมนู", canvas.width / 2, subtitleY);

    const availableHeight = contentHeight - Math.round(baseFont * 2.6) - Math.round(baseFont * 3.4);
    const qrSize = Math.max(
        Math.min(contentWidth, availableHeight) - Math.round(baseFont * 0.4),
        Math.round(contentWidth * 0.5)
    );
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = subtitleY + Math.round(baseFont * 0.8);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    const urlLines = customerUrl.match(/.{1,44}/g) || [customerUrl];
    ctx.fillStyle = "#64748b";
    ctx.font = metaFont;
    const urlStartY = qrY + qrSize + Math.round(baseFont * 0.9);
    urlLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, urlStartY + index * Math.round(baseFont * 0.55));
    });

    const footerLines = [];
    if (qrCodeExpiresAt) {
        footerLines.push(
            `หมดอายุ ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(qrCodeExpiresAt))}`
        );
    }
    footerLines.push(
        `สร้างเมื่อ ${new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`
    );

    const footerBaseY = canvas.height - marginBottom - Math.round(baseFont * 0.2) - (footerLines.length - 1) * Math.round(baseFont * 0.48);
    footerLines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, footerBaseY + index * Math.round(baseFont * 0.48));
    });

    return canvas;
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
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
    doc.save(filename);
}
