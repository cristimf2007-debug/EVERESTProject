import React, { useEffect, useRef } from "react";

// Fundal interactiv pentru zona video: praf fin obsidian + scântei flame care se dau deoparte
// la cursor/touch, cu inerție + paralaxă la scroll. Se oprește când tabul e ascuns sau video e fullscreen.
export default function VideoDust({ density = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("a11y-rm")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const mobile = window.innerWidth < 768;
    let W, H, raf;
    const size = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);

    const N = Math.round((mobile ? 110 : 240) * density);
    const ps = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: 0, vy: 0,
      r: (0.5 + Math.random() * 1.4) * dpr,
      flame: Math.random() < 0.12,
      ph: Math.random() * 6.28,
      fl: 0.4 + Math.random(),
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      mouse.x = p.clientX * dpr;
      mouse.y = p.clientY * dpr;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    let boostUntil = 0;
    const onBoost = () => { boostUntil = performance.now() + 1500; };
    window.addEventListener("bioxic:dust-boost", onBoost);

    let scrollY = window.scrollY;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    let t = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      // pauză completă când tabul e ascuns sau un video e fullscreen
      if (document.hidden || document.fullscreenElement) return;
      t += 0.016;
      const now = performance.now();
      const boost = now < boostUntil ? 1.8 : 1;
      ctx.clearRect(0, 0, W, H);
      const par = scrollY * 0.05 * dpr;
      const R = 150 * dpr;
      for (const p of ps) {
        // respingerе de cursor cu inerție
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 1) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 1.7 * dpr;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx + Math.sin(t * p.fl + p.ph) * 0.12 * dpr;
        p.y += p.vy + Math.cos(t * p.fl * 0.8 + p.ph) * 0.1 * dpr - 0.05 * dpr;
        // wrap + paralaxă discretă
        let yy = p.y - par % H;
        if (yy < -8) { p.y += H; yy += H; }
        if (yy > H + 8) { p.y -= H; yy -= H; }
        if (p.x < -8) p.x += W;
        if (p.x > W + 8) p.x -= W;
        const tw = 0.5 + 0.5 * Math.sin(t * 2 * p.fl + p.ph);
        const a = (p.flame ? 0.5 : 0.16) * (0.4 + tw * 0.6) * boost;
        ctx.globalAlpha = Math.min(1, a);
        ctx.fillStyle = p.flame ? "#FF7A1A" : "#9A968F";
        if (p.flame) { ctx.shadowColor = "rgba(255,122,26,.8)"; ctx.shadowBlur = 7 * dpr * boost; }
        ctx.beginPath();
        ctx.arc(p.x, yy, p.r * boost, 0, 6.28);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("bioxic:dust-boost", onBoost);
      window.removeEventListener("scroll", onScroll);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true" data-testid="video-dust" />;
}
