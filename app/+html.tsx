import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
        />

        {/* Google Fonts: Unbounded, Space Grotesk, JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Tailwind CSS Play CDN for instant zero-config Tailwind utility rendering on Expo Web */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  void: '#04060c',
                  abyss: '#070b14',
                  panel: '#0b1220',
                  neon: '#3ff2ff',
                  lime: '#c8ff4d',
                  mist: '#8ea3bc',
                  frost: '#eaf3fa',
                },
                fontFamily: {
                  display: ['Unbounded', 'system-ui', 'sans-serif'],
                  body: ['Space Grotesk', 'system-ui', 'sans-serif'],
                  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
                }
              }
            }
          }
        `}} />

        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-display: "Unbounded", system-ui, sans-serif;
            --font-body: "Space Grotesk", system-ui, sans-serif;
            --font-mono: "JetBrains Mono", ui-monospace, monospace;

            --color-void: #04060c;
            --color-abyss: #070b14;
            --color-panel: #0b1220;
            --color-neon: #3ff2ff;
            --color-lime: #c8ff4d;
            --color-mist: #8ea3bc;
            --color-frost: #eaf3fa;
          }

          html {
            scroll-behavior: smooth;
            height: auto !important;
            min-height: 100%;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }

          body {
            background: #04060c !important;
            color: #eaf3fa;
            font-family: var(--font-body);
            margin: 0;
            padding: 0;
            height: auto !important;
            min-height: 100%;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }

          #root {
            min-height: 100%;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: visible !important;
          }

          #root > div,
          #root > div > div,
          #root > div > div > div {
            min-height: 100%;
            height: auto !important;
            flex: 1 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: visible !important;
          }

          ::selection {
            background: rgba(63, 242, 255, 0.28);
            color: #eaf3fa;
          }

          ::-webkit-scrollbar {
            width: 9px;
          }
          ::-webkit-scrollbar-track {
            background: #05080f;
          }
          ::-webkit-scrollbar-thumb {
            background: #1a2637;
            border-radius: 99px;
            border: 2px solid #05080f;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #2b3f58;
          }

          /* ---------------- glassmorphism ---------------- */
          .glass {
            background: linear-gradient(155deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
            border: 1px solid rgba(255, 255, 255, 0.09);
            backdrop-filter: blur(18px) saturate(1.2);
            -webkit-backdrop-filter: blur(18px) saturate(1.2);
          }
          .glass-deep {
            background: linear-gradient(160deg, rgba(13, 21, 36, 0.82), rgba(7, 11, 20, 0.66));
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(26px) saturate(1.25);
            -webkit-backdrop-filter: blur(26px) saturate(1.25);
          }

          /* HUD corner brackets */
          .hud-frame {
            position: relative;
          }
          .hud-frame::before,
          .hud-frame::after {
            content: "";
            position: absolute;
            width: 18px;
            height: 18px;
            border-color: rgba(63, 242, 255, 0.65);
            border-style: solid;
            pointer-events: none;
          }
          .hud-frame::before {
            top: -1px;
            left: -1px;
            border-width: 1.5px 0 0 1.5px;
          }
          .hud-frame::after {
            bottom: -1px;
            right: -1px;
            border-width: 0 1.5px 1.5px 0;
          }

          /* outlined display text */
          .text-stroke {
            -webkit-text-stroke: 1.5px rgba(234, 243, 250, 0.4);
            color: transparent;
          }
          .text-stroke-neon {
            -webkit-text-stroke: 1.5px rgba(63, 242, 255, 0.55);
            color: transparent;
          }

          /* background grid + noise */
          .bg-grid {
            background-image: linear-gradient(rgba(63, 242, 255, 0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(63, 242, 255, 0.045) 1px, transparent 1px);
            background-size: 58px 58px;
          }
          .noise-overlay {
            position: fixed;
            inset: 0;
            z-index: 70;
            pointer-events: none;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }
          .scanlines::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: repeating-linear-gradient(
              0deg,
              rgba(255, 255, 255, 0.022) 0px,
              rgba(255, 255, 255, 0.022) 1px,
              transparent 1px,
              transparent 4px
            );
            border-radius: inherit;
          }

          /* glow helpers */
          .glow-neon {
            box-shadow: 0 0 24px rgba(63, 242, 255, 0.22), 0 0 90px rgba(63, 242, 255, 0.08);
          }
          .glow-lime {
            box-shadow: 0 0 22px rgba(200, 255, 77, 0.28), 0 0 80px rgba(200, 255, 77, 0.1);
          }
          .text-glow {
            text-shadow: 0 0 34px rgba(63, 242, 255, 0.45);
          }

          /* ---------------- buttons & fields ---------------- */
          .btn-neon {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            background: var(--color-lime);
            color: #0a0f04;
            font-family: var(--font-display);
            font-weight: 700;
            letter-spacing: 0.04em;
            border: 1px solid rgba(200, 255, 77, 0.9);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s;
            cursor: pointer;
            text-decoration: none;
          }
          .btn-neon:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 40px rgba(200, 255, 77, 0.35);
          }
          .btn-neon:active {
            transform: translateY(0);
          }
          .btn-ghost {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            border: 1px solid rgba(255, 255, 255, 0.16);
            color: var(--color-frost);
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            transition: border-color 0.25s, background 0.25s, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            text-decoration: none;
          }
          .btn-ghost:hover {
            border-color: rgba(63, 242, 255, 0.55);
            background: rgba(63, 242, 255, 0.06);
            transform: translateY(-2px);
          }

          .field {
            width: 100%;
            background: rgba(255, 255, 255, 0.035);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: var(--color-frost);
            padding: 0.65rem 0.9rem;
            border-radius: 10px;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s, background 0.2s;
          }
          .field:focus {
            border-color: rgba(63, 242, 255, 0.6);
            background: rgba(63, 242, 255, 0.04);
          }
          .field::placeholder {
            color: rgba(142, 163, 188, 0.5);
          }
          label.lbl {
            display: block;
            font-family: var(--font-mono);
            font-size: 0.62rem;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--color-mist);
            margin-bottom: 0.4rem;
          }

          /* ---------------- reveal ---------------- */
          [data-reveal] {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
            transition-delay: var(--d, 0ms);
            will-change: opacity, transform;
          }
          [data-reveal].in {
            opacity: 1;
            transform: translateY(0);
          }

          /* parallax layers */
          [data-plx] {
            will-change: transform;
          }

          /* ---------------- keyframes ---------------- */
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
          @keyframes floaty {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-14px);
            }
          }
          @keyframes spin-slow {
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes pulse-soft {
            0%,
            100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
          @keyframes blink-caret {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0;
            }
          }

          .anim-marquee {
            animation: marquee 34s linear infinite;
          }
          .anim-marquee:hover {
            animation-play-state: paused;
          }
          .anim-floaty {
            animation: floaty 7s ease-in-out infinite;
          }
          .anim-spin-slow {
            animation: spin-slow 28s linear infinite;
          }
          .anim-pulse-soft {
            animation: pulse-soft 3.2s ease-in-out infinite;
          }
          .anim-caret {
            animation: blink-caret 1.1s step-end infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            html {
              scroll-behavior: auto;
            }
            .anim-marquee,
            .anim-floaty,
            .anim-spin-slow,
            .anim-pulse-soft,
            .anim-caret {
              animation: none;
            }
            [data-reveal] {
              opacity: 1;
              transform: none;
              transition: none;
            }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
