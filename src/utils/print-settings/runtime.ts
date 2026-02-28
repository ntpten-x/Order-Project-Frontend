import { PaymentMethod } from "../../types/api/pos/paymentMethod";
import { Payments } from "../../types/api/pos/payments";
import {
    BranchPrintSettings,
    PrintAutomationSettings,
    PrintDocumentSetting,
    PrintDocumentType,
} from "../../types/api/pos/printSettings";
import { OrderType, SalesOrder } from "../../types/api/pos/salesOrder";
import { Shift, ShiftSummary } from "../../types/api/pos/shifts";
import { printSettingsService } from "../../services/pos/printSettings.service";
import { ShopProfile, shopProfileService } from "../../services/pos/shopProfile.service";
import { groupOrderItems } from "../orderGrouping";
import { resolveImageSource } from "../image/source";
import { isCancelledStatus } from "../orders";
import { mergePrintSettings, toCssLength } from "./defaults";

type PaymentWithMethod = Payments & {
    payment_method?: PaymentMethod | null;
};

export type PrintShopProfile = ShopProfile & {
    tax_id?: string;
    logo_url?: string;
};

export type PrintAutomationKey = keyof PrintAutomationSettings;

const PRINT_SETTINGS_CACHE_TTL_MS = 60_000;
const SHOP_PROFILE_CACHE_TTL_MS = 60_000;

let printSettingsCache: BranchPrintSettings | null = null;
let printSettingsCacheExpiresAt = 0;
let printSettingsInflight: Promise<BranchPrintSettings> | null = null;

let shopProfileCache: PrintShopProfile | null = null;
let shopProfileCacheExpiresAt = 0;
let shopProfileInflight: Promise<PrintShopProfile | null> | null = null;

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toNumber(value: unknown): number {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatMoney(value: unknown, locale: string): string {
    return `฿${toNumber(value).toLocaleString(locale || "th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

function formatDateTime(value: string | Date | null | undefined, locale: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat(locale || "th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getOrderTypeLabel(orderType: OrderType | string | undefined): string {
    if (orderType === OrderType.DineIn) return "ทานที่ร้าน";
    if (orderType === OrderType.TakeAway) return "กลับบ้าน";
    if (orderType === OrderType.Delivery) return "เดลิเวอรี่";
    return String(orderType || "-");
}

function getEffectiveSize(setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "orientation">) {
    if (setting.height_mode === "fixed" && setting.height != null && setting.orientation === "landscape") {
        return {
            width: setting.height,
            height: setting.width,
        };
    }

    return {
        width: setting.width,
        height: setting.height,
    };
}

export function buildPageSizeCss(setting: Pick<PrintDocumentSetting, "width" | "height" | "height_mode" | "unit" | "orientation">): string {
    const effective = getEffectiveSize(setting);
    if (setting.height_mode === "auto" || effective.height == null) {
        return `${toCssLength(effective.width, setting.unit)} auto`;
    }

    return `${toCssLength(effective.width, setting.unit)} ${toCssLength(effective.height, setting.unit)}`;
}

export function buildPageMarginCss(setting: Pick<PrintDocumentSetting, "margin_top" | "margin_right" | "margin_bottom" | "margin_left" | "unit">): string {
    return [
        toCssLength(setting.margin_top, setting.unit),
        toCssLength(setting.margin_right, setting.unit),
        toCssLength(setting.margin_bottom, setting.unit),
        toCssLength(setting.margin_left, setting.unit),
    ].join(" ");
}

function getBaseFontSize(setting: Pick<PrintDocumentSetting, "printer_profile" | "density" | "font_scale">): number {
    const baseByProfile = setting.printer_profile === "thermal" ? 12 : setting.printer_profile === "label" ? 13 : 14;
    const densityOffset = setting.density === "compact" ? -1 : setting.density === "spacious" ? 1 : 0;
    const scaled = (baseByProfile + densityOffset) * (Math.max(setting.font_scale, 70) / 100);
    return Math.max(10, Number(scaled.toFixed(1)));
}

function getSectionGap(setting: Pick<PrintDocumentSetting, "density">): number {
    if (setting.density === "compact") return 10;
    if (setting.density === "spacious") return 18;
    return 14;
}

function normalizeSettings(settings: Partial<BranchPrintSettings> | undefined): BranchPrintSettings {
    const merged = mergePrintSettings(undefined, settings);
    return {
        id: settings?.id,
        branch_id: settings?.branch_id,
        created_at: settings?.created_at,
        updated_at: settings?.updated_at,
        ...merged,
    };
}

export function peekPrintSettings(): BranchPrintSettings | null {
    return printSettingsCache;
}

export async function getPrintSettings(options?: { forceRefresh?: boolean }): Promise<BranchPrintSettings> {
    const forceRefresh = Boolean(options?.forceRefresh);
    const now = Date.now();

    if (!forceRefresh && printSettingsCache && printSettingsCacheExpiresAt > now) {
        return printSettingsCache;
    }

    if (!forceRefresh && printSettingsInflight) {
        return printSettingsInflight;
    }

    printSettingsInflight = (async () => {
        try {
            const payload = await printSettingsService.getSettings();
            const normalized = normalizeSettings(payload);
            printSettingsCache = normalized;
            printSettingsCacheExpiresAt = Date.now() + PRINT_SETTINGS_CACHE_TTL_MS;
            return normalized;
        } catch (error) {
            console.warn("Unable to load print settings, fallback to defaults", error);
            const fallback = normalizeSettings(undefined);
            printSettingsCache = fallback;
            printSettingsCacheExpiresAt = Date.now() + 10_000;
            return fallback;
        } finally {
            printSettingsInflight = null;
        }
    })();

    return printSettingsInflight;
}

async function getPrintShopProfile(options?: {
    forceRefresh?: boolean;
    shopProfile?: PrintShopProfile | null;
}): Promise<PrintShopProfile | null> {
    if (options?.shopProfile !== undefined) {
        return options.shopProfile;
    }

    const forceRefresh = Boolean(options?.forceRefresh);
    const now = Date.now();
    if (!forceRefresh && shopProfileCache && shopProfileCacheExpiresAt > now) {
        return shopProfileCache;
    }

    if (!forceRefresh && shopProfileInflight) {
        return shopProfileInflight;
    }

    shopProfileInflight = (async () => {
        try {
            const payload = (await shopProfileService.getProfile()) as PrintShopProfile;
            shopProfileCache = payload;
            shopProfileCacheExpiresAt = Date.now() + SHOP_PROFILE_CACHE_TTL_MS;
            return payload;
        } catch (error) {
            console.warn("Unable to load shop profile for print", error);
            shopProfileCache = null;
            shopProfileCacheExpiresAt = Date.now() + 10_000;
            return null;
        } finally {
            shopProfileInflight = null;
        }
    })();

    return shopProfileInflight;
}

export function primePrintResources(): void {
    void getPrintSettings();
    void getPrintShopProfile();
}

export async function isPrintAutomationEnabled(
    key: PrintAutomationKey,
    options?: { forceRefresh?: boolean; settings?: BranchPrintSettings | null }
): Promise<boolean> {
    const settings = options?.settings ?? (await getPrintSettings({ forceRefresh: options?.forceRefresh }));
    return Boolean(settings.automation[key]);
}

export function reservePrintWindow(title: string): Window | null {
    if (typeof window === "undefined") return null;

    const targetWindow = window.open("", "_blank", "width=1080,height=1400");
    if (!targetWindow) return null;

    targetWindow.document.open();
    targetWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }
    .print-loading {
      width: min(420px, calc(100vw - 48px));
      padding: 24px;
      border-radius: 18px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
      text-align: center;
    }
    .print-loading h1 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    .print-loading p {
      margin: 0;
      color: #475569;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="print-loading">
    <h1>${escapeHtml(title)}</h1>
    <p>กำลังเตรียมเอกสารสำหรับพิมพ์...</p>
  </div>
</body>
</html>`);
    targetWindow.document.close();

    return targetWindow;
}

export function closePrintWindow(targetWindow?: Window | null): void {
    if (!targetWindow || targetWindow.closed) return;

    try {
        targetWindow.close();
    } catch {
        // Ignore close failures from blocked/closed windows.
    }
}

function buildPrintShellHtml(options: {
    title: string;
    setting: PrintDocumentSetting;
    bodyMarkup: string;
}): string {
    const { title, setting, bodyMarkup } = options;
    const pageSize = buildPageSizeCss(setting);
    const pageMargin = buildPageMarginCss(setting);
    const baseFontSize = getBaseFontSize(setting);
    const sectionGap = getSectionGap(setting);
    const widthCss =
        setting.height_mode === "auto" || setting.height == null
            ? toCssLength(getEffectiveSize(setting).width, setting.unit)
            : "100%";

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: ${pageMargin};
    }

    :root {
      --font-size: ${baseFontSize}px;
      --font-size-sm: ${Math.max(baseFontSize - 1.2, 9)}px;
      --font-size-lg: ${Number((baseFontSize * 1.18).toFixed(1))}px;
      --font-size-xl: ${Number((baseFontSize * 1.42).toFixed(1))}px;
      --gap: ${sectionGap}px;
      --line-height: ${setting.line_spacing};
      --muted: #475569;
      --border: ${setting.printer_profile === "thermal" ? "#cbd5e1" : "#d7dee8"};
      --ink: #0f172a;
      --surface: #ffffff;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--ink);
      font-family: "Noto Sans Thai", Tahoma, sans-serif;
      font-size: var(--font-size);
      line-height: var(--line-height);
    }

    body {
      width: 100%;
    }

    .print-root {
      width: 100%;
    }

    .page {
      width: ${widthCss};
      margin: 0 auto;
      break-after: page;
      page-break-after: always;
    }

    .page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .stack {
      display: grid;
      gap: var(--gap);
    }

    .section {
      display: grid;
      gap: 8px;
    }

    .section-title {
      font-weight: 800;
      font-size: var(--font-size-lg);
      margin: 0;
    }

    .text-center {
      text-align: center;
    }

    .muted {
      color: var(--muted);
    }

    .divider {
      border-top: 1px dashed var(--border);
      width: 100%;
      margin: 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .label {
      color: var(--muted);
      flex: 1;
      min-width: 0;
    }

    .value {
      text-align: right;
      font-weight: 600;
      flex-shrink: 0;
    }

    .panel {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      background: var(--surface);
    }

    .grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .metric {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
      background: #fff;
    }

    .metric-label {
      display: block;
      color: var(--muted);
      font-size: var(--font-size-sm);
      margin-bottom: 4px;
    }

    .metric-value {
      font-weight: 800;
      font-size: var(--font-size-lg);
      color: #111827;
    }

    .brand-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      display: block;
      margin: 0 auto 8px;
    }

    .brand-name {
      font-size: var(--font-size-xl);
      font-weight: 900;
      letter-spacing: 0.01em;
    }

    .brand-meta {
      color: var(--muted);
      font-size: var(--font-size-sm);
    }

    .item-list {
      display: grid;
      gap: 10px;
    }

    .item-card {
      display: grid;
      gap: 4px;
    }

    .item-name {
      font-weight: 700;
    }

    .item-meta,
    .item-note,
    .url-line,
    .footer-note {
      font-size: var(--font-size-sm);
    }

    .item-meta,
    .url-line,
    .footer-note {
      color: var(--muted);
    }

    .item-note {
      color: #92400e;
    }

    .mod-line {
      color: #065f46;
      font-size: var(--font-size-sm);
      padding-left: 10px;
    }

    .qr-shell {
      display: grid;
      gap: 14px;
      justify-items: center;
      text-align: center;
    }

    .qr-frame {
      padding: 10px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: #ffffff;
    }

    .qr-frame img {
      width: min(100%, 72mm);
      height: auto;
      display: block;
    }

    .list {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="print-root">${bodyMarkup}</div>
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
</html>`;
}

function writeAndPrintDocument(options: {
    title: string;
    setting: PrintDocumentSetting;
    bodyMarkup: string;
    targetWindow?: Window | null;
}): void {
    const targetWindow = options.targetWindow ?? reservePrintWindow(options.title);
    if (!targetWindow) {
        throw new Error("Popup blocked. Please allow popups to print.");
    }

    const html = buildPrintShellHtml({
        title: options.title,
        setting: options.setting,
        bodyMarkup: options.bodyMarkup,
    });

    targetWindow.document.open();
    targetWindow.document.write(html);
    targetWindow.document.close();
}

function renderDocumentPages(contentMarkup: string, copies: number): string {
    const safeCopies = Math.max(1, Math.floor(copies || 1));
    return Array.from({ length: safeCopies }, () => `<section class="page">${contentMarkup}</section>`).join("");
}

function buildBrandMarkup(options: {
    shopProfile?: PrintShopProfile | null;
    setting: Pick<PrintDocumentSetting, "show_logo" | "show_branch_address">;
}): string {
    const shopProfile = options.shopProfile;
    if (!shopProfile?.shop_name && !shopProfile?.address && !shopProfile?.phone && !shopProfile?.tax_id && !shopProfile?.logo_url) {
        return "";
    }

    const logoUrl = options.setting.show_logo ? resolveImageSource(shopProfile?.logo_url) : null;
    const showMeta = options.setting.show_branch_address;
    const metaLines = [
        showMeta && shopProfile?.address ? `<div class="brand-meta">${escapeHtml(shopProfile.address)}</div>` : "",
        showMeta && shopProfile?.phone ? `<div class="brand-meta">โทร ${escapeHtml(shopProfile.phone)}</div>` : "",
        showMeta && shopProfile?.tax_id ? `<div class="brand-meta">เลขผู้เสียภาษี ${escapeHtml(shopProfile.tax_id)}</div>` : "",
    ]
        .filter(Boolean)
        .join("");

    return `<header class="section text-center">
        ${logoUrl ? `<img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="Shop logo" />` : ""}
        ${shopProfile?.shop_name ? `<div class="brand-name">${escapeHtml(shopProfile.shop_name)}</div>` : ""}
        ${metaLines}
    </header>`;
}

function buildReceiptMarkup(options: {
    order: SalesOrder;
    shopProfile?: PrintShopProfile | null;
    settings: BranchPrintSettings;
}): string {
    const { order, shopProfile, settings } = options;
    const setting = settings.documents.receipt;
    const locale = settings.locale || "th-TH";
    const items = groupOrderItems((order.items || []).filter((item) => !isCancelledStatus(item.status)));
    const payments = (order.payments || []) as PaymentWithMethod[];
    const paymentTotal = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const totalQty = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);

    const itemMarkup = items.length
        ? items
              .map((item) => {
                  const modifiers = (item.details || [])
                      .map((detail) => {
                          const extraPrice = toNumber(detail.extra_price);
                          return `<div class="mod-line">+ ${escapeHtml(detail.detail_name)}${
                              extraPrice > 0 ? ` (${escapeHtml(formatMoney(extraPrice, locale))})` : ""
                          }</div>`;
                      })
                      .join("");

                  return `<article class="item-card">
                    <div class="row">
                      <div style="flex: 1; min-width: 0;">
                        <div class="item-name">${escapeHtml(
                            item.product?.display_name || item.product?.product_name || "สินค้า"
                        )}</div>
                        <div class="item-meta">${escapeHtml(
                            `${toNumber(item.quantity).toLocaleString(locale)} x ${formatMoney(item.price, locale)}`
                        )}</div>
                      </div>
                      <div class="value">${escapeHtml(formatMoney(item.total_price, locale))}</div>
                    </div>
                    ${modifiers}
                    ${item.notes ? `<div class="item-note">หมายเหตุ: ${escapeHtml(item.notes)}</div>` : ""}
                  </article>`;
              })
              .join("")
        : `<div class="muted">ไม่พบรายการสินค้า</div>`;

    const paymentMarkup = payments.length
        ? payments
              .map(
                  (payment) => `<div class="row">
                <div class="label">${escapeHtml(
                    payment.payment_method?.display_name ||
                        payment.payment_method?.payment_method_name ||
                        "ไม่ระบุวิธีชำระเงิน"
                )}</div>
                <div class="value">${escapeHtml(formatMoney(payment.amount, locale))}</div>
              </div>`
              )
              .join("")
        : `<div class="muted">ยังไม่มีข้อมูลการชำระเงิน</div>`;

    const metaMarkup = setting.show_order_meta
        ? `<section class="section">
            <div class="row"><div class="label">เลขที่ออเดอร์</div><div class="value">#${escapeHtml(order.order_no)}</div></div>
            <div class="row"><div class="label">วันที่</div><div class="value">${escapeHtml(
                formatDateTime(order.create_date, locale)
            )}</div></div>
            <div class="row"><div class="label">ประเภท</div><div class="value">${escapeHtml(
                getOrderTypeLabel(order.order_type)
            )}</div></div>
            ${
                order.order_type === OrderType.DineIn && order.table?.table_name
                    ? `<div class="row"><div class="label">โต๊ะ</div><div class="value">${escapeHtml(
                          order.table.table_name
                      )}</div></div>`
                    : ""
            }
            ${
                order.order_type === OrderType.Delivery && order.delivery_code
                    ? `<div class="row"><div class="label">รหัสจัดส่ง</div><div class="value">${escapeHtml(
                          order.delivery_code
                      )}</div></div>`
                    : ""
            }
            <div class="row"><div class="label">พนักงาน</div><div class="value">${escapeHtml(
                order.created_by?.name || order.created_by?.username || "-"
            )}</div></div>
          </section>`
        : "";

    return renderDocumentPages(
        `<div class="stack">
            ${buildBrandMarkup({ shopProfile, setting })}
            <section class="section text-center">
                <div class="section-title">ใบเสร็จรับเงิน</div>
            </section>
            ${metaMarkup}
            <div class="divider"></div>
            <section class="section">
                <div class="row">
                    <div class="section-title" style="font-size: var(--font-size);">รายการสินค้า</div>
                    <div class="value">${escapeHtml(items.length.toLocaleString(locale))} รายการ</div>
                </div>
                <div class="item-list">${itemMarkup}</div>
            </section>
            <div class="divider"></div>
            <section class="section">
                <div class="row"><div class="label">รวมก่อนส่วนลด</div><div class="value">${escapeHtml(
                    formatMoney(order.sub_total, locale)
                )}</div></div>
                ${
                    toNumber(order.discount_amount) > 0
                        ? `<div class="row"><div class="label">ส่วนลด ${
                              escapeHtml(order.discount?.display_name || order.discount?.discount_name || "")
                          }</div><div class="value">-${escapeHtml(
                              formatMoney(order.discount_amount, locale)
                          )}</div></div>`
                        : ""
                }
                ${
                    toNumber(order.vat) > 0
                        ? `<div class="row"><div class="label">VAT</div><div class="value">${escapeHtml(
                              formatMoney(order.vat, locale)
                          )}</div></div>`
                        : ""
                }
                <div class="row" style="padding-top: 6px; border-top: 1px solid #e2e8f0;">
                    <div class="section-title" style="font-size: var(--font-size-lg);">ยอดสุทธิ</div>
                    <div class="metric-value">${escapeHtml(formatMoney(order.total_amount, locale))}</div>
                </div>
            </section>
            <div class="divider"></div>
            <section class="section">
                <div class="section-title" style="font-size: var(--font-size);">การชำระเงิน</div>
                ${paymentMarkup}
                <div class="row"><div class="label">รวมชำระ</div><div class="value">${escapeHtml(
                    formatMoney(paymentTotal, locale)
                )}</div></div>
                ${
                    toNumber(order.received_amount) > 0
                        ? `<div class="row"><div class="label">รับเงิน</div><div class="value">${escapeHtml(
                              formatMoney(order.received_amount, locale)
                          )}</div></div>`
                        : ""
                }
                ${
                    toNumber(order.change_amount) > 0
                        ? `<div class="row"><div class="label">เงินทอน</div><div class="value">${escapeHtml(
                              formatMoney(order.change_amount, locale)
                          )}</div></div>`
                        : ""
                }
            </section>
            ${
                setting.show_footer
                    ? `<div class="divider"></div>
                       <section class="section text-center">
                           <div style="font-weight: 800;">ขอบคุณที่ใช้บริการ</div>
                           <div class="footer-note">จำนวนสินค้ารวม ${escapeHtml(
                               totalQty.toLocaleString(locale)
                           )} ชิ้น</div>
                           <div class="footer-note">พิมพ์เมื่อ ${escapeHtml(formatDateTime(new Date(), locale))}</div>
                       </section>`
                    : ""
            }
            ${setting.note ? `<div class="footer-note text-center">${escapeHtml(setting.note)}</div>` : ""}
        </div>`,
        setting.copies
    );
}

function buildShiftSummaryMarkup(options: {
    summary: ShiftSummary;
    shift?: Shift | null;
    shopProfile?: PrintShopProfile | null;
    settings: BranchPrintSettings;
}): string {
    const { summary, shift, shopProfile, settings } = options;
    const setting = settings.documents.order_summary;
    const locale = settings.locale || "th-TH";
    const paymentMethods = Object.entries(summary.summary.payment_methods || {});
    const orderTypes = Object.entries(summary.summary.order_types || {});
    const categories = Object.entries(summary.categories || {});

    const metricCards = [
        ["ยอดขายรวม", formatMoney(summary.summary.total_sales, locale)],
        ["กำไรสุทธิ", formatMoney(summary.summary.net_profit, locale)],
        ["เงินเริ่มต้น", formatMoney(summary.shift_info.start_amount, locale)],
        ["ยอดคาดหวัง", formatMoney(summary.shift_info.expected_amount, locale)],
        ["ยอดนับจริง", formatMoney(summary.shift_info.end_amount, locale)],
        ["ผลต่าง", formatMoney(summary.shift_info.diff_amount, locale)],
    ]
        .map(
            ([label, value]) => `<div class="metric">
                <span class="metric-label">${escapeHtml(label)}</span>
                <div class="metric-value">${escapeHtml(value)}</div>
            </div>`
        )
        .join("");

    const paymentMarkup = paymentMethods.length
        ? paymentMethods
              .map(
                  ([method, amount]) => `<div class="row">
                <div class="label">${escapeHtml(method)}</div>
                <div class="value">${escapeHtml(formatMoney(amount, locale))}</div>
            </div>`
              )
              .join("")
        : `<div class="muted">ไม่พบข้อมูลวิธีชำระเงิน</div>`;

    const orderTypeMarkup = orderTypes.length
        ? orderTypes
              .map(
                  ([orderType, amount]) => `<div class="row">
                <div class="label">${escapeHtml(getOrderTypeLabel(orderType))}</div>
                <div class="value">${escapeHtml(formatMoney(amount, locale))}</div>
            </div>`
              )
              .join("")
        : `<div class="muted">ไม่พบข้อมูลช่องทางขาย</div>`;

    const topProductsMarkup = summary.top_products.length
        ? summary.top_products
              .map(
                  (item, index) => `<li>
                <strong>${escapeHtml(`${index + 1}. ${item.name}`)}</strong>
                <span class="muted"> ${escapeHtml(
                    `${toNumber(item.quantity).toLocaleString(locale)} ${item.unit || "หน่วย"}`
                )}</span>
                <span class="value" style="display: block;">${escapeHtml(formatMoney(item.revenue, locale))}</span>
            </li>`
              )
              .join("")
        : `<div class="muted">ไม่พบข้อมูลสินค้าขายดี</div>`;

    const categoriesMarkup = categories.length
        ? categories
              .map(
                  ([category, qty]) => `<div class="row">
                <div class="label">${escapeHtml(category)}</div>
                <div class="value">${escapeHtml(toNumber(qty).toLocaleString(locale))}</div>
            </div>`
              )
              .join("")
        : `<div class="muted">ไม่พบข้อมูลหมวดสินค้า</div>`;

    const shiftMetaRows = [
        shift?.id ? `<div class="row"><div class="label">รหัสกะ</div><div class="value">${escapeHtml(shift.id)}</div></div>` : "",
        shift?.open_time
            ? `<div class="row"><div class="label">เวลาเปิดกะ</div><div class="value">${escapeHtml(
                  formatDateTime(shift.open_time, locale)
              )}</div></div>`
            : "",
        shift?.close_time
            ? `<div class="row"><div class="label">เวลาปิดกะ</div><div class="value">${escapeHtml(
                  formatDateTime(shift.close_time, locale)
              )}</div></div>`
            : "",
    ]
        .filter(Boolean)
        .join("");

    return renderDocumentPages(
        `<div class="stack">
            ${buildBrandMarkup({ shopProfile, setting })}
            <section class="section text-center">
                <div class="section-title">สรุปปิดกะ</div>
                <div class="muted">พิมพ์เมื่อ ${escapeHtml(formatDateTime(new Date(), locale))}</div>
            </section>
            ${
                shiftMetaRows
                    ? `<section class="section panel">
                        <div class="section-title" style="font-size: var(--font-size);">ข้อมูลกะ</div>
                        ${shiftMetaRows}
                      </section>`
                    : ""
            }
            <section class="grid">${metricCards}</section>
            <section class="panel section">
                <div class="section-title" style="font-size: var(--font-size);">ยอดขายตามวิธีชำระเงิน</div>
                ${paymentMarkup}
            </section>
            <section class="panel section">
                <div class="section-title" style="font-size: var(--font-size);">ยอดขายตามช่องทาง</div>
                ${orderTypeMarkup}
            </section>
            <section class="panel section">
                <div class="section-title" style="font-size: var(--font-size);">สินค้าขายดี</div>
                ${
                    summary.top_products.length
                        ? `<ol class="list">${topProductsMarkup}</ol>`
                        : topProductsMarkup
                }
            </section>
            <section class="panel section">
                <div class="section-title" style="font-size: var(--font-size);">หมวดสินค้าขายออก</div>
                ${categoriesMarkup}
            </section>
            ${setting.note ? `<div class="footer-note text-center">${escapeHtml(setting.note)}</div>` : ""}
        </div>`,
        setting.copies
    );
}

function buildTableQrMarkup(options: {
    tableName: string;
    customerUrl: string;
    qrImageDataUrl: string;
    qrCodeExpiresAt?: string | null;
    shopProfile?: PrintShopProfile | null;
    settings: BranchPrintSettings;
}): string {
    const { tableName, customerUrl, qrImageDataUrl, qrCodeExpiresAt, shopProfile, settings } = options;
    const setting = settings.documents.table_qr;
    const locale = settings.locale || "th-TH";
    const urlLines = customerUrl.match(/.{1,56}/g) || [customerUrl];

    return renderDocumentPages(
        `<div class="stack">
            ${buildBrandMarkup({ shopProfile, setting })}
            <section class="qr-shell">
                <div class="section-title">QR โต๊ะ ${escapeHtml(tableName)}</div>
                <div class="muted">สแกนเพื่อเปิดเมนูและสั่งอาหาร</div>
                <div class="qr-frame">
                    <img src="${escapeHtml(qrImageDataUrl)}" alt="QR code for table ${escapeHtml(tableName)}" />
                </div>
                <div class="section">
                    ${urlLines.map((line) => `<div class="url-line">${escapeHtml(line)}</div>`).join("")}
                </div>
                ${
                    qrCodeExpiresAt
                        ? `<div class="footer-note">หมดอายุ ${escapeHtml(
                              formatDateTime(qrCodeExpiresAt, locale)
                          )}</div>`
                        : ""
                }
                ${
                    setting.show_footer
                        ? `<div class="footer-note">สร้างเมื่อ ${escapeHtml(formatDateTime(new Date(), locale))}</div>`
                        : ""
                }
                ${setting.note ? `<div class="footer-note">${escapeHtml(setting.note)}</div>` : ""}
            </section>
        </div>`,
        setting.copies
    );
}

async function resolvePrintContext(options?: {
    settings?: BranchPrintSettings | null;
    shopProfile?: PrintShopProfile | null;
}): Promise<{ settings: BranchPrintSettings; shopProfile: PrintShopProfile | null }> {
    const [settings, shopProfile] = await Promise.all([
        options?.settings ?? getPrintSettings(),
        getPrintShopProfile({ shopProfile: options?.shopProfile ?? undefined }),
    ]);

    return { settings, shopProfile };
}

export async function printReceiptDocument(options: {
    order: SalesOrder;
    settings?: BranchPrintSettings | null;
    shopProfile?: PrintShopProfile | null;
    targetWindow?: Window | null;
}): Promise<boolean> {
    const { settings, shopProfile } = await resolvePrintContext({
        settings: options.settings,
        shopProfile: options.shopProfile ?? undefined,
    });
    const documentSetting = settings.documents.receipt;
    if (!documentSetting.enabled) {
        closePrintWindow(options.targetWindow);
        return false;
    }

    writeAndPrintDocument({
        title: `Receipt #${options.order.order_no || ""}`.trim(),
        setting: documentSetting,
        bodyMarkup: buildReceiptMarkup({
            order: options.order,
            settings,
            shopProfile,
        }),
        targetWindow: options.targetWindow,
    });

    return true;
}

export async function printShiftSummaryDocument(options: {
    summary: ShiftSummary;
    shift?: Shift | null;
    settings?: BranchPrintSettings | null;
    shopProfile?: PrintShopProfile | null;
    targetWindow?: Window | null;
}): Promise<boolean> {
    const { settings, shopProfile } = await resolvePrintContext({
        settings: options.settings,
        shopProfile: options.shopProfile ?? undefined,
    });
    const documentSetting = settings.documents.order_summary;
    if (!documentSetting.enabled) {
        closePrintWindow(options.targetWindow);
        return false;
    }

    writeAndPrintDocument({
        title: options.shift?.id ? `Shift Summary ${options.shift.id}` : "Shift Summary",
        setting: documentSetting,
        bodyMarkup: buildShiftSummaryMarkup({
            summary: options.summary,
            shift: options.shift,
            settings,
            shopProfile,
        }),
        targetWindow: options.targetWindow,
    });

    return true;
}

export async function printTableQrDocument(options: {
    tableName: string;
    customerUrl: string;
    qrImageDataUrl: string;
    qrCodeExpiresAt?: string | null;
    settings?: BranchPrintSettings | null;
    shopProfile?: PrintShopProfile | null;
    targetWindow?: Window | null;
}): Promise<boolean> {
    const { settings, shopProfile } = await resolvePrintContext({
        settings: options.settings,
        shopProfile: options.shopProfile ?? undefined,
    });
    const documentSetting = settings.documents.table_qr;
    if (!documentSetting.enabled) {
        closePrintWindow(options.targetWindow);
        return false;
    }

    writeAndPrintDocument({
        title: `Table QR ${options.tableName}`.trim(),
        setting: documentSetting,
        bodyMarkup: buildTableQrMarkup({
            tableName: options.tableName,
            customerUrl: options.customerUrl,
            qrImageDataUrl: options.qrImageDataUrl,
            qrCodeExpiresAt: options.qrCodeExpiresAt,
            settings,
            shopProfile,
        }),
        targetWindow: options.targetWindow,
    });

    return true;
}

export function getDocumentSetting(
    settings: BranchPrintSettings,
    documentType: PrintDocumentType
): PrintDocumentSetting {
    return settings.documents[documentType];
}
