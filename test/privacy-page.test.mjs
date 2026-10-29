import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('privacy is a public static document with contact, data disclosures and a homepage link', () => {
  const filename = path.resolve('dist/privacidade.html');
  assert.ok(fs.existsSync(filename), 'Run build:web: /privacidade must export its own HTML');
  const html = fs.readFileSync(filename, 'utf8');
  for (const text of ['Alisson Maciel Ferreira Santos', 'alissontar18@gmail.com', 'Gmail', 'Mercado Pago', 'Cloudflare', 'Analytics', 'localStorage']) assert.ok(html.includes(text), 'Missing disclosure: ' + text);
  assert.match(html, /mailto:alissontar18@gmail\.com/);
  assert.match(html, /id="privacidade-titulo"/);
  assert.match(html, /href="#google"/);
  assert.doesNotMatch(html, /RASCUNHO PARA REVISÃO|Notas editoriais|\[PENDENTE\]/);
  const homepage = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');
  assert.match(homepage, /href="\/privacidade"/, 'Privacy must be accessible from the homepage');
});

test('Firebase resolves the extensionless privacy URL as static HTML', () => {
  const config = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  assert.equal(config.hosting.cleanUrls, true, '/privacidade must serve privacidade.html before the SPA fallback');
});