import React from "react";
import { Play, Pause, Volume2, RotateCcw } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import Equalizer from "@/components/Equalizer";
import ShareButton from "@/components/ShareButton";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Mini-player plutitor — apare cu efect 3D când pornește muzica
export default function PlayerBar() {
  const { current, playing, mode, progress, duration, volume, listeners, toggle, backToLive, seek, setVolume } = useRadio();

  if (!current) return null;
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div data-testid="player-bar" className="fixed bottom-3 sm:bottom-5 inset-x-0 z-50 px-3 sm:px-5 pointer-events-none">
      <div className={`player-dock player-rise ${playing ? "player-playing" : ""} max-w-3xl mx-auto rounded-2xl overflow-hidden pointer-events-auto`}>
        {/* progres */}
        <div
          className={`h-1 w-full bg-black/40 ${mode === "track" ? "cursor-pointer" : ""}`}
          data-testid="player-progress"
          onClick={(e) => {
            if (mode !== "track" || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: mode === "live" ? "var(--berry)" : "linear-gradient(90deg, var(--accent), var(--accent-hi))" }}
          />
        </div>

        <div className="px-3 sm:px-4 py-2.5 flex items-center gap-3">
          <img
            src={mediaUrl(current.cover_url) || "/logo-alt.png"}
            alt={current.title}
            data-testid="player-cover"
            className={`w-11 h-11 rounded-full object-cover border border-[var(--line-hi)] ${playing ? "vinyl-spin" : "vinyl-spin vinyl-paused"}`}
          />
          <div className="min-w-0 flex-1">
            <p data-testid="player-track-title" className="text-sm font-semibold truncate">{current.title}</p>
            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--mist)] truncate">
              {current.artist || "BIOXIC"} · {fmt(progress)} / {fmt(duration)}
            </p>
          </div>

          <Equalizer playing={playing} className="hidden md:flex" color={mode === "live" ? "var(--berry)" : "var(--accent)"} />

          {mode === "live" ? (
            <span data-testid="player-live-badge" className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[rgba(var(--berry-rgb),.5)] text-[var(--berry)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--berry)] live-dot" />
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

          <ShareButton track={current} testid="player-share" className="hidden sm:block" />

          <button
            data-testid="player-play-pause"
            onClick={toggle}
            aria-label={playing ? "Pauză" : "Redă"}
            className="btn-x gold !p-0 grid w-11 h-11 rounded-full place-items-center shrink-0"
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <div className="hidden sm:flex items-center gap-2 w-24">
            <Volume2 size={14} className="text-[var(--dim)]" />
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
        </div>
      </div>
    </div>
  );
}
