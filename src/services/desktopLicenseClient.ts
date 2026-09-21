/**
 * Jasper Desktop - Cliente de Licenciamento com Restrição de Máquina Única (Node-Locking)
 * 
 * Este módulo serve de infraestrutura para o futuro "Jasper Desktop" (Electron / Node / Native)
 * validar a chave do cliente e garantir que ela seja vinculada exclusivamente a um único computador.
 */

import { validateAndBindLicense } from "./firestoreAdminService";

export interface HardwareInfo {
  machineId: string;   // Hash SHA-256 dos componentes fixos de hardware
  machineName: string; // Nome do host (ex: DESKTOP-ALISSON)
  platform: string;    // win32, darwin, linux
}

/**
 * No Jasper Desktop (Electron/Node), obtém a impressão digital (Fingerprint) do hardware.
 * Windows: UUID da placa mãe (Win32_ComputerSystemProduct) + CPU ID + Serial do disco principal.
 * macOS: IOPlatformSerialNumber.
 * Linux: /etc/machine-id.
 */
export function generateMachineFingerprint(): HardwareInfo {
  // Exemplo de identificação de hardware no ambiente Desktop
  if (typeof window !== "undefined" && (window as any).jasperDesktopBridge) {
    return (window as any).jasperDesktopBridge.getHardwareInfo();
  }

  // Fallback para navegador web (usando identificador persistido em localStorage seguro)
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
    machineName: typeof navigator !== "undefined" ? navigator.userAgent.split(" ")[0] || "PC-DEV" : "PC-DEV",
    platform: typeof navigator !== "undefined" ? navigator.platform : "win32",
  };
}

/**
 * Ativa ou valida a licença do Jasper Desktop na máquina atual.
 * 
 * Fluxo de execução:
 * 1. O usuário digita a chave (JASPER-LT-XXXX-XXXX).
 * 2. O Jasper Desktop gera o HWID da máquina.
 * 3. Envia para o Firebase:
 *    - Se for a primeira vez: Vincula permanentemente a chave a este HWID.
 *    - Se for a mesma máquina: Permite a execução normal do software.
 *    - Se for OUTRA máquina: Bloqueia a execução e avisa que a licença já está em uso em outro PC.
 */
export async function activateDesktopLicense(licenseKey: string) {
  const hw = generateMachineFingerprint();
  return await validateAndBindLicense(licenseKey, hw.machineId, hw.machineName);
}

