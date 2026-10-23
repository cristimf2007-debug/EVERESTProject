import React, { useEffect, useRef } from "react";

// Ninsoare fină de iarnă — identitatea clasică BIOXIC
export default function Snowfall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    const N = Math.min(120, Math.floor(window.innerWidth / 9));
    for (let i = 0; i < N; i++) {
      const z = Math.random();
      flakes.push({ x: Math.random() * W, y: Math.random() * H, z, r: (0.6 + z * 2.2) * dpr, vy: (0.25 + z * 1.1) * dpr, ph: Math.random() * 6.28 });
    }
    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(234,242,237,0.8)";
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(t + f.ph) * 0.35 * dpr;
        if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; }
        ctx.globalAlpha = 0.25 + f.z * 0.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" data-testid="snowfall" />;
}
