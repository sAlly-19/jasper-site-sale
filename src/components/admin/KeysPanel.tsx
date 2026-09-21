"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchKeys,
  createKey,
  updateKey,
  setKeyStatus,
  deleteKey,
  unlinkMachine,
  type KeyRow,
  type LicenseStatus,
} from "@/services/firestoreAdminService";

const ERR: Record<string, string> = {
  name_required: "Nome do cliente é obrigatório.",
  email_invalid: "Informe um endereço de e-mail válido.",
  whatsapp_invalid: "WhatsApp deve conter entre 8 e 15 dígitos numéricos.",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function KeysPanel({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [search, setSearch] = useState("");

  // Formulário de Criação
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [newKey, setNewKey] = useState<KeyRow | null>(null);

  // Modal de Edição
  const [editingKey, setEditingKey] = useState<KeyRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  // Confirmações
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: "delete" | "revoke" | "unlink";
  } | null>(null);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const list = await fetchKeys();
      setKeys(list);
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Criação de nova chave */
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = whatsapp.replace(/\D/g, "");

    if (!cleanName) {
      setFormError(ERR.name_required);
      setBusy(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError(ERR.email_invalid);
      setBusy(false);
      return;
    }
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      setFormError(ERR.whatsapp_invalid);
      setBusy(false);
      return;
    }

    try {
      const generated = await createKey({
        name: cleanName,
        email: cleanEmail,
        whatsapp: whatsapp.trim(),
        notes: notes.trim(),
      });
      setNewKey(generated);
      setKeys((k) => [generated, ...(k || [])]);
      setName("");
      setEmail("");
      setWhatsapp("");
      setNotes("");
      notify("Chave de acesso gerada com sucesso!");
    } catch {
      setFormError("Erro ao gravar chave no Firestore — verifique as permissões.");
    } finally {
      setBusy(false);
    }
  };

  /* Abertura do Modal de Edição */
  const openEditModal = (key: KeyRow) => {
    setEditingKey(key);
    setEditName(key.name);
    setEditEmail(key.email);
    setEditWhatsapp(key.whatsapp);
    setEditNotes(key.notes || "");
  };

  /* Salvar Edição */
  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    setEditBusy(true);
    try {
      const updated = await updateKey(editingKey.id, {
        name: editName,
        email: editEmail,
        whatsapp: editWhatsapp,
        notes: editNotes,
      });
      setKeys((k) => (k || []).map((row) => (row.id === updated.id ? updated : row)));
      setEditingKey(null);
      notify("Dados do cliente atualizados com sucesso!");
    } catch (err: any) {
      notify(err?.message || "Falha ao atualizar dados.", "err");
    } finally {
      setEditBusy(false);
    }
  };

  /* Alterar Status (Ativar / Desativar / Revogar) */
  const changeStatus = async (id: string, newStatus: LicenseStatus) => {
    try {
      const updated = await setKeyStatus(id, newStatus);
      setKeys((k) => (k || []).map((row) => (row.id === id ? updated : row)));
      const msg =
        newStatus === "active"
          ? "Chave ativada com sucesso"
          : newStatus === "disabled"
          ? "Chave desativada temporariamente"
          : "Chave revogada permanentemente";
      notify(msg);
    } catch {
      notify("Falha ao alterar status da chave", "err");
    } finally {
      setConfirmAction(null);
    }
  };

  /* Desvincular Máquina (Reset de HWID para troca de PC) */
  const handleUnlinkMachine = async (id: string) => {
    try {
      const updated = await unlinkMachine(id);
      setKeys((k) => (k || []).map((row) => (row.id === id ? updated : row)));
      notify("Máquina desvinculada! A chave está livre para ser ativada em outro PC.");
    } catch {
      notify("Falha ao desvincular máquina.", "err");
    } finally {
      setConfirmAction(null);
    }
  };

  /* Excluir Chave */
  const handleDelete = async (id: string) => {
    try {
      await deleteKey(id);
      setKeys((k) => (k || []).filter((row) => row.id !== id));
      notify("Chave excluída do sistema.");
    } catch {
      notify("Falha ao excluir chave.", "err");
    } finally {
      setConfirmAction(null);
    }
  };

  /* Copiar texto */
  const copy = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      notify("Copiado para a área de transferência!");
    } catch {
      notify("Falha ao copiar", "err");
    }
  };

  // Filtragem e Métricas
  const allKeys = keys || [];
  const filteredKeys = allKeys.filter((k) => {
    const q = search.toLowerCase();
    return (
      k.name.toLowerCase().includes(q) ||
      k.email.toLowerCase().includes(q) ||
      k.key.toLowerCase().includes(q) ||
      (k.machineName && k.machineName.toLowerCase().includes(q))
    );
  });

  const activeCount = allKeys.filter((k) => k.status === "active").length;
  const disabledCount = allKeys.filter((k) => k.status === "disabled").length;
  const revokedCount = allKeys.filter((k) => k.status === "revoked").length;
  const boundCount = allKeys.filter((k) => !!k.machineId).length;

  return (
    <div className="space-y-6">
      {/* ---------------- FORMULÁRIO DE GERAÇÃO ---------------- */}
      <form onSubmit={create} className="glass-deep hud-frame rounded-2xl p-6 border border-white/8">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mb-5">
          + Emitir Nova Chave de Acesso Vitalícia (Node-Locked)
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="lbl">Nome do Cliente</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Silva"
              required
            />
          </div>
          <div>
            <label className="lbl">E-mail</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@exemplo.com"
              required
            />
          </div>
          <div>
            <label className="lbl">WhatsApp</label>
            <input
              className="field"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+55 11 99999 8888"
              required
            />
          </div>
          <div>
            <label className="lbl">Observações (Opcional)</label>
            <input
              className="field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pagamento Pix / Suporte VIP"
            />
          </div>
        </div>

        {formError && (
          <p className="mt-4 text-red-400 font-mono text-[11px] border border-red-400/30 bg-red-400/10 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <button
            type="submit"
            disabled={busy}
            className="btn-neon rounded-xl px-6 py-3 text-[11px] tracking-[0.15em] disabled:opacity-60"
          >
            {busy ? "EMITINDO CHAVE…" : "EMITIR CHAVE"}
          </button>
          <span className="font-mono text-[10px] text-mist/70">
            A chave gerada será vinculada exclusivamente à primeira máquina (HWID) em que o Jasper Desktop for aberto.
          </span>
        </div>
      </form>

      {/* ---------------- CHAVE RECÉM GERADA ---------------- */}
      {newKey && (
        <div className="glass rounded-2xl border-lime/30 p-6 bg-lime/[0.03]">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-lime mb-3">
            ✓ Chave Gerada com Sucesso — {newKey.name} · {newKey.email}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="font-mono text-base md:text-lg text-frost tracking-wider bg-void/80 border border-lime/40 rounded-lg px-4 py-3 select-all">
              {newKey.key}
            </code>
            <button
              onClick={() => copy(newKey.key)}
              className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-lime border-lime/30 hover:bg-lime/10"
            >
              Copiar Chave
            </button>
            <a
              href={`https://wa.me/${newKey.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                `Olá ${newKey.name}! Aqui está sua chave de acesso vitalício para o Jasper Avatar: ${newKey.key}\nLembre-se: Esta chave é vinculada de forma única à sua máquina de uso.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost rounded-lg px-5 py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-mist hover:text-frost"
            >
              Enviar via WhatsApp →
            </a>
          </div>
        </div>
      )}

      {/* ---------------- MÉTRICAS DE LICENCIAMENTO ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ativas", value: activeCount, color: "text-lime" },
          { label: "Desativadas", value: disabledCount, color: "text-amber-400" },
          { label: "Revogadas", value: revokedCount, color: "text-red-400" },
          { label: "Máquinas Vinculadas", value: `${boundCount}/${allKeys.length}`, color: "text-neon" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5 border border-white/5">
            <p className={`font-display font-black text-2xl md:text-3xl ${s.color}`}>
              {keys ? s.value : "—"}
            </p>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mist mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ---------------- TABELA DE GESTÃO DE CHAVES ---------------- */}
      <div className="glass rounded-2xl overflow-hidden border border-white/8">
        <div className="p-4 border-b border-white/8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-mist uppercase tracking-widest">Filtro:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, e-mail, chave ou máquina..."
              className="glass px-3.5 py-1.5 rounded-lg text-xs font-mono text-frost placeholder:text-mist/40 w-72 max-w-full focus:outline-none focus:border-neon/50"
            />
          </div>
          <span className="font-mono text-[10px] text-mist tracking-widest uppercase">
            Total exibido: {filteredKeys.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead>
              <tr className="border-b border-white/8 font-mono text-[10px] tracking-[0.25em] uppercase text-mist bg-white/[0.01]">
                <th className="px-5 py-4 font-medium">Cliente & Notas</th>
                <th className="px-5 py-4 font-medium">Chave de Acesso</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Máquina Vinculada (HWID)</th>
                <th className="px-5 py-4 font-medium">Criação</th>
                <th className="px-5 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {keys === null && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center font-mono text-xs text-mist anim-pulse-soft">
                    CARREGANDO LICENÇAS…
                  </td>
                </tr>
              )}
              {keys !== null && filteredKeys.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center font-mono text-xs text-mist">
                    Nenhuma licença encontrada.
                  </td>
                </tr>
              )}
              {filteredKeys.map((k) => (
                <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {/* Cliente */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-frost">{k.name}</p>
                    <p className="text-[11px] text-mist font-mono mt-0.5">{k.email}</p>
                    <p className="text-[11px] text-mist/80 font-mono mt-0.5">{k.whatsapp}</p>
                    {k.notes && (
                      <span className="inline-block mt-1 text-[10px] font-mono text-mist/60 bg-white/5 rounded px-2 py-0.5">
                        {k.notes}
                      </span>
                    )}
                  </td>

                  {/* Chave de Acesso */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))}
                        className="font-mono text-xs text-frost/90 hover:text-neon transition-colors tracking-wider text-left"
                        title="Clique para revelar / ocultar"
                      >
                        {revealed[k.id] ? k.key : `${k.key.slice(0, 11)}••••••••••••`}
                      </button>
                      <button
                        onClick={() => copy(k.key)}
                        className="font-mono text-[10px] text-mist hover:text-neon transition-colors uppercase tracking-widest px-2 py-1 glass rounded"
                        title="Copiar Chave"
                      >
                        Copiar
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] px-2.5 py-1 rounded-full border ${
                        k.status === "active"
                          ? "text-lime border-lime/40 bg-lime/10"
                          : k.status === "disabled"
                          ? "text-amber-400 border-amber-400/40 bg-amber-400/10"
                          : "text-red-400 border-red-400/40 bg-red-400/10"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          k.status === "active"
                            ? "bg-lime"
                            : k.status === "disabled"
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                      />
                      {k.status === "active"
                        ? "ATIVA"
                        : k.status === "disabled"
                        ? "DESATIVADA"
                        : "REVOGADA"}
                    </span>
                  </td>

                  {/* Restrição de Máquina Única (Node-Locking) */}
                  <td className="px-5 py-4">
                    {k.machineId ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-frost font-medium flex items-center gap-1">
                            💻 {k.machineName || "PC Cliente"}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-mist/70 truncate max-w-[200px]" title={k.machineId}>
                          ID: {k.machineId}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          {confirmAction?.id === k.id && confirmAction.action === "unlink" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                              <button
                                onClick={() => handleUnlinkMachine(k.id)}
                                className="text-amber-400 hover:underline font-bold"
                              >
                                Confirmar liberação?
                              </button>
                              <button
                                onClick={() => setConfirmAction(null)}
                                className="text-mist hover:text-frost ml-1"
                              >
                                [Não]
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmAction({ id: k.id, action: "unlink" })}
                              className="font-mono text-[9px] text-amber-400/90 hover:text-amber-300 uppercase tracking-wider border border-amber-400/30 rounded px-2 py-0.5 hover:bg-amber-400/10"
                              title="Libera a licença para ser ativada em outro computador"
                            >
                              Liberar Máquina
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-mist/60 bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-mist/40" />
                        Livre · Aguardando PC
                      </span>
                    )}
                  </td>

                  {/* Criação */}
                  <td className="px-5 py-4 font-mono text-xs text-mist">{fmtDate(k.createdAt)}</td>

                  {/* Ações */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {/* Editar Dados */}
                      <button
                        onClick={() => openEditModal(k)}
                        className="btn-ghost rounded-lg px-2.5 py-1.5 font-mono text-[10px] tracking-wider uppercase text-mist hover:text-neon"
                        title="Alterar dados do cliente"
                      >
                        Editar
                      </button>

                      {/* Ativar / Desativar */}
                      {k.status === "active" ? (
                        <button
                          onClick={() => changeStatus(k.id, "disabled")}
                          className="font-mono text-[10px] tracking-wider uppercase text-amber-400/90 border border-amber-400/30 rounded-lg px-2.5 py-1.5 hover:bg-amber-400/10"
                          title="Pausa temporariamente o acesso do cliente"
                        >
                          Desativar
                        </button>
                      ) : k.status === "disabled" ? (
                        <button
                          onClick={() => changeStatus(k.id, "active")}
                          className="font-mono text-[10px] tracking-wider uppercase text-lime border border-lime/30 rounded-lg px-2.5 py-1.5 hover:bg-lime/10"
                          title="Reativa a licença do cliente"
                        >
                          Ativar
                        </button>
                      ) : null}

                      {/* Revogar */}
                      {k.status !== "revoked" && (
                        confirmAction?.id === k.id && confirmAction.action === "revoke" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                            <button
                              onClick={() => changeStatus(k.id, "revoked")}
                              className="text-red-400 hover:underline font-bold px-2 py-1 bg-red-400/10 border border-red-400/30 rounded"
                            >
                              Revogar?
                            </button>
                            <button
                              onClick={() => setConfirmAction(null)}
                              className="text-mist hover:text-frost px-1"
                            >
                              Não
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ id: k.id, action: "revoke" })}
                            className="font-mono text-[10px] tracking-wider uppercase text-red-400/80 border border-red-400/30 rounded-lg px-2.5 py-1.5 hover:bg-red-400/10"
                            title="Revoga a chave permanentemente"
                          >
                            Revogar
                          </button>
                        )
                      )}

                      {/* Excluir Definitivamente */}
                      {confirmAction?.id === k.id && confirmAction.action === "delete" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                          <button
                            onClick={() => handleDelete(k.id)}
                            className="text-red-400 hover:underline font-bold px-2 py-1 bg-red-400/20 border border-red-400/50 rounded"
                          >
                            Excluir?
                          </button>
                          <button
                            onClick={() => setConfirmAction(null)}
                            className="text-mist hover:text-frost px-1"
                          >
                            Não
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ id: k.id, action: "delete" })}
                          className="font-mono text-[10px] tracking-wider uppercase text-mist/60 hover:text-red-400 transition-colors p-1.5"
                          title="Excluir licença permanentemente do banco"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODAL DE EDIÇÃO DE DADOS ---------------- */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md">
          <div className="glass-deep hud-frame rounded-3xl p-6 md:p-8 w-full max-w-lg border border-white/15 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-lg text-frost">Alterar Dados do Cliente</h3>
                <p className="font-mono text-[10px] text-neon uppercase tracking-widest mt-0.5">
                  Chave: {editingKey.key}
                </p>
              </div>
              <button
                onClick={() => setEditingKey(null)}
                className="text-mist hover:text-frost text-xl font-mono leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="lbl">Nome Completo</label>
                <input
                  className="field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">E-mail</label>
                <input
                  className="field"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">WhatsApp</label>
                <input
                  className="field"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Observações / Notas Internas</label>
                <textarea
                  className="field min-h-[72px] resize-none"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o cliente ou contrato..."
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="btn-ghost rounded-xl px-5 py-2.5 font-mono text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="btn-neon rounded-xl px-6 py-2.5 font-mono text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {editBusy ? "SALVANDO…" : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
