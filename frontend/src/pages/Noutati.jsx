import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Clapperboard, Music2, Sparkles, Megaphone, ArrowRight, Eye, Youtube, Instagram, AudioLines, BadgeCheck, Heart, MessageCircle, Tv } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import CeENou from "@/components/CeENou";
import StoryModal from "@/components/StoryModal";
import TvBroadcast from "@/components/TvBroadcast";
import TvGuide, { NextPremiereCard } from "@/components/TvGuide";

const PAYPAL_URL = "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=A8F6WTGW3RU94";
const DISCORD_URL = "https://discord.gg/jhCDSq7vqu";

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@djbioxic", icon: Youtube, tid: "bio-youtube" },
  { label: "TikTok", href: "https://www.tiktok.com/@bioxic.exe", icon: Music2, tid: "bio-tiktok" },
  { label: "Instagram", href: "https://www.instagram.com/crss.exe_", icon: Instagram, tid: "bio-instagram" },
  { label: "Spotify", href: "https://open.spotify.com/artist/4tlelg9L2y1OFOVpUkIiAK", icon: AudioLines, tid: "bio-spotify" },
];

function timeAgo(iso) {
  const t = Date.parse(iso || "");
  if (!t) return "";
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "acum";
  const m = Math.floor(s / 60);
  if (m < 60) return `acum ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `acum ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ieri";
  return `acum ${d} zile`;
}

// Prima pagină — hero cinematic cu transmisia TV live, countdown premieră, apoi secțiuni editoriale
export default function Noutati() {
  const [tracks, setTracks] = useState([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [ytVideos, setYtVideos] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
      api.get("/youtube/videos").catch(() => ({ data: [] })),
      api.get("/tv/schedule").catch(() => ({ data: [] })),
      fetch("/changelog.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([tr, vr, yt, sc, cl]) => {
      setTracks(tr.data || []);
      setVideos(vr.data || []);
      setYtVideos((yt.data || []).filter((v) => v.channel === "Everest Manele"));
      setSchedule(sc.data || []);
      if (cl?.changes?.length) setChanges([{ version: cl.version, built: cl.built, changes: cl.changes }]);
      setLoading(false);
    });
  }, []);

  // feed unificat, cel mai recent primul
  const feed = useMemo(() => {
    const items = [
      ...changes.map((c) => ({ kind: "anunt", date: c.built || "", id: `v${c.version}`, title: `Actualizare site · v${c.version}`, list: c.changes })),
      ...tracks.map((t) => ({ kind: "track", date: t.created_at, id: t.id, t })),
      ...videos.map((v) => ({ kind: "video", date: v.created_at, id: v.id, v })),
    ];
    return items.sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0)).slice(0, 20);
  }, [changes, tracks, videos]);

  // clipuri editoriale: întâi cele încărcate (playerul intern), apoi Everest Manele
  const editorial = useMemo(
    () => [
      ...videos.map((v) => ({ ...v, uploaded: true })),
      ...ytVideos.map((v) => ({ ...v, uploaded: false })),
    ],
    [videos, ytVideos]
  );
  const [featured, ...restClips] = editorial;
  const recentTracks = useMemo(() => tracks.slice(0, 8), [tracks]);

  return (
    <div data-testid="noutati-page" className="relative">
      {/* ============ HERO BROADCAST — transmisia TV live, piesa centrală a paginii ============ */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-8 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-5 rv">
          <div>
            <p className="sec-kicker"><Tv size={12} /> Everest Music · Emisiune continuă</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.04]">
              BIOXIC <span className="text-[var(--flame)]">TV</span> — live acum
            </h1>
            <p className="text-[var(--text-2)] text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
              Manele video non-stop, premiere care se aud întâi aici și chatul comunității — totul într-un singur loc.
            </p>
          </div>
          <span className="live-badge" data-testid="hero-live-badge">
            <span className="live-dot" /> În direct · 24/7
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 mt-8 rv">
          <TvBroadcast />
          <aside className="flex flex-col gap-5">
            <NextPremiereCard schedule={schedule} />
            <div className="ob-card p-6 flex-1 flex flex-col">
              <p className="sec-kicker">Susține emisiunea</p>
              <p className="text-sm text-[var(--text-2)] mt-3 leading-relaxed flex-1">
                Fiecare donație înseamnă o piesă nouă. Comunitatea e pe Discord, la o tastă distanță.
              </p>
              <div className="flex flex-col gap-2.5 mt-5">
                <a href={PAYPAL_URL} target="_blank" rel="noreferrer" className="btn-flame !h-11 w-full" data-testid="hero-paypal">
                  <Heart size={14} /> Donează · PayPal
                </a>
                <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn-steel !h-11 w-full" data-testid="hero-discord">
                  <MessageCircle size={14} /> Discord · BIOXIC House
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============ GHID TV SĂPTĂMÂNAL ============ */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20">
        <TvGuide schedule={schedule} />
      </section>

      {/* ============ CLIPURI — editorial, carduri mari ============ */}
      {editorial.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-clips">
          <div className="flex flex-wrap items-end justify-between gap-4 rv">
            <div>
              <p className="sec-kicker"><Clapperboard size={12} /> Videoclipuri</p>
              <h2 className="sec-title mt-2.5">Pe ecran, acum</h2>
            </div>
            <Link to="/clipuri" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="home-clips-all">
              Toate clipurile <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mt-7">
            {/* clipul principal — mare, cinematic */}
            {featured && (
              <Link
                to={featured.uploaded ? `/clipuri/${featured.id}` : "/clipuri"}
                className="ed-card group rv"
                data-testid={`home-clip-featured-${featured.id}`}
              >
                <span className="relative block aspect-video overflow-hidden bg-black">
                  <img
                    src={featured.uploaded ? mediaUrl(featured.thumb_url) || "/logo-alt.png" : featured.thumbnail}
                    alt={featured.title}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,6,11,.92)] via-transparent to-transparent" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="tv-bigplay-btn !w-16 !h-16"><Play size={22} fill="currentColor" className="ml-1" /></span>
                  </span>
                  <span className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <span className="ytc-badge !static">{featured.uploaded ? "BIOXIC" : "EVEREST"}</span>
                    <span className="block font-display text-lg sm:text-2xl leading-tight mt-2.5 line-clamp-2">{featured.title}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-2)] mt-2">
                      <Eye size={11} /> {featured.views || 0} vizualizări
                    </span>
                  </span>
                </span>
              </Link>
            )}
            {/* restul — grilă 2×2 */}
            <div className="grid sm:grid-cols-2 gap-5 content-start">
              {restClips.slice(0, 4).map((v, i) => (
                <Link
                  key={`${v.uploaded ? "up" : "yt"}-${v.id}`}
                  to={v.uploaded ? `/clipuri/${v.id}` : "/clipuri"}
                  className={`ed-card group rv rv-d${Math.min(i + 1, 3)}`}
                  data-testid={`home-clip-${v.id}`}
                >
                  <span className="relative block aspect-video overflow-hidden bg-black">
                    <img
                      src={v.uploaded ? mediaUrl(v.thumb_url) || "/logo-alt.png" : v.thumbnail}
                      alt={v.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,6,11,.85)] via-transparent to-transparent" />
                    <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="knob !w-11 !h-11" style={{ color: "var(--flame)" }}><Play size={15} fill="currentColor" /></span>
                    </span>
                    <span className="absolute bottom-0 left-0 right-0 p-3.5">
                      <span className="block text-[13px] font-semibold leading-snug line-clamp-2">{v.title}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ PIESE RECENTE — carduri cu cover mare, play instant ============ */}
      {recentTracks.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-16 sm:mt-20 cv-auto" data-testid="home-tracks">
          <div className="flex flex-wrap items-end justify-between gap-4 rv">
            <div>
              <p className="sec-kicker"><Music2 size={12} /> Proaspete din seif</p>
              <h2 className="sec-title mt-2.5">Piese recente</h2>
            </div>
            <Link to="/muzica" className="btn-ghost rounded-full px-5 py-2.5 text-[10px] font-mono-x uppercase tracking-widest inline-flex items-center gap-2" data-testid="home-tracks-all">
              Toată muzica <ArrowRight size={12} />
            </Link>
          </div>
          <div className="ytc-row mt-7" data-lenis-prevent>
            {recentTracks.map((t) => (
              <HomeTrackCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}

      {/* ============ BIO — deck oficial cu poză, badge verificat, socialuri ============ */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-16 sm:mt-24" data-testid="bio-section">
        <div className="artist-banner rv" data-testid="hero-banner">
          <img src="/artist.jpg" alt="BIOXIC — Everest Music" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="badge-engraved !text-[9px]">Artist oficial · Everest Music</p>
              <p className="font-display text-2xl sm:text-3xl mt-2">Sunet din seif.<br />Direct la oameni.</p>
            </div>
            <Link to="/contact" className="btn-steel !h-10 !px-5 !text-[10px]" data-testid="banner-contact-cta">Booking & Contact</Link>
          </div>
        </div>

        <div className="ob-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 rv mt-6" data-testid="bio-card">
          <img src="/artist.jpg" alt="BIOXIC" className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-[var(--edge-hi)] shrink-0" data-testid="bio-photo" />
          <div className="min-w-0 text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-2 font-display text-xl">
              Bioxic <BadgeCheck size={18} className="text-[var(--flame)]" aria-label="Cont verificat" data-testid="bio-verified" />
            </p>
            <p className="text-[10px] font-mono-x uppercase tracking-[0.2em] text-[var(--text-3)] mt-1.5">Cristi · 19 ani · Focșani · Producător</p>
            <p className="text-sm text-[var(--text-2)] leading-relaxed mt-3">
              BIOXIC — producător și artist independent (Everest Music). Remixuri, mashup-uri și manele direct din seif,
              cu colaborări alături de Nek Music, LuCash, AMMA, Big Up, Bogdan de la Ploiești, Costel Biju și Jador.
              Premierele se aud întâi aici, pe radioul live 24/7.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4" data-testid="bio-socials">
              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="knob knob-sm" aria-label={s.label} title={s.label} data-testid={s.tid}>
                    <Icon />
                  </a>
                );
              })}
              <button onClick={() => setStoryOpen(true)} className="knob knob-sm !w-auto !rounded-full px-4 text-[9px] font-mono-x uppercase tracking-[0.2em]" aria-label="Povestea site-ului" data-testid="hero-logo">
                Povestea
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* de la ultima vizită */}
      <CeENou />

      {/* ============ FEED DE NOUTĂȚI ============ */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-14 sm:mt-16" data-testid="news-feed">
        <header className="flex items-end justify-between gap-4 rv">
          <div>
            <p className="sec-kicker">Feed actualizat</p>
            <h2 className="sec-title mt-2.5">Ultimele mișcări</h2>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-3 mt-8">{[0, 1, 2].map((i) => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}</div>
        ) : feed.length === 0 ? (
          <div className="ob-card p-14 text-center mt-8" data-testid="news-empty">
            <Megaphone size={30} className="mx-auto text-[var(--flame)] mb-4" />
            <p className="font-display text-xl">Nicio noutate încă</p>
            <p className="text-[var(--text-2)] text-sm mt-2">Primul anunț apare în curând.</p>
          </div>
        ) : (
          <div className="grid gap-3.5 mt-8">
            {feed.map((it, i) => (
              <FeedRow key={`${it.kind}-${it.id}`} it={it} i={i} />
            ))}
          </div>
        )}
      </section>

      {/* ============ linkuri rapide ============ */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 mt-14 sm:mt-16 cv-auto">
        <div className="grid sm:grid-cols-2 gap-5">
          <Link to="/muzica" className="ob-card track-card p-6 flex items-center gap-5 rv" data-testid="news-go-muzica">
            <span className="knob !w-14 !h-14 shrink-0" style={{ color: "var(--flame)" }}><Music2 size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg">Muzică & Radio</span>
              <span className="block text-xs text-[var(--text-2)] mt-1">Discografia completă + radioul live 24/7.</span>
            </span>
            <ArrowRight size={16} className="text-[var(--text-3)]" />
          </Link>
          <Link to="/clipuri" className="ob-card track-card p-6 flex items-center gap-5 rv rv-d1" data-testid="news-go-video">
            <span className="knob !w-14 !h-14 shrink-0" style={{ color: "var(--flame)" }}><Clapperboard size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg">Video</span>
              <span className="block text-xs text-[var(--text-2)] mt-1">Clipurile oficiale, în playerul nostru.</span>
            </span>
            <ArrowRight size={16} className="text-[var(--text-3)]" />
          </Link>
        </div>
      </section>

      {storyOpen && <StoryModal onClose={() => setStoryOpen(false)} />}
    </div>
  );
}

// card de piesă pentru banda orizontală de pe prima pagină — cover mare, play instant
function HomeTrackCard({ t }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const isCurrent = current?.id === t.id && mode === "track";
  const isPlayingThis = isCurrent && playing;
  return (
    <button
      onClick={() => (isCurrent ? toggle() : playTrack(t))}
      className="ytc-card ed-card group !flex-none text-left"
      data-testid={`home-track-${t.id}`}
      aria-label={`Redă ${t.title}`}
    >
      <span className="relative block aspect-square overflow-hidden bg-black rounded-t-[22px]">
        <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt={t.title} loading="lazy" className={`w-full h-full ${t.cover_url ? "object-cover" : "object-contain p-8"}`} />
        <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "rgba(4,6,11,.4)" }}>
          <span className="tv-bigplay-btn !w-14 !h-14">
            {isPlayingThis ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </span>
        </span>
        {isPlayingThis && (
          <span className="absolute top-3 right-3 st-pill st-now"><span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" /> Cântă</span>
        )}
      </span>
      <span className="block p-4">
        <span className="block text-sm font-semibold truncate">{t.title}</span>
        <span className="block text-[9.5px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-3)] mt-1.5 truncate">{t.artist || "BIOXIC"}</span>
      </span>
    </button>
  );
}

function FeedRow({ it, i }) {
  const { playTrack } = useRadio();
  const delay = i ? `rv-d${Math.min(i, 3)}` : "";

  if (it.kind === "anunt") {
    return (
      <article className={`ob-card p-5 sm:p-6 rv ${delay}`} data-testid={`news-anunt-${it.id}`}>
        <div className="flex items-center gap-2.5 text-[var(--flame)]">
          <Sparkles size={14} />
          <p className="text-[10px] font-mono-x uppercase tracking-[0.22em]">Anunț · {timeAgo(it.date) || "recent"}</p>
        </div>
        <h3 className="font-display text-lg mt-2">{it.title}</h3>
        <ul className="mt-2.5 space-y-1.5">
          {it.list.slice(0, 4).map((c) => (
            <li key={c} className="text-sm text-[var(--text-2)] flex gap-2"><span className="text-[var(--flame)]">·</span>{c}</li>
          ))}
        </ul>
      </article>
    );
  }

  if (it.kind === "track") {
    const t = it.t;
    return (
      <article className={`ob-card track-card p-4 flex items-center gap-4 rv ${delay}`} data-testid={`news-track-${t.id}`}>
        <button
          onClick={() => playTrack(t)}
          className="relative shrink-0 group rounded-xl overflow-hidden border border-[var(--edge)]"
          aria-label={`Redă ${t.title}`}
          data-testid={`news-track-play-${t.id}`}
        >
          <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt={t.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={18} fill="var(--flame)" color="var(--flame)" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono-x uppercase tracking-[0.22em] text-[var(--flame)]">Piesă nouă · {timeAgo(it.date)}</p>
          <h3 className="font-semibold text-sm sm:text-base truncate mt-1">{t.title}</h3>
          <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-0.5">{t.artist || "BIOXIC"}</p>
        </div>
        <Link to="/muzica" className="btn-ghost rounded-full px-4 py-2 text-[10px] font-mono-x uppercase tracking-widest hidden sm:flex items-center gap-2 shrink-0">
          Muzică <ArrowRight size={11} />
        </Link>
      </article>
    );
  }

  const v = it.v;
  return (
    <Link to={`/clipuri/${v.id}`} className={`ob-card track-card p-4 flex items-center gap-4 rv ${delay}`} data-testid={`news-video-${v.id}`}>
      <span className="relative shrink-0 rounded-xl overflow-hidden border border-[var(--edge)]">
        <img src={mediaUrl(v.thumb_url) || "/logo-alt.png"} alt={v.title} className="w-28 sm:w-36 aspect-video object-cover" loading="lazy" />
        <span className="absolute inset-0 grid place-items-center bg-black/30">
          <Play size={18} fill="#fff" color="#fff" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-mono-x uppercase tracking-[0.22em] text-[var(--flame)]">Clip nou · {timeAgo(it.date)}</span>
        <span className="block font-semibold text-sm sm:text-base leading-snug line-clamp-2 mt-1">{v.title}</span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-1">
          <Eye size={10} /> {v.views || 0} vizualizări
        </span>
      </span>
    </Link>
  );
}
