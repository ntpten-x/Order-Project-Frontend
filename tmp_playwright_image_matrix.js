const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:8001';
const SMALL_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+f3cAAAAASUVORK5CYII=';

function textSafe(value) {
  return String(value ?? '').trim();
}

function orderCodeFromId(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

async function ensureImageLoaded(page, alt, label, timeout = 20000) {
  const img = page.locator(`img[alt="${alt}"]`).first();
  await img.waitFor({ state: 'visible', timeout });

  // Wait for the browser decode cycle to complete.
  await page.waitForTimeout(200);

  const metrics = await img.evaluate((el) => ({
    src: el.getAttribute('src') || '',
    complete: el.complete,
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
  }));

  if (!metrics.complete || metrics.naturalWidth <= 0) {
    throw new Error(`${label}: image not loaded (complete=${metrics.complete}, naturalWidth=${metrics.naturalWidth})`);
  }

  return metrics;
}

(async () => {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('ชื่อผู้ใช้').fill('admin');
  await page.getByPlaceholder('รหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const api = context.request;

  // CSRF
  const csrfResp = await api.get(`${BASE}/api/csrf`);
  if (!csrfResp.ok()) throw new Error(`CSRF failed: ${csrfResp.status()}`);
  const csrfJson = await csrfResp.json();
  const csrf = csrfJson.csrfToken;
  if (!csrf) throw new Error('No csrf token');

  // Current user
  const meResp = await api.get(`${BASE}/api/auth/me`);
  if (!meResp.ok()) throw new Error(`auth/me failed: ${meResp.status()}`);
  const me = await meResp.json();

  // Ensure open shift for /pos/channels/delivery
  const currentShiftResp = await api.get(`${BASE}/api/pos/shifts/current`);
  if (!currentShiftResp.ok()) throw new Error(`shift/current failed: ${currentShiftResp.status()}`);
  const currentShift = await currentShiftResp.json();
  if (!currentShift) {
    const openShiftResp = await api.post(`${BASE}/api/pos/shifts/open`, {
      headers: { 'x-csrf-token': csrf, 'content-type': 'application/json' },
      data: { start_amount: 0 },
    });
    if (!openShiftResp.ok()) {
      const body = await openShiftResp.text();
      throw new Error(`shift/open failed: ${openShiftResp.status()} ${body}`);
    }
  }

  // Ingredient target (prefer existing large data target)
  let ingredientTarget = null;
  try {
    const raw = fs.readFileSync('e:/Project/tmp_ui_test_target.json', 'utf8').replace(/^\uFEFF/, '');
    ingredientTarget = JSON.parse(raw);
  } catch {
    ingredientTarget = null;
  }

  if (!ingredientTarget?.id || !ingredientTarget?.displayName) {
    const unitsResp = await api.get(`${BASE}/api/stock/ingredientsUnit/getAll?active=true`);
    if (!unitsResp.ok()) throw new Error(`ingredientsUnit/getAll failed: ${unitsResp.status()}`);
    const units = await unitsResp.json();
    if (!Array.isArray(units) || units.length === 0) throw new Error('No active ingredient unit');

    const suffix = Math.floor(Math.random() * 900000) + 100000;
    const payload = {
      ingredient_name: `img_matrix_${suffix}`,
      display_name: `IMG MATRIX ${suffix}`,
      description: 'playwright image matrix',
      img_url: SMALL_DATA_URL,
      unit_id: units[0].id,
      is_active: true,
    };

    const createIngredientResp = await api.post(`${BASE}/api/stock/ingredients/create`, {
      headers: { 'x-csrf-token': csrf, 'content-type': 'application/json' },
      data: payload,
    });
    if (!createIngredientResp.ok()) {
      const body = await createIngredientResp.text();
      throw new Error(`ingredients/create failed: ${createIngredientResp.status()} ${body}`);
    }
    const createdIngredient = await createIngredientResp.json();
    ingredientTarget = {
      id: createdIngredient.id,
      displayName: payload.display_name,
      ingredientName: payload.ingredient_name,
    };
    fs.writeFileSync('e:/Project/tmp_ui_test_target.json', JSON.stringify(ingredientTarget, null, 2));
  }

  // Create order for buying/detail/edit modal verification
  const createOrderResp = await api.post(`${BASE}/api/stock/orders`, {
    headers: { 'x-csrf-token': csrf, 'content-type': 'application/json' },
    data: {
      ordered_by_id: me.id,
      items: [{ ingredient_id: ingredientTarget.id, quantity_ordered: 2 }],
      remark: 'playwright image matrix order',
    },
  });
  if (!createOrderResp.ok()) {
    const body = await createOrderResp.text();
    throw new Error(`orders create failed: ${createOrderResp.status()} ${body}`);
  }
  const createdOrder = await createOrderResp.json();
  const createdOrderCode = orderCodeFromId(createdOrder.id);

  // Create delivery provider with data URL logo
  const deliverySuffix = Math.floor(Math.random() * 900000) + 100000;
  const deliveryName = `IMG DELIVERY ${deliverySuffix}`;
  const createDeliveryResp = await api.post(`${BASE}/api/pos/delivery/create`, {
    headers: { 'x-csrf-token': csrf, 'content-type': 'application/json' },
    data: {
      delivery_name: deliveryName,
      delivery_prefix: `ID${String(deliverySuffix).slice(-3)}`,
      logo: SMALL_DATA_URL,
      is_active: true,
    },
  });
  if (!createDeliveryResp.ok()) {
    const body = await createDeliveryResp.text();
    throw new Error(`delivery create failed: ${createDeliveryResp.status()} ${body}`);
  }
  const createdDelivery = await createDeliveryResp.json();

  // 1) /stock/ingredients
  await page.goto(`${BASE}/stock/ingredients`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('ค้นหาจากชื่อแสดง ชื่อระบบ หรือคำอธิบาย').fill(ingredientTarget.displayName);
  await page.waitForTimeout(800);
  results.push({
    page: '/stock/ingredients',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, '/stock/ingredients'),
  });

  // 2) /stock
  await page.goto(`${BASE}/stock`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('ค้นหาวัตถุดิบ...').fill(ingredientTarget.displayName);
  await page.waitForTimeout(800);
  results.push({
    page: '/stock',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, '/stock'),
  });

  // 3) /stock/ingredients/manage/edit/:id
  await page.goto(`${BASE}/stock/ingredients/manage/edit/${ingredientTarget.id}`, { waitUntil: 'networkidle' });
  results.push({
    page: '/stock/ingredients/manage/edit/[id]',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, '/stock/ingredients/manage/edit/[id]'),
  });

  // 4) /stock/buying?orderId=:id
  await page.goto(`${BASE}/stock/buying?orderId=${createdOrder.id}`, { waitUntil: 'networkidle' });
  results.push({
    page: '/stock/buying',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, '/stock/buying'),
  });

  // 5,6) OrderDetailModal + EditOrderModal via /stock/items
  await page.goto(`${BASE}/stock/items`, { waitUntil: 'networkidle' });
  const orderRow = page.locator('tr', { hasText: createdOrderCode }).first();
  await orderRow.waitFor({ state: 'visible', timeout: 20000 });

  await orderRow.getByRole('button', { name: 'ดู' }).click();
  const detailModal = page.locator('.ant-modal').filter({ hasText: 'รายละเอียดใบซื้อ' }).first();
  await detailModal.waitFor({ state: 'visible', timeout: 15000 });
  results.push({
    page: 'OrderDetailModal',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, 'OrderDetailModal'),
  });
  await detailModal.getByRole('button', { name: 'ปิด' }).click();
  await page.waitForTimeout(400);

  const rowForEdit = page.locator('tr', { hasText: createdOrderCode }).first();
  await rowForEdit.getByRole('button', { name: 'แก้ไข' }).click();
  const editModal = page.locator('.ant-modal').filter({ hasText: 'แก้ไขใบซื้อ' }).first();
  await editModal.waitFor({ state: 'visible', timeout: 15000 });
  results.push({
    page: 'EditOrderModal',
    metrics: await ensureImageLoaded(page, ingredientTarget.displayName, 'EditOrderModal'),
  });
  await editModal.getByRole('button', { name: 'ยกเลิก' }).click();
  await page.waitForTimeout(400);

  // 7) /pos/delivery
  await page.goto(`${BASE}/pos/delivery`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('ค้นหาจากชื่อช่องทาง หรือ prefix...').fill(deliveryName);
  await page.waitForTimeout(800);
  results.push({
    page: '/pos/delivery',
    metrics: await ensureImageLoaded(page, deliveryName, '/pos/delivery'),
  });

  // 8) /pos/delivery/manager/edit/:id
  await page.goto(`${BASE}/pos/delivery/manager/edit/${createdDelivery.id}`, { waitUntil: 'networkidle' });
  results.push({
    page: '/pos/delivery/manager/edit/[id]',
    metrics: await ensureImageLoaded(page, deliveryName, '/pos/delivery/manager/edit/[id]'),
  });

  // 9) /pos/channels/delivery
  await page.goto(`${BASE}/pos/channels/delivery`, { waitUntil: 'networkidle' });
  console.log('CHANNELS_URL', page.url());
  await page.screenshot({ path: 'e:/Project/tmp_channels_delivery_before_modal.png', fullPage: true });
  // Open create-order modal to show provider list with avatars.
  await page.getByRole('button', { name: 'เพิ่มออเดอร์' }).click();
  await page.locator('.delivery-modal').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.screenshot({ path: 'e:/Project/tmp_channels_delivery_create_modal.png', fullPage: true });
  // Open provider selector modal (click clickable selector box in create modal)
  const providerPicker = page.locator('.delivery-modal div[style*=\"cursor: pointer\"]').first();
  await providerPicker.click();
  await page.waitForTimeout(600);
  console.log('PROVIDER_NAME_COUNT', await page.getByText(deliveryName).count());
  await page.screenshot({ path: 'e:/Project/tmp_channels_delivery_provider_modal.png', fullPage: true });
  results.push({
    page: '/pos/channels/delivery',
    metrics: await ensureImageLoaded(page, deliveryName, '/pos/channels/delivery'),
  });

  const output = {
    ingredientTarget,
    createdOrder: { id: createdOrder.id, code: createdOrderCode },
    createdDelivery: { id: createdDelivery.id, name: deliveryName },
    results,
  };

  fs.writeFileSync('e:/Project/tmp_playwright_image_matrix_result.json', JSON.stringify(output, null, 2));
  await page.screenshot({ path: 'e:/Project/tmp_playwright_image_matrix_last.png', fullPage: true });

  console.log(JSON.stringify(output, null, 2));
  await browser.close();
})().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
