import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import api from "@/lib/api";

export default function Videoclipuri() {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/youtube/videos").then((r) => setVideos(r.data || [])).catch(() => {});
  }, []);

  const filtered = videos.filter((v) => v.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div data-testid="videoclipuri-page" className="max-w-7xl mx-auto px-6 py-14">
      <p className="text-[#00C853] text-xs uppercase tracking-[0.4em] mb-3">Direct de pe YouTube</p>
      <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-8">
        Videoclipuri<span className="text-[#39FF14]">.</span>
      </h1>

      <div className="relative mb-10 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input data-testid="video-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută un videoclip..."
          className="w-full bg-black/40 border border-white/10 pl-11 pr-4 py-3 text-sm focus:border-[#39FF14] outline-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v, i) => (
          <motion.button key={v.id} data-testid={`video-card-${i}`} onClick={() => setActive(v)}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.5) }}
            className="group glass rounded-sm overflow-hidden text-left hover:box-glow transition-shadow">
            <div className="relative aspect-video overflow-hidden">
              <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="p-4 bg-[#39FF14] rounded-sm"><Play size={24} fill="black" className="text-black" /></span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold line-clamp-2 group-hover:text-[#39FF14] transition-colors">{v.title}</p>
              <p className="text-[11px] text-zinc-500 mt-2">{new Date(v.published).toLocaleDateString("ro-RO")}</p>
            </div>
          </motion.button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-zinc-500 text-center py-16" data-testid="no-videos">Niciun videoclip găsit.</p>}

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-4xl bg-[#050805] border-[#39FF14]/30 p-0 overflow-hidden" data-testid="video-lightbox">
          {active && (
            <div>
              <div className="aspect-video">
                <iframe src={`https://www.youtube.com/embed/${active.id}?autoplay=1`} title={active.title}
                  className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen data-testid="lightbox-iframe" />
              </div>
              <p className="p-4 text-sm font-semibold">{active.title}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
