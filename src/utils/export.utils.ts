"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { resolveImageSource } from "./image/source";

dayjs.locale("th");

type AutoTableDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const getLastAutoTableY = (pdf: jsPDF): number => {
  const table = (pdf as AutoTableDocument).lastAutoTable;
  return table?.finalY ?? 0;
};

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
  Cooking: "กำลังทำ",
  Served: "เสิร์ฟแล้ว",
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

export interface ShiftSummaryExport {
  shift_id: string;
  user_name: string;
  open_time: string;
  close_time: string;
  start_amount: number;
  expected_amount: number;
  end_amount: number;
  diff_amount: number;
  total_sales: number;
  cash_sales: number;
  qr_sales: number;
  order_count: number;
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
}

export const exportSalesReportPDF = async (
  payload: SalesReportExportPayload,
  dateRange: [string, string],
  rangeLabel: string,
  branding: SalesReportBranding = {},
  options: SalesReportPdfOptions = {}
): Promise<void> => {
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);
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
          @page { size: A4 portrait; margin: 10mm; }
          body {
            margin: 0;
            background: #edf2f7;
            color: #111827;
            font-family: "Sarabun", "Tahoma", "Noto Sans Thai", sans-serif;
          }
          .sheet {
            width: 210mm;
            margin: 10mm auto;
            background: #ffffff;
            border-radius: 10px;
            padding: 12mm;
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
            font-size: 20px;
            line-height: 1.2;
          }
          .header-meta {
            margin-top: 2px;
            font-size: 12px;
            opacity: 0.95;
          }
          .section {
            margin-top: 14px;
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
            font-size: 12px;
          }
          .summary-table td,
          .report-table th,
          .report-table td {
            border: 1px solid #dbe4f0;
            padding: 6px 8px;
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
              width: auto;
              margin: 0;
              box-shadow: none;
              border-radius: 0;
              padding: 0;
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
  branding: SalesReportBranding = {}
) => {
  const workbook = XLSX.utils.book_new();
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);

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
    XLSX.utils.book_append_sheet(workbook, recentSheet, "ออเดอร์ล่าสุด");
  }

  const filename = `รายงานสรุปผลการขาย_${rangeLabel.replace(/\s+/g, "_")}_${dateRange[0]}_${dateRange[1]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const exportShiftSummaryPDF = (
  shift: ShiftSummaryExport,
  orders: { order_no: string; total_amount: number; payment_method: string; create_date: string }[],
  shopName: string = "ร้านค้า POS"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(shopName, pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(13);
  doc.text("รายงานสรุปกะ", pageWidth / 2, 24, { align: "center" });
  doc.setFontSize(10);
  doc.text(`พนักงาน: ${shift.user_name}`, 14, 34);
  doc.text(`เวลาเปิดกะ: ${shift.open_time}`, 14, 40);
  doc.text(`เวลาปิดกะ: ${shift.close_time}`, 14, 46);

  autoTable(doc, {
    startY: 52,
    head: [["หัวข้อ", "ค่า"]],
    body: [
      ["เงินเริ่มต้น", formatMoney(shift.start_amount)],
      ["เงินที่ควรมี", formatMoney(shift.expected_amount)],
      ["เงินสดจริง", formatMoney(shift.end_amount)],
      ["ผลต่าง", formatMoney(shift.diff_amount)],
      ["ยอดขายรวม", formatMoney(shift.total_sales)],
      ["ยอดเงินสด", formatMoney(shift.cash_sales)],
      ["ยอด QR", formatMoney(shift.qr_sales)],
      ["จำนวนออเดอร์", Number(shift.order_count || 0).toLocaleString()],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 118, 110] },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
  });

  autoTable(doc, {
    startY: getLastAutoTableY(doc) + 8,
    head: [["เลขออเดอร์", "เวลา", "วิธีชำระ", "ยอดรวม"]],
    body: orders.map((order) => [
      `#${order.order_no}`,
      dayjs(order.create_date).format("HH:mm"),
      order.payment_method,
      formatMoney(order.total_amount),
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 9 },
    columnStyles: { 3: { halign: "right" } },
  });

  doc.setFontSize(9);
  doc.text(`พิมพ์เมื่อ: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`, pageWidth / 2, getLastAutoTableY(doc) + 12, { align: "center" });
  doc.save(`รายงานสรุปกะ_${shift.user_name}_${dayjs(shift.close_time).format("YYYYMMDD_HHmm")}.pdf`);
};
