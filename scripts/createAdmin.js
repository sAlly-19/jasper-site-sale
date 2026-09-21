const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.resolve(__dirname, "../jasper-avatar-firebase-adminsdk-fbsvc-fa198bd099.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("ERRO: Chave do Firebase Admin SDK não encontrada em:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const app = initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);
const db = getFirestore(app);

const [,, emailArg, passArg] = process.argv;

async function run() {
  const email = (emailArg || "admin@jasperavatar.com").trim().toLowerCase();
  const password = passArg || "AdminJasper2026!";

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  // Também indexa pelo e-mail para verificação por e-mail direto
  await db.collection("admins").doc(email).set({
    uid: user.uid,
    role: "admin",
    createdAt: new Date().toISOString(),
  }, { merge: true });

  console.log(`✓ Whitelist do Firestore atualizada.`);
  console.log(`\n======================================================`);
  console.log(` CONTA DE ADMINISTRADOR PRONTA PARA USO! `);
  console.log(` E-mail: ${email}`);
  console.log(` Senha:  ${password}`);
  console.log(`======================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error("ERRO:", err.message || err);
  process.exit(1);
});

