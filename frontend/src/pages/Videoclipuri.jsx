import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Search, ChevronLeft, ChevronRight, AudioLines } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import api from "@/lib/api";

const CATS = [
  { key: "toate", label: "Toate" },
  { key: "remix", label: "Remixuri" },
  { key: "ai", label: "Piese AI" },
  { key: "oficial", label: "Piese oficiale" },
  { key: "everest", label: "Everest Manele" },
];

function catOf(v) {
  const t = v.title.toLowerCase();
  if (t.includes("artificial") || t.includes(" ai ") || t.includes("(ai") || t.includes(" ai)") || t.includes("ai concept")) return "ai";
  if (t.includes("remix") || t.includes("mashup")) return "remix";
  return "oficial";
}

const CAT_LABEL = { remix: "Remix", ai: "AI", oficial: "Oficial" };

function VideoCard({ v, onOpen, tid, compact }) {
  return (
    <button
      data-testid={tid}
      onClick={() => onOpen(v)}
      className={`group glass rounded-sm overflow-hidden text-left hover:box-glow transition-shadow shrink-0 ${compact ? "w-60 sm:w-64 snap-start" : "w-full"}`}
    >
      <div className="relative aspect-video overflow-hidden">
        <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="p-3 bg-[#f3c46a] rounded-sm"><Play size={18} fill="black" className="text-black" /></span>
        </div>
        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-[#f3c46a] text-[9px] uppercase tracking-widest border border-[#f3c46a]/30">
          {CAT_LABEL[catOf(v)]}
        </span>
        {v.channel === "Everest Manele" && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[9px] uppercase tracking-widest border border-white/20">Everest</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold line-clamp-2 group-hover:text-[#f3c46a] transition-colors">{v.title}</p>
        <p className="text-[10px] text-zinc-500 mt-1.5">{new Date(v.published).toLocaleDateString("ro-RO")} · {v.channel}</p>
      </div>
    </button>
  );
}

function Carousel({ title, videos, onOpen, tidPrefix }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  if (!videos.length) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg sm:text-xl uppercase tracking-tight">{title} <span className="text-zinc-600 text-sm">({videos.length})</span></h2>
        <div className="flex gap-2">
          <button data-testid={`${tidPrefix}-prev`} onClick={() => scroll(-1)} className="p-2 border border-white/15 text-zinc-400 hover:border-[#f3c46a] hover:text-[#f3c46a] transition-colors" aria-label="Înapoi"><ChevronLeft size={16} /></button>
          <button data-testid={`${tidPrefix}-next`} onClick={() => scroll(1)} className="p-2 border border-white/15 text-zinc-400 hover:border-[#f3c46a] hover:text-[#f3c46a] transition-colors" aria-label="Înainte"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }} data-testid={`${tidPrefix}-carousel`}>
        {videos.map((v, i) => <VideoCard key={v.id} v={v} onOpen={onOpen} tid={`${tidPrefix}-video-${i}`} compact />)}
      </div>
    </div>
  );
}

export default function Videoclipuri() {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("toate");
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/youtube/videos").then((r) => setVideos(r.data || [])).catch(() => {});
  }, []);

  const searched = useMemo(
    () => videos.filter((v) => v.title.toLowerCase().includes(query.toLowerCase())),
    [videos, query]
  );
  const byCat = (c) => searched.filter((v) => catOf(v) === c);
  const everest = searched.filter((v) => v.channel === "Everest Manele");

  const gridVideos = cat === "everest" ? everest : cat === "toate" ? [] : byCat(cat);

  return (
    <div data-testid="videoclipuri-page" className="max-w-7xl mx-auto px-6 py-14">
      <p className="text-[#8cc7a8] text-xs uppercase tracking-[0.4em] mb-3">YouTube · BIOXIC + Everest Manele</p>
      <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-8">
        Videoclipuri<span className="text-[#f3c46a]">.</span>
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-10">
        <div className="flex flex-wrap gap-2" data-testid="video-cats">
          {CATS.map((c) => (
            <button key={c.key} data-testid={`cat-${c.key}`} onClick={() => setCat(c.key)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${cat === c.key ? "bg-[#f3c46a] text-black border-[#f3c46a] font-bold" : "border-white/15 text-zinc-400 hover:border-[#f3c46a]/50 hover:text-white"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input data-testid="video-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută (Guță, Maxim...)"
            className="w-full bg-black/40 border border-white/10 pl-10 pr-3 py-2.5 text-sm focus:border-[#f3c46a] outline-none" />
        </div>
      </div>

      {cat === "toate" ? (
        <>
          <Carousel title="Remixuri" videos={byCat("remix")} onOpen={setActive} tidPrefix="car-remix" />
          <Carousel title="Piese AI" videos={byCat("ai")} onOpen={setActive} tidPrefix="car-ai" />
          <Carousel title="Piese oficiale" videos={byCat("oficial")} onOpen={setActive} tidPrefix="car-oficial" />
          <Carousel title="Everest Manele" videos={everest} onOpen={setActive} tidPrefix="car-everest" />
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="videos-grid">
          {gridVideos.map((v, i) => <VideoCard key={v.id} v={v} onOpen={setActive} tid={`grid-video-${i}`} />)}
          {gridVideos.length === 0 && <p className="text-zinc-500 py-10 text-sm" data-testid="no-videos">Niciun videoclip în această categorie.</p>}
        </div>
      )}

      {/* SPOTIFY */}
      <section className="mt-16" data-testid="spotify-section">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight flex items-center gap-3">
            <AudioLines size={24} className="text-[#1DB954]" /> Pe <span className="text-[#1DB954]">Spotify</span>
          </h2>
          <a href="https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK" target="_blank" rel="noopener noreferrer" data-testid="spotify-profile-link"
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-[#1DB954] transition-colors">
            Deschide profilul →
          </a>
        </div>
        <div className="glass rounded-sm overflow-hidden border-white/10">
          <iframe
            data-testid="spotify-embed"
            src="https://open.spotify.com/embed/artist/4tlelg9L2y1OFOVpUkIiAK?utm_source=generator&theme=0"
            width="100%" height="352" frameBorder="0" loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            title="BIOXIC pe Spotify"
          />
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-4xl bg-[#06110d] border-[#f3c46a]/30 p-0 overflow-hidden" data-testid="video-lightbox">
          {active && (
            <div>
              <div className="aspect-video">
                <iframe src={`https://www.youtube.com/embed/${active.id}?autoplay=1`} title={active.title}
                  className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen data-testid="lightbox-iframe" />
              </div>
              <div className="p-4 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold">{active.title}</p>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">{active.channel}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
