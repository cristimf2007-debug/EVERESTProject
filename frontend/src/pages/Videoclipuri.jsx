import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Eye, Play } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

function VideoCard({ v, i }) {
  const vidRef = useRef(null);
  const hoverT = useRef(null);
  const cardRef = useRef(null);

  // tilt 3D la hover (doar transform, fără repaint global) + preview mut după 400ms
  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) translateY(-3px)`;
  };
  const onEnter = () => {
    hoverT.current = setTimeout(() => { vidRef.current?.play().catch(() => {}); }, 400);
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "";
    clearTimeout(hoverT.current);
    if (vidRef.current) vidRef.current.pause();
  };

  return (
    <Link
      to={`/clipuri/${v.id}`}
      ref={cardRef}
      className={`ob-card block rv will-change-transform ${i % 4 ? `rv-d${Math.min(i % 4, 3)}` : ""}`}
      style={{ transition: "transform .3s cubic-bezier(.2,.8,.2,1), border-color .3s, box-shadow .3s" }}
      data-testid={`video-card-${v.id}`}
      data-cursor="PLAY"
      data-video-card
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="relative aspect-video bg-black group">
        <video
          ref={vidRef}
          src={mediaUrl(v.video_url)}
          poster={mediaUrl(v.thumb_url) || undefined}
          preload="metadata"
          muted
          loop
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        />
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "rgba(5,5,5,.28)" }}>
          <span className="knob !w-14 !h-14" style={{ color: "var(--flame)" }}>
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </span>
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{v.title}</h3>
        <p className="text-[9px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1.5 flex items-center gap-1.5">
          <Eye size={10} /> {v.views || 0} vizualizări
        </p>
      </div>
    </Link>
  );
}

export default function Videoclipuri() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/videos")
      .then((r) => setVideos(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="clipuri-page" className="relative">
      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <header className="rv">
          <p className="badge-engraved">Zonă separată · fără YouTube</p>
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight mt-2">
            Clipuri <span className="text-[var(--flame)]">({videos.length})</span>
          </h2>
          <p className="text-[var(--text-2)] text-sm mt-3 max-w-xl">
            Remixuri și mashup-uri în format video — direct din seif, fără YouTube.
          </p>
        </header>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {[0, 1].map((i) => <div key={i} className="glass rounded-2xl aspect-video animate-pulse" />)}
          </div>
        ) : videos.length === 0 ? (
          <div className="ob-card p-14 text-center mt-10" data-testid="clipuri-empty">
            <Clapperboard size={32} className="mx-auto text-[var(--flame)] mb-4" />
            <p className="font-display text-xl uppercase">Niciun clip încă</p>
            <p className="text-[var(--text-2)] text-sm mt-2">Primul videoclip urcă în curând.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 mt-10" data-testid="videos-grid">
            {videos.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
