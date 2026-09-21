export type LicenseStatus = "active" | "revoked" | "suspended";

export interface ClientLicense {
  id: string;
  licenseKey: string;
  clientName: string;
  clientEmail: string;
  clientWhatsApp: string;
  status: LicenseStatus;
  tier: "lifetime";
  createdAt: number; // Unix timestamp ms
  lastValidatedAt?: number;
  revokedAt?: number;
  notes?: string;
}

export interface GenerateLicenseInput {
  clientName: string;
  clientEmail: string;
  clientWhatsApp: string;
  notes?: string;
}

