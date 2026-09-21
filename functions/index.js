const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Token secreto compartilhado entre o Jasper Desktop e o backend
const APP_SECRET_TOKEN = process.env.JASPER_APP_SECRET || "JASPER_DESKTOP_SEC_2026_TOKEN";

/**
 * Cloud Function HTTPS: /validateLicense
 * 
 * Executa com privilégios do Firebase Admin SDK no servidor.
 * Protege a coleção /licenses do Firestore contra vazamentos ou consultas públicas,
 * permitindo que o Jasper Desktop (Electron/Native) valide a chave do cliente e restrinja
 * o uso exclusivamente a uma única máquina (Node-Locking).
 */
exports.validateLicense = onRequest(
  {
    cors: true,
    maxInstances: 10,
    region: "us-central1",
  },
  async (req, res) => {
    // Permite apenas método POST
    if (req.method !== "POST") {
      return res.status(405).json({
        valid: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Método não permitido. Utilize requisições POST.",
      });
    }

    // 1. Verificação de autenticidade da aplicação Desktop (Token de aplicação)
    const clientToken =
      req.headers["x-jasper-app-token"] ||
      (req.headers["authorization"] ? req.headers["authorization"].replace(/^Bearer\s+/i, "") : null);

    if (APP_SECRET_TOKEN && clientToken !== APP_SECRET_TOKEN) {
      return res.status(401).json({
        valid: false,
        error: "UNAUTHORIZED_CLIENT",
        message: "Token de aplicação inválido ou não fornecido no cabeçalho x-jasper-app-token.",
      });
    }

    const { licenseKey, machineId, machineName, clientVersion } = req.body || {};

    if (!licenseKey || typeof licenseKey !== "string") {
      return res.status(400).json({
        valid: false,
        error: "INVALID_LICENSE_KEY",
        message: "A chave de licença é obrigatória.",
      });
    }

    if (!machineId || typeof machineId !== "string") {
      return res.status(400).json({
        valid: false,
        error: "INVALID_MACHINE_ID",
        message: "Identificador de hardware (HWID) da máquina é obrigatório.",
      });
    }

    const cleanKey = licenseKey.trim().toUpperCase();
    const cleanHwid = machineId.trim();
    const now = new Date().toISOString();

    try {
      // 2. Consulta a licença no Firestore utilizando credenciais de Admin SDK
      const snapshot = await db.collection("licenses").where("key", "==", cleanKey).limit(1).get();

      if (snapshot.empty) {
        return res.status(404).json({
          valid: false,
          error: "LICENSE_NOT_FOUND",
          message: "Chave de licença inexistente ou incorreta.",
        });
      }

      const licenseDoc = snapshot.docs[0];
      const license = licenseDoc.data();

      // 3. Verificação do Status da Licença
      if (license.status === "disabled") {
        return res.status(403).json({
          valid: false,
          error: "LICENSE_DISABLED",
          message: "Esta licença foi temporariamente suspensa pelo administrador.",
        });
      }

      if (license.status === "revoked") {
        return res.status(403).json({
          valid: false,
          error: "LICENSE_REVOKED",
          message: "Esta licença foi permanentemente revogada.",
        });
      }

      // 4. Lógica de Restrição de Máquina Única (Node-Locking)

      // CASO A: Primeira Ativação -> Vincula a máquina atual
      if (!license.machineId) {
        const bindData = {
          machineId: cleanHwid,
          machineName: machineName || "Computador Pessoal",
          activatedAt: now,
          lastSeenAt: now,
          lastClientVersion: clientVersion || "1.0.0",
        };

        await licenseDoc.ref.update(bindData);

        return res.status(200).json({
          valid: true,
          status: "ACTIVATED",
          message: `Licença vinculada e ativada com sucesso nesta máquina (${bindData.machineName})!`,
          client: {
            name: license.name,
            email: license.email,
          },
          machineId: cleanHwid,
          activatedAt: now,
        });
      }

      // CASO B: Mesma Máquina -> Autoriza a execução e atualiza heartbeat
      if (license.machineId === cleanHwid) {
        await licenseDoc.ref.update({
          lastSeenAt: now,
          machineName: machineName || license.machineName,
          lastClientVersion: clientVersion || license.lastClientVersion || "1.0.0",
        });

        return res.status(200).json({
          valid: true,
          status: "ACTIVE",
          message: "Licença ativa e autorizada nesta máquina.",
          client: {
            name: license.name,
            email: license.email,
          },
          machineId: cleanHwid,
          lastSeenAt: now,
        });
      }

      // CASO C: Tentativa em OUTRO computador -> Bloqueio estrito
      return res.status(409).json({
        valid: false,
        error: "MACHINE_MISMATCH",
        message: `Esta licença é exclusiva e já está vinculada a outro computador ("${license.machineName || "Dispositivo Anterior"}"). Para transferir o acesso, solicite a liberação ao administrador.`,
      });
    } catch (err) {
      console.error("Erro na validação de licença:", err);
      return res.status(500).json({
        valid: false,
        error: "INTERNAL_ERROR",
        message: "Erro interno no servidor ao processar validação da licença.",
      });
    }
  }
);

