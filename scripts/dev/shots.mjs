import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const out = '/workspace/task-website-previews/';
const sizes = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844 } };
const pages = ['index', 'download', 'build', 'docs', 'about', 'support'];
const errors = [];
for (const [name, vp] of Object.entries(sizes)) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === 'mobile' ? 2 : 1, isMobile: name === 'mobile' });
  for (const p of pages) {
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${p}/${name}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${p}/${name} console: ${m.text()}`); });
    await page.goto(`http://localhost:8765/${p}.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) errors.push(`${p}/${name}: horizontal overflow ${overflow}px`);
    await page.screenshot({ path: `${out}${p}-${name}-fold.png` });
    await page.screenshot({ path: `${out}${p}-${name}-full.png`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join('\n') : 'no console errors / overflow');
