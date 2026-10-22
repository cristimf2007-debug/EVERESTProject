import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Share2, Download, Headphones, MessageSquare, Search, ExternalLink } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";

const FILTERS = [
  { key: "toate", label: "Toate" },
  { key: "remix", label: "Remixuri" },
  { key: "ai", label: "Piese AI" },
  { key: "collab", label: "Colaborări" },
  { key: "noi", label: "Noi" },
];

const GENRE_LABEL = { remix: "Remix", ai: "AI", collab: "Colaborare" };

function FollowButton() {
  const [follow, setFollow] = useState({ followers: 0, following: false });
  useEffect(() => {
    api.get("/follow/status").then((r) => setFollow(r.data)).catch(() => {});
  }, []);
  const toggle = async () => {
    try {
      const r = await api.post("/fans/follow");
      setFollow({ followers: r.data.followers, following: r.data.following });
      toast.success(r.data.following ? "Urmărești canalul BIOXIC!" : "Ai dat unfollow");
    } catch (e) {
      toast.info("Intră în cont ca să dai follow", { action: { label: "Cont", onClick: () => (window.location.href = "/cont") } });
    }
  };
  return (
    <button data-testid="channel-follow" onClick={toggle}
      className={`btn-cut flex items-center gap-2 px-6 py-3.5 font-display font-bold text-xs tracking-widest uppercase transition-colors ${follow.following ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/50" : "bg-[#39FF14] text-black hover:bg-[#00C853]"}`}>
      {follow.following ? "Urmărit ✓" : "Follow"} · {follow.followers}
    </button>
  );
}

const EVEREST_TRACKS = [
  { title: "Mi-e dor de tine", feat: "feat. BIOXIC",
    apple: "https://music.apple.com/us/album/mi-e-dor-de-tine-feat-bioxic/6818688064?i=6818688065",
    ytm: "https://music.youtube.com/watch?v=P-LrYfFvow8" },
  { title: "MI-E DOR DE NOI", feat: "feat. NICOLaiE Guta",
    apple: "https://music.apple.com/us/album/mi-e-dor-de-noi-feat-nicolaie-guta/6785641905?i=6785641906" },
  { title: "Te-am iubit din prima zi", feat: "feat. NICOLaiE Guta & BIOXIC",
    apple: "https://music.apple.com/us/album/te-am-iubit-din-prima-zi-feat-nicolaie-guta-bioxic/6819366416?i=6819366417" },
  { title: "Hai te rog eu suna-ma", feat: "feat. NICOLaiE Guta & BIOXIC",
    apple: "https://music.apple.com/us/album/hai-te-rog-eu-suna-ma-feat-nicolaie-guta-bioxic/6818759171?i=6818759172" },
  { title: "Suna-ma la orice ora", feat: "feat. NICOLaiE Guta & BIOXIC",
    apple: "https://music.apple.com/us/album/suna-ma-la-orice-ora-feat-nicolaie-guta-bioxic/6818795958?i=6818795962" },
];

const EVEREST_PLATFORMS = [
  { label: "Apple Music", href: "https://music.apple.com/us/artist/everest-manele/1896732157", tid: "everest-apple" },
  { label: "YouTube", href: "https://www.youtube.com/@EverestManele", tid: "everest-youtube" },
  { label: "Shazam", href: "https://www.shazam.com/artist/everest-manele/1896732157", tid: "everest-shazam" },
];

export default function Muzica() {
  const [tracks, setTracks] = useState([]);
  const [filter, setFilter] = useState("toate");
  const [query, setQuery] = useState("");
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

  const visible = useMemo(
    () => tracks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())),
    [tracks, query]
  );

  const like = async (t) => {
    if (liked.includes(t.id)) return;
    try {
      const r = await api.post(`/tracks/${t.id}/like`);
      const nl = [...liked, t.id];
      setLiked(nl);
      localStorage.setItem("bioxic_likes", JSON.stringify(nl));
      setTracks((ts) => ts.map((x) => (x.id === t.id ? { ...x, likes: r.data.likes } : x)));
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
    <div data-testid="muzica-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* HEADER CANAL */}
      <div className="relative glass rounded-sm overflow-hidden mb-10" data-testid="channel-header">
        <div className="h-28 sm:h-36 relative">
          <img src="/artist.jpg" alt="" className="w-full h-full object-cover object-[center_20%] opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050805] to-transparent" />
        </div>
        <div className="flex flex-wrap items-center gap-5 px-5 sm:px-8 -mt-10 pb-6 relative">
          <img src="/logo.png" alt="BIOXIC" className="h-16 sm:h-20 drop-shadow-[0_0_16px_rgba(57,255,20,0.5)]" />
          <div className="flex-1 min-w-[180px]">
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tighter">Canalul <span className="text-[#39FF14]">BIOXIC</span></h1>
            <p className="text-[#00C853] text-[11px] uppercase tracking-[0.3em] mt-1">No risks, no hits.</p>
            <p className="text-zinc-500 text-xs mt-1">Piesele urcate direct de artist. Playerul rămâne cu tine pe tot site-ul.</p>
          </div>
          <FollowButton />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex flex-wrap gap-2" data-testid="track-filters">
          {FILTERS.map((f) => (
            <button key={f.key} data-testid={`filter-${f.key}`} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${filter === f.key ? "bg-[#39FF14] text-black border-[#39FF14] font-bold" : "border-white/15 text-zinc-400 hover:border-[#39FF14]/50 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input data-testid="track-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută piesa..."
            className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2.5 text-sm focus:border-[#39FF14] outline-none" />
        </div>
      </div>

      {visible.length === 0 && (
        <div className="glass rounded-sm p-14 text-center text-zinc-500" data-testid="no-tracks">Nicio piesă aici încă.</div>
      )}

      {/* LISTĂ PIESE */}
      <div className="space-y-2" data-testid="track-list">
        {visible.map((t, i) => (
          <motion.div key={t.id} id={`track-${t.id}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
            <div
              data-testid={`track-row-${t.id}`}
              className={`group glass rounded-sm px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4 hover:border-[#39FF14]/40 transition-colors ${highlightId === t.id ? "ring-1 ring-[#39FF14]" : ""} ${isCurrent(t) ? "border-[#39FF14]/50 bg-[#39FF14]/5" : ""}`}
            >
              <button data-testid={`play-track-${t.id}`} onClick={() => (isCurrent(t) ? toggle() : playTrack(t, visible))}
                className="relative shrink-0 w-12 h-12 rounded-sm overflow-hidden" aria-label={`Redă ${t.title}`}>
                {t.cover_url ? (
                  <img src={mediaUrl(t.cover_url)} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full bg-[#39FF14]/10 flex items-center justify-center"><Headphones size={18} className="text-[#39FF14]" /></span>
                )}
                <span className={`absolute inset-0 bg-black/55 flex items-center justify-center transition-opacity ${isCurrent(t) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {isCurrent(t) && playing ? <Pause size={16} fill="#39FF14" className="text-[#39FF14]" /> : <Play size={16} fill="#39FF14" className="text-[#39FF14]" />}
                </span>
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate transition-colors ${isCurrent(t) ? "text-[#39FF14]" : "group-hover:text-[#39FF14]"}`} data-testid={`track-title-${t.id}`}>{t.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-zinc-500 uppercase tracking-wider border border-white/5">{GENRE_LABEL[t.genre] || t.genre}</span>
                  {(t.tags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="hidden sm:inline text-[9px] text-zinc-600 uppercase tracking-wider">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-zinc-500 text-xs shrink-0">
                <span className="flex items-center gap-1.5" data-testid={`track-plays-${t.id}`}><Headphones size={12} /> {t.plays}</span>
                <button data-testid={`like-track-${t.id}`} onClick={() => like(t)} className={`flex items-center gap-1.5 transition-colors ${liked.includes(t.id) ? "text-[#39FF14]" : "hover:text-[#39FF14]"}`} aria-label="Apreciază">
                  <Heart size={13} fill={liked.includes(t.id) ? "#39FF14" : "none"} /> {t.likes}
                </button>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button data-testid={`comments-track-${t.id}`} onClick={() => loadComments(t)} className="p-2 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Comentarii"><MessageSquare size={15} /></button>
                <button data-testid={`share-track-${t.id}`} onClick={() => share(t)} className="p-2 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Distribuie"><Share2 size={15} /></button>
                {t.download_enabled && (
                  <a data-testid={`download-track-${t.id}`} href={mediaUrl(`/api/tracks/${t.id}/download`)} className="p-2 text-zinc-500 hover:text-[#39FF14] transition-colors" aria-label="Descarcă"><Download size={15} /></a>
                )}
              </div>
            </div>

            {openComments === t.id && (
              <div className="glass rounded-sm mt-1 p-4 border-l-2 border-[#39FF14]/40" data-testid={`comments-panel-${t.id}`}>
                <div className="max-h-36 overflow-y-auto space-y-2 mb-3">
                  {comments.length === 0 && <p className="text-xs text-zinc-600">Fii primul care comentează.</p>}
                  {comments.map((c) => (
                    <div key={c.id} className="text-xs">
                      <span className="text-[#39FF14] font-semibold">{c.name}: </span>
                      <span className="text-zinc-400">{c.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input data-testid={`comment-name-${t.id}`} value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="Numele tău"
                    className="sm:w-40 bg-black/40 border border-white/10 px-3 py-2 text-xs focus:border-[#39FF14] outline-none" />
                  <input data-testid={`comment-input-${t.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Scrie un comentariu..."
                    onKeyDown={(e) => e.key === "Enter" && sendComment(t)}
                    className="flex-1 bg-black/40 border border-white/10 px-3 py-2 text-xs focus:border-[#39FF14] outline-none" />
                  <button data-testid={`comment-send-${t.id}`} onClick={() => sendComment(t)} className="px-4 py-2 bg-[#39FF14] text-black text-xs font-bold uppercase">Trimite</button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* EVEREST MANELE — LANSĂRI OFICIALE */}
      <section className="mt-20" data-testid="everest-section">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
          <div>
            <p className="text-[#00C853] text-xs uppercase tracking-[0.4em] mb-2">Lansări oficiale</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight">Everest <span className="text-[#39FF14]">Manele</span></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {EVEREST_PLATFORMS.map((p) => (
              <a key={p.tid} href={p.href} target="_blank" rel="noopener noreferrer" data-testid={p.tid}
                className="px-3 py-1.5 text-[10px] uppercase tracking-widest border border-white/15 text-zinc-400 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors">
                {p.label}
              </a>
            ))}
            <span data-testid="everest-spotify" className="px-3 py-1.5 text-[10px] uppercase tracking-widest border border-white/10 text-zinc-600 cursor-not-allowed" title="Link-ul Spotify va fi adăugat în curând">
              Spotify — în curând
            </span>
          </div>
        </div>
        <p className="text-zinc-500 text-sm mb-6">Canalul secundar oficial. Piesele cu Nicolae Guță și BIOXIC, pe toate platformele.</p>
        <div className="space-y-2">
          {EVEREST_TRACKS.map((t, i) => (
            <div key={t.title} data-testid={`everest-track-${i}`}
              className="glass rounded-sm px-4 py-3.5 flex items-center gap-4 hover:border-[#39FF14]/40 transition-colors">
              <span className="font-display font-black text-[#39FF14]/40 text-lg w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{t.title}</p>
                <p className="text-[11px] text-zinc-500 truncate">{t.feat}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={t.apple} target="_blank" rel="noopener noreferrer" data-testid={`everest-apple-${i}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors">
                  <ExternalLink size={11} /> Apple Music
                </a>
                {t.ytm && (
                  <a href={t.ytm} target="_blank" rel="noopener noreferrer" data-testid={`everest-ytm-${i}`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-300 hover:border-[#39FF14] hover:text-[#39FF14] transition-colors">
                    <ExternalLink size={11} /> YT Music
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
