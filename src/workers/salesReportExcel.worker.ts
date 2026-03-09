import * as XLSX from "xlsx";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { applyWorkbookPageSetup } from "../utils/print-settings/excelPageSetup";
import type { PrintDocumentSetting } from "../types/api/pos/printSettings";
import type {
  DashboardSummaryExport,
  RecentOrderExport,
  SalesReportBranding,
  SalesReportExportPayload,
  SalesSummaryExport,
  TopItemExport,
} from "../utils/export.utils";

dayjs.locale("th");

interface SalesReportExcelWorkerRequest {
  payload: SalesReportExportPayload;
  dateRange: [string, string];
  rangeLabel: string;
  branding: SalesReportBranding;
  documentSetting: PrintDocumentSetting;
}

interface SalesReportExcelWorkerSuccessResponse {
  type: "success";
  filename: string;
  workbookBytes: ArrayBuffer;
}

interface SalesReportExcelWorkerErrorResponse {
  type: "error";
  error: string;
}

interface WorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<SalesReportExcelWorkerRequest>) => void
  ): void;
  postMessage(
    message: SalesReportExcelWorkerSuccessResponse | SalesReportExcelWorkerErrorResponse,
    transfer?: Transferable[]
  ): void;
}

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

function formatDate(value: string): string {
  return dayjs(value).format("DD/MM/YYYY");
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

function buildSummaryRows(
  summary: DashboardSummaryExport,
  branding: SalesReportBranding,
  dateRange: [string, string],
  rangeLabel: string
) {
  return [
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
}

function buildDailyRows(dailySales: SalesSummaryExport[]) {
  return dailySales.map((row) => {
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
}

function buildTopItemRows(topItems: TopItemExport[]) {
  return topItems.map((item, index) => [
    index + 1,
    item.display_name,
    Number(item.total_quantity || 0),
    Number(item.total_revenue || 0),
  ]);
}

function buildRecentOrderRows(recentOrders: RecentOrderExport[]) {
  return recentOrders.map((order) => [
    order.order_no,
    orderTypeThai(order.order_type),
    orderStatusThai(order.status),
    dayjs(order.create_date).format("DD/MM/YYYY HH:mm"),
    Number(order.items_count || 0),
    Number(order.total_amount || 0),
  ]);
}

function buildWorkbook(request: SalesReportExcelWorkerRequest): { filename: string; workbookBytes: Uint8Array } {
  const { payload, dateRange, rangeLabel, branding, documentSetting } = request;
  const workbook = XLSX.utils.book_new();
  const summary = payload.summary || buildFallbackSummary(payload.daily_sales);
  const worksheetMargins = buildWorksheetMargins(documentSetting);

  const summarySheet = XLSX.utils.aoa_to_sheet(buildSummaryRows(summary, branding, dateRange, rangeLabel));
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
  const dailySheet = XLSX.utils.aoa_to_sheet([dailyHeader, ...buildDailyRows(payload.daily_sales)]);
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

  const topSheet = XLSX.utils.aoa_to_sheet([["อันดับ", "สินค้า", "จำนวนขาย", "ยอดขายรวม"], ...buildTopItemRows(payload.top_items)]);
  topSheet["!cols"] = [{ wch: 10 }, { wch: 34 }, { wch: 14 }, { wch: 16 }];
  topSheet["!margins"] = worksheetMargins;
  XLSX.utils.book_append_sheet(workbook, topSheet, "สินค้าขายดี");

  const recentOrders = payload.recent_orders || [];
  if (recentOrders.length > 0) {
    const recentSheet = XLSX.utils.aoa_to_sheet([
      ["เลขออเดอร์", "ประเภท", "สถานะ", "วันเวลา", "จำนวนสินค้า", "ยอดรวม"],
      ...buildRecentOrderRows(recentOrders),
    ]);
    recentSheet["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
    recentSheet["!margins"] = worksheetMargins;
    XLSX.utils.book_append_sheet(workbook, recentSheet, "ออเดอร์ล่าสุด");
  }

  const filename = `รายงานสรุปผลการขาย_${rangeLabel.replace(/\s+/g, "_")}_${dateRange[0]}_${dateRange[1]}.xlsx`;
  const workbookBytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const patchedWorkbookBytes = applyWorkbookPageSetup(workbookBytes, documentSetting);

  return {
    filename,
    workbookBytes: patchedWorkbookBytes,
  };
}

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<SalesReportExcelWorkerRequest>) => {
  try {
    const { filename, workbookBytes } = buildWorkbook(event.data);
    // Transfer the ArrayBuffer instead of cloning the binary payload so large exports stay cheap.
    const transferableBytes = new Uint8Array(workbookBytes).buffer;
    const response: SalesReportExcelWorkerSuccessResponse = {
      type: "success",
      filename,
      workbookBytes: transferableBytes,
    };
    workerScope.postMessage(response, [transferableBytes]);
  } catch (error) {
    const response: SalesReportExcelWorkerErrorResponse = {
      type: "error",
      error: error instanceof Error ? error.message : "ไม่สามารถสร้างไฟล์ Excel ได้",
    };
    workerScope.postMessage(response);
  }
});

export {};
