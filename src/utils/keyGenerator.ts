/**
 * Gerador e Validador de Chaves de Acesso (API Keys / Licenças) do Jasper Avatar.
 * Formato: JSPR-V1-XXXX-XXXX-XXXX
 * Derivado a partir de Nome, E-mail, WhatsApp e entropia com Checksum.
 */

// Simple robust checksum calculation (Hex 4-char)
function calculateChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, "0");
  return hex.slice(-4);
}

function getRandomHexChunk(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous 0, O, 1, I
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateLicenseKey(
  clientName: string,
  clientEmail: string,
  clientWhatsApp: string
): string {
  const sanitized = `${clientName.trim()}|${clientEmail.trim().toLowerCase()}|${clientWhatsApp.replace(/\D/g, "")}`;
  const chunk1 = getRandomHexChunk(4);
  const chunk2 = getRandomHexChunk(4);
  const checksum = calculateChecksum(`${sanitized}|${chunk1}|${chunk2}`);

  return `JSPR-V1-${chunk1}-${chunk2}-${checksum}`;
}

export function validateKeyFormat(key: string): boolean {
  const pattern = /^JSPR-V1-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key.trim().toUpperCase());
}

