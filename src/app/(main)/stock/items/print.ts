import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import { PrintDocumentSetting, PrintPreset } from "../../../../types/api/pos/printSettings";
import {
  buildPageMarginCss,
  buildPageSizeCss,
  shouldUseReceiptRollPdf,
} from "../../../../utils/print-settings/runtime";
import { toCssLength } from "../../../../utils/print-settings/defaults";

type ReceiptPaperPreset = Extract<PrintPreset, "thermal_58mm" | "thermal_80mm">;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getOrderCode(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEffectiveDocumentSize(
  setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "orientation" | "unit">
) {
  const baseWidth = setting.width;
  const baseHeight =
    setting.height_mode === "fixed" && setting.height != null ? setting.height : null;

  if (setting.orientation === "landscape" && baseHeight != null) {
    return { width: baseHeight, height: baseWidth };
  }

  return { width: baseWidth, height: baseHeight };
}

function resolveStatusLabel(status: OrderStatus): string {
  if (status === OrderStatus.COMPLETED) return "เสร็จสิ้น";
  if (status === OrderStatus.CANCELLED) return "ยกเลิก";
  return "รอดำเนินการ";
}

export function buildStockOrderPrintHtml(params: {
  order: Order;
  documentSetting: PrintDocumentSetting;
  receiptPaperPreset: ReceiptPaperPreset;
}): string {
  const { order, documentSetting, receiptPaperPreset } = params;
  const orderCode = getOrderCode(order.id);
  const receiptLayout = shouldUseReceiptRollPdf(documentSetting);
  const pageSizeCss = buildPageSizeCss(documentSetting);
  const pagePaddingCss = buildPageMarginCss(documentSetting);
  const effectiveSize = getEffectiveDocumentSize(documentSetting);
  const sheetWidthCss = toCssLength(effectiveSize.width, documentSetting.unit);
  const sheetHeightCss =
    effectiveSize.height == null ? "auto" : toCssLength(effectiveSize.height, documentSetting.unit);

  const createdAt = formatDateTime(order.create_date);
  const orderedBy = order.ordered_by?.name || order.ordered_by?.username || "-";
  const printAt = new Date().toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const statusLabel = resolveStatusLabel(order.status);
  const safeRemark = escapeHtml(order.remark?.trim() || "-");
  const totalItems = order.ordersItems?.length || 0;
  const totalQty = (order.ordersItems || []).reduce(
    (sum, item) => sum + Number(item.quantity_ordered || 0),
    0
  );

  const rows = (order.ordersItems || [])
    .map((item, index) => {
      const name = escapeHtml(item.ingredient?.display_name || "-");
      const unit = escapeHtml(item.ingredient?.unit?.display_name || "หน่วย");
      const quantity = Number(item.quantity_ordered || 0);

      return receiptLayout
        ? `
          <article class="receipt-item">
            <div class="receipt-item-title">${index + 1}. ${name}</div>
            <div class="receipt-item-row"><span>จำนวน</span><strong>${quantity.toLocaleString()}</strong></div>
            <div class="receipt-item-row"><span>หน่วย</span><strong>${unit}</strong></div>
          </article>
        `
        : `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${name}</td>
            <td class="center">${quantity.toLocaleString()}</td>
            <td class="center">${unit}</td>
          </tr>
        `;
    })
    .join("");

  const content = receiptLayout
    ? `
      <section class="meta meta-compact">
        <div class="meta-line"><span>ใบสั่งซื้อ</span><strong>${escapeHtml(orderCode)}</strong></div>
        <div class="meta-line"><span>ผู้สร้าง</span><strong>${escapeHtml(orderedBy)}</strong></div>
        <div class="meta-line"><span>วันที่สร้าง</span><strong>${escapeHtml(createdAt)}</strong></div>
        <div class="meta-line"><span>สถานะ</span><strong>${escapeHtml(statusLabel)}</strong></div>
        <div class="meta-line"><span>พิมพ์เมื่อ</span><strong>${escapeHtml(printAt)}</strong></div>
        <div class="meta-line"><span>กระดาษ</span><strong>${receiptPaperPreset === "thermal_58mm" ? "58mm" : "80mm"}</strong></div>
      </section>
      <section class="section">
        <div class="section-title">รายการที่ต้องซื้อ</div>
        <div class="receipt-list">${rows || `<div class="empty-box">ไม่มีรายการวัตถุดิบ</div>`}</div>
      </section>
      <section class="summary-box">
        <div class="meta-line"><span>จำนวนรายการ</span><strong>${totalItems.toLocaleString()} รายการ</strong></div>
      </section>
      <section class="section">
        <div class="section-title">หมายเหตุ</div>
        <div class="remark-box">${safeRemark}</div>
      </section>
    `
    : `
      <section class="meta">
        <div class="meta-card"><div class="meta-label">ใบสั่งซื้อ</div><div class="meta-value">${escapeHtml(orderCode)}</div></div>
        <div class="meta-card"><div class="meta-label">ผู้สร้าง</div><div class="meta-value">${escapeHtml(orderedBy)}</div></div>
        <div class="meta-card"><div class="meta-label">วันที่สร้าง</div><div class="meta-value">${escapeHtml(createdAt)}</div></div>
        <div class="meta-card"><div class="meta-label">พิมพ์เมื่อ</div><div class="meta-value">${escapeHtml(printAt)}</div></div>
      </section>
      <table>
        <thead>
          <tr>
            <th class="center" style="width:56px;">ลำดับ</th>
            <th>รายการวัตถุดิบ</th>
            <th class="center" style="width:130px;">จำนวน</th>
            <th class="center" style="width:110px;">หน่วย</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" class="center">ไม่มีรายการวัตถุดิบ</td></tr>`}</tbody>
      </table>
      <section class="summary-box">
        <div class="meta-line"><span>สถานะ</span><strong>${escapeHtml(statusLabel)}</strong></div>
        <div class="meta-line"><span>จำนวนรายการ</span><strong>${totalItems.toLocaleString()} รายการ</strong></div>
      </section>
      <section class="section">
        <div class="section-title">หมายเหตุ</div>
        <div class="remark-box">${safeRemark}</div>
      </section>
    `;

  return `<!DOCTYPE html>
  <html lang="th">
    <head>
      <meta charset="UTF-8" />
      <title>ใบสั่งซื้อ ${orderCode}</title>
      <style>
        * { box-sizing: border-box; }
        @page { size: ${pageSizeCss}; margin: 0; }
        body {
          margin: 0;
          padding: 0;
          background: ${receiptLayout ? "#fff" : "#edf2f7"};
          font-family: "Tahoma", "Noto Sans Thai", sans-serif;
          color: #0f172a;
        }
        .sheet {
          width: ${sheetWidthCss};
          min-height: ${sheetHeightCss};
          margin: ${receiptLayout ? "0 auto" : "10mm auto"};
          background: #fff;
          padding: ${pagePaddingCss};
          border-radius: ${receiptLayout ? "0" : "12px"};
          box-shadow: ${receiptLayout ? "none" : "0 20px 50px rgba(15, 23, 42, 0.12)"};
        }
        .header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .title { margin: 0; font-size: 24px; }
        .subtitle { margin-top: 4px; color: #475569; font-size: 12px; }
        .badge {
          padding: 8px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #bfdbfe;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(${receiptLayout ? 1 : 2}, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .meta-card, .summary-box, .remark-box, .receipt-item, .meta-compact {
          border: 1px solid #dbe4f0;
          border-radius: 10px;
          background: #fcfdff;
        }
        .meta-card { padding: 10px 12px; }
        .meta-label { font-size: 12px; color: #64748b; }
        .meta-value { margin-top: 2px; font-size: 14px; font-weight: 600; }
        .meta-line {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 4px 0;
          font-size: 13px;
        }
        .meta-line span { color: #64748b; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #dbe4f0;
          padding: 8px;
          vertical-align: top;
        }
        th { background: #f8fafc; text-align: left; }
        .center { text-align: center; }
        .section { margin-top: 14px; }
        .section-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .summary-box { margin-top: 14px; padding: 10px 12px; }
        .remark-box { padding: 10px 12px; min-height: 56px; }
        .receipt-list { display: grid; gap: 8px; }
        .receipt-item { padding: 10px 12px; }
        .receipt-item-title { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
        .receipt-item-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          padding: 2px 0;
        }
        .meta-compact { padding: 10px 12px; }
        .empty-box {
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          color: #64748b;
          text-align: center;
          padding: 12px;
        }
        @media print {
          body { background: #fff; }
          .sheet {
            margin: 0;
            border-radius: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <header class="header">
          <div>
            <h1 class="title">ใบสั่งซื้อสินค้า</h1>
            <div class="subtitle">${receiptLayout ? "เอกสารสำหรับเครื่องพิมพ์ใบเสร็จ" : "เอกสารสำหรับตรวจรับและติดตามคิวใบซื้อ"}</div>
          </div>
          <div class="badge">${escapeHtml(orderCode)}</div>
        </header>
        ${content}
      </main>
      <script>
        window.addEventListener("afterprint", () => {
          setTimeout(() => {
            try { window.close(); } catch (error) {}
          }, 120);
        });
        window.addEventListener("load", () => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 250);
        });
      </script>
    </body>
  </html>`;
}
