import React, { useEffect, useRef, useState } from "react";

// Ambianță Halloween: jăratic plutitor, un liliac ocazional, ceață joasă, dovleac fotorealist
export default function Ambience() {
  const canvasRef = useRef(null);
  const [batKey, setBatKey] = useState(null);

  // jăratic — puține scântei, derive lentă în sus
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    const N = mobile ? 14 : 28; // densitate redusă pe mobil
    const sparks = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: H * 0.4 + Math.random() * H * 0.6,
      r: (0.5 + Math.random() * 1.1) * dpr,
      vy: (0.12 + Math.random() * 0.3) * dpr,
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
        const glow = 0.35 + 0.3 * Math.sin(t * 2 * s.fl + s.ph);
        ctx.globalAlpha = Math.max(0.06, glow);
        ctx.fillStyle = "#F59042";
        ctx.shadowColor = "rgba(232,115,26,.9)";
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

  // liliac ocazional — la 20–40s, mic și rapid
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer, cleanup;
    const schedule = () => {
      timer = setTimeout(() => {
        setBatKey(Date.now());
        cleanup = setTimeout(() => setBatKey(null), 6000);
        schedule();
      }, 20000 + Math.random() * 20000);
    };
    schedule();
    return () => { clearTimeout(timer); clearTimeout(cleanup); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true" data-testid="embers" />
      <div className="ground-fog" aria-hidden="true" />

      {/* dovleacul — colț stânga-jos, parțial tăiat de margine, lumânare pâlpâitoare */}
      <div className="fixed -left-10 -bottom-8 z-[2] w-44 sm:w-56 pointer-events-none select-none" aria-hidden="true" data-testid="pumpkin">
        <div
          className="absolute inset-0 candle-flicker rounded-full"
          style={{ background: "radial-gradient(circle at 50% 60%, rgba(232,115,26,.34), transparent 65%)", transform: "scale(1.4)" }}
        />
        <img
          src="/halloween/pumpkin.png"
          alt=""
          className="relative w-full candle-flicker"
          style={{ mixBlendMode: "screen", filter: "saturate(1.05)" }}
        />
      </div>

      {/* liliac */}
      {batKey && (
        <div key={batKey} className="fixed top-[8%] left-0 z-[3] pointer-events-none bat-flight" aria-hidden="true" data-testid="bat">
          <svg width="46" height="20" viewBox="0 0 46 20" fill="#0A0907" stroke="rgba(237,230,214,.25)" strokeWidth="0.5" className="bat-wings">
            <path d="M23 10 C20 4 14 1 8 2 C11 5 11 7 9 9 C12 9 14 10 15 12 C17 10 19 10 23 13 C27 10 29 10 31 12 C32 10 34 9 37 9 C35 7 35 5 38 2 C32 1 26 4 23 10 Z" />
          </svg>
        </div>
      )}
    </>
  );
}
