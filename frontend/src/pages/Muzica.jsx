import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Share2, Download, Headphones, MessageSquare } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";

const FILTERS = [
  { key: "toate", label: "Toate" },
  { key: "remix", label: "Remixuri" },
  { key: "ai", label: "AI" },
  { key: "collab", label: "Colaborări" },
  { key: "noi", label: "Noi" },
];

export default function Muzica() {
  const [tracks, setTracks] = useState([]);
  const [filter, setFilter] = useState("toate");
  const [liked, setLiked] = useState(() => JSON.parse(localStorage.getItem("bioxic_likes") || "[]"));
  const [openComments, setOpenComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState(localStorage.getItem("bioxic_name") || "");
  const [commentText, setCommentText] = useState("");
  const { current, playing, playTrack, toggle } = usePlayer();
  const [params] = useSearchParams();
  const highlightId = params.get("track");
  const gParam = params.get("g");

  useEffect(() => {
    if (gParam && FILTERS.some((f) => f.key === gParam)) setFilter(gParam);
  }, [gParam]);

  useEffect(() => {
    api.get("/tracks", { params: { genre: filter } }).then((r) => setTracks(r.data || [])).catch(() => {});
  }, [filter]);

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`track-${highlightId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, tracks]);

  const like = async (t) => {
    if (liked.includes(t.id)) return;
    try {
      const r = await api.post(`/tracks/${t.id}/like`);
      const nl = [...liked, t.id];
      setLiked(nl);
      localStorage.setItem("bioxic_likes", JSON.stringify(nl));
      setTracks((ts) => ts.map((x) => (x.id === t.id ? { ...x, likes: r.data.likes } : x)));
      // dacă e logat, piesa intră și la favorite în cont
      api.post(`/fans/favorites/${t.id}`).catch(() => {});
    } catch (e) { /* ignoră */ }
  };

  const share = (t) => {
    const url = `${window.location.origin}/muzica?track=${t.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Link copiat!", { description: url })).catch(() => {});
  };

  const loadComments = async (t) => {
    if (openComments === t.id) { setOpenComments(null); return; }
    setOpenComments(t.id);
    try {
      const r = await api.get(`/tracks/${t.id}/comments`);
      setComments(r.data || []);
    } catch (e) { setComments([]); }
  };

  const sendComment = async (t) => {
    if (!commentText.trim()) return;
    try {
      localStorage.setItem("bioxic_name", commentName);
      const r = await api.post(`/tracks/${t.id}/comments`, { name: commentName || "Fan", text: commentText });
      setComments((c) => [r.data, ...c]);
      setCommentText("");
      toast.success("Comentariu adăugat!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Eroare la comentariu");
    }
  };

  const isCurrent = (t) => current?.id === t.id;

  return (
    <div data-testid="muzica-page" className="max-w-7xl mx-auto px-6 py-14">
      <p className="text-[#00C853] text-xs uppercase tracking-[0.4em] mb-3">Catalog oficial</p>
      <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-10">
        Muzică<span className="text-[#39FF14]">.</span>
      </h1>

      <div className="flex flex-wrap gap-2 mb-10" data-testid="track-filters">
        {FILTERS.map((f) => (
          <button key={f.key} data-testid={`filter-${f.key}`} onClick={() => setFilter(f.key)}
            className={`px-5 py-2 text-xs uppercase tracking-widest border transition-colors ${filter === f.key ? "bg-[#39FF14] text-black border-[#39FF14] font-bold" : "border-white/15 text-zinc-400 hover:border-[#39FF14]/50 hover:text-white"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {tracks.length === 0 && (
        <div className="glass rounded-sm p-14 text-center text-zinc-500" data-testid="no-tracks">Nicio piesă în această categorie încă.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((t, i) => (
          <motion.div key={t.id} id={`track-${t.id}`} data-testid={`track-card-${t.id}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass rounded-sm overflow-hidden group transition-shadow hover:box-glow ${highlightId === t.id ? "ring-1 ring-[#39FF14]" : ""}`}>
            <div className="relative aspect-square overflow-hidden">
              <img src={mediaUrl(t.cover_url) || "/placeholder.svg"} alt={t.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <button
                data-testid={`play-track-${t.id}`}
                onClick={() => (isCurrent(t) ? toggle() : playTrack(t, tracks))}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label={`Redă ${t.title}`}>
                <span className="p-4 bg-[#39FF14] rounded-sm">
                  {isCurrent(t) && playing ? <Pause size={26} fill="black" className="text-black" /> : <Play size={26} fill="black" className="text-black" />}
                </span>
              </button>
              <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-[#39FF14] text-[10px] uppercase tracking-widest border border-[#39FF14]/30">
                {t.genre === "ai" ? "AI" : t.genre === "collab" ? "Colab" : "Remix"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-semibold text-sm truncate" data-testid={`track-title-${t.id}`}>{t.title}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(t.tags || []).map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/5 text-zinc-500 uppercase tracking-wider">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-4 text-zinc-500">
                  <span className="flex items-center gap-1.5 text-xs" data-testid={`track-plays-${t.id}`}><Headphones size={13} /> {t.plays}</span>
                  <button data-testid={`like-track-${t.id}`} onClick={() => like(t)} className={`flex items-center gap-1.5 text-xs transition-colors ${liked.includes(t.id) ? "text-[#39FF14]" : "hover:text-[#39FF14]"}`} aria-label="Apreciază">
                    <Heart size={13} fill={liked.includes(t.id) ? "#39FF14" : "none"} /> {t.likes}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button data-testid={`comments-track-${t.id}`} onClick={() => loadComments(t)} className="p-1.5 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Comentarii"><MessageSquare size={14} /></button>
                  <button data-testid={`share-track-${t.id}`} onClick={() => share(t)} className="p-1.5 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Distribuie"><Share2 size={14} /></button>
                  {t.download_enabled && (
                    <a data-testid={`download-track-${t.id}`} href={mediaUrl(`/api/tracks/${t.id}/download`)} className="p-1.5 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Descarcă"><Download size={14} /></a>
                  )}
                </div>
              </div>
              {openComments === t.id && (
                <div className="mt-4 pt-3 border-t border-white/5" data-testid={`comments-panel-${t.id}`}>
                  <div className="max-h-36 overflow-y-auto space-y-2 mb-3">
                    {comments.length === 0 && <p className="text-xs text-zinc-600">Fii primul care comentează.</p>}
                    {comments.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="text-[#39FF14] font-semibold">{c.name}: </span>
                        <span className="text-zinc-400">{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input data-testid={`comment-name-${t.id}`} value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="Numele tău"
                      className="bg-black/40 border border-white/10 px-3 py-1.5 text-xs focus:border-[#39FF14] outline-none" />
                    <div className="flex gap-2">
                      <input data-testid={`comment-input-${t.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Scrie un comentariu..."
                        className="flex-1 bg-black/40 border border-white/10 px-3 py-1.5 text-xs focus:border-[#39FF14] outline-none" />
                      <button data-testid={`comment-send-${t.id}`} onClick={() => sendComment(t)} className="px-3 py-1.5 bg-[#39FF14] text-black text-xs font-bold uppercase">Trimite</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
