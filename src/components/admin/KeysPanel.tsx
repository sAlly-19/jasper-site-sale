"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createKeysBatch,
  fetchKeys,
  setKeyStatus,
  unlinkMachine,
  type KeyRow,
} from "@/services/workerLicenseAdminService";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(value?: string | null) {
  return value ? `${value.slice(0, 8)}…${value.slice(-4)}` : "—";
}

export function KeysPanel({ notify }: { notify: (message: string, type?: "ok" | "err") => void }) {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [generatedBatch, setGeneratedBatch] = useState<KeyRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ id: string; action: "revoke" | "reactivate" | "release" } | null>(null);

  const load = useCallback(async () => {
    try {
      setKeys(await fetchKeys());
    } catch (error: any) {
      setKeys([]);
      notify(error?.message || "Falha ao carregar licenças.", "err");
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const safeQuantity = Math.max(1, Math.min(50, Math.trunc(quantity)));
    setBusy(true);
    try {
      const batch = await createKeysBatch(safeQuantity);
      setGeneratedBatch(batch);
      setKeys((current) => [...batch, ...(current || [])]);
      setQuantity(1);
      notify(`${batch.length} licença${batch.length === 1 ? "" : "s"} emitida${batch.length === 1 ? "" : "s"}. Copie agora.`);
    } catch (error: any) {
      notify(error?.message || "Falha ao emitir licenças.", "err");
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const updated = pending.action === "release"
        ? await unlinkMachine(pending.id)
        : await setKeyStatus(pending.id, pending.action === "reactivate" ? "active" : "revoked");
      setKeys((current) => (current || []).map((row) => row.id === updated.id ? updated : row));
      notify(pending.action === "release" ? "Máquina liberada." : pending.action === "revoke" ? "Licença revogada." : "Licença reativada.");
    } catch (error: any) {
      notify(error?.message || "Falha ao alterar a licença.", "err");
    } finally {
      setPending(null);
      setBusy(false);
    }
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      notify("Chave copiada.");
    } catch {
      notify("O navegador não permitiu copiar a chave.", "err");
    }
  };

  const copyAll = async () => {
    if (!generatedBatch) return;
    try {
      await navigator.clipboard.writeText(generatedBatch.map((row) => row.key).join("\n"));
      notify("Todas as chaves foram copiadas.");
    } catch {
      notify("O navegador não permitiu copiar as chaves.", "err");
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return keys || [];
    return (keys || []).filter((row) => [row.id, row.orderId, row.deviceId, row.installationId, row.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)));
  }, [keys, search]);

  const activeCount = (keys || []).filter((row) => row.status === "active").length;
  const revokedCount = (keys || []).filter((row) => row.status === "revoked").length;
  const boundCount = (keys || []).filter((row) => row.deviceId).length;

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="glass-deep hud-frame rounded-lg p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mb-2">Emissão administrativa</p>
            <p className="text-sm text-mist">Cada chave autoriza uma máquina. A chave completa aparece somente nesta emissão.</p>
          </div>
          <div className="w-32">
            <label className="lbl">Quantidade</label>
            <input className="field" type="number" min={1} max={50} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
          </div>
          <button type="submit" disabled={busy} className="btn-neon rounded-lg px-6 py-3 text-[11px] tracking-[0.15em] disabled:opacity-60">
            {busy ? "EMITINDO…" : "EMITIR LICENÇAS"}
          </button>
        </div>
      </form>

      {generatedBatch && generatedBatch.length > 0 && (
        <section className="border border-lime/35 bg-lime/5 rounded-lg p-5" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display font-bold text-frost">Chaves recém-emitidas</h3>
              <p className="font-mono text-[10px] text-amber-300 mt-1">Esta é a única exibição das chaves completas.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copyAll} className="btn-ghost rounded-lg px-3 py-2 font-mono text-[10px] uppercase">Copiar todas</button>
              <button type="button" onClick={() => setGeneratedBatch(null)} className="btn-ghost rounded-lg px-3 py-2 font-mono text-[10px] uppercase">Ocultar</button>
            </div>
          </div>
          <div className="space-y-2">
            {generatedBatch.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
                <code className="font-mono text-xs text-lime break-all">{row.key}</code>
                <button type="button" onClick={() => copy(row.key)} className="btn-ghost rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase shrink-0">Copiar</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ativas", value: activeCount, color: "text-lime" },
          { label: "Revogadas", value: revokedCount, color: "text-red-400" },
          { label: "Máquinas vinculadas", value: boundCount, color: "text-neon" },
        ].map((metric) => (
          <div key={metric.label} className="glass rounded-lg p-5 border border-white/5">
            <p className={`font-display font-black text-2xl ${metric.color}`}>{keys ? metric.value : "—"}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-mist mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      <section className="glass rounded-lg overflow-hidden border border-white/8">
        <div className="p-4 border-b border-white/8 flex items-center justify-between gap-4 flex-wrap">
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por ID, pedido, dispositivo ou status" className="glass px-3.5 py-2 rounded-lg text-xs font-mono text-frost placeholder:text-mist/40 w-96 max-w-full focus:outline-none focus:border-neon/50" />
          <span className="font-mono text-[10px] text-mist uppercase">{filtered.length} licenças</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead><tr className="border-b border-white/8 font-mono text-[10px] tracking-[0.2em] uppercase text-mist">
              <th className="px-5 py-4 font-medium">Licença</th><th className="px-5 py-4 font-medium">Origem</th><th className="px-5 py-4 font-medium">Status</th><th className="px-5 py-4 font-medium">Dispositivo</th><th className="px-5 py-4 font-medium">Atividade</th><th className="px-5 py-4 font-medium text-right">Ações</th>
            </tr></thead>
            <tbody>
              {keys === null && <tr><td colSpan={6} className="px-5 py-10 text-center font-mono text-xs text-mist">CARREGANDO…</td></tr>}
              {keys !== null && filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center font-mono text-xs text-mist">Nenhuma licença encontrada.</td></tr>}
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-4"><p className="font-mono text-xs text-frost">{shortId(row.id)}</p><p className="font-mono text-[10px] text-mist mt-1">Chave protegida por hash</p></td>
                  <td className="px-5 py-4 font-mono text-xs text-mist">{row.orderId ? `Pedido ${shortId(row.orderId)}` : "Administrativa"}</td>
                  <td className="px-5 py-4"><span className={`font-mono text-[10px] tracking-[0.12em] px-2.5 py-1 rounded-full border ${row.status === "active" ? "text-lime border-lime/40 bg-lime/10" : "text-red-400 border-red-400/40 bg-red-400/10"}`}>{row.status === "active" ? "ATIVA" : "REVOGADA"}</span></td>
                  <td className="px-5 py-4"><p className="font-mono text-xs text-frost">{row.deviceId ? shortId(row.deviceId) : "Livre"}</p>{row.installationId && <p className="font-mono text-[10px] text-mist mt-1">Instalação {shortId(row.installationId)}</p>}</td>
                  <td className="px-5 py-4 font-mono text-xs text-mist">{fmtDate(row.lastSeenAt || row.createdAt)}</td>
                  <td className="px-5 py-4 text-right"><div className="inline-flex gap-2">
                    {row.deviceId && row.status === "active" && <button type="button" onClick={() => setPending({ id: row.id, action: "release" })} className="btn-ghost rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase">Liberar máquina</button>}
                    <button type="button" onClick={() => setPending({ id: row.id, action: row.status === "active" ? "revoke" : "reactivate" })} className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase border ${row.status === "active" ? "text-red-400 border-red-400/30 hover:bg-red-400/10" : "text-lime border-lime/30 hover:bg-lime/10"}`}>{row.status === "active" ? "Revogar" : "Reativar"}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-void/85 backdrop-blur-md" role="dialog" aria-modal="true">
          <div className="glass-deep hud-frame rounded-lg p-6 w-full max-w-md border border-white/15">
            <h3 className="font-display font-bold text-lg text-frost">Confirmar operação</h3>
            <p className="text-sm text-mist mt-2">{pending.action === "release" ? "A licença poderá ser ativada em outra máquina." : pending.action === "revoke" ? "O acesso será encerrado após o lease offline atual expirar." : "A licença voltará a aceitar uma nova ativação."}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setPending(null)} className="btn-ghost rounded-lg px-4 py-2 font-mono text-xs uppercase">Cancelar</button>
              <button type="button" disabled={busy} onClick={confirmAction} className="btn-neon rounded-lg px-4 py-2 font-mono text-xs uppercase disabled:opacity-60">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
