import React, { useEffect, useState } from "react";
import { Clapperboard, Eye } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

function VideoCard({ v }) {
  const [views, setViews] = useState(v.views || 0);
  return (
    <article className="glass rounded-2xl overflow-hidden track-card" data-testid={`video-card-${v.id}`}>
      <video
        src={mediaUrl(v.video_url)}
        poster={mediaUrl(v.thumb_url) || undefined}
        controls
        preload="none"
        controlsList="nodownload"
        className="w-full aspect-video bg-black"
        data-testid={`video-player-${v.id}`}
        onPlay={() => {
          setViews((x) => x + 1);
          api.post(`/videos/${v.id}/view`).catch(() => {});
        }}
      />
      <div className="p-4">
        <h3 className="font-bold text-sm leading-snug">{v.title}</h3>
        <p className="text-[10px] font-mono-x uppercase tracking-[0.14em] text-[var(--mist)] mt-1.5 flex items-center gap-1.5">
          <Eye size={11} /> {views} vizualizări
        </p>
      </div>
    </article>
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
