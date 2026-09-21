const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBkvZHEAr0Vn32I6Qcr4TW958L5nhHSx_0",
  authDomain: "jasper-avatar.firebaseapp.com",
  projectId: "jasper-avatar",
  storageBucket: "jasper-avatar.firebasestorage.app",
  messagingSenderId: "333089226227",
  appId: "1:333089226227:web:c7928a46813b8af0d56686",
  measurementId: "G-S3C5XC47NC"
};

async function testConnection() {
  console.log("Conectando ao Firebase do projeto:", firebaseConfig.projectId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    const snap = await getDocs(collection(db, "licenses"));
    console.log("Sucesso ao conectar no Firestore! Documentos encontrados em 'licenses':", snap.size);
    process.exit(0);
  } catch (err) {
    console.error("Resultado ao consultar Firestore:", err.message || err.code || err);
    process.exit(1);
  }
}

testConnection();

