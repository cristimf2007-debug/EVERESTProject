import React, { useEffect, useRef } from "react";

export default function Snowfall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W, H, raf;
    const flakes = [];
    const size = () => {
      W = canvas.width = window.innerWidth * dpr;
      H = canvas.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener("resize", size);
    const N = Math.min(160, Math.floor(window.innerWidth / 7));
    for (let i = 0; i < N; i++) {
      const z = Math.random();
      flakes.push({ x: Math.random() * W, y: Math.random() * H, z, r: (0.6 + z * 2.4) * dpr, vy: (0.3 + z * 1.2) * dpr, ph: Math.random() * 6.28 });
    }
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        if (!reduce) {
          f.y += f.vy;
          f.x += Math.sin(t / 1400 + f.ph) * 0.35 * dpr * (0.4 + f.z);
          if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.25 + f.z * 0.6})`;
        ctx.shadowBlur = f.z > 0.85 ? 6 * dpr : 0;
        ctx.shadowColor = "rgba(255,255,255,.8)";
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none w-full h-full" data-testid="snowfall-canvas" aria-hidden="true" />;
}
