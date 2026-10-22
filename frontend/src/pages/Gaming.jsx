import React, { useEffect, useState } from "react";
import { Gamepad2, Radio, Users, Play, X } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import DiscordButton from "@/components/DiscordButton";

export default function Gaming() {
  const [status, setStatus] = useState(null);
  const [videos, setVideos] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/gaming/status").then((r) => setStatus(r.data)).catch(() => {});
    api.get("/videos", { params: { category: "gaming" } }).then((r) => setVideos(r.data || [])).catch(() => {});
  }, []);

  const embedSrc = status?.youtube_video_id
    ? `https://www.youtube.com/embed/${status.youtube_video_id}?autoplay=1`
    : `https://www.youtube.com/embed/live_stream?channel=UC2gQmatVSAB3nzqeDmYY3gw&autoplay=1`;

  return (
    <div data-testid="gaming-page" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <p className="text-[#00C853] text-xs uppercase tracking-[0.4em] mb-3">Cu abonații, pe live</p>
      <div className="flex flex-wrap items-center gap-4 mb-10">
        <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter flex items-center gap-4">
          Gaming<span className="text-[#39FF14]">.</span>
        </h1>
        {status?.is_live && (
          <span data-testid="gaming-live-badge" className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-display font-bold text-xs tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-black live-dot" /> Live acum
          </span>
        )}
      </div>

      <div className="relative glass rounded-sm overflow-hidden scanlines mb-10" data-testid="gaming-stream">
        {status?.is_live ? (
          <div className="aspect-video">
            <iframe src={embedSrc} title="BIOXIC Gaming Live" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen data-testid="gaming-embed" />
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center bg-[#050805] p-8 text-center">
            <Gamepad2 size={52} className="text-[#39FF14]/40 mb-6" />
            <p className="font-display font-bold text-xl sm:text-2xl uppercase text-zinc-300" data-testid="gaming-offline">Niciun stream de gaming acum</p>
            <p className="mt-3 text-sm text-zinc-500 max-w-md">Când intrăm live ne jucăm cu abonații. Anunțurile vin pe Discord și pe email dacă ai cont.</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-14">
        <div className="glass rounded-sm p-8">
          <h2 className="font-display font-bold text-lg uppercase tracking-tight mb-3 flex items-center gap-2"><Users size={17} className="text-[#39FF14]" /> Joacă-te cu noi</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Lobby-urile cu abonați se organizează pe serverul de Discord. Intră, bagă-ți gamertag-ul și ești în interior.</p>
          <DiscordButton tid="gaming-discord" />
        </div>
        <div className="glass rounded-sm p-8">
          <h2 className="font-display font-bold text-lg uppercase tracking-tight mb-3 flex items-center gap-2"><Radio size={17} className="text-[#39FF14]" /> Notificări de stream</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Cu cont de fan primești email de fiecare dată când pornește un live — muzică sau gaming.</p>
          <a href="/cont" data-testid="gaming-cont-cta" className="btn-cut inline-block px-6 py-3.5 border border-[#39FF14] text-[#39FF14] font-display font-bold text-xs tracking-widest uppercase hover:bg-[#39FF14] hover:text-black transition-colors">Creează cont gratuit</a>
        </div>
      </div>

      {videos.length > 0 && (
        <section data-testid="gaming-videos">
          <h2 className="font-display font-bold text-2xl uppercase tracking-tight mb-6">Clipuri <span className="text-[#39FF14]">gaming</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v, i) => (
              <button key={v.id} data-testid={`gaming-video-${i}`} onClick={() => { setActive(v); api.post(`/videos/${v.id}/view`).catch(() => {}); }}
                className="group glass rounded-sm overflow-hidden text-left hover:box-glow transition-shadow">
                <div className="relative aspect-video bg-black/60 overflow-hidden">
                  {v.thumb_url ? (
                    <img src={mediaUrl(v.thumb_url)} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center"><Gamepad2 size={40} className="text-[#39FF14]/30" /></span>
                  )}
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-4 bg-[#39FF14] rounded-sm"><Play size={22} fill="black" className="text-black" /></span>
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold line-clamp-2 group-hover:text-[#39FF14] transition-colors">{v.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-1.5">{v.views} vizualizări</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {active && (
        <div className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-4" onClick={() => setActive(null)} data-testid="gaming-video-modal">
          <div className="w-full max-w-4xl glass rounded-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <p className="font-semibold text-sm">{active.title}</p>
              <button data-testid="gaming-video-close" onClick={() => setActive(null)} className="text-zinc-400 hover:text-[#39FF14]"><X size={20} /></button>
            </div>
            <video src={mediaUrl(active.video_url)} controls autoPlay className="w-full aspect-video bg-black" data-testid="gaming-video-player" />
          </div>
        </div>
      )}
    </div>
  );
}
