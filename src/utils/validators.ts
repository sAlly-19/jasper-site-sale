export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidWhatsApp(phone: string): boolean {
  // Remove non-digit chars: minimum 10 digits (e.g. +55 11 99999-9999 -> 11 digits, international >= 10)
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 16;
}

export function formatWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    // Standard Brazilian format: (11) 99999-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

