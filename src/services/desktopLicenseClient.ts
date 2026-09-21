/**
 * Jasper Desktop - Cliente de Licenciamento com Restrição de Máquina Única (Node-Locking)
 * 
 * Este módulo executa dentro do aplicativo Desktop (Electron / Node / C++ / Native)
 * e valida a licença do cliente via HTTPS através da Cloud Function `/validateLicense`,
 * mantendo as coleções do Firestore 100% protegidas e inacessíveis ao público.
 */

export interface HardwareInfo {
  machineId: string;   // Hash SHA-256 dos componentes fixos de hardware
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

// URL do endpoint de validação (Cloud Function ou Servidor Local)
const VALIDATION_ENDPOINT =
  process.env.EXPO_PUBLIC_LICENSE_API_URL ||
  "https://us-central1-jasper-avatar.cloudfunctions.net/validateLicense";

// Token de aplicação compartilhado entre o Jasper Desktop e o backend
const APP_SECRET_TOKEN =
  process.env.EXPO_PUBLIC_JASPER_APP_TOKEN || "JASPER_DESKTOP_SEC_2026_TOKEN";

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
 * Envia requisição segura para a Cloud Function validar e vincular a chave à máquina.
 * Não requer login de administrador no cliente; utiliza token de aplicação seguro.
 */
export async function activateDesktopLicense(
  licenseKey: string,
  clientVersion = "1.0.0"
): Promise<LicenseValidationResult> {
  const hw = generateMachineFingerprint();

  try {
    const response = await fetch(VALIDATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-jasper-app-token": APP_SECRET_TOKEN,
      },
      body: JSON.stringify({
        licenseKey: licenseKey.trim().toUpperCase(),
        machineId: hw.machineId,
        machineName: hw.machineName,
        clientVersion,
      }),
    });

    const data: LicenseValidationResult = await response.json();
    return data;
  } catch (err: any) {
    return {
      valid: false,
      error: "NETWORK_ERROR",
      message:
        "Não foi possível comunicar com os servidores de validação de licença do Jasper. Verifique sua conexão com a internet.",
    };
  }
}
