import { chromium, devices, request as playwrightRequest } from "playwright";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";
const USERNAME = process.env.E2E_USERNAME || "admin";
const PASSWORD = process.env.E2E_PASSWORD || "Admin123456!";

const LONG_INPUT =
  "overflow-check-" +
  "averyveryveryveryveryveryveryveryverylongunbrokenmobiletoken".repeat(2);

const PAGE_SCENARIOS = [
  { path: "/pos/dashboard", label: "pos-dashboard", waitFor: "networkidle" },
  {
    path: "/pos/shiftHistory",
    label: "pos-shift-history",
    waitFor: "networkidle",
    action: async (page) => {
      const input = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="เธ"]').first();
      if (await input.count()) {
        await input.fill(LONG_INPUT);
        await page.waitForTimeout(500);
      }
    },
  },
  { path: "/pos/orders", label: "pos-orders", waitFor: "networkidle" },
  {
    path: "/pos/qr-code",
    label: "pos-qr-code",
    waitFor: "networkidle",
    action: async (page) => {
      const input = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="เธ"]').first();
      if (await input.count()) {
        await input.fill(LONG_INPUT);
        await page.waitForTimeout(500);
      }
    },
  },
  { path: "/pos/channels/delivery", label: "pos-channels-delivery", waitFor: "networkidle" },
  { path: "/pos/channels/takeaway", label: "pos-channels-takeaway", waitFor: "networkidle" },
  { path: "/users", label: "users", waitFor: "networkidle" },
  { path: "/branch", label: "branch", waitFor: "networkidle" },
  { path: "/stock", label: "stock", waitFor: "networkidle" },
  { path: "/stock/buying", label: "stock-buying", waitFor: "networkidle" },
];

function uniqueOffenders(offenders) {
  const seen = new Set();
  return offenders.filter((item) => {
    const key = `${item.tag}|${item.className}|${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getCsrfToken(api) {
  const response = await api.get("/api/csrf");
  if (!response.ok()) {
    throw new Error(`GET /api/csrf failed: ${response.status()} ${await response.text()}`);
  }
  const payload = await response.json().catch(() => ({}));
  return payload.csrfToken || payload?.data?.csrfToken;
}

async function loginAndGetState() {
  const api = await playwrightRequest.newContext({ baseURL: BASE_URL });
  const csrfToken = await getCsrfToken(api);
  const response = await api.post("/api/auth/login", {
    headers: { "X-CSRF-Token": csrfToken },
    data: { username: USERNAME, password: PASSWORD },
  });
  if (!response.ok()) {
    throw new Error(`POST /api/auth/login failed: ${response.status()} ${await response.text()}`);
  }
  const me = await api.get("/api/auth/me");
  if (!me.ok()) {
    throw new Error(`GET /api/auth/me failed after login: ${me.status()} ${await me.text()}`);
  }
  const storageState = await api.storageState();
  await api.dispose();
  return storageState;
}

async function waitForSettled(page, waitFor = "load") {
  await page.goto(`${BASE_URL}${page.url().startsWith("http") ? "" : ""}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForLoadState(waitFor, { timeout: 10000 });
  } catch {}
  await page.waitForTimeout(1200);
}

async function evaluateOverflow(page) {
  return page.evaluate(() => {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const doc = document.documentElement;
    const horizontalOverflow =
      Math.max(doc.scrollWidth, document.body?.scrollWidth || 0) - viewportWidth;

    const candidates = Array.from(document.querySelectorAll("body *"));
    const offenders = candidates
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || "1") > 0 &&
          rect.width > 0 &&
          rect.height > 0;
        if (!visible) return null;
        const overRight = rect.right - viewportWidth;
        const overLeft = rect.left;
        if (overRight <= 1 && overLeft >= -1) return null;
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString().slice(0, 120) || "",
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          width: Number(rect.width.toFixed(1)),
          position: style.position,
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    const fixedBottomElements = candidates
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (style.position !== "fixed" || rect.height <= 0 || rect.width <= 0) return null;
        const anchoredToBottom = viewportHeight - rect.bottom <= 2;
        if (!anchoredToBottom) return null;
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className?.toString().slice(0, 120) || "",
          top: Number(rect.top.toFixed(1)),
          bottom: Number(rect.bottom.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const activeIsMeaningful =
      active &&
      active.tagName !== "BODY" &&
      active.tagName !== "HTML";
    const activeRect = active?.getBoundingClientRect();
    const activeCoveredByFixedBottom =
      !!activeIsMeaningful &&
      !!activeRect &&
      fixedBottomElements.some((item) => activeRect.bottom > item.top && activeRect.top < item.bottom);

    return {
      viewportWidth,
      viewportHeight,
      docScrollWidth: doc.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth || 0,
      horizontalOverflow,
      offenders,
      fixedBottomElements,
      activeTag: activeIsMeaningful ? active?.tagName?.toLowerCase() || null : null,
      activeCoveredByFixedBottom,
    };
  });
}

async function runScenario(browser, deviceName, device, storageState, scenario) {
  const context = await browser.newContext({
    ...device,
    baseURL: BASE_URL,
    storageState,
  });
  const page = await context.newPage();
  const result = { device: deviceName, path: scenario.path, label: scenario.label };
  try {
    await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForLoadState(scenario.waitFor || "networkidle", { timeout: 10000 });
    } catch {}
    await page.waitForTimeout(1200);

    if (scenario.action) {
      await scenario.action(page);
    }

    const metrics = await evaluateOverflow(page);
    result.metrics = { ...metrics, offenders: uniqueOffenders(metrics.offenders || []) };
    result.url = page.url();
    if ((result.metrics.horizontalOverflow || 0) > 2) {
      result.failed = true;
      result.reason = `horizontal overflow ${result.metrics.horizontalOverflow}px`;
      result.screenshotPath = `playwright-report-smoke/${deviceName}-${scenario.label}.png`;
      await page.screenshot({ path: result.screenshotPath, fullPage: true });
    }
    if (result.metrics.activeCoveredByFixedBottom) {
      result.failed = true;
      result.reason = result.reason
        ? `${result.reason}; focused input covered by fixed bottom element`
        : "focused input covered by fixed bottom element";
      result.screenshotPath = result.screenshotPath || `playwright-report-smoke/${deviceName}-${scenario.label}.png`;
      await page.screenshot({ path: result.screenshotPath, fullPage: true });
    }
    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  const storageState = await loginAndGetState();
  const browser = await chromium.launch({ headless: true });
  const devicesToTest = {
    iphone13: devices["iPhone 13"],
    pixel7: devices["Pixel 7"],
  };

  const failures = [];
  const passes = [];

  for (const [deviceName, device] of Object.entries(devicesToTest)) {
    for (const scenario of PAGE_SCENARIOS) {
      const result = await runScenario(browser, deviceName, device, storageState, scenario);
      const prefix = `[${deviceName}] ${scenario.path}`;
      if (result.failed) {
        failures.push(result);
        console.log(`${prefix} FAIL: ${result.reason}`);
        console.log(JSON.stringify(result.metrics, null, 2));
      } else {
        passes.push(result);
        console.log(`${prefix} OK`);
      }
    }
  }

  await browser.close();

  console.log(`\nPassed: ${passes.length}`);
  console.log(`Failed: ${failures.length}`);
  if (failures.length) {
    process.exitCode = 1;
  }
}

await main();
