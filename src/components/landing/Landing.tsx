"use client";

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LOCALES, LOCALE_BY_CODE, detectLocale, formatMoney, type Locale } from "@/lib/i18n";
import {
  defaultContent,
  defaultFaq,
  defaultMedia,
  defaultPrices,
  defaultSections,
  MODULES,
  type LandingData,
} from "@/lib/content";
import { useParallaxEngine, useRevealEngine } from "@/components/motion";
import { fetchLandingData } from "@/services/firestoreAdminService";

/* ------------------------------------------------------------------ */
/*  Small UI strings not exposed to the CMS                            */
/* ------------------------------------------------------------------ */

const NAV: Record<Locale, Record<string, string>> = {
  "pt-BR": { about: "Sobre", modules: "Módulos", security: "Segurança", pricing: "Preço", faq: "FAQ" },
  en: { about: "About", modules: "Modules", security: "Security", pricing: "Pricing", faq: "FAQ" },
  es: { about: "Sobre", modules: "Módulos", security: "Seguridad", pricing: "Precio", faq: "FAQ" },
};

const UI: Record<Locale, { scroll: string; lifetime: string; off: string; useCode: string; in: string; stats: string[] }> = {
  "pt-BR": {
    scroll: "role para explorar",
    lifetime: "Vitalício",
    off: "DE DESCONTO",
    useCode: "Use o código",
    in: "na ativação",
    stats: ["módulos de autonomia", "fps render 3D", "memória local", "mensalidades"],
  },
  en: {
    scroll: "scroll to explore",
    lifetime: "Lifetime",
    off: "OFF",
    useCode: "Use code",
    in: "at activation",
    stats: ["autonomy modules", "fps 3D render", "local memory", "monthly fees"],
  },
  es: {
    scroll: "desplázate para explorar",
    lifetime: "De por vida",
    off: "DE DESCUENTO",
    useCode: "Usa el código",
    in: "en la activación",
    stats: ["módulos de autonomía", "fps render 3D", "memoria local", "mensualidades"],
  },
};

const MARQUEE = [
  "LIP-SYNC 60FPS",
  "WAKE WORD LOCAL",
  "ZERO-TRUST",
  "17 AUTONOMY MODULES",
  "SCREEN VISION",
  "LOCAL-FIRST",
  "TENSORFLOW.JS",
  "SECRETS REDACTION",
];

/* ------------------------------------------------------------------ */
/*  Icons (hand-drawn stroke set)                                      */
/* ------------------------------------------------------------------ */

const ICON_PATHS: Record<string, ReactNode> = {
  eye: (
    <>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  window: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9h18M6.5 6.8h.01M9.5 6.8h.01" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0M8.5 10.5h7M8.5 14h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6h5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4A3.5 3.5 0 0 0 6 7.5c-1.7.5-3 2-3 3.9 0 1.4.7 2.6 1.8 3.3-.2.5-.3 1-.3 1.6A3.7 3.7 0 0 0 8.2 20c.6 0 1.2-.2 1.8-.5V4Z" />
      <path d="M14.5 4A3.5 3.5 0 0 1 18 7.5c1.7.5 3 2 3 3.9 0 1.4-.7 2.6-1.8 3.3.2.5.3 1 .3 1.6A3.7 3.7 0 0 1 15.8 20c-.6 0-1.2-.2-1.8-.5V4Z" />
    </>
  ),
  graph: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7.8 7.8 10.6 16M16.2 7.8 13.4 16M8.5 6h7" />
    </>
  ),
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5Z" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M6 8.5v7M18 11.5c0 3-3 3.5-5.5 4-2 .4-3.5 1-4.5 2" />
    </>
  ),
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2.5 3H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.5-3.5 2.7-5.5 5.5-5.5s5 2 5.5 5.5M16 5.2a3.2 3.2 0 0 1 0 5.9M17.8 14.9c1.6.8 2.5 2.6 2.7 5.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.5 3 7.7 7 9.8 4-2.1 7-5.3 7-9.8V5.8L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h3" />
    </>
  ),
  zap: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
  home: (
    <>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M6 9.5V20h12V9.5M10 20v-5.5h4V20" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.5" />
    </>
  ),
  firewall: (
    <>
      <path d="M12 3 5 5.8v5.4c0 4.5 3 7.7 7 9.8 4-2.1 7-5.3 7-9.8V5.8L12 3Z" />
      <path d="M5 12h14" />
    </>
  ),
  sandbox: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8.5 12 2.5 2.5 4.5-5M12 4v-0M4 8h16" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="14" r="4.5" />
      <path d="m11.5 10.5 8-8M16 6l3 3M13.5 8.5l2.5 2.5" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  logo: (
    <>
      <path d="M12 2.5 20.2 7v10L12 21.5 3.8 17V7L12 2.5Z" />
      <path d="M14.5 8.5H12a3 3 0 0 0 0 6h.8a3 3 0 0 1-2.4 2.7" />
    </>
  ),
};

function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICON_PATHS[name] || ICON_PATHS.check}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Hooks / micro components                                           */
/* ------------------------------------------------------------------ */

function useCountdown(endsAt: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!endsAt) return;
    if (typeof window === "undefined") return;
    const tick = () => {
      const d = new Date(endsAt).getTime() - Date.now();
      if (d <= 0) {
        setLabel("");
        return;
      }
      const days = Math.floor(d / 86400000);
      const h = Math.floor((d % 86400000) / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setLabel(days > 0 ? `${days}d ${h}h ${m}m` : `${h}h ${m}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return label;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") {
      setVal(to);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1500;
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const on = () => {
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
        if (ref.current) ref.current.style.transform = `scaleX(${p})`;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 right-0 h-[2px] z-[80] origin-left scale-x-0 bg-gradient-to-r from-neon via-neon to-lime pointer-events-none"
    />
  );
}

function LanguageSwitcher({
  locale,
  onLocale,
  size = "md",
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="glass flex items-center gap-0.5 rounded-full p-1">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => onLocale(l.code)}
          aria-pressed={locale === l.code}
          className={`${size === "md" ? "px-3 py-1.5 text-[11px]" : "px-2.5 py-1 text-[10px]"} font-mono tracking-widest rounded-full transition-all duration-300 ${
            locale === l.code
              ? "bg-lime text-void font-semibold shadow-[0_0_18px_rgba(200,255,77,0.4)]"
              : "text-mist hover:text-frost"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-2xl`}>
      <p
        data-reveal
        className="font-mono text-[11px] tracking-[0.35em] uppercase text-neon flex items-center gap-3 justify-start"
        style={align === "center" ? { justifyContent: "center" } : undefined}
      >
        <span className="w-8 h-px bg-neon/60 inline-block" />
        {eyebrow}
        {align === "center" && <span className="w-8 h-px bg-neon/60 inline-block" />}
      </p>
      <h2
        data-reveal
        style={{ "--d": "90ms" } as React.CSSProperties}
        className="font-display font-extrabold text-3xl md:text-5xl leading-[1.05] mt-5 tracking-tight"
      >
        {title}
      </h2>
      {sub && (
        <p
          data-reveal
          style={{ "--d": "180ms" } as React.CSSProperties}
          className="text-mist mt-5 text-base md:text-lg leading-relaxed"
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function Landing({ data: initialData }: { data?: LandingData }) {
  const [data, setData] = useState<LandingData>(
    initialData || {
      content: defaultContent,
      sections: defaultSections,
      media: defaultMedia,
      prices: defaultPrices,
      faq: defaultFaq,
      promo: null,
    }
  );

  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrency] = useState("USD");
  const [promoGone, setPromoGone] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number>(0);

  // Sync with prop or fetch live from Firestore if not provided
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    } else {
      fetchLandingData().then((liveData) => {
        setData(liveData);
      });
    }
  }, [initialData]);

  const meta = LOCALE_BY_CODE[locale];
  const ui = UI[locale];
  const nav = NAV[locale];
  const t = useCallback(
    (k: string) =>
      data.content[k]?.[locale] ||
      data.content[k]?.en ||
      defaultContent[k]?.[locale] ||
      defaultContent[k]?.en ||
      "",
    [data.content, locale],
  );

  /* boot: language + promo dismiss persistence */
  useEffect(() => {
    const l = detectLocale();
    setLocaleState(l);
    setCurrency(LOCALE_BY_CODE[l].currency);
    const dismissed = typeof window !== "undefined" && data.promo ? window.localStorage.getItem("jasper_promo_dismissed") === data.promo.code : false;
    setPromoGone(!data.promo || dismissed);
  }, [data.promo]);

  const setLocale = useCallback((l: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jasper_locale", l);
      document.documentElement.lang = l;
    }
    setLocaleState(l);
    setCurrency(LOCALE_BY_CODE[l].currency);
  }, []);

  const showPromo = !!(data.promo && !promoGone);
  const countdown = useCountdown(showPromo && data.promo ? data.promo.endsAt : null);

  useParallaxEngine([locale, showPromo]);
  useRevealEngine([locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);



  /* pricing math */
  const base = data.prices[currency] ?? data.prices.USD;
  const original = data.prices[`${currency}_original`] ?? data.prices.USD_original;
  const discount = data.promo ? data.promo.discountPercent : 0;
  const finalPrice = Math.round(base * (1 - discount / 100));
  const faqItems = data.faq?.[locale] || data.faq?.en || [];

  const dismissPromo = () => {
    if (data.promo && typeof window !== "undefined") {
      window.localStorage.setItem("jasper_promo_dismissed", data.promo.code);
    }
    setPromoGone(true);
  };

  const promoTitle = data.promo
    ? (data.promo.title[locale] || data.promo.title.en || "")
    : "";

  const s = data.sections;

  return (
    <div className="relative">
      <div className="noise-overlay" />
      <ScrollProgress />

      {/* ---------------- fixed header stack ---------------- */}
      <div className="fixed top-0 inset-x-0 z-50">
        {showPromo && data.promo && (
          <div className="relative bg-lime/10 border-b border-lime/25 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-center gap-3 font-mono text-[11px] tracking-wider">
              <span className="inline-flex items-center gap-1.5 text-lime">
                <Icon name="bolt" className="w-3.5 h-3.5" />
                <span className="font-semibold">{data.promo.code}</span>
                <span className="opacity-80">
                  {data.promo.discountPercent}% {ui.off}
                </span>
              </span>
              <span className="hidden sm:inline text-mist truncate">{promoTitle}</span>
              {countdown && (
                <span className="text-neon tabular-nums border border-neon/40 rounded-full px-2 py-0.5">
                  {countdown}
                </span>
              )}
              <button
                onClick={dismissPromo}
                aria-label="Dismiss"
                className="absolute right-3 text-mist hover:text-frost transition-colors"
              >
                <Icon name="x" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        <header
          className={`transition-all duration-500 ${
            scrolled ? "glass-deep border-b border-white/8" : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <a href="#top" className="flex items-center gap-2.5 group select-none">
              <span className="text-neon group-hover:drop-shadow-[0_0_10px_rgba(63,242,255,0.8)] transition-all">
                <Icon name="logo" className="w-8 h-8" />
              </span>
              <span className="font-display font-bold text-sm tracking-[0.18em]">
                JASPER<span className="text-neon">·HUD</span>
              </span>
            </a>

            <nav className="hidden lg:flex items-center gap-7 font-mono text-[11px] tracking-[0.22em] uppercase text-mist">
              {s.about && <a href="#about" className="hover:text-neon transition-colors">{nav.about}</a>}
              {s.modules && <a href="#modules" className="hover:text-neon transition-colors">{nav.modules}</a>}
              {s.security && <a href="#security" className="hover:text-neon transition-colors">{nav.security}</a>}
              {s.pricing && <a href="#pricing" className="hover:text-neon transition-colors">{nav.pricing}</a>}
              {s.faq && <a href="#faq" className="hover:text-neon transition-colors">{nav.faq}</a>}
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher locale={locale} onLocale={setLocale} />
              {s.pricing && (
                <a href="#pricing" className="btn-neon hidden md:inline-flex text-[11px] px-4 py-2.5 rounded-full">
                  {ui.lifetime}
                </a>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ---------------- HERO ---------------- */}
      <section id="top" className="relative min-h-[100svh] overflow-hidden flex flex-col">
        {/* layer 0 — far background */}
        <div data-plx="0.04" className="absolute inset-0 bg-grid opacity-70 pointer-events-none" />
        <div data-plx="0.07" className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full bg-neon/12 blur-[140px] pointer-events-none" />
        <div data-plx="0.1" className="absolute bottom-0 -right-44 w-[620px] h-[620px] rounded-full bg-lime/8 blur-[150px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-void via-void/60 to-transparent pointer-events-none" />

        {/* layer 1 — orbit ring */}
        <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" data-plx="0.09" data-depth="8">
          <svg viewBox="0 0 600 600" className="w-[min(110vw,680px)] h-[min(110vw,680px)] anim-spin-slow opacity-50">
            <circle cx="300" cy="300" r="292" fill="none" stroke="rgba(63,242,255,0.16)" strokeWidth="1" strokeDasharray="3 9" />
            <circle cx="300" cy="300" r="252" fill="none" stroke="rgba(63,242,255,0.1)" strokeWidth="1" strokeDasharray="60 140" />
            <circle cx="300" cy="8" r="4" fill="rgba(63,242,255,0.9)" />
            <circle cx="552" cy="300" r="3" fill="rgba(200,255,77,0.9)" />
          </svg>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-24 text-center">
          {/* layer 2 — avatar */}
          <div data-plx="0.05" data-depth="16" className="anim-floaty relative mb-2">
            <div className="absolute inset-0 -z-10 rounded-full bg-neon/25 blur-[70px] scale-125" />
            <img
              src={data.media.heroAvatar}
              alt="Jasper 3D avatar"
              className="w-[min(64vw,1080px)] select-none"
              draggable={false}
            />
          </div>

          {/* floating HUD chips (mouse-reactive) */}
          <div data-depth="34" className="hidden md:block absolute left-[7%] top-[30%]">
            <div className="glass hud-frame rounded-xl px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-neon flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime anim-pulse-soft" />
              LIP-SYNC · 60 FPS
            </div>
          </div>
          <div data-depth="26" className="hidden md:block absolute right-[6%] top-[42%]">
            <div className="glass hud-frame rounded-xl px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-frost flex items-center gap-2.5">
              <Icon name="globe" className="w-4 h-4 text-neon" />
              SCREEN VISION
            </div>
          </div>
          <div data-depth="40" className="hidden md:block absolute left-[13%] bottom-[24%]">
            <div className="glass hud-frame rounded-xl px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-frost flex items-center gap-2.5">
              <Icon name="lock" className="w-4 h-4 text-lime" />
              ZERO-TRUST · LOCAL
            </div>
          </div>
          <div data-depth="30" className="hidden lg:block absolute right-[12%] bottom-[30%]">
            <div className="glass hud-frame rounded-xl px-4 py-3 font-mono text-[10px] tracking-[0.22em] text-neon flex items-center gap-2.5">
              <Icon name="zap" className="w-4 h-4" />
              17 MODULES ONLINE
            </div>
          </div>

          {/* title block */}
          <div data-plx="0.14" className="mt-8">
            <p className="font-mono text-[11px] md:text-xs tracking-[0.4em] uppercase text-neon flex items-center gap-3 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neon anim-caret" />
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-6 font-display font-black leading-[0.95] tracking-tight">
              <span className="block text-stroke text-[clamp(2.6rem,9vw,7.5rem)]">{t("hero.title")}</span>
              <span className="block text-[clamp(2.6rem,9vw,7.5rem)] text-frost text-glow">
                {t("hero.accent")}
                <span className="text-neon">_</span>
              </span>
            </h1>
            <p className="max-w-xl mx-auto mt-7 text-mist text-base md:text-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#pricing" className="btn-neon text-xs md:text-sm px-8 py-4 rounded-full">
                {t("hero.cta")}
                <Icon name="arrow" className="w-4 h-4" />
              </a>
              <a href="#modules" className="btn-ghost font-mono text-xs tracking-[0.2em] px-8 py-4 rounded-full">
                {t("hero.ctaGhost")}
              </a>
            </div>
          </div>

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-mist">
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase">{ui.scroll}</span>
            <Icon name="chevron" className="w-4 h-4 anim-floaty" />
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-white/8 bg-abyss/60 backdrop-blur-md overflow-hidden py-3">
          <div className="anim-marquee flex w-max items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 font-mono text-[11px] tracking-[0.3em] text-mist whitespace-nowrap">
                {m}
                <span className="text-neon">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      {s.about && (
        <section id="about" className="relative py-28 md:py-40">
          <div data-plx="0.06" className="absolute right-0 top-1/4 w-[420px] h-[420px] rounded-full bg-neon/8 blur-[120px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHead eyebrow={t("about.eyebrow")} title={t("about.title")} align="left" />
              <p data-reveal style={{ "--d": "220ms" } as React.CSSProperties} className="text-mist mt-6 leading-relaxed">
                {t("about.body")}
              </p>
              <div className="mt-10 space-y-4">
                {["Electron + Vite + TypeScript", "Three.js r170 · UnrealBloomPass", "TensorFlow.js wake word · 0.85 threshold"].map(
                  (line, i) => (
                    <div key={line} data-reveal style={{ "--d": `${280 + i * 90}ms` } as React.CSSProperties} className="flex items-center gap-3 font-mono text-xs tracking-wider text-mist">
                      <span className="text-lime"><Icon name="check" className="w-4 h-4" /></span>
                      {line}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="relative">
              <div data-plx="0.13" className="glass-deep hud-frame scanlines rounded-2xl p-3 overflow-hidden glow-neon">
                <img src={data.media.hud} alt="Jasper HUD interface" className="rounded-xl w-full" />
              </div>
              <div data-depth="20" className="absolute -top-5 -right-3">
                <div className="glass rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-lime flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime anim-pulse-soft" /> 60 FPS
                </div>
              </div>
              <div data-depth="26" className="absolute -bottom-5 left-6">
                <div className="glass rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-neon">
                  FULL-DUPLEX VOICE
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- MODULES ---------------- */}
      {s.modules && (
        <section id="modules" className="relative py-28 md:py-36">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-abyss/70 to-transparent pointer-events-none" />
          <div data-plx="0.05" className="absolute left-[-200px] bottom-0 w-[500px] h-[500px] rounded-full bg-lime/6 blur-[130px] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4">
            <SectionHead eyebrow={t("modules.eyebrow")} title={t("modules.title")} sub={t("modules.subtitle")} />
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MODULES.map((m, i) => (
                <div
                  key={m.icon + i}
                  data-reveal
                  style={{ "--d": `${(i % 4) * 70}ms` } as React.CSSProperties}
                  className="group glass hud-frame rounded-2xl p-5 transition-all duration-300 hover:border-neon/40 hover:bg-neon/[0.04] hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-neon/80 group-hover:text-neon transition-colors">
                      <Icon name={m.icon} className="w-6 h-6" />
                    </span>
                    <span className="font-mono text-[10px] text-mist/60 tracking-[0.2em]">
                      {String(i + 1).padStart(2, "0")}/17
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold tracking-wide mt-4">{m.name[locale] || m.name.en}</h3>
                  <p className="text-mist text-[13px] leading-relaxed mt-2">{m.desc[locale] || m.desc.en}</p>
                </div>
              ))}
            </div>

            {/* stats band */}
            <div data-reveal className="mt-16 glass-deep hud-frame rounded-2xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5">
              {[
                { to: 17, suffix: "", label: ui.stats[0] },
                { to: 60, suffix: "", label: ui.stats[1] },
                { to: 100, suffix: "%", label: ui.stats[2] },
                { to: 0, suffix: "", label: ui.stats[3] },
              ].map((st) => (
                <div key={st.label} className="py-8 text-center px-4">
                  <p className="font-display font-black text-4xl md:text-5xl text-neon text-glow">
                    <Counter to={st.to} suffix={st.suffix} />
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-mist mt-3">{st.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- SECURITY ---------------- */}
      {s.security && (
        <section id="security" className="relative py-28 md:py-36 overflow-hidden">
          <div data-plx="0.08" className="absolute right-[-150px] top-10 w-[480px] h-[480px] rounded-full bg-neon/10 blur-[130px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-14 items-center">
              <div>
                <SectionHead eyebrow={t("security.eyebrow")} title={t("security.title")} align="left" />
                <p data-reveal style={{ "--d": "220ms" } as React.CSSProperties} className="text-mist mt-6 leading-relaxed">
                  {t("security.body")}
                </p>
                <div data-reveal style={{ "--d": "320ms" } as React.CSSProperties} className="mt-8 inline-flex items-center gap-3 glass rounded-full px-5 py-3 font-mono text-[11px] tracking-[0.25em] text-lime">
                  <Icon name="shield" className="w-4 h-4" />
                  REFLEXION GUARD ACTIVE
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: "lock", title: "DPAPI", d: { "pt-BR": "Credenciais cifradas no disco", en: "Credentials encrypted on disk", es: "Credenciales cifradas en disco" } },
                  { icon: "firewall", title: "ANTI-SSRF", d: { "pt-BR": "Firewall em webhooks e rede", en: "Firewall on webhooks and network", es: "Firewall en webhooks y red" } },
                  { icon: "sandbox", title: "SANDBOX", d: { "pt-BR": "Execução isolada de código", en: "Isolated code execution", es: "Ejecución aislada de código" } },
                  { icon: "check", title: "APPROVAL", d: { "pt-BR": "Alto risco pede OK na tela", en: "High-risk demands on-screen OK", es: "Alto riesgo pide OK en pantalla" } },
                ].map((it, i) => (
                  <div
                    key={it.title}
                    data-reveal
                    style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                    className="glass rounded-2xl p-6 transition-all duration-300 hover:border-lime/40 hover:-translate-y-1"
                  >
                    <span className="text-lime"><Icon name={it.icon} className="w-7 h-7" /></span>
                    <h3 className="font-display font-bold text-sm tracking-[0.15em] mt-4">{it.title}</h3>
                    <p className="text-mist text-[13px] mt-2 leading-relaxed">{it.d[locale] || it.d.en}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- PRICING ---------------- */}
      {s.pricing && (
        <section id="pricing" className="relative py-28 md:py-40">
          <div data-plx="0.05" className="absolute left-1/2 -translate-x-1/2 top-10 w-[700px] h-[420px] rounded-full bg-neon/10 blur-[140px] pointer-events-none" />
          <div className="max-w-3xl mx-auto px-4">
            <SectionHead eyebrow={t("pricing.eyebrow")} title={t("pricing.title")} sub={t("pricing.subtitle")} />

            <div data-reveal style={{ "--d": "200ms" } as React.CSSProperties} className="mt-14">
              <div className="glass-deep hud-frame scanlines rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-lime/10 blur-[90px] pointer-events-none" />

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-lime border border-lime/40 rounded-full px-4 py-2">
                    <Icon name="key" className="w-4 h-4" />
                    {ui.lifetime.toUpperCase()}
                  </span>
                  {meta.currencies.length > 1 && (
                    <div className="glass flex items-center gap-1 rounded-full p-1">
                      {meta.currencies.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCurrency(c)}
                          className={`font-mono text-[11px] px-3 py-1.5 rounded-full transition-all ${
                            currency === c ? "bg-neon text-void font-semibold" : "text-mist hover:text-frost"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-end gap-5 flex-wrap">
                  <span className="font-display font-black text-6xl md:text-7xl tracking-tight text-frost text-glow">
                    {formatMoney(finalPrice, currency, meta.intl)}
                  </span>
                  <div className="pb-2">
                    <span className="block font-mono text-sm text-mist/60 line-through">{formatMoney(original, currency, meta.intl)}</span>
                    {discount > 0 && (
                      <span className="font-mono text-[11px] text-lime tracking-[0.2em]">
                        −{discount}% {ui.off}
                      </span>
                    )}
                  </div>
                </div>

                {data.promo && discount > 0 && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-lime/30 bg-lime/[0.06] px-5 py-4">
                    <span className="font-mono text-sm text-lime font-semibold tracking-[0.2em]">{data.promo.code}</span>
                    <span className="text-mist text-[13px]">
                      {ui.useCode} <span className="text-frost font-semibold">{data.promo.code}</span> {ui.in}
                      {countdown && <span className="text-neon ml-2 tabular-nums">· {countdown}</span>}
                    </span>
                  </div>
                )}

                <ul className="mt-8 space-y-3.5">
                  {["pricing.included.1", "pricing.included.2", "pricing.included.3", "pricing.included.4"].map((k) => (
                    <li key={k} className="flex items-start gap-3 text-[15px] text-frost/90">
                      <span className="text-lime mt-0.5 shrink-0"><Icon name="check" className="w-4.5 h-4.5" /></span>
                      {t(k)}
                    </li>
                  ))}
                </ul>

                <a
                  href="#top"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="btn-neon w-full mt-10 text-sm px-8 py-5 rounded-2xl tracking-[0.08em]"
                >
                  {t("pricing.cta")}
                  <Icon name="arrow" className="w-4 h-4" />
                </a>
                <p className="mt-5 text-center font-mono text-[10px] tracking-[0.18em] text-mist/70 uppercase">
                  {t("pricing.guarantee")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- FAQ ---------------- */}
      {s.faq && faqItems.length > 0 && (
        <section id="faq" className="relative py-28 md:py-36">
          <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[0.8fr_1.2fr] gap-14">
            <div className="lg:sticky lg:top-32 self-start">
              <SectionHead eyebrow={t("faq.eyebrow")} title={t("faq.title")} align="left" />
            </div>
            <div data-reveal className="space-y-3">
              {faqItems.map((f, i) => (
                <div
                  key={i}
                  className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
                    faqOpen === i ? "border-neon/40 shadow-[0_0_24px_rgba(63,242,255,0.07)]" : "hover:border-white/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer select-none"
                  >
                    <span className="font-display text-sm md:text-[15px] font-bold tracking-wide text-frost">{f.q}</span>
                    <span className={`text-neon transition-transform duration-300 shrink-0 ${faqOpen === i ? "rotate-180" : ""}`}>
                      <Icon name="chevron" className="w-5 h-5" />
                    </span>
                  </button>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: faqOpen === i ? "1fr" : "0fr",
                      transition: "grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div style={{ overflow: "hidden" }}>
                      <p className="px-6 pb-6 text-mist text-[15px] leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- FINAL CTA ---------------- */}
      {s.final && (
        <section className="relative py-32 md:py-44 overflow-hidden">
          <div data-plx="0.06" className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
          <div data-plx="0.12" className="absolute left-1/2 -translate-x-1/2 bottom-[-200px] w-[800px] h-[500px] rounded-full bg-neon/12 blur-[140px] pointer-events-none" />
          <div className="relative text-center px-4 max-w-4xl mx-auto">
            <h2 data-reveal className="font-display font-black leading-[0.98] text-[clamp(2.2rem,7vw,5.5rem)] tracking-tight">
              <span className="text-stroke block">{t("final.title")}</span>
              <span className="block text-lime mt-2">
                {ui.lifetime.toUpperCase()}<span className="text-frost anim-caret">_</span>
              </span>
            </h2>
            <p data-reveal style={{ "--d": "140ms" } as React.CSSProperties} className="text-mist mt-8 text-lg max-w-xl mx-auto">
              {t("final.body")}
            </p>
            <div data-reveal style={{ "--d": "260ms" } as React.CSSProperties} className="mt-10">
              <a href="#pricing" className="btn-neon text-sm px-10 py-5 rounded-full">
                {t("final.cta")}
                <Icon name="arrow" className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- FOOTER ---------------- */}
      <footer className="relative border-t border-white/8 bg-abyss/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-neon"><Icon name="logo" className="w-7 h-7" /></span>
            <div>
              <p className="font-display font-bold text-xs tracking-[0.18em]">JASPER·HUD</p>
              <p className="text-mist/70 text-[11px] mt-1 max-w-sm">{t("footer.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <LanguageSwitcher locale={locale} onLocale={setLocale} size="sm" />
            <span className="font-mono text-[10px] text-mist/50">© 2026 JASPER AVATAR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

