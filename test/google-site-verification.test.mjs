import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const filename = 'googled4641c7afd5fb1fc.html';

test('Google verification file is public and exported without changing its bytes', () => {
  const original = fs.readFileSync(path.join('public', filename));
  assert.equal(original.toString('utf8').trim(), 'google-site-verification: ' + filename);
  assert.deepEqual(fs.readFileSync(path.join('dist', filename)), original);
});

test('hosting preserves the exact .html verification URL and the extensionless policy route', () => {
  const { hosting } = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  assert.equal(hosting.cleanUrls, false, 'Do not redirect the Google verification filename');
  for (const [source, destination] of [['/privacidade', '/privacidade.html'], ['/_sitemap', '/_sitemap.html']]) {
    const index = hosting.rewrites.findIndex(rule => rule.source === source && rule.destination === destination);
    const fallback = hosting.rewrites.findIndex(rule => rule.source === '**');
    assert.ok(index >= 0 && index < fallback, source + ' must remain directly accessible');
  }
});
