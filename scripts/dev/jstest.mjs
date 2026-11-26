import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const res = [];
async function run(label, setup, check) {
  const ctx = await b.newContext(); const page = await ctx.newPage();
  await setup(page); await page.goto('http://localhost:8765/download.html'); await page.waitForTimeout(1500);
  res.push(label + ': ' + await check(page)); await ctx.close();
}
const live = p => p.evaluate(() => ({ status: document.getElementById('release-status').textContent, n: document.querySelectorAll('#asset-list li').length, newer: !document.getElementById('newer-notice').hidden, first: document.querySelector('#asset-list h3').textContent, hash: document.querySelector('.hash').textContent.slice(0,12) }));
await run('live API', async()=>{}, async p => JSON.stringify(await live(p)));
await run('API blocked (offline)', async p => p.route('https://api.github.com/**', r => r.abort()), async p => JSON.stringify(await live(p)));
await run('API 403 rate-limit', async p => p.route('https://api.github.com/**', r => r.fulfill({status:403, body:'{}'})), async p => JSON.stringify(await live(p)));
await run('garbage JSON', async p => p.route('https://api.github.com/**', r => r.fulfill({status:200, contentType:'application/json', body:'{"x":1}'})), async p => JSON.stringify(await live(p)));
await run('malicious URLs ignored', async p => p.route('https://api.github.com/**', r => r.fulfill({status:200, contentType:'application/json', body: JSON.stringify([{tag_name:'v9', html_url:'https://github.com/TASK-Preparedness/TASK/releases/tag/v9', prerelease:true, published_at:'2027-01-01T00:00:00Z', assets:[{name:'evil.zip', size:1, browser_download_url:'https://evil.example/evil.zip'}]}])})), async p => JSON.stringify(await live(p)));
await run('newer release', async p => p.route('https://api.github.com/**', r => r.fulfill({status:200, contentType:'application/json', body: JSON.stringify([{tag_name:'v0.2.0', html_url:'https://github.com/TASK-Preparedness/TASK/releases/tag/v0.2.0', prerelease:false, published_at:'2027-02-01T00:00:00Z', assets:[{name:'TASK-0.2.0-source.zip', size:1234567, digest:'sha256:'+'a'.repeat(64), browser_download_url:'https://github.com/TASK-Preparedness/TASK/releases/download/v0.2.0/TASK-0.2.0-source.zip'}]}])})), async p => JSON.stringify(await live(p)));
console.log(res.join('\n')); await b.close();
