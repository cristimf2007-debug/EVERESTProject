import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Share2, Download, Headphones, MessageSquare, Search, ExternalLink, ListMusic, UserPlus, UserCheck } from "lucide-react";
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
const GENRE_LABEL = { remix: "REMIX", ai: "AI", collab: "COLAB" };

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

function FollowPill() {
  const [follow, setFollow] = useState({ followers: 0, following: false });
  useEffect(() => { api.get("/follow/status").then((r) => setFollow(r.data)).catch(() => {}); }, []);
  const toggleFollow = async () => {
    try {
      const r = await api.post("/fans/follow");
      setFollow({ followers: r.data.followers, following: r.data.following });
      toast.success(r.data.following ? "Urmărești canalul BIOXIC!" : "Ai dat unfollow");
    } catch (e) {
      toast.info("Intră în cont ca să dai follow", { action: { label: "Cont", onClick: () => (window.location.href = "/cont") } });
    }
  };
  return (
    <button data-testid="channel-follow" onClick={toggleFollow} className={`btn-x ${follow.following ? "" : "gold"} !py-2 !px-4 text-[13px]`}>
      {follow.following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {follow.following ? "Urmărit" : "Follow"} · {follow.followers}
    </button>
  );
}

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
    () => tracks.filter((t) => (t.title + " " + (t.tags || []).join(" ")).toLowerCase().includes(query.toLowerCase())),
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
    <div data-testid="muzica-page" className="max-w-[1120px] mx-auto px-4 py-10">
      {/* HEAD SEIF */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-end pb-7 border-b border-[rgba(234,242,237,0.11)]">
        <div>
          <div className="eyebrow">Seiful BIOXIC</div>
          <h1 className="font-display font-black text-[clamp(40px,8vw,92px)] leading-[0.9] tracking-tight" data-testid="vault-title">
            Piese care<br /><em className="not-italic text-[var(--accent)]">nu sunt</em> pe YouTube.
          </h1>
          <p className="text-[var(--mist)] max-w-[52ch] mt-3.5">
            Mashup-uri scoase de pe platforme, remixuri de club și piese noi înainte să iasă oriunde altundeva. Le asculți doar aici.
          </p>
        </div>
        <div className="seal shrink-0" aria-hidden="true"><span>EXCLUSIV<br />BIOXIC<br />★ 2026 ★</span></div>
      </div>

      {/* UNELTE */}
      <div className="flex flex-wrap gap-2.5 items-center mt-5">
        <label className="flex items-center gap-2 px-3.5 rounded-full border border-[rgba(234,242,237,0.11)] bg-black/20 flex-1 min-w-[200px]">
          <Search size={15} className="text-[var(--mist)]" />
          <input data-testid="track-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Caută o piesă sau un artist"
            className="flex-1 min-w-0 bg-transparent py-2.5 outline-none text-sm" aria-label="Caută piese" />
        </label>
        {visible.length > 0 && (
          <button data-testid="play-all" onClick={() => playTrack(visible[0], visible)} className="btn-x !py-2 !px-4 text-[13px]">
            <ListMusic size={14} /> Ascultă tot
          </button>
        )}
        <FollowPill />
      </div>

      <div className="flex flex-wrap gap-2 mt-4" data-testid="track-filters">
        {FILTERS.map((f) => (
          <button key={f.key} data-testid={`filter-${f.key}`} onClick={() => setFilter(f.key)}
            className={`chip-x transition-colors ${filter === f.key ? "!bg-[var(--accent)] !text-[var(--night)] !border-transparent font-bold" : "hover:border-[var(--accent)]/50 hover:text-[var(--frost)]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* LISTĂ PIESE */}
      <div className="grid gap-2.5 mt-5" data-testid="track-list">
        {visible.length === 0 && (
          <div className="glass p-7 border-dashed" data-testid="no-tracks">
            <h3 className="font-semibold text-base">Seiful e gol deocamdată</h3>
            <p className="text-[var(--mist)] text-sm mt-1">Prima piesă exclusivă urcă curând. Revino sau urmărește pe TikTok ca să afli primul.</p>
          </div>
        )}
        {visible.map((t, i) => (
          <motion.div key={t.id} id={`track-${t.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
            <div
              data-testid={`track-row-${t.id}`}
              className={`glass grid grid-cols-[auto_56px_1fr_auto] sm:grid-cols-[auto_56px_1fr_auto_auto] gap-3 sm:gap-4 items-center px-3 py-3 cursor-pointer transition-all hover:border-[rgba(234,242,237,0.22)] ${isCurrent(t) ? "!border-[rgba(var(--accent-rgb),0.6)] box-glow" : ""} ${highlightId === t.id ? "ring-1 ring-[var(--accent)]" : ""}`}
              onClick={() => (isCurrent(t) ? toggle() : playTrack(t, visible))}
            >
              <span className="hidden sm:block font-mono-x text-[11px] text-[var(--dim)] w-14 tracking-wider">{GENRE_LABEL[t.genre] || "PIESĂ"}</span>
              <span className="relative w-14 h-14 rounded-xl overflow-hidden grid place-items-center shrink-0"
                style={{ background: "conic-gradient(from 210deg,#174a35,#0b2219,#3d2a0e,#174a35)" }}>
                {t.cover_url ? (
                  <img src={mediaUrl(t.cover_url)} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-black text-lg text-white/85">B</span>
                )}
              </span>
              <span className="min-w-0 grid gap-0.5">
                <b className={`text-base font-semibold truncate ${isCurrent(t) ? "text-[var(--accent)]" : ""}`} data-testid={`track-title-${t.id}`}>
                  {t.title}
                  {isCurrent(t) && playing && (
                    <span className="inline-flex gap-0.5 items-end h-3 ml-2 align-middle">
                      {[0, 1, 2].map((b) => <i key={b} className="w-[3px] bg-[var(--accent)] rounded-sm eq-bar inline-block" style={{ height: "100%", animationDelay: `${b * 0.25}s` }} />)}
                    </span>
                  )}
                </b>
                <span className="text-[var(--mist)] text-[13px] truncate">
                  BIOXIC {(t.tags || []).length > 0 && "· " + t.tags.map((x) => `#${x}`).join(" ")}
                </span>
              </span>
              <span className="hidden sm:flex items-center gap-3 text-[var(--dim)] text-xs shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="flex items-center gap-1" data-testid={`track-plays-${t.id}`}><Headphones size={12} /> {t.plays}</span>
                <button data-testid={`like-track-${t.id}`} onClick={() => like(t)} className={`flex items-center gap-1 transition-colors ${liked.includes(t.id) ? "text-[var(--accent)]" : "hover:text-[var(--accent)]"}`} aria-label="Apreciază">
                  <Heart size={13} fill={liked.includes(t.id) ? "var(--accent)" : "none"} /> {t.likes}
                </button>
                <button data-testid={`comments-track-${t.id}`} onClick={() => loadComments(t)} className="hover:text-[var(--accent)] transition-colors" aria-label="Comentarii"><MessageSquare size={13} /></button>
                <button data-testid={`share-track-${t.id}`} onClick={() => share(t)} className="hover:text-[var(--accent)] transition-colors" aria-label="Distribuie"><Share2 size={13} /></button>
                {t.download_enabled && (
                  <a data-testid={`download-track-${t.id}`} href={mediaUrl(`/api/tracks/${t.id}/download`)} className="hover:text-[var(--accent)] transition-colors" aria-label="Descarcă"><Download size={13} /></a>
                )}
              </span>
              <button data-testid={`play-track-${t.id}`}
                className={`w-11 h-11 rounded-full grid place-items-center transition-transform hover:scale-105 shrink-0 ${isCurrent(t) ? "bg-[var(--accent)]" : "bg-[var(--frost)]"}`}
                style={{ color: "var(--night)" }} aria-label={isCurrent(t) && playing ? "Pauză" : `Redă ${t.title}`}>
                {isCurrent(t) && playing ? <Pause size={17} fill="var(--night)" /> : <Play size={17} fill="var(--night)" />}
              </button>
            </div>

            {openComments === t.id && (
              <div className="glass mt-1.5 p-4 border-l-2 border-[var(--accent)]/40" data-testid={`comments-panel-${t.id}`} onClick={(e) => e.stopPropagation()}>
                <div className="max-h-36 overflow-y-auto space-y-2 mb-3">
                  {comments.length === 0 && <p className="text-xs text-[var(--dim)]">Fii primul care comentează.</p>}
                  {comments.map((c) => (
                    <div key={c.id} className="text-xs">
                      <span className="text-[var(--accent)] font-semibold">{c.name}: </span>
                      <span className="text-[var(--mist)]">{c.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input data-testid={`comment-name-${t.id}`} value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="Numele tău"
                    className="sm:w-40 bg-black/30 border border-[rgba(234,242,237,0.11)] rounded-xl px-3 py-2 text-xs focus:border-[var(--accent)] outline-none" />
                  <input data-testid={`comment-input-${t.id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Scrie un comentariu..."
                    onKeyDown={(e) => e.key === "Enter" && sendComment(t)}
                    className="flex-1 bg-black/30 border border-[rgba(234,242,237,0.11)] rounded-xl px-3 py-2 text-xs focus:border-[var(--accent)] outline-none" />
                  <button data-testid={`comment-send-${t.id}`} onClick={() => sendComment(t)} className="btn-x gold !py-2 !px-4 text-xs">Trimite</button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* EVEREST MANELE */}
      <section className="mt-16" data-testid="everest-section">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
          <div>
            <div className="eyebrow">Lansări oficiale</div>
            <h2 className="font-display font-extrabold text-[clamp(22px,3.2vw,32px)]">Everest <span className="text-[var(--accent)]">Manele</span></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {EVEREST_PLATFORMS.map((p) => (
              <a key={p.tid} href={p.href} target="_blank" rel="noopener noreferrer" data-testid={p.tid}
                className="chip-x hover:border-[var(--accent)]/60 hover:text-[var(--frost)] transition-colors">
                {p.label}
              </a>
            ))}
            <span data-testid="everest-spotify" className="chip-x opacity-50 cursor-not-allowed" title="Link-ul Spotify va fi adăugat în curând">Spotify — în curând</span>
          </div>
        </div>
        <p className="text-[var(--mist)] text-sm mb-5">Canalul secundar oficial. Piesele cu Nicolae Guță și BIOXIC, pe toate platformele.</p>
        <div className="grid gap-2.5">
          {EVEREST_TRACKS.map((t, i) => (
            <div key={t.title} data-testid={`everest-track-${i}`} className="glass px-4 py-3.5 flex items-center gap-4 hover:border-[rgba(234,242,237,0.22)] transition-colors">
              <span className="font-display font-black text-[var(--accent)]/40 text-lg w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{t.title}</p>
                <p className="text-[11px] text-[var(--dim)] truncate">{t.feat}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={t.apple} target="_blank" rel="noopener noreferrer" data-testid={`everest-apple-${i}`}
                  className="chip-x flex items-center gap-1.5 hover:border-[var(--accent)]/60 hover:text-[var(--frost)] transition-colors">
                  <ExternalLink size={11} /> Apple Music
                </a>
                {t.ytm && (
                  <a href={t.ytm} target="_blank" rel="noopener noreferrer" data-testid={`everest-ytm-${i}`}
                    className="hidden sm:flex chip-x items-center gap-1.5 hover:border-[var(--accent)]/60 hover:text-[var(--frost)] transition-colors">
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
