import React, { useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Share2, Download, Heart } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { mediaUrl } from "@/lib/api";
import { toast } from "sonner";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const { current, playing, progress, duration, volume, shuffle, repeat, toggle, next, prev, seek, setVolume, setShuffle, setRepeat } = usePlayer();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // vizualizator canvas — bare aurii animate
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !current) return;
    const ctx = canvas.getContext("2d");
    const bars = 56;
    const draw = (t) => {
      const w = canvas.width = canvas.offsetWidth * 2;
      const h = canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, w, h);
      const pct = duration ? progress / duration : 0;
      for (let i = 0; i < bars; i++) {
        const x = (i / bars) * w;
        const amp = playing ? 0.25 + Math.abs(Math.sin(t / 300 + i * 0.7)) * 0.75 : 0.15;
        const bh = h * amp;
        const played = i / bars <= pct;
        const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#f3c46a";
        ctx.fillStyle = played ? accent : "rgba(234,242,237,0.18)";
        ctx.fillRect(x, (h - bh) / 2, (w / bars) * 0.55, bh);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, playing, progress, duration]);

  if (!current) return null;

  const share = () => {
    const url = `${window.location.origin}/muzica?track=${current.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copiat!", { description: url })).catch(() => {});
  };

  return (
    <div data-testid="player-bar" className="fixed bottom-0 inset-x-0 z-50 border-t border-[rgba(234,242,237,0.11)] backdrop-blur-xl"
      style={{ background: "linear-gradient(180deg, rgba(6,17,13,.6), rgba(6,17,13,.95))" }}>
      <div className="max-w-[1120px] mx-auto px-3 sm:px-4 py-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 sm:gap-4 items-center">
        <img src={mediaUrl(current.cover_url) || "/logo-alt.png"} alt={current.title} className="w-11 h-11 object-cover rounded-xl border border-white/10" data-testid="player-cover" />
        <div className="min-w-0">
          <p data-testid="player-track-title" className="text-sm font-semibold truncate">{current.title}</p>
          <p className="text-[11px] text-[var(--accent)] uppercase tracking-widest truncate">{current.artist}</p>
        </div>
        <div className="hidden md:grid grid-cols-[auto_1fr_auto] gap-2.5 items-center font-mono-x text-[11px] text-[var(--mist)]">
          <span data-testid="player-time" className="tabular-nums">{fmt(progress)}</span>
          <canvas
            ref={canvasRef}
            data-testid="player-progress"
            className="w-full h-9 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * duration);
            }}
          />
          <span className="tabular-nums">{fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button data-testid="player-shuffle" onClick={() => setShuffle(!shuffle)} className={`grid w-9 h-9 rounded-full border border-white/10 place-items-center transition-colors ${shuffle ? "text-[var(--accent)] border-[var(--accent)]/50" : "text-zinc-500 hover:text-white"}`} aria-label="Shuffle"><Shuffle size={15} /></button>
          <button data-testid="player-prev" onClick={prev} className="hidden sm:grid w-9 h-9 rounded-full border border-white/10 place-items-center text-zinc-300 hover:text-[var(--accent)] transition-colors" aria-label="Anterior"><SkipBack size={16} /></button>
          <button data-testid="player-play-pause" onClick={toggle}
            className="grid w-11 h-11 rounded-full place-items-center transition-transform hover:scale-105"
            style={{ background: "linear-gradient(180deg,var(--accent-hi),var(--accent))", color: "var(--on-accent)", boxShadow: "0 8px 30px -8px rgba(var(--accent-rgb),.6)" }}
            aria-label={playing ? "Pauză" : "Redă"}>
            {playing ? <Pause size={18} fill="var(--on-accent)" /> : <Play size={18} fill="var(--on-accent)" />}
          </button>
          <button data-testid="player-next" onClick={next} className="grid w-9 h-9 rounded-full border border-white/10 place-items-center text-zinc-300 hover:text-[var(--accent)] transition-colors" aria-label="Următor"><SkipForward size={16} /></button>
          <button data-testid="player-repeat" onClick={() => setRepeat(!repeat)} className={`grid w-9 h-9 rounded-full border border-white/10 place-items-center transition-colors ${repeat ? "text-[var(--accent)] border-[var(--accent)]/50" : "text-zinc-500 hover:text-white"}`} aria-label="Repetă"><Repeat size={15} /></button>
          <div className="hidden lg:flex items-center gap-2 w-24 ml-1">
            <Volume2 size={14} className="text-zinc-500" />
            <input data-testid="player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 accent-[var(--accent)]" aria-label="Volum" />
          </div>
          <button data-testid="player-share" onClick={share} className="hidden sm:grid w-9 h-9 rounded-full border border-white/10 place-items-center text-zinc-400 hover:text-[var(--accent)] transition-colors" aria-label="Distribuie"><Share2 size={15} /></button>
          {current.download_enabled && (
            <a data-testid="player-download" href={mediaUrl(`/api/tracks/${current.id}/download`)} className="hidden sm:grid w-9 h-9 rounded-full border border-white/10 place-items-center text-zinc-400 hover:text-[var(--accent)] transition-colors" aria-label="Descarcă"><Download size={15} /></a>
          )}
        </div>
      </div>
    </div>
  );
}
