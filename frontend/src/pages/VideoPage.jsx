import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, Heart, Share2, Bookmark, MessageCircle, Pin, Trash2, BadgeCheck, X } from "lucide-react";
import { toast } from "sonner";
import api, { mediaUrl, getSid, formatApiError } from "@/lib/api";
import VideoPlayer from "@/components/VideoPlayer";

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
const timeAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "azi";
  if (d === 1) return "acum o zi";
  if (d < 30) return `acum ${d} zile`;
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
};
const videoType = (t) => {
  const x = t.toLowerCase();
  if (x.includes("mashup")) return "MASHUP";
  if (x.includes("remix")) return "REMIX";
  if (x.includes("cover")) return "COVER";
  return "MANEA";
};

// text cu timestamp-uri clickabile (1:23 → sare la secunda) și link-uri clickabile
function RichText({ text, onSeek }) {
  const parts = text.split(/(\b\d{1,2}:\d{2}\b|https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^(\d{1,2}):(\d{2})$/);
        if (m && onSeek) {
          const sec = parseInt(m[1]) * 60 + parseInt(m[2]);
          return (
            <button key={i} onClick={() => onSeek(sec)} className="text-[var(--accent)] font-mono-x hover:underline">
              {p}
            </button>
          );
        }
        if (/^https?:\/\//.test(p)) {
          return (
            <a key={i} href={p} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline break-all" onClick={(e) => e.stopPropagation()}>
              {p}
            </a>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function Comments({ videoId, onSeek }) {
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("top");
  const [name, setName] = useState(() => localStorage.getItem("bioxic_name") || "");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [me, setMe] = useState(null); // admin?
  const load = () => api.get(`/videos/${videoId}/comments`, { params: { sort } }).then((r) => setItems(r.data || [])).catch(() => {});

  useEffect(() => { load(); }, [videoId, sort]);
  useEffect(() => { api.get("/auth/me").then((r) => setMe(r.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/videos/${videoId}/comments`, { name: name.trim() || "Fan", text: text.trim(), parent_id: replyTo?.id || "" });
      if (name.trim()) localStorage.setItem("bioxic_name", name.trim());
      setText("");
      setReplyTo(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const like = async (c) => { await api.post(`/videos/comments/${c.id}/like`).catch(() => {}); setItems((xs) => xs.map((x) => x.id === c.id ? { ...x, likes: (x.likes || 0) + 1 } : x)); };
  const del = async (c) => { await api.delete(`/admin/videos/comments/${c.id}`).catch((e) => toast.error(formatApiError(e))); load(); };
  const pin = async (c) => { await api.post(`/admin/videos/comments/${c.id}/pin`).catch((e) => toast.error(formatApiError(e))); load(); };

  const roots = items.filter((c) => !c.parent_id).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const replies = (id) => items.filter((c) => c.parent_id === id);

  return (
    <section className="mt-10" data-testid="video-comments">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-extrabold uppercase flex items-center gap-2.5">
          <MessageCircle size={17} className="text-[var(--accent)]" /> {items.length} comentarii
        </h3>
        <div className="flex gap-1.5">
          {[["top", "Top"], ["new", "Cele mai noi"]].map(([v, l]) => (
            <button key={v} data-testid={`comments-sort-${v}`} onClick={() => setSort(v)}
              className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${sort === v ? "border-transparent text-[var(--on-accent)]" : "border-[var(--line)] text-[var(--mist)]"}`}
              style={sort === v ? { background: "linear-gradient(180deg, var(--accent-hi), var(--accent))" } : {}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="glass rounded-2xl p-4 mt-5" data-testid="comment-form">
        {replyTo && (
          <p className="text-xs text-[var(--mist)] mb-2 flex items-center gap-2">
            Răspunzi lui <b className="text-[var(--accent)]">{replyTo.name}</b>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Anulează"><X size={12} /></button>
          </p>
        )}
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău" maxLength={24} data-testid="comment-name"
            className="w-36 rounded-full bg-black/30 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrie un comentariu… (1:23 devine link)" maxLength={300} data-testid="comment-text"
            className="flex-1 rounded-full bg-black/30 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors" />
          <button data-testid="comment-submit" className="btn-x gold !py-2.5 !px-5 text-xs font-bold uppercase tracking-widest shrink-0">Trimite</button>
        </div>
      </form>

      <div className="grid gap-2.5 mt-5" data-testid="comments-list">
        {roots.map((c) => (
          <div key={c.id} className="glass rounded-xl px-4 py-3" data-testid={`comment-${c.id}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[var(--accent)]">{c.name}</span>
              {c.pinned && <span className="flex items-center gap-1 text-[9px] font-mono-x uppercase tracking-widest text-[var(--accent)] border border-[rgba(var(--accent-rgb),.4)] rounded-full px-2 py-0.5"><Pin size={9} /> Fixat de BIOXIC</span>}
              <span className="text-[10px] font-mono-x text-[var(--dim)]">{timeAgo(c.created_at)}</span>
              <div className="flex-1" />
              {me && (
                <>
                  <button onClick={() => pin(c)} className="text-[var(--dim)] hover:text-[var(--accent)] transition-colors" aria-label="Fixează" data-testid={`comment-pin-${c.id}`}><Pin size={13} /></button>
                  <button onClick={() => del(c)} className="text-[var(--dim)] hover:text-[var(--berry)] transition-colors" aria-label="Șterge" data-testid={`comment-delete-${c.id}`}><Trash2 size={13} /></button>
                </>
              )}
            </div>
            <p className="text-sm text-[var(--frost)]/90 mt-1.5 leading-relaxed"><RichText text={c.text} onSeek={onSeek} /></p>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => like(c)} className="flex items-center gap-1.5 text-[11px] text-[var(--mist)] hover:text-[var(--berry)] transition-colors" data-testid={`comment-like-${c.id}`}>
                <Heart size={12} /> {c.likes || 0}
              </button>
              <button onClick={() => setReplyTo(c)} className="text-[11px] text-[var(--mist)] hover:text-[var(--accent)] transition-colors" data-testid={`comment-reply-${c.id}`}>Răspunde</button>
            </div>
            {replies(c.id).map((r) => (
              <div key={r.id} className="ml-6 mt-2.5 border-l-2 border-[var(--line)] pl-3" data-testid={`comment-${r.id}`}>
                <span className="text-sm font-bold text-[var(--accent)]">{r.name}</span>
                <span className="text-[10px] font-mono-x text-[var(--dim)] ml-2">{timeAgo(r.created_at)}</span>
                <p className="text-sm text-[var(--frost)]/90 mt-1"><RichText text={r.text} onSeek={onSeek} /></p>
              </div>
            ))}
          </div>
        ))}
        {roots.length === 0 && <p className="text-sm text-[var(--dim)] py-4 text-center">Fii primul care comentează.</p>}
      </div>
    </section>
  );
}

export default function VideoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [video, setVideo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(() => localStorage.getItem(`bioxic_vlike_${id}`) === "1");
  const [likes, setLikes] = useState(0);
  const [saved, setSaved] = useState(() => (JSON.parse(localStorage.getItem("bioxic_saved") || "[]")).includes(id));
  const [moreOpen, setMoreOpen] = useState(false);
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem("bioxic_autoplay") !== "0");
  const [ending, setEnding] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const seekApi = useRef(null);

  useEffect(() => {
    api.get("/videos").then((r) => {
      const all = r.data || [];
      setVideos(all);
      const v = all.find((x) => x.id === id);
      if (v) { setVideo(v); setLikes(v.likes || 0); }
      else setNotFound(true);
    }).catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => { setEnding(false); setLiked(localStorage.getItem(`bioxic_vlike_${id}`) === "1"); setSaved((JSON.parse(localStorage.getItem("bioxic_saved") || "[]")).includes(id)); }, [id]);

  const upNext = useMemo(() => {
    const others = videos.filter((v) => v.id !== id);
    return others.sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [videos, id]);
  const nextVideo = upNext[0];

  // autoplay next: countdown 5s la final
  useEffect(() => {
    if (!ending) return;
    if (!autoplay || !nextVideo) return;
    if (countdown <= 0) { navigate(`/clipuri/${nextVideo.id}`); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [ending, countdown, autoplay, nextVideo, navigate]);

  const doLike = async () => {
    const nv = !liked;
    setLiked(nv);
    localStorage.setItem(`bioxic_vlike_${id}`, nv ? "1" : "0");
    try { const r = await api.post(`/videos/${id}/like`, { sid: getSid(), liked: nv }); setLikes(r.data.likes); } catch { /* revine la refresh */ }
  };

  const share = (withTime) => {
    const base = `${window.location.origin}/clipuri/${id}`;
    const t = withTime && seekApi.current ? Math.floor(seekApi.current.time()) : 0;
    const url = t > 0 ? `${base}?t=${t}` : base;
    const text = `BIOXIC — ${video?.title}`;
    navigator.clipboard?.writeText(withTime ? url : `${text}\n${url}`).then(() => {
      toast.success(withTime ? `Link copiat — începe de la ${fmt(t)}` : "Link copiat!", { description: "Gata de trimis pe WhatsApp / TikTok" });
    }).catch(() => {});
  };

  const toggleSave = () => {
    const list = JSON.parse(localStorage.getItem("bioxic_saved") || "[]");
    const nv = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    localStorage.setItem("bioxic_saved", JSON.stringify(nv));
    setSaved(!list.includes(id));
    toast.success(!list.includes(id) ? "Salvat la colecția ta." : "Scos din salvate.");
  };

  const seekTo = (sec) => seekApi.current?.seek(sec);

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center" data-testid="video-not-found">
        <p className="font-display text-2xl font-extrabold uppercase">Clipul nu există</p>
        <Link to="/clipuri" className="btn-x gold mt-6 !py-2.5 !px-6 text-xs font-bold uppercase tracking-widest">Toate clipurile</Link>
      </div>
    );
  }
  if (!video) {
    return <div className="max-w-6xl mx-auto px-4 py-16"><div className="glass rounded-2xl aspect-video animate-pulse" /></div>;
  }

  return (
    <div data-testid="video-page" className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-8 items-start">
        <div className="min-w-0">
          <VideoPlayer video={video} onEnded={() => { setCountdown(5); setEnding(true); }} seekApi={seekApi} />

          {/* overlay final: autoplay next */}
          {ending && nextVideo && (
            <div className="glass rounded-2xl mt-4 p-5 flex items-center gap-4" data-testid="autoplay-next">
              <img src={mediaUrl(nextVideo.thumb_url) || "/logo-alt.png"} alt="" className="w-20 h-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--accent)]">Urmează {autoplay ? `în ${countdown}s` : ""}</p>
                <p className="text-sm font-bold truncate mt-0.5">{nextVideo.title}</p>
              </div>
              <button onClick={() => navigate(`/clipuri/${nextVideo.id}`)} className="btn-x gold !py-2 !px-4 text-[10px] font-black uppercase tracking-widest shrink-0" data-testid="autoplay-now">Redă acum</button>
              <button onClick={() => setEnding(false)} className="btn-ghost rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest shrink-0" data-testid="autoplay-cancel">Anulează</button>
            </div>
          )}

          <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight mt-5" data-testid="video-title">{video.title}</h1>
          <p className="flex flex-wrap items-center gap-2.5 text-[11px] font-mono-x uppercase tracking-[0.14em] text-[var(--mist)] mt-2.5">
            <span className="flex items-center gap-1.5"><Eye size={12} /> {video.views || 0} vizualizări</span>
            <span>·</span><span>{timeAgo(video.created_at)}</span>
            <span className="rounded-full border border-[rgba(var(--accent-rgb),.45)] text-[var(--accent)] px-2.5 py-0.5" data-testid="video-type-badge">{videoType(video.title)}</span>
          </p>

          {/* canal + acțiuni */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <img src="/artist.jpg" alt="BIOXIC" className="w-10 h-10 rounded-full object-cover border border-[var(--accent)]" />
            <div className="mr-2">
              <p className="text-sm font-bold flex items-center gap-1.5">BIOXIC <BadgeCheck size={14} className="text-[var(--accent)]" /></p>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)]">@djbioxic</p>
            </div>
            <button onClick={doLike} data-testid="video-like"
              className={`btn-x !py-2.5 text-xs font-bold ${liked ? "!border-[rgba(194,29,29,.6)] text-[var(--berry)]" : ""}`}>
              <Heart size={14} fill={liked ? "currentColor" : "none"} /> Apreciez · {likes}
            </button>
            <div className="relative group/sharev">
              <button className="btn-x !py-2.5 text-xs font-bold" data-testid="video-share"><Share2 size={14} /> Distribuie</button>
              <div className="absolute left-0 top-11 hidden group-hover/sharev:grid glass rounded-xl p-1.5 gap-0.5 w-52 z-20" data-testid="video-share-menu">
                <button onClick={() => share(false)} className="text-left text-xs rounded-lg px-3 py-2 hover:bg-white/5 transition-colors" data-testid="video-share-copy">Copiază link</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`BIOXIC — ${video.title}\n${window.location.origin}/clipuri/${id}`)}`} target="_blank" rel="noreferrer" className="text-xs rounded-lg px-3 py-2 hover:bg-white/5 transition-colors" data-testid="video-share-whatsapp">WhatsApp</a>
                <button onClick={() => share(true)} className="text-left text-xs rounded-lg px-3 py-2 hover:bg-white/5 transition-colors" data-testid="video-share-time">Copiază cu timestamp ({seekApi.current ? fmt(seekApi.current.time()) : "0:00"})</button>
              </div>
            </div>
            <button onClick={toggleSave} data-testid="video-save" className={`btn-x !py-2.5 text-xs font-bold ${saved ? "text-[var(--accent)]" : ""}`}>
              <Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "Salvat" : "Salvează"}
            </button>
          </div>

          {/* descriere */}
          <div className="glass rounded-2xl p-5 mt-5 cursor-pointer" onClick={() => setMoreOpen((o) => !o)} data-testid="video-description">
            <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)]">{video.views || 0} vizualizări · {timeAgo(video.created_at)}</p>
            <p className={`text-sm text-[var(--frost)]/85 leading-relaxed mt-2 ${moreOpen ? "" : "line-clamp-3"}`}>
              <RichText text={video.description || "Remix BIOXIC. Ascultă și varianta audio pe radioul live 24/7 — toată lumea aude aceeași piesă, la aceeași secundă."} onSeek={seekTo} />
            </p>
            <p className="text-[11px] font-bold text-[var(--accent)] mt-2 uppercase tracking-widest">{moreOpen ? "Mai puțin" : "Mai mult…"}</p>
          </div>

          <div className="lg:hidden">
            <UpNext upNext={upNext} currentId={id} autoplay={autoplay} setAutoplay={setAutoplay} />
          </div>
          <Comments videoId={id} onSeek={seekTo} />
        </div>

        <aside className="hidden lg:block sticky top-6">
          <UpNext upNext={upNext} currentId={id} autoplay={autoplay} setAutoplay={setAutoplay} />
        </aside>
      </div>
    </div>
  );
}

function UpNext({ upNext, currentId, autoplay, setAutoplay }) {
  return (
    <div data-testid="up-next-column">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-wide">Urmează</h3>
        <label className="flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-widest text-[var(--mist)] cursor-pointer">
          Autoplay
          <input type="checkbox" checked={autoplay} data-testid="autoplay-toggle"
            onChange={(e) => { setAutoplay(e.target.checked); localStorage.setItem("bioxic_autoplay", e.target.checked ? "1" : "0"); }}
            className="accent-[#E8731A] w-4 h-4" />
        </label>
      </div>
      <div className="grid gap-3 mt-4">
        {upNext.map((v) => (
          <Link key={v.id} to={`/clipuri/${v.id}`} data-testid={`upnext-${v.id}`}
            className={`flex gap-3 rounded-xl p-2 border transition-colors ${v.id === currentId ? "border-[rgba(var(--accent-rgb),.5)]" : "border-transparent hover:border-[var(--line)] hover:bg-white/[0.03]"}`}>
            <div className="relative w-36 shrink-0">
              <video src={mediaUrl(v.video_url)} preload="metadata" muted playsInline className="w-full aspect-video rounded-lg object-cover bg-black" />
            </div>
            <div className="min-w-0 py-0.5">
              <p className="text-xs font-bold leading-snug line-clamp-2">{v.title}</p>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--mist)] mt-1.5">BIOXIC · {v.views || 0} vizualizări</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
