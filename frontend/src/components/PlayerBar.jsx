import React from "react";
import { useLocation } from "react-router-dom";
import { SkipBack, SkipForward, Square, Loader2, Share2, Volume2, VolumeX } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";

const fmt = (s) => (isFinite(s) && s >= 0) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

// BIOXIC Player Bar — conectat la controllerul audio unic; zona de clipuri e separată, fără bară
export default function PlayerBar() {
  const { pathname } = useLocation();
  const { current, mode, status, playing, progress, duration, volume, muted, listeners,
          toggle, stop, next, prev, seek, setVolume, toggleMute, trackIdx, queue } = useRadio();

  if (pathname.startsWith("/clipuri")) return null; // zona video are playerul ei
  if (!current) return null;
  const isTrack = mode === "track";
  const canPrev = isTrack && (progress > 3 || trackIdx > 0);
  const canNext = isTrack && trackIdx >= 0 && trackIdx < queue.length - 1;

  const onSeek = (e) => {
    if (!isTrack || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const share = () => {
    const data = { title: `${current.title} · Radio BIOXIC`, url: window.location.origin + "/piese" };
    if (navigator.share) navigator.share(data).catch(() => {});
    else navigator.clipboard?.writeText(data.url);
  };

  return (
    <div className={`pb ${playing ? "playing" : ""}`} role="region" aria-label="Player radio BIOXIC" data-testid="player-bar">
      <img className="pb-cover" src={mediaUrl(current.cover_url) || "/logo-alt.png"} alt={current.title} data-testid="player-cover" />

      <div className="pb-meta">
        <span className="pb-title" data-testid="player-track-title">{current.title}</span>
        <span className="pb-sub">
          <span className="pb-artist">{current.artist || "BIOXIC"}</span>
          <span className="pb-time" data-testid="player-time">· {fmt(progress)} / {fmt(duration)}</span>
        </span>
      </div>

      <span className="pb-eq" aria-hidden="true"><i /><i /><i /><i /></span>

      {!isTrack && (
        <span className="pb-live" data-testid="player-live-badge">LIVE · {listeners}</span>
      )}

      {/* transport — stil pb-icon, funcțional real */}
      <button className="pb-icon pb-t-only" onClick={prev} disabled={!canPrev} aria-label="Piesa anterioară" data-testid="player-prev">
        <SkipBack />
      </button>
      <button
        className="pb-play"
        onClick={toggle}
        disabled={status === "loading"}
        aria-label={playing ? "Pauză" : "Ascultă live"}
        data-testid="player-play-pause"
      >
        {status === "loading" ? <Loader2 size={17} className="animate-spin" />
          : playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>
          )}
      </button>
      <button className="pb-icon pb-t-only" onClick={stop} disabled={status === "idle" || status === "stopped"} aria-label="Stop" data-testid="player-stop">
        <Square fill="currentColor" />
      </button>
      <button className="pb-icon pb-t-only" onClick={next} disabled={!canNext} aria-label="Piesa următoare" data-testid="player-next">
        <SkipForward />
      </button>

      <button className="pb-icon pb-share" onClick={share} aria-label="Distribuie" data-testid="player-share">
        <Share2 />
      </button>

      <span className="pb-vol" aria-label="Volum">
        <button onClick={toggleMute} className="pb-vol" aria-label={muted ? "Anulează mute" : "Mute"} data-testid="player-mute" style={{ background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }}>
          {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
        </button>
        <input
          type="range" min="0" max="1" step="0.01"
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          data-testid="player-volume"
        />
      </span>

      {/* bara de progres — hairline jos, seekabilă în modul piesă */}
      <div className={`pb-bar-wrap ${isTrack ? "seekable" : ""}`} onClick={onSeek} data-testid="player-progress">
        <div className="pb-bar">
          <i style={{ width: `${duration ? Math.min(100, (progress / duration) * 100) : 0}%` }} />
        </div>
      </div>
    </div>
  );
}
