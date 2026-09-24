import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { AdminUser } from "@/types/auth";

/**
 * Verifica se um usuário autenticado possui permissão de administrador:
 * 1. Custom Claim 'admin: true' no token JWT do Firebase Auth
 * 2. Registro ativo do UID na coleção 'admins' do Firestore
 */
export async function verifyAdminStatus(user: User): Promise<boolean> {
  try {
    const idTokenResult = await user.getIdTokenResult();
    const adminByUid = await getDoc(doc(db, "admins", user.uid));
    return idTokenResult.claims.admin === true && adminByUid.exists() && adminByUid.data()?.active === true;
  } catch (err) {
    console.error("Erro ao verificar status de administrador no Firestore:", err);
    return false;
  }
}

function parseAuthError(err: any): string {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "Endereço de e-mail inválido.";
    case "auth/user-disabled":
      return "Esta conta de administrador foi desativada.";
    case "auth/too-many-requests":
      return "Muitas tentativas sem sucesso. Aguarde alguns minutos antes de tentar novamente.";
    case "auth/network-request-failed":
      return "Falha de conexão com os servidores do Firebase.";
    default:
      return err?.message || "Falha na autenticação do Firebase.";
  }
}

/**
 * Autentica o administrador estritamente via Firebase Auth.
 * Rejeita qualquer tentativa de acesso caso o usuário não esteja na whitelist de administradores.
 */
export async function loginAdmin(email: string, pass: string): Promise<AdminUser> {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    throw new Error("Informe o e-mail e a senha de administrador.");
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const user = userCredential.user;

    const isAuthorized = await verifyAdminStatus(user);
    if (!isAuthorized) {
      // Desconecta imediatamente contas que não são da whitelist
      await fbSignOut(auth);
      throw new Error("Acesso não autorizado: Esta conta não possui privilégios de administrador.");
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Admin",
      role: "developer_admin",
    };
  } catch (error: any) {
    if (error.message?.includes("Acesso não autorizado")) {
      throw error;
    }
    throw new Error(parseAuthError(error));
  }
}

/**
 * Encerra a sessão do Firebase Auth.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn("Logout no Firebase Auth completado localmente.");
  }
}

/**
 * Monitora em tempo real o estado da autenticação do Firebase.
 */
export function subscribeToAuthState(callback: (user: AdminUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const isAuthorized = await verifyAdminStatus(firebaseUser);
      if (isAuthorized) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Admin",
          role: "developer_admin",
        });
        return;
      } else {
        await fbSignOut(auth);
        callback(null);
        return;
      }
    }
    callback(null);
  });
}
