import React, { useEffect, useRef } from "react";

// Ambianță Obsidian: jăratic fin care plutește + fum discret care urcă. Nimic desenat/cartoonish.
export default function Ambience() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("a11y-rm")) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mobile = window.innerWidth < 768;
    let W, H, raf;
    const size = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);
    const N = mobile ? 10 : 18;
    const sparks = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: H * 0.4 + Math.random() * H * 0.6,
      r: (0.5 + Math.random() * 1.1) * dpr,
      vy: (0.1 + Math.random() * 0.26) * dpr,
      ph: Math.random() * 6.28,
      fl: 0.5 + Math.random(),
    }));
    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const s of sparks) {
        s.y -= s.vy;
        s.x += Math.sin(t * s.fl + s.ph) * 0.25 * dpr;
        if (s.y < -8) { s.y = H + 8; s.x = Math.random() * W; }
        const glow = 0.3 + 0.28 * Math.sin(t * 2 * s.fl + s.ph);
        ctx.globalAlpha = Math.max(0.05, glow);
        ctx.fillStyle = "#FFA050";
        ctx.shadowColor = "rgba(255,122,26,.9)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.28);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" data-testid="embers" />
      <div className="smoke-wisp" aria-hidden="true" />
      <div className="smoke-wisp" style={{ left: "auto", right: "-15vw", animationDelay: "-18s", animationDuration: "54s" }} aria-hidden="true" />
    </>
  );
}
