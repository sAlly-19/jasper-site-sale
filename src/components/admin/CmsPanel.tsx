"use client";

import React, { useCallback, useEffect, useState } from "react";
import { type FaqList, type Localized, type Media, type Prices } from "@/lib/content";
import { LOCALES, type Locale } from "@/lib/i18n";
import { fetchLandingData, saveCmsData } from "@/services/firestoreAdminService";

interface CmsData {
  content: Record<string, Localized>;
  sections: Record<string, boolean>;
  media: Media;
  prices: Prices;
  faq: FaqList;
}

const FIELDS: { key: string; label: string; area?: boolean }[] = [
  { key: "hero.eyebrow", label: "Hero · eyebrow" },
  { key: "hero.title", label: "Hero · title line 1" },
  { key: "hero.accent", label: "Hero · title line 2" },
  { key: "hero.subtitle", label: "Hero · subtitle", area: true },
  { key: "hero.cta", label: "Hero · CTA" },
  { key: "hero.ctaGhost", label: "Hero · secondary CTA" },
  { key: "about.eyebrow", label: "About · eyebrow" },
  { key: "about.title", label: "About · title" },
  { key: "about.body", label: "About · body", area: true },
  { key: "modules.eyebrow", label: "Modules · eyebrow" },
  { key: "modules.title", label: "Modules · title" },
  { key: "modules.subtitle", label: "Modules · subtitle", area: true },
  { key: "security.eyebrow", label: "Security · eyebrow" },
  { key: "security.title", label: "Security · title" },
  { key: "security.body", label: "Security · body", area: true },
  { key: "pricing.eyebrow", label: "Pricing · eyebrow" },
  { key: "pricing.title", label: "Pricing · title" },
  { key: "pricing.subtitle", label: "Pricing · subtitle", area: true },
  { key: "pricing.cta", label: "Pricing · CTA" },
  { key: "pricing.guarantee", label: "Pricing · guarantee" },
  { key: "pricing.included.1", label: "Pricing · included 1" },
  { key: "pricing.included.2", label: "Pricing · included 2" },
  { key: "pricing.included.3", label: "Pricing · included 3" },
  { key: "pricing.included.4", label: "Pricing · included 4" },
  { key: "faq.eyebrow", label: "FAQ · eyebrow" },
  { key: "faq.title", label: "FAQ · title" },
  { key: "final.title", label: "Final CTA · title" },
  { key: "final.body", label: "Final CTA · body", area: true },
  { key: "final.cta", label: "Final CTA · button" },
  { key: "footer.tagline", label: "Footer · tagline", area: true },
];

const SECTIONS: [string, string][] = [
  ["about", "About / command station"],
  ["modules", "17 modules grid + stats"],
  ["security", "Zero-trust security"],
  ["pricing", "Lifetime pricing card"],
  ["faq", "FAQ accordion"],
  ["final", "Final CTA"],
];

const PRICE_FIELDS: [string, string][] = [
  ["BRL", "Lifetime price · BRL"],
  ["USD", "Lifetime price · USD"],
  ["EUR", "Lifetime price · EUR"],
  ["BRL_original", "Original price · BRL"],
  ["USD_original", "Original price · USD"],
  ["EUR_original", "Original price · EUR"],
];

const MEDIA_FIELDS: [keyof Media, string][] = [
  ["heroAvatar", "Hero avatar image"],
  ["hud", "About section screenshot"],
];

type SubTab = "text" | "structure" | "faq";

export function CmsPanel({ notify }: { notify: (m: string, t?: "ok" | "err") => void }) {
  const [data, setData] = useState<CmsData | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [sub, setSub] = useState<SubTab>("text");
  const [busy, setBusy] = useState(false);
  const [faqLoc, setFaqLoc] = useState<Locale>("pt-BR");

  const load = useCallback(async () => {
    try {
      const d = await fetchLandingData();
      const formatted: CmsData = {
        content: d.content,
        sections: d.sections,
        media: d.media,
        prices: d.prices,
        faq: d.faq,
      };
      setData(formatted);
      setSaved(JSON.stringify(formatted));
    } catch {
      notify("Failed to load content", "err");
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = data !== null && JSON.stringify(data) !== saved;

  const setField = (key: string, loc: Locale, value: string) => {
    setData((d) => d && { ...d, content: { ...d.content, [key]: { ...d.content[key], [loc]: value } } });
  };
  const setSection = (key: string, val: boolean) =>
    setData((d) => d && { ...d, sections: { ...d.sections, [key]: val } });
  const setMedia = (key: keyof Media, value: string) =>
    setData((d) => d && { ...d, media: { ...d.media, [key]: value } });
  const setPrice = (key: string, value: number) =>
    setData((d) => d && { ...d, prices: { ...d.prices, [key]: value } });
  const setFaqItem = (idx: number, field: "q" | "a", value: string) =>
    setData((d) => {
      if (!d) return d;
      const items = (d.faq[faqLoc] || []).map((it, i) => (i === idx ? { ...it, [field]: value } : it));
      return { ...d, faq: { ...d.faq, [faqLoc]: items } };
    });
  const addFaq = () =>
    setData((d) =>
      d ? { ...d, faq: { ...d.faq, [faqLoc]: [...(d.faq[faqLoc] || []), { q: "", a: "" }] } } : d,
    );
  const removeFaq = (idx: number) =>
    setData((d) =>
      d ? { ...d, faq: { ...d.faq, [faqLoc]: (d.faq[faqLoc] || []).filter((_, i) => i !== idx) } } : d,
    );

  const save = async () => {
    if (!data) return;
    setBusy(true);
    try {
      await saveCmsData({
        content: data.content,
        sections: data.sections,
        media: data.media,
        prices: data.prices,
        faq: data.faq,
      });
      setSaved(JSON.stringify(data));
      notify("Landing page updated — it is live now");
    } catch {
      notify("Network error — try again", "err");
    } finally {
      setBusy(false);
    }
  };

  if (data === null) {
    return (
      <p className="font-mono text-xs text-mist text-center py-16 anim-pulse-soft">LOADING CONTENT…</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* subtabs */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="glass flex items-center gap-1 rounded-full p-1">
          {(
            [
              ["text", "Text"],
              ["structure", "Sections · Media · Prices"],
              ["faq", "FAQ"],
            ] as [SubTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSub(id)}
              className={`font-mono text-[10px] tracking-[0.2em] uppercase px-4 py-2 rounded-full transition-all ${
                sub === id
                  ? "bg-neon/15 text-neon border border-neon/30"
                  : "text-mist hover:text-frost border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="font-mono text-[10px] tracking-widest text-lime uppercase">● Unsaved</span>}
          <button
            onClick={() => {
              if (saved) setData(JSON.parse(saved));
            }}
            disabled={!dirty}
            className="btn-ghost rounded-xl px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty || busy}
            className="btn-neon rounded-xl px-6 py-2.5 text-[11px] tracking-[0.15em] disabled:opacity-50"
          >
            {busy ? "SAVING…" : "SAVE CHANGES"}
          </button>
        </div>
      </div>

      {/* TEXT */}
      {sub === "text" && (
        <div className="glass-deep hud-frame rounded-2xl p-6">
          <div className="hidden xl:grid grid-cols-[200px_1fr_1fr_1fr] gap-3 pb-2">
            <span className="lbl !mb-0">Field</span>
            {LOCALES.map((l) => (
              <span key={l.code} className="lbl !mb-0">{l.code}</span>
            ))}
          </div>
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <div
                key={f.key}
                className="grid gap-2 md:grid-cols-[180px_1fr] xl:grid-cols-[200px_1fr_1fr_1fr] xl:gap-3 items-start border-b border-white/5 pb-4 last:border-0"
              >
                <div className="pt-2">
                  <span className="font-mono text-[11px] text-mist">{f.label}</span>
                </div>
                {LOCALES.map((l) => (
                  <div key={l.code}>
                    {f.area ? (
                      <textarea
                        className="field resize-none"
                        rows={3}
                        value={data.content[f.key]?.[l.code] || ""}
                        onChange={(e) => setField(f.key, l.code, e.target.value)}
                      />
                    ) : (
                      <input
                        className="field"
                        value={data.content[f.key]?.[l.code] || ""}
                        onChange={(e) => setField(f.key, l.code, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STRUCTURE: sections + media + prices */}
      {sub === "structure" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="glass-deep hud-frame rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mb-5">Sections</p>
            <div className="space-y-3">
              {SECTIONS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{label}</span>
                  <button
                    onClick={() => setSection(key, !data.sections[key])}
                    aria-label={`Toggle ${label}`}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      data.sections[key] ? "bg-lime/80" : "bg-white/15"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                        data.sections[key] ? "left-[22px] bg-void" : "left-0.5 bg-mist"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mt-8 mb-5">Prices (lifetime)</p>
            <div className="grid grid-cols-2 gap-3">
              {PRICE_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="lbl">{label}</label>
                  <input
                    className="field font-mono"
                    type="number"
                    min={0}
                    value={data.prices[key] ?? 0}
                    onChange={(e) => setPrice(key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-deep hud-frame rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon mb-5">Media</p>
            <div className="space-y-6">
              {MEDIA_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="lbl">{label}</label>
                  <div className="flex gap-3 items-start">
                    <input
                      className="field font-mono !text-xs"
                      value={data.media[key] || ""}
                      onChange={(e) => setMedia(key, e.target.value)}
                    />
                    <img
                      src={data.media[key] || undefined}
                      alt={label}
                      className="w-20 h-20 object-cover rounded-lg border border-white/10 shrink-0"
                      onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")}
                    />
                  </div>
                </div>
              ))}
              <p className="font-mono text-[10px] text-mist/60 leading-relaxed">
                Tip: upload your own renders or use any absolute image URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      {sub === "faq" && (
        <div className="glass-deep hud-frame rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-neon">FAQ items</p>
            <div className="glass flex items-center gap-1 rounded-full p-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setFaqLoc(l.code)}
                  className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full transition-all ${
                    faqLoc === l.code ? "bg-lime text-void font-semibold" : "text-mist hover:text-frost"
                  }`}
                >
                  {l.code}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {(data.faq[faqLoc] || []).map((item, i) => (
              <div
                key={i}
                className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto] items-start border border-white/8 rounded-xl p-4 bg-void/40"
              >
                <div>
                  <label className="lbl">Question</label>
                  <input className="field" value={item.q} onChange={(e) => setFaqItem(i, "q", e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Answer</label>
                  <textarea
                    className="field resize-none"
                    rows={2}
                    value={item.a}
                    onChange={(e) => setFaqItem(i, "a", e.target.value)}
                  />
                </div>
                <button
                  onClick={() => removeFaq(i)}
                  className="btn-ghost rounded-xl px-3.5 mt-6 font-mono text-[10px] tracking-widest uppercase text-red-400 hover:!border-red-400/50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addFaq}
              className="btn-ghost w-full rounded-xl py-3.5 font-mono text-[11px] tracking-[0.25em] uppercase"
            >
              + Add question ({faqLoc})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

