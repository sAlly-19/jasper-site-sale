/**
 * Jasper Desktop - Cliente de Licenciamento com Restrição de Máquina Única (Node-Locking)
 * 
 * Validação 100% nativa via Google Firestore Security Rules (Sem necessidade de Cloud Functions).
 * 
 * Regras de Proteção:
 * - Leitura: Permitida apenas por chave exata (O(1) por doc ID). Bloqueia varredura ou vazamento de chaves de terceiros.
 * - Escrita: O Firestore permite vincular o HWID na primeira ativação ou atualizar na mesma máquina.
 *   Se outro computador tentar utilizar a mesma chave, as regras do Firestore rejeitam com PERMISSION_DENIED.
 */

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export interface HardwareInfo {
  machineId: string;   // Hash SHA-256 dos componentes fixos de hardware (HWID)
  machineName: string; // Nome do host (ex: DESKTOP-ALISSON)
  platform: string;    // win32, darwin, linux
}

export interface LicenseValidationResult {
  valid: boolean;
  status?: "ACTIVATED" | "ACTIVE";
  error?: string;
  message: string;
  client?: {
    name: string;
    email: string;
  };
  machineId?: string;
  activatedAt?: string;
  lastSeenAt?: string;
}

/**
 * No Jasper Desktop (Electron/Node), obtém a impressão digital (Fingerprint) do hardware.
 * Windows: UUID da placa-mãe (Win32_ComputerSystemProduct) + CPU ID + Serial do disco principal.
 * macOS: IOPlatformSerialNumber.
 * Linux: /etc/machine-id.
 */
export function generateMachineFingerprint(): HardwareInfo {
  // Chamada IPC nativa se executando no Electron
  if (typeof window !== "undefined" && (window as any).jasperDesktopBridge) {
    return (window as any).jasperDesktopBridge.getHardwareInfo();
  }

  // Fallback para navegador web (identificador persistido em storage local)
  let simulatedHwid = "";
  if (typeof window !== "undefined") {
    simulatedHwid = window.localStorage.getItem("jasper_simulated_hwid") || "";
    if (!simulatedHwid) {
      simulatedHwid = `HWID-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      window.localStorage.setItem("jasper_simulated_hwid", simulatedHwid);
    }
  }

  return {
    machineId: simulatedHwid || "HWID-SIMULATED-DEV",
    machineName: typeof navigator !== "undefined" ? navigator.userAgent.split(" ")[0] || "PC-CLIENTE" : "PC-CLIENTE",
    platform: typeof navigator !== "undefined" ? navigator.platform : "win32",
  };
}

/**
 * Valida a chave de licença e aplica a restrição de máquina única diretamente no Firestore.
 * Não depende de Cloud Functions nem do plano Blaze.
 */
export async function activateDesktopLicense(
  licenseKey: string,
  clientVersion = "1.0.0"
): Promise<LicenseValidationResult> {
  const hw = generateMachineFingerprint();
  const cleanKey = licenseKey.trim().toUpperCase();
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, "licenses", cleanKey);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return {
        valid: false,
        error: "LICENSE_NOT_FOUND",
        message: "Chave de licença inexistente ou incorreta.",
      };
    }

    const license = snap.data() as {
      key: string;
      name: string;
      email: string;
      status: string;
      machineId?: string | null;
      machineName?: string | null;
      activatedAt?: string | null;
      lastSeenAt?: string | null;
      lastClientVersion?: string | null;
    };

    // 1. Verificação de Status da Licença
    if (license.status === "disabled") {
      return {
        valid: false,
        error: "LICENSE_DISABLED",
        message: "Esta licença foi temporariamente suspensa pelo administrador.",
      };
    }

    if (license.status === "revoked") {
      return {
        valid: false,
        error: "LICENSE_REVOKED",
        message: "Esta licença foi permanentemente revogada.",
      };
    }

    // 2. CASO A: Primeira Ativação (Node-Locking)
    if (!license.machineId) {
      await updateDoc(docRef, {
        machineId: hw.machineId,
        machineName: hw.machineName || "Computador Pessoal",
        activatedAt: now,
        lastSeenAt: now,
        lastClientVersion: clientVersion,
      });

      return {
        valid: true,
        status: "ACTIVATED",
        message: `Licença vinculada e ativada com sucesso nesta máquina (${hw.machineName})!`,
        client: {
          name: license.name,
          email: license.email,
        },
        machineId: hw.machineId,
        activatedAt: now,
      };
    }

    // 3. CASO B: Mesma Máquina -> Atualiza heartbeat
    if (license.machineId === hw.machineId) {
      await updateDoc(docRef, {
        lastSeenAt: now,
        machineName: hw.machineName || license.machineName,
        lastClientVersion: clientVersion || license.lastClientVersion || "1.0.0",
      });

      return {
        valid: true,
        status: "ACTIVE",
        message: "Licença ativa e autorizada nesta máquina.",
        client: {
          name: license.name,
          email: license.email,
        },
        machineId: hw.machineId,
        lastSeenAt: now,
      };
    }

    // 4. CASO C: Máquina Diferente -> Bloqueio estrito
    return {
      valid: false,
      error: "MACHINE_MISMATCH",
      message: `Esta licença é exclusiva e já está vinculada a outro computador ("${license.machineName || "Dispositivo Anterior"}"). Para transferir o acesso, solicite a liberação ao administrador.`,
    };
  } catch (err: any) {
    if (err?.code === "permission-denied") {
      return {
        valid: false,
        error: "PERMISSION_DENIED",
        message: "Acesso negado pelas regras de segurança da licença. Esta máquina não possui autorização para usar esta chave.",
      };
    }

    return {
      valid: false,
      error: "NETWORK_ERROR",
      message: "Não foi possível comunicar com o banco de dados do Jasper. Verifique sua conexão com a internet.",
    };
  }
}
