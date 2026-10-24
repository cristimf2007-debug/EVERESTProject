import React from "react";
import { createPortal } from "react-dom";
import { X, Mic2 } from "lucide-react";
import { mediaUrl } from "@/lib/api";

// Versurile piesei — modal de sticlă, partajat între player și cardurile de piese
export default function LyricsModal({ track, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[170] grid place-items-center px-4"
      style={{ background: "rgba(7,9,14,.82)", backdropFilter: "blur(10px)" }}
      data-testid="lyrics-modal"
      onClick={onClose}
    >
      <div className="ob-card w-full max-w-lg p-6 max-h-[80vh] flex flex-col" style={{ animation: "player-rise .3s cubic-bezier(.2,.8,.2,1) both" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3.5 shrink-0">
          <img src={mediaUrl(track.cover_url) || "/logo-alt.png"} alt="" className="w-12 h-12 rounded-xl object-cover border border-[var(--edge)]" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[9px] font-mono-x uppercase tracking-[0.22em] text-[var(--flame)]"><Mic2 size={11} /> Versuri</p>
            <h3 className="font-display text-base uppercase truncate mt-0.5">{track.title}</h3>
          </div>
          <button onClick={onClose} aria-label="Închide versurile" data-testid="lyrics-close" className="knob knob-sm shrink-0"><X /></button>
        </div>
        <p className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line overflow-y-auto chat-scroll mt-5" data-testid="lyrics-text" data-lenis-prevent>
          {track.lyrics || "Versurile nu sunt disponibile pentru această piesă."}
        </p>
      </div>
    </div>,
    document.body
  );
}
