"use client";

import React, { useCallback, useEffect, useState, type ReactNode } from "react";
import { KeysPanel } from "./KeysPanel";
import { PromosPanel } from "./PromosPanel";
import { CmsPanel } from "./CmsPanel";
import {
  checkAdminSession,
  setAdminSession,
  clearAdminSession,
} from "@/services/firestoreAdminService";
import { loginAdmin, logoutAdmin, subscribeToAuthState } from "@/services/firebaseAuthService";

type Tab = "keys" | "promos" | "cms";

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: "keys",
    label: "API Keys",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <circle cx="8" cy="14" r="4.5" />
        <path d="m11.5 10.5 8-8M16 6l3 3M13.5 8.5l2.5 2.5" />
      </svg>
    ),
  },
  {
    id: "promos",
    label: "Promotions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />
      </svg>
    ),
  },
  {
    id: "cms",
    label: "CMS",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M8 3v4M8 13h5M8 16.5h8" />
      </svg>
    ),
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-neon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M12 2.5 20.2 7v10L12 21.5 3.8 17V7L12 2.5Z" />
          <path d="M14.5 8.5H12a3 3 0 0 0 0 6h.8a3 3 0 0 1-2.4 2.7" />
        </svg>
      </span>
      <div>
        <p className="font-display font-bold text-xs tracking-[0.18em]">JASPER·HUD</p>
        <p className="font-mono text-[9px] tracking-[0.3em] text-mist uppercase">Developer console</p>
      </div>
    </div>
  );
}

function LoginCard({
  onLogin,
  error,
  busy,
}: {
  onLogin: (email: string, p: string) => void;
  error: string;
  busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [p, setP] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-void">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] rounded-full bg-neon/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[420px] h-[420px] rounded-full bg-lime/8 blur-[120px] pointer-events-none" />
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onLogin(email, p);
        }}
        className="relative glass-deep hud-frame scanlines rounded-3xl p-8 md:p-10 w-full max-w-md border border-white/10"
      >
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <div className="flex justify-center mb-6">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon border border-neon/30 bg-neon/5 rounded-full px-3 py-1">
            Restricted Area · Firebase Auth
          </span>
        </div>

        <label className="lbl">E-mail de Administrador</label>
        <input
          className="field mb-4"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@jasperavatar.com"
          autoComplete="email"
          required
        />

        <label className="lbl">Senha</label>
        <input
          className="field mb-6"
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-red-400 font-mono text-[11px] tracking-wider mb-4 border border-red-400/30 bg-red-400/10 rounded-lg px-3 py-2.5 leading-relaxed">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-neon w-full rounded-xl py-3.5 text-xs tracking-[0.15em] disabled:opacity-60"
        >
          {busy ? "AUTENTICANDO NO FIREBASE…" : "ACESSAR CONSOLE"}
        </button>

        <p className="font-mono text-[10px] text-mist/60 mt-6 leading-relaxed text-center">
          Acesso restrito exclusivamente a administradores autorizados.
        </p>
      </form>
    </div>
  );
}

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [tab, setTab] = useState<Tab>("keys");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const notify = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    if (typeof window !== "undefined") {
      window.setTimeout(() => setToast(null), 3200);
    }
  }, []);

  // Monitora a sessão ativa do Firebase Auth
  useEffect(() => {
    const unsub = subscribeToAuthState((admin) => {
      if (admin) {
        setAuthed(true);
        const name = admin.email || admin.displayName || "Admin";
        setUsername(name);
        setAdminSession(name);
      } else {
        const session = checkAdminSession();
        if (!session.authed) {
          setAuthed(false);
          setUsername("");
        }
      }
    });

    const session = checkAdminSession();
    if (session.authed) {
      setAuthed(true);
      setUsername(session.username);
    } else {
      setAuthed(false);
    }

    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setBusy(true);
    setError("");
    try {
      const admin = await loginAdmin(email, pass);
      const name = admin.email || admin.displayName || "Admin";
      setAdminSession(name);
      setUsername(name);
      setAuthed(true);
      notify("Console desbloqueado via Firebase Auth", "ok");
    } catch (err: any) {
      setError(err?.message || "Falha na autenticação do Firebase.");
    } finally {
      setBusy(false);
    }
  }, [notify]);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch {
      // Ignora erro de logout remoto
    }
    clearAdminSession();
    setAuthed(false);
    setUsername("");
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <span className="font-mono text-xs tracking-[0.4em] text-mist anim-pulse-soft">AUTENTICANDO…</span>
      </div>
    );
  }

  if (!authed) {
    return <LoginCard onLogin={login} error={error} busy={busy} />;
  }

  return (
    <div className="min-h-screen bg-void relative text-frost">
      <div className="noise-overlay" />
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* sidebar */}
        <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-white/8 bg-abyss/70 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen flex lg:flex-col">
          <div className="p-5 lg:p-6 flex lg:block items-center justify-between w-full">
            <Logo />
            <a
              href="/"
              className="font-mono text-[10px] tracking-[0.2em] text-mist hover:text-neon transition-colors uppercase"
            >
              ← Landing
            </a>
          </div>
          <nav className="flex lg:flex-col gap-1 px-3 pb-3 lg:pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-[11px] tracking-[0.2em] uppercase transition-all ${
                  tab === t.id
                    ? "bg-neon/10 text-neon border border-neon/30"
                    : "text-mist hover:text-frost border border-transparent hover:bg-white/5"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
          <div className="hidden lg:block mt-auto p-6 border-t border-white/8">
            <p className="font-mono text-[10px] text-mist/70 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-lime anim-pulse-soft" />
              {username}
            </p>
            <button
              onClick={logout}
              className="btn-ghost mt-4 w-full rounded-xl py-2.5 font-mono text-[10px] tracking-[0.25em] uppercase"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* main */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-wide">
                {TABS.find((t) => t.id === tab)?.label}
              </h1>
              <p className="font-mono text-[10px] tracking-[0.25em] text-mist uppercase mt-1">
                /admin/{tab}
              </p>
            </div>
            <button
              onClick={logout}
              className="lg:hidden btn-ghost rounded-xl px-4 py-2 font-mono text-[10px] tracking-widest uppercase"
            >
              Sign out
            </button>
          </div>
          {tab === "keys" && <KeysPanel notify={notify} />}
          {tab === "promos" && <PromosPanel notify={notify} />}
          {tab === "cms" && <CmsPanel notify={notify} />}
        </main>
      </div>

      {/* toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[90] glass-deep rounded-xl px-5 py-3.5 font-mono text-xs tracking-wider border ${
            toast.type === "ok" ? "border-lime/40 text-lime" : "border-red-400/40 text-red-400"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
