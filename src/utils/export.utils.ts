"use client";

import * as XLSX from "xlsx";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { resolveImageSource } from "./image/source";
import { PrintDocumentSetting } from "../types/api/pos/printSettings";
import { buildPageMarginCss, buildPageSizeCss } from "./print-settings/runtime";
import { createDefaultDocumentSetting, toCssLength } from "./print-settings/defaults";
import { applyWorkbookPageSetup, downloadWorkbookBytes } from "./print-settings/excelPageSetup";

dayjs.locale("th");

const formatMoney = (value: number): string => `฿${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const formatDate = (value: string): string => dayjs(value).format("DD/MM/YYYY");

const ORDER_TYPE_THAI: Record<string, string> = {
  DineIn: "ทานที่ร้าน",
  TakeAway: "กลับบ้าน",
  Delivery: "เดลิเวอรี่",
};

const STATUS_THAI: Record<string, string> = {
  Paid: "ชำระแล้ว",
  Completed: "เสร็จสิ้น",
  Cancelled: "ยกเลิก",
  Pending: "รอดำเนินการ",
  Cooking: "รอดำเนินการ",
  Served: "รอดำเนินการ",
  WaitingForPayment: "รอชำระ",
};

export interface SalesSummaryExport {
  date: string;
  total_orders: number;
  total_sales: number;
  cash_sales: number;
  qr_sales: number;
  dine_in_sales: number;
  takeaway_sales: number;
  delivery_sales: number;
  total_discount: number;
}

export interface TopItemExport {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface DashboardSummaryExport {
  period_start?: string | null;
  period_end?: string | null;
  total_sales: number;
  total_orders: number;
  total_discount: number;
  average_order_value: number;
  cash_sales: number;
  qr_sales: number;
  dine_in_sales: number;
  takeaway_sales: number;
  delivery_sales: number;
}

export interface RecentOrderExport {
  order_no: string;
  order_type: string;
  status: string;
  create_date: string;
  total_amount: number;
  items_count: number;
}

export interface SalesReportExportPayload {
  summary?: DashboardSummaryExport | null;
  daily_sales: SalesSummaryExport[];
  top_items: TopItemExport[];
  recent_orders?: RecentOrderExport[];
}

export interface SalesReportBranding {
  shopName?: string;
  branchName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

function parseHexColor(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const value = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function orderTypeThai(type: string): string {
  return ORDER_TYPE_THAI[type] || type || "-";
}

function orderStatusThai(status: string): string {
  return STATUS_THAI[status] || status || "-";
}

function buildFallbackSummary(dailySales: SalesSummaryExport[]): DashboardSummaryExport {
  const totalSales = dailySales.reduce((acc, row) => acc + Number(row.total_sales || 0), 0);
  const totalOrders = dailySales.reduce((acc, row) => acc + Number(row.total_orders || 0), 0);
  const totalDiscount = dailySales.reduce((acc, row) => acc + Number(row.total_discount || 0), 0);
  const cashSales = dailySales.reduce((acc, row) => acc + Number(row.cash_sales || 0), 0);
  const qrSales = dailySales.reduce((acc, row) => acc + Number(row.qr_sales || 0), 0);
  const dineIn = dailySales.reduce((acc, row) => acc + Number(row.dine_in_sales || 0), 0);
  const takeAway = dailySales.reduce((acc, row) => acc + Number(row.takeaway_sales || 0), 0);
  const delivery = dailySales.reduce((acc, row) => acc + Number(row.delivery_sales || 0), 0);

  return {
    total_sales: totalSales,
    total_orders: totalOrders,
    total_discount: totalDiscount,
    average_order_value: totalOrders > 0 ? totalSales / totalOrders : 0,
    cash_sales: cashSales,
    qr_sales: qrSales,
    dine_in_sales: dineIn,
    takeaway_sales: takeAway,
    delivery_sales: delivery,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function colorToCss(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export interface SalesReportPdfOptions {
  targetWindow?: Window | null;
  autoPrint?: boolean;
  documentSetting?: PrintDocumentSetting | null;
  locale?: string;
}

export interface SalesReportExcelOptions {
  documentSetting?: PrintDocumentSetting | null;
}

function getEffectiveDocumentSize(setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "orientation" | "unit">) {
  const baseWidth = setting.width;
  const baseHeight =
    setting.height_mode === "fixed" && setting.height != null ? setting.height : null;

  if (setting.orientation === "landscape" && baseHeight != null) {
    return { width: baseHeight, height: baseWidth };
  }

  return { width: baseWidth, height: baseHeight };
}

function convertToInches(value: number, unit: PrintDocumentSetting["unit"]): number {
  return unit === "in" ? value : value / 25.4;
}

function buildWorksheetMargins(
  setting: Pick<PrintDocumentSetting, "margin_top" | "margin_right" | "margin_bottom" | "margin_left" | "unit">
): XLSX.MarginInfo {
  return {
    top: convertToInches(setting.margin_top, setting.unit),
    right: convertToInches(setting.margin_right, setting.unit),
    bottom: convertToInches(setting.margin_bottom, setting.unit),
    left: convertToInches(setting.margin_left, setting.unit),
    header: 0.2,
    footer: 0.2,
  };
}

export const exportSalesReportPDF = async (
  payload: SalesReportExportPayload,
  dateRange: [string, string],
  rangeLabel: string,
  branding: SalesReportBranding = {},
  options: SalesReportPdfOptions = {}
): Promise<void> => {
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);
  const documentSetting = options.documentSetting ?? createDefaultDocumentSetting("order_summary");
  const pageSizeCss = buildPageSizeCss(documentSetting);
  const pagePaddingCss = buildPageMarginCss(documentSetting);
  const effectiveSize = getEffectiveDocumentSize(documentSetting);
  const sheetWidthCss = toCssLength(effectiveSize.width, documentSetting.unit);
  const sheetHeightCss = effectiveSize.height == null ? "auto" : toCssLength(effectiveSize.height, documentSetting.unit);
  const fontScale = Math.max(documentSetting.font_scale, 70) / 100;
  const densityScale = documentSetting.density === "compact" ? 0.9 : documentSetting.density === "spacious" ? 1.12 : 1;
  const bodyFontSize = Math.max(11, Math.round(13 * fontScale));
  const tableFontSize = Math.max(10, Math.round(12 * fontScale));
  const headerTitleSize = Math.max(18, Math.round(20 * fontScale));
  const sectionGap = Math.max(12, Math.round(14 * densityScale));
  const cellPaddingY = Math.max(5, Math.round(6 * densityScale));
  const cellPaddingX = Math.max(6, Math.round(8 * densityScale));
  const shopName = branding.shopName || "ร้านค้า POS";
  const branchName = branding.branchName;
  const primaryColor = parseHexColor(branding.primaryColor, [15, 118, 110]);
  const secondaryColor = parseHexColor(branding.secondaryColor, [30, 64, 175]);
  const printWindow = options.targetWindow ?? window.open("", "_blank", "width=1024,height=768");
  if (!printWindow) {
    throw new Error("เบราว์เซอร์บล็อกหน้าต่าง PDF");
  }

  const summaryRows = [
    ["ยอดขายรวม", formatMoney(summary.total_sales)],
    ["จำนวนออเดอร์", Number(summary.total_orders || 0).toLocaleString()],
    ["ยอดเฉลี่ยต่อบิล", formatMoney(summary.average_order_value)],
    ["ส่วนลดรวม", formatMoney(summary.total_discount)],
    ["ยอดชำระเงินสด", formatMoney(summary.cash_sales)],
    ["ยอดชำระ QR/พร้อมเพย์", formatMoney(summary.qr_sales)],
    ["ยอดขายทานที่ร้าน", formatMoney(summary.dine_in_sales)],
    ["ยอดขายกลับบ้าน", formatMoney(summary.takeaway_sales)],
    ["ยอดขายเดลิเวอรี่", formatMoney(summary.delivery_sales)],
  ]
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td class="text-right">${escapeHtml(value)}</td></tr>`)
    .join("");

  const dailyRows = payload.daily_sales
    .map((row) => {
      const orders = Number(row.total_orders || 0);
      const sales = Number(row.total_sales || 0);
      return `
        <tr>
          <td>${escapeHtml(formatDate(row.date))}</td>
          <td class="text-right">${orders.toLocaleString()}</td>
          <td class="text-right">${escapeHtml(formatMoney(sales))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.total_discount || 0)))}</td>
          <td class="text-right">${escapeHtml(formatMoney(orders > 0 ? sales / orders : 0))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.cash_sales || 0)))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.qr_sales || 0)))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.dine_in_sales || 0)))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.takeaway_sales || 0)))}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(row.delivery_sales || 0)))}</td>
        </tr>
      `;
    })
    .join("");

  const topItemsRows = (payload.top_items || [])
    .map(
      (item, index) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${escapeHtml(item.product_name || "-")}</td>
          <td class="text-right">${Number(item.total_quantity || 0).toLocaleString()}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(item.total_revenue || 0)))}</td>
        </tr>
      `
    )
    .join("");

  const recentOrdersRows = (payload.recent_orders || [])
    .slice(0, 20)
    .map(
      (order) => `
        <tr>
          <td>#${escapeHtml(order.order_no || "-")}</td>
          <td>${escapeHtml(orderTypeThai(order.order_type))}</td>
          <td>${escapeHtml(orderStatusThai(order.status))}</td>
          <td>${escapeHtml(dayjs(order.create_date).format("DD/MM HH:mm"))}</td>
          <td class="text-right">${Number(order.items_count || 0).toLocaleString()}</td>
          <td class="text-right">${escapeHtml(formatMoney(Number(order.total_amount || 0)))}</td>
        </tr>
      `
    )
    .join("");

  const normalizedLogoUrl = resolveImageSource(branding.logoUrl);
  const logoHtml = normalizedLogoUrl
    ? `<img src="${escapeHtml(normalizedLogoUrl)}" alt="logo" class="shop-logo" />`
    : "";
  const primaryColorCss = colorToCss(primaryColor);
  const secondaryColorCss = colorToCss(secondaryColor);
  const filename = `รายงานสรุปผลการขาย_${rangeLabel.replace(/\s+/g, "_")}_${dateRange[0]}_${dateRange[1]}.pdf`;

  const html = `
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(filename)}</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: ${pageSizeCss}; margin: 0; }
          body {
            margin: 0;
            background: #edf2f7;
            color: #111827;
            font-family: "Sarabun", "Tahoma", "Noto Sans Thai", sans-serif;
            font-size: ${bodyFontSize}px;
            line-height: ${Math.max(1.1, documentSetting.line_spacing).toFixed(2)};
          }
          .sheet {
            width: ${sheetWidthCss};
            min-height: ${sheetHeightCss};
            margin: 10mm auto;
            background: #ffffff;
            border-radius: 10px;
            padding: ${pagePaddingCss};
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            background: ${primaryColorCss};
            color: #ffffff;
            border-radius: 10px;
            padding: 10px 12px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }
          .shop-logo {
            width: 42px;
            height: 42px;
            border-radius: 999px;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.7);
            background: #ffffff;
          }
          .header-title {
            margin: 0;
            font-size: ${headerTitleSize}px;
            line-height: 1.2;
          }
          .header-meta {
            margin-top: 2px;
            font-size: 12px;
            opacity: 0.95;
          }
          .section {
            margin-top: ${sectionGap}px;
          }
          .section-title {
            margin: 0 0 6px;
            font-size: 15px;
            color: ${secondaryColorCss};
          }
          .summary-table,
          .report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${tableFontSize}px;
          }
          .summary-table td,
          .report-table th,
          .report-table td {
            border: 1px solid #dbe4f0;
            padding: ${cellPaddingY}px ${cellPaddingX}px;
            vertical-align: top;
          }
          .report-table th {
            background: #f8fafc;
            color: #1f2937;
            font-weight: 700;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .muted {
            color: #64748b;
            font-size: 12px;
          }
          .footer {
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          @media print {
            body { background: #ffffff; }
            .sheet {
              width: ${sheetWidthCss};
              min-height: ${sheetHeightCss};
              margin: 0;
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="header">
            <div class="header-left">
              ${logoHtml}
              <div>
                <h1 class="header-title">${escapeHtml(shopName)}</h1>
                ${branchName ? `<div class="header-meta">สาขา: ${escapeHtml(branchName)}</div>` : ""}
              </div>
            </div>
            <div class="header-meta">รายงานสรุปผลการขาย</div>
          </header>

          <section class="section">
            <div class="muted">ช่วงเวลา: ${escapeHtml(dateRange[0])} ถึง ${escapeHtml(dateRange[1])} (${escapeHtml(rangeLabel)})</div>
            <div class="muted">พิมพ์เมื่อ: ${escapeHtml(dayjs().format("DD/MM/YYYY HH:mm:ss"))}</div>
          </section>

          <section class="section">
            <h2 class="section-title">สรุปภาพรวม</h2>
            <table class="summary-table">
              <tbody>${summaryRows}</tbody>
            </table>
          </section>

          <section class="section">
            <h2 class="section-title">ยอดขายรายวัน</h2>
            <table class="report-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th class="text-right">ออเดอร์</th>
                  <th class="text-right">ยอดขาย</th>
                  <th class="text-right">ส่วนลด</th>
                  <th class="text-right">เฉลี่ย/บิล</th>
                  <th class="text-right">เงินสด</th>
                  <th class="text-right">QR/พร้อมเพย์</th>
                  <th class="text-right">ทานที่ร้าน</th>
                  <th class="text-right">กลับบ้าน</th>
                  <th class="text-right">เดลิเวอรี่</th>
                </tr>
              </thead>
              <tbody>
                ${dailyRows || `<tr><td colspan="10" class="text-center">ไม่มีข้อมูลยอดขายรายวัน</td></tr>`}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2 class="section-title">สินค้าขายดี</h2>
            <table class="report-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 60px;">อันดับ</th>
                  <th>สินค้า</th>
                  <th class="text-right" style="width: 140px;">จำนวนขาย</th>
                  <th class="text-right" style="width: 160px;">ยอดขายรวม</th>
                </tr>
              </thead>
              <tbody>
                ${topItemsRows || `<tr><td colspan="4" class="text-center">ไม่มีข้อมูลสินค้าขายดี</td></tr>`}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2 class="section-title">ออเดอร์ล่าสุด</h2>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 120px;">เลขออเดอร์</th>
                  <th style="width: 100px;">ประเภท</th>
                  <th style="width: 100px;">สถานะ</th>
                  <th style="width: 90px;">เวลา</th>
                  <th class="text-right" style="width: 110px;">จำนวนสินค้า</th>
                  <th class="text-right" style="width: 130px;">ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                ${recentOrdersRows || `<tr><td colspan="6" class="text-center">ไม่มีข้อมูลออเดอร์ล่าสุด</td></tr>`}
              </tbody>
            </table>
          </section>

          <footer class="footer">เอกสารจากระบบ POS Shop</footer>
        </main>
        <script>
          window.addEventListener("load", () => {
            setTimeout(() => {
              window.focus();
              ${options.autoPrint === false ? "" : "window.print();"}
            }, 250);
          });
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const exportSalesReportExcel = (
  payload: SalesReportExportPayload,
  dateRange: [string, string],
  rangeLabel: string,
  branding: SalesReportBranding = {},
  options: SalesReportExcelOptions = {}
) => {
  const workbook = XLSX.utils.book_new();
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);
  const documentSetting = options.documentSetting ?? createDefaultDocumentSetting("order_summary");
  const worksheetMargins = buildWorksheetMargins(documentSetting);

  const summaryRows = [
    ["รายงานสรุปผลการขาย"],
    [branding.shopName || "ร้านค้า POS"],
    [branding.branchName ? `สาขา: ${branding.branchName}` : ""],
    [`ช่วงเวลา: ${dateRange[0]} ถึง ${dateRange[1]} (${rangeLabel})`],
    [`พิมพ์เมื่อ: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`],
    [],
    ["หัวข้อ", "ค่า"],
    ["ยอดขายรวม", Number(summary.total_sales || 0)],
    ["จำนวนออเดอร์", Number(summary.total_orders || 0)],
    ["ยอดเฉลี่ยต่อบิล", Number(summary.average_order_value || 0)],
    ["ส่วนลดรวม", Number(summary.total_discount || 0)],
    ["ยอดชำระเงินสด", Number(summary.cash_sales || 0)],
    ["ยอดชำระ QR/พร้อมเพย์", Number(summary.qr_sales || 0)],
    ["ยอดขายทานที่ร้าน", Number(summary.dine_in_sales || 0)],
    ["ยอดขายกลับบ้าน", Number(summary.takeaway_sales || 0)],
    ["ยอดขายเดลิเวอรี่", Number(summary.delivery_sales || 0)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 32 }, { wch: 24 }];
  summarySheet["!margins"] = worksheetMargins;
  XLSX.utils.book_append_sheet(workbook, summarySheet, "สรุปภาพรวม");

  const dailyHeader = [
    "วันที่",
    "จำนวนออเดอร์",
    "ยอดขายรวม",
    "ส่วนลด",
    "เฉลี่ย/บิล",
    "เงินสด",
    "QR/พร้อมเพย์",
    "ทานที่ร้าน",
    "กลับบ้าน",
    "เดลิเวอรี่",
  ];

  const dailyRows = payload.daily_sales.map((row) => {
    const orders = Number(row.total_orders || 0);
    const sales = Number(row.total_sales || 0);
    return [
      formatDate(row.date),
      orders,
      sales,
      Number(row.total_discount || 0),
      orders > 0 ? sales / orders : 0,
      Number(row.cash_sales || 0),
      Number(row.qr_sales || 0),
      Number(row.dine_in_sales || 0),
      Number(row.takeaway_sales || 0),
      Number(row.delivery_sales || 0),
    ];
  });

  const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]);
  dailySheet["!cols"] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  dailySheet["!margins"] = worksheetMargins;
  XLSX.utils.book_append_sheet(workbook, dailySheet, "ยอดขายรายวัน");

  const topItemHeader = ["อันดับ", "สินค้า", "จำนวนขาย", "ยอดขายรวม"];
  const topItemRows = payload.top_items.map((item, index) => [
    index + 1,
    item.product_name,
    Number(item.total_quantity || 0),
    Number(item.total_revenue || 0),
  ]);
  const topSheet = XLSX.utils.aoa_to_sheet([topItemHeader, ...topItemRows]);
  topSheet["!cols"] = [{ wch: 10 }, { wch: 34 }, { wch: 14 }, { wch: 16 }];
  topSheet["!margins"] = worksheetMargins;
  XLSX.utils.book_append_sheet(workbook, topSheet, "สินค้าขายดี");

  const recentOrders = payload.recent_orders || [];
  if (recentOrders.length > 0) {
    const recentHeader = ["เลขออเดอร์", "ประเภท", "สถานะ", "วันเวลา", "จำนวนสินค้า", "ยอดรวม"];
    const recentRows = recentOrders.map((order) => [
      order.order_no,
      orderTypeThai(order.order_type),
      orderStatusThai(order.status),
      dayjs(order.create_date).format("DD/MM/YYYY HH:mm"),
      Number(order.items_count || 0),
      Number(order.total_amount || 0),
    ]);

    const recentSheet = XLSX.utils.aoa_to_sheet([recentHeader, ...recentRows]);
    recentSheet["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
    recentSheet["!margins"] = worksheetMargins;
    XLSX.utils.book_append_sheet(workbook, recentSheet, "ออเดอร์ล่าสุด");
  }

  const filename = `รายงานสรุปผลการขาย_${rangeLabel.replace(/\s+/g, "_")}_${dateRange[0]}_${dateRange[1]}.xlsx`;
  const workbookBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const patchedWorkbookBytes = applyWorkbookPageSetup(workbookBytes, documentSetting);
  downloadWorkbookBytes(patchedWorkbookBytes, filename);
};
