import Lenis from "lenis";
import { getA11y } from "@/lib/a11y";

let lenis = null;

// Lenis smooth scroll — doar desktop, respectă prefers-reduced-motion și Setări → Accesibilitate
export function initSmoothScroll() {
  if (lenis) return lenis;
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  if (getA11y().rm) return null;
  if (window.innerWidth < 768) return null;
  lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
  const raf = (time) => { lenis?.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  return lenis;
}

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { immediate: true });
  else window.scrollTo(0, y);
}
