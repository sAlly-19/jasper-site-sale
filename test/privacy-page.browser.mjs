import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright-core';

const root = path.resolve('dist');
const output = process.env.JASPER_PRIVACY_QA_OUTPUT || path.join(os.tmpdir(), 'jasper-privacy-qa');
await fs.mkdir(output, { recursive: true });
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname === '/privacidade' ? '/privacidade.html' : pathname));
    if (!filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const bytes = await fs.readFile(filename);
    response.setHeader('Content-Type', filename.endsWith('.css') ? 'text/css' : filename.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8');
    response.end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  const origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, javaScriptEnabled: false, serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const response = await page.goto(origin + '/privacidade', { waitUntil: 'load' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').innerText(), 'Política de Privacidade');
    assert.equal(await page.locator('a[href="mailto:alissontar18@gmail.com"]').count(), 1);
    assert.ok(await page.locator('#google').innerText().then(text => text.includes('Gmail')));
    const width = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    assert.ok(width.document <= width.viewport + 1, JSON.stringify(width));
    await page.screenshot({ path: path.join(output, 'privacy-' + viewport.width + '.png') });
    await page.locator('a[href="#navegador"]').click();
    assert.ok(page.url().endsWith('#navegador'));
    await page.goto(origin + '/', { waitUntil: 'load' });
    assert.equal(await page.locator('footer a[href="/privacidade"]').count(), 1);
    await context.close();
    console.log('PASS privacy public HTML/no-JS/anchors/footer/width=' + viewport.width);
  }
  console.log('Screenshots: ' + output);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
