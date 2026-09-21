"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchPromos,
  createPromo,
  togglePromo,
  deletePromo,
  type PromoRow,
} from "@/services/firestoreAdminService";

const ERR: Record<string, string> = {
  code_invalid: "Code must be 3–24 characters, A–Z and 0–9 (e.g. LIFETIME30).",
  discount_invalid: "Discount must be between 1% and 90%.",
  title_required: "Write at least one banner text.",
  code_taken: "This code already exists.",
  endsat_invalid: "Invalid end date.",
};

export function PromosPanel({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const [promos, setPromos] = useState<PromoRow[] | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(30);
  const [endsAt, setEndsAt] = useState("");
  const [tPt, setTPt] = useState("");
  const [tEn, setTEn] = useState("");
  const [tEs, setTEs] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchPromos();
      setPromos(list);
    } catch {
      setPromos([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");

    const cleanCode = code.toUpperCase().trim();
    if (!/^[A-Z0-9_-]{3,24}$/.test(cleanCode)) {
      setFormError(ERR.code_invalid);
      setBusy(false);
      return;
    }
    if (discount < 1 || discount > 90) {
      setFormError(ERR.discount_invalid);
      setBusy(false);
      return;
    }
    if (!tPt.trim() && !tEn.trim() && !tEs.trim()) {
      setFormError(ERR.title_required);
      setBusy(false);
      return;
    }

    try {
      const newPromo = await createPromo({
        code: cleanCode,
        discountPercent: discount,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        title: {
          "pt-BR": tPt.trim() || tEn.trim() || tEs.trim(),
          en: tEn.trim() || tPt.trim() || tEs.trim(),
          es: tEs.trim() || tPt.trim() || tEn.trim(),
        },
      });

      setPromos((p) => [newPromo, ...(p || [])]);
      setCode("");
      setTPt("");
      setTEn("");
      setTEs("");
      setEndsAt("");
      notify("Promotion created");
    } catch {
      setFormError("Erro ao gravar promoção no Firestore.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (p: PromoRow) => {
    try {
      const updated = await togglePromo(p.id, !p.active);
      setPromos((list) => (list || []).map((x) => (x.id === p.id ? updated : x)));
      notify(p.active ? "Promotion paused" : "Promotion live on the landing");
    } catch {
      notify("Failed to toggle promotion", "err");
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePromo(id);
      setPromos((list) => (list || []).filter((x) => x.id !== id));
      notify("Promotion deleted");
    } catch {
      notify("Failed to delete promotion", "err");
    }
    setConfirmDelete(null);
  };

  const isLive = (p: PromoRow) => p.active && (!p.endsAt || new Date(p.endsAt).getTime() > Date.now());

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="glass-deep hud-frame rounded-2xl p-6">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mb-5">
          + New discount campaign
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="lbl">Code</label>
            <input
              className="field font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LIFETIME30"
              maxLength={24}
              required
            />
          </div>
          <div>
            <label className="lbl">Discount %</label>
            <input
              className="field"
              type="number"
              min={1}
              max={90}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="lbl">Ends at (optional)</label>
            <input
              className="field"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <div>
            <label className="lbl">&nbsp;</label>
            <div className="h-full rounded-xl border border-white/8 bg-void/40 flex items-center justify-center font-mono text-sm text-lime px-4">
              −{discount || 0}% OFF
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="lbl">Banner · PT-BR</label>
            <input
              className="field"
              value={tPt}
              onChange={(e) => setTPt(e.target.value)}
              placeholder="Acesso vitalício com 30% off"
            />
          </div>
          <div>
            <label className="lbl">Banner · EN</label>
            <input
              className="field"
              value={tEn}
              onChange={(e) => setTEn(e.target.value)}
              placeholder="Lifetime access with 30% off"
            />
          </div>
          <div>
            <label className="lbl">Banner · ES</label>
            <input
              className="field"
              value={tEs}
              onChange={(e) => setTEs(e.target.value)}
              placeholder="Acceso de por vida con 30% de descuento"
            />
          </div>
        </div>
        {formError && (
          <p className="mt-4 text-red-400 font-mono text-[11px] border border-red-400/30 bg-red-400/10 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}
        <div className="mt-5 flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="btn-neon rounded-xl px-6 py-3 text-[11px] tracking-[0.15em] disabled:opacity-60"
          >
            {busy ? "CREATING…" : "PUBLISH PROMOTION"}
          </button>
          <span className="font-mono text-[10px] text-mist/60">
            The most recent ACTIVE promo appears as a banner + live discount on the landing.
          </span>
        </div>
      </form>

      <div className="space-y-3">
        {promos === null && (
          <p className="font-mono text-xs text-mist text-center py-8 anim-pulse-soft">LOADING…</p>
        )}
        {promos !== null && promos.length === 0 && (
          <div className="glass rounded-2xl py-10 text-center font-mono text-xs text-mist">
            No campaigns yet. Launch your first discount above.
          </div>
        )}
        {promos?.map((p) => (
          <div
            key={p.id}
            className={`glass rounded-2xl p-5 flex flex-wrap items-center gap-4 ${
              isLive(p) ? "border-lime/25" : "opacity-70"
            }`}
          >
            <span className="font-mono text-sm font-semibold text-lime border border-lime/40 rounded-lg px-3 py-2 bg-lime/10 tracking-[0.15em]">
              {p.code}
            </span>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold">
                {p.title.en || p.title["pt-BR"] || p.title.es || "—"}
              </p>
              <p className="font-mono text-[11px] text-mist mt-1">
                −{p.discountPercent}% ·{" "}
                {p.endsAt
                  ? `ends ${new Date(p.endsAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "no expiry"}
              </p>
            </div>
            <span
              className={`font-mono text-[10px] tracking-[0.2em] px-3 py-1.5 rounded-full border ${
                isLive(p) ? "text-lime border-lime/40 bg-lime/10" : "text-mist border-white/15"
              }`}
            >
              {isLive(p) ? "LIVE ON LANDING" : "PAUSED"}
            </span>
            {/* switch */}
            <button
              onClick={() => toggle(p)}
              aria-label="Toggle promo"
              className={`relative w-11 h-6 rounded-full transition-colors ${
                p.active ? "bg-lime/80" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-void transition-all ${
                  p.active ? "left-[22px]" : "left-0.5 bg-mist"
                }`}
              />
            </button>
            {/* delete */}
            {confirmDelete === p.id ? (
              <span className="inline-flex items-center gap-2">
                <button
                  onClick={() => remove(p.id)}
                  className="text-red-400 font-mono text-[10px] tracking-widest uppercase border border-red-400/40 bg-red-400/10 rounded-lg px-3 py-2 hover:bg-red-400/20"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="font-mono text-[10px] text-mist uppercase tracking-widest px-2"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(p.id)}
                className="text-mist hover:text-red-400 font-mono text-[10px] tracking-widest uppercase transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

