import { chromium } from 'playwright-core';
import os from 'node:os';
import path from 'node:path';

const baseUrl = process.env.JASPER_QA_URL || 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const locales = [
  { name: 'pt-BR', pricePattern: 'R\\$\\s*497' },
  { name: 'en', pricePattern: '\\$\\s*149' },
  { name: 'es', pricePattern: '129\\s*€' },
];

for (const viewport of viewports) {
  for (const locale of locales) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript((selectedLocale) => {
    window.localStorage.setItem('jasper_locale', selectedLocale);
  }, locale.name);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(4_000);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.floor(viewport.height * 0.75)) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  const diagnostics = await page.evaluate((pricePattern) => {
    const bodyText = document.body.textContent || '';
    const pricingText = document.querySelector('#pricing')?.textContent || '';
    const codeExecutionMatch = bodyText.match(/executa código|runs code|code execution|ejecuta código|ejecución de código/i);
    const codeExecutionContext = codeExecutionMatch?.index === undefined
      ? null
      : bodyText.slice(Math.max(0, codeExecutionMatch.index - 100), codeExecutionMatch.index + codeExecutionMatch[0].length + 100);
    const images = Array.from(document.images).map((image) => ({
      alt: image.alt,
      src: image.currentSrc || image.src,
      loaded: image.complete && image.naturalWidth > 0,
    }));
    return {
      title: document.title,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      emptyRevealSections: Array.from(document.querySelectorAll('.reveal')).filter((element) => getComputedStyle(element).opacity === '0').length,
      images,
      advertisesCodeInterpreter: bodyText.includes('Code Interpreter'),
      advertisesCodeExecution: Boolean(codeExecutionMatch),
      codeExecutionMatch: codeExecutionMatch?.[0] || null,
      codeExecutionContext,
      expectedPriceFound: new RegExp(pricePattern).test(pricingText),
    };
  }, locale.pricePattern);
  const screenshot = path.join(os.tmpdir(), `jasper-site-${viewport.name}-${locale.name}-qa.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  results.push({ viewport: viewport.name, locale: locale.name, screenshot, pageErrors, ...diagnostics });
  await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

const failed = results.some((result) =>
  result.pageErrors.length > 0 ||
  result.horizontalOverflow ||
  result.emptyRevealSections > 0 ||
  !result.expectedPriceFound ||
  result.advertisesCodeInterpreter ||
  result.advertisesCodeExecution ||
  !result.title ||
  result.images.some((image) => !image.loaded)
);
if (failed) process.exit(1);
