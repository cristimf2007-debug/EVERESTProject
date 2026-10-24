import React, { useEffect, useRef } from "react";
import { useRadio } from "@/context/RadioContext";
import { ensureAnalyser, resumeAudioCtx } from "@/lib/audioViz";

// Waveform desenat pe canvas, audio-reactiv (AnalyserNode pe elementul audio UNIC).
// Refolosește analyser-ul partajat (fftSize 2048) — createMediaElementSource e one-shot per element.
export default function LiveWave({ onLevel }) {
  const canvasRef = useRef(null);
  const { audioRef, playing } = useRadio();
  const anRef = useRef(null);
  const levelRef = useRef(0);
  const onLevelRef = useRef(onLevel);
  onLevelRef.current = onLevel;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  // conectăm analyserul DOAR după un gest de utilizator (play), altfel AudioContext e blocat
  useEffect(() => {
    if (!playing || anRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    const v = ensureAnalyser(audio);
    if (v) { anRef.current = v; resumeAudioCtx(); }
  }, [playing, audioRef]);

  useEffect(() => {
    let raf;
    const bars = 56;
    const phase = Array.from({ length: bars }, (_, i) => i * 0.45);
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.clearRect(0, 0, w, h);

      const an = anRef.current;
      let level = 0;
      const values = new Array(bars).fill(0);
      if (an && playingRef.current) {
        an.analyser.getByteFrequencyData(an.freq);
        // eșantionare logaritmică pe jumătatea utilă a spectrului
        for (let i = 0; i < bars; i++) {
          const fi = Math.floor(Math.pow(i / bars, 1.7) * (an.freq.length * 0.5)) + 1;
          values[i] = an.freq[Math.min(fi, an.freq.length - 1)] / 255;
        }
        let bass = 0;
        for (let i = 1; i <= 6; i++) bass += an.freq[i];
        bass /= 6 * 255;
        levelRef.current = levelRef.current * 0.7 + bass * 0.3;
        level = levelRef.current;
      }
      if (onLevelRef.current) onLevelRef.current(level);

      const gap = w / bars;
      const bw = Math.max(2, gap * 0.55);
      const mid = h / 2;
      for (let i = 0; i < bars; i++) {
        const idle = 0.09 + 0.05 * Math.sin(t / 700 + phase[i]);
        const v = values[i] > 0.01 ? 0.12 + values[i] * 0.85 : idle;
        const bh = Math.max(2 * dpr, v * h * 0.9);
        const x = i * gap + (gap - bw) / 2;
        const played = i / bars < 0.4;
        ctx.fillStyle = played ? "#FF7A1A" : "#232327";
        if (played) {
          ctx.shadowColor = "rgba(255,122,26,.55)";
          ctx.shadowBlur = 6 * dpr;
        }
        ctx.beginPath();
        ctx.roundRect(x, mid - bh / 2, bw, bh, bw / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-14" data-testid="live-waveform" aria-hidden="true" />;
}
