import React, { useEffect, useRef } from "react";
import { useRadio } from "@/context/RadioContext";

// Waveform audio-reactiv desenat pe canvas: partea cântată portocalie, restul întunecat.
// AnalyserNode real pe elementul audio unic (se conectează o singură dată, la primul play).
export default function LiveWave({ onLevel }) {
  const { audioRef, playing, progress, duration } = useRadio();
  const canvasRef = useRef(null);
  const anRef = useRef(null);
  const progRef = useRef({ p: 0, d: 0 });
  progRef.current = { p: progress, d: duration };
  const playingRef = useRef(false);
  playingRef.current = playing;

  useEffect(() => {
    if (!playing || anRef.current) return;
    const audio = audioRef.current;
    if (!audio || audio.__vizHooked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      src.connect(analyser).connect(ctx.destination);
      audio.__vizHooked = true;
      anRef.current = { ctx, analyser, data: new Uint8Array(analyser.frequencyBinCount) };
    } catch { /* fără WebAudio — rămâne doar progresul vizual */ }
  }, [playing, audioRef]);

  useEffect(() => {
    if (playing && anRef.current) anRef.current.ctx.resume().catch(() => {});
  }, [playing]);

  useEffect(() => {
    let raf;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth * dpr;
      const H = canvas.clientHeight * dpr;
      if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
      ctx.clearRect(0, 0, W, H);

      const { p, d } = progRef.current;
      const pct = d ? Math.min(1, p / d) : 0;
      const bars = 56;
      const bw = W / bars;
      let level = 0;

      let freq = null;
      if (anRef.current && playingRef.current && !reduced) {
        anRef.current.analyser.getByteFrequencyData(anRef.current.data);
        freq = anRef.current.data;
        level = freq.slice(2, 14).reduce((s, v) => s + v, 0) / (12 * 255);
      }
      if (onLevel) onLevel(level);

      for (let i = 0; i < bars; i++) {
        const played = i / bars <= pct;
        let h;
        if (freq) {
          const v = freq[Math.floor((i / bars) * freq.length * 0.8)] / 255;
          h = Math.max(2 * dpr, v * H * 0.92);
        } else {
          // formă statică discretă când nu cântă
          h = (Math.sin(i * 0.7) * 0.5 + 0.5) * H * 0.18 + 2 * dpr;
        }
        ctx.fillStyle = played ? "#FF7A1A" : "#232327";
        if (played) {
          ctx.shadowColor = "rgba(255,122,26,.55)";
          ctx.shadowBlur = 6 * dpr;
        }
        const x = i * bw + bw * 0.18;
        ctx.fillRect(x, (H - h) / 2, bw * 0.64, h);
        ctx.shadowBlur = 0;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onLevel]);

  return <canvas ref={canvasRef} className="w-full h-14 block" data-testid="live-waveform" aria-hidden="true" />;
}
