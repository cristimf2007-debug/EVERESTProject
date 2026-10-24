import React, { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import { ensureAnalyser, resumeAudioCtx } from "@/lib/audioViz";

const BARS = 112; // bare radiale (oglindite stânga/dreapta, bas jos)
const MODES = [
  { k: "ring", label: "Ring" },
  { k: "liquid", label: "Liquid" },
  { k: "minimal", label: "Minimal" },
];

// Vinilul care bate: rotație 33⅓ rpm cu inerție, spectrum circular pe canvas (60fps),
// peak-hold, puls pe kick (20–150Hz, prag adaptiv), particule la kick-uri tari.
export default function SpectrumVinyl({ cover, title, accent, onKick, onBpm }) {
  const { audioRef, playing } = useRadio();
  const [mode, setMode] = useState(() => localStorage.getItem("bioxic_viz_mode") || "ring");
  const wrapSizeRef = useRef(null);
  const discRef = useRef(null);
  const glowRef = useRef(null);
  const canvasRef = useRef(null);
  const anRef = useRef(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const angleRef = useRef(0);
  const velRef = useRef(0);
  const pulseUntilRef = useRef(0);
  const peaksRef = useRef(new Float32Array(BARS / 2));
  const bassAvgRef = useRef(0.12);
  const lastKickRef = useRef(0);
  const kickTimesRef = useRef([]);
  const particlesRef = useRef([]);
  const simTRef = useRef(0);
  const zeroFramesRef = useRef(0);
  const lastBpmSentRef = useRef(0);
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onKickRef = useRef(onKick);
  onKickRef.current = onKick;
  const onBpmRef = useRef(onBpm);
  onBpmRef.current = onBpm;

  // conectează analyserul la primul play (user gesture)
  useEffect(() => {
    if (!playing || anRef.current) return;
    const v = ensureAnalyser(audioRef.current);
    if (v) { anRef.current = v; resumeAudioCtx(); }
  }, [playing, audioRef]);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-rm");

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const effMode = reduced ? "minimal" : modeRef.current;

      // --- rotație vinyl cu inerție (33⅓ rpm ≈ 200°/s, frânare lină la pauză) ---
      const target = playingRef.current ? 200 : 0;
      velRef.current += (target - velRef.current) * Math.min(1, dt * 1.8);
      angleRef.current = (angleRef.current + velRef.current * dt) % 360;
      const pulseLeft = pulseUntilRef.current - now;
      const scale = pulseLeft > 0 ? 1 + 0.035 * (pulseLeft / 120) : 1;
      if (discRef.current) discRef.current.style.transform = `rotate(${angleRef.current}deg) scale(${scale})`;

      // --- date audio reale sau simulare BPM dacă analyserul nu poate citi streamul ---
      let freqData = null;
      let timeData = null;
      let bass = 0;
      const an = anRef.current;
      if (an && playingRef.current) {
        an.analyser.getByteFrequencyData(an.freq);
        let sum = 0;
        for (let i = 1; i <= 6; i++) sum += an.freq[i]; // ~20–150Hz
        bass = sum / (6 * 255);
        zeroFramesRef.current = bass < 0.005 ? zeroFramesRef.current + 1 : 0;
        if (zeroFramesRef.current < 90) { freqData = an.freq; timeData = an.time; if (timeData) an.analyser.getByteTimeDomainData(timeData); }
      }
      if (!freqData) {
        // fallback: animație moale sincronizată la ~122 BPM, nu bare goale
        simTRef.current += dt;
        const bt = simTRef.current * (122 / 60);
        bass = Math.pow(Math.max(0, Math.sin(bt * Math.PI)), 3) * 0.55 + 0.1;
      }

      // --- beat detection: prag adaptiv pe energia de bas ---
      bassAvgRef.current = bassAvgRef.current * 0.96 + bass * 0.04;
      if (bass > bassAvgRef.current * 1.4 && bass > 0.16 && now - lastKickRef.current > 190) {
        lastKickRef.current = now;
        pulseUntilRef.current = now + 120;
        if (glowRef.current) {
          glowRef.current.style.opacity = "1";
          setTimeout(() => { if (glowRef.current) glowRef.current.style.opacity = ""; }, 150);
        }
        const kt = kickTimesRef.current;
        kt.push(now);
        if (kt.length > 8) kt.shift();
        if (kt.length >= 4 && now - lastBpmSentRef.current > 1500) {
          lastBpmSentRef.current = now;
          const ints = kt.slice(1).map((t2, i) => t2 - kt[i]);
          const avg = ints.reduce((s, x) => s + x, 0) / ints.length;
          let bpm = Math.round(60000 / avg);
          while (bpm > 200) bpm = Math.round(bpm / 2);
          while (bpm < 60) bpm *= 2;
          onBpmRef.current?.(bpm);
        }
        if (bass > bassAvgRef.current * 1.75 && particlesRef.current.length < 40 && effMode === "ring") {
          for (let i = 0; i < 4; i++) {
            particlesRef.current.push({
              a: Math.random() * 6.28, r: 0.62, sp: 0.5 + Math.random() * 0.7,
              life: 1, size: 1 + Math.random() * 2,
            });
          }
        }
        onKickRef.current?.(bass);
      }

      // --- desenare canvas ---
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth * dpr;
      const H = canvas.clientHeight * dpr;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const discR = (Math.min(W, H) / 2) * 0.64; // discul ocupă ~64% din canvas
      const acc = accentRef.current || { r: 255, g: 122, b: 26 };

      // glow care pulsează
      if (glowRef.current) {
        const g = 0.3 + bass * 0.9;
        glowRef.current.style.background = `radial-gradient(circle, rgba(${acc.r},${acc.g},${acc.b},${Math.min(0.5, g * 0.5)}), transparent 62%)`;
      }

      if (effMode !== "minimal") {
        const half = BARS / 2;
        const maxH = discR * 0.42;
        ctx.lineCap = "round";
        const peaks = peaksRef.current;
        for (let j = 0; j < half; j++) {
          let v;
          if (freqData) {
            const fi = Math.floor(Math.pow(j / half, 2.1) * (freqData.length * 0.45)) + 1;
            v = freqData[Math.min(fi, freqData.length - 1)] / 255;
          } else {
            v = Math.max(0, Math.sin(simTRef.current * 3 + j * 0.32)) * 0.4 + bass * 0.5 * Math.max(0, 1 - j / 8);
          }
          const h = Math.max(2 * dpr, v * maxH);
          peaks[j] = Math.max(peaks[j] - dt * maxH * 0.55, h); // peak-hold cade încet
          // j=0 bas jos; urcă pe ambele părți (oglindit)
          const spread = (j / half) * Math.PI * 0.94;
          for (const sgn of [-1, 1]) {
            const a = Math.PI / 2 + sgn * spread; // jos + spre stânga/dreapta
            const ca = Math.cos(a), sa = Math.sin(a);
            const r0 = discR * 1.06;
            const x0 = cx + ca * r0, y0 = cy + sa * r0;
            const x1 = cx + ca * (r0 + h), y1 = cy + sa * (r0 + h);
            const w = Math.min(1, v * 1.4);
            ctx.strokeStyle = `rgba(${Math.round(acc.r + (255 - acc.r) * w)},${Math.round(acc.g + (255 - acc.g) * w)},${Math.round(acc.b + (255 - acc.b) * w)},${0.35 + v * 0.65})`;
            ctx.lineWidth = 2.2 * dpr;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            // peak-hold dot
            const px = cx + ca * (r0 + peaks[j] + 4 * dpr), py = cy + sa * (r0 + peaks[j] + 4 * dpr);
            ctx.fillStyle = `rgba(255,255,255,${0.25 + v * 0.4})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.3 * dpr, 0, 6.28);
            ctx.fill();
          }
        }

        // inel lichid (waveform) — fin în ring, principal în liquid
        const pts = 128;
        const amp = effMode === "liquid" ? discR * 0.16 : discR * 0.05;
        const lr = discR * (effMode === "liquid" ? 1.12 : 1.02);
        ctx.strokeStyle = `rgba(${acc.r},${acc.g},${acc.b},${effMode === "liquid" ? 0.85 : 0.4})`;
        ctx.lineWidth = (effMode === "liquid" ? 2.4 : 1.2) * dpr;
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
          let wv;
          if (timeData) wv = (timeData[Math.floor((i / pts) * timeData.length)] - 128) / 128;
          else wv = Math.sin(simTRef.current * 4 + i * 0.4) * bass;
          const rr = lr + wv * amp * (1 + bass);
          const a = (i / pts) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const pa = ((i - 0.5) / pts) * Math.PI * 2 - Math.PI / 2;
            ctx.quadraticCurveTo(cx + Math.cos(pa) * rr, cy + Math.sin(pa) * rr, x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      // particule la kick-uri tari
      if (particlesRef.current.length) {
        const R0 = discR * 0.62;
        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
        for (const p of particlesRef.current) {
          p.r += p.sp * dt * 0.55;
          p.life -= dt * 1.1;
          const x = cx + Math.cos(p.a) * R0 * (1 + p.r);
          const y = cy + Math.sin(p.a) * R0 * (1 + p.r);
          ctx.globalAlpha = Math.max(0, p.life) * 0.9;
          ctx.fillStyle = `rgb(${acc.r},${acc.g},${acc.b})`;
          ctx.beginPath();
          ctx.arc(x, y, p.size * dpr, 0, 6.28);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const cycleMode = () => {
    const next = MODES[(MODES.findIndex((m) => m.k === mode) + 1) % MODES.length];
    setMode(next.k);
    localStorage.setItem("bioxic_viz_mode", next.k);
  };

  return (
    <div className="relative" style={{ width: "min(62vw, 320px)", aspectRatio: "1/1" }} data-testid="spectrum-vinyl">
      {/* glow care pulsează pe bas */}
      <div ref={glowRef} aria-hidden="true" className="absolute -inset-16 rounded-full pointer-events-none transition-opacity duration-300"
        style={{ background: "radial-gradient(circle, rgba(255,122,26,.3), transparent 62%)", opacity: 0.6 }} />
      {/* canvas spectrum */}
      <canvas ref={canvasRef} className="absolute pointer-events-none" style={{ inset: "-20%", width: "140%", height: "140%" }} aria-hidden="true" data-testid="spectrum-canvas" />
      {/* discul — rotație + puls via JS (inerție) */}
      <div ref={discRef} className="absolute inset-0" style={{ willChange: "transform" }}>
        <div className="vinyl" style={{ width: "100%", height: "100%" }}>
          <div className="vinyl-grooves" aria-hidden="true" />
          <div className="vinyl-sheen" aria-hidden="true" />
          <div className="vinyl-label">
            <img src={mediaUrl(cover) || "/logo-alt.png"} alt={title || "BIOXIC"} data-testid="room-cover" />
          </div>
          <span className="vinyl-hole" aria-hidden="true" />
        </div>
      </div>
      {/* knob moduri vizuale */}
      <button
        onClick={cycleMode}
        className="knob knob-sm absolute -bottom-3 -right-3 !w-11 !h-11"
        aria-label={`Mod vizualizare: ${MODES.find((m) => m.k === mode)?.label}. Apasă pentru următorul`}
        data-testid="viz-mode-knob"
        title={`Mod: ${MODES.find((m) => m.k === mode)?.label}`}
      >
        <span className="font-mono-x text-[8px] font-semibold uppercase" style={{ letterSpacing: "0.08em" }}>
          {MODES.find((m) => m.k === mode)?.label.slice(0, 4)}
        </span>
      </button>
    </div>
  );
}
