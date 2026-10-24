import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, Music2, Clapperboard } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

// Căutare peste piese + clipuri — datele existente, filtrare pe client
export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState("");
  const [tracks, setTracks] = useState(null);
  const [videos, setVideos] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQ("");
    setTimeout(() => inputRef.current?.focus(), 80);
    if (tracks === null) api.get("/tracks").then((r) => setTracks(r.data || [])).catch(() => setTracks([]));
    if (videos === null) api.get("/videos").then((r) => setVideos(r.data || [])).catch(() => setVideos([]));
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const ql = q.trim().toLowerCase();
  const ft = (tracks || []).filter((t) => !ql || (t.title || "").toLowerCase().includes(ql) || (t.artist || "").toLowerCase().includes(ql)).slice(0, 5);
  const fv = (videos || []).filter((v) => !ql || (v.title || "").toLowerCase().includes(ql)).slice(0, 5);

  const go = (to) => { onClose(); navigate(to); };

  return createPortal(
    <div className="fixed inset-0 z-[170] grid place-items-start justify-center px-4 pt-[16vh]" style={{ background: "rgba(5,5,5,.78)", backdropFilter: "blur(14px)" }} data-testid="search-overlay" onClick={onClose}>
      <div className="ob-card w-full max-w-xl p-5 sm:p-6" style={{ animation: "player-rise .35s cubic-bezier(.2,.9,.25,1.1) both" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Search size={17} className="text-[var(--flame)] shrink-0" />
          <input
            ref={inputRef}
            data-testid="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută piese sau clipuri…"
            maxLength={60}
            className="input-recessed flex-1 px-4 py-3 text-sm outline-none"
          />
          <button onClick={onClose} aria-label="Închide căutarea" data-testid="search-close" className="knob knob-sm shrink-0"><X /></button>
        </div>

        <div className="mt-5 grid gap-1.5 max-h-[46vh] overflow-y-auto chat-scroll" data-testid="search-results" data-lenis-prevent>
          {ft.length === 0 && fv.length === 0 && (
            <p className="text-sm text-[var(--text-2)] text-center py-8">Nimic găsit{ql ? ` pentru „${q}"` : " — încearcă un titlu sau un artist"}.</p>
          )}
          {ft.map((t) => (
            <button key={t.id} onClick={() => go("/piese")} data-testid={`search-track-${t.id}`}
              className="queue-row flex items-center gap-3 rounded-xl px-3 py-2.5 border border-[var(--edge)] text-left">
              <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-9 h-9 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{t.title}</span>
                <span className="block text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">{t.artist || "BIOXIC"}</span>
              </span>
              <Music2 size={13} className="text-[var(--text-3)] shrink-0" />
            </button>
          ))}
          {fv.map((v) => (
            <button key={v.id} onClick={() => go(`/clipuri/${v.id}`)} data-testid={`search-video-${v.id}`}
              className="queue-row flex items-center gap-3 rounded-xl px-3 py-2.5 border border-[var(--edge)] text-left">
              <img src={mediaUrl(v.thumb_url) || "/logo-alt.png"} alt="" className="w-12 h-7 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{v.title}</span>
                <span className="block text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">Videoclip</span>
              </span>
              <Clapperboard size={13} className="text-[var(--text-3)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
