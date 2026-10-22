import React from "react";
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
  if (!current) return null;

  const share = () => {
    const url = `${window.location.origin}/muzica?track=${current.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copiat!", { description: url })).catch(() => {});
  };

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div data-testid="player-bar" className="fixed bottom-0 inset-x-0 z-50 glass border-t border-[#39FF14]/20">
      {/* bară progres */}
      <div
        data-testid="player-progress"
        className="h-1 bg-white/10 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(((e.clientX - rect.left) / rect.width) * duration);
        }}
      >
        <div className="h-full bg-[#39FF14] transition-[width] duration-200" style={{ width: `${pct}%`, boxShadow: "0 0 10px rgba(57,255,20,0.8)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-4">
        <img src={mediaUrl(current.cover_url) || "/placeholder.svg"} alt={current.title} className="w-11 h-11 object-cover rounded-sm border border-white/10" data-testid="player-cover" />
        <div className="min-w-0 flex-1 sm:flex-none sm:w-48">
          <p data-testid="player-track-title" className="text-sm font-semibold truncate">{current.title}</p>
          <p className="text-[11px] text-[#39FF14] uppercase tracking-widest truncate">{current.artist}</p>
        </div>
        {/* vizualizator */}
        <div className="hidden sm:flex items-end gap-[3px] h-6 w-14" data-testid="player-visualizer">
          {[0.5, 0.9, 0.6, 1, 0.7, 0.4].map((d, i) => (
            <span key={i} className={`w-1 bg-[#39FF14] ${playing ? "eq-bar" : ""}`} style={{ height: "100%", animationDelay: `${i * 0.12}s`, animationDuration: `${0.6 + d * 0.5}s`, transform: playing ? undefined : "scaleY(0.2)", transformOrigin: "bottom" }} />
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button data-testid="player-shuffle" onClick={() => setShuffle(!shuffle)} className={`hidden sm:block p-2 transition-colors ${shuffle ? "text-[#39FF14]" : "text-zinc-500 hover:text-white"}`} aria-label="Shuffle"><Shuffle size={16} /></button>
          <button data-testid="player-prev" onClick={prev} className="p-2 text-zinc-300 hover:text-[#39FF14] transition-colors" aria-label="Anterior"><SkipBack size={18} /></button>
          <button data-testid="player-play-pause" onClick={toggle} className="p-2.5 bg-[#39FF14] text-black rounded-sm hover:bg-[#00C853] transition-colors" aria-label={playing ? "Pauză" : "Redă"}>
            {playing ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
          </button>
          <button data-testid="player-next" onClick={next} className="p-2 text-zinc-300 hover:text-[#39FF14] transition-colors" aria-label="Următor"><SkipForward size={18} /></button>
          <button data-testid="player-repeat" onClick={() => setRepeat(!repeat)} className={`hidden sm:block p-2 transition-colors ${repeat ? "text-[#39FF14]" : "text-zinc-500 hover:text-white"}`} aria-label="Repetă"><Repeat size={16} /></button>
        </div>
        <span data-testid="player-time" className="hidden md:block text-[11px] text-zinc-500 tabular-nums w-20 text-center">{fmt(progress)} / {fmt(duration)}</span>
        <div className="hidden md:flex items-center gap-2 w-28">
          <Volume2 size={15} className="text-zinc-500" />
          <input data-testid="player-volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1 accent-[#39FF14]" aria-label="Volum" />
        </div>
        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <button data-testid="player-share" onClick={share} className="p-2 text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="Distribuie"><Share2 size={16} /></button>
          {current.download_enabled && (
            <a data-testid="player-download" href={mediaUrl(`/api/tracks/${current.id}/download`)} className="p-2 text-zinc-400 hover:text-[#39FF14] transition-colors" aria-label="Descarcă"><Download size={16} /></a>
          )}
        </div>
      </div>
    </div>
  );
}
