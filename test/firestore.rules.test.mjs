import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-jasper-audit',
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

after(async () => {
  await environment.cleanup();
});

test('o conteúdo público limita-se à landing_page', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'site_config', 'landing_page')));
  await assertFails(getDoc(doc(db, 'site_config', 'private_settings')));
});

test('clientes nunca acessam licenças, promoções legadas ou lista de admins', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'licenses', 'JASPER-SECRET')));
  await assertFails(getDocs(collection(db, 'licenses')));
  await assertFails(getDoc(doc(db, 'promotions', 'promo')));
  await assertFails(getDocs(collection(db, 'admins')));
});

test('somente admin autenticado altera o CMS', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'admins', 'admin-1'), { active: true });
    await setDoc(doc(context.firestore(), 'admins', 'claimless-admin'), { active: true });
  });
  const regular = environment.authenticatedContext('user-1', { email: 'user@example.com' }).firestore();
  const admin = environment.authenticatedContext('admin-1', { admin: true }).firestore();
  const staleClaim = environment.authenticatedContext('removed-admin', { admin: true }).firestore();
  const noClaim = environment.authenticatedContext('claimless-admin').firestore();
  await assertFails(setDoc(doc(regular, 'site_config', 'landing_page'), { title: 'negado' }));
  await assertFails(setDoc(doc(staleClaim, 'site_config', 'landing_page'), { title: 'negado' }));
  await assertFails(setDoc(doc(noClaim, 'site_config', 'landing_page'), { title: 'negado' }));
  await assertSucceeds(setDoc(doc(admin, 'site_config', 'landing_page'), { title: 'permitido' }));
  assert.ok(true);
});
