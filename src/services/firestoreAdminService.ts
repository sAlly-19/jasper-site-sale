import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  defaultContent,
  defaultFaq,
  defaultMedia,
  defaultPrices,
  defaultSections,
  LandingData,
  Promo,
} from "@/lib/content";
import { generateLicenseKey } from "@/utils/keyGenerator";

export type LicenseStatus = "active" | "disabled" | "revoked";

export interface KeyRow {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  key: string;
  status: LicenseStatus;
  notes?: string;
  createdAt: string;
  invalidatedAt?: string | null;
  // Node-Locking / Vinculação Exclusiva de Máquina
  machineId?: string | null;      // Hardware ID (HWID) da máquina do cliente
  machineName?: string | null;    // Nome amigável do PC (ex: DESKTOP-ALISSON)
  activatedAt?: string | null;    // Data e hora da primeira ativação na máquina
  lastSeenAt?: string | null;     // Último check-in / validação da máquina
}

export interface PromoRow {
  id: string;
  code: string;
  title: Record<string, string>;
  discountPercent: number;
  active: boolean;
  endsAt: string | null;
  createdAt: string;
}

// Fallbacks locais em memória caso o Firestore esteja em modo offline/demonstração
let localKeys: KeyRow[] = [
  {
    id: "key_dev_master",
    name: "Alisson Santos",
    email: "alisson@example.com",
    whatsapp: "+55 11 99999 8888",
    key: "JASPER-LT-7A4F-88E1-99B2",
    status: "active",
    notes: "Licença Master Developer",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    invalidatedAt: null,
    machineId: "HWID-8F92-A7C1-44B0",
    machineName: "DESKTOP-MASTER",
    activatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: "key-2",
    name: "Carolina Mendes",
    email: "carolina.m@techcorp.io",
    whatsapp: "+55 21 98888 7777",
    key: "JASPER-LT-2D9E-11C4-44A1",
    status: "active",
    notes: "Cliente VIP Enterprise",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    invalidatedAt: null,
    machineId: null,
    machineName: null,
    activatedAt: null,
    lastSeenAt: null,
  },
];

let localPromos: PromoRow[] = [
  {
    id: "promo-1",
    code: "LIFETIME50",
    discountPercent: 50,
    active: true,
    endsAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    title: {
      "pt-BR": "🔥 Oferta de Lançamento: 50% de desconto vitalício",
      en: "🔥 Launch Offer: 50% lifetime discount",
      es: "🔥 Oferta de Lanzamiento: 50% de descuento de por vida",
    },
    createdAt: new Date().toISOString(),
  },
];

let cachedLandingData: LandingData = {
  content: defaultContent,
  sections: defaultSections,
  media: defaultMedia,
  prices: defaultPrices,
  faq: defaultFaq,
  promo: {
    id: "promo-1",
    code: "LIFETIME50",
    title: {
      "pt-BR": "🔥 Oferta de Lançamento: 50% de desconto vitalício",
      en: "🔥 Launch Offer: 50% lifetime discount",
      es: "🔥 Oferta de Lanzamiento: 50% de descuento de por vida",
    },
    discountPercent: 50,
    endsAt: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
};

/* ------------------------------------------------------------------ */
/*  Landing Page Data (CMS + Active Promo)                             */
/* ------------------------------------------------------------------ */

export async function fetchLandingData(): Promise<LandingData> {
  try {
    const configSnap = await getDoc(doc(db, "site_config", "landing_page"));
    if (configSnap.exists()) {
      const d = configSnap.data() as Partial<LandingData>;
      cachedLandingData = {
        ...cachedLandingData,
        ...d,
      };
    }
  } catch (err) {
    console.warn("Usando fallback de LandingData:", err);
  }

  // Busca promo ativa mais recente
  try {
    const promoQ = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
    const promoSnap = await getDocs(promoQ);
    let foundActive: Promo | null = null;
    promoSnap.forEach((docSnap) => {
      const p = docSnap.data() as PromoRow;
      if (p.active && (!p.endsAt || new Date(p.endsAt).getTime() > Date.now()) && !foundActive) {
        foundActive = {
          id: p.id,
          code: p.code,
          title: p.title,
          discountPercent: p.discountPercent,
          endsAt: p.endsAt,
        };
      }
    });
    if (foundActive) cachedLandingData.promo = foundActive;
  } catch {
    const active = localPromos.find(
      (p) => p.active && (!p.endsAt || new Date(p.endsAt).getTime() > Date.now())
    );
    cachedLandingData.promo = active
      ? {
          id: active.id,
          code: active.code,
          title: active.title,
          discountPercent: active.discountPercent,
          endsAt: active.endsAt,
        }
      : null;
  }

  return cachedLandingData;
}

export async function saveCmsData(data: Partial<LandingData>): Promise<void> {
  cachedLandingData = {
    ...cachedLandingData,
    ...data,
  };
  try {
    await setDoc(doc(db, "site_config", "landing_page"), cachedLandingData, { merge: true });
  } catch (err) {
    console.warn("Salvando CMS no cache local:", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Keys / API Licenças dos Clientes                                   */
/* ------------------------------------------------------------------ */

export async function fetchKeys(): Promise<KeyRow[]> {
  try {
    const q = query(collection(db, "licenses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: KeyRow[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as KeyRow);
      });
      localKeys = list;
      return list;
    }
  } catch (err) {
    console.warn("Carregando licenças do cache local:", err);
  }
  return localKeys;
}

export async function createKey(data: {
  name: string;
  email: string;
  whatsapp: string;
  notes?: string;
}): Promise<KeyRow> {
  const generated = generateLicenseKey(data.name, data.email, data.whatsapp);
  const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newRow: KeyRow = {
    id,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    whatsapp: data.whatsapp.trim(),
    key: generated.replace("JSPR-V1", "JASPER-LT"),
    status: "active",
    notes: data.notes?.trim() || "",
    createdAt: new Date().toISOString(),
    invalidatedAt: null,
    machineId: null,
    machineName: null,
    activatedAt: null,
    lastSeenAt: null,
  };

  try {
    await setDoc(doc(db, "licenses", id), newRow);
  } catch (err) {
    console.warn("Gravando chave em cache local:", err);
  }

  localKeys = [newRow, ...localKeys];
  return newRow;
}

export async function updateKey(
  id: string,
  data: Partial<Pick<KeyRow, "name" | "email" | "whatsapp" | "notes">>
): Promise<KeyRow> {
  const updates: Record<string, any> = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) updates.email = data.email.trim().toLowerCase();
  if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp.trim();
  if (data.notes !== undefined) updates.notes = data.notes.trim();

  try {
    await updateDoc(doc(db, "licenses", id), updates);
  } catch (err) {
    console.warn("Atualizando chave em cache local:", err);
  }

  localKeys = localKeys.map((k) => (k.id === id ? { ...k, ...updates } : k));
  const updated = localKeys.find((k) => k.id === id);
  if (!updated) throw new Error("Chave não encontrada.");
  return updated;
}

export async function setKeyStatus(id: string, status: LicenseStatus): Promise<KeyRow> {
  const updates: Partial<KeyRow> = {
    status,
    invalidatedAt: status === "revoked" ? new Date().toISOString() : null,
  };

  try {
    await updateDoc(doc(db, "licenses", id), updates as any);
  } catch (err) {
    console.warn("Alterando status da chave em cache local:", err);
  }

  localKeys = localKeys.map((k) => (k.id === id ? { ...k, ...updates } : k));
  const updated = localKeys.find((k) => k.id === id);
  if (!updated) throw new Error("Chave não encontrada.");
  return updated;
}

export async function invalidateKey(id: string): Promise<KeyRow> {
  return setKeyStatus(id, "revoked");
}

export async function deleteKey(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "licenses", id));
  } catch (err) {
    console.warn("Excluindo chave do cache local:", err);
  }
  localKeys = localKeys.filter((k) => k.id !== id);
}

export async function unlinkMachine(id: string): Promise<KeyRow> {
  const updates: Partial<KeyRow> = {
    machineId: null,
    machineName: null,
    activatedAt: null,
    lastSeenAt: null,
  };

  try {
    await updateDoc(doc(db, "licenses", id), updates as any);
  } catch (err) {
    console.warn("Desvinculando máquina em cache local:", err);
  }

  localKeys = localKeys.map((k) => (k.id === id ? { ...k, ...updates } : k));
  const updated = localKeys.find((k) => k.id === id);
  if (!updated) throw new Error("Chave não encontrada.");
  return updated;
}

/**
 * Validação de Licença e Vinculação de Máquina Única (Node-Locking)
 * Função consumida pelo Jasper Desktop no primeiro boot ou validação periódica.
 */
export async function validateAndBindLicense(
  keyString: string,
  machineId: string,
  machineName?: string
): Promise<{ success: boolean; message: string; license?: KeyRow }> {
  const cleanKey = keyString.trim().toUpperCase();
  const cleanHwid = machineId.trim();

  if (!cleanKey) {
    return { success: false, message: "Chave de licença não fornecida." };
  }
  if (!cleanHwid) {
    return { success: false, message: "Identificador de máquina (HWID) inválido." };
  }

  try {
    const q = query(collection(db, "licenses"), where("key", "==", cleanKey));
    const snap = await getDocs(q);

    let targetDoc = snap.empty ? null : snap.docs[0];
    let row: KeyRow | null = targetDoc ? (targetDoc.data() as KeyRow) : null;

    if (!row) {
      // Tenta fallback local
      const found = localKeys.find((k) => k.key.toUpperCase() === cleanKey);
      if (found) row = found;
    }

    if (!row) {
      return { success: false, message: "Chave de licença não encontrada ou inválida." };
    }

    // 1. Verifica status da licença
    if (row.status === "disabled") {
      return {
        success: false,
        message: "Esta licença foi temporariamente desativada pelo administrador.",
      };
    }
    if (row.status === "revoked") {
      return {
        success: false,
        message: "Esta licença foi permanentemente revogada.",
      };
    }

    // 2. Verifica restrição de máquina única
    const now = new Date().toISOString();

    // Caso A: Licença nova ainda não vinculada a nenhuma máquina -> Vincula agora!
    if (!row.machineId) {
      const updates = {
        machineId: cleanHwid,
        machineName: machineName || "Dispositivo Desconhecido",
        activatedAt: now,
        lastSeenAt: now,
      };
      if (targetDoc) {
        await updateDoc(doc(db, "licenses", row.id), updates);
      }
      row = { ...row, ...updates };
      localKeys = localKeys.map((k) => (k.id === row!.id ? row! : k));
      return {
        success: true,
        message: `Licença vinculada com sucesso a esta máquina (${updates.machineName})!`,
        license: row,
      };
    }

    // Caso B: A máquina atual é a mesma cadastrada -> Atualiza lastSeenAt e autoriza
    if (row.machineId === cleanHwid) {
      const updates = {
        lastSeenAt: now,
        machineName: machineName || row.machineName,
      };
      if (targetDoc) {
        await updateDoc(doc(db, "licenses", row.id), updates);
      }
      row = { ...row, ...updates };
      localKeys = localKeys.map((k) => (k.id === row!.id ? row! : k));
      return {
        success: true,
        message: "Licença ativa e autorizada nesta máquina.",
        license: row,
      };
    }

    // Caso C: Tentativa de uso em OUTRA máquina diferente -> Bloqueio estrito!
    return {
      success: false,
      message: `Esta licença é exclusiva e já está vinculada a outro computador ("${row.machineName || "Dispositivo Anterior"}"). Para transferir o acesso, solicite a liberação da máquina ao administrador.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Erro ao validar licença com os servidores do Jasper.",
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Promotions Management                                              */
/* ------------------------------------------------------------------ */

export async function fetchPromos(): Promise<PromoRow[]> {
  try {
    const q = query(collection(db, "promotions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: PromoRow[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as PromoRow);
      });
      localPromos = list;
      return list;
    }
  } catch (err) {
    console.warn("Carregando promoções do cache local:", err);
  }
  return localPromos;
}

export async function createPromo(data: {
  code: string;
  discountPercent: number;
  endsAt: string | null;
  title: Record<string, string>;
}): Promise<PromoRow> {
  const id = `promo_${Date.now()}`;
  const newRow: PromoRow = {
    id,
    code: data.code.toUpperCase().trim(),
    discountPercent: data.discountPercent,
    endsAt: data.endsAt,
    title: data.title,
    active: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "promotions", id), newRow);
  } catch (err) {
    console.warn("Gravando promoção no cache local:", err);
  }

  localPromos = [newRow, ...localPromos];
  return newRow;
}

export async function togglePromo(id: string, active: boolean): Promise<PromoRow> {
  try {
    await updateDoc(doc(db, "promotions", id), { active });
  } catch (err) {
    console.warn("Atualizando promoção no cache local:", err);
  }

  localPromos = localPromos.map((p) => (p.id === id ? { ...p, active } : p));
  const updated = localPromos.find((p) => p.id === id);
  return updated!;
}

export async function deletePromo(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "promotions", id));
  } catch (err) {
    console.warn("Removendo promoção do cache local:", err);
  }
  localPromos = localPromos.filter((p) => p.id !== id);
}

/* ------------------------------------------------------------------ */
/*  Admin Auth Helper                                                  */
/* ------------------------------------------------------------------ */

export function checkAdminSession(): { authed: boolean; username: string } {
  if (typeof window === "undefined") return { authed: false, username: "" };
  const authed = window.sessionStorage.getItem("jasper_admin_authed") === "true";
  const username = window.sessionStorage.getItem("jasper_admin_username") || "admin";
  return { authed, username };
}

export function setAdminSession(username: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("jasper_admin_authed", "true");
  window.sessionStorage.setItem("jasper_admin_username", username);
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("jasper_admin_authed");
  window.sessionStorage.removeItem("jasper_admin_username");
}

