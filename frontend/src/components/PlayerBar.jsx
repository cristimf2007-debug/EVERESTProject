import React from "react";
import { Play, Pause, Volume2, Radio, RotateCcw } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import Equalizer from "@/components/Equalizer";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const { current, playing, mode, progress, duration, volume, listeners, toggle, backToLive, seek, setVolume } = useRadio();

  if (!current) return null;
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div data-testid="player-bar" className="fixed bottom-0 inset-x-0 z-50">
      <div className="glass !border-x-0 !border-b-0">
        {/* progres */}
        <div
          className={`h-1 w-full bg-slate-800/70 ${mode === "track" ? "cursor-pointer" : ""}`}
          data-testid="player-progress"
          onClick={(e) => {
            if (mode !== "track" || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div className="h-full transition-[width] duration-300" style={{ width: `${pct}%`, background: mode === "live" ? "var(--live)" : "var(--cyan)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 flex items-center gap-3">
          <img
            src={mediaUrl(current.cover_url) || "/logo-alt.png"}
            alt={current.title}
            data-testid="player-cover"
            className={`w-11 h-11 rounded-full object-cover border border-[var(--border)] ${playing ? "vinyl-spin" : "vinyl-spin vinyl-paused"}`}
          />
          <div className="min-w-0 flex-1">
            <p data-testid="player-track-title" className="text-sm font-semibold truncate">{current.title}</p>
            <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--muted)] truncate">
              {current.artist || "BIOXIC"} · {fmt(progress)} / {fmt(duration)}
            </p>
          </div>

          <Equalizer playing={playing} className="hidden md:flex" color={mode === "live" ? "var(--live)" : "var(--cyan)"} />

          {mode === "live" ? (
            <span data-testid="player-live-badge" className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[rgba(255,42,84,.45)] text-[var(--live)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" />
              Live · {listeners}
            </span>
          ) : (
            <button
              data-testid="player-back-live"
              onClick={backToLive}
              className="btn-ghost flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <RotateCcw size={12} /> Înapoi la live
            </button>
          )}

          <button
            data-testid="player-play-pause"
            onClick={toggle}
            aria-label={playing ? "Pauză" : "Redă"}
            className="btn-cyan grid w-11 h-11 rounded-full place-items-center shrink-0"
          >
            {playing ? <Pause size={18} fill="#050811" /> : <Play size={18} fill="#050811" className="ml-0.5" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 w-24">
            <Volume2 size={14} className="text-[var(--faint)]" />
            <input
              data-testid="player-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="vol w-full"
              aria-label="Volum"
            />
          </div>
          {mode === "live" && (
            <Radio size={16} className="text-[var(--live)] sm:hidden shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
