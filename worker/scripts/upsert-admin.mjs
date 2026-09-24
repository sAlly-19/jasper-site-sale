import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [target, uid, email, confirmation] = process.argv.slice(2);
if (!['local', 'production'].includes(target) || !/^[A-Za-z0-9_-]{6,128}$/.test(uid || '')) {
  console.error('Uso: node scripts/upsert-admin.mjs <local|production> <firebase-uid> <email> [--confirm-production]');
  process.exit(1);
}
if (!/^[^\s'@]+@[^\s'@]+\.[^\s'@]+$/.test(email || '')) {
  console.error('E-mail inválido.');
  process.exit(1);
}
if (target === 'production' && confirmation !== '--confirm-production') {
  console.error('Produção exige o argumento --confirm-production. Nenhuma alteração foi feita.');
  process.exit(1);
}

const now = new Date().toISOString();
const sql = `INSERT INTO admins (uid, email, role, status, created_at, updated_at)
VALUES ('${uid}', '${email.toLowerCase()}', 'admin', 'active', '${now}', '${now}')
ON CONFLICT(uid) DO UPDATE SET email = excluded.email, status = 'active', updated_at = excluded.updated_at;`;
const location = target === 'production' ? '--remote' : '--local';
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'DB', '--env', target, location, '--command', sql], {
  cwd: new URL('..', import.meta.url),
  stdio: 'inherit',
});
if (result.error) {
  console.error('Falha ao iniciar o Wrangler:', result.error.message);
}
process.exit(result.status ?? 1);
