import React, { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { SkipBack, SkipForward, Square, Loader2, Volume2, VolumeX, Play, Pause, ListMusic, ChevronDown, Mic2, X } from "lucide-react";
import { useRadio } from "@/context/RadioContext";
import { mediaUrl } from "@/lib/api";
import LyricsModal from "@/components/LyricsModal";

const fmt = (s) => (isFinite(s) && s >= 0) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

// Player docabil: LIVE = fără seek; PIESĂ = seek + timpi + versuri + coadă; minimizează într-o pilulă de sticlă
export default function PlayerBar() {
  const { pathname } = useLocation();
  const { current, mode, status, playing, progress, duration, volume, muted, listeners,
          queue, trackIdx, toggle, stop, next, prev, seek, setVolume, toggleMute, playTrack } = useRadio();
  const [minimized, setMinimized] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  if (pathname.startsWith("/clipuri") || pathname === "/live" || pathname === "/tv" || pathname.startsWith("/admin") || pathname.startsWith("/secret-mod")) return null;
  if (!current) return null;

  const isLive = mode === "live";
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;
  const loading = status === "loading";

  const onSeek = (e) => {
    if (isLive || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * duration);
  };

  // pilula minimizată — colț dreapta-jos, non-intruzivă
  if (minimized) {
    return (
      <div className="pb-pill" data-testid="pb-pill">
        <img src={mediaUrl(current.cover_url) || "/logo-alt.png"} alt="" className={`w-9 h-9 rounded-full object-cover border border-[var(--edge-hi)] ${playing ? "vinyl-spin" : ""}`} />
        <button onClick={toggle} className="grid place-items-center w-9 h-9 rounded-full text-[var(--flame)]" aria-label={playing ? "Pauză" : "Redă"} data-testid="pb-pill-play">
          {loading ? <Loader2 size={15} className="animate-spin" /> : playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>
        <button onClick={() => setMinimized(false)} className="pr-3 pl-1 text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-2)] hover:text-[var(--text)]" data-testid="pb-expand" aria-label="Extinde playerul">
          Max
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={`pb ${playing ? "playing" : ""}`} data-testid="player-bar">
        <img className="pb-cover" src={mediaUrl(current.cover_url) || "/logo-alt.png"} alt="" />
        <div className="pb-meta">
          <span className="pb-title" data-testid="pb-title">{current.title}</span>
          <div className="pb-sub">
            {isLive && <Link to="/live" className="pb-live" data-testid="player-live-badge" aria-label="Deschide camera live">LIVE · {listeners}</Link>}
            <span className="pb-eq" aria-hidden="true"><i /><i /><i /><i /></span>
            <span className="pb-artist">{current.artist || "BIOXIC"}</span>
            {!isLive && <span className="pb-time" data-testid="pb-time">{fmt(progress)} / {fmt(duration)}</span>}
            {isLive && <span className="pb-time pb-t-only" data-testid="pb-time">{fmt(progress)}</span>}
          </div>
        </div>
        {current.lyrics ? (
          <button className="pb-icon" onClick={() => setLyricsOpen(true)} aria-label="Versuri" data-testid="pb-lyrics"><Mic2 /></button>
        ) : null}
        <button className="pb-icon" onClick={() => setQueueOpen((o) => !o)} aria-label="Coada de redare" aria-expanded={queueOpen} data-testid="pb-queue-toggle"><ListMusic /></button>
        <button className="pb-icon" onClick={prev} disabled={isLive} aria-label="Piesa anterioară" data-testid="pb-prev"><SkipBack /></button>
        <button className="pb-play" onClick={toggle} disabled={loading} aria-label={playing ? "Pauză" : "Redă"} data-testid="pb-play-pause">
          {loading ? <Loader2 size={17} className="animate-spin" /> : playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" style={{ marginLeft: 2 }} />}
        </button>
        <button className="pb-icon" onClick={next} disabled={isLive} aria-label="Piesa următoare" data-testid="pb-next"><SkipForward /></button>
        <button className="pb-icon" onClick={stop} disabled={status === "idle" || status === "stopped"} aria-label="Stop" data-testid="pb-stop"><Square style={{ width: 13, height: 13 }} fill="currentColor" /></button>
        <div className="pb-vol">
          <button onClick={toggleMute} aria-label={muted ? "Activează sunetul" : "Mute"} data-testid="pb-mute">
            {muted || volume === 0 ? <VolumeX /> : <Volume2 />}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label="Volum" data-testid="pb-volume" />
        </div>
        <button className="pb-icon" onClick={() => setMinimized(true)} aria-label="Minimizează playerul" data-testid="pb-minimize"><ChevronDown /></button>
        {/* seek bar DOAR în modul piesă — la live nu există */}
        {!isLive && (
          <div className="pb-bar-wrap seekable" onClick={onSeek} data-testid="pb-seek-track" role="slider" aria-label="Poziție piesă" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className="pb-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>

      {/* drawer coada de redare */}
      {queueOpen && (
        <div className="pb-queue glass" data-testid="pb-queue-drawer">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--edge)]">
            <p className="text-[10px] font-mono-x uppercase tracking-[0.22em] text-[var(--text-2)]">Coada de redare · {queue.length}</p>
            <button onClick={() => setQueueOpen(false)} aria-label="Închide coada" className="p-1.5 text-[var(--text-3)] hover:text-[var(--text)]" data-testid="pb-queue-close"><X size={14} /></button>
          </div>
          <div className="overflow-y-auto chat-scroll max-h-[46vh] p-2" data-lenis-prevent>
            {queue.map((q, i) => {
              const active = q.id === current.id;
              return (
                <button
                  key={q.id}
                  onClick={() => playTrack(q)}
                  className={`queue-row w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left border ${active ? "border-[rgba(var(--flame-rgb),.45)] bg-[rgba(var(--flame-rgb),.08)]" : "border-transparent"}`}
                  data-testid={`pb-queue-item-${q.id}`}
                >
                  <span className={`text-[10px] font-mono-x w-5 text-right ${active ? "text-[var(--flame)]" : "text-[var(--text-3)]"}`}>{i + 1}</span>
                  <img src={mediaUrl(q.cover_url) || "/logo-alt.png"} alt="" className="w-8 h-8 rounded-lg object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold truncate">{q.title}</span>
                    <span className="block text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">{q.artist || "BIOXIC"}</span>
                  </span>
                  {active && <span className="text-[8px] font-mono-x uppercase tracking-widest text-[var(--flame)]">Acum</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lyricsOpen && <LyricsModal track={current} onClose={() => setLyricsOpen(false)} />}
    </>
  );
}
