import React from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw, Loader2 } from "lucide-react";
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

// Mini-player plutitor — transport complet (play/pause/stop/prev/next/seek/volum)
export default function PlayerBar() {
  const { current, mode, status, playing, progress, duration, volume, muted, listeners,
          toggle, play, pause, stop, next, prev, seek, backToLive, setVolume, toggleMute, trackIdx, queue } = useRadio();

  if (!current) return null;
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;
  const isTrack = mode === "track";
  const canPrev = isTrack && (progress > 3 || trackIdx > 0);
  const canNext = isTrack && trackIdx >= 0 && trackIdx < queue.length - 1;

  return (
    <div data-testid="player-bar" className="fixed bottom-3 sm:bottom-5 inset-x-0 z-50 px-3 sm:px-5 pointer-events-none">
      <div className={`player-dock player-rise ${playing ? "player-playing" : ""} max-w-3xl mx-auto rounded-2xl overflow-hidden pointer-events-auto`}>
        {/* progres — seekabil în modul piesă */}
        <div
          className={`h-1.5 w-full bg-black/40 ${isTrack ? "cursor-pointer" : ""}`}
          data-testid="player-progress"
          onClick={(e) => {
            if (!isTrack || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div
            className="h-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: isTrack ? "linear-gradient(90deg, var(--accent), var(--accent-hi))" : "var(--berry)" }}
          />
        </div>

        <div className="px-3 sm:px-4 py-2.5 flex items-center gap-2.5 sm:gap-3">
          <img
            src={mediaUrl(current.cover_url) || "/logo-alt.png"}
            alt={current.title}
            data-testid="player-cover"
            className={`w-11 h-11 rounded-full object-cover border border-[var(--line-hi)] ${playing ? "vinyl-spin" : "vinyl-spin vinyl-paused"}`}
          />
          <div className="min-w-0 flex-1">
            <p data-testid="player-track-title" className="text-sm font-semibold truncate">{current.title}</p>
            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--mist)] truncate" data-testid="player-time">
              {current.artist || "BIOXIC"} · {fmt(progress)} / {fmt(duration)}
            </p>
          </div>

          <Equalizer playing={playing} className="hidden lg:flex" color={isTrack ? "var(--accent)" : "var(--berry)"} />

          {!isTrack && (
            <span data-testid="player-live-badge" className="hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-[rgba(var(--berry-rgb),.5)] text-[var(--berry)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--berry)] live-dot" />
              Live · {listeners}
            </span>
          )}
          {isTrack && (
            <button
              data-testid="player-back-live"
              onClick={backToLive}
              className="btn-ghost hidden md:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            >
              <RotateCcw size={12} /> Înapoi la live
            </button>
          )}

          {/* transport */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              data-testid="player-prev"
              onClick={prev}
              disabled={!canPrev}
              aria-label="Piesa anterioară"
              className="btn-ghost grid w-9 h-9 rounded-full place-items-center disabled:opacity-30 disabled:pointer-events-none"
            >
              <SkipBack size={15} />
            </button>
            <button
              data-testid="player-play-pause"
              onClick={toggle}
              disabled={status === "loading"}
              aria-label={playing ? "Pauză" : "Redă"}
              className="btn-x gold !p-0 grid w-11 h-11 rounded-full place-items-center"
            >
              {status === "loading" ? <Loader2 size={18} className="animate-spin" />
                : playing ? <Pause size={18} fill="currentColor" />
                : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              data-testid="player-stop"
              onClick={stop}
              disabled={status === "idle" || status === "stopped"}
              aria-label="Stop"
              className="btn-ghost grid w-9 h-9 rounded-full place-items-center disabled:opacity-30 disabled:pointer-events-none"
            >
              <Square size={13} fill="currentColor" />
            </button>
            <button
              data-testid="player-next"
              onClick={next}
              disabled={!canNext}
              aria-label="Piesa următoare"
              className="btn-ghost grid w-9 h-9 rounded-full place-items-center disabled:opacity-30 disabled:pointer-events-none"
            >
              <SkipForward size={15} />
            </button>
          </div>

          <ShareButton track={current} testid="player-share" className="hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 w-28 shrink-0">
            <button data-testid="player-mute" onClick={toggleMute} aria-label={muted ? "Anulează mute" : "Mute"} className="text-[var(--dim)] hover:text-[var(--frost)] transition-colors">
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              data-testid="player-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
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
