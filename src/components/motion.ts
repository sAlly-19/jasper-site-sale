import { useEffect } from "react";

/**
 * Layered parallax engine adaptado para Web.
 * - Elements marked [data-plx="0.05..0.4"] drift against scroll.
 * - Elements with [data-depth="N"] react to the mouse.
 */
export function useParallaxEngine(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    interface Layer {
      el: HTMLElement;
      speed: number;
      depth: number;
      top: number;
      height: number;
      lastX: number;
      lastY: number;
    }
    let layers: Layer[] = [];
    let raf = 0;
    let running = true;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let measureTimer: number | undefined;

    const measure = () => {
      layers = Array.from(
        document.querySelectorAll<HTMLElement>("[data-plx], [data-depth]"),
      ).map((el) => {
        let top = 0;
        let n: HTMLElement | null = el;
        while (n) {
          top += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        return {
          el,
          speed: parseFloat(el.dataset.plx || "0.1"),
          depth: parseFloat(el.dataset.depth || "0"),
          top,
          height: el.offsetHeight || 1,
          lastX: NaN,
          lastY: NaN,
        };
      });
    };

    const remeasureSoon = () => {
      window.clearTimeout(measureTimer);
      measureTimer = window.setTimeout(measure, 120);
    };

    const tick = () => {
      if (!running) return;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      for (const l of layers) {
        const progress = sy + vh / 2 - (l.top + l.height / 2);
        const y = progress * l.speed + my * l.depth * 0.6;
        const x = -mx * l.depth;
        const ny = Math.round(y * 100) / 100;
        const nx = Math.round(x * 100) / 100;
        if (ny !== l.lastY || nx !== l.lastX) {
          l.lastY = ny;
          l.lastX = nx;
          l.el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      }
    };

    measure();
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("resize", remeasureSoon, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    let ro: ResizeObserver | undefined;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(remeasureSoon);
      ro.observe(document.body);
    }
    const onLoad = () => measure();
    window.addEventListener("load", onLoad);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(measureTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", remeasureSoon);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("load", onLoad);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Scroll reveals for [data-reveal] with --d stagger delay. */
export function useRevealEngine(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

