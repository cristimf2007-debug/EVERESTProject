import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Eye, Play } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

function VideoCard({ v }) {
  return (
    <Link
      to={`/clipuri/${v.id}`}
      className="glass rounded-2xl overflow-hidden track-card block"
      data-testid={`video-card-${v.id}`}
    >
      <div className="relative aspect-video bg-black group">
        <video
          src={mediaUrl(v.video_url)}
          poster={mediaUrl(v.thumb_url) || undefined}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none"
        />
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(10,8,7,.45)" }}>
          <span className="grid w-14 h-14 rounded-full place-items-center" style={{ background: "var(--site-accent)", color: "var(--site-accent-ink)", boxShadow: "0 0 26px rgba(232,115,26,.55)" }}>
            <Play size={22} fill="currentColor" className="ml-1" />
          </span>
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm leading-snug line-clamp-2">{v.title}</h3>
        <p className="text-[10px] font-mono-x uppercase tracking-[0.14em] text-[var(--mist)] mt-1.5 flex items-center gap-1.5">
          <Eye size={11} /> {v.views || 0} vizualizări
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
    <div data-testid="clipuri-page" className="max-w-6xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide">
        Clipuri <span className="text-[var(--accent)]">({videos.length})</span>
      </h2>
      <p className="text-[var(--mist)] text-sm mt-2 max-w-xl">
        Remixuri și mashup-uri în format video — direct din seif, fără YouTube.
      </p>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          {[0, 1].map((i) => <div key={i} className="glass rounded-2xl aspect-video animate-pulse" />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center mt-10" data-testid="clipuri-empty">
          <Clapperboard size={32} className="mx-auto text-[var(--accent)] mb-4" />
          <p className="font-display text-xl font-bold uppercase">Niciun clip încă</p>
          <p className="text-[var(--mist)] text-sm mt-2">Primul videoclip urcă în curând.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6 mt-10" data-testid="videos-grid">
          {videos.map((v) => <VideoCard key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}
