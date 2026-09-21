const http = require("http");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.resolve(__dirname, "../jasper-avatar-firebase-adminsdk-fbsvc-fa198bd099.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("ERRO: Credencial de serviço do Firebase Admin não encontrada em:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const APP_SECRET_TOKEN = process.env.JASPER_APP_SECRET || "JASPER_DESKTOP_SEC_2026_TOKEN";
const PORT = process.env.LICENSE_SERVER_PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-jasper-app-token, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/validateLicense" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      // 1. Verifica token da aplicação
      const clientToken =
        req.headers["x-jasper-app-token"] ||
        (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : null);

      if (APP_SECRET_TOKEN && clientToken !== APP_SECRET_TOKEN) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            valid: false,
            error: "UNAUTHORIZED_CLIENT",
            message: "Token de aplicação inválido ou não fornecido no cabeçalho x-jasper-app-token.",
          })
        );
      }

      let payload = {};
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ valid: false, error: "INVALID_JSON", message: "JSON malformado." }));
      }

      const { licenseKey, machineId, machineName, clientVersion } = payload;

      if (!licenseKey || !machineId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            valid: false,
            error: "MISSING_FIELDS",
            message: "licenseKey e machineId são obrigatórios.",
          })
        );
      }

      const cleanKey = String(licenseKey).trim().toUpperCase();
      const cleanHwid = String(machineId).trim();
      const now = new Date().toISOString();

      try {
        const snapshot = await db.collection("licenses").where("key", "==", cleanKey).limit(1).get();

        if (snapshot.empty) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: false,
              error: "LICENSE_NOT_FOUND",
              message: "Chave de licença inexistente ou incorreta.",
            })
          );
        }

        const licenseDoc = snapshot.docs[0];
        const license = licenseDoc.data();

        if (license.status === "disabled") {
          res.writeHead(403, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: false,
              error: "LICENSE_DISABLED",
              message: "Esta licença foi temporariamente desativada pelo administrador.",
            })
          );
        }

        if (license.status === "revoked") {
          res.writeHead(403, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: false,
              error: "LICENSE_REVOKED",
              message: "Esta licença foi permanentemente revogada.",
            })
          );
        }

        // Primeira Ativação (Node-Locking)
        if (!license.machineId) {
          const bindData = {
            machineId: cleanHwid,
            machineName: machineName || "Computador do Cliente",
            activatedAt: now,
            lastSeenAt: now,
            lastClientVersion: clientVersion || "1.0.0",
          };
          await licenseDoc.ref.update(bindData);

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: true,
              status: "ACTIVATED",
              message: `Licença ativada com sucesso nesta máquina (${bindData.machineName})!`,
              client: { name: license.name, email: license.email },
              machineId: cleanHwid,
              activatedAt: now,
            })
          );
        }

        // Mesma Máquina
        if (license.machineId === cleanHwid) {
          await licenseDoc.ref.update({
            lastSeenAt: now,
            machineName: machineName || license.machineName,
            lastClientVersion: clientVersion || license.lastClientVersion || "1.0.0",
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              valid: true,
              status: "ACTIVE",
              message: "Licença ativa e autorizada nesta máquina.",
              client: { name: license.name, email: license.email },
              machineId: cleanHwid,
              lastSeenAt: now,
            })
          );
        }

        // Outra Máquina (Conflito)
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            valid: false,
            error: "MACHINE_MISMATCH",
            message: `Esta licença é exclusiva e já está vinculada a outro computador ("${license.machineName || "Dispositivo Anterior"}"). Para transferir o acesso, solicite a liberação ao administrador.`,
          })
        );
      } catch (err) {
        console.error("Erro ao validar licença:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ valid: false, error: "INTERNAL_ERROR", message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "NOT_FOUND", message: "Endpoint não encontrado." }));
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(` SERVIDOR DE VALIDAÇÃO DE LICENÇAS ATIVO (JASPER DESKTOP)   `);
  console.log(`=============================================================`);
  console.log(`Endpoint: http://localhost:${PORT}/validateLicense`);
  console.log(`Método:   POST`);
  console.log(`Token:    x-jasper-app-token: ${APP_SECRET_TOKEN}`);
  console.log(`=============================================================\n`);
});

