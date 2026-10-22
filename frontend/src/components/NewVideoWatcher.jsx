import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Play } from "lucide-react";
import api from "@/lib/api";

export default function NewVideoWatcher() {
  const [newVideo, setNewVideo] = useState(null);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const r = await api.get("/youtube/videos");
        const latest = r.data?.[0];
        if (!latest || !alive) return;
        const seen = localStorage.getItem("bioxic_latest_video");
        if (!seen) {
          localStorage.setItem("bioxic_latest_video", latest.id);
          return;
        }
        if (seen !== latest.id) {
          localStorage.setItem("bioxic_latest_video", latest.id);
          setNewVideo(latest);
          setTimeout(() => setNewVideo(null), 20000);
        }
      } catch (e) { /* ignoră */ }
    };
    const t = setTimeout(check, 3000);
    const interval = setInterval(check, 60000);
    return () => { alive = false; clearTimeout(t); clearInterval(interval); };
  }, []);

  return (
    <AnimatePresence>
      {newVideo && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-[92vw] max-w-lg"
          data-testid="new-video-banner"
        >
          <div className="glass rounded-sm overflow-hidden box-glow-strong border-[var(--accent)]/50">
            <div className="relative h-36 sm:h-44">
              <img src={newVideo.thumbnail} alt={newVideo.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} /> Lansare nouă
              </span>
              <button data-testid="new-video-close" onClick={() => setNewVideo(null)} className="absolute top-3 right-3 p-1.5 bg-black/60 text-white hover:text-[var(--accent)]" aria-label="Închide"><X size={15} /></button>
            </div>
            <div className="p-4 flex items-center gap-4">
              <p className="flex-1 text-sm font-semibold line-clamp-2">{newVideo.title}</p>
              <a data-testid="new-video-watch" href={`https://www.youtube.com/watch?v=${newVideo.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 bg-[var(--accent)] text-black font-display font-bold text-xs tracking-widest uppercase hover:bg-[var(--accent2)] transition-colors shrink-0">
                <Play size={13} fill="black" /> Vezi
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
