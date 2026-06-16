const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'http://localhost:5175/';

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log(`NETWORK ${res.status()}: ${res.url()}`);
    }
  });

  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Try to grant consent if the screen is shown
  try {
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await checkbox.check();
    const agreeButton = page.locator('button', { hasText: /Đồng ý và tiếp tục/ }).first();
    await agreeButton.waitFor({ state: 'visible', timeout: 5000 });
    await agreeButton.click();
    await page.waitForTimeout(8000);
    console.log('Auto-granted consent');
  } catch (e) {
    console.log('No consent screen detected, waiting for main UI...');
    await page.waitForTimeout(7000);
  }

  const results = [];

  const bodyText = await page.locator('body').innerText().catch(() => '');
  results.push({ check: 'Body contains app', pass: bodyText.includes('Mushy Connect') || bodyText.includes('Chào mừng bạn') || bodyText.includes('Connect Radar') });

  results.push({ check: 'Brand name visible', pass: await page.locator('.brand-name').isVisible().catch(() => false) });
  results.push({ check: 'ScopeSwitcher visible', pass: await page.locator('button[aria-haspopup="listbox"]').first().isVisible().catch(() => false) });

  const tabs = ['Radar', 'Lời Mời', 'Kết Nối', 'Hồ Sơ'];
  for (const tab of tabs) {
    results.push({ check: `Tab "${tab}" visible`, pass: await page.locator('.nav-tab-btn').filter({ hasText: tab }).isVisible().catch(() => false) });
  }

  const html = await page.content().catch(() => '');
  console.log('\n=== Page HTML preview (first 500 chars) ===');
  console.log(html.slice(0, 500));

  console.log('\n=== Smoke Test Results ===');
  let passed = 0;
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.check}`);
    if (r.pass) passed++;
  }
  console.log(`\n${passed}/${results.length} checks passed`);

  if (passed < results.length) {
    console.log('\nPage body preview (first 300 chars):');
    console.log(bodyText.slice(0, 300));
  }

  await context.close();
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
