"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  fetchKeys,
  createKeysBatch,
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

  // Formulário de Criação (com suporte a Lote / Múltiplas Chaves por Cliente)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [generatedBatch, setGeneratedBatch] = useState<KeyRow[] | null>(null);

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

  /* Criação de chaves (única ou em lote para o mesmo cliente) */
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = whatsapp.replace(/\D/g, "");
    const qty = Math.max(1, Math.min(50, quantity));

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
      const batch = await createKeysBatch({
        name: cleanName,
        email: cleanEmail,
        whatsapp: whatsapp.trim(),
        notes: notes.trim(),
        quantity: qty,
      });

      setGeneratedBatch(batch);
      setKeys((k) => [...batch, ...(k || [])]);
      setName("");
      setEmail("");
      setWhatsapp("");
      setNotes("");
      setQuantity(1);
      notify(
        qty > 1
          ? `Sucesso! ${qty} chaves emitidas para ${cleanName}.`
          : "Chave de acesso gerada com sucesso!"
      );
    } catch {
      setFormError("Erro ao gravar chaves no Firestore — verifique as permissões.");
    } finally {
      setBusy(false);
    }
  };

  /* Pré-preencher gerador para emitir chave adicional a um cliente existente */
  const quickAddForClient = (client: KeyRow) => {
    setName(client.name);
    setEmail(client.email);
    setWhatsapp(client.whatsapp);
    setQuantity(1);
    setNotes("Chave adicional para nova máquina");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    notify(`Dados de ${client.name} preenchidos no gerador.`);
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

  /* Copiar lote inteiro formatado */
  const copyBatchAll = (batch: KeyRow[]) => {
    const text = batch
      .map((k, i) => `${i + 1}. ${k.key} (${k.notes || "Máquina"})`)
      .join("\n");
    copy(text);
  };

  // Agrupamento e Métricas por Cliente
  const allKeys = keys || [];
  const clientKeysMap: Record<string, KeyRow[]> = {};
  allKeys.forEach((k) => {
    const em = k.email.toLowerCase();
    if (!clientKeysMap[em]) clientKeysMap[em] = [];
    clientKeysMap[em].push(k);
  });

  const uniqueClientsCount = Object.keys(clientKeysMap).length;

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
      {/* ---------------- FORMULÁRIO DE GERAÇÃO EM LOTE ---------------- */}
      <form onSubmit={create} className="glass-deep hud-frame rounded-2xl p-6 border border-white/8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon">
            + Emitir Chaves de Acesso Vitalícias (1 ou Múltiplas Máquinas por Cliente)
          </p>
          <span className="font-mono text-[10px] text-mist/70">
            Node-Locked: cada chave ativará 1 máquina com Jasper Desktop
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
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
            <label className="lbl">Qtd. de Máquinas</label>
            <div className="flex items-center gap-1">
              <input
                className="field text-center font-mono font-bold text-neon"
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
              <div className="flex flex-col gap-0.5">
                {[1, 2, 3, 5].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                      quantity === q
                        ? "border-neon bg-neon/20 text-neon"
                        : "border-white/10 text-mist hover:text-frost"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="lbl">Observações / Notas</label>
            <input
              className="field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Desktop + Laptop"
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
            {busy
              ? "GERANDO CHAVES…"
              : quantity > 1
              ? `EMITIR ${quantity} CHAVES EM LOTE`
              : "EMITIR 1 CHAVE"}
          </button>
          <span className="font-mono text-[10px] text-mist/70">
            {quantity > 1
              ? `Serão geradas ${quantity} chaves únicas para este cliente, permitindo equipar ${quantity} computadores diferentes.`
              : "A chave gerada será vinculada exclusivamente à primeira máquina em que for ativada."}
          </span>
        </div>
      </form>

      {/* ---------------- RESULTADO DO LOTE RECÉM GERADO ---------------- */}
      {generatedBatch && generatedBatch.length > 0 && (
        <div className="glass rounded-2xl border-lime/30 p-6 bg-lime/[0.03]">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-lime">
                ✓ {generatedBatch.length} {generatedBatch.length === 1 ? "Chave Gerada" : "Chaves Geradas em Lote"}
              </p>
              <h4 className="font-display font-bold text-sm text-frost mt-0.5">
                {generatedBatch[0].name} · {generatedBatch[0].email}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyBatchAll(generatedBatch)}
                className="btn-ghost rounded-lg px-4 py-2 font-mono text-[10px] tracking-wider uppercase text-lime border-lime/40 hover:bg-lime/10"
              >
                Copiar Todas as {generatedBatch.length} Chaves
              </button>
              <a
                href={`https://wa.me/${generatedBatch[0].whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Olá ${generatedBatch[0].name}! Aqui estão suas ${generatedBatch.length} chave(s) de acesso vitalício para o Jasper Avatar:\n\n` +
                    generatedBatch
                      .map((k, i) => `🖥️ Máquina ${i + 1}: ${k.key}`)
                      .join("\n") +
                    `\n\nLembre-se: Cada chave ativará exclusivamente 1 computador (Node-Locked).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-neon rounded-lg px-4 py-2 font-mono text-[10px] tracking-wider uppercase"
              >
                Enviar Todas via WhatsApp →
              </a>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {generatedBatch.map((k, i) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl glass border border-white/8 bg-void/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-lime font-bold">#{i + 1}</span>
                  <code className="font-mono text-sm text-frost tracking-wider">{k.key}</code>
                  {k.notes && (
                    <span className="font-mono text-[10px] text-mist/70 bg-white/5 px-2 py-0.5 rounded">
                      {k.notes}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copy(k.key)}
                  className="font-mono text-[10px] text-mist hover:text-frost px-2.5 py-1 glass rounded uppercase"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- MÉTRICAS DE LICENCIAMENTO ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Ativas", value: activeCount, color: "text-lime" },
          { label: "Desativadas", value: disabledCount, color: "text-amber-400" },
          { label: "Revogadas", value: revokedCount, color: "text-red-400" },
          { label: "Clientes Únicos", value: uniqueClientsCount, color: "text-frost" },
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
            {search && (
              <button
                onClick={() => setSearch("")}
                className="font-mono text-[10px] text-mist hover:text-frost"
              >
                [Limpar]
              </button>
            )}
          </div>
          <span className="font-mono text-[10px] text-mist tracking-widest uppercase">
            Total exibido: {filteredKeys.length} chaves
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
              {filteredKeys.map((k) => {
                const totalOfThisClient = clientKeysMap[k.email.toLowerCase()]?.length || 1;
                return (
                  <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-frost">{k.name}</p>
                        {totalOfThisClient > 1 && (
                          <button
                            type="button"
                            onClick={() => setSearch(k.email)}
                            title={`Clique para ver todas as ${totalOfThisClient} chaves de ${k.name}`}
                            className="font-mono text-[9px] text-neon bg-neon/10 border border-neon/30 rounded px-1.5 py-0.5 hover:bg-neon/20 transition-all cursor-pointer"
                          >
                            👤 {totalOfThisClient} máquinas
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-mist font-mono mt-0.5">{k.email}</p>
                      <p className="text-[11px] text-mist/80 font-mono mt-0.5">{k.whatsapp}</p>
                      {k.notes && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-mist/70 bg-white/5 border border-white/5 rounded px-2 py-0.5">
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
                        {/* Botão para Emitir Chave Adicional para Este Cliente */}
                        <button
                          onClick={() => quickAddForClient(k)}
                          className="font-mono text-[10px] tracking-wider uppercase text-neon border border-neon/30 bg-neon/5 hover:bg-neon/15 rounded-lg px-2.5 py-1.5 transition-all"
                          title="Emitir mais uma chave para este cliente"
                        >
                          + Chave
                        </button>

                        {/* Editar Dados */}
                        <button
                          onClick={() => openEditModal(k)}
                          className="btn-ghost rounded-lg px-2.5 py-1.5 font-mono text-[10px] tracking-wider uppercase text-mist hover:text-frost"
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
                );
              })}
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
                  placeholder="Ex: PC Pessoal / Laptop Empresa..."
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
