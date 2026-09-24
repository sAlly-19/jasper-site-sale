const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : "";

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error("ERRO: defina FIREBASE_SERVICE_ACCOUNT_PATH com o caminho da conta de serviço.");
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

const [,, emailArg, passArg] = process.argv;

async function run() {
  if (!emailArg || !passArg || passArg.length < 12) {
    console.error("Uso: npm run create-admin -- <email> <senha-com-12-ou-mais-caracteres>");
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();
  const password = passArg;

  console.log(`\n======================================================`);
  console.log(` CONFIGURANDO ADMINISTRADOR OFICIAL NO FIREBASE AUTH `);
  console.log(`======================================================`);
  console.log(`E-mail:   ${email}`);
  console.log(`Projeto:  ${serviceAccount.project_id}`);

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`\n→ Usuário já existe no Firebase Auth (UID: ${user.uid}).`);
    if (passArg) {
      await auth.updateUser(user.uid, { password: passArg });
      console.log(`→ Senha atualizada com sucesso.`);
    }
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`\n→ Criando novo usuário no Firebase Auth...`);
      user = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: "Master Admin",
      });
      console.log(`✓ Usuário criado com sucesso! (UID: ${user.uid})`);
    } else {
      throw err;
    }
  }

  // 1. Atribui custom claims { admin: true } no token JWT
  console.log(`→ Atribuindo privilégio 'admin: true' no token JWT...`);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✓ Custom claim 'admin: true' aplicada.`);

  // 2. Registra na coleção 'admins' do Firestore (whitelist)
  console.log(`→ Registrando na coleção 'admins' do Firestore...`);
  await db.collection("admins").doc(user.uid).set({
    email,
    role: "admin",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log(`✓ Whitelist do Firestore atualizada.`);
  console.log(`\n======================================================`);
  console.log(` CONTA DE ADMINISTRADOR PRONTA PARA USO! `);
  console.log(` E-mail: ${email}`);
  console.log(` UID:    ${user.uid}`);
  console.log(` Cadastre este mesmo UID na tabela admins do D1 antes de usar o painel.`);
  console.log(`======================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error("ERRO:", err.message || err);
  process.exit(1);
});

