import { loadPdfExport } from "../../lib/dynamic-imports";
import { PrintDocumentSetting, PrintPreset, PrintUnit } from "../../types/api/pos/printSettings";
import { downloadBlob } from "../browser/download";
import { applyPresetToDocument } from "./defaults";
import { buildTableQrExportCanvas } from "./tableQrExport";

export type TableQrPrintMode = "a4" | "receipt";
export type TableQrA4Layout = "grid4" | "single";

export type TableQrPrintItem = {
    tableName: string;
    customerUrl: string;
    qrImageDataUrl: string;
    qrCodeExpiresAt?: string | null;
    heading?: string;
    subtitle?: string;
};

type ReceiptPagePlan = {
    itemCount: number;
    pageHeightMm: number;
};

const A4_ITEMS_PER_PAGE = 4;
const A4_GRID_GAP_MM = 10;
const A4_CARD_MARGIN_MM = 6;
const RECEIPT_CARD_MARGIN_MM = 3;
const RECEIPT_ITEM_GAP_MM = 4;
const RECEIPT_CARD_HEIGHT_RATIO = 1.45;
const RECEIPT_MIN_CARD_HEIGHT_MM = 96;
const PREVIEW_PX_PER_MM = 5;
export const RECEIPT_MAX_PAGE_HEIGHT_MM = 1400;

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

function mm(value: number, unit: PrintUnit): number {
    return convertFromMm(value, unit);
}

function toPixels(value: number, unit: PrintUnit, pxPerMm = PREVIEW_PX_PER_MM): number {
    return Math.max(1, Math.round(convertToMm(value, unit) * pxPerMm));
}

function toCssLength(value: number, unit: PrintUnit): string {
    return `${Number(value.toFixed(3))}${unit}`;
}

function buildPageSizeCss(
    setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "unit" | "orientation">
): string {
    const effective = getEffectiveDocumentSize(setting);
    if (setting.height_mode === "auto" || effective.height == null) {
        return `${toCssLength(effective.width, setting.unit)} auto`;
    }

    return `${toCssLength(effective.width, setting.unit)} ${toCssLength(effective.height, setting.unit)}`;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

type PreviewPlacement = {
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
};

export type TableQrPreviewPage = {
    src: string;
    width: number;
    height: number;
    unit: PrintUnit;
};

function buildPreviewPageImage(options: {
    pageWidth: number;
    pageHeight: number;
    unit: PrintUnit;
    placements: PreviewPlacement[];
}): TableQrPreviewPage {
    const canvas = document.createElement("canvas");
    canvas.width = toPixels(options.pageWidth, options.unit);
    canvas.height = toPixels(options.pageHeight, options.unit);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Unable to build QR print preview");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    options.placements.forEach((placement) => {
        ctx.drawImage(
            placement.canvas,
            toPixels(placement.x, options.unit),
            toPixels(placement.y, options.unit),
            toPixels(placement.width, options.unit),
            toPixels(placement.height, options.unit)
        );
    });

    return {
        src: canvas.toDataURL("image/png"),
        width: options.pageWidth,
        height: options.pageHeight,
        unit: options.unit,
    };
}

// Legacy preview helper is kept as a fallback for environments that cannot use the print shell path.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function writePreviewWindow(options: {
    targetWindow: Window;
    blob: Blob;
    title: string;
    filename: string;
    previewPages: TableQrPreviewPage[];
}): void {
    const objectUrl = URL.createObjectURL(options.blob);
    const previewTitle = escapeHtml(options.title);
    const downloadName = escapeHtml(options.filename);
    const previewMarkup = options.previewPages
        .map(
            (page, index) => `<section class="preview-page-shell" style="--page-width:${toCssLength(
                page.width,
                page.unit
            )};--page-height:${toCssLength(page.height, page.unit)}">
    <img class="preview-page" src="${page.src}" alt="Preview page ${index + 1}" />
  </section>`
        )
        .join("");
    const previewContent =
        previewMarkup || `<div class="preview-empty">Preview is not available for this document.</div>`;

    options.targetWindow.document.open();
    options.targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${previewTitle}</title>
  <style>
    :root {
      --surface: #ffffff;
      --surface-alt: #f8fafc;
      --border: #dbe2ea;
      --ink: #0f172a;
      --muted: #475569;
      --brand: #2563eb;
      --brand-dark: #1d4ed8;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      color: var(--ink);
      background: var(--surface-alt);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.98);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .title-wrap h1 {
      margin: 0;
      font-size: 18px;
    }
    .title-wrap p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .button,
    .button:visited {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .button-primary {
      background: var(--brand);
      border-color: var(--brand);
      color: #ffffff;
    }
    .button-primary:hover {
      background: var(--brand-dark);
      border-color: var(--brand-dark);
    }
    .preview-shell {
      padding: 16px;
      display: grid;
      gap: 16px;
    }
    .preview-page-shell {
      width: min(100%, 980px);
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }
    .preview-page {
      display: block;
      width: 100%;
      height: auto;
      background: #ffffff;
    }
    .preview-empty {
      width: min(100%, 640px);
      margin: 0 auto;
      padding: 24px;
      border-radius: 18px;
      border: 1px dashed var(--border);
      text-align: center;
      color: var(--muted);
      background: #ffffff;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .toolbar {
        display: none;
      }
      .preview-shell {
        padding: 0;
        gap: 0;
      }
      .preview-page-shell {
        width: var(--page-width);
        min-height: var(--page-height);
        margin: 0 auto;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }
      .preview-page-shell:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      .preview-page {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="title-wrap">
      <h1>${previewTitle}</h1>
      <p>ตรวจร่างก่อน แล้วเลือกพิมพ์ ดาวน์โหลด หรือปิดหน้าต่างนี้</p>
    </div>
    <div class="actions">
      <button id="print-button" class="button button-primary" type="button">พิมพ์</button>
      <a id="download-button" class="button" href="${objectUrl}" download="${downloadName}">ดาวน์โหลด PDF</a>
      <button id="close-button" class="button" type="button">ปิด</button>
    </div>
  </div>
  <div class="preview-shell">${previewContent}</div>
  <script>
    (function () {
      var objectUrl = ${JSON.stringify(objectUrl)};
      var printButton = document.getElementById("print-button");
      var closeButton = document.getElementById("close-button");

      printButton && printButton.addEventListener("click", function () {
        window.print();
      });
      closeButton && closeButton.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("beforeunload", function () {
        try { URL.revokeObjectURL(objectUrl); } catch (error) {}
      });
    })();
  </script>
</body>
</html>`);
    options.targetWindow.document.close();
}

function writePrintWindow(options: {
    targetWindow: Window;
    title: string;
    pageSizeCss: string;
    previewPages: TableQrPreviewPage[];
}): void {
    const printTitle = escapeHtml(options.title);
    const pageMarkup = options.previewPages
        .map(
            (page, index) => `<section class="page" style="--page-width:${toCssLength(
                page.width,
                page.unit
            )};--page-height:${toCssLength(page.height, page.unit)}">
    <img class="page-image" src="${page.src}" alt="QR print page ${index + 1}" />
  </section>`
        )
        .join("");

    options.targetWindow.document.open();
    options.targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${printTitle}</title>
  <style>
    @page {
      size: ${options.pageSizeCss};
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      color: #0f172a;
    }

    .print-root {
      display: grid;
      gap: 16px;
      padding: 16px;
    }

    .page {
      width: min(100%, 980px);
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }

    .page-image {
      display: block;
      width: 100%;
      height: auto;
    }

    @media print {
      html, body {
        background: #ffffff;
      }

      .print-root {
        display: block;
        padding: 0;
      }

      .page {
        width: var(--page-width);
        min-height: var(--page-height);
        margin: 0 auto;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }

      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="print-root">${pageMarkup}</div>
  <script>
    (function () {
      var afterPrint = function () {
        try { window.close(); } catch (error) {}
      };
      var waitForImages = function () {
        var images = Array.prototype.slice.call(document.images || []);
        if (!images.length) return Promise.resolve();
        return Promise.all(images.map(function (img) {
          if (img.complete) return Promise.resolve();
          return new Promise(function (resolve) {
            var done = function () { resolve(); };
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            setTimeout(done, 1200);
          });
        }));
      };
      window.addEventListener("afterprint", afterPrint);
      waitForImages().finally(function () {
        setTimeout(function () {
          window.focus();
          window.print();
        }, 180);
      });
    })();
  </script>
</body>
</html>`);
    options.targetWindow.document.close();
}

function resolveReceiptPreset(setting: Pick<PrintDocumentSetting, "width" | "unit">): PrintPreset {
    return convertToMm(setting.width, setting.unit) <= 60 ? "thermal_58mm" : "thermal_80mm";
}

export function resolveTableQrPrintSetting(
    baseSetting: PrintDocumentSetting,
    mode: TableQrPrintMode
): PrintDocumentSetting {
    const preset = mode === "a4" ? "a4_portrait" : resolveReceiptPreset(baseSetting);
    const nextSetting = applyPresetToDocument({ ...baseSetting }, preset);

    if (mode === "a4") {
        return {
            ...nextSetting,
            preset: "a4_portrait",
            printer_profile: "laser",
            orientation: "portrait",
            height_mode: "fixed",
            height: nextSetting.height ?? mm(297, nextSetting.unit),
            margin_top: Math.max(nextSetting.margin_top, mm(10, nextSetting.unit)),
            margin_right: Math.max(nextSetting.margin_right, mm(10, nextSetting.unit)),
            margin_bottom: Math.max(nextSetting.margin_bottom, mm(10, nextSetting.unit)),
            margin_left: Math.max(nextSetting.margin_left, mm(10, nextSetting.unit)),
            copies: 1,
            note: null,
        };
    }

    return {
        ...nextSetting,
        preset,
        printer_profile: "thermal",
        orientation: "portrait",
        height_mode: "auto",
        height: null,
        margin_top: mm(4, nextSetting.unit),
        margin_right: mm(3, nextSetting.unit),
        margin_bottom: mm(4, nextSetting.unit),
        margin_left: mm(3, nextSetting.unit),
        copies: 1,
        note: null,
    };
}

export function chunkTableQrItems<T>(items: T[], chunkSize = A4_ITEMS_PER_PAGE): T[][] {
    const safeChunkSize = Math.max(1, Math.floor(chunkSize));
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += safeChunkSize) {
        chunks.push(items.slice(index, index + safeChunkSize));
    }

    return chunks;
}

export function planReceiptQrPages(options: {
    itemCount: number;
    cardHeightMm: number;
    gapMm?: number;
    pageTopMm?: number;
    pageBottomMm?: number;
    maxPageHeightMm?: number;
}): ReceiptPagePlan[] {
    const itemCount = Math.max(0, Math.floor(options.itemCount));
    if (itemCount === 0) return [];

    const gapMm = Math.max(0, options.gapMm ?? RECEIPT_ITEM_GAP_MM);
    const pageTopMm = Math.max(0, options.pageTopMm ?? 0);
    const pageBottomMm = Math.max(0, options.pageBottomMm ?? 0);
    const maxPageHeightMm = Math.max(1, options.maxPageHeightMm ?? RECEIPT_MAX_PAGE_HEIGHT_MM);
    const cardHeightMm = Math.max(1, options.cardHeightMm);
    const plans: ReceiptPagePlan[] = [];

    let remaining = itemCount;
    while (remaining > 0) {
        let nextCount = 0;
        let nextHeight = pageTopMm + pageBottomMm;

        while (remaining - nextCount > 0) {
            const candidateCount = nextCount + 1;
            const candidateHeight =
                pageTopMm +
                pageBottomMm +
                candidateCount * cardHeightMm +
                Math.max(0, candidateCount - 1) * gapMm;

            if (nextCount > 0 && candidateHeight > maxPageHeightMm) {
                break;
            }

            nextCount = candidateCount;
            nextHeight = Math.min(candidateHeight, maxPageHeightMm);

            if (candidateHeight >= maxPageHeightMm) {
                break;
            }
        }

        plans.push({
            itemCount: Math.max(1, nextCount),
            pageHeightMm: nextHeight,
        });
        remaining -= Math.max(1, nextCount);
    }

    return plans;
}

export function calculateReceiptRollHeight(options: {
    itemCount: number;
    cardHeight: number;
    gap: number;
    marginTop: number;
    marginBottom: number;
}): number {
    const itemCount = Math.max(0, Math.floor(options.itemCount));
    const cardHeight = Math.max(1, options.cardHeight);
    const gap = Math.max(0, options.gap);
    const marginTop = Math.max(0, options.marginTop);
    const marginBottom = Math.max(0, options.marginBottom);

    return (
        marginTop +
        marginBottom +
        itemCount * cardHeight +
        Math.max(0, itemCount - 1) * gap
    );
}

function createA4CardSetting(baseSetting: PrintDocumentSetting): PrintDocumentSetting {
    const pageSize = getEffectiveDocumentSize(baseSetting);
    const gap = mm(A4_GRID_GAP_MM, baseSetting.unit);
    const cardWidth =
        (pageSize.width - baseSetting.margin_left - baseSetting.margin_right - gap) / 2;
    const cardHeight =
        (pageSize.height - baseSetting.margin_top - baseSetting.margin_bottom - gap) / 2;

    return {
        ...baseSetting,
        width: cardWidth,
        height: cardHeight,
        height_mode: "fixed",
        margin_top: mm(A4_CARD_MARGIN_MM, baseSetting.unit),
        margin_right: mm(A4_CARD_MARGIN_MM, baseSetting.unit),
        margin_bottom: mm(A4_CARD_MARGIN_MM, baseSetting.unit),
        margin_left: mm(A4_CARD_MARGIN_MM, baseSetting.unit),
        copies: 1,
    };
}

function createA4SingleCardSetting(baseSetting: PrintDocumentSetting): PrintDocumentSetting {
    const pageSize = getEffectiveDocumentSize(baseSetting);
    const cardWidth = Math.max(
        1,
        pageSize.width - baseSetting.margin_left - baseSetting.margin_right
    );
    const cardHeight = Math.max(
        1,
        pageSize.height - baseSetting.margin_top - baseSetting.margin_bottom
    );

    return {
        ...baseSetting,
        width: cardWidth,
        height: cardHeight,
        height_mode: "fixed",
        margin_top: mm(10, baseSetting.unit),
        margin_right: mm(10, baseSetting.unit),
        margin_bottom: mm(10, baseSetting.unit),
        margin_left: mm(10, baseSetting.unit),
        copies: 1,
    };
}

function createReceiptCardSetting(baseSetting: PrintDocumentSetting): PrintDocumentSetting {
    const pageSize = getEffectiveDocumentSize(baseSetting);
    const cardWidth = Math.max(
        1,
        pageSize.width - baseSetting.margin_left - baseSetting.margin_right
    );
    const cardHeightMm = Math.max(
        RECEIPT_MIN_CARD_HEIGHT_MM,
        convertToMm(cardWidth, baseSetting.unit) * RECEIPT_CARD_HEIGHT_RATIO
    );

    return {
        ...baseSetting,
        width: cardWidth,
        height: convertFromMm(cardHeightMm, baseSetting.unit),
        height_mode: "fixed",
        margin_top: mm(RECEIPT_CARD_MARGIN_MM, baseSetting.unit),
        margin_right: mm(RECEIPT_CARD_MARGIN_MM, baseSetting.unit),
        margin_bottom: mm(RECEIPT_CARD_MARGIN_MM, baseSetting.unit),
        margin_left: mm(RECEIPT_CARD_MARGIN_MM, baseSetting.unit),
        copies: 1,
    };
}

function buildA4Positions(options: {
    itemCount: number;
    pageSetting: PrintDocumentSetting;
    cardSetting: PrintDocumentSetting;
}): Array<{ x: number; y: number }> {
    const { itemCount, pageSetting, cardSetting } = options;
    const pageSize = getEffectiveDocumentSize(pageSetting);
    const cardSize = getEffectiveDocumentSize(cardSetting);
    const printableWidth = pageSize.width - pageSetting.margin_left - pageSetting.margin_right;
    const printableHeight = pageSize.height - pageSetting.margin_top - pageSetting.margin_bottom;
    const gap = mm(A4_GRID_GAP_MM, pageSetting.unit);
    const rowCount = itemCount <= 2 ? 1 : 2;
    const rows = rowCount === 1 ? [itemCount] : [Math.min(2, itemCount), Math.max(0, itemCount - 2)];
    const gridHeight = rowCount * cardSize.height + Math.max(0, rowCount - 1) * gap;
    const startY = pageSetting.margin_top + Math.max(0, (printableHeight - gridHeight) / 2);
    const positions: Array<{ x: number; y: number }> = [];

    rows.forEach((columnCount, rowIndex) => {
        if (columnCount <= 0) return;
        const rowWidth = columnCount * cardSize.width + Math.max(0, columnCount - 1) * gap;
        const startX = pageSetting.margin_left + Math.max(0, (printableWidth - rowWidth) / 2);

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            positions.push({
                x: startX + columnIndex * (cardSize.width + gap),
                y: startY + rowIndex * (cardSize.height + gap),
            });
        }
    });

    return positions;
}

async function buildQrCardCanvas(
    item: TableQrPrintItem,
    setting: PrintDocumentSetting,
    locale?: string
): Promise<HTMLCanvasElement> {
    return buildTableQrExportCanvas({
        tableName: item.tableName,
        customerUrl: item.customerUrl,
        qrImageDataUrl: item.qrImageDataUrl,
        qrCodeExpiresAt: item.qrCodeExpiresAt,
        setting,
        locale,
        heading: item.heading,
        subtitle: item.subtitle,
    });
}

export async function createTableQrPrintDocument(options: {
    items: TableQrPrintItem[];
    mode: TableQrPrintMode;
    baseSetting: PrintDocumentSetting;
    locale?: string;
    a4Layout?: TableQrA4Layout;
}): Promise<{
    blob: Blob;
    download: (filename: string) => void;
    openInWindow: (
        targetWindow: Window,
        options?: {
            filename?: string;
            title?: string;
        }
    ) => void;
}> {
    const { items, mode, baseSetting, locale } = options;
    if (!items.length) {
        throw new Error("No QR items available for export");
    }

    const pageSetting = resolveTableQrPrintSetting(baseSetting, mode);
    const { default: JsPdfCtor } = await loadPdfExport();

    if (mode === "a4") {
        const pageSize = getEffectiveDocumentSize(pageSetting);
        const doc = new JsPdfCtor({
            orientation: pageSetting.orientation,
            unit: pageSetting.unit,
            format: [pageSize.width, pageSize.height],
        });
        const a4Layout = options.a4Layout ?? "grid4";
        const cardSetting =
            a4Layout === "single" ? createA4SingleCardSetting(pageSetting) : createA4CardSetting(pageSetting);
        const cardSize = getEffectiveDocumentSize(cardSetting);
        const pages =
            a4Layout === "single"
                ? items.map((item) => [item])
                : chunkTableQrItems(items, A4_ITEMS_PER_PAGE);
        const previewPages: TableQrPreviewPage[] = [];

        let isFirstPage = true;
        for (const pageItems of pages) {
            if (!isFirstPage) {
                doc.addPage([pageSize.width, pageSize.height], pageSetting.orientation);
            }
            const positions =
                a4Layout === "single"
                    ? [{ x: pageSetting.margin_left, y: pageSetting.margin_top }]
                    : buildA4Positions({
                        itemCount: pageItems.length,
                        pageSetting,
                        cardSetting,
                    });
            const placements: PreviewPlacement[] = [];

            for (let index = 0; index < pageItems.length; index += 1) {
                const canvas = await buildQrCardCanvas(pageItems[index], cardSetting, locale);
                const position = positions[index];
                doc.addImage(
                    canvas.toDataURL("image/png"),
                    "PNG",
                    position.x,
                    position.y,
                    cardSize.width,
                    cardSize.height,
                    undefined,
                    "FAST"
                );
                placements.push({
                    canvas,
                    x: position.x,
                    y: position.y,
                    width: cardSize.width,
                    height: cardSize.height,
                });
            }

            previewPages.push(
                buildPreviewPageImage({
                    pageWidth: pageSize.width,
                    pageHeight: pageSize.height,
                    unit: pageSetting.unit,
                    placements,
                })
            );

            isFirstPage = false;
        }

        const blob = doc.output("blob");
        return {
            blob,
            download(filename) {
                downloadBlob(blob, filename);
            },
            openInWindow(targetWindow, previewOptions) {
                if (previewPages.every((page) => Boolean(page.src))) {
                    writePrintWindow({
                        targetWindow,
                        title: previewOptions?.title || "QR Print Preview",
                        pageSizeCss: buildPageSizeCss(pageSetting),
                        previewPages,
                    });
                    return;
                }

                const objectUrl = URL.createObjectURL(blob);
                const previewTitle = escapeHtml(previewOptions?.title || "QR Print Preview");
                const downloadName = escapeHtml(previewOptions?.filename || "qr-print.pdf");

                targetWindow.document.open();
                targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${previewTitle}</title>
  <style>
    :root {
      --surface: #ffffff;
      --surface-alt: #f8fafc;
      --border: #dbe2ea;
      --ink: #0f172a;
      --muted: #475569;
      --brand: #2563eb;
      --brand-dark: #1d4ed8;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      color: var(--ink);
      background: var(--surface-alt);
    }
    body {
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.98);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .title-wrap h1 {
      margin: 0;
      font-size: 18px;
    }
    .title-wrap p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .button,
    .button:visited {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .button-primary {
      background: var(--brand);
      border-color: var(--brand);
      color: #ffffff;
    }
    .button-primary:hover {
      background: var(--brand-dark);
      border-color: var(--brand-dark);
    }
    .preview-shell {
      padding: 16px;
      min-height: 0;
    }
    .preview-frame {
      width: 100%;
      height: calc(100dvh - 110px);
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
    }
    @media print {
      .toolbar { display: none; }
      .preview-shell { padding: 0; }
      .preview-frame {
        height: auto;
        min-height: 100dvh;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="title-wrap">
      <h1>${previewTitle}</h1>
      <p>ตรวจร่างก่อน แล้วเลือกพิมพ์ ดาวน์โหลด หรือปิดหน้าต่างนี้</p>
    </div>
    <div class="actions">
      <button id="print-button" class="button button-primary" type="button">พิมพ์</button>
      <a id="download-button" class="button" href="${objectUrl}" download="${downloadName}">ดาวน์โหลด PDF</a>
      <button id="close-button" class="button" type="button">ปิด</button>
    </div>
  </div>
  <div class="preview-shell">
    <iframe id="preview-frame" class="preview-frame" src="${objectUrl}" title="${previewTitle}"></iframe>
  </div>
  <script>
    (function () {
      var objectUrl = ${JSON.stringify(objectUrl)};
      var hasTriggeredAutoPrint = false;
      var frame = document.getElementById("preview-frame");
      var printButton = document.getElementById("print-button");
      var closeButton = document.getElementById("close-button");

      var handlePrint = function () {
        try {
          if (frame && frame.contentWindow) {
            frame.contentWindow.focus();
            frame.contentWindow.print();
            return;
          }
        } catch (error) {}
        window.print();
      };

      var triggerAutoPrint = function () {
        if (hasTriggeredAutoPrint) return;
        hasTriggeredAutoPrint = true;
        window.setTimeout(handlePrint, 180);
      };

      if (frame) {
        frame.addEventListener("load", triggerAutoPrint, { once: true });
        window.setTimeout(triggerAutoPrint, 1200);
      } else {
        window.setTimeout(triggerAutoPrint, 200);
      }

      printButton && printButton.addEventListener("click", handlePrint);
      closeButton && closeButton.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("afterprint", function () {
        window.setTimeout(function () {
          try { window.close(); } catch (error) {}
        }, 120);
      });
      window.addEventListener("beforeunload", function () {
        try { URL.revokeObjectURL(objectUrl); } catch (error) {}
      });
    })();
  </script>
</body>
</html>`);
                targetWindow.document.close();
            },
        };
    }

    const cardSetting = createReceiptCardSetting(pageSetting);
    const cardSize = getEffectiveDocumentSize(cardSetting);
    const gap = mm(RECEIPT_ITEM_GAP_MM, pageSetting.unit);
    const pageWidth = getEffectiveDocumentSize(pageSetting).width;
    const pageHeight = calculateReceiptRollHeight({
        itemCount: items.length,
        cardHeight: cardSize.height,
        gap,
        marginTop: pageSetting.margin_top,
        marginBottom: pageSetting.margin_bottom,
    });
    const printableWidth = Math.max(
        1,
        pageWidth - pageSetting.margin_left - pageSetting.margin_right
    );
    const doc = new JsPdfCtor({
        orientation: "portrait",
        unit: pageSetting.unit,
        format: [pageWidth, pageHeight],
    });
    const placements: PreviewPlacement[] = [];

    let currentY = pageSetting.margin_top;
    for (const item of items) {
        const canvas = await buildQrCardCanvas(item, cardSetting, locale);
        doc.addImage(
            canvas.toDataURL("image/png"),
            "PNG",
            pageSetting.margin_left,
            currentY,
            printableWidth,
            cardSize.height,
            undefined,
            "FAST"
        );
        placements.push({
            canvas,
            x: pageSetting.margin_left,
            y: currentY,
            width: printableWidth,
            height: cardSize.height,
        });
        currentY += cardSize.height + gap;
    }
    const previewPages: TableQrPreviewPage[] = [
        buildPreviewPageImage({
            pageWidth,
            pageHeight,
            unit: pageSetting.unit,
            placements,
        }),
    ];

    const blob = doc.output("blob");
    return {
        blob,
        download(filename) {
            downloadBlob(blob, filename);
        },
        openInWindow(targetWindow, previewOptions) {
            if (previewPages.every((page) => Boolean(page.src))) {
                writePrintWindow({
                    targetWindow,
                    title: previewOptions?.title || "QR Print Preview",
                    pageSizeCss: buildPageSizeCss(pageSetting),
                    previewPages,
                });
                return;
            }

            const objectUrl = URL.createObjectURL(blob);
            const previewTitle = escapeHtml(previewOptions?.title || "QR Print Preview");
            const downloadName = escapeHtml(previewOptions?.filename || "qr-print.pdf");

            targetWindow.document.open();
            targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${previewTitle}</title>
  <style>
    :root {
      --surface: #ffffff;
      --surface-alt: #f8fafc;
      --border: #dbe2ea;
      --ink: #0f172a;
      --muted: #475569;
      --brand: #2563eb;
      --brand-dark: #1d4ed8;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      color: var(--ink);
      background: var(--surface-alt);
    }
    body {
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.98);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .title-wrap h1 {
      margin: 0;
      font-size: 18px;
    }
    .title-wrap p {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .button,
    .button:visited {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
    }
    .button-primary {
      background: var(--brand);
      border-color: var(--brand);
      color: #ffffff;
    }
    .button-primary:hover {
      background: var(--brand-dark);
      border-color: var(--brand-dark);
    }
    .preview-shell {
      padding: 16px;
      min-height: 0;
    }
    .preview-frame {
      width: 100%;
      height: calc(100dvh - 110px);
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
    }
    @media print {
      .toolbar { display: none; }
      .preview-shell { padding: 0; }
      .preview-frame {
        height: auto;
        min-height: 100dvh;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="title-wrap">
      <h1>${previewTitle}</h1>
      <p>ตรวจร่างก่อน แล้วเลือกพิมพ์ ดาวน์โหลด หรือปิดหน้าต่างนี้</p>
    </div>
    <div class="actions">
      <button id="print-button" class="button button-primary" type="button">พิมพ์</button>
      <a id="download-button" class="button" href="${objectUrl}" download="${downloadName}">ดาวน์โหลด PDF</a>
      <button id="close-button" class="button" type="button">ปิด</button>
    </div>
  </div>
  <div class="preview-shell">
    <iframe id="preview-frame" class="preview-frame" src="${objectUrl}" title="${previewTitle}"></iframe>
  </div>
  <script>
    (function () {
      var objectUrl = ${JSON.stringify(objectUrl)};
      var frame = document.getElementById("preview-frame");
      var printButton = document.getElementById("print-button");
      var closeButton = document.getElementById("close-button");

      var handlePrint = function () {
        try {
          if (frame && frame.contentWindow) {
            frame.contentWindow.focus();
            frame.contentWindow.print();
            return;
          }
        } catch (error) {}
        window.print();
      };

      printButton && printButton.addEventListener("click", handlePrint);
      closeButton && closeButton.addEventListener("click", function () {
        window.close();
      });
      window.addEventListener("beforeunload", function () {
        try { URL.revokeObjectURL(objectUrl); } catch (error) {}
      });
    })();
  </script>
</body>
</html>`);
            targetWindow.document.close();
        },
    };
}
