"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import "dayjs/locale/th";

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

async function loadImageAsDataUrl(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const exportSalesReportPDF = async (
  payload: SalesReportExportPayload,
  dateRange: [string, string],
  rangeLabel: string,
  branding: SalesReportBranding = {}
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);

  const shopName = branding.shopName || "ร้านค้า POS";
  const branchName = branding.branchName;
  const primaryColor = parseHexColor(branding.primaryColor, [15, 118, 110]);
  const secondaryColor = parseHexColor(branding.secondaryColor, [30, 64, 175]);

  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, "F");

  const logoDataUrl = await loadImageAsDataUrl(branding.logoUrl);
  if (logoDataUrl) {
    const isPng = logoDataUrl.startsWith("data:image/png");
    doc.addImage(logoDataUrl, isPng ? "PNG" : "JPEG", 14, 7, 14, 14);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(shopName, logoDataUrl ? 32 : 14, 14);
  if (branchName) {
    doc.setFontSize(10);
    doc.text(`สาขา: ${branchName}`, logoDataUrl ? 32 : 14, 21);
  }

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(15);
  doc.text("รายงานสรุปผลการขาย", pageWidth / 2, 38, { align: "center" });

  doc.setFontSize(10);
  doc.text(`ช่วงเวลา: ${dateRange[0]} ถึง ${dateRange[1]} (${rangeLabel})`, pageWidth / 2, 44, { align: "center" });
  doc.text(`พิมพ์เมื่อ: ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`, pageWidth / 2, 49, { align: "center" });

  autoTable(doc, {
    startY: 55,
    head: [["หัวข้อ", "ค่า"]],
    body: [
      ["ยอดขายรวม", formatMoney(summary.total_sales)],
      ["จำนวนออเดอร์", Number(summary.total_orders || 0).toLocaleString()],
      ["ยอดเฉลี่ยต่อบิล", formatMoney(summary.average_order_value)],
      ["ส่วนลดรวม", formatMoney(summary.total_discount)],
      ["ยอดชำระเงินสด", formatMoney(summary.cash_sales)],
      ["ยอดชำระ QR/พร้อมเพย์", formatMoney(summary.qr_sales)],
      ["ยอดขายทานที่ร้าน", formatMoney(summary.dine_in_sales)],
      ["ยอดขายกลับบ้าน", formatMoney(summary.takeaway_sales)],
      ["ยอดขายเดลิเวอรี่", formatMoney(summary.delivery_sales)],
    ],
    theme: "grid",
    headStyles: { fillColor: primaryColor },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: "right" },
    },
  });

  autoTable(doc, {
    startY: getLastAutoTableY(doc) + 8,
    head: [["วันที่", "ออเดอร์", "ยอดขาย", "ส่วนลด", "เฉลี่ย/บิล", "เงินสด", "QR/พร้อมเพย์", "ทานที่ร้าน", "กลับบ้าน", "เดลิเวอรี่"]],
    body: payload.daily_sales.map((row) => {
      const orders = Number(row.total_orders || 0);
      const sales = Number(row.total_sales || 0);
      return [
        formatDate(row.date),
        orders.toLocaleString(),
        formatMoney(sales),
        formatMoney(Number(row.total_discount || 0)),
        formatMoney(orders > 0 ? sales / orders : 0),
        formatMoney(Number(row.cash_sales || 0)),
        formatMoney(Number(row.qr_sales || 0)),
        formatMoney(Number(row.dine_in_sales || 0)),
        formatMoney(Number(row.takeaway_sales || 0)),
        formatMoney(Number(row.delivery_sales || 0)),
      ];
    }),
    theme: "grid",
    headStyles: { fillColor: secondaryColor },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { halign: "right", cellWidth: 14 },
      2: { halign: "right", cellWidth: 19 },
      3: { halign: "right", cellWidth: 16 },
      4: { halign: "right", cellWidth: 17 },
      5: { halign: "right", cellWidth: 14 },
      6: { halign: "right", cellWidth: 16 },
      7: { halign: "right", cellWidth: 14 },
      8: { halign: "right", cellWidth: 14 },
      9: { halign: "right", cellWidth: 14 },
    },
  });

  const topItems = payload.top_items || [];
  if (topItems.length > 0) {
    autoTable(doc, {
      startY: getLastAutoTableY(doc) + 8,
      head: [["อันดับ", "สินค้า", "จำนวนขาย", "ยอดขายรวม"]],
      body: topItems.map((item, index) => [
        String(index + 1),
        item.product_name,
        Number(item.total_quantity || 0).toLocaleString(),
        formatMoney(Number(item.total_revenue || 0)),
      ]),
      theme: "grid",
      headStyles: { fillColor: [21, 128, 61] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { halign: "center", cellWidth: 18 },
        2: { halign: "right", cellWidth: 25 },
        3: { halign: "right", cellWidth: 35 },
      },
    });
  }

  const recentOrders = payload.recent_orders || [];
  if (recentOrders.length > 0) {
    autoTable(doc, {
      startY: getLastAutoTableY(doc) + 8,
      head: [["เลขออเดอร์", "ประเภท", "สถานะ", "เวลา", "จำนวนสินค้า", "ยอดรวม"]],
      body: recentOrders.slice(0, 20).map((order) => [
        `#${order.order_no}`,
        orderTypeThai(order.order_type),
        orderStatusThai(order.status),
        dayjs(order.create_date).format("DD/MM HH:mm"),
        Number(order.items_count || 0).toLocaleString(),
        formatMoney(Number(order.total_amount || 0)),
      ]),
      theme: "grid",
      headStyles: { fillColor: [67, 56, 202] },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { halign: "right", cellWidth: 16 },
        5: { halign: "right", cellWidth: 25 },
      },
    });
  }

  const filename = `รายงานสรุปผลการขาย_${rangeLabel.replace(/\s+/g, "_")}_${dateRange[0]}_${dateRange[1]}.pdf`;
  doc.save(filename);
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
