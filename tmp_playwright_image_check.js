const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const rawTarget = fs.readFileSync('e:/Project/tmp_ui_test_target.json', 'utf8').replace(/^\uFEFF/, '');
  const target = JSON.parse(rawTarget);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:8001/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('ชื่อผู้ใช้').fill('admin');
  await page.getByPlaceholder('รหัสผ่าน').fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  console.log('AFTER_LOGIN_URL', page.url());
  await page.goto('http://localhost:8001/stock/ingredients', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  console.log('AFTER_GOTO_STOCK_URL', page.url());
  await page.screenshot({ path: 'e:/Project/tmp_stock_ingredients_after_goto.png', fullPage: true });

  const search = page.getByPlaceholder(/ค้นหา/).first();
  await search.fill(target.displayName);
  await page.waitForTimeout(1200);

  const cardText = page.locator('text=' + target.displayName).first();
  await cardText.waitFor({ state: 'visible', timeout: 15000 });

  const img = page.locator(`img[alt="${target.displayName}"]`).first();
  await img.waitFor({ state: 'attached', timeout: 10000 });

  const result = await img.evaluate((el) => ({
    src: el.getAttribute('src') || '',
    complete: el.complete,
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
  }));

  await page.screenshot({ path: 'e:/Project/tmp_stock_ingredients_image_test.png', fullPage: true });
  console.log(JSON.stringify({ target, result }, null, 2));

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
